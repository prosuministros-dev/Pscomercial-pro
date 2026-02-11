import { useState } from 'react';
import { 
  X, 
  FileText, 
  Package, 
  DollarSign,
  Copy,
  Download,
  Send,
  ShoppingCart,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';
import { CrearProductoModal } from './crear-producto-modal';

interface DetalleCotizacionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotizacion: any;
  onDuplicar?: () => void;
  onGenerarPedido?: () => void;
}

export function DetalleCotizacionModal({ 
  open, 
  onOpenChange,
  cotizacion,
  onDuplicar,
  onGenerarPedido
}: DetalleCotizacionModalProps) {
  const { gradients } = useTheme();
  const [modalProducto, setModalProducto] = useState(false);
  const [costoTransporte, setCostoTransporte] = useState(cotizacion?.costoTransporte || 0);
  const [incluirTransporte, setIncluirTransporte] = useState(cotizacion?.incluirTransporte || false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'duplicar' | 'pedido' | null>(null);

  if (!cotizacion) return null;

  const productos = cotizacion.items || [];
  const trmActual = cotizacion.trm || 4250;

  // Calcular totales
  const subtotal = productos.reduce((acc: number, item: any) => {
    return acc + (item.precioUnitario * item.cantidad);
  }, 0);

  const ivaTotal = productos.reduce((acc: number, item: any) => {
    return acc + ((item.precioUnitario * item.cantidad * item.impuesto) / 100);
  }, 0);

  const costoTotal = productos.reduce((acc: number, item: any) => {
    return acc + (item.costoUnitario * item.cantidad);
  }, 0);

  const totalFinal = subtotal + ivaTotal + (incluirTransporte ? 0 : costoTransporte);
  const utilidadTotal = subtotal - costoTotal;
  const margenPct = costoTotal > 0 ? ((utilidadTotal / costoTotal) * 100) : 0;

  const handleConfirmAction = () => {
    if (confirmAction === 'duplicar') {
      onDuplicar?.();
      toast.success('Cotización duplicada exitosamente');
    } else if (confirmAction === 'pedido') {
      if (cotizacion.estado !== 'aprobada') {
        toast.error('Solo se pueden convertir cotizaciones aprobadas');
        return;
      }
      onGenerarPedido?.();
      toast.success('Pedido generado exitosamente');
    }
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    onOpenChange(false);
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      borrador: { variant: 'outline' as const, label: 'Borrador' },
      enviada: { variant: 'secondary' as const, label: 'Enviada' },
      aprobada: { variant: 'default' as const, label: 'Aprobada', className: 'bg-green-600' },
      rechazada: { variant: 'destructive' as const, label: 'Rechazada' },
      convertida: { variant: 'default' as const, label: 'Convertida', className: 'bg-blue-600' },
    };
    const badge = badges[estado as keyof typeof badges];
    if (!badge) return null;
    return (
      <Badge variant={badge.variant} className={`text-xs ${badge.className || ''}`}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          {/* Header fijo con TRM */}
          <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="rounded-lg p-2"
                  style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)' }}
                >
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    Cotización #{cotizacion.numero}
                    {getEstadoBadge(cotizacion.estado)}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Detalles completos de la cotización incluyendo productos, precios y actividades
                  </DialogDescription>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="text-xs">
                      TRM: ${trmActual.toLocaleString('es-CO')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(cotizacion.fechaCotizacion).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Acciones rápidas */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmAction('duplicar');
                    setConfirmDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Duplicar</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">PDF</span>
                </Button>

                {cotizacion.estado === 'borrador' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Enviar</span>
                  </Button>
                )}

                {cotizacion.estado === 'aprobada' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setConfirmAction('pedido');
                      setConfirmDialogOpen(true);
                    }}
                    className="gap-2"
                    style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Generar Pedido</span>
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-3 flex-shrink-0">
              <TabsTrigger value="general" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                General
              </TabsTrigger>
              <TabsTrigger value="productos" className="text-xs">
                <Package className="h-3 w-3 mr-1" />
                Productos ({productos.length})
              </TabsTrigger>
              <TabsTrigger value="liquidacion" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                Liquidación
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 py-4">
              {/* Tab General */}
              <TabsContent value="general" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs">Asesor</Label>
                    <p className="mt-1">{cotizacion.asignadoA}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Términos de Pago</Label>
                    <p className="mt-1">{cotizacion.terminosPago}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Cliente</Label>
                    <p className="mt-1 font-medium">{cotizacion.clienteId}</p>
                  </div>
                </div>

                {/* Alertas */}
                {(cotizacion.clienteBloqueado || cotizacion.aprobacionGerenciaRequerida || cotizacion.aprobacionFinancieraRequerida) && (
                  <Card className="p-4 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
                    <h4 className="mb-2 flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      Alertas y Validaciones
                    </h4>
                    <div className="space-y-2 text-sm">
                      {cotizacion.clienteBloqueado && (
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">Cliente Bloqueado</Badge>
                          <span className="text-xs text-muted-foreground">No se puede continuar</span>
                        </div>
                      )}
                      {cotizacion.aprobacionGerenciaRequerida && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                            Margen Bajo
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Requiere aprobación de gerencia
                          </span>
                        </div>
                      )}
                      {cotizacion.aprobacionFinancieraRequerida && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                            Aprobación Financiera
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Requiere validación financiera
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Tab Productos */}
              <TabsContent value="productos" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h4>{productos.length} Producto{productos.length !== 1 ? 's' : ''}</h4>
                  <Button
                    size="sm"
                    onClick={() => setModalProducto(true)}
                    className="gap-2"
                    variant="outline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar
                  </Button>
                </div>

                {productos.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No hay productos agregados</p>
                    <Button
                      size="sm"
                      onClick={() => setModalProducto(true)}
                      className="mt-3 gap-2"
                      variant="outline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Agregar Producto
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {productos.map((producto: any, index: number) => (
                      <Card key={producto.id} className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">
                                {producto.sku}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {producto.categoria}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm truncate">{producto.descripcion}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Cantidad:</span>
                                <span className="ml-1 font-medium">{producto.cantidad}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Costo:</span>
                                <span className="ml-1 font-medium">
                                  ${producto.costoUnitario.toLocaleString('es-CO')}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Venta:</span>
                                <span className="ml-1 font-medium">
                                  ${producto.precioUnitario.toLocaleString('es-CO')}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Margen:</span>
                                <span className={`ml-1 font-medium ${
                                  producto.margen >= 25 ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {producto.margen}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab Liquidación */}
              <TabsContent value="liquidacion" className="mt-0 space-y-4">
                {/* Transporte */}
                <Card className="p-4">
                  <h4 className="mb-3">Costo de Transporte</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Valor del Transporte</Label>
                      <Input
                        type="number"
                        value={costoTransporte}
                        onChange={(e) => setCostoTransporte(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="incluir-transporte"
                        checked={incluirTransporte}
                        onCheckedChange={(checked) => setIncluirTransporte(checked as boolean)}
                      />
                      <Label htmlFor="incluir-transporte" className="text-xs cursor-pointer">
                        Transporte incluido en ítems (no sumar al total)
                      </Label>
                    </div>
                  </div>
                </Card>

                {/* Resumen */}
                <Card className="p-4">
                  <h4 className="mb-3">Resumen de Liquidación</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal Venta:</span>
                      <span className="font-medium">${subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA:</span>
                      <span className="font-medium">${ivaTotal.toLocaleString('es-CO')}</span>
                    </div>
                    {!incluirTransporte && costoTransporte > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transporte:</span>
                        <span className="font-medium">${costoTransporte.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-medium">Total Venta:</span>
                      <span className="font-medium text-primary">
                        ${totalFinal.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Costo:</span>
                      <span className="font-medium">${costoTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilidad:</span>
                      <span className="font-medium text-green-600">
                        ${utilidadTotal.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Margen General:</span>
                      <Badge 
                        variant={margenPct >= 25 ? 'default' : 'destructive'}
                        className="text-sm"
                      >
                        {margenPct.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Producto */}
      <CrearProductoModal
        open={modalProducto}
        onOpenChange={setModalProducto}
        trmActual={trmActual}
        onCreated={(producto) => {
          toast.success('Producto agregado');
          // Aquí se agregaría el producto a la cotizacion
        }}
      />

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'duplicar' ? 'Duplicar Cotización' : 'Generar Pedido'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'duplicar' 
                ? `¿Está seguro que desea duplicar la cotización #${cotizacion.numero}? Se creará una nueva cotización con un número consecutivo.`
                : `¿Está seguro que desea generar un pedido desde la cotización #${cotizacion.numero}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
