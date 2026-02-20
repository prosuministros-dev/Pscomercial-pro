'use client';

import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

interface ReportFiltersProps {
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  showAdvisor?: boolean;
  showStatus?: boolean;
}

export function ReportFilters({
  filters,
  onFiltersChange,
  showAdvisor = false,
  showStatus = false,
}: ReportFiltersProps) {
  const update = (key: string, value: string) => {
    const next = { ...filters };
    if (value) {
      next[key] = value;
    } else {
      delete next[key];
    }
    onFiltersChange(next);
  };

  return (
    <div className="flex items-end gap-4 flex-wrap">
      <div>
        <Label className="text-xs text-muted-foreground">Desde</Label>
        <Input
          type="date"
          value={filters.from || ''}
          onChange={(e) => update('from', e.target.value)}
          className="w-40"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Hasta</Label>
        <Input
          type="date"
          value={filters.to || ''}
          onChange={(e) => update('to', e.target.value)}
          className="w-40"
        />
      </div>
      {showAdvisor && (
        <div>
          <Label className="text-xs text-muted-foreground">Asesor ID</Label>
          <Input
            placeholder="Filtrar por asesor..."
            value={filters.advisor_id || ''}
            onChange={(e) => update('advisor_id', e.target.value)}
            className="w-48"
          />
        </div>
      )}
      {showStatus && (
        <div>
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Input
            placeholder="Filtrar por estado..."
            value={filters.status || ''}
            onChange={(e) => update('status', e.target.value)}
            className="w-40"
          />
        </div>
      )}
    </div>
  );
}
