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
import type { ProductFilters } from '../_lib/types';

interface ProductFiltersProps {
  onFiltersChange: (filters: ProductFilters) => void;
  initialFilters?: ProductFilters;
  categories?: Array<{ id: string; name: string }>;
}

export function ProductFilters({
  onFiltersChange,
  initialFilters = {},
  categories = [],
}: ProductFiltersProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [categoryId, setCategoryId] = useState(initialFilters.category_id || '');
  const [isActive, setIsActive] = useState(initialFilters.is_active || '');

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        search: search || undefined,
        category_id: categoryId || undefined,
        is_active: isActive || undefined,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [search, categoryId, isActive, onFiltersChange]);

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setIsActive('');
  };

  const hasActiveFilters = search || categoryId || isActive;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-search">SKU o Nombre</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="filter-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por SKU o nombre..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-category">Categoría</Label>
          <Select value={categoryId || '_all'} onValueChange={(v) => setCategoryId(v === '_all' ? '' : v)}>
            <SelectTrigger id="filter-category">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-status">Estado</Label>
          <Select value={isActive || '_all'} onValueChange={(v) => setIsActive(v === '_all' ? '' : v)}>
            <SelectTrigger id="filter-status">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los estados</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
