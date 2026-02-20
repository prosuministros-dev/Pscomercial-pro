'use client';

import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import type { DashboardFilters as Filters } from '../_lib/types';

interface DashboardFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  showAdvisor?: boolean;
}

export function DashboardFilters({ filters, onFiltersChange, showAdvisor = false }: DashboardFiltersProps) {
  return (
    <div className="flex items-end gap-4 flex-wrap">
      <div>
        <Label className="text-xs text-muted-foreground">Desde</Label>
        <Input
          type="date"
          value={filters.from || ''}
          onChange={(e) => onFiltersChange({ ...filters, from: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Hasta</Label>
        <Input
          type="date"
          value={filters.to || ''}
          onChange={(e) => onFiltersChange({ ...filters, to: e.target.value || undefined })}
          className="w-40"
        />
      </div>
      {showAdvisor && (
        <div>
          <Label className="text-xs text-muted-foreground">Asesor ID</Label>
          <Input
            placeholder="Filtrar por asesor..."
            value={filters.advisor_id || ''}
            onChange={(e) => onFiltersChange({ ...filters, advisor_id: e.target.value || undefined })}
            className="w-48"
          />
        </div>
      )}
    </div>
  );
}
