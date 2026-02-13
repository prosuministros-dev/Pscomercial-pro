'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { MoreHorizontal, AlertCircle } from 'lucide-react';
import type { Lead } from '../_lib/types';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  created: { label: 'Creado', variant: 'secondary' },
  pending_assignment: { label: 'Pendiente Asignación', variant: 'outline' },
  assigned: { label: 'Asignado', variant: 'default' },
  converted: { label: 'Convertido', variant: 'default' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
  pending_info: { label: 'Pendiente Info', variant: 'outline' },
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  web: 'Web',
  manual: 'Manual',
};

export const leadsTableColumns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'lead_number',
    header: '# Lead',
    cell: ({ row }) => {
      const isOverdue = () => {
        const lead = row.original;
        if (lead.status === 'converted' || lead.status === 'rejected')
          return false;

        const leadDate = new Date(lead.lead_date);
        const now = new Date();
        const diffInMs = now.getTime() - leadDate.getTime();
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        return diffInDays > 1;
      };

      return (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">#{row.getValue('lead_number')}</span>
          {isOverdue() && (
            <span title="Vencido (>1 día)"><AlertCircle className="w-4 h-4 text-red-500" /></span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'business_name',
    header: 'Razón Social',
    cell: ({ row }) => {
      const nit = row.original.nit;
      return (
        <div>
          <div className="font-medium">{row.getValue('business_name')}</div>
          {nit && <div className="text-xs text-gray-500">NIT: {nit}</div>}
        </div>
      );
    },
  },
  {
    accessorKey: 'contact_name',
    header: 'Contacto',
    cell: ({ row }) => {
      const phone = row.original.phone;
      const email = row.original.email;
      return (
        <div>
          <div className="font-medium">{row.getValue('contact_name')}</div>
          <div className="text-xs text-gray-500">{phone}</div>
          <div className="text-xs text-gray-500 truncate max-w-[200px]">
            {email}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'requirement',
    header: 'Requerimiento',
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <p className="line-clamp-2 text-sm">{row.getValue('requirement')}</p>
      </div>
    ),
  },
  {
    accessorKey: 'channel',
    header: 'Canal',
    cell: ({ row }) => {
      const channel = row.getValue('channel') as string;
      return (
        <Badge variant="outline">
          {CHANNEL_LABELS[channel] || channel}
        </Badge>
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
    accessorKey: 'assigned_user',
    header: 'Asignado a',
    cell: ({ row }) => {
      const assignedUser = row.original.assigned_user;
      if (!assignedUser) {
        return <span className="text-gray-400 text-sm">No asignado</span>;
      }
      return (
        <div>
          <div className="font-medium text-sm">
            {assignedUser.display_name}
          </div>
          <div className="text-xs text-gray-500">{assignedUser.email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'lead_date',
    header: 'Fecha',
    cell: ({ row }) => {
      const date = new Date(row.getValue('lead_date'));
      return (
        <div className="text-sm">
          {format(date, "d MMM yyyy", { locale: es })}
          <div className="text-xs text-gray-500">
            {format(date, 'HH:mm', { locale: es })}
          </div>
        </div>
      );
    },
  },
];
