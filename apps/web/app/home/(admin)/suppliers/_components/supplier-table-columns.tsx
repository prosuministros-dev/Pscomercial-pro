'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { Pencil, Trash2 } from 'lucide-react';
import type { Supplier } from '../_lib/types';

interface ActionsColumnProps {
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function createSupplierColumns({
  onEdit,
  onDelete,
}: ActionsColumnProps): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: 'nit',
      header: 'NIT',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('nit') || '-'}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
      cell: ({ row }) => {
        const city = row.getValue('city') as string | null;
        return <div className="text-sm">{city || '-'}</div>;
      },
    },
    {
      accessorKey: 'contact_name',
      header: 'Contacto',
      cell: ({ row }) => {
        const name = row.getValue('contact_name') as string | null;
        return <div className="text-sm">{name || '-'}</div>;
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.getValue('email') as string | null;
        return <div className="text-sm">{email || '-'}</div>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string | null;
        return <div className="font-mono text-sm">{phone || '-'}</div>;
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={isActive ? 'bg-green-500/10 text-green-700 dark:text-green-400' : ''}
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const supplier = row.original;

        return (
          <div className="flex items-center gap-1">
            <PermissionGate permission="purchase_orders:update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(supplier)}
                aria-label="Editar proveedor"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate permission="purchase_orders:delete">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(supplier)}
                aria-label="Eliminar proveedor"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];
}
