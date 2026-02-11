import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LayoutGrid, Table, Eye } from 'lucide-react';
import { TableroOperativo } from './tablero-operativo';
import { VistaKanbanEjecutiva } from './vista-kanban-ejecutiva';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { registrosTableroMock, configColores } from '../../lib/mock-tablero-operativo';

export function TableroOperativoIndex() {
  const [vistaActiva, setVistaActiva] = useState<'operativa' | 'ejecutiva'>('operativa');
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<string | null>(null);

  const handleVerDetalle = (registroId: string) => {
    setRegistroSeleccionado(registroId);
    setDetalleAbierto(true);
  };

  const registro = registroSeleccionado 
    ? registrosTableroMock.find(r => r.id === registroSeleccionado)
    : null;

  return (
    <div className="space-y-4">
      {/* Selector de Vista - Sin header duplicado */}
      <Tabs value={vistaActiva} onValueChange={(v) => setVistaActiva(v as 'operativa' | 'ejecutiva')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="operativa" className="gap-2">
            <Table className="h-4 w-4" />
            Vista Operativa
          </TabsTrigger>
          <TabsTrigger value="ejecutiva" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Vista Ejecutiva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operativa" className="mt-4">
          <TableroOperativo onVerDetalle={handleVerDetalle} />
        </TabsContent>

        <TabsContent value="ejecutiva" className="mt-4">
          <VistaKanbanEjecutiva />
        </TabsContent>
      </Tabs>

      {/* Modal de Detalle */}
      <Dialog open={detalleAbierto} onOpenChange={setDetalleAbierto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {registro ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Detalle del Registro
                </DialogTitle>
                <DialogDescription>
                  Vista completa de información operativa y trazabilidad
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Información Principal */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-3">Información Operativa Base</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Proveedor</p>
                      <p className="font-medium">{registro.proveedor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Orden de Compra</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{registro.oc}</code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                      <p className="font-medium">{registro.cliente}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Orden de Producción</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{registro.op}</code>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Producto</p>
                      <p className="font-medium">{registro.producto}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cantidad</p>
                      <p className="font-medium">{registro.cantidad} unidades</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fecha de Entrega</p>
                      <p className="font-medium">
                        {new Date(registro.fechaEntrega).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Responsable Actual */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-3">Responsable Actual</h3>
                  {registro.responsable ? (
                    <div className={`p-3 rounded-lg border-2 ${configColores[registro.responsable].color}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-4 w-4 rounded-full ${configColores[registro.responsable].colorSolido} flex-shrink-0 mt-0.5`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">
                            {configColores[registro.responsable].label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {configColores[registro.responsable].descripcion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin responsable asignado</p>
                  )}
                </Card>

                {/* Novedades */}
                <Card className="p-4 bg-muted/50">
                  <h3 className="text-sm font-medium mb-2">Novedades</h3>
                  <p className="text-sm">{registro.novedades}</p>
                </Card>

                <Separator />

                {/* Subprocesos Administrativos */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium mb-3">Subprocesos Administrativos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries({
                      'REM': registro.subprocesos.rem,
                      'Factura': registro.subprocesos.factura,
                      'Transportadora': registro.subprocesos.transportadora,
                      'Guía': registro.subprocesos.guia,
                      'Obs. CRM': registro.subprocesos.obsCrm,
                      'Correo U.F.': registro.subprocesos.correoUF
                    }).map(([label, estado]) => (
                      <div key={label} className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">{label}</p>
                        {estado ? (
                          <div className={`p-2 rounded border ${configColores[estado].color} flex items-center justify-center gap-2`}>
                            <div className={`h-2.5 w-2.5 rounded-full ${configColores[estado].colorSolido}`}></div>
                            <span className="text-xs font-medium">
                              {configColores[estado].label}
                            </span>
                          </div>
                        ) : (
                          <div className="p-2 rounded border border-dashed border-border bg-muted/30">
                            <span className="text-xs text-muted-foreground">Pendiente</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Historial de Cambios */}
                {registro.cambios.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-sm font-medium mb-3">Historial de Cambios</h3>
                    <div className="space-y-3">
                      {registro.cambios.map((cambio, idx) => (
                        <div key={idx} className="border-l-2 border-primary pl-3 py-2">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-medium">{cambio.campo}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cambio.fecha).toLocaleDateString('es-CO', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            <span className="font-medium">Por:</span> {cambio.usuario}
                          </p>
                          <p className="text-xs">{cambio.motivo}</p>
                          {(cambio.valorAnterior || cambio.valorNuevo) && (
                            <div className="flex items-center gap-2 mt-1">
                              {cambio.valorAnterior && (
                                <Badge variant="outline" className="text-[10px]">
                                  De: {cambio.valorAnterior}
                                </Badge>
                              )}
                              {cambio.valorNuevo && (
                                <Badge variant="default" className="text-[10px]">
                                  A: {cambio.valorNuevo}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No se encontró el registro
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}