import { useState } from 'react';
import { X, Save, Truck, Lock, Copy as CopyIcon, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';
import { usuarioActual, departamentos } from '../../lib/mock-data';

interface DespachoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  pedidoNumero: number;
  despachoExistente?: any;
}

export function DespachoModal({ 
  open, 
  onOpenChange,
  pedidoId,
  pedidoNumero,
  despachoExistente
}: DespachoModalProps) {
  const { gradients } = useTheme();
  const [bloqueado, setBloqueado] = useState(despachoExistente?.bloqueado || false);
  
  // Permisos: Solo Comercial y Gerencia pueden editar, y solo UNA vez
  const puedeEditar = (usuarioActual.rol === 'Comercial' || usuarioActual.rol === 'Gerencia' || usuarioActual.rol === 'Administración') && !bloqueado;

  const [formData, setFormData] = useState({
    nombreRecibe: despachoExistente?.nombreRecibe || '',
    telefono: despachoExistente?.telefono || '',
    direccion: despachoExistente?.direccion || '',
    departamento: despachoExistente?.departamento || '',
    ciudad: despachoExistente?.ciudad || '',
    horarioEntrega: despachoExistente?.horarioEntrega || '',
    emailGuia: despachoExistente?.emailGuia || '',
    emailCopiaFactura: despachoExistente?.emailCopiaFactura || '',
    tipoDespacho: despachoExistente?.tipoDespacho || 'Total',
    tipoFactura: despachoExistente?.tipoFactura || 'Total',
    facturaConConfirmacion: despachoExistente?.facturaConConfirmacion || 'Con confirmación',
  });

  // Destinos complementarios
  const [destinosComplementarios, setDestinosComplementarios] = useState<any[]>(
    despachoExistente?.destinosComplementarios || []
  );

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopiarInformacion = () => {
    const info = `
Nombre: ${formData.nombreRecibe}
Teléfono: ${formData.telefono}
Dirección: ${formData.direccion}
Departamento: ${formData.departamento}
Ciudad: ${formData.ciudad}
Horario: ${formData.horarioEntrega}
Email Guía: ${formData.emailGuia}
Email Copia Factura: ${formData.emailCopiaFactura}
    `.trim();
    
    navigator.clipboard.writeText(info);
    toast.success('Información copiada al portapapeles');
  };

  const handleGuardar = () => {
    // Validar campos obligatorios
    if (!formData.nombreRecibe || !formData.telefono || !formData.direccion || !formData.departamento || !formData.ciudad) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    const despacho = {
      ...formData,
      pedidoId,
      destinosComplementarios,
      guardadoEn: new Date().toISOString(),
      guardadoPor: usuarioActual.nombre,
      bloqueado: true, // Se bloquea automáticamente al guardar
    };

    toast.success('Información de despacho guardada. Los campos han sido bloqueados.');
    setBloqueado(true);
    onOpenChange(false);
  };

  const handleAgregarDestino = () => {
    setDestinosComplementarios([
      ...destinosComplementarios,
      {
        id: `dest-${Date.now()}`,
        nombreRecibe: '',
        telefono: '',
        direccion: '',
        departamento: '',
        ciudad: '',
        bloqueado: false,
      }
    ]);
  };

  const handleEliminarDestino = (index: number) => {
    setDestinosComplementarios(destinosComplementarios.filter((_, i) => i !== index));
  };

  const handleUpdateDestino = (index: number, field: string, value: string) => {
    const newDestinos = [...destinosComplementarios];
    newDestinos[index] = { ...newDestinos[index], [field]: value };
    setDestinosComplementarios(newDestinos);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full max-h-[92vh] md:max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header - Responsive */}
        <DialogHeader className="px-3 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div 
                className="rounded-lg p-1.5 md:p-2 flex-shrink-0"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)' }}
              >
                <Truck className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-sm md:text-base truncate">Información de Despacho</DialogTitle>
                <DialogDescription className="sr-only">
                  Formulario para gestionar la información de despacho del pedido
                </DialogDescription>
                <div className="flex items-center gap-1.5 md:gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] md:text-xs">
                    Pedido #{pedidoNumero}
                  </Badge>
                  {bloqueado && (
                    <Badge variant="secondary" className="text-[10px] md:text-xs gap-1">
                      <Lock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      <span className="hidden sm:inline">Bloqueado</span>
                    </Badge>
                  )}
                  {!puedeEditar && !bloqueado && (
                    <Badge variant="secondary" className="text-[10px] md:text-xs">
                      <span className="hidden sm:inline">Solo lectura</span>
                      <span className="sm:hidden">👁️</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {puedeEditar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopiarInformacion}
                  className="h-7 w-7 md:w-auto md:gap-2 p-0 md:px-3"
                >
                  <CopyIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span className="hidden md:inline">Copiar</span>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)}
                className="h-7 w-7 md:h-8 md:w-8 p-0"
              >
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido - Responsive */}
        <ScrollArea className="flex-1 px-3 md:px-6 py-3 md:py-4">
          <div className="space-y-4 md:space-y-6">
            {/* Permisos Info */}
            {!puedeEditar && !bloqueado && (
              <Card className="p-2.5 md:p-3 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
                <p className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400">
                  ℹ️ Solo usuarios con rol Comercial o Gerencia pueden editar esta información.
                </p>
              </Card>
            )}

            {bloqueado && despachoExistente?.guardadoEn && (
              <Card className="p-2.5 md:p-3 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                <p className="text-[10px] md:text-xs text-green-600 dark:text-green-400">
                  ✓ Guardado el {new Date(despachoExistente.guardadoEn).toLocaleString('es-CO')} 
                  {' '}por {despachoExistente.guardadoPor}
                </p>
              </Card>
            )}

            {/* Despacho Principal */}
            <Card className="p-3 md:p-4">
              <h4 className="mb-3 md:mb-4 text-sm md:text-base">Destino Principal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label className="text-[10px] md:text-xs">
                    Nombre de quien Recibe <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nombreRecibe}
                    onChange={(e) => handleChange('nombreRecibe', e.target.value)}
                    disabled={!puedeEditar}
                    className="mt-1 h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <div>
                  <Label className="text-[10px] md:text-xs">
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    disabled={!puedeEditar}
                    placeholder="+57 300 000 0000"
                    className="mt-1 h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-[10px] md:text-xs">
                    Dirección Completa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    disabled={!puedeEditar}
                    placeholder="Calle 72 # 10-34, Edificio..."
                    className="mt-1 h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <div>
                  <Label className="text-[10px] md:text-xs">
                    Departamento <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.departamento}
                    onValueChange={(value) => handleChange('departamento', value)}
                    disabled={!puedeEditar}
                  >
                    <SelectTrigger className="mt-1 h-8 md:h-9 text-xs md:text-sm">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map(dep => (
                        <SelectItem key={dep.codigo} value={dep.nombre} className="text-xs md:text-sm">
                          {dep.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] md:text-xs">
                    Ciudad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.ciudad}
                    onChange={(e) => handleChange('ciudad', e.target.value)}
                    disabled={!puedeEditar}
                    className="mt-1 h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <div>
                  <Label className="text-[10px] md:text-xs">Horario de Entrega</Label>
                  <Input
                    value={formData.horarioEntrega}
                    onChange={(e) => handleChange('horarioEntrega', e.target.value)}
                    disabled={!puedeEditar}
                    placeholder="8:00 AM - 5:00 PM"
                    className="mt-1 h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <div>
                  <Label className="text-[10px] md:text-xs">Email para Guía</Label>
                  <Input
                    type="email"
                    value={formData.emailGuia}
                    onChange={(e) => handleChange('emailGuia', e.target.value)}
                    disabled={!puedeEditar}
                    className="mt-1 h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-[10px] md:text-xs">Email Copia Factura</Label>
                  <Input
                    type="email"
                    value={formData.emailCopiaFactura}
                    onChange={(e) => handleChange('emailCopiaFactura', e.target.value)}
                    disabled={!puedeEditar}
                    className="mt-1 h-8 md:h-9 text-xs md:text-sm"
                  />
                </div>

                <Separator className="md:col-span-2" />

                <div>
                  <Label className="text-[10px] md:text-xs">Tipo de Despacho</Label>
                  <Select 
                    value={formData.tipoDespacho}
                    onValueChange={(value) => handleChange('tipoDespacho', value)}
                    disabled={!puedeEditar}
                  >
                    <SelectTrigger className="mt-1 h-8 md:h-9 text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Total" className="text-xs md:text-sm">Total</SelectItem>
                      <SelectItem value="Parcial" className="text-xs md:text-sm">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] md:text-xs">Tipo de Factura</Label>
                  <Select 
                    value={formData.tipoFactura}
                    onValueChange={(value) => handleChange('tipoFactura', value)}
                    disabled={!puedeEditar}
                  >
                    <SelectTrigger className="mt-1 h-8 md:h-9 text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Total" className="text-xs md:text-sm">Total</SelectItem>
                      <SelectItem value="Parcial" className="text-xs md:text-sm">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] md:text-xs">Confirmación de Entrega</Label>
                  <Select 
                    value={formData.facturaConConfirmacion}
                    onValueChange={(value) => handleChange('facturaConConfirmacion', value)}
                    disabled={!puedeEditar}
                  >
                    <SelectTrigger className="mt-1 h-8 md:h-9 text-xs md:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Con confirmación" className="text-xs md:text-sm">Con confirmación</SelectItem>
                      <SelectItem value="Sin confirmación" className="text-xs md:text-sm">Sin confirmación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Destinos Complementarios */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm md:text-base">Destinos Complementarios</h4>
                {puedeEditar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAgregarDestino}
                    className="h-7 md:h-8 gap-1.5 md:gap-2 text-xs"
                  >
                    <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    <span className="hidden sm:inline">Agregar Destino</span>
                    <span className="sm:hidden">Agregar</span>
                  </Button>
                )}
              </div>

              {destinosComplementarios.length === 0 ? (
                <Card className="p-6 text-center">
                  <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin destinos complementarios</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {destinosComplementarios.map((destino, index) => (
                    <Card key={destino.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          Destino {index + 1}
                        </Badge>
                        {puedeEditar && !destino.bloqueado && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarDestino(index)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nombre</Label>
                          <Input
                            value={destino.nombreRecibe}
                            onChange={(e) => handleUpdateDestino(index, 'nombreRecibe', e.target.value)}
                            disabled={!puedeEditar || destino.bloqueado}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Teléfono</Label>
                          <Input
                            value={destino.telefono}
                            onChange={(e) => handleUpdateDestino(index, 'telefono', e.target.value)}
                            disabled={!puedeEditar || destino.bloqueado}
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs">Dirección</Label>
                          <Input
                            value={destino.direccion}
                            onChange={(e) => handleUpdateDestino(index, 'direccion', e.target.value)}
                            disabled={!puedeEditar || destino.bloqueado}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Departamento</Label>
                          <Select 
                            value={destino.departamento}
                            onValueChange={(value) => handleUpdateDestino(index, 'departamento', value)}
                            disabled={!puedeEditar || destino.bloqueado}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Seleccione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {departamentos.map(dep => (
                                <SelectItem key={dep.codigo} value={dep.nombre}>
                                  {dep.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Ciudad</Label>
                          <Input
                            value={destino.ciudad}
                            onChange={(e) => handleUpdateDestino(index, 'ciudad', e.target.value)}
                            disabled={!puedeEditar || destino.bloqueado}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        {puedeEditar && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
            <div className="text-xs text-muted-foreground">
              <span className="text-red-500">*</span> Campos obligatorios
              <span className="ml-3 text-orange-600">⚠️ Solo puede guardar UNA vez</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardar}
                className="gap-2"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                <Save className="h-4 w-4" />
                Guardar y Bloquear
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}