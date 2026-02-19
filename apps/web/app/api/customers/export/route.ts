import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/customers/export
 * Export customers to CSV with streaming for anti-timeout
 * Permission required: customers:export
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:export');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para exportar clientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = client
      .from('customers')
      .select('business_name, nit, city, department, phone, email, payment_terms, status, assigned_advisor:profiles!customers_assigned_sales_rep_id_fkey(full_name), created_at, last_interaction_at')
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('business_name', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error exporting customers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV using streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // CSV Header
        controller.enqueue(
          encoder.encode('Razón Social,NIT,Ciudad,Departamento,Teléfono,Email,Forma de Pago,Estado,Asesor Asignado,Fecha Creación,Última Interacción\n')
        );

        // CSV Rows
        for (const row of data || []) {
          const advisorName = (row as Record<string, unknown>).assigned_advisor
            ? ((row as Record<string, unknown>).assigned_advisor as Record<string, string>).full_name
            : '';
          const line = [
            csvEscape(row.business_name),
            csvEscape(row.nit),
            csvEscape(row.city || ''),
            csvEscape(row.department || ''),
            csvEscape(row.phone || ''),
            csvEscape(row.email || ''),
            csvEscape(row.payment_terms || ''),
            csvEscape(row.status || ''),
            csvEscape(advisorName || ''),
            csvEscape(row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : ''),
            csvEscape(row.last_interaction_at ? new Date(row.last_interaction_at).toLocaleDateString('es-CO') : ''),
          ].join(',');
          controller.enqueue(encoder.encode(line + '\n'));
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clientes-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/customers/export');
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
