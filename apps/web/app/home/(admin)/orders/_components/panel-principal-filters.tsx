'use client';

import { Input } from '@kit/ui/input';
import { Card } from '@kit/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Search, Filter } from 'lucide-react';

interface PanelPrincipalFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  tipo: string;
  onTipoChange: (value: string) => void;
  estado: string;
  onEstadoChange: (value: string) => void;
}

export function PanelPrincipalFilters({
  search,
  onSearchChange,
  tipo,
  onTipoChange,
  estado,
  onEstadoChange,
}: PanelPrincipalFiltersProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filtros</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar # pedido o cliente..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={tipo} onValueChange={onTipoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de pedido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="fisico">Físico</SelectItem>
            <SelectItem value="intangible">Intangible</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={onEstadoChange}>
          <SelectTrigger>
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="atencion_requerida">Atención Requerida</SelectItem>
            <SelectItem value="sin_pendientes">Sin Pendientes</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
