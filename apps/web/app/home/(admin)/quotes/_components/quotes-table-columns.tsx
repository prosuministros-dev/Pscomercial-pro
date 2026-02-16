'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { MoreHorizontal, Shield, FileText, ShoppingCart, Eye } from 'lucide-react';
import type { Quote } from '../_lib/types';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  offer_created: { label: 'Oferta Creada', variant: 'outline' },
  negotiation: { label: 'En Negociación', variant: 'default' },
  risk: { label: 'Riesgo', variant: 'destructive' },
  pending_approval: { label: 'Pend. Aprobación', variant: 'outline' },
  pending_oc: { label: 'Pendiente OC', variant: 'outline' },
  approved: { label: 'Aprobada', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  lost: { label: 'Perdida', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'secondary' },
};

// Event types for actions — handled by parent component
export type QuoteAction =
  | { type: 'view'; quote: Quote }
  | { type: 'approve-margin'; quote: Quote }
  | { type: 'generate-pdf'; quote: Quote }
  | { type: 'create-order'; quote: Quote };

export function createQuotesTableColumns(
  onAction: (action: QuoteAction) => void,
): ColumnDef<Quote>[] {
  return [
    {
      accessorKey: 'quote_number',
      header: '# Cotización',
      cell: ({ row }) => (
        <span className="font-mono font-medium">#{row.getValue('quote_number')}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => {
        const customer = row.original.customer;
        if (!customer) return <span className="text-gray-400">N/A</span>;
        return (
          <div>
            <div className="font-medium">{customer.business_name}</div>
            {customer.nit && <div className="text-xs text-gray-500">NIT: {customer.nit}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'advisor',
      header: 'Asesor',
      cell: ({ row }) => {
        const advisor = row.original.advisor;
        if (!advisor) return <span className="text-gray-400">N/A</span>;
        return (
          <div>
            <div className="font-medium text-sm">{advisor.display_name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'quote_date',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = new Date(row.getValue('quote_date'));
        return (
          <div className="text-sm">
            {format(date, 'd MMM yyyy', { locale: es })}
          </div>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const quote = row.original;
        const formatted = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: quote.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(quote.total);
        return <div className="font-mono font-semibold text-sm">{formatted}</div>;
      },
    },
    {
      accessorKey: 'margin_pct',
      header: 'Margen',
      cell: ({ row }) => {
        const marginPct = row.original.margin_pct;
        if (marginPct === null) return <span className="text-gray-400 text-sm">-</span>;

        const color = marginPct < 7
          ? 'text-red-600'
          : marginPct < 9
            ? 'text-yellow-600'
            : 'text-green-600';

        return (
          <span className={`font-mono font-semibold text-sm ${color}`}>
            {marginPct.toFixed(2)}%
          </span>
        );
      },
    },
    {
      id: 'approval',
      header: 'Aprobación',
      cell: ({ row }) => {
        const quote = row.original;
        if (quote.margin_approved) {
          return <Badge className="bg-green-100 text-green-800 text-xs">Aprobado</Badge>;
        }
        if (quote.margin_pct !== null && quote.margin_pct < 7) {
          return <Badge className="bg-red-100 text-red-800 text-xs">Requiere</Badge>;
        }
        return <span className="text-gray-400 text-xs">—</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusInfo = STATUS_LABELS[status] || {
          label: status,
          variant: 'outline' as const,
        };
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const quote = row.original;
        const canCreateOrder = ['approved', 'offer_created', 'negotiation', 'pending_oc'].includes(quote.status);
        const needsApproval = quote.margin_pct !== null && quote.margin_pct < 7 && !quote.margin_approved;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAction({ type: 'view', quote });
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {needsApproval && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction({ type: 'approve-margin', quote });
                  }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Aprobación de Margen
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAction({ type: 'generate-pdf', quote });
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generar PDF
              </DropdownMenuItem>
              {canCreateOrder && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction({ type: 'create-order', quote });
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Crear Pedido
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

// Keep backward-compatible export for any other consumers
export const quotesTableColumns: ColumnDef<Quote>[] = createQuotesTableColumns(() => {});
