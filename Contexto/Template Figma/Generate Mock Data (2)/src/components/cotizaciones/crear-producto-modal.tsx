import { useState, useEffect } from 'react';
import { X, Save, Package, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';

interface CrearProductoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (producto: any) => void;
  trmActual: number;
}

export function CrearProductoModal({ 
  open, 
  onOpenChange,
  onCreated,
  trmActual
}: CrearProductoModalProps) {
  const { gradients } = useTheme();
  
  const [formData, setFormData] = useState({
    numeroParte: '',
    nombre: '',
    vertical: '',
    marca: '',
    impuesto: 19,
    costo: 0,
    moneda: 'COP',
    utilidadPct: 30,
    cantidad: 1,
    proveedorSugerido: '',
    tiempoEntrega: '',
    garantia: '',
    observaciones: '',
  });

  // Cálculos automáticos
  const [calculado, setCalculado] = useState({
    costoConvertido: 0,
    precioVenta: 0,
    iva: 0,
    totalItem: 0,
    margen: 0,
  });

  useEffect(() => {
    calcular();
  }, [formData.costo, formData.moneda, formData.utilidadPct, formData.cantidad, formData.impuesto]);

  const calcular = () => {
    // Convertir costo si es USD
    const costoEnCOP = formData.moneda === 'USD' 
      ? formData.costo * trmActual 
      : formData.costo;

    // Calcular precio de venta con utilidad
    const precioVenta = costoEnCOP * (1 + formData.utilidadPct / 100);
    
    // Calcular IVA
    const iva = (precioVenta * formData.impuesto) / 100;
    
    // Total del item
    const totalItem = (precioVenta + iva) * formData.cantidad;
    
    // Margen
    const margen = precioVenta - costoEnCOP;

    setCalculado({
      costoConvertido: costoEnCOP,
      precioVenta,
      iva,
      totalItem,
      margen,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = () => {
    if (!formData.numeroParte || !formData.nombre || formData.costo <= 0) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const producto = {
      ...formData,
      ...calculado,
      id: `prod-${Date.now()}`,
      creadoEn: new Date().toISOString(),
    };

    onCreated?.(producto);
    toast.success('Producto agregado exitosamente');
    onOpenChange(false);
    
    // Reset form
    setFormData({
      numeroParte: '',
      nombre: '',
      vertical: '',
      marca: '',
      impuesto: 19,
      costo: 0,
      moneda: 'COP',
      utilidadPct: 30,
      cantidad: 1,
      proveedorSugerido: '',
      tiempoEntrega: '',
      garantia: '',
      observaciones: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="rounded-lg p-2"
                style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
              >
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Agregar Producto</DialogTitle>
                <DialogDescription className="sr-only">
                  Formulario para agregar un nuevo producto a la cotización
                </DialogDescription>
                <Badge variant="outline" className="text-xs mt-1">
                  TRM: ${trmActual.toLocaleString('es-CO')}
                </Badge>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario - 2 columnas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número de Parte */}
                <div>
                  <Label className="text-xs">
                    Número de Parte / SKU <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.numeroParte}
                    onChange={(e) => handleChange('numeroParte', e.target.value)}
                    placeholder="LAP-DEL-001"
                    className="mt-1"
                  />
                </div>

                {/* Vertical/Marca */}
                <div>
                  <Label className="text-xs">Vertical / Marca</Label>
                  <Input
                    value={formData.vertical}
                    onChange={(e) => handleChange('vertical', e.target.value)}
                    placeholder="Hardware, Software, etc."
                    className="mt-1"
                  />
                </div>

                {/* Nombre del Producto */}
                <div className="md:col-span-2">
                  <Label className="text-xs">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Dell Latitude 5430, Windows 11 Pro, etc."
                    className="mt-1"
                  />
                </div>

                {/* Marca */}
                <div>
                  <Label className="text-xs">Marca</Label>
                  <Input
                    value={formData.marca}
                    onChange={(e) => handleChange('marca', e.target.value)}
                    placeholder="Dell, HP, Lenovo, etc."
                    className="mt-1"
                  />
                </div>

                {/* Impuesto */}
                <div>
                  <Label className="text-xs">Impuesto (%)</Label>
                  <Select 
                    value={formData.impuesto.toString()}
                    onValueChange={(value) => handleChange('impuesto', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% - Exento</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="19">19% - IVA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Costo */}
                <div>
                  <Label className="text-xs">
                    Costo Unitario <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.costo}
                    onChange={(e) => handleChange('costo', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                {/* Moneda */}
                <div>
                  <Label className="text-xs">Moneda</Label>
                  <Select 
                    value={formData.moneda}
                    onValueChange={(value) => handleChange('moneda', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">COP - Pesos</SelectItem>
                      <SelectItem value="USD">USD - Dólares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conversión TRM */}
                {formData.moneda === 'USD' && formData.costo > 0 && (
                  <div className="md:col-span-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <p className="text-xs">
                        <span className="font-medium">${formData.costo} USD</span>
                        {' × '}
                        <span className="font-medium">${trmActual}</span>
                        {' = '}
                        <span className="font-medium text-blue-600">
                          ${(formData.costo * trmActual).toLocaleString('es-CO')} COP
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* % Utilidad */}
                <div>
                  <Label className="text-xs">% Utilidad</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.utilidadPct}
                    onChange={(e) => handleChange('utilidadPct', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                {/* Cantidad */}
                <div>
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => handleChange('cantidad', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>

                {/* Proveedor Sugerido */}
                <div>
                  <Label className="text-xs">Proveedor Sugerido</Label>
                  <Input
                    value={formData.proveedorSugerido}
                    onChange={(e) => handleChange('proveedorSugerido', e.target.value)}
                    placeholder="Proveedor preferido"
                    className="mt-1"
                  />
                </div>

                {/* Tiempo de Entrega */}
                <div>
                  <Label className="text-xs">Tiempo de Entrega</Label>
                  <Input
                    value={formData.tiempoEntrega}
                    onChange={(e) => handleChange('tiempoEntrega', e.target.value)}
                    placeholder="5-7 días hábiles"
                    className="mt-1"
                  />
                </div>

                {/* Garantía */}
                <div className="md:col-span-2">
                  <Label className="text-xs">Garantía</Label>
                  <Input
                    value={formData.garantia}
                    onChange={(e) => handleChange('garantia', e.target.value)}
                    placeholder="12 meses, 3 años, etc."
                    className="mt-1"
                  />
                </div>

                {/* Observaciones */}
                <div className="md:col-span-2">
                  <Label className="text-xs">Observaciones</Label>
                  <Textarea
                    value={formData.observaciones}
                    onChange={(e) => handleChange('observaciones', e.target.value)}
                    placeholder="Notas adicionales sobre el producto..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Resumen de Cálculos - 1 columna */}
            <div className="lg:col-span-1">
              <Card className="p-4 sticky top-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-4 w-4 text-primary" />
                  <h4>Cálculo Automático</h4>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Costo Unitario:</span>
                    <span className="font-medium">
                      ${calculado.costoConvertido.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Utilidad ({formData.utilidadPct}%):</span>
                    <span className="font-medium text-green-600">
                      +${calculado.margen.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Precio Venta:</span>
                    <span className="font-medium">
                      ${calculado.precioVenta.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">IVA ({formData.impuesto}%):</span>
                    <span className="font-medium">
                      ${calculado.iva.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cantidad:</span>
                    <span className="font-medium">×{formData.cantidad}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t-2 border-primary/20">
                    <span className="font-medium">Total Item:</span>
                    <span className="text-lg font-medium text-primary">
                      ${calculado.totalItem.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Margen:</span>
                    <Badge 
                      variant={formData.utilidadPct >= 25 ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {formData.utilidadPct}%
                    </Badge>
                  </div>
                </div>

                {formData.utilidadPct < 25 && (
                  <div className="mt-4 p-2 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ⚠️ Margen bajo. Requiere aprobación de gerencia.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            <span className="text-red-500">*</span> Campos obligatorios
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
              Agregar Producto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
