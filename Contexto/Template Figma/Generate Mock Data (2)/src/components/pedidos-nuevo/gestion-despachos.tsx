import { useState } from 'react';
import { 
  Truck,
  MapPin,
  Plus,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';

// HU-0017: Cada despacho se gestiona individualmente con su propio ciclo
interface Despacho {
  id: string;
  numeroDespacho: string;
  pedidoAsociado: string;
  destinoNumero: number;
  
  // Estado logístico (HU-0017)
  estadoLogistico: 'pendiente_despacho' | 'en_preparacion' | 'despachado' | 'en_transito' | 'entregado' | 'incidencia_logistica';
  responsableLogistico?: string;
  
  // Destino (heredado de HU-0014)
  direccionEntrega: string;
  ciudad: string;
  departamento: string;
  pais: string;
  contactoRecepcion: string;
  telefonoRecepcion: string;
  emailRecepcion?: string;
  horarioEntrega?: string;
  
  // Fechas logísticas (NO calculadas, NO inferidas)
  fechaEstimadaDespacho?: string;
  fechaRealDespacho?: string;
  fechaEstimadaEntrega?: string;
  fechaRealEntrega?: string;
  
  // Información de transporte
  tipoEnvio?: 'nacional' | 'internacional';
  medioTransporte?: string;
  transportadora?: string;
  numeroGuia?: string;
  
  // Observaciones logísticas
  observaciones: {
    id: string;
    texto: string;
    usuario: string;
    fecha: string;
    hora: string;
  }[];
  
  // Trazabilidad (HU-0017)
  historial: {
    tipoEvento: 'registro' | 'actualizacion';
    estadoAnterior: string;
    estadoNuevo: string;
    usuario: string;
    fecha: string;
    hora: string;
  }[];
}

interface GestionDespachosProps {
  pedidoId: string;
}

// Mock data - Múltiples despachos para un mismo pedido
const despachosMock: Despacho[] = [
  {
    id: '1',
    numeroDespacho: 'DESP-2025-001-1',
    pedidoAsociado: 'PED-2025-001',
    destinoNumero: 1,
    estadoLogistico: 'en_preparacion',
    responsableLogistico: 'JUAN PEREZ',
    direccionEntrega: 'Calle 25C Bis # 73B-63',
    ciudad: 'BOGOTA',
    departamento: 'CUNDINAMARCA',
    pais: 'COLOMBIA',
    contactoRecepcion: 'LORENA RIVAS',
    telefonoRecepcion: '+573160242459',
    emailRecepcion: 'lorena.rivas@allianz.co',
    horarioEntrega: '8:00 AM - 5:00 PM',
    fechaEstimadaDespacho: '2025-01-24',
    fechaEstimadaEntrega: '2025-01-25',
    tipoEnvio: 'nacional',
    medioTransporte: 'Terrestre',
    transportadora: 'SERVIENTREGA',
    numeroGuia: 'SER-2025-00123',
    observaciones: [
      {
        id: '1',
        texto: 'Cliente requiere entrega en horario de mañana',
        usuario: 'LOGISTICA',
        fecha: '2025-01-20',
        hora: '10:30:00'
      }
    ],
    historial: [
      {
        tipoEvento: 'registro',
        estadoAnterior: '',
        estadoNuevo: 'pendiente_despacho',
        usuario: 'DANIEL VALBUENA',
        fecha: '2025-01-19',
        hora: '14:45:00'
      },
      {
        tipoEvento: 'actualizacion',
        estadoAnterior: 'pendiente_despacho',
        estadoNuevo: 'en_preparacion',
        usuario: 'BODEGA',
        fecha: '2025-01-22',
        hora: '16:00:00'
      }
    ]
  },
  {
    id: '2',
    numeroDespacho: 'DESP-2025-001-2',
    pedidoAsociado: 'PED-2025-001',
    destinoNumero: 2,
    estadoLogistico: 'pendiente_despacho',
    responsableLogistico: 'MARIA LOPEZ',
    direccionEntrega: 'Carrera 15 # 88-45',
    ciudad: 'MEDELLIN',
    departamento: 'ANTIOQUIA',
    pais: 'COLOMBIA',
    contactoRecepcion: 'PEDRO GOMEZ',
    telefonoRecepcion: '+573001234567',
    horarioEntrega: '9:00 AM - 6:00 PM',
    fechaEstimadaDespacho: '2025-01-26',
    fechaEstimadaEntrega: '2025-01-28',
    tipoEnvio: 'nacional',
    observaciones: [],
    historial: [
      {
        tipoEvento: 'registro',
        estadoAnterior: '',
        estadoNuevo: 'pendiente_despacho',
        usuario: 'DANIEL VALBUENA',
        fecha: '2025-01-19',
        hora: '14:45:00'
      }
    ]
  }
];

export function GestionDespachos({ pedidoId }: GestionDespachosProps) {
  const [modalEditar, setModalEditar] = useState(false);
  const [despachoSeleccionado, setDespachoSeleccionado] = useState<Despacho | null>(null);
  
  // Estados para edición
  const [estadoLogistico, setEstadoLogistico] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [numeroGuia, setNumeroGuia] = useState('');
  const [fechaRealDespacho, setFechaRealDespacho] = useState('');
  const [fechaRealEntrega, setFechaRealEntrega] = useState('');
  const [nuevaObservacion, setNuevaObservacion] = useState('');

  const getEstadoBadge = (estado: Despacho['estadoLogistico']) => {
    const config = {
      pendiente_despacho: { 
        label: 'Pendiente Despacho', 
        className: 'bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400',
        icon: Clock
      },
      en_preparacion: { 
        label: 'En Preparación', 
        className: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
        icon: Package
      },
      despachado: { 
        label: 'Despachado', 
        className: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
        icon: Truck
      },
      en_transito: { 
        label: 'En Tránsito', 
        className: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
        icon: Truck
      },
      entregado: { 
        label: 'Entregado', 
        className: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
        icon: CheckCircle2
      },
      incidencia_logistica: { 
        label: 'Incidencia', 
        className: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
        icon: AlertCircle
      }
    };

    const { label, className, icon: Icon } = config[estado];
    return (
      <Badge variant="outline" className={`${className} gap-1.5`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleEditarDespacho = (despacho: Despacho) => {
    setDespachoSeleccionado(despacho);
    setEstadoLogistico(despacho.estadoLogistico);
    setTransportadora(despacho.transportadora || '');
    setNumeroGuia(despacho.numeroGuia || '');
    setFechaRealDespacho(despacho.fechaRealDespacho || '');
    setFechaRealEntrega(despacho.fechaRealEntrega || '');
    setModalEditar(true);
  };

  const handleGuardarCambios = () => {
    toast.success('Despacho actualizado exitosamente');
    setModalEditar(false);
  };

  const agregarObservacion = () => {
    if (nuevaObservacion.trim()) {
      toast.success('Observación agregada');
      setNuevaObservacion('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="font-medium">Gestión de Despachos</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Cada despacho se gestiona individualmente con su propio ciclo logístico
        </p>
      </div>

      {/* Listado de Despachos */}
      <div className="space-y-3">
        {despachosMock.map((despacho) => (
          <Card key={despacho.id} className="p-4">
            {/* Header del Despacho */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="rounded-lg p-2 bg-primary/10">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-sm font-medium">{despacho.numeroDespacho}</p>
                    <Badge variant="outline" className="text-xs">Destino #{despacho.destinoNumero}</Badge>
                  </div>
                  <div className="mt-2">{getEstadoBadge(despacho.estadoLogistico)}</div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleEditarDespacho(despacho)}
                className="gap-2"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Gestionar
              </Button>
            </div>

            <Separator className="my-3" />

            {/* Información del Destino */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Destino</p>
                <p className="text-sm font-medium">{despacho.ciudad}</p>
                <p className="text-xs text-muted-foreground">{despacho.direccionEntrega}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Contacto</p>
                <p className="text-sm font-medium">{despacho.contactoRecepcion}</p>
                <p className="text-xs text-muted-foreground">{despacho.telefonoRecepcion}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transportadora</p>
                <p className="text-sm font-medium">{despacho.transportadora || 'Sin asignar'}</p>
                {despacho.numeroGuia && (
                  <p className="text-xs text-muted-foreground font-mono">{despacho.numeroGuia}</p>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Despacho Est.</p>
                <p className="font-medium">
                  {despacho.fechaEstimadaDespacho 
                    ? new Date(despacho.fechaEstimadaDespacho).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Despacho Real</p>
                <p className="font-medium">
                  {despacho.fechaRealDespacho 
                    ? new Date(despacho.fechaRealDespacho).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Entrega Est.</p>
                <p className="font-medium">
                  {despacho.fechaEstimadaEntrega 
                    ? new Date(despacho.fechaEstimadaEntrega).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Entrega Real</p>
                <p className="font-medium">
                  {despacho.fechaRealEntrega 
                    ? new Date(despacho.fechaRealEntrega).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
                    : '-'}
                </p>
              </div>
            </div>

            {/* Observaciones si las hay */}
            {despacho.observaciones.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                    Última observación:
                  </p>
                  <p className="text-xs">
                    {despacho.observaciones[despacho.observaciones.length - 1].texto}
                  </p>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Modal: Gestionar Despacho */}
      <Dialog open={modalEditar} onOpenChange={setModalEditar}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Despacho</DialogTitle>
            <DialogDescription>
              {despachoSeleccionado?.numeroDespacho} - Destino #{despachoSeleccionado?.destinoNumero}
            </DialogDescription>
          </DialogHeader>

          {despachoSeleccionado && (
            <div className="space-y-4">
              {/* Información del Destino (Solo Lectura) */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Información del Destino (Solo Lectura)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">Dirección</Label>
                    <p className="mt-1">{despachoSeleccionado.direccionEntrega}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Ciudad</Label>
                    <p className="mt-1">{despachoSeleccionado.ciudad}, {despachoSeleccionado.departamento}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Contacto</Label>
                    <p className="mt-1">{despachoSeleccionado.contactoRecepcion}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Teléfono</Label>
                    <p className="mt-1">{despachoSeleccionado.telefonoRecepcion}</p>
                  </div>
                </div>
              </Card>

              {/* Estado Logístico */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Estado Logístico</h4>
                </div>
                <div>
                  <Label className="text-sm">Estado Actual</Label>
                  <Select value={estadoLogistico} onValueChange={setEstadoLogistico}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente_despacho">Pendiente de Despacho</SelectItem>
                      <SelectItem value="en_preparacion">En Preparación</SelectItem>
                      <SelectItem value="despachado">Despachado</SelectItem>
                      <SelectItem value="en_transito">En Tránsito</SelectItem>
                      <SelectItem value="entregado">Entregado</SelectItem>
                      <SelectItem value="incidencia_logistica">Incidencia Logística</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* Información de Transporte */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Información de Transporte</h4>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Transportadora</Label>
                      <Select value={transportadora} onValueChange={setTransportadora}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Seleccionar..." />
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
                        placeholder="Número de guía"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Fechas Logísticas */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Fechas Logísticas</h4>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Fecha Estimada Despacho</Label>
                      <Input
                        type="date"
                        value={despachoSeleccionado.fechaEstimadaDespacho || ''}
                        disabled
                        className="mt-2 bg-muted/30"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Solo lectura</p>
                    </div>
                    <div>
                      <Label className="text-sm">Fecha Real Despacho</Label>
                      <Input
                        type="date"
                        value={fechaRealDespacho}
                        onChange={(e) => setFechaRealDespacho(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Fecha Estimada Entrega</Label>
                      <Input
                        type="date"
                        value={despachoSeleccionado.fechaEstimadaEntrega || ''}
                        disabled
                        className="mt-2 bg-muted/30"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Solo lectura</p>
                    </div>
                    <div>
                      <Label className="text-sm">Fecha Real Entrega</Label>
                      <Input
                        type="date"
                        value={fechaRealEntrega}
                        onChange={(e) => setFechaRealEntrega(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Observaciones Logísticas */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Observaciones Logísticas</h4>
                </div>
                
                {/* Observaciones existentes */}
                {despachoSeleccionado.observaciones.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {despachoSeleccionado.observaciones.map((obs) => (
                      <div key={obs.id} className="bg-muted/30 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="flex-1">{obs.texto}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {obs.fecha} {obs.hora}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">Por: {obs.usuario}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nueva observación */}
                <div>
                  <Label className="text-sm">Agregar Observación</Label>
                  <Textarea
                    value={nuevaObservacion}
                    onChange={(e) => setNuevaObservacion(e.target.value)}
                    placeholder="Registrar novedad, incidencia o seguimiento..."
                    rows={3}
                    className="mt-2"
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
              </Card>

              {/* Historial */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Trazabilidad del Despacho</h4>
                </div>
                <div className="space-y-3">
                  {despachoSeleccionado.historial.map((evento, idx) => (
                    <div key={idx} className="relative pl-6 pb-3 border-l-2 border-primary/20 last:border-l-0 last:pb-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                      <div className="bg-muted/30 rounded-lg p-2">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium">
                            {evento.estadoAnterior && `${evento.estadoAnterior} → `}
                            <span className="text-primary">{evento.estadoNuevo}</span>
                          </p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {evento.fecha} {evento.hora}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {evento.tipoEvento} por {evento.usuario}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setModalEditar(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardarCambios}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
