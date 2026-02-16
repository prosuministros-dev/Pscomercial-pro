'use client';

import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Search } from 'lucide-react';
import type { OrderFilters as OrderFiltersType } from '../_lib/types';
import { STATUS_LABELS } from '../_lib/schemas';

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFiltersChange: (filters: OrderFiltersType) => void;
}

export function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por # o cliente..."
          value={filters.search || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value || undefined })
          }
          className="pl-9"
        />
      </div>

      {/* Status filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, status: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range */}
      <Input
        type="date"
        value={filters.from_date || ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, from_date: e.target.value || undefined })
        }
        className="w-[150px]"
        placeholder="Desde"
      />
      <Input
        type="date"
        value={filters.to_date || ''}
        onChange={(e) =>
          onFiltersChange({ ...filters, to_date: e.target.value || undefined })
        }
        className="w-[150px]"
        placeholder="Hasta"
      />
    </div>
  );
}
