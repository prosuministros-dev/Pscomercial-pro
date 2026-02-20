'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import type { SupplierFilters as SupplierFiltersType } from '../_lib/types';

interface SupplierFiltersProps {
  onFiltersChange: (filters: SupplierFiltersType) => void;
  initialFilters?: SupplierFiltersType;
}

export function SupplierFilters({
  onFiltersChange,
  initialFilters = {},
}: SupplierFiltersProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [city, setCity] = useState(initialFilters.city || '');

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search: search || undefined,
        city: city || undefined,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [search, city, onFiltersChange]);

  const handleClearFilters = () => {
    setSearch('');
    setCity('');
  };

  const hasActiveFilters = search || city;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filtros de búsqueda</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8"
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-search">Nombre / NIT</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="filter-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o NIT..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-city">Ciudad</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="filter-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Buscar por ciudad..."
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
