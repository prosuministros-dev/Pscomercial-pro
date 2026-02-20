import { 
  FileText,
  Package,
  DollarSign,
  MapPin,
  ShoppingBag,
  Truck,
  Clock,
  User,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { OrdenesCompra } from './ordenes-compra';
import { GestionDespachos } from './gestion-despachos';

interface DetallePedidoProps {
  pedidoId: string;
}

// Mock data del pedido
const pedidoDetalle = {
  id: '1',
  numero: 'PED-2025-001',
  estado: 'en_bodega',
  
  // Cotización origen
  cotizacionOrigen: {
    numero: 'COT-0025192',
    version: 'V 1',
    fecha: 'diciembre 30 de 2025'
  },
  
  // Información comercial
  cliente: 'ALLIANZ TECHNOLOGY S.E, SUCURSAL COLOMBIANA',
  nit: '901595160',
  contacto: 'LORENA RIVAS',
  cargo: 'COMPRAS',
  celular: '+573160242459',
  correo: 'lorena.rivas@allianz.co',
  ciudad: 'BOGOTA',
  
  // Condiciones operativas
  fechaEntrega: '2025-02-05',
  formaPago: 'Crédito 30 días',
  moneda: 'PESOS',
  entregaEstimada: '5 DIAS CALENDARIO',
  
  // Condiciones financieras
  subtotal: 80335,
  iva: 15263.65,
  total: 95598.65,
  pagoConfirmado: true,
  facturacionAnticipada: 'No',
  estadoRemision: 'Generada',
  estadoFactura: 'Pendiente',
  
  // Destino
  direccionEntrega: 'Calle 25C Bis # 73B-63',
  ciudadEntrega: 'BOGOTA',
  contactoRecepcion: 'LORENA RIVAS',
  telefonoRecepcion: '+573160242459',
  horarioEntrega: '8:00 AM - 5:00 PM',
  
  // Productos
  productos: [
    {
      noParte: '4X20M2626',
      descripcion: 'CARGADOR NOTEBOOK 65W TIPO C/ADAPTADOR DE CORRIENTE DE 65 W DE LENOVO (USB TIPO C)',
      marca: 'LENOVO',
      cantidad: 1,
      valorUnitario: 80335,
      entrega: '2 DIAS HABILES',
      garantia: '12 MESES'
    }
  ],
  
  // Órdenes de compra
  ordenesCompra: [
    {
      numero: '0016133',
      proveedor: 'OSAKA ELECTRONICS S.A.S',
      fechaEmision: '2025-01-15',
      fechaEntregaEstimada: '2025-01-20',
      estado: 'completada',
      total: 87058.82
    }
  ],
  
  // Logística
  tipoDespacho: 'Envío a domicilio',
  transportadora: 'SERVIENTREGA',
  numeroGuia: 'SER-2025-00123',
  fechaDespacho: '2025-01-22',
  fechaEntregaReal: null,
  estadoLogistico: 'En bodega',
  
  // Historial / Trazabilidad
  historial: [
    {
      fecha: '2025-01-19 14:30',
      evento: 'Pedido creado',
      usuario: 'DANIEL VALBUENA',
      detalle: 'Pedido creado desde cotización COT-0025192'
    },
    {
      fecha: '2025-01-19 14:45',
      evento: 'Pago confirmado',
      usuario: 'FINANZAS',
      detalle: 'Pago recibido y confirmado - Crédito 30 días'
    },
    {
      fecha: '2025-01-20 09:15',
      evento: 'Orden de compra generada',
      usuario: 'ANDRES VALBUENA',
      detalle: 'OC-0016133 generada para OSAKA ELECTRONICS'
    },
    {
      fecha: '2025-01-22 16:00',
      evento: 'Mercancía recibida',
      usuario: 'BODEGA',
      detalle: 'Productos recibidos y verificados en bodega'
    }
  ]
};

export function DetallePedido({ pedidoId }: DetallePedidoProps) {
  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="operativo">Operativo</TabsTrigger>
        <TabsTrigger value="oc">OC</TabsTrigger>
        <TabsTrigger value="logistica">Despachos</TabsTrigger>
        <TabsTrigger value="historial">Historial</TabsTrigger>
      </TabsList>

      {/* TAB: GENERAL */}
      <TabsContent value="general" className="space-y-4">
        {/* Identificación del Pedido */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-primary" />
            <h4>Identificación del Pedido</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Número de Pedido</Label>
              <p className="font-mono text-sm font-medium mt-1">{pedidoDetalle.numero}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Estado Actual</Label>
              <Badge variant="outline" className="mt-1 bg-blue-500/10 border-blue-500/30 text-blue-700">
                En Bodega
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Badge variant="outline" className="mt-1 bg-blue-500/10 border-blue-500/30 text-blue-700">
                Pedido Físico
              </Badge>
            </div>
          </div>
        </Card>

        {/* Cotización Origen */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4>Cotización Origen</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Número</Label>
              <p className="font-medium mt-1">
                COT-{pedidoDetalle.cotizacionOrigen.numero} {pedidoDetalle.cotizacionOrigen.version}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fecha Cotización</Label>
              <p className="mt-1">{pedidoDetalle.cotizacionOrigen.fecha}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Badge variant="outline" className="mt-1">Aprobada</Badge>
            </div>
          </div>
        </Card>

        {/* Información Comercial */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" />
            <h4>Información Comercial</h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="font-medium mt-1">{pedidoDetalle.cliente}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">NIT</Label>
                <p className="mt-1">{pedidoDetalle.nit}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Contacto</Label>
                <p className="mt-1">{pedidoDetalle.contacto}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cargo</Label>
                <p className="mt-1">{pedidoDetalle.cargo}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Celular</Label>
                <p className="mt-1">{pedidoDetalle.celular}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Correo</Label>
                <p className="mt-1 text-primary truncate">{pedidoDetalle.correo}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Productos */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h4>Productos</h4>
          </div>
          <div className="space-y-3">
            {pedidoDetalle.productos.map((prod, idx) => (
              <div key={idx} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">{prod.noParte}</p>
                    <Badge variant="outline" className="text-xs mt-1">{prod.marca}</Badge>
                  </div>
                  <p className="text-sm font-medium">×{prod.cantidad}</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{prod.descripcion}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entrega</p>
                    <p className="font-medium">{prod.entrega}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Garantía</p>
                    <p className="font-medium">{prod.garantia}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Valor</p>
                    <p className="font-medium">${prod.valorUnitario.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Condiciones Financieras */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-primary" />
            <h4>Condiciones Financieras</h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Forma de Pago</Label>
                <p className="mt-1">{pedidoDetalle.formaPago}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Moneda</Label>
                <p className="mt-1">{pedidoDetalle.moneda}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Pago Confirmado</Label>
                <Badge variant={pedidoDetalle.pagoConfirmado ? 'default' : 'secondary'} className="mt-1 text-xs">
                  {pedidoDetalle.pagoConfirmado ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${pedidoDetalle.subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (19%)</span>
                <span className="font-medium">${pedidoDetalle.iva.toLocaleString('es-CO')}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">TOTAL</span>
                <span className="text-xl font-bold text-primary">
                  ${pedidoDetalle.total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Estado Remisión</Label>
                <Badge variant="outline" className="mt-1">{pedidoDetalle.estadoRemision}</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Estado Factura</Label>
                <Badge variant="outline" className="mt-1">{pedidoDetalle.estadoFactura}</Badge>
              </div>
            </div>
          </div>
        </Card>
      </TabsContent>

      {/* TAB: OPERATIVO */}
      <TabsContent value="operativo" className="space-y-4">
        {/* Condiciones Operativas */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h4>Condiciones Operativas</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Fecha de Entrega Comprometida</Label>
              <p className="font-medium mt-1">
                {new Date(pedidoDetalle.fechaEntrega).toLocaleDateString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tiempo de Entrega</Label>
              <p className="mt-1">{pedidoDetalle.entregaEstimada}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Facturación Anticipada</Label>
              <Badge variant="outline" className="mt-1">{pedidoDetalle.facturacionAnticipada}</Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tipo de Despacho</Label>
              <p className="mt-1">{pedidoDetalle.tipoDespacho}</p>
            </div>
          </div>
        </Card>

        {/* Destinos */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <h4>Destino de Entrega</h4>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Dirección</Label>
              <p className="font-medium mt-1">{pedidoDetalle.direccionEntrega}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Ciudad</Label>
                <p className="mt-1">{pedidoDetalle.ciudadEntrega}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Horario de Entrega</Label>
                <p className="mt-1">{pedidoDetalle.horarioEntrega}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Contacto Recepción</Label>
                <p className="mt-1">{pedidoDetalle.contactoRecepcion}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <p className="mt-1">{pedidoDetalle.telefonoRecepcion}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Órdenes de Compra */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h4>Órdenes de Compra Asociadas</h4>
          </div>
          <div className="space-y-3">
            {pedidoDetalle.ordenesCompra.map((oc, idx) => (
              <div key={idx} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-mono text-sm font-medium">OC-{oc.numero}</p>
                    <p className="text-sm text-muted-foreground">{oc.proveedor}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-700">
                    Completada
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Emisión</p>
                    <p className="font-medium">
                      {new Date(oc.fechaEmision).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entrega Est.</p>
                    <p className="font-medium">
                      {new Date(oc.fechaEntregaEstimada).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">${oc.total.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      {/* TAB: LOGÍSTICA */}
      <TabsContent value="logistica" className="space-y-4">
        <GestionDespachos pedidoId={pedidoId} />
      </TabsContent>

      {/* TAB: OC */}
      <TabsContent value="oc" className="space-y-4">
        <OrdenesCompra pedidoId={pedidoId} />
      </TabsContent>

      {/* TAB: HISTORIAL */}
      <TabsContent value="historial" className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h4>Trazabilidad Completa</h4>
          </div>
          
          <div className="space-y-3">
            {pedidoDetalle.historial.map((evento, idx) => (
              <div key={idx} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:border-l-0 last:pb-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{evento.evento}</p>
                      <p className="text-xs text-muted-foreground">{evento.usuario}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{evento.fecha}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{evento.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}