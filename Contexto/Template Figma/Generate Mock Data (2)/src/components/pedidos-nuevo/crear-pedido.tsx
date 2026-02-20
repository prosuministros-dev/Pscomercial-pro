import { useState } from 'react';
import { 
  FileText,
  Lock,
  Edit3,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';

interface CrearPedidoProps {
  onCerrar: () => void;
  onCrear: (data: any) => void;
}

// Mock data de cotizaciones aprobadas
const cotizacionesAprobadas = [
  {
    id: 'COT-0025192',
    numero: '0025192',
    cliente: 'ALLIANZ TECHNOLOGY S.E.',
    nit: '901595160',
    contacto: 'LORENA RIVAS',
    email: 'lorena.rivas@allianz.co',
    telefono: '+573160242459',
    subtotal: 80335,
    iva: 15263.65,
    total: 95598.65,
    moneda: 'COP',
    formaPago: 'Crédito 30 días',
    productos: [
      {
        noParte: '4X20M2626',
        descripcion: 'CARGADOR NOTEBOOK 65W TIPO C',
        cantidad: 1,
        valorUnitario: 80335
      }
    ]
  },
  {
    id: 'COT-0025193',
    numero: '0025193',
    cliente: 'MOTA-ENGIL COLOMBIA',
    nit: '800413315',
    contacto: 'COMPRAS',
    email: 'compras@mota-engil.co',
    telefono: '6014824421',
    subtotal: 7607.35,
    iva: 1443.40,
    total: 9050.75,
    moneda: 'USD',
    formaPago: 'Anticipado',
    productos: [
      {
        noParte: '21KT000NLM',
        descripcion: 'THINKPAD P16S GEN 3',
        cantidad: 5,
        valorUnitario: 1810.15
      }
    ]
  }
];

export function CrearPedido({ onCerrar, onCrear }: CrearPedidoProps) {
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<string>('');
  const [paso, setPaso] = useState<1 | 2>(1);

  // Datos operativos editables
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [ciudadEntrega, setCiudadEntrega] = useState('');
  const [contactoRecepcion, setContactoRecepcion] = useState('');
  const [telefonoRecepcion, setTelefonoRecepcion] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('');
  const [tipoDespacho, setTipoDespacho] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [requiereFacturacionAnticipada, setRequiereFacturacionAnticipada] = useState('no');

  const cotizacion = cotizacionesAprobadas.find(c => c.id === cotizacionSeleccionada);

  const handleSeleccionarCotizacion = () => {
    if (!cotizacionSeleccionada) {
      toast.error('Selecciona una cotización');
      return;
    }
    setPaso(2);
  };

  const handleCrearPedido = () => {
    // Validaciones
    if (!fechaEntrega || !direccionEntrega || !ciudadEntrega || !contactoRecepcion || !telefonoRecepcion) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const nuevoPedido = {
      cotizacionOrigen: cotizacionSeleccionada,
      // Datos comerciales (solo lectura de la cotización)
      cliente: cotizacion?.cliente,
      nit: cotizacion?.nit,
      total: cotizacion?.total,
      // Datos operativos
      fechaEntrega,
      direccionEntrega,
      ciudadEntrega,
      contactoRecepcion,
      telefonoRecepcion,
      horarioEntrega,
      tipoDespacho,
      observaciones,
      requiereFacturacionAnticipada
    };

    onCrear(nuevoPedido);
    toast.success('Pedido creado exitosamente');
  };

  return (
    <div className="space-y-4">
      {/* Paso 1: Seleccionar Cotización */}
      {paso === 1 && (
        <>
          <div>
            <h3 className="mb-1">Seleccionar Cotización Aprobada</h3>
            <p className="text-xs text-muted-foreground">
              El pedido se creará a partir de una cotización ya aprobada
            </p>
          </div>

          <Card className="p-4">
            <Label className="text-sm mb-2 block">Cotización Origen</Label>
            <Select value={cotizacionSeleccionada} onValueChange={setCotizacionSeleccionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una cotización..." />
              </SelectTrigger>
              <SelectContent>
                {cotizacionesAprobadas.map((cot) => (
                  <SelectItem key={cot.id} value={cot.id}>
                    {cot.numero} - {cot.cliente} - ${cot.total.toLocaleString('es-CO')} {cot.moneda}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {cotizacion && (
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3 mb-4">
                <div className="rounded-lg p-2 bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">Cotización #{cotizacion.numero}</h4>
                  <p className="text-sm text-muted-foreground">{cotizacion.cliente}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">NIT</p>
                  <p className="font-medium">{cotizacion.nit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contacto</p>
                  <p className="font-medium">{cotizacion.contacto}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Forma de Pago</p>
                  <p className="font-medium">{cotizacion.formaPago}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-medium text-primary">
                    ${cotizacion.total.toLocaleString('es-CO')} {cotizacion.moneda}
                  </p>
                </div>
              </div>

              <Separator className="my-3" />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Productos</p>
                {cotizacion.productos.map((prod, idx) => (
                  <div key={idx} className="text-sm bg-background rounded-lg p-2 mb-2">
                    <p className="font-medium">{prod.noParte}</p>
                    <p className="text-xs text-muted-foreground">{prod.descripcion}</p>
                    <p className="text-xs mt-1">
                      Cantidad: {prod.cantidad} × ${prod.valorUnitario.toLocaleString('es-CO')}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button onClick={handleSeleccionarCotizacion} disabled={!cotizacionSeleccionada}>
              Continuar
            </Button>
          </div>
        </>
      )}

      {/* Paso 2: Completar Información Operativa */}
      {paso === 2 && cotizacion && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-1">Completar Información Operativa</h3>
              <p className="text-xs text-muted-foreground">
                Datos comerciales bloqueados - Solo información operativa
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPaso(1)}>
              ← Cambiar cotización
            </Button>
          </div>

          {/* Cotización Origen (Solo Lectura) */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm">Cotización Origen (Solo Lectura)</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cotización</p>
                <p className="font-medium">#{cotizacion.numero}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{cotizacion.cliente}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-medium text-primary">
                  ${cotizacion.total.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </Card>

          {/* Información Comercial (Solo Lectura) */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm">Información Comercial (Solo Lectura)</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">NIT</p>
                <p>{cotizacion.nit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Forma de Pago</p>
                <p>{cotizacion.formaPago}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contacto</p>
                <p>{cotizacion.contacto}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="truncate">{cotizacion.email}</p>
              </div>
            </div>
          </Card>

          {/* Información Operativa (Editable) */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="h-4 w-4 text-primary" />
              <h4 className="text-sm">Información Operativa (Editable)</h4>
            </div>

            <div className="space-y-4">
              {/* Fechas y Condiciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">
                    Fecha de Entrega <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Tipo de Despacho</Label>
                  <Select value={tipoDespacho} onValueChange={setTipoDespacho}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="envio">Envío a domicilio</SelectItem>
                      <SelectItem value="retiro">Retiro en tienda</SelectItem>
                      <SelectItem value="mensajeria">Mensajería</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Dirección de Entrega */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Dirección de Entrega</h4>
                
                <div>
                  <Label className="text-sm">
                    Dirección Completa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                    placeholder="Ej: Calle 25C Bis # 73B-63"
                    className="mt-1"
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
                      placeholder="Ej: Bogotá"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Horario de Entrega</Label>
                    <Input
                      value={horarioEntrega}
                      onChange={(e) => setHorarioEntrega(e.target.value)}
                      placeholder="Ej: 8:00 AM - 5:00 PM"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contacto de Recepción */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Contacto de Recepción</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">
                      Nombre Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={contactoRecepcion}
                      onChange={(e) => setContactoRecepcion(e.target.value)}
                      placeholder="Quien recibe el pedido"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">
                      Teléfono <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={telefonoRecepcion}
                      onChange={(e) => setTelefonoRecepcion(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Condiciones Especiales */}
              <div>
                <Label className="text-sm">¿Requiere Facturación Anticipada?</Label>
                <Select value={requiereFacturacionAnticipada} onValueChange={setRequiereFacturacionAnticipada}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="si">Sí</SelectItem>
                  </SelectContent>
                </Select>
                {requiereFacturacionAnticipada === 'si' && (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Se requerirá factura antes del despacho. Esto puede afectar los tiempos de entrega.
                    </p>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <Label className="text-sm">Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Instrucciones especiales, notas internas, etc."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Confirmación */}
          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Confirmación</h4>
                <p className="text-sm text-muted-foreground">
                  Al crear el pedido, se generará automáticamente con el número correlativo y quedará registrado 
                  en el sistema. Los datos comerciales no podrán modificarse ya que provienen de la cotización aprobada.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button onClick={handleCrearPedido}>
              Crear Pedido
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
