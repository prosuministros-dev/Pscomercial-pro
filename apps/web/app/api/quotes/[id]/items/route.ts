import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schemas ---
const createItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  sort_order: z.number().int().optional(),
  sku: z.string().nullish(),
  description: z.string().nullish(),
  quantity: z.number().min(0).optional().default(1),
  unit_price: z.number().min(0).optional().default(0),
  discount_pct: z.number().min(0).max(100).optional().default(0),
  tax_pct: z.number().min(0).optional().default(19),
  cost_price: z.number().min(0).optional().default(0),
  notes: z.string().nullish(),
});

const updateItemSchema = z.object({
  item_id: z.string().uuid('ID del item es requerido'),
  quantity: z.number().min(0).optional(),
  unit_price: z.number().min(0).optional(),
  discount_pct: z.number().min(0).max(100).optional(),
  tax_pct: z.number().min(0).optional(),
  cost_price: z.number().min(0).optional(),
  sku: z.string().nullish(),
  description: z.string().nullish(),
  sort_order: z.number().int().optional(),
  notes: z.string().nullish(),
});

/**
 * GET /api/quotes/[id]/items
 * Get all items for a quote
 * Permission required: quotes:read
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver items de cotización' }, { status: 403 });
    }

    const quoteId = params.id;

    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .select('id, organization_id')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    const { data: items, error: itemsError } = await client
      .from('quote_items')
      .select(`
        *,
        product:products(id, sku, name, brand, category_id)
      `)
      .eq('quote_id', quoteId)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching quote items:', itemsError);
      return NextResponse.json({ error: 'Error al obtener los items de la cotización' }, { status: 500 });
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error in GET /api/quotes/[id]/items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/quotes/[id]/items
 * Add a new item to a quote
 * Permission required: quotes:manage_items
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:manage_items');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar items de cotización' }, { status: 403 });
    }

    const quoteId = params.id;
    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify quote ownership
    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .select('id, organization_id, status')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (['approved', 'rejected', 'lost'].includes(quote.status)) {
      return NextResponse.json(
        { error: 'No se pueden agregar items a una cotización aprobada, rechazada o perdida' },
        { status: 400 },
      );
    }

    // Get next sort_order
    const { data: maxOrder } = await client
      .from('quote_items')
      .select('sort_order')
      .eq('quote_id', quoteId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.sort_order || 0) + 1;

    const { quantity, unit_price: unitPrice, discount_pct: discountPct, tax_pct: taxPct, cost_price: costPrice } = parsed.data;

    const discountAmount = (unitPrice * quantity * discountPct) / 100;
    const subtotal = unitPrice * quantity - discountAmount;
    const taxAmount = (subtotal * taxPct) / 100;
    const total = subtotal + taxAmount;
    const marginPct = unitPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

    const { data: item, error: insertError } = await client
      .from('quote_items')
      .insert({
        quote_id: quoteId,
        product_id: parsed.data.product_id,
        sort_order: parsed.data.sort_order || nextOrder,
        sku: parsed.data.sku,
        description: parsed.data.description,
        quantity,
        unit_price: unitPrice,
        discount_pct: discountPct,
        discount_amount: discountAmount,
        tax_pct: taxPct,
        tax_amount: taxAmount,
        subtotal,
        total,
        cost_price: costPrice,
        margin_pct: marginPct,
        notes: parsed.data.notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating quote item:', insertError);
      return NextResponse.json({ error: 'Error al crear el item de la cotización' }, { status: 500 });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quotes/[id]/items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/quotes/[id]/items
 * Update a quote item
 * Permission required: quotes:manage_items
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:manage_items');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar items de cotización' }, { status: 403 });
    }

    const quoteId = params.id;
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify quote ownership and item belongs to quote
    const { data: item, error: itemError } = await client
      .from('quote_items')
      .select(`
        *,
        quote:quotes!inner(id, organization_id, status)
      `)
      .eq('id', parsed.data.item_id)
      .eq('quote_id', quoteId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (item.quote.organization_id !== user.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (['approved', 'rejected', 'lost'].includes(item.quote.status)) {
      return NextResponse.json(
        { error: 'No se pueden editar items de una cotización aprobada, rechazada o perdida' },
        { status: 400 },
      );
    }

    const quantity = parsed.data.quantity ?? item.quantity;
    const unitPrice = parsed.data.unit_price ?? item.unit_price;
    const discountPct = parsed.data.discount_pct ?? item.discount_pct;
    const taxPct = parsed.data.tax_pct ?? item.tax_pct;
    const costPrice = parsed.data.cost_price ?? item.cost_price;

    const discountAmount = (unitPrice * quantity * discountPct) / 100;
    const subtotal = unitPrice * quantity - discountAmount;
    const taxAmount = (subtotal * taxPct) / 100;
    const total = subtotal + taxAmount;
    const marginPct = unitPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

    const updateData: Record<string, unknown> = {
      quantity,
      unit_price: unitPrice,
      discount_pct: discountPct,
      discount_amount: discountAmount,
      tax_pct: taxPct,
      tax_amount: taxAmount,
      subtotal,
      total,
      cost_price: costPrice,
      margin_pct: marginPct,
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.sku !== undefined) updateData.sku = parsed.data.sku;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.sort_order !== undefined) updateData.sort_order = parsed.data.sort_order;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const { data: updatedItem, error: updateError } = await client
      .from('quote_items')
      .update(updateData)
      .eq('id', parsed.data.item_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating quote item:', updateError);
      return NextResponse.json({ error: 'Error al actualizar el item' }, { status: 500 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error in PUT /api/quotes/[id]/items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/quotes/[id]/items
 * Delete a quote item
 * Permission required: quotes:manage_items
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:manage_items');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar items de cotización' }, { status: 403 });
    }

    const quoteId = params.id;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json({ error: 'ID del item es requerido' }, { status: 400 });
    }

    const { data: item, error: itemError } = await client
      .from('quote_items')
      .select(`
        *,
        quote:quotes!inner(id, organization_id, status)
      `)
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (item.quote.organization_id !== user.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (['approved', 'rejected', 'lost'].includes(item.quote.status)) {
      return NextResponse.json(
        { error: 'No se pueden eliminar items de una cotización aprobada, rechazada o perdida' },
        { status: 400 },
      );
    }

    const { error: deleteError } = await client
      .from('quote_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting quote item:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar el item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/quotes/[id]/items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
