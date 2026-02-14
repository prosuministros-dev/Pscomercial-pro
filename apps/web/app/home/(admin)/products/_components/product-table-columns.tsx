'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { Pencil } from 'lucide-react';
import type { Product } from '../_lib/types';

interface ActionsColumnProps {
  onEdit: (product: Product) => void;
}

// Category colors mapping
const CATEGORY_COLORS: Record<string, string> = {
  ACCESORIOS: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  HARDWARE: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  OTROS: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  SERVICIOS: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  SOFTWARE: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

// Format currency helper
const formatCurrency = (value: number, currency: 'COP' | 'USD' = 'COP') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export function createProductColumns({
  onEdit,
}: ActionsColumnProps): ColumnDef<Product>[] {
  return [
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <div className="font-mono text-sm font-semibold">{row.getValue('sku')}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="font-medium max-w-xs truncate" title={row.getValue('name')}>
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'product_categories',
      header: 'Categoría',
      cell: ({ row }) => {
        const category = row.original.product_categories;
        const categoryName = category?.name || 'N/A';
        const colorClass = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.OTROS;

        return (
          <Badge variant="outline" className={colorClass}>
            {categoryName}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'brand',
      header: 'Marca',
      cell: ({ row }) => {
        const brand = row.getValue('brand') as string | null;
        return <div className="text-sm">{brand || '-'}</div>;
      },
    },
    {
      accessorKey: 'unit_cost_usd',
      header: 'Costo USD',
      cell: ({ row }) => {
        const cost = row.getValue('unit_cost_usd') as number;
        return (
          <div className="font-mono text-sm tabular-nums">
            {formatCurrency(cost, 'USD')}
          </div>
        );
      },
    },
    {
      accessorKey: 'unit_cost_cop',
      header: 'Costo COP',
      cell: ({ row }) => {
        const cost = row.getValue('unit_cost_cop') as number;
        return (
          <div className="font-mono text-sm tabular-nums">
            {formatCurrency(cost, 'COP')}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const product = row.original;

        return (
          <div className="flex items-center gap-2">
            <PermissionGate permission="products:update">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(product)}
                aria-label="Editar producto"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];
}
