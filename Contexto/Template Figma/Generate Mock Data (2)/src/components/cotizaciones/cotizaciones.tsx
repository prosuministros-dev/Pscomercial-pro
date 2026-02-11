import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Copy,
  Download,
  Send,
  ShoppingCart,
  DollarSign,
  LayoutGrid,
  List,
  Info
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cotizaciones } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';
import { CrearCotizacionModal } from './crear-cotizacion-modal';
import { DetalleCotizacionModal } from './detalle-cotizacion-modal';
import { CotizacionesKanban } from './cotizaciones-kanban';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export function Cotizaciones() {
  const { gradients } = useTheme();
  const [vistaActual, setVistaActual] = useState<'tabla' | 'kanban'>('kanban'); // Default Kanban según PRD
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<any>(null);

  // TRM del día
  const trmActual = 4250;

  const cotizacionesFiltradas = cotizaciones.filter(cotizacion => {
    const matchEstado = filtroEstado === 'todos' || cotizacion.estado === filtroEstado;
    const matchBusqueda = busqueda === '' || cotizacion.numero.toString().includes(busqueda);
    return matchEstado && matchBusqueda;
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      // Estados nuevos del sistema extendido
      borrador: { variant: 'outline' as const, label: 'Borrador', className: 'border-gray-400 text-gray-600 dark:text-gray-400' },
      enviada: { variant: 'outline' as const, label: 'Enviada', className: 'border-blue-500 text-blue-600 dark:text-blue-400' },
      aprobada: { variant: 'default' as const, label: 'Aprobada', className: 'bg-green-600' },
      rechazada: { variant: 'destructive' as const, label: 'Rechazada' },
      vencida: { variant: 'outline' as const, label: 'Vencida', className: 'border-orange-500 text-orange-600 dark:text-orange-400' },
      
      // Estados legacy (por compatibilidad)
      '40': { variant: 'outline' as const, label: 'Creación Oferta', className: 'border-blue-500 text-blue-600' },
      '60': { variant: 'outline' as const, label: 'Negociación', className: 'border-purple-500 text-purple-600' },
      '70': { variant: 'outline' as const, label: 'Riesgo', className: 'border-orange-500 text-orange-600' },
      '80': { variant: 'outline' as const, label: 'Pendiente OC', className: 'border-green-500 text-green-600' },
      'perdida': { variant: 'secondary' as const, label: 'Perdida', className: 'opacity-60' },
    };
    const badge = badges[estado as keyof typeof badges];
    if (!badge) return <Badge variant="outline" className="text-[10px] h-4 px-1.5">{estado}</Badge>;
    return (
      <Badge variant={badge.variant} className={`text-[10px] h-4 px-1.5 ${badge.className || ''}`}>
        {badge.label}
      </Badge>
    );
  };

  const handleVerDetalle = (cotizacion: any) => {
    setCotizacionSeleccionada(cotizacion);
    setModalDetalle(true);
  };

  const handleDuplicar = (cotizacion: any) => {
    toast.success(`Cotización #${cotizacion.numero} duplicada como #${cotizacion.numero + 1}`);
  };

  const handleGenerarPedido = () => {
    toast.success('Pedido generado exitosamente');
  };

  return (
    <div className="h-full flex flex-col w-full">
      {/* Header con TRM y toggle de vista */}
      <div className="flex items-center justify-between flex-shrink-0 mb-3">
        <div className="flex items-center gap-2.5">
          <div 
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
          >
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg">Cotizaciones</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Propuestas comerciales</p>
              <Badge variant="outline" className="text-[10px] gap-1 h-5 px-2">
                <DollarSign className="h-3 w-3" />
                TRM: ${trmActual.toLocaleString('es-CO')}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle de Vista - Consistente con Leads y Pedidos */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button
              variant={vistaActual === 'tabla' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVistaActual('tabla')}
              className="h-9 rounded-none border-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={vistaActual === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVistaActual('kanban')}
              className="h-9 rounded-none border-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            size="sm"
            onClick={() => setModalCrear(true)}
            className="gap-2 h-8 text-sm px-3"
            style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva</span>
          </Button>
        </div>
      </div>

      {/* Vistas */}
      <div className="flex-1 overflow-hidden min-h-0">
        {vistaActual === 'kanban' ? (
          <CotizacionesKanban
            onVerDetalle={handleVerDetalle}
            onCrear={() => setModalCrear(true)}
          />
        ) : (
          <div className="space-y-3 h-full flex flex-col">
            {/* Filtros */}
            <div className="flex gap-2 flex-shrink-0">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="40">Creación Oferta</SelectItem>
                  <SelectItem value="60">Negociación</SelectItem>
                  <SelectItem value="70">Riesgo</SelectItem>
                  <SelectItem value="80">Pendiente OC</SelectItem>
                  <SelectItem value="perdida">Perdida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0">
              {[
                { label: 'Total', count: cotizaciones.length },
                { label: 'Margen Bajo', count: cotizaciones.filter(c => c.aprobacionGerenciaRequerida).length },
                { label: 'Negociación', count: cotizaciones.filter(c => c.estado === '60').length },
                { label: 'Pendiente OC', count: cotizaciones.filter(c => c.estado === '80').length },
              ].map((stat) => (
                <Card key={stat.label} className="p-2">
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <h4 className="mt-0.5 text-base">{stat.count}</h4>
                </Card>
              ))}
            </div>

            {/* Tabla - Desktop */}
            <Card className="hidden md:block overflow-hidden flex-1 min-h-0">
        <div className="overflow-auto h-full">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr className="text-[10px]">
                <th className="px-2 py-1.5 text-left font-medium">Estado</th>
                <th className="px-2 py-1.5 text-left font-medium">#</th>
                <th className="px-2 py-1.5 text-left font-medium">Fecha</th>
                <th className="px-2 py-1.5 text-left font-medium">Pago</th>
                <th className="px-2 py-1.5 text-left font-medium">Ítems</th>
                <th className="px-2 py-1.5 text-right font-medium">Costo</th>
                <th className="px-2 py-1.5 text-right font-medium">Venta</th>
                <th className="px-2 py-1.5 text-right font-medium">Margen</th>
                <th className="px-2 py-1.5 text-left font-medium">Alertas</th>
                <th className="px-2 py-1.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cotizacionesFiltradas.map((cotizacion) => (
                <tr key={cotizacion.id} className="hover:bg-muted/30 transition-colors text-xs">
                  <td className="px-2 py-1.5">{getEstadoBadge(cotizacion.estado)}</td>
                  <td className="px-2 py-1.5">
                    <span className="font-mono text-[10px]">#{cotizacion.numero}</span>
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-muted-foreground">
                    {new Date(cotizacion.fechaCotizacion).toLocaleDateString('es-CO', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      {cotizacion.terminosPago}
                    </Badge>
                  </td>
                  <td className="px-2 py-1.5 text-[10px]">{cotizacion.items.length}</td>
                  <td className="px-2 py-1.5 text-[10px] text-right text-muted-foreground">
                    ${(cotizacion.totalCosto / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-2 py-1.5 text-[10px] text-right">
                    ${(cotizacion.totalVenta / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <span className={`text-[10px] font-medium ${
                      cotizacion.margenPct < 25 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {cotizacion.margenPct}%
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-0.5">
                      {cotizacion.clienteBloqueado && (
                        <Badge variant="destructive" className="text-[9px] h-3.5 px-1">
                          Bloqueado
                        </Badge>
                      )}
                      {cotizacion.aprobacionGerenciaRequerida && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-orange-500 text-orange-600">
                          Margen
                        </Badge>
                      )}
                      {cotizacion.aprobacionFinancieraRequerida && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-blue-500 text-blue-600">
                          Finanzas
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-6 text-[10px] px-2"
                        onClick={() => handleVerDetalle(cotizacion)}
                      >
                         Ver
                        </Button>
                        {cotizacion.estado === '80' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-[10px] px-2 gap-1"
                            onClick={() => {
                              setCotizacionSeleccionada(cotizacion);
                              handleGenerarPedido();
                            }}
                          >
                            <ShoppingCart className="h-2.5 w-2.5" />
                            Pedido
                          </Button>
                        )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-xs"
                            onClick={() => handleVerDetalle(cotizacion)}
                          >
                            Ver detalles
                          </DropdownMenuItem>
                          {cotizacion.estado === 'borrador' && (
                            <DropdownMenuItem className="text-xs gap-2">
                              <Send className="h-3 w-3" />
                              Enviar al cliente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-xs gap-2"
                            onClick={() => handleDuplicar(cotizacion)}
                          >
                            <Copy className="h-3 w-3" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2">
                            <Download className="h-3 w-3" />
                            Generar Proforma
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cotizacionesFiltradas.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron cotizaciones</p>
          </div>
        )}
      </Card>

      {/* Lista - Mobile */}
      <div className="md:hidden space-y-2 flex-1 overflow-y-auto">
        {cotizacionesFiltradas.map((cotizacion) => (
          <Card key={cotizacion.id} className="p-2.5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">#{cotizacion.numero}</span>
                {getEstadoBadge(cotizacion.estado)}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 text-xs px-2"
                onClick={() => handleVerDetalle(cotizacion)}
              >
                Ver
              </Button>
            </div>
            
            {/* Alertas */}
            {(cotizacion.clienteBloqueado || cotizacion.aprobacionGerenciaRequerida || cotizacion.aprobacionFinancieraRequerida) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {cotizacion.clienteBloqueado && (
                  <Badge variant="destructive" className="text-[10px] h-4">Bloqueado</Badge>
                )}
                {cotizacion.aprobacionGerenciaRequerida && (
                  <Badge variant="outline" className="text-[10px] h-4 border-orange-500 text-orange-600">
                    Margen bajo
                  </Badge>
                )}
                {cotizacion.aprobacionFinancieraRequerida && (
                  <Badge variant="outline" className="text-[10px] h-4 border-blue-500 text-blue-600">
                    Aprobación financiera
                  </Badge>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Venta</p>
                <p className="font-medium">${(cotizacion.totalVenta / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-muted-foreground">Margen</p>
                <p className={`font-medium ${
                  cotizacion.margenPct < 25 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {cotizacion.margenPct}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ítems</p>
                <p>{cotizacion.items.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pago</p>
                <p className="truncate">{cotizacion.terminosPago}</p>
              </div>
            </div>
          </Card>
        ))}
        {cotizacionesFiltradas.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron cotizaciones</p>
          </Card>
        )}
      </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <CrearCotizacionModal
        open={modalCrear}
        onOpenChange={setModalCrear}
        onCreated={(cotizacion) => {
          // Aquí se agregaría la cotización a la lista
          console.log('Nueva cotización:', cotizacion);
        }}
      />

      {cotizacionSeleccionada && (
        <DetalleCotizacionModal
          open={modalDetalle}
          onOpenChange={setModalDetalle}
          cotizacion={cotizacionSeleccionada}
          onDuplicar={() => handleDuplicar(cotizacionSeleccionada)}
          onGenerarPedido={handleGenerarPedido}
        />
      )}
    </div>
  );
}