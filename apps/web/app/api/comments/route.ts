import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

// --- Zod Schemas ---
const createCommentSchema = z.object({
  entity_type: z.enum(['lead', 'quote', 'customer', 'order'], { message: 'entity_type inválido' }),
  entity_id: z.string().uuid('entity_id debe ser UUID válido'),
  content: z.string().min(1, 'content es requerido').max(5000, 'El comentario no puede exceder 5000 caracteres'),
  mentions: z.array(z.string().uuid()).optional().default([]),
});

/**
 * Map entity_type to the permission needed to comment on it
 */
function getCommentPermission(entityType: string): string {
  switch (entityType) {
    case 'lead': return 'leads:comment';
    case 'quote': return 'quotes:read';
    case 'customer': return 'customers:read';
    default: return 'leads:read';
  }
}

/**
 * GET /api/comments
 * Get comments for an entity
 * Query params: entity_type, entity_id
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entity_type y entity_id son requeridos' },
        { status: 400 },
      );
    }

    // Check read permission for the entity type
    const permission = getCommentPermission(entityType);
    const allowed = await checkPermission(user.id, permission);
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver comentarios' }, { status: 403 });
    }

    const { data, error } = await client
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('organization_id', user.organization_id)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return handleApiError(error, 'GET /api/comments');
  }
}

/**
 * POST /api/comments
 * Create a comment with optional @mentions
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { entity_type, entity_id, content, mentions } = parsed.data;

    // Check permission for the entity type
    const permission = getCommentPermission(entity_type);
    const allowed = await checkPermission(user.id, permission);
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para comentar' }, { status: 403 });
    }

    const { data: comment, error } = await client
      .from('comments')
      .insert({
        organization_id: user.organization_id,
        entity_type,
        entity_id,
        author_id: user.id,
        content,
        mentions,
      })
      .select(`
        *,
        author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      const mentionContent = content.substring(0, 200);
      const entityRoute = entity_type === 'lead' ? 'leads' : entity_type === 'quote' ? 'quotes' : `${entity_type}s`;
      const notifications = mentions.map((userId: string) => ({
        organization_id: user.organization_id,
        user_id: userId,
        type: 'mention',
        title: 'Te mencionaron en un comentario',
        message: `${user.email || 'Usuario'} te mencionó: "${mentionContent}${content.length > 200 ? '...' : ''}"`,
        entity_type,
        entity_id,
        action_url: `/home/${entityRoute}`,
        priority: 'normal',
      }));

      try {
        await client.from('notifications').insert(notifications);
      } catch (notifError) {
        console.error('Error creating mention notifications:', notifError);
      }
    }

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/comments');
  }
}

/**
 * DELETE /api/comments
 * Soft delete a comment (only author can delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const { data: existing, error: checkError } = await client
      .from('comments')
      .select('id, author_id')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    if (existing.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Solo el autor puede eliminar el comentario' },
        { status: 403 },
      );
    }

    const { error } = await client
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/comments');
  }
}
