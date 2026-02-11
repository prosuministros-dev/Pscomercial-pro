import { useState } from 'react';
import { X, Save, Shield, Award, Laptop, FileKey } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';
import { usuarioActual, departamentos } from '../../lib/mock-data';

interface LicenciamientoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidoId: string;
  pedidoNumero: number;
}

export function LicenciamientoModal({ 
  open, 
  onOpenChange,
  pedidoId,
  pedidoNumero
}: LicenciamientoModalProps) {
  const { gradients } = useTheme();
  const [categoriaActiva, setCategoriaActiva] = useState<'adp' | 'apple' | 'garantia' | 'licencia'>('adp');

  // Estados para cada categoría
  const [adpData, setAdpData] = useState({
    marca: 'DELL',
    serial: '',
    plan: '',
    duracion: '',
    nombreCliente: '',
    emailCliente: '',
    telefonoCliente: '',
    direccion: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const [appleData, setAppleData] = useState({
    appleId: '',
    serial: '',
    depToken: '',
    contacto: '',
    organizacion: '',
    servidorMDM: '',
    perfilMDM: '',
    fechaEnrolamiento: '',
    estado: 'Activo',
  });

  const [garantiaData, setGarantiaData] = useState({
    marca: 'DELL',
    serial: '',
    duracionAnios: 3,
    fechaInicio: '',
    fechaFin: '',
    cobertura: '',
    numeroPoliza: '',
  });

  const [licenciaData, setLicenciaData] = useState({
    proveedor: 'Microsoft',
    tipo: 'Nuevo',
    razonSocial: '',
    nit: '',
    sectorEconomico: '',
    contacto: '',
    telefono: '',
    cargo: '',
    direccion: '',
    email: '',
    pais: 'Colombia',
    departamento: '',
    ciudad: '',
    codigoPostal: '',
    vipSerial: '',
  });

  const handleGuardarADP = () => {
    if (!adpData.serial || !adpData.plan || !adpData.nombreCliente) {
      toast.error('Complete los campos obligatorios');
      return;
    }
    toast.success('Registro ADP guardado exitosamente');
    onOpenChange(false);
  };

  const handleGuardarApple = () => {
    if (!appleData.appleId || !appleData.serial || !appleData.organizacion) {
      toast.error('Complete los campos obligatorios');
      return;
    }
    toast.success('Enrolamiento Apple guardado exitosamente');
    onOpenChange(false);
  };

  const handleGuardarGarantia = () => {
    if (!garantiaData.serial || !garantiaData.fechaInicio) {
      toast.error('Complete los campos obligatorios');
      return;
    }
    toast.success('Extensión de garantía guardada exitosamente');
    onOpenChange(false);
  };

  const handleGuardarLicencia = () => {
    if (!licenciaData.razonSocial || !licenciaData.nit || !licenciaData.contacto) {
      toast.error('Complete los campos obligatorios');
      return;
    }
    toast.success('Licenciamiento guardado exitosamente');
    onOpenChange(false);
  };

  const renderFormulario = () => {
    switch (categoriaActiva) {
      case 'adp':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">
                  Marca <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={adpData.marca}
                  onValueChange={(value) => setAdpData({...adpData, marca: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACER">ACER</SelectItem>
                    <SelectItem value="ASUS">ASUS</SelectItem>
                    <SelectItem value="DELL">DELL</SelectItem>
                    <SelectItem value="HP">HP</SelectItem>
                    <SelectItem value="LENOVO">LENOVO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">
                  Serial del Equipo <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={adpData.serial}
                  onChange={(e) => setAdpData({...adpData, serial: e.target.value})}
                  placeholder="SN123456789"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Plan <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={adpData.plan}
                  onChange={(e) => setAdpData({...adpData, plan: e.target.value})}
                  placeholder="Premium, Básico, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Duración</Label>
                <Input
                  value={adpData.duracion}
                  onChange={(e) => setAdpData({...adpData, duracion: e.target.value})}
                  placeholder="12 meses, 24 meses"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">
                  Nombre del Cliente <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={adpData.nombreCliente}
                  onChange={(e) => setAdpData({...adpData, nombreCliente: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Email del Cliente</Label>
                <Input
                  type="email"
                  value={adpData.emailCliente}
                  onChange={(e) => setAdpData({...adpData, emailCliente: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Teléfono del Cliente</Label>
                <Input
                  value={adpData.telefonoCliente}
                  onChange={(e) => setAdpData({...adpData, telefonoCliente: e.target.value})}
                  placeholder="+57 300 000 0000"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Dirección</Label>
                <Input
                  value={adpData.direccion}
                  onChange={(e) => setAdpData({...adpData, direccion: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={adpData.fechaInicio}
                  onChange={(e) => setAdpData({...adpData, fechaInicio: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Fecha de Fin</Label>
                <Input
                  type="date"
                  value={adpData.fechaFin}
                  onChange={(e) => setAdpData({...adpData, fechaFin: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardarADP}
                className="gap-2"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                <Save className="h-4 w-4" />
                Guardar ADP
              </Button>
            </div>
          </div>
        );

      case 'apple':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">
                  Apple ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={appleData.appleId}
                  onChange={(e) => setAppleData({...appleData, appleId: e.target.value})}
                  placeholder="usuario@empresa.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Serial del Dispositivo <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={appleData.serial}
                  onChange={(e) => setAppleData({...appleData, serial: e.target.value})}
                  placeholder="C02..."
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">DEP Token</Label>
                <Input
                  value={appleData.depToken}
                  onChange={(e) => setAppleData({...appleData, depToken: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={appleData.contacto}
                  onChange={(e) => setAppleData({...appleData, contacto: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Organización <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={appleData.organizacion}
                  onChange={(e) => setAppleData({...appleData, organizacion: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Servidor MDM</Label>
                <Input
                  value={appleData.servidorMDM}
                  onChange={(e) => setAppleData({...appleData, servidorMDM: e.target.value})}
                  placeholder="mdm.empresa.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Perfil MDM</Label>
                <Input
                  value={appleData.perfilMDM}
                  onChange={(e) => setAppleData({...appleData, perfilMDM: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Fecha de Enrolamiento</Label>
                <Input
                  type="date"
                  value={appleData.fechaEnrolamiento}
                  onChange={(e) => setAppleData({...appleData, fechaEnrolamiento: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Estado</Label>
                <Select 
                  value={appleData.estado}
                  onValueChange={(value) => setAppleData({...appleData, estado: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardarApple}
                className="gap-2"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                <Save className="h-4 w-4" />
                Guardar Apple
              </Button>
            </div>
          </div>
        );

      case 'garantia':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">
                  Marca <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={garantiaData.marca}
                  onValueChange={(value) => setGarantiaData({...garantiaData, marca: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACER">ACER</SelectItem>
                    <SelectItem value="ASUS">ASUS</SelectItem>
                    <SelectItem value="DELL">DELL</SelectItem>
                    <SelectItem value="HP">HP</SelectItem>
                    <SelectItem value="LENOVO">LENOVO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">
                  Serial <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={garantiaData.serial}
                  onChange={(e) => setGarantiaData({...garantiaData, serial: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Duración (años)</Label>
                <Input
                  type="number"
                  value={garantiaData.duracionAnios}
                  onChange={(e) => setGarantiaData({...garantiaData, duracionAnios: parseInt(e.target.value) || 3})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Fecha de Inicio <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={garantiaData.fechaInicio}
                  onChange={(e) => setGarantiaData({...garantiaData, fechaInicio: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Fecha de Fin</Label>
                <Input
                  type="date"
                  value={garantiaData.fechaFin}
                  onChange={(e) => setGarantiaData({...garantiaData, fechaFin: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Número de Póliza</Label>
                <Input
                  value={garantiaData.numeroPoliza}
                  onChange={(e) => setGarantiaData({...garantiaData, numeroPoliza: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Cobertura</Label>
                <Input
                  value={garantiaData.cobertura}
                  onChange={(e) => setGarantiaData({...garantiaData, cobertura: e.target.value})}
                  placeholder="Cobertura completa, solo hardware, etc."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardarGarantia}
                className="gap-2"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                <Save className="h-4 w-4" />
                Guardar Garantía
              </Button>
            </div>
          </div>
        );

      case 'licencia':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Proveedor</Label>
                <Select 
                  value={licenciaData.proveedor}
                  onValueChange={(value) => setLicenciaData({...licenciaData, proveedor: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adobe">Adobe</SelectItem>
                    <SelectItem value="Autodesk">Autodesk</SelectItem>
                    <SelectItem value="Cisco">Cisco</SelectItem>
                    <SelectItem value="Fortinet">Fortinet</SelectItem>
                    <SelectItem value="Kaspersky">Kaspersky</SelectItem>
                    <SelectItem value="McAfee">McAfee</SelectItem>
                    <SelectItem value="Microsoft">Microsoft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Tipo</Label>
                <Select 
                  value={licenciaData.tipo}
                  onValueChange={(value) => setLicenciaData({...licenciaData, tipo: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nuevo">Nuevo</SelectItem>
                    <SelectItem value="Renovación">Renovación</SelectItem>
                    <SelectItem value="CSP">CSP</SelectItem>
                    <SelectItem value="ESD">ESD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">
                  Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={licenciaData.razonSocial}
                  onChange={(e) => setLicenciaData({...licenciaData, razonSocial: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  NIT <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={licenciaData.nit}
                  onChange={(e) => setLicenciaData({...licenciaData, nit: e.target.value})}
                  placeholder="900.123.456-7"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Sector Económico</Label>
                <Input
                  value={licenciaData.sectorEconomico}
                  onChange={(e) => setLicenciaData({...licenciaData, sectorEconomico: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={licenciaData.contacto}
                  onChange={(e) => setLicenciaData({...licenciaData, contacto: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={licenciaData.telefono}
                  onChange={(e) => setLicenciaData({...licenciaData, telefono: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Cargo</Label>
                <Input
                  value={licenciaData.cargo}
                  onChange={(e) => setLicenciaData({...licenciaData, cargo: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={licenciaData.email}
                  onChange={(e) => setLicenciaData({...licenciaData, email: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Dirección</Label>
                <Input
                  value={licenciaData.direccion}
                  onChange={(e) => setLicenciaData({...licenciaData, direccion: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">País</Label>
                <Input
                  value={licenciaData.pais}
                  onChange={(e) => setLicenciaData({...licenciaData, pais: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Departamento</Label>
                <Select 
                  value={licenciaData.departamento}
                  onValueChange={(value) => setLicenciaData({...licenciaData, departamento: value})}
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
                  value={licenciaData.ciudad}
                  onChange={(e) => setLicenciaData({...licenciaData, ciudad: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Código Postal</Label>
                <Input
                  value={licenciaData.codigoPostal}
                  onChange={(e) => setLicenciaData({...licenciaData, codigoPostal: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">VIP Serial (si aplica)</Label>
                <Input
                  value={licenciaData.vipSerial}
                  onChange={(e) => setLicenciaData({...licenciaData, vipSerial: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardarLicencia}
                className="gap-2"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                <Save className="h-4 w-4" />
                Guardar Licencia
              </Button>
            </div>
          </div>
        );
    }
  };

  const getIconForTab = (tab: string) => {
    switch (tab) {
      case 'adp': return <Laptop className="h-3 w-3" />;
      case 'apple': return <span className="text-sm">🍎</span>;
      case 'garantia': return <Shield className="h-3 w-3" />;
      case 'licencia': return <FileKey className="h-3 w-3" />;
    }
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
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)' }}
              >
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Licenciamiento y Garantías</DialogTitle>
                <DialogDescription className="sr-only">
                  Formulario para gestionar licencias, garantías y activos del pedido
                </DialogDescription>
                <Badge variant="outline" className="text-xs mt-1">
                  Pedido #{pedidoNumero}
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

        {/* Tabs de Categorías */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant={categoriaActiva === 'adp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoriaActiva('adp')}
              className="gap-2"
            >
              {getIconForTab('adp')}
              <span className="hidden md:inline">ADP</span>
            </Button>
            <Button
              variant={categoriaActiva === 'apple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoriaActiva('apple')}
              className="gap-2"
            >
              {getIconForTab('apple')}
              <span className="hidden md:inline">Apple</span>
            </Button>
            <Button
              variant={categoriaActiva === 'garantia' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoriaActiva('garantia')}
              className="gap-2"
            >
              {getIconForTab('garantia')}
              <span className="hidden md:inline">Garantía</span>
            </Button>
            <Button
              variant={categoriaActiva === 'licencia' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoriaActiva('licencia')}
              className="gap-2"
            >
              {getIconForTab('licencia')}
              <span className="hidden md:inline">Licencia</span>
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <ScrollArea className="flex-1 px-6 py-4">
          <Card className="p-4">
            {renderFormulario()}
          </Card>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
