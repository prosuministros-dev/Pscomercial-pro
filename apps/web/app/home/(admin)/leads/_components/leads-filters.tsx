'use client';

import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Search } from 'lucide-react';
import type { LeadFilters } from '../_lib/types';

interface LeadsFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

export function LeadsFilters({ filters, onFiltersChange }: LeadsFiltersProps) {
  const updateFilter = (key: keyof LeadFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Search */}
      <div className="md:col-span-2">
        <Label htmlFor="search" className="mb-2 block text-sm">
          Buscar
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="search"
            placeholder="Buscar por razón social, NIT, contacto..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <Label htmlFor="status" className="mb-2 block text-sm">
          Estado
        </Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            updateFilter('status', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="created">Creado</SelectItem>
            <SelectItem value="pending_assignment">
              Pendiente Asignación
            </SelectItem>
            <SelectItem value="assigned">Asignado</SelectItem>
            <SelectItem value="pending_info">Pendiente Info</SelectItem>
            <SelectItem value="converted">Convertido</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Channel Filter */}
      <div>
        <Label htmlFor="channel" className="mb-2 block text-sm">
          Canal
        </Label>
        <Select
          value={filters.channel || 'all'}
          onValueChange={(value) =>
            updateFilter('channel', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="web">Web</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
