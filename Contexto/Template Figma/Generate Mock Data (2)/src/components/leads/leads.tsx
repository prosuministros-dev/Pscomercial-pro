import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
  LayoutGrid,
  List
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { leads, type Lead } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';
import { CrearLeadModal } from './crear-lead-modal';
import { VerLeadModal } from './ver-lead-modal';
import { LeadsKanban } from './leads-kanban';
import { toast } from 'sonner@2.0.3';

type VistaType = 'tabla' | 'kanban';

export function Leads() {
  const { gradients } = useTheme();
  const [vista, setVista] = useState<VistaType>('tabla');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [modalVer, setModalVer] = useState(false);
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);

  const leadsFiltrados = leads.filter(lead => {
    const matchEstado = filtroEstado === 'todos' || lead.estado === filtroEstado;
    const matchBusqueda = busqueda === '' || 
      lead.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
      lead.nombreContacto.toLowerCase().includes(busqueda.toLowerCase()) ||
      lead.numero.toString().includes(busqueda);
    return matchEstado && matchBusqueda;
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: { variant: 'outline' as const, icon: Clock, label: 'Pendiente', color: 'text-yellow-600' },
      en_gestion: { variant: 'secondary' as const, icon: AlertCircle, label: 'En Gestión', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      convertido: { variant: 'default' as const, icon: CheckCircle2, label: 'Convertido', color: 'bg-green-600' },
      descartado: { variant: 'secondary' as const, icon: XCircle, label: 'Descartado', color: '' },
    };
    const badge = badges[estado as keyof typeof badges];
    if (!badge) return null;
    const Icon = badge.icon;
    return (
      <Badge variant={badge.variant} className={`text-xs h-5 gap-1 ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const handleVerLead = (lead: Lead) => {
    setLeadSeleccionado(lead);
    setModalVer(true);
  };

  const handleCrearCotizacion = (lead: Lead) => {
    toast.success(`Crear cotización desde Lead #${lead.numero}`);
    // Aquí se abriría el modal de crear cotización con datos pre-cargados
  };

  const handleCambiarEstado = (lead: Lead, nuevoEstado: string) => {
    toast.success(`Lead #${lead.numero} marcado como ${nuevoEstado}`);
  };

  const calcularTiempo = (fecha: string) => {
    const diffHoras = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60));
    if (diffHoras < 1) return '<1h';
    if (diffHoras < 24) return `${diffHoras}h`;
    return `${Math.floor(diffHoras / 24)}d`;
  };

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
          >
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>Leads</h2>
            <p className="text-xs text-muted-foreground">Gestión de oportunidades</p>
          </div>
        </div>
        <Button 
          size="sm"
          onClick={() => setModalCrear(true)}
          className="gap-2"
          style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Lead</span>
        </Button>
      </div>

      {/* Filtros compactos y toggle de vista */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        {vista === 'tabla' && (
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="en_gestion">En Gestión</SelectItem>
            <SelectItem value="convertido">Convertidos</SelectItem>
            <SelectItem value="descartado">Descartados</SelectItem>
          </SelectContent>
        </Select>
        )}
        {/* Toggle de Vista */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <Button
            variant={vista === 'tabla' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVista('tabla')}
            className="h-9 rounded-none border-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={vista === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVista('kanban')}
            className="h-9 rounded-none border-0"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendientes', count: leads.filter(l => l.estado === 'pendiente').length },
          { label: 'En Gestión', count: leads.filter(l => l.estado === 'en_gestion').length },
          { label: 'Convertidos', count: leads.filter(l => l.estado === 'convertido').length },
        ].map((stat) => (
          <Card key={stat.label} className="p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <h4 className="mt-1">{stat.count}</h4>
          </Card>
        ))}
      </div>

      {/* Vista Tabla */}
      {vista === 'tabla' && (
        <>
          {/* Tabla compacta - Desktop */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-xs">
                <th className="px-3 py-2 text-left font-medium">Estado</th>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Razón Social</th>
                <th className="px-3 py-2 text-left font-medium">NIT</th>
                <th className="px-3 py-2 text-left font-medium">Contacto</th>
                <th className="px-3 py-2 text-right font-medium">TM</th>
                <th className="px-3 py-2 text-left font-medium">Fecha Creación</th>
                <th className="px-3 py-2 text-left font-medium">Asignado</th>
                <th className="px-3 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leadsFiltrados.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors text-sm">
                  <td className="px-3 py-2">{getEstadoBadge(lead.estado)}</td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs">#{lead.numero}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div>
                      <p className="font-medium">{lead.razonSocial}</p>
                      {lead.alerta24h && (
                        <Badge variant="destructive" className="text-[10px] h-4 mt-0.5">Alerta 24h</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{lead.nit}</td>
                  <td className="px-3 py-2">{lead.nombreContacto}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(lead.creadoEn).toLocaleString('es-CO', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{lead.asignadoA}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => handleVerLead(lead)}
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                      {lead.estado === 'en_gestion' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => handleCrearCotizacion(lead)}
                        >
                          <FileText className="h-3 w-3" />
                          Cotizar
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-sm"
                            onClick={() => handleVerLead(lead)}
                          >
                            Ver detalles
                          </DropdownMenuItem>
                          {lead.estado === 'pendiente' && (
                            <DropdownMenuItem 
                              className="text-sm"
                              onClick={() => handleCambiarEstado(lead, 'en_gestion')}
                            >
                              Marcar como En Gestión
                            </DropdownMenuItem>
                          )}
                          {lead.estado === 'en_gestion' && (
                            <DropdownMenuItem 
                              className="text-sm"
                              onClick={() => handleCrearCotizacion(lead)}
                            >
                              Crear Cotización
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-sm text-red-600">
                            Descartar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leadsFiltrados.length === 0 && (
          <div className="p-8 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron leads</p>
          </div>
        )}
      </Card>

      {/* Lista compacta - Mobile */}
      <div className="md:hidden space-y-2">
        {leadsFiltrados.map((lead) => (
          <Card key={lead.id} className="p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs">#{lead.numero}</span>
                {getEstadoBadge(lead.estado)}
                {lead.alerta24h && (
                  <Badge variant="destructive" className="text-[10px] h-4">24h</Badge>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 text-xs px-2"
                onClick={() => handleVerLead(lead)}
              >
                Ver
              </Button>
            </div>
            <h4 className="mb-1">{lead.razonSocial}</h4>
            <p className="text-xs text-muted-foreground mb-1">{lead.nit}</p>
            <p className="text-xs text-muted-foreground mb-2">{lead.nombreContacto}</p>
            {lead.estado === 'en_gestion' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full gap-1 mt-2"
                onClick={() => handleCrearCotizacion(lead)}
              >
                <FileText className="h-3 w-3" />
                Crear Cotización
              </Button>
            )}
          </Card>
        ))}
        {leadsFiltrados.length === 0 && (
          <Card className="p-8 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No se encontraron leads</p>
          </Card>
        )}
      </div>
        </>
      )}

      {/* Vista Kanban */}
      {vista === 'kanban' && (
        <Card className="p-3 overflow-hidden h-[calc(100vh-280px)] md:h-[calc(100vh-240px)]">
          <LeadsKanban
            onVerDetalle={(lead) => {
              setLeadSeleccionado(lead);
              setModalVer(true);
            }}
            onCrear={() => setModalCrear(true)}
          />
        </Card>
      )}

      {/* Modales */}
      <CrearLeadModal
        open={modalCrear}
        onOpenChange={setModalCrear}
        onCreated={(lead) => {
          console.log('Nuevo lead:', lead);
        }}
      />

      {leadSeleccionado && (
        <VerLeadModal
          open={modalVer}
          onOpenChange={setModalVer}
          lead={leadSeleccionado}
          onCrearCotizacion={handleCrearCotizacion}
        />
      )}
    </div>
  );
}