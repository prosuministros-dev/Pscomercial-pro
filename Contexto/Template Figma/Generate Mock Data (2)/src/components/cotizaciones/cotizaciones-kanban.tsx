import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search,
  DollarSign,
  Package,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cotizaciones } from '../../lib/mock-data';
import type { Cotizacion } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';
import { toast } from 'sonner@2.0.3';

interface CotizacionesKanbanProps {
  onVerDetalle: (cotizacion: Cotizacion) => void;
  onCrear: () => void;
}

export function CotizacionesKanban({ onVerDetalle, onCrear }: CotizacionesKanbanProps) {
  const { gradients } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [arrastrando, setArrastrando] = useState<string | null>(null);

  // Columnas del Kanban según estados del sistema extendido
  const columnas = [
    { id: 'borrador', titulo: 'Borrador', color: 'border-gray-500' },
    { id: 'enviada', titulo: 'Enviada', color: 'border-blue-500' },
    { id: 'aprobada', titulo: 'Aprobada', color: 'border-green-500' },
    { id: 'rechazada', titulo: 'Rechazada', color: 'border-red-500' },
    { id: 'vencida', titulo: 'Vencida', color: 'border-orange-500' },
    // Estados legacy (si hay cotizaciones antiguas)
    { id: '40', titulo: 'Creación de Oferta', color: 'border-blue-500' },
    { id: '60', titulo: 'Negociación', color: 'border-purple-500' },
    { id: '70', titulo: 'Riesgo', color: 'border-orange-500' },
    { id: '80', titulo: 'Pendiente OC', color: 'border-green-500' },
  ];

  // Filtrar cotizaciones (excluye "perdida" que solo es visible por búsqueda)
  const cotizacionesFiltradas = cotizaciones.filter(cot => {
    const matchBusqueda = busqueda === '' || 
      cot.numero.toString().includes(busqueda) ||
      cot.razonSocial.toLowerCase().includes(busqueda.toLowerCase());
    
    // Si hay búsqueda, mostrar todas incluyendo perdidas
    if (busqueda) return matchBusqueda;
    
    // Sin búsqueda, ocultar perdidas
    return matchBusqueda && cot.estado !== 'perdida';
  });

  const handleDragStart = (e: React.DragEvent, cotizacionId: string) => {
    setArrastrando(cotizacionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    if (!arrastrando) return;

    const cotizacion = cotizaciones.find(c => c.id === arrastrando);
    if (cotizacion && cotizacion.estado !== nuevoEstado) {
      // Aquí se actualizaría el estado en el backend
      toast.success(`Cotización #${cotizacion.numero} movida a ${columnas.find(c => c.id === nuevoEstado)?.titulo}`);
    }
    setArrastrando(null);
  };

  const handleDragEnd = () => {
    setArrastrando(null);
  };

  const getCotizacionesPorEstado = (estadoId: string) => {
    return cotizacionesFiltradas.filter(cot => cot.estado === estadoId);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Búsqueda */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cotización o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9 h-9 text-sm w-full"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-2 h-full">
          {columnas.map((columna) => {
            const cotizacionesColumna = getCotizacionesPorEstado(columna.id);
            
            return (
              <div 
                key={columna.id} 
                className="flex flex-col min-w-[220px] max-w-[280px] flex-shrink-0 h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, columna.id)}
              >
                {/* Header de columna */}
                <div className={`border-l-2 ${columna.color} bg-muted/20 px-2.5 py-1.5 rounded-t-md mb-1.5`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] truncate">{columna.titulo}</h4>
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 flex-shrink-0 ml-1">
                      {cotizacionesColumna.length}
                    </Badge>
                  </div>
                </div>

                {/* Scroll de tarjetas */}
                <ScrollArea className="flex-1">
                  <div className="space-y-1.5 pr-1.5">
                    {cotizacionesColumna.map((cotizacion) => (
                      <motion.div
                        key={cotizacion.id}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, cotizacion.id)}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`cursor-move ${arrastrando === cotizacion.id ? 'opacity-40 scale-95 rotate-1' : ''}`}
                      >
                        <Card 
                          className="group relative p-2.5 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer border-l-2 bg-card/50 backdrop-blur-sm"
                          style={{
                            borderLeftColor: cotizacion.margenPct < 25 
                              ? 'rgb(234, 88, 12)' 
                              : 'rgb(34, 197, 94)'
                          }}
                          onClick={() => onVerDetalle(cotizacion)}
                        >
                          {/* Header ultra-compacto */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-mono text-muted-foreground/60">
                                #{cotizacion.numero.toString().padStart(4, '0')}
                              </span>
                              {(cotizacion.clienteBloqueado || cotizacion.aprobacionGerenciaRequerida) && (
                                <AlertTriangle className="h-2.5 w-2.5 text-orange-500" />
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVerDetalle(cotizacion); }}>
                                  <Eye className="h-3 w-3 mr-2" />
                                  Ver detalles
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-xs">Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs">Duplicar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Monto y margen en misma línea */}
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="text-base font-semibold">
                              ${(cotizacion.totalVenta / 1000000).toFixed(1)}M
                            </span>
                            <span className={`text-xs font-semibold ${
                              cotizacion.margenPct < 25 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {cotizacion.margenPct}%
                            </span>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground/60">
                              {new Date(cotizacion.fechaCotizacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                            </span>
                            <div 
                              className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                              style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
                            >
                              {cotizacion.creadoPor.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}

                    {/* Estado vacío */}
                    {cotizacionesColumna.length === 0 && (
                      <div className="text-center py-3 text-[9px] text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 mx-auto mb-0.5 opacity-30" />
                        <p>Sin cotizaciones</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info de búsqueda de perdidas */}
      {busqueda && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          💡 Las cotizaciones "Perdida" solo son visibles mediante búsqueda
        </div>
      )}
    </div>
  );
}