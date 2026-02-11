import { useState } from 'react';
import { 
  ShoppingBag,
  Plus,
  Eye,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';

interface OrdenCompra {
  id: string;
  numeroOC: string;
  pedidoAsociado: string;
  estado: 'creada' | 'enviada_proveedor' | 'confirmada_proveedor' | 'recibida' | 'cerrada' | 'cancelada';
  fechaCreacion: string;
  usuarioCreador: string;
  // Proveedor
  nombreProveedor: string;
  identificacionProveedor: string;
  tipoProveedor: string;
  contactoProveedor: string;
  emailProveedor: string;
  // Económico
  valorTotal: number;
  moneda: string;
  condicionPago: string;
  fechaEstimadaPago?: string;
  // Fechas
  fechaEstimadaEntrega?: string;
  fechaRealEntrega?: string;
  // Items
  items: {
    noParte: string;
    descripcion: string;
    cantidad: number;
    observacion?: string;
  }[];
  // Trazabilidad
  historial: {
    evento: string;
    estadoAnterior: string;
    estadoNuevo: string;
    usuario: string;
    fecha: string;
    hora: string;
  }[];
}

interface OrdenesCompraProps {
  pedidoId: string;
}

// Mock data
const ordenesCompraMock: OrdenCompra[] = [
  {
    id: '1',
    numeroOC: '0016133',
    pedidoAsociado: 'PED-2025-001',
    estado: 'recibida',
    fechaCreacion: '2025-01-15 09:30:00',
    usuarioCreador: 'ANDRES VALBUENA',
    nombreProveedor: 'OSAKA ELECTRONICS S.A.S',
    identificacionProveedor: '900123456',
    tipoProveedor: 'Distribuidor Autorizado',
    contactoProveedor: 'Carlos Mendez',
    emailProveedor: 'compras@osaka.com.co',
    valorTotal: 87058.82,
    moneda: 'COP',
    condicionPago: 'Crédito 30 días',
    fechaEstimadaPago: '2025-02-15',
    fechaEstimadaEntrega: '2025-01-20',
    fechaRealEntrega: '2025-01-22',
    items: [
      {
        noParte: '4X20M2626',
        descripcion: 'CARGADOR NOTEBOOK 65W TIPO C',
        cantidad: 1,
        observacion: 'Original de fábrica'
      }
    ],
    historial: [
      {
        evento: 'OC Creada',
        estadoAnterior: '',
        estadoNuevo: 'creada',
        usuario: 'ANDRES VALBUENA',
        fecha: '2025-01-15',
        hora: '09:30:00'
      },
      {
        evento: 'OC Enviada al Proveedor',
        estadoAnterior: 'creada',
        estadoNuevo: 'enviada_proveedor',
        usuario: 'ANDRES VALBUENA',
        fecha: '2025-01-15',
        hora: '10:00:00'
      },
      {
        evento: 'Confirmada por Proveedor',
        estadoAnterior: 'enviada_proveedor',
        estadoNuevo: 'confirmada_proveedor',
        usuario: 'SISTEMA',
        fecha: '2025-01-16',
        hora: '14:30:00'
      },
      {
        evento: 'Mercancía Recibida',
        estadoAnterior: 'confirmada_proveedor',
        estadoNuevo: 'recibida',
        usuario: 'BODEGA',
        fecha: '2025-01-22',
        hora: '16:00:00'
      }
    ]
  }
];

export function OrdenesCompra({ pedidoId }: OrdenesCompraProps) {
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [ocSeleccionada, setOcSeleccionada] = useState<OrdenCompra | null>(null);

  // Estados para crear nueva OC
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [identificacionProveedor, setIdentificacionProveedor] = useState('');
  const [tipoProveedor, setTipoProveedor] = useState('');
  const [contactoProveedor, setContactoProveedor] = useState('');
  const [emailProveedor, setEmailProveedor] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [condicionPago, setCondicionPago] = useState('');
  const [fechaEstimadaEntrega, setFechaEstimadaEntrega] = useState('');

  const getEstadoBadge = (estado: OrdenCompra['estado']) => {
    const config = {
      creada: { label: 'Creada', className: 'bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400' },
      enviada_proveedor: { label: 'Enviada', className: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400' },
      confirmada_proveedor: { label: 'Confirmada', className: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400' },
      recibida: { label: 'Recibida', className: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' },
      cerrada: { label: 'Cerrada', className: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400' },
      cancelada: { label: 'Cancelada', className: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' }
    };

    const { label, className } = config[estado];
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const handleCrearOC = () => {
    if (!nombreProveedor || !identificacionProveedor || !valorTotal) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    // Aquí iría la lógica para crear la OC
    toast.success('Orden de Compra creada exitosamente');
    setModalCrear(false);
    // Reset form
    setNombreProveedor('');
    setIdentificacionProveedor('');
    setTipoProveedor('');
    setContactoProveedor('');
    setEmailProveedor('');
    setValorTotal('');
    setCondicionPago('');
    setFechaEstimadaEntrega('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Órdenes de Compra Asociadas</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Gestión de compras a proveedores para este pedido
          </p>
        </div>
        <Button size="sm" onClick={() => setModalCrear(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva OC
        </Button>
      </div>

      {/* Listado de OC */}
      <div className="space-y-3">
        {ordenesCompraMock.map((oc) => (
          <Card key={oc.id} className="p-4">
            {/* Header de la OC */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="rounded-lg p-2 bg-primary/10">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-sm font-medium">OC-{oc.numeroOC}</p>
                    {getEstadoBadge(oc.estado)}
                  </div>
                  <p className="text-sm font-medium">{oc.nombreProveedor}</p>
                  <p className="text-xs text-muted-foreground">NIT: {oc.identificacionProveedor}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setOcSeleccionada(oc);
                  setModalDetalle(true);
                }}
                className="gap-2"
              >
                <Eye className="h-3.5 w-3.5" />
                Ver Detalle
              </Button>
            </div>

            <Separator className="my-3" />

            {/* Info rápida */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="font-medium">${oc.valorTotal.toLocaleString('es-CO')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Moneda</p>
                <p>{oc.moneda}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creada</p>
                <p>
                  {new Date(oc.fechaCreacion).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Items</p>
                <p>{oc.items.length} producto(s)</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {ordenesCompraMock.length === 0 && (
        <Card className="p-12 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            No hay órdenes de compra asociadas a este pedido
          </p>
          <Button size="sm" variant="outline" onClick={() => setModalCrear(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Primera OC
          </Button>
        </Card>
      )}

      {/* Modal: Crear OC */}
      <Dialog open={modalCrear} onOpenChange={setModalCrear}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Orden de Compra</DialogTitle>
            <DialogDescription>
              Asociar orden de compra al pedido {pedidoId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del Proveedor */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Información del Proveedor</h4>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">
                      Nombre del Proveedor <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={nombreProveedor}
                      onChange={(e) => setNombreProveedor(e.target.value)}
                      placeholder="Razón social completa"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">
                      Identificación (NIT) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={identificacionProveedor}
                      onChange={(e) => setIdentificacionProveedor(e.target.value)}
                      placeholder="NIT sin dígito de verificación"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Tipo de Proveedor</Label>
                    <Select value={tipoProveedor} onValueChange={setTipoProveedor}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distribuidor">Distribuidor Autorizado</SelectItem>
                        <SelectItem value="fabricante">Fabricante</SelectItem>
                        <SelectItem value="importador">Importador</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Contacto del Proveedor</Label>
                    <Input
                      value={contactoProveedor}
                      onChange={(e) => setContactoProveedor(e.target.value)}
                      placeholder="Nombre del contacto"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Email del Proveedor</Label>
                  <Input
                    type="email"
                    value={emailProveedor}
                    onChange={(e) => setEmailProveedor(e.target.value)}
                    placeholder="email@proveedor.com"
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Información Económica */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Información Económica</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">
                    Valor Total <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    placeholder="0.00"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Moneda</Label>
                  <Select value={moneda} onValueChange={setMoneda}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">COP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm">Condición de Pago</Label>
                <Input
                  value={condicionPago}
                  onChange={(e) => setCondicionPago(e.target.value)}
                  placeholder="Ej: Crédito 30 días"
                  className="mt-2"
                />
              </div>
            </Card>

            {/* Fechas */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Fechas</h4>
              </div>

              <div>
                <Label className="text-sm">Fecha Estimada de Entrega</Label>
                <Input
                  type="date"
                  value={fechaEstimadaEntrega}
                  onChange={(e) => setFechaEstimadaEntrega(e.target.value)}
                  className="mt-2"
                />
              </div>
            </Card>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModalCrear(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearOC}>
                Crear Orden de Compra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalle OC */}
      <Dialog open={modalDetalle} onOpenChange={setModalDetalle}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle>Detalle de Orden de Compra</DialogTitle>
            <DialogDescription>
              Información completa y trazabilidad (Solo Lectura)
            </DialogDescription>
          </DialogHeader>

          {ocSeleccionada && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Identificación */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4>Identificación de la OC</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Número OC</Label>
                    <p className="font-mono font-medium mt-1">OC-{ocSeleccionada.numeroOC}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Pedido Asociado</Label>
                    <p className="mt-1">{ocSeleccionada.pedidoAsociado}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <div className="mt-1">{getEstadoBadge(ocSeleccionada.estado)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Creada</Label>
                    <p className="mt-1">{new Date(ocSeleccionada.fechaCreacion).toLocaleString('es-CO')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Creada Por</Label>
                    <p className="mt-1">{ocSeleccionada.usuarioCreador}</p>
                  </div>
                </div>
              </Card>

              {/* Proveedor */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h4>Información del Proveedor</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                    <p className="font-medium mt-1">{ocSeleccionada.nombreProveedor}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">NIT</Label>
                    <p className="mt-1">{ocSeleccionada.identificacionProveedor}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <p className="mt-1">{ocSeleccionada.tipoProveedor}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Contacto</Label>
                    <p className="mt-1">{ocSeleccionada.contactoProveedor}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="mt-1 text-primary">{ocSeleccionada.emailProveedor}</p>
                  </div>
                </div>
              </Card>

              {/* Items */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-primary" />
                  <h4>Items Asociados</h4>
                </div>
                <div className="space-y-3">
                  {ocSeleccionada.items.map((item, idx) => (
                    <div key={idx} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-medium">{item.noParte}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.descripcion}</p>
                        </div>
                        <p className="text-sm font-medium">×{item.cantidad}</p>
                      </div>
                      {item.observacion && (
                        <p className="text-xs text-muted-foreground italic">{item.observacion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Información Económica */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h4>Información Económica</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor Total</Label>
                    <p className="text-xl font-bold text-primary mt-1">
                      ${ocSeleccionada.valorTotal.toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Moneda</Label>
                    <p className="mt-1">{ocSeleccionada.moneda}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Condición de Pago</Label>
                    <p className="mt-1">{ocSeleccionada.condicionPago}</p>
                  </div>
                  {ocSeleccionada.fechaEstimadaPago && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Fecha Estimada Pago</Label>
                      <p className="mt-1">
                        {new Date(ocSeleccionada.fechaEstimadaPago).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Fechas */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4>Fechas de Entrega</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {ocSeleccionada.fechaEstimadaEntrega && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Entrega Estimada</Label>
                      <p className="mt-1">
                        {new Date(ocSeleccionada.fechaEstimadaEntrega).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {ocSeleccionada.fechaRealEntrega ? (
                    <div>
                      <Label className="text-xs text-muted-foreground">Entrega Real</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <p>
                          {new Date(ocSeleccionada.fechaRealEntrega).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs text-muted-foreground">Entrega Real</Label>
                      <Badge variant="outline" className="mt-1">Pendiente</Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Trazabilidad */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-primary" />
                  <h4>Trazabilidad Completa</h4>
                </div>
                <div className="space-y-3">
                  {ocSeleccionada.historial.map((evento, idx) => (
                    <div key={idx} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-l-0 last:pb-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{evento.evento}</p>
                            <p className="text-xs text-muted-foreground">
                              {evento.estadoAnterior && `${evento.estadoAnterior} → `}
                              <span className="font-medium">{evento.estadoNuevo}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{evento.fecha}</p>
                            <p className="text-xs text-muted-foreground">{evento.hora}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Por: {evento.usuario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
