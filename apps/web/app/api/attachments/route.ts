import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * POST /api/attachments
 * Upload a file to Supabase Storage
 * Form data: file (File), entity_type, entity_id, bucket (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const entityType = formData.get('entity_type') as string;
    const entityId = formData.get('entity_id') as string;
    const bucket = (formData.get('bucket') as string) || 'documents';

    if (!file || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'file, entity_type y entity_id son requeridos' },
        { status: 400 }
      );
    }

    // Validate file size (25MB max for documents)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo no puede exceder 25MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Permitidos: PDF, imágenes, Excel, Word' },
        { status: 400 }
      );
    }

    // Generate file path
    const ext = file.name.split('.').pop() || 'bin';
    const uniqueId = crypto.randomUUID();
    const filePath = `${user.organization_id}/${entityType}/${entityId}/${uniqueId}.${ext}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await client.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir el archivo' },
        { status: 500 }
      );
    }

    // Get public/signed URL
    const { data: urlData } = await client.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // 1 hour validity

    return NextResponse.json({
      data: {
        path: uploadData.path,
        url: urlData?.signedUrl || null,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        bucket,
        entity_type: entityType,
        entity_id: entityId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/attachments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/attachments
 * List attachments for an entity
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const bucket = searchParams.get('bucket') || 'documents';

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entity_type y entity_id son requeridos' },
        { status: 400 }
      );
    }

    const folderPath = `${user.organization_id}/${entityType}/${entityId}`;

    const { data: files, error } = await client.storage
      .from(bucket)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        const path = `${folderPath}/${file.name}`;
        const { data: urlData } = await client.storage
          .from(bucket)
          .createSignedUrl(path, 3600);
        return {
          ...file,
          url: urlData?.signedUrl || null,
          path,
        };
      })
    );

    return NextResponse.json({ data: filesWithUrls });
  } catch (error) {
    console.error('Error in GET /api/attachments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/attachments
 * Delete a file from storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'documents';

    if (!path) {
      return NextResponse.json({ error: 'path es requerido' }, { status: 400 });
    }

    // Verify the path belongs to the user's organization
    if (!path.startsWith(user.organization_id)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error } = await client.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/attachments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
