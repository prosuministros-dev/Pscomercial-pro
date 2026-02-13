import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/quotes/[id]/items
 * Get all items for a quote
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const quoteId = params.id;

    // Verify quote ownership
    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .select('id, organization_id')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Get quote items
    const { data: items, error: itemsError } = await client
      .from('quote_items')
      .select(
        `
        *,
        product:products(
          id,
          sku,
          name,
          brand,
          category_id
        )
      `
      )
      .eq('quote_id', quoteId)
      .order('sort_order', { ascending: true });

    if (itemsError) {
      console.error('Error fetching quote items:', itemsError);
      return NextResponse.json(
        { error: 'Error al obtener los items de la cotización' },
        { status: 500 }
      );
    }

    return NextResponse.json(items || []);
  } catch (error) {
    console.error('Error in GET /api/quotes/[id]/items:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotes/[id]/items
 * Add a new item to a quote
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const quoteId = params.id;
    const body = await request.json();

    // Verify quote ownership
    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .select('id, organization_id, status')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Don't allow adding items to approved/rejected quotes
    if (['approved', 'rejected', 'lost'].includes(quote.status)) {
      return NextResponse.json(
        {
          error:
            'No se pueden agregar items a una cotización aprobada, rechazada o perdida',
        },
        { status: 400 }
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

    // Calculate item totals
    const quantity = body.quantity || 1;
    const unitPrice = body.unit_price || 0;
    const discountPct = body.discount_pct || 0;
    const taxPct = body.tax_pct || 19;
    const costPrice = body.cost_price || 0;

    const discountAmount = (unitPrice * quantity * discountPct) / 100;
    const subtotal = unitPrice * quantity - discountAmount;
    const taxAmount = (subtotal * taxPct) / 100;
    const total = subtotal + taxAmount;

    // Calculate margin: (Precio venta - Costo) / Precio venta * 100
    const marginPct =
      unitPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

    // Create item
    const { data: item, error: insertError } = await client
      .from('quote_items')
      .insert({
        quote_id: quoteId,
        product_id: body.product_id,
        sort_order: body.sort_order || nextOrder,
        sku: body.sku,
        description: body.description,
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
        notes: body.notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating quote item:', insertError);
      return NextResponse.json(
        { error: 'Error al crear el item de la cotización' },
        { status: 500 }
      );
    }

    // Trigger will automatically recalculate quote totals
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quotes/[id]/items:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quotes/[id]/items
 * Update a quote item
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const quoteId = params.id;
    const body = await request.json();

    if (!body.item_id) {
      return NextResponse.json(
        { error: 'ID del item es requerido' },
        { status: 400 }
      );
    }

    // Verify quote ownership and item belongs to quote
    const { data: item, error: itemError } = await client
      .from('quote_items')
      .select(
        `
        *,
        quote:quotes!inner(id, organization_id, status)
      `
      )
      .eq('id', body.item_id)
      .eq('quote_id', quoteId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (item.quote.organization_id !== user.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Don't allow editing items in approved/rejected quotes
    if (['approved', 'rejected', 'lost'].includes(item.quote.status)) {
      return NextResponse.json(
        {
          error:
            'No se pueden editar items de una cotización aprobada, rechazada o perdida',
        },
        { status: 400 }
      );
    }

    // Calculate item totals
    const quantity = body.quantity ?? item.quantity;
    const unitPrice = body.unit_price ?? item.unit_price;
    const discountPct = body.discount_pct ?? item.discount_pct;
    const taxPct = body.tax_pct ?? item.tax_pct;
    const costPrice = body.cost_price ?? item.cost_price;

    const discountAmount = (unitPrice * quantity * discountPct) / 100;
    const subtotal = unitPrice * quantity - discountAmount;
    const taxAmount = (subtotal * taxPct) / 100;
    const total = subtotal + taxAmount;

    // Calculate margin
    const marginPct =
      unitPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

    // Update item
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

    // Allow updating other fields
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data: updatedItem, error: updateError } = await client
      .from('quote_items')
      .update(updateData)
      .eq('id', body.item_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating quote item:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el item' },
        { status: 500 }
      );
    }

    // Trigger will automatically recalculate quote totals
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error in PUT /api/quotes/[id]/items:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quotes/[id]/items
 * Delete a quote item
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const quoteId = params.id;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'ID del item es requerido' },
        { status: 400 }
      );
    }

    // Verify quote ownership and item belongs to quote
    const { data: item, error: itemError } = await client
      .from('quote_items')
      .select(
        `
        *,
        quote:quotes!inner(id, organization_id, status)
      `
      )
      .eq('id', itemId)
      .eq('quote_id', quoteId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    if (item.quote.organization_id !== user.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Don't allow deleting items from approved/rejected quotes
    if (['approved', 'rejected', 'lost'].includes(item.quote.status)) {
      return NextResponse.json(
        {
          error:
            'No se pueden eliminar items de una cotización aprobada, rechazada o perdida',
        },
        { status: 400 }
      );
    }

    // Delete item
    const { error: deleteError } = await client
      .from('quote_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting quote item:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el item' },
        { status: 500 }
      );
    }

    // Trigger will automatically recalculate quote totals
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/quotes/[id]/items:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}
