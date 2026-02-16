import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

const updateLicenseSchema = z.object({
  status: z.string().optional(),
  license_key: z.string().optional(),
  activation_date: z.string().optional(),
  expiry_date: z.string().optional(),
  renewal_date: z.string().optional(),
  seats: z.number().int().positive().optional(),
  end_user_name: z.string().optional(),
  end_user_email: z.string().email('Email inválido').optional().or(z.literal('')),
  activation_notes: z.string().optional(),
  vendor: z.string().optional(),
});

/**
 * GET /api/licenses/[id]
 * Get license detail
 * Permission: licenses:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: licenseId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'licenses:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data, error } = await client
      .from('license_records')
      .select('*')
      .eq('id', licenseId)
      .eq('organization_id', user.organization_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Licencia no encontrada' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/licenses/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/licenses/[id]
 * Update license (activate, renew, update info)
 * Permission: licenses:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: licenseId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'licenses:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar licencias' }, { status: 403 });
    }

    // Verify license belongs to org
    const { data: existing, error: fetchError } = await client
      .from('license_records')
      .select('*')
      .eq('id', licenseId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Licencia no encontrada' }, { status: 404 });
    }

    const body = await request.json();

    // Handle renewal: create a new license linked to the old one
    if (body.action === 'renew') {
      const { license_key, activation_date, expiry_date, seats, activation_notes } = body;

      // Mark current license as renewed
      await client
        .from('license_records')
        .update({ status: 'renewed', renewal_date: new Date().toISOString() })
        .eq('id', licenseId);

      // Create new license linked to old one
      const { data: newLicense, error: createError } = await client
        .from('license_records')
        .insert({
          organization_id: existing.organization_id,
          order_id: existing.order_id,
          order_item_id: existing.order_item_id,
          product_id: existing.product_id,
          license_type: existing.license_type,
          vendor: existing.vendor,
          license_key: license_key || existing.license_key,
          activation_date: activation_date || new Date().toISOString().split('T')[0],
          expiry_date: expiry_date || null,
          seats: seats || existing.seats,
          status: license_key ? 'active' : 'pending',
          end_user_name: existing.end_user_name,
          end_user_email: existing.end_user_email,
          activation_notes: activation_notes || null,
          previous_license_id: licenseId,
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating renewal:', createError);
        return NextResponse.json({ error: 'Error al renovar licencia' }, { status: 500 });
      }

      return NextResponse.json(newLicense, { status: 201 });
    }

    const parsed = updateLicenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Datos inválidos' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.license_key) updates.license_key = parsed.data.license_key;
    if (parsed.data.activation_date) updates.activation_date = parsed.data.activation_date;
    if (parsed.data.expiry_date) updates.expiry_date = parsed.data.expiry_date;
    if (parsed.data.renewal_date) updates.renewal_date = parsed.data.renewal_date;
    if (parsed.data.seats) updates.seats = parsed.data.seats;
    if (parsed.data.end_user_name) updates.end_user_name = parsed.data.end_user_name;
    if (parsed.data.end_user_email !== undefined) updates.end_user_email = parsed.data.end_user_email || null;
    if (parsed.data.activation_notes) updates.activation_notes = parsed.data.activation_notes;
    if (parsed.data.vendor) updates.vendor = parsed.data.vendor;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const { error: updateError } = await client
      .from('license_records')
      .update(updates)
      .eq('id', licenseId);

    if (updateError) {
      console.error('Error updating license:', updateError);
      return NextResponse.json({ error: 'Error al actualizar licencia' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/licenses/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
