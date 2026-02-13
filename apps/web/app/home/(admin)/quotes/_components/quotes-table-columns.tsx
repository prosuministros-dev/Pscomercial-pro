'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@kit/ui/badge';
import type { Quote } from '../_lib/types';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  offer_created: { label: 'Oferta Creada', variant: 'outline' },
  negotiation: { label: 'En Negociación', variant: 'default' },
  risk: { label: 'Riesgo', variant: 'destructive' },
  pending_oc: { label: 'Pendiente OC', variant: 'outline' },
  approved: { label: 'Aprobada', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  lost: { label: 'Perdida', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'secondary' },
};

export const quotesTableColumns: ColumnDef<Quote>[] = [
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
    accessorKey: 'payment_terms',
    header: 'Forma de Pago',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue('payment_terms')}
      </Badge>
    ),
  },
];
