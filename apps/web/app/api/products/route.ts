import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/products
 * Lista paginada de productos con filtros opcionales
 * Permission required: products:read
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('products:read')
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category_id = searchParams.get('category_id');
    const is_active = searchParams.get('is_active');

    const offset = (page - 1) * limit;

    let query = client
      .from('products')
      .select('*, product_categories(id, name, slug)', { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros opcionales
    if (search) {
      query = query.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
    }
    
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    
    if (is_active !== null && is_active !== undefined && is_active !== '') {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Crear nuevo producto
 * Permission required: products:create
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('products:create')

    const body = await request.json();
    const {
      sku,
      name,
      description,
      category_id,
      brand,
      unit_cost_usd,
      unit_cost_cop,
      suggested_price_cop,
      currency,
      is_service,
      is_license,
      is_active,
    } = body;

    // Validaciones basicas
    if (!sku || !name) {
      return NextResponse.json(
        { error: 'sku y name son campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar SKU unico en la organizacion
    const { data: existing, error: checkError } = await client
      .from('products')
      .select('id')
      .eq('organization_id', user.organization_id)
      .eq('sku', sku)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking SKU uniqueness:', checkError);
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este SKU en la organizacion' },
        { status: 409 }
      );
    }

    // Crear el producto
    const { data, error } = await client
      .from('products')
      .insert({
        organization_id: user.organization_id,
        sku,
        name,
        description,
        category_id,
        brand,
        unit_cost_usd: unit_cost_usd || 0,
        unit_cost_cop: unit_cost_cop || 0,
        suggested_price_cop,
        currency: currency || 'COP',
        is_service: is_service || false,
        is_license: is_license || false,
        is_active: is_active !== undefined ? is_active : true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      
      // Manejo especifico de error de UNIQUE constraint
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'SKU ya existe en la organizacion' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products
 * Actualizar producto existente
 * Permission required: products:update
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('products:update')
    // Segun permisos: Gerencia General puede modificar todo
    // Gerencia Comercial y Comerciales solo pueden crear (no modificar)

    const body = await request.json();
    const {
      id,
      sku,
      name,
      description,
      category_id,
      brand,
      unit_cost_usd,
      unit_cost_cop,
      suggested_price_cop,
      currency,
      is_service,
      is_license,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido para actualizar' },
        { status: 400 }
      );
    }

    // Verificar que el producto pertenece a la organizacion
    const { data: existing, error: checkError } = await client
      .from('products')
      .select('id, sku')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Si se esta cambiando el SKU, verificar que sea unico
    if (sku && sku !== existing.sku) {
      const { data: skuExists, error: skuCheckError } = await client
        .from('products')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('sku', sku)
        .single();

      if (skuCheckError && skuCheckError.code !== 'PGRST116') {
        console.error('Error checking SKU uniqueness:', skuCheckError);
        return NextResponse.json(
          { error: skuCheckError.message },
          { status: 500 }
        );
      }

      if (skuExists) {
        return NextResponse.json(
          { error: 'Ya existe otro producto con este SKU en la organizacion' },
          { status: 409 }
        );
      }
    }

    // Actualizar el producto
    const updateData: any = { updated_at: new Date().toISOString() };
    if (sku !== undefined) updateData.sku = sku;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (brand !== undefined) updateData.brand = brand;
    if (unit_cost_usd !== undefined) updateData.unit_cost_usd = unit_cost_usd;
    if (unit_cost_cop !== undefined) updateData.unit_cost_cop = unit_cost_cop;
    if (suggested_price_cop !== undefined) updateData.suggested_price_cop = suggested_price_cop;
    if (currency !== undefined) updateData.currency = currency;
    if (is_service !== undefined) updateData.is_service = is_service;
    if (is_license !== undefined) updateData.is_license = is_license;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await client
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      
      // Manejo especifico de error de UNIQUE constraint
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'SKU ya existe en la organizacion' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
