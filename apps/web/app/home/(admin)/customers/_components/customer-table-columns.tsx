'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@kit/ui/button';
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
        <div className="font-medium">{row.getValue('business_name')}</div>
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
      accessorKey: 'department',
      header: 'Departamento',
      cell: ({ row }) => {
        const department = row.getValue('department') as string | undefined;
        return <div className="text-sm">{department || '-'}</div>;
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
      accessorKey: 'contacts_count',
      header: 'Contactos',
      cell: ({ row }) => {
        const count = row.original.contacts_count || 0;
        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{count}</span>
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(customer)}
              aria-label="Editar cliente"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewContacts(customer)}
              aria-label="Ver contactos"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
