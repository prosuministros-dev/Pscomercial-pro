import { useState } from 'react';
import { X, Save, FileText, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { usuarioActual, usuarios, leads } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';

interface CrearCotizacionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (cotizacion: any) => void;
  leadSeleccionado?: any;
}

export function CrearCotizacionModal({ 
  open, 
  onOpenChange,
  onCreated,
  leadSeleccionado
}: CrearCotizacionModalProps) {
  const { gradients } = useTheme();
  const [paso, setPaso] = useState(1);
  
  // TRM actual del día
  const trmActual = 4250;
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    numero: 30002, // autogenerado
    fecha: new Date().toISOString().split('T')[0],
    leadId: leadSeleccionado?.id || '',
    razonSocial: '',
    formaPago: 'Anticipado',
    contacto: leadSeleccionado?.nombreContacto || '',
    celular: leadSeleccionado?.telefono || '',
    correo: leadSeleccionado?.email || '',
    asunto: '',
    asesor: usuarioActual.nombre,
    porcentajeInteres: 0,
    vigenciaDias: 15,
    condicionesComerciales: '',
    cuadroInformativo: '',
    mes: new Date().toLocaleString('es-CO', { month: 'long' }),
    semana: Math.ceil(new Date().getDate() / 7),
    fechaCierre: '',
    mesFacturacion: new Date().toLocaleString('es-CO', { month: 'long' }),
    linksAdicionales: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = () => {
    // Validar campos obligatorios
    if (!formData.razonSocial || !formData.contacto || !formData.correo || !formData.asunto) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    const cotizacion = {
      ...formData,
      trm: trmActual,
      items: [],
      totalCosto: 0,
      totalVenta: 0,
      margenPct: 0,
      estado: 'borrador',
      creadoEn: new Date().toISOString(),
      creadoPor: usuarioActual.nombre,
    };

    onCreated?.(cotizacion);
    toast.success(`Cotización #${formData.numero} creada exitosamente`);
    onOpenChange(false);
    setPaso(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Header fijo */}
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
                <DialogTitle>Nueva Cotización #{formData.numero}</DialogTitle>
                <DialogDescription className="sr-only">
                  Formulario para crear una nueva cotización con información del cliente y productos
                </DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    TRM: ${trmActual.toLocaleString('es-CO')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Paso {paso} de 2
                  </Badge>
                </div>
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

        {/* Contenido scrolleable */}
        <ScrollArea className="flex-1 px-6 py-4">
          {paso === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lead asociado */}
                {leadSeleccionado && (
                  <div className="md:col-span-2 p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Lead Asociado</p>
                    <p className="text-sm font-medium">
                      #{leadSeleccionado.numero} - {leadSeleccionado.nombreCliente}
                    </p>
                  </div>
                )}

                {/* Razón Social */}
                <div className="md:col-span-2">
                  <Label className="text-xs">
                    Razón Social <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.razonSocial}
                    onChange={(e) => handleChange('razonSocial', e.target.value)}
                    placeholder="Nombre completo de la empresa"
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Diligenciada por financiera, por defecto tipo anticipado
                  </p>
                </div>

                {/* Forma de Pago */}
                <div>
                  <Label className="text-xs">Forma de Pago</Label>
                  <Select 
                    value={formData.formaPago}
                    onValueChange={(value) => handleChange('formaPago', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Anticipado">Anticipado</SelectItem>
                      <SelectItem value="Crédito 30">Crédito 30 días</SelectItem>
                      <SelectItem value="Crédito 60">Crédito 60 días</SelectItem>
                      <SelectItem value="Crédito 90">Crédito 90 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha */}
                <div>
                  <Label className="text-xs">Fecha</Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleChange('fecha', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Contacto */}
                <div>
                  <Label className="text-xs">
                    Contacto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.contacto}
                    onChange={(e) => handleChange('contacto', e.target.value)}
                    placeholder="Nombre del contacto"
                    className="mt-1"
                  />
                </div>

                {/* Celular */}
                <div>
                  <Label className="text-xs">Celular</Label>
                  <Input
                    value={formData.celular}
                    onChange={(e) => handleChange('celular', e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="mt-1"
                  />
                </div>

                {/* Correo */}
                <div className="md:col-span-2">
                  <Label className="text-xs">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => handleChange('correo', e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="mt-1"
                  />
                </div>

                {/* Asunto */}
                <div className="md:col-span-2">
                  <Label className="text-xs">
                    Asunto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.asunto}
                    onChange={(e) => handleChange('asunto', e.target.value)}
                    placeholder="Descripción breve de la cotización"
                    className="mt-1"
                  />
                </div>

                {/* Asesor */}
                <div>
                  <Label className="text-xs">Asesor</Label>
                  <Select 
                    value={formData.asesor}
                    onValueChange={(value) => handleChange('asesor', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.filter(u => u.rol === 'Comercial' || u.rol === 'Administración').map(u => (
                        <SelectItem key={u.id} value={u.nombre}>{u.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vigencia */}
                <div>
                  <Label className="text-xs">Vigencia (días)</Label>
                  <Input
                    type="number"
                    value={formData.vigenciaDias}
                    onChange={(e) => handleChange('vigenciaDias', parseInt(e.target.value) || 15)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Condiciones Comerciales */}
                <div className="md:col-span-2">
                  <Label className="text-xs">Condiciones Comerciales</Label>
                  <Textarea
                    value={formData.condicionesComerciales}
                    onChange={(e) => handleChange('condicionesComerciales', e.target.value)}
                    placeholder="Términos y condiciones específicas..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Cuadro Informativo */}
                <div className="md:col-span-2">
                  <Label className="text-xs">Cuadro Informativo</Label>
                  <Textarea
                    value={formData.cuadroInformativo}
                    onChange={(e) => handleChange('cuadroInformativo', e.target.value)}
                    placeholder="Información adicional relevante..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <Separator className="md:col-span-2" />

                {/* Información de Seguimiento */}
                <div>
                  <Label className="text-xs">Mes</Label>
                  <Input
                    value={formData.mes}
                    onChange={(e) => handleChange('mes', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Semana</Label>
                  <Input
                    type="number"
                    value={formData.semana}
                    onChange={(e) => handleChange('semana', parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Fecha de Cierre Estimada</Label>
                  <Input
                    type="date"
                    value={formData.fechaCierre}
                    onChange={(e) => handleChange('fechaCierre', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs">Mes de Facturación</Label>
                  <Input
                    value={formData.mesFacturacion}
                    onChange={(e) => handleChange('mesFacturacion', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Porcentaje de Interés */}
                <div>
                  <Label className="text-xs">Porcentaje de Interés (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.porcentajeInteres}
                    onChange={(e) => handleChange('porcentajeInteres', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                {/* Links Adicionales */}
                <div className="md:col-span-2">
                  <Label className="text-xs">Links Adicionales (opcional)</Label>
                  <Input
                    value={formData.linksAdicionales}
                    onChange={(e) => handleChange('linksAdicionales', e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer fijo */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            <span className="text-red-500">*</span> Campos obligatorios
          </div>
          <div className="flex items-center gap-2">
            {paso > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaso(paso - 1)}
              >
                Anterior
              </Button>
            )}
            {paso < 2 ? (
              <Button
                size="sm"
                onClick={() => setPaso(paso + 1)}
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleGuardar}
                className="gap-2"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                <Save className="h-4 w-4" />
                Guardar Cotización
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
