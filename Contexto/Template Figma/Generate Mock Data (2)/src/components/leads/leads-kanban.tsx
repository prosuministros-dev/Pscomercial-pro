import { useState } from 'react';
import { Search, MoreVertical, Clock, FileText, Plus } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { leads } from '../../lib/mock-data';
import type { Lead } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';
import { toast } from 'sonner@2.0.3';

interface LeadsKanbanProps {
  onVerDetalle: (lead: Lead) => void;
  onCrear: () => void;
}

export function LeadsKanban({ onVerDetalle, onCrear }: LeadsKanbanProps) {
  const { gradients } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [arrastrando, setArrastrando] = useState<string | null>(null);

  // Columnas del Kanban según estados
  const columnas = [
    { id: 'pendiente', titulo: 'Pendiente', color: 'border-yellow-500' },
    { id: 'en_gestion', titulo: 'En Gestión', color: 'border-blue-500' },
    { id: 'convertido', titulo: 'Convertido', color: 'border-green-500' },
    { id: 'descartado', titulo: 'Descartado', color: 'border-gray-500' },
  ];

  // Filtrar leads
  const leadsFiltrados = leads.filter(lead => {
    const matchBusqueda = busqueda === '' || 
      lead.numero.toString().includes(busqueda) ||
      lead.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
      lead.nombreContacto.toLowerCase().includes(busqueda.toLowerCase());
    return matchBusqueda;
  });

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setArrastrando(leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    if (arrastrando) {
      const lead = leads.find(l => l.id === arrastrando);
      if (lead) {
        toast.success(`Lead #${lead.numero} movido a ${nuevoEstado}`);
      }
      setArrastrando(null);
    }
  };

  const handleDragEnd = () => {
    setArrastrando(null);
  };

  const handleConvertir = (lead: Lead) => {
    toast.success(`Lead #${lead.numero} convertido a cotización`);
  };

  const handleDescartar = (lead: Lead) => {
    toast.info(`Lead #${lead.numero} descartado`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header con búsqueda y crear */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={onCrear}
          className="gap-1.5 h-8"
          style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Crear Lead</span>
        </Button>
      </div>

      {/* Kanban Board - Responsive */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 h-full pb-2">
          {columnas.map((columna) => {
            const leadsColumna = leadsFiltrados.filter(lead => lead.estado === columna.id);
            
            return (
              <div
                key={columna.id}
                className="flex-1 min-w-[220px] max-w-[280px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, columna.id)}
              >
                {/* Header de columna */}
                <div className={`border-t-2 ${columna.color} bg-secondary/30 rounded-t-lg p-1.5 md:p-2 mb-2`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs md:text-sm font-medium truncate">{columna.titulo}</h4>
                    <Badge variant="secondary" className="text-[10px] md:text-xs">
                      {leadsColumna.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards de leads */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {leadsColumna.map((lead) => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative p-2.5 cursor-move hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 ${columna.color} bg-card/50 backdrop-blur-sm ${
                        arrastrando === lead.id ? 'opacity-40 scale-95 rotate-2' : ''
                      }`}
                      onClick={() => onVerDetalle(lead)}
                    >
                      {/* Header ultra-compacto */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] text-muted-foreground/60">
                          #{lead.numero.toString().padStart(4, '0')}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVerDetalle(lead); }}>
                              Ver detalles
                            </DropdownMenuItem>
                            {lead.estado === 'en_gestion' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConvertir(lead); }}>
                                Convertir a cotización
                              </DropdownMenuItem>
                            )}
                            {lead.estado !== 'descartado' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDescartar(lead); }}>
                                Descartar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Razón social compacta */}
                      <h4 className="text-sm font-medium leading-tight line-clamp-2 mb-2">
                        {lead.razonSocial}
                      </h4>

                      {/* Alerta si aplica */}
                      {lead.alerta24h && (
                        <div className="flex items-center gap-1 text-[10px] text-yellow-600 dark:text-yellow-500 mb-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-yellow-600 dark:bg-yellow-500" />
                          <span>Requiere atención</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground/60">
                          {new Date(lead.creadoEn).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                        <div 
                          className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                          style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
                        >
                          {lead.asignadoA.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {leadsColumna.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        No hay leads en esta columna
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}