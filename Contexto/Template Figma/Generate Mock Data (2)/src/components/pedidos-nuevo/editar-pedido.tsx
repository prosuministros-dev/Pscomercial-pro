import { useState } from 'react';
import { 
  Edit3,
  Package,
  Truck,
  DollarSign,
  MapPin,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';

interface EditarPedidoProps {
  pedidoId: string | null;
  onCerrar: () => void;
  onGuardar: (data: any) => void;
}

export function EditarPedido({ pedidoId, onCerrar, onGuardar }: EditarPedidoProps) {
  // Estados del pedido (mock data inicial)
  const [estadoPedido, setEstadoPedido] = useState('en_bodega');
  const [tipoPedido, setTipoPedido] = useState<'fisico' | 'intangible'>('fisico');
  
  // Información operativa
  const [fechaEntrega, setFechaEntrega] = useState('2025-02-05');
  const [direccionEntrega, setDireccionEntrega] = useState('Calle 25C Bis # 73B-63');
  const [ciudadEntrega, setCiudadEntrega] = useState('BOGOTA');
  const [departamentoEntrega, setDepartamentoEntrega] = useState('CUNDINAMARCA');
  const [contactoRecepcion, setContactoRecepcion] = useState('LORENA RIVAS');
  const [telefonoRecepcion, setTelefonoRecepcion] = useState('+573160242459');
  const [horarioEntrega, setHorarioEntrega] = useState('8:00 AM - 5:00 PM');
  
  // Información financiera
  const [pagoConfirmado, setPagoConfirmado] = useState(true);
  const [facturacionAnticipada, setFacturacionAnticipada] = useState('no');
  const [estadoRemision, setEstadoRemision] = useState('generada');
  const [estadoFactura, setEstadoFactura] = useState('pendiente');
  const [numeroRemision, setNumeroRemision] = useState('REM-2025-001');
  const [numeroFactura, setNumeroFactura] = useState('');
  
  // Información de despacho
  const [tipoDespacho, setTipoDespacho] = useState('envio');
  const [transportadora, setTransportadora] = useState('SERVIENTREGA');
  const [numeroGuia, setNumeroGuia] = useState('SER-2025-00123');
  const [fechaDespacho, setFechaDespacho] = useState('2025-01-22');
  const [fechaEntregaReal, setFechaEntregaReal] = useState('');
  const [estadoLogistico, setEstadoLogistico] = useState('en_bodega');
  
  // Información de intangibles (licencias)
  const [tipoLicencia, setTipoLicencia] = useState('');
  const [fechaActivacion, setFechaActivacion] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [codigoActivacion, setCodigoActivacion] = useState('');
  const [emailActivacion, setEmailActivacion] = useState('');
  
  // Observaciones
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [observaciones, setObservaciones] = useState<string[]>([]);

  const handleGuardar = () => {
    // Validaciones básicas
    if (!fechaEntrega || !direccionEntrega || !ciudadEntrega) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const datosActualizados = {
      id: pedidoId,
      estadoPedido,
      tipoPedido,
      // Operativo
      fechaEntrega,
      direccionEntrega,
      ciudadEntrega,
      departamentoEntrega,
      contactoRecepcion,
      telefonoRecepcion,
      horarioEntrega,
      // Financiero
      pagoConfirmado,
      facturacionAnticipada,
      estadoRemision,
      estadoFactura,
      numeroRemision,
      numeroFactura,
      // Despacho
      tipoDespacho,
      transportadora,
      numeroGuia,
      fechaDespacho,
      fechaEntregaReal,
      estadoLogistico,
      // Intangibles
      tipoLicencia,
      fechaActivacion,
      fechaVencimiento,
      codigoActivacion,
      emailActivacion,
      // Observaciones
      observaciones: [...observaciones, nuevaObservacion].filter(o => o)
    };

    onGuardar(datosActualizados);
    toast.success('Pedido actualizado exitosamente');
  };

  const agregarObservacion = () => {
    if (nuevaObservacion.trim()) {
      setObservaciones([...observaciones, nuevaObservacion]);
      setNuevaObservacion('');
      toast.success('Observación agregada');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-1">Editar Pedido PED-2025-001</h3>
          <p className="text-xs text-muted-foreground">
            Modifica estados, información operativa y logística
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} className="gap-2">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="operativo">Operativo</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="logistica">Logística</TabsTrigger>
          <TabsTrigger value="intangibles">Intangibles</TabsTrigger>
        </TabsList>

        {/* TAB: GENERAL */}
        <TabsContent value="general" className="space-y-4">
          {/* Estados del Pedido */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-primary" />
              <h4>Estados del Pedido</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Estado Principal</Label>
                <Select value={estadoPedido} onValueChange={setEstadoPedido}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="por_facturar">Por Facturar</SelectItem>
                    <SelectItem value="facturado_sin_pago">Facturado Sin Pago</SelectItem>
                    <SelectItem value="pendiente_compra">Pendiente Compra</SelectItem>
                    <SelectItem value="en_bodega">En Bodega</SelectItem>
                    <SelectItem value="despachado">Despachado</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Tipo de Pedido</Label>
                <Select value={tipoPedido} onValueChange={(v) => setTipoPedido(v as 'fisico' | 'intangible')}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisico">🔵 Pedido Físico</SelectItem>
                    <SelectItem value="intangible">🟣 Licencias/Intangibles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Estado Actual:</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={tipoPedido === 'fisico' 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-700'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-700'
                  }
                >
                  {tipoPedido === 'fisico' ? '🔵 Físico' : '🟣 Intangible'}
                </Badge>
                <Badge variant="outline">
                  {estadoPedido.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Información Comercial (Solo Lectura) */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h4>Información Comercial (Solo Lectura)</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="mt-1 font-medium">ALLIANZ TECHNOLOGY S.E.</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">NIT</Label>
                <p className="mt-1">901595160</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total</Label>
                <p className="mt-1 font-medium text-primary">$95,598.65 COP</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cotización Origen</Label>
                <p className="mt-1">COT-0025192</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: OPERATIVO */}
        <TabsContent value="operativo" className="space-y-4">
          {/* Condiciones de Entrega */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <h4>Condiciones de Entrega</h4>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">
                    Fecha de Entrega Comprometida <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Tipo de Despacho</Label>
                  <Select value={tipoDespacho} onValueChange={setTipoDespacho}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="envio">Envío a domicilio</SelectItem>
                      <SelectItem value="retiro">Retiro en tienda</SelectItem>
                      <SelectItem value="mensajeria">Mensajería</SelectItem>
                      <SelectItem value="transportadora">Transportadora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Dirección de Entrega */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <h4>Dirección de Entrega</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm">
                  Dirección Completa <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={direccionEntrega}
                  onChange={(e) => setDireccionEntrega(e.target.value)}
                  placeholder="Ej: Calle 25C Bis # 73B-63"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">
                    Ciudad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={ciudadEntrega}
                    onChange={(e) => setCiudadEntrega(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Departamento</Label>
                  <Input
                    value={departamentoEntrega}
                    onChange={(e) => setDepartamentoEntrega(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Horario de Entrega</Label>
                <Input
                  value={horarioEntrega}
                  onChange={(e) => setHorarioEntrega(e.target.value)}
                  placeholder="Ej: 8:00 AM - 5:00 PM"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          {/* Contacto de Recepción */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-primary" />
              <h4>Contacto de Recepción</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">
                  Nombre Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={contactoRecepcion}
                  onChange={(e) => setContactoRecepcion(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={telefonoRecepcion}
                  onChange={(e) => setTelefonoRecepcion(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: FINANCIERO */}
        <TabsContent value="financiero" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-primary" />
              <h4>Estados Financieros</h4>
            </div>
            
            <div className="space-y-4">
              {/* Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Estado del Pago</Label>
                  <Select 
                    value={pagoConfirmado ? 'confirmado' : 'pendiente'} 
                    onValueChange={(v) => setPagoConfirmado(v === 'confirmado')}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Facturación Anticipada</Label>
                  <Select value={facturacionAnticipada} onValueChange={setFacturacionAnticipada}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="si">Sí</SelectItem>
                      <SelectItem value="requerida">Requerida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Remisión */}
              <div>
                <h4 className="text-sm font-medium mb-3">Remisión</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Estado Remisión</Label>
                    <Select value={estadoRemision} onValueChange={setEstadoRemision}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="generada">Generada</SelectItem>
                        <SelectItem value="enviada">Enviada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Número de Remisión</Label>
                    <Input
                      value={numeroRemision}
                      onChange={(e) => setNumeroRemision(e.target.value)}
                      placeholder="REM-2025-XXX"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Factura */}
              <div>
                <h4 className="text-sm font-medium mb-3">Factura</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Estado Factura</Label>
                    <Select value={estadoFactura} onValueChange={setEstadoFactura}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="generada">Generada</SelectItem>
                        <SelectItem value="enviada">Enviada</SelectItem>
                        <SelectItem value="pagada">Pagada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Número de Factura</Label>
                    <Input
                      value={numeroFactura}
                      onChange={(e) => setNumeroFactura(e.target.value)}
                      placeholder="FAC-2025-XXX"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: LOGÍSTICA */}
        <TabsContent value="logistica" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-4 w-4 text-primary" />
              <h4>Información de Despacho</h4>
            </div>
            
            <div className="space-y-4">
              {/* Estado Logístico */}
              <div>
                <Label className="text-sm">Estado Logístico</Label>
                <Select value={estadoLogistico} onValueChange={setEstadoLogistico}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente_compra">Pendiente Compra</SelectItem>
                    <SelectItem value="en_bodega">En Bodega</SelectItem>
                    <SelectItem value="preparando_despacho">Preparando Despacho</SelectItem>
                    <SelectItem value="despachado">Despachado</SelectItem>
                    <SelectItem value="en_transito">En Tránsito</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Transportadora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Transportadora</Label>
                  <Select value={transportadora} onValueChange={setTransportadora}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVIENTREGA">SERVIENTREGA</SelectItem>
                      <SelectItem value="COORDINADORA">COORDINADORA</SelectItem>
                      <SelectItem value="DEPRISA">DEPRISA</SelectItem>
                      <SelectItem value="ENVIA">ENVIA</SelectItem>
                      <SelectItem value="TCC">TCC</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Número de Guía</Label>
                  <Input
                    value={numeroGuia}
                    onChange={(e) => setNumeroGuia(e.target.value)}
                    placeholder="Número de guía de transporte"
                    className="mt-2"
                  />
                </div>
              </div>

              <Separator />

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Fecha de Despacho</Label>
                  <Input
                    type="date"
                    value={fechaDespacho}
                    onChange={(e) => setFechaDespacho(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Fecha de Entrega Real</Label>
                  <Input
                    type="date"
                    value={fechaEntregaReal}
                    onChange={(e) => setFechaEntregaReal(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Dejar vacío si aún no se ha entregado
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: INTANGIBLES */}
        <TabsContent value="intangibles" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h4>Información de Licencias</h4>
            </div>
            
            {tipoPedido === 'intangible' ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Tipo de Licencia</Label>
                  <Input
                    value={tipoLicencia}
                    onChange={(e) => setTipoLicencia(e.target.value)}
                    placeholder="Ej: Microsoft 365, Adobe Creative Cloud"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Fecha de Activación</Label>
                    <Input
                      type="date"
                      value={fechaActivacion}
                      onChange={(e) => setFechaActivacion(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Código de Activación</Label>
                  <Input
                    value={codigoActivacion}
                    onChange={(e) => setCodigoActivacion(e.target.value)}
                    placeholder="Código o clave de licencia"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm">Email de Activación</Label>
                  <Input
                    type="email"
                    value={emailActivacion}
                    onChange={(e) => setEmailActivacion(e.target.value)}
                    placeholder="Email donde se activó la licencia"
                    className="mt-2"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Esta sección solo aplica para pedidos de tipo Intangible/Licencias
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cambia el tipo de pedido en la pestaña General
                </p>
              </div>
            )}
          </Card>

          {/* Observaciones para Intangibles */}
          {tipoPedido === 'intangible' && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-primary" />
                <h4>Observaciones</h4>
              </div>
              
              <div className="space-y-3">
                {observaciones.map((obs, idx) => (
                  <div key={idx} className="bg-muted/30 rounded-lg p-3 text-sm">
                    {obs}
                  </div>
                ))}
                
                <div>
                  <Textarea
                    value={nuevaObservacion}
                    onChange={(e) => setNuevaObservacion(e.target.value)}
                    placeholder="Agregar observación sobre la licencia..."
                    rows={3}
                  />
                  <Button 
                    size="sm" 
                    onClick={agregarObservacion}
                    className="mt-2"
                    disabled={!nuevaObservacion.trim()}
                  >
                    Agregar Observación
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer con botones */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-1">Guardar Cambios</h4>
            <p className="text-xs text-muted-foreground">
              Los cambios se guardarán y se registrará un evento en el historial de trazabilidad del pedido.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}