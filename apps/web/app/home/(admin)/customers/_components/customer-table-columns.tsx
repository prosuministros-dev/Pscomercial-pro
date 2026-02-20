'use client';

import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { Eye, Pencil, Users } from 'lucide-react';
import type { Customer } from '../_lib/types';

export interface CustomerTableRow extends Customer {
  contacts_count?: number;
}

interface ActionsColumnProps {
  onEdit: (customer: Customer) => void;
  onViewContacts: (customer: Customer) => void;
}

export function createCustomerColumns({
  onEdit,
  onViewContacts,
}: ActionsColumnProps): ColumnDef<CustomerTableRow>[] {
  return [
    {
      accessorKey: 'nit',
      header: 'NIT',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('nit')}</div>
      ),
    },
    {
      accessorKey: 'business_name',
      header: 'Razón Social',
      cell: ({ row }) => (
        <Link
          href={`/home/customers/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue('business_name')}
        </Link>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
      cell: ({ row }) => {
        const city = row.getValue('city') as string | undefined;
        return <div className="text-sm">{city || '-'}</div>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string | undefined;
        return <div className="font-mono text-sm">{phone || '-'}</div>;
      },
    },
    {
      id: 'assigned_advisor',
      header: 'Asesor',
      cell: ({ row }) => {
        const advisor = row.original.assigned_advisor;
        return (
          <div className="text-sm">
            {advisor?.full_name || <span className="text-muted-foreground">Sin asignar</span>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={status === 'active' ? 'default' : 'secondary'}
            className={status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : ''}
          >
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'last_interaction_at',
      header: 'Última Interacción',
      cell: ({ row }) => {
        const date = row.getValue('last_interaction_at') as string | undefined;
        if (!date) return <span className="text-sm text-muted-foreground">-</span>;
        return (
          <div className="text-sm">
            {new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const customer = row.original;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Ver ficha del cliente"
            >
              <Link href={`/home/customers/${customer.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <PermissionGate permission="customers:update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(customer)}
                aria-label="Editar cliente"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate permission="customers:manage_contacts">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewContacts(customer)}
                aria-label="Ver contactos"
              >
                <Users className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];
}
