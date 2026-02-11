import { useState } from 'react';
import { 
  ShoppingCart,
  Search,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  Truck,
  MessageSquare,
  Settings,
  MoreHorizontal,
  X,
  Award,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { pedidos, informacionDespacho, observaciones } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';
import { DespachoModal } from './despacho-modal';
import { LicenciamientoModal } from './licenciamiento-modal';
import { PedidosKanban } from './pedidos-kanban';
import { toast } from 'sonner@2.0.3';

type VistaType = 'tabla' | 'kanban';

export function Pedidos() {
  const { gradients } = useTheme();
  const [vista, setVista] = useState<VistaType>('tabla');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDespacho, setModalDespacho] = useState(false);
  const [modalLicenciamiento, setModalLicenciamiento] = useState(false);

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchEstado = filtroEstado === 'todos' || pedido.estado === filtroEstado;
    const matchBusqueda = busqueda === '' || 
      pedido.numero.toString().includes(busqueda) ||
      pedido.razonSocial.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      // Estados nuevos del sistema extendido
      por_facturar: { variant: 'outline' as const, label: 'Por Facturar', className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400' },
      facturado_sin_pago: { variant: 'outline' as const, label: 'Facturado Sin Pago', className: 'border-orange-500 text-orange-700 dark:text-orange-400' },
      pendiente_compra: { variant: 'secondary' as const, label: 'Pendiente Compra', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
      en_bodega: { variant: 'default' as const, label: 'En Bodega', className: 'bg-blue-600' },
      despachado: { variant: 'default' as const, label: 'Despachado', className: 'bg-indigo-600' },
      entregado: { variant: 'default' as const, label: 'Entregado', className: 'bg-green-600' },
      
      // Estados legacy (por compatibilidad)
      pendiente: { variant: 'outline' as const, label: 'Pendiente' },
      aprobado: { variant: 'default' as const, label: 'Aprobado', className: 'bg-blue-600' },
      en_proceso: { variant: 'secondary' as const, label: 'En Proceso' },
      completado: { variant: 'default' as const, label: 'Completado', className: 'bg-green-600' },
      cancelado: { variant: 'destructive' as const, label: 'Cancelado' },
    };
    const badge = badges[estado as keyof typeof badges];
    if (!badge) return <Badge variant="outline" className="text-xs h-5">{estado}</Badge>;
    return (
      <Badge variant={badge.variant} className={`text-xs h-5 ${badge.className || ''}`}>
        {badge.label}
      </Badge>
    );
  };

  const pedidoActual = pedidos.find(p => p.id === pedidoSeleccionado);
  const despachoActual = informacionDespacho.find(d => d.pedidoId === pedidoSeleccionado);
  const observacionesActuales = observaciones.filter(o => o.pedidoId === pedidoSeleccionado);

  const abrirModal = (pedidoId: string) => {
    setPedidoSeleccionado(pedidoId);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPedidoSeleccionado(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)' }}
          >
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>Pedidos</h2>
            <p className="text-xs text-muted-foreground">Gestión de pedidos</p>
          </div>
        </div>
      </div>

      {/* Filtros y toggle de vista */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        {vista === 'tabla' && (
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="por_facturar">Por Facturar</SelectItem>
              <SelectItem value="facturado_sin_pago">Facturado Sin Pago</SelectItem>
              <SelectItem value="pendiente_compra">Pendiente Compra</SelectItem>
              <SelectItem value="en_bodega">En Bodega</SelectItem>
              <SelectItem value="despachado">Despachado</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
            </SelectContent>
          </Select>
        )}
        {/* Toggle de Vista */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <Button
            variant={vista === 'tabla' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVista('tabla')}
            className="h-9 rounded-none border-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={vista === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVista('kanban')}
            className="h-9 rounded-none border-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats - Solo en vista tabla */}
      {vista === 'tabla' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Por Facturar', count: pedidos.filter(p => p.estado === 'por_facturar').length },
            { label: 'Pendiente Compra', count: pedidos.filter(p => p.estado === 'pendiente_compra').length },
            { label: 'En Bodega', count: pedidos.filter(p => p.estado === 'en_bodega').length },
            { label: 'Entregados', count: pedidos.filter(p => p.estado === 'entregado').length },
          ].map((stat) => (
            <Card key={stat.label} className="p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <h4 className="mt-1">{stat.count}</h4>
            </Card>
          ))}
        </div>
      )}

      {/* Vista Tabla */}
      {vista === 'tabla' && (
        <>
          {/* Tabla - Desktop */}
          <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-xs">
                <th className="px-3 py-2 text-left font-medium">Estado</th>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Cliente</th>
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-left font-medium">Asunto</th>
                <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                <th className="px-3 py-2 text-center font-medium">Mon</th>
                <th className="px-3 py-2 text-center font-medium">Pago</th>
                <th className="px-3 py-2 text-center font-medium">Pend</th>
                <th className="px-3 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-muted/30 transition-colors text-sm">
                  <td className="px-3 py-2">{getEstadoBadge(pedido.estado)}</td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs">#{pedido.numero}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div>
                      <p className="font-medium truncate max-w-[180px]">{pedido.razonSocial}</p>
                      <p className="text-xs text-muted-foreground">{pedido.nit}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(pedido.fechaPedido).toLocaleDateString('es-CO', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[200px] truncate">{pedido.asunto}</td>
                  <td className="px-3 py-2 text-xs text-right">
                    ${(pedido.subtotal / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="outline" className="text-[10px] h-5">{pedido.moneda}</Badge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {pedido.pagoConfirmado ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600 mx-auto" />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={pedido.cantidadPendienteCompra > 0 ? 'secondary' : 'outline'} className="text-xs">
                      {pedido.cantidadPendienteCompra}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs px-2"
                        onClick={() => abrirModal(pedido.id)}
                      >
                        Ver
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-sm">Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">Descargar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pedidosFiltrados.length === 0 && (
          <div className="p-8 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron pedidos</p>
          </div>
        )}
      </Card>

      {/* Lista - Mobile & Tablet */}
      <div className="lg:hidden space-y-2">
        {pedidosFiltrados.map((pedido) => (
          <Card key={pedido.id} className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">#{pedido.numero}</span>
                {getEstadoBadge(pedido.estado)}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 text-xs px-2"
                onClick={() => abrirModal(pedido.id)}
              >
                Ver
              </Button>
            </div>
            <h4 className="mb-1 truncate">{pedido.razonSocial}</h4>
            <p className="text-xs text-muted-foreground mb-2 truncate">{pedido.asunto}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium">${(pedido.subtotal / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pago</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {pedido.pagoConfirmado ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <Clock className="h-3 w-3 text-yellow-600" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Pend</p>
                <p>{pedido.cantidadPendienteCompra}</p>
              </div>
            </div>
          </Card>
        ))}
        {pedidosFiltrados.length === 0 && (
          <Card className="p-8 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron pedidos</p>
          </Card>
        )}
      </div>
        </>
      )}

      {/* Vista Kanban */}
      {vista === 'kanban' && (
        <Card className="p-3 overflow-hidden h-[calc(100vh-280px)] md:h-[calc(100vh-240px)]">
          <PedidosKanban
            onVerDetalle={(pedidoId) => abrirModal(pedidoId)}
          />
        </Card>
      )}

      {/* Modal de Detalles - Completamente Responsive */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-3xl w-[95vw] md:w-full max-h-[92vh] md:max-h-[90vh] overflow-hidden flex flex-col p-0">
          {pedidoActual && (
            <>
              <DialogHeader className="px-3 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base md:text-lg truncate">Pedido #{pedidoActual.numero}</DialogTitle>
                    <DialogDescription className="sr-only">
                      Detalles del pedido con información de despacho, observaciones y actividades
                    </DialogDescription>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">{pedidoActual.razonSocial}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={cerrarModal}
                    className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </Button>
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-3 md:mx-6 mt-2 md:mt-4 grid w-auto grid-cols-4 flex-shrink-0 h-8 md:h-9">
                  <TabsTrigger value="general" className="text-[10px] md:text-xs px-1 md:px-3">
                    <FileText className="h-3 w-3 md:mr-1" />
                    <span className="hidden sm:inline">General</span>
                  </TabsTrigger>
                  <TabsTrigger value="despacho" className="text-[10px] md:text-xs px-1 md:px-3">
                    <Truck className="h-3 w-3 md:mr-1" />
                    <span className="hidden sm:inline">Despacho</span>
                  </TabsTrigger>
                  <TabsTrigger value="observaciones" className="text-[10px] md:text-xs px-1 md:px-3">
                    <MessageSquare className="h-3 w-3 md:mr-1" />
                    <span className="hidden sm:inline">Notas</span>
                  </TabsTrigger>
                  <TabsTrigger value="intangibles" className="text-[10px] md:text-xs px-1 md:px-3">
                    <Settings className="h-3 w-3 md:mr-1" />
                    <span className="hidden sm:inline">Intang.</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4">
                  <TabsContent value="general" className="mt-0 space-y-3 md:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-sm">
                      <div>
                        <Label className="text-[10px] md:text-xs">NIT</Label>
                        <p className="mt-1 text-xs md:text-sm">{pedidoActual.nit}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] md:text-xs">Contacto</Label>
                        <p className="mt-1 text-xs md:text-sm">{pedidoActual.contacto}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] md:text-xs">Email</Label>
                        <p className="mt-1 text-xs md:text-sm truncate">{pedidoActual.email}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] md:text-xs">Teléfono</Label>
                        <p className="mt-1 text-xs md:text-sm">{pedidoActual.telefono}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] md:text-xs">Asunto</Label>
                        <p className="mt-1 text-xs md:text-sm">{pedidoActual.asunto}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] md:text-xs">Términos Pago</Label>
                        <p className="mt-1 text-xs md:text-sm">{pedidoActual.terminosPago}</p>
                      </div>
                      <div>
                        <Label className="text-[10px] md:text-xs">Subtotal</Label>
                        <p className="mt-1 text-xs md:text-sm font-medium">
                          ${pedidoActual.subtotal.toLocaleString('es-CO')} {pedidoActual.moneda}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2 md:pt-3 border-t border-border">
                      <Label className="text-[10px] md:text-xs mb-2 block">Estados</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          {pedidoActual.pagoConfirmado ? (
                            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-600" />
                          )}
                          <span className="text-[10px] md:text-xs">
                            Pago {pedidoActual.pagoConfirmado ? 'Confirmado' : 'Pendiente'}
                          </span>
                        </div>
                        <div className="text-[10px] md:text-xs">
                          Fact. Anticip: <Badge variant="outline" className="ml-1 text-[10px]">
                            {pedidoActual.facturacionAnticipadaRequerida}
                          </Badge>
                        </div>
                        <div className="text-[10px] md:text-xs">
                          Remisión: <Badge variant="outline" className="ml-1 text-[10px]">
                            {pedidoActual.estadoRemision}
                          </Badge>
                        </div>
                        <div className="text-[10px] md:text-xs">
                          Factura: <Badge variant="outline" className="ml-1 text-[10px]">
                            {pedidoActual.estadoFactura}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="despacho" className="mt-0 space-y-4">
                    {despachoActual ? (
                      <>
                        <div className="flex items-center justify-between">
                          {despachoActual.bloqueado && (
                            <Badge variant="secondary" className="text-xs">Bloqueado</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setModalDespacho(true)}
                            className="gap-2 ml-auto"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            {despachoActual.bloqueado ? 'Ver Despacho' : 'Editar Despacho'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-xs">Recibe</Label>
                            <p className="mt-1">{despachoActual.nombreRecibe}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Teléfono</Label>
                            <p className="mt-1">{despachoActual.telefono}</p>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Dirección</Label>
                            <p className="mt-1">{despachoActual.direccion}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Departamento</Label>
                            <p className="mt-1">{despachoActual.departamento}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Ciudad</Label>
                            <p className="mt-1">{despachoActual.ciudad}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Horario</Label>
                            <p className="mt-1">{despachoActual.horarioEntrega}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Email Guía</Label>
                            <p className="mt-1 truncate">{despachoActual.emailGuia}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                          <div className="text-xs">
                            <Label className="text-xs">Despacho</Label>
                            <Badge variant="outline" className="mt-1 text-[10px]">
                              {despachoActual.tipoDespacho}
                            </Badge>
                          </div>
                          <div className="text-xs">
                            <Label className="text-xs">Factura</Label>
                            <Badge variant="outline" className="mt-1 text-[10px]">
                              {despachoActual.tipoFactura}
                            </Badge>
                          </div>
                          <div className="text-xs">
                            <Label className="text-xs">Confirmación</Label>
                            <Badge variant="outline" className="mt-1 text-[10px]">
                              {despachoActual.facturaConConfirmacion}
                            </Badge>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">Sin información de despacho</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModalDespacho(true)}
                          className="gap-2"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Agregar Información
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="observaciones" className="mt-0 space-y-4">
                    {observacionesActuales.length > 0 ? (
                      <div className="space-y-3">
                        {observacionesActuales.map(obs => (
                          <Card key={obs.id} className="p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs">
                                  <span className="font-medium">{obs.remitente}</span>
                                  <span className="text-muted-foreground"> → {obs.destinatarios[0]}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(obs.creadoEn).toLocaleString('es-CO')}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm">{obs.texto}</p>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Sin observaciones</p>
                      </div>
                    )}
                    <div className="pt-3 border-t border-border">
                      <Label className="text-xs">Nueva Observación</Label>
                      <Textarea className="mt-2 text-sm" placeholder="Escribe aquí..." rows={2} />
                      <Button size="sm" className="mt-2">Publicar</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="intangibles" className="mt-0">
                    <div className="text-center py-8">
                      <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">Licenciamiento y Garantías</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        ADP · Apple · Garantías · Licencias
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setModalLicenciamiento(true)}
                        className="gap-2"
                      >
                        <Award className="h-3.5 w-3.5" />
                        Gestionar
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Despacho */}
      {pedidoActual && (
        <DespachoModal
          open={modalDespacho}
          onOpenChange={setModalDespacho}
          pedidoId={pedidoActual.id}
          pedidoNumero={pedidoActual.numero}
          despachoExistente={despachoActual}
        />
      )}

      {/* Modal de Licenciamiento */}
      {pedidoActual && (
        <LicenciamientoModal
          open={modalLicenciamiento}
          onOpenChange={setModalLicenciamiento}
          pedidoId={pedidoActual.id}
          pedidoNumero={pedidoActual.numero}
        />
      )}
    </div>
  );
}