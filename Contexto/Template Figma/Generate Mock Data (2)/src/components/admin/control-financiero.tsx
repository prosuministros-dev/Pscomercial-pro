import { useState } from 'react';
import { DollarSign, AlertCircle, Search, Lock, Unlock, FileText, TrendingUp } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';
import {
  bloqueosCartera,
  bitacoraBloqueos,
  configuracionMargen,
  usuarioActual,
  type BloqueoCartera,
  type BitacoraBloqueo,
  type ConfiguracionMargen,
} from '../../lib/mock-data';

export function ControlFinanciero() {
  const { gradients } = useTheme();
  const [bloqueos, setBloqueos] = useState<BloqueoCartera[]>(bloqueosCartera);
  const [bitacora, setBitacora] = useState<BitacoraBloqueo[]>(bitacoraBloqueos);
  const [margenes, setMargenes] = useState<ConfiguracionMargen[]>(configuracionMargen);
  const [busqueda, setBusqueda] = useState('');
  const [modalBloqueo, setModalBloqueo] = useState(false);
  const [modalMargen, setModalMargen] = useState(false);
  const [bloqueoSeleccionado, setBloqueoSeleccionado] = useState<BloqueoCartera | null>(null);
  const [margenSeleccionado, setMargenSeleccionado] = useState<ConfiguracionMargen | null>(null);

  const [formBloqueo, setFormBloqueo] = useState({
    clienteNit: '',
    clienteRazonSocial: '',
    bloqueado: false,
    motivo: '',
    montoDeuda: 0,
    diasVencimiento: 0,
  });

  const bloqueosFiltrados = bloqueos.filter(b =>
    b.clienteRazonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
    b.clienteNit.includes(busqueda)
  );

  const handleBloquear = (bloqueo: BloqueoCartera | null) => {
    if (bloqueo) {
      setBloqueoSeleccionado(bloqueo);
      setFormBloqueo({
        clienteNit: bloqueo.clienteNit,
        clienteRazonSocial: bloqueo.clienteRazonSocial,
        bloqueado: bloqueo.bloqueado,
        motivo: bloqueo.motivo || '',
        montoDeuda: bloqueo.montoDeuda || 0,
        diasVencimiento: bloqueo.diasVencimiento || 0,
      });
    } else {
      setBloqueoSeleccionado(null);
      setFormBloqueo({
        clienteNit: '',
        clienteRazonSocial: '',
        bloqueado: true,
        motivo: '',
        montoDeuda: 0,
        diasVencimiento: 0,
      });
    }
    setModalBloqueo(true);
  };

  const handleGuardarBloqueo = () => {
    if (!formBloqueo.clienteNit.trim() || !formBloqueo.clienteRazonSocial.trim()) {
      toast.error('NIT y Razón Social son obligatorios');
      return;
    }

    if (formBloqueo.bloqueado && !formBloqueo.motivo.trim()) {
      toast.error('El motivo es obligatorio para bloquear un cliente');
      return;
    }

    const ahora = new Date().toISOString();

    if (bloqueoSeleccionado) {
      // Actualizar existente
      const bloqueoActualizado: BloqueoCartera = {
        ...bloqueoSeleccionado,
        ...formBloqueo,
        ...(formBloqueo.bloqueado ? {
          bloqueadoPor: usuarioActual.nombre,
          bloqueadoEn: ahora,
        } : {
          desbloqueadoPor: usuarioActual.nombre,
          desbloqueadoEn: ahora,
        }),
      };

      setBloqueos(bloqueos.map(b =>
        b.id === bloqueoSeleccionado.id ? bloqueoActualizado : b
      ));

      // Agregar a bitácora
      const nuevaBitacora: BitacoraBloqueo = {
        id: `bit-blq-${Date.now()}`,
        bloqueoId: bloqueoSeleccionado.id,
        accion: formBloqueo.bloqueado ? 'bloquear' : 'desbloquear',
        usuarioId: usuarioActual.id,
        usuario: usuarioActual.nombre,
        motivo: formBloqueo.motivo,
        valorAnterior: bloqueoSeleccionado.bloqueado,
        valorNuevo: formBloqueo.bloqueado,
        creadoEn: ahora,
      };

      setBitacora([nuevaBitacora, ...bitacora]);
      toast.success(`Cliente ${formBloqueo.bloqueado ? 'bloqueado' : 'desbloqueado'} exitosamente`);
    } else {
      // Crear nuevo
      const nuevoBloqueo: BloqueoCartera = {
        id: `blq-${Date.now()}`,
        ...formBloqueo,
        bloqueadoPor: usuarioActual.nombre,
        bloqueadoEn: ahora,
      };

      setBloqueos([...bloqueos, nuevoBloqueo]);

      // Agregar a bitácora
      const nuevaBitacora: BitacoraBloqueo = {
        id: `bit-blq-${Date.now()}`,
        bloqueoId: nuevoBloqueo.id,
        accion: 'bloquear',
        usuarioId: usuarioActual.id,
        usuario: usuarioActual.nombre,
        motivo: formBloqueo.motivo,
        valorAnterior: false,
        valorNuevo: true,
        creadoEn: ahora,
      };

      setBitacora([nuevaBitacora, ...bitacora]);
      toast.success('Bloqueo de cartera registrado exitosamente');
    }

    setModalBloqueo(false);
  };

  const handleEditarMargen = (margen: ConfiguracionMargen) => {
    setMargenSeleccionado(margen);
    setModalMargen(true);
  };

  const handleGuardarMargen = () => {
    if (!margenSeleccionado) return;

    setMargenes(margenes.map(m =>
      m.id === margenSeleccionado.id ? margenSeleccionado : m
    ));

    toast.success('Configuración de margen actualizada');
    setModalMargen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
          >
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>Control Financiero</h2>
            <p className="text-xs text-muted-foreground">Gestión de bloqueos y márgenes</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-2">
              <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clientes Bloqueados</p>
              <h4>{bloqueos.filter(b => b.bloqueado).length}</h4>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-2">
              <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Clientes Activos</p>
              <h4>{bloqueos.filter(b => !b.bloqueado).length}</h4>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Movimientos Hoy</p>
              <h4>{bitacora.filter(b => {
                const hoy = new Date().toDateString();
                const fecha = new Date(b.creadoEn).toDateString();
                return hoy === fecha;
              }).length}</h4>
            </div>
          </div>
        </Card>
      </div>

      {/* Bloqueos de Cartera */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4>Bloqueos de Cartera</h4>
          <Button
            size="sm"
            onClick={() => handleBloquear(null)}
            style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            Registrar Bloqueo
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por NIT o Razón Social..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Cliente</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Deuda</TableHead>
                <TableHead>Días Vencidos</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloqueosFiltrados.map((bloqueo) => (
                <TableRow key={bloqueo.id} className="text-sm">
                  <TableCell className="font-medium">{bloqueo.clienteRazonSocial}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{bloqueo.clienteNit}</TableCell>
                  <TableCell>
                    {bloqueo.bloqueado ? (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <Lock className="h-3 w-3" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs gap-1 bg-green-600">
                        <Unlock className="h-3 w-3" />
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {bloqueo.montoDeuda
                      ? `$${(bloqueo.montoDeuda / 1000000).toFixed(1)}M`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {bloqueo.diasVencimiento ? (
                      <span className={bloqueo.diasVencimiento > 60 ? 'text-red-600 font-medium' : ''}>
                        {bloqueo.diasVencimiento} días
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {bloqueo.motivo || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleBloquear(bloqueo)}
                      >
                        {bloqueo.bloqueado ? (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Desbloquear
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Bloquear
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Configuración de Márgenes */}
      <Card className="p-4">
        <h4 className="mb-4">Configuración de Márgenes por Categoría</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {margenes.map((margen) => (
            <Card key={margen.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="capitalize">{margen.categoria}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {margen.requiereAprobacion && `Requiere aprobación de ${margen.nivelAprobacion}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleEditarMargen(margen)}
                >
                  Editar
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Margen Mínimo</p>
                  <p className="text-lg font-medium text-orange-600">{margen.margenMinimo}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margen Objetivo</p>
                  <p className="text-lg font-medium text-green-600">{margen.margenObjetivo}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Bitácora de Cambios */}
      <Card className="p-4">
        <h4 className="mb-4">Bitácora de Cambios</h4>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {bitacora.map((evento) => (
              <div key={evento.id} className="border-l-2 border-primary pl-4 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {evento.accion === 'bloquear' ? (
                        <Lock className="h-4 w-4 text-red-600" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-600" />
                      )}
                      <span className="text-sm font-medium capitalize">{evento.accion}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{evento.motivo}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Por: {evento.usuario}</span>
                      <span>•</span>
                      <span>
                        {new Date(evento.creadoEn).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Modal Bloqueo/Desbloqueo */}
      <Dialog open={modalBloqueo} onOpenChange={setModalBloqueo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bloqueoSeleccionado
                ? (formBloqueo.bloqueado ? 'Desbloquear Cliente' : 'Bloquear Cliente')
                : 'Registrar Bloqueo de Cartera'}
            </DialogTitle>
            <DialogDescription>
              {formBloqueo.bloqueado
                ? 'Marca el cliente con bloqueo de cartera para evitar nuevos pedidos'
                : 'Quita el bloqueo para permitir nuevas transacciones'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>NIT *</Label>
              <Input
                value={formBloqueo.clienteNit}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, clienteNit: e.target.value })}
                placeholder="900.123.456-7"
                className="mt-1"
                disabled={!!bloqueoSeleccionado}
              />
            </div>

            <div>
              <Label>Razón Social *</Label>
              <Input
                value={formBloqueo.clienteRazonSocial}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, clienteRazonSocial: e.target.value })}
                placeholder="Nombre del cliente"
                className="mt-1"
                disabled={!!bloqueoSeleccionado}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto Deuda (COP)</Label>
                <Input
                  type="number"
                  value={formBloqueo.montoDeuda}
                  onChange={(e) => setFormBloqueo({ ...formBloqueo, montoDeuda: Number(e.target.value) })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Días Vencidos</Label>
                <Input
                  type="number"
                  value={formBloqueo.diasVencimiento}
                  onChange={(e) => setFormBloqueo({ ...formBloqueo, diasVencimiento: Number(e.target.value) })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Motivo {formBloqueo.bloqueado && '*'}</Label>
              <Textarea
                value={formBloqueo.motivo}
                onChange={(e) => setFormBloqueo({ ...formBloqueo, motivo: e.target.value })}
                placeholder="Describe el motivo del bloqueo/desbloqueo"
                className="mt-1"
                rows={3}
              />
            </div>

            {bloqueoSeleccionado && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    {formBloqueo.bloqueado ? (
                      <p>Al desbloquear este cliente, podrás generar nuevos pedidos a su nombre.</p>
                    ) : (
                      <p className="text-yellow-800 dark:text-yellow-200">
                        Al bloquear este cliente, <strong>no se podrán generar nuevos pedidos</strong> hasta que sea desbloqueado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalBloqueo(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarBloqueo}
              className="flex-1"
              style={{
                background: formBloqueo.bloqueado
                  ? 'var(--color-destructive)'
                  : gradients ? 'var(--grad-brand)' : 'var(--color-primary)',
                color: 'white'
              }}
            >
              {formBloqueo.bloqueado ? 'Bloquear' : 'Desbloquear'} Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Margen */}
      {margenSeleccionado && (
        <Dialog open={modalMargen} onOpenChange={setModalMargen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Márgenes - {margenSeleccionado.categoria}</DialogTitle>
              <DialogDescription>
                Define los márgenes mínimos y objetivos para esta categoría
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Margen Mínimo (%)</Label>
                  <Input
                    type="number"
                    value={margenSeleccionado.margenMinimo}
                    onChange={(e) => setMargenSeleccionado({
                      ...margenSeleccionado,
                      margenMinimo: Number(e.target.value)
                    })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Margen Objetivo (%)</Label>
                  <Input
                    type="number"
                    value={margenSeleccionado.margenObjetivo}
                    onChange={(e) => setMargenSeleccionado({
                      ...margenSeleccionado,
                      margenObjetivo: Number(e.target.value)
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Nivel de Aprobación</Label>
                <select
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={margenSeleccionado.nivelAprobacion}
                  onChange={(e) => setMargenSeleccionado({
                    ...margenSeleccionado,
                    nivelAprobacion: e.target.value as 'gerencia' | 'financiera' | 'direccion'
                  })}
                >
                  <option value="gerencia">Gerencia</option>
                  <option value="financiera">Financiera</option>
                  <option value="direccion">Dirección</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Las cotizaciones con margen inferior al mínimo requerirán aprobación de {margenSeleccionado.nivelAprobacion}.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setModalMargen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleGuardarMargen}
                className="flex-1"
                style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
              >
                Guardar Configuración
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
