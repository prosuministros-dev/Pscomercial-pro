'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@kit/ui/input';
import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import type { CustomerFilters as CustomerFiltersType } from '../_lib/types';

interface CustomerFiltersProps {
  onFiltersChange: (filters: CustomerFiltersType) => void;
  initialFilters?: CustomerFiltersType;
}

export function CustomerFilters({
  onFiltersChange,
  initialFilters = {},
}: CustomerFiltersProps) {
  const [businessName, setBusinessName] = useState(initialFilters.business_name || '');
  const [nit, setNit] = useState(initialFilters.nit || '');
  const [city, setCity] = useState(initialFilters.city || '');
  const [status, setStatus] = useState(initialFilters.status || '');

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        business_name: businessName || undefined,
        nit: nit || undefined,
        city: city || undefined,
        status: status || undefined,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [businessName, nit, city, status, onFiltersChange]);

  const handleClearFilters = () => {
    setBusinessName('');
    setNit('');
    setCity('');
    setStatus('');
  };

  const hasActiveFilters = businessName || nit || city || status;

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-business-name">Razón Social</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="filter-business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Buscar por razón social..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-nit">NIT</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="filter-nit"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="Buscar por NIT..."
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

        <div className="space-y-2">
          <Label htmlFor="filter-status">Estado</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value === 'all' ? '' : value)}
          >
            <SelectTrigger id="filter-status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
