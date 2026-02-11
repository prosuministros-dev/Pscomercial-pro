import { useState } from 'react';
import { Search, MoreVertical, CheckCircle2, Clock, Package } from 'lucide-react';
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
import { pedidos } from '../../lib/mock-data';
import type { Pedido } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';
import { toast } from 'sonner@2.0.3';

interface PedidosKanbanProps {
  onVerDetalle: (pedidoId: string) => void;
}

export function PedidosKanban({ onVerDetalle }: PedidosKanbanProps) {
  const { gradients } = useTheme();
  const [busqueda, setBusqueda] = useState('');
  const [arrastrando, setArrastrando] = useState<string | null>(null);

  // Columnas del Kanban según estados
  const columnas = [
    { id: 'por_facturar', titulo: 'Por Facturar', color: 'border-yellow-500' },
    { id: 'facturado_sin_pago', titulo: 'Facturado Sin Pago', color: 'border-orange-500' },
    { id: 'pendiente_compra', titulo: 'Pendiente Compra', color: 'border-purple-500' },
    { id: 'en_bodega', titulo: 'En Bodega', color: 'border-blue-500' },
    { id: 'despachado', titulo: 'Despachado', color: 'border-indigo-500' },
    { id: 'entregado', titulo: 'Entregado', color: 'border-green-500' },
  ];

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchBusqueda = busqueda === '' || 
      pedido.numero.toString().includes(busqueda) ||
      pedido.razonSocial.toLowerCase().includes(busqueda.toLowerCase());
    return matchBusqueda;
  });

  const handleDragStart = (e: React.DragEvent, pedidoId: string) => {
    setArrastrando(pedidoId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault();
    if (arrastrando) {
      const pedido = pedidos.find(p => p.id === arrastrando);
      if (pedido) {
        toast.success(`Pedido #${pedido.numero} movido a ${nuevoEstado.replace(/_/g, ' ')}`);
      }
      setArrastrando(null);
    }
  };

  const handleDragEnd = () => {
    setArrastrando(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header con búsqueda */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Kanban Board - Responsive */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 h-full pb-2">
          {columnas.map((columna) => {
            const pedidosColumna = pedidosFiltrados.filter(pedido => pedido.estado === columna.id);
            
            return (
              <div
                key={columna.id}
                className="flex-1 min-w-[220px] max-w-[280px] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, columna.id)}
              >
                {/* Header de columna */}
                <div className={`border-t-2 ${columna.color} bg-secondary/30 rounded-t-lg p-2 mb-2`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium line-clamp-1">{columna.titulo}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {pedidosColumna.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards de pedidos */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {pedidosColumna.map((pedido) => (
                    <Card
                      key={pedido.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pedido.id)}
                      onDragEnd={handleDragEnd}
                      className={`group relative p-2.5 cursor-move hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border-l-2 ${columna.color} bg-card/50 backdrop-blur-sm ${
                        arrastrando === pedido.id ? 'opacity-40 scale-95 rotate-2' : ''
                      }`}
                      onClick={() => onVerDetalle(pedido.id)}
                    >
                      {/* Header ultra-compacto */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[9px] text-muted-foreground/60">
                            #{pedido.numero.toString().padStart(4, '0')}
                          </span>
                          {pedido.pagoConfirmado && (
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          )}
                        </div>
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVerDetalle(pedido.id); }}>
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Descargar PDF</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Monto */}
                      <div className="mb-2">
                        <span className="text-base font-semibold">
                          ${(pedido.subtotal / 1000000).toFixed(1)}M
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground/60">
                          {new Date(pedido.fechaPedido).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                        </span>
                        <div 
                          className="h-5 w-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
                          style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
                        >
                          {pedido.creadoPor.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {pedidosColumna.length === 0 && (
                    <div className="p-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        No hay pedidos
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