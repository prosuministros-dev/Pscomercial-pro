import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

// --- Zod Schemas ---
const createProductSchema = z.object({
  sku: z.string().min(1, 'sku es requerido'),
  name: z.string().min(1, 'name es requerido'),
  description: z.string().nullish(),
  category_id: z.string().uuid().nullish(),
  brand: z.string().nullish(),
  unit_cost_usd: z.number().min(0).optional().default(0),
  unit_cost_cop: z.number().min(0).optional().default(0),
  suggested_price_cop: z.number().min(0).nullish(),
  currency: z.string().optional().default('COP'),
  is_service: z.boolean().optional().default(false),
  is_license: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

const updateProductSchema = z.object({
  id: z.string().uuid('id debe ser un UUID válido'),
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullish(),
  category_id: z.string().uuid().nullish(),
  brand: z.string().nullish(),
  unit_cost_usd: z.number().min(0).optional(),
  unit_cost_cop: z.number().min(0).optional(),
  suggested_price_cop: z.number().min(0).nullish(),
  currency: z.string().optional(),
  is_service: z.boolean().optional(),
  is_license: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/products
 * Lista paginada de productos con filtros opcionales
 * Permission required: products:read
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'products:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver productos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minimal = searchParams.get('minimal') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || (minimal ? '20' : '10'));
    const search = searchParams.get('search') || '';
    const category_id = searchParams.get('category_id');
    const is_active = searchParams.get('is_active');

    const offset = (page - 1) * limit;

    // Modo minimal: solo campos necesarios para selector, siempre activos, sin paginación pesada
    if (minimal) {
      let minimalQuery = client
        .from('products')
        .select('id, sku, name, unit_cost_usd, unit_cost_cop, suggested_price_cop, currency, is_service, is_license')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(limit);

      if (search) {
        minimalQuery = minimalQuery.or(`sku.ilike.%${search}%,name.ilike.%${search}%`);
      }
      if (category_id) {
        minimalQuery = minimalQuery.eq('category_id', category_id);
      }

      const { data: minimalData, error: minimalError } = await minimalQuery;

      if (minimalError) {
        console.error('Error fetching products (minimal):', minimalError);
        return NextResponse.json({ error: minimalError.message }, { status: 500 });
      }

      return NextResponse.json({ data: minimalData });
    }

    let query = client
      .from('products')
      .select('*, product_categories(id, name, slug)', { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    return handleApiError(error, 'GET /api/products');
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

    const allowed = await checkPermission(user.id, 'products:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear productos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const {
      sku, name, description, category_id, brand,
      unit_cost_usd, unit_cost_cop, suggested_price_cop,
      currency, is_service, is_license, is_active,
    } = parsed.data;

    // Verificar SKU único en la organización
    const { data: existing, error: checkError } = await client
      .from('products')
      .select('id')
      .eq('organization_id', user.organization_id)
      .eq('sku', sku)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking SKU uniqueness:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este SKU en la organización' },
        { status: 409 },
      );
    }

    const { data, error } = await client
      .from('products')
      .insert({
        organization_id: user.organization_id,
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
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      if (error.code === '23505') {
        return NextResponse.json({ error: 'SKU ya existe en la organización' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/products');
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

    const allowed = await checkPermission(user.id, 'products:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar productos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const {
      id, sku, name, description, category_id, brand,
      unit_cost_usd, unit_cost_cop, suggested_price_cop,
      currency, is_service, is_license, is_active,
    } = parsed.data;

    const { data: existing, error: checkError } = await client
      .from('products')
      .select('id, sku')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (sku && sku !== existing.sku) {
      const { data: skuExists, error: skuCheckError } = await client
        .from('products')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('sku', sku)
        .single();

      if (skuCheckError && skuCheckError.code !== 'PGRST116') {
        console.error('Error checking SKU uniqueness:', skuCheckError);
        return NextResponse.json({ error: skuCheckError.message }, { status: 500 });
      }

      if (skuExists) {
        return NextResponse.json(
          { error: 'Ya existe otro producto con este SKU en la organización' },
          { status: 409 },
        );
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
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
      if (error.code === '23505') {
        return NextResponse.json({ error: 'SKU ya existe en la organización' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, 'PUT /api/products');
  }
}
