import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Search, 
  MessageSquare,
  Send,
  ExternalLink,
  Star,
  Circle,
  CheckCircle2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Sheet, SheetContent } from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';
import { notificaciones as notificacionesData, usuarios, usuarioActual } from '../../lib/mock-data';
import type { Notificacion } from '../../lib/mock-data';

interface NotificacionesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNotificacionClick?: (notificacion: Notificacion) => void;
}

export function NotificacionesPanel({ 
  open, 
  onOpenChange,
  onNotificacionClick 
}: NotificacionesPanelProps) {
  const { gradients } = useTheme();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(notificacionesData);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('todos');
  const [hiloAbierto, setHiloAbierto] = useState<string | null>(null);
  const [mensajeNuevo, setMensajeNuevo] = useState('');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const LIMITE_INICIAL = 50; // Mostrar 50 notificaciones inicialmente

  // Marcar todas como leídas al abrir
  useEffect(() => {
    if (open) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } else {
      // Limpiar estados al cerrar
      setHiloAbierto(null);
      setMensajeNuevo('');
      setBusqueda('');
    }
  }, [open]);

  // Limpiar mensaje al cambiar de hilo
  useEffect(() => {
    setMensajeNuevo('');
  }, [hiloAbierto]);

  // Resetear "mostrar todas" al cambiar filtros
  useEffect(() => {
    setMostrarTodas(false);
  }, [busqueda, filtroTipo, filtroFecha]);

  // Filtrar notificaciones
  const notificacionesFiltradas = notificaciones.filter(n => {
    // Filtro de búsqueda
    if (busqueda) {
      const search = busqueda.toLowerCase();
      const matchMensaje = n.mensaje.toLowerCase().includes(search);
      const matchRemitente = n.remitente.toLowerCase().includes(search);
      const matchNumero = n.vinculo?.numero.toString().includes(search);
      if (!matchMensaje && !matchRemitente && !matchNumero) return false;
    }

    // Filtro de tipo
    if (filtroTipo !== 'todos' && n.tipo !== filtroTipo) return false;

    // Filtro de fecha
    if (filtroFecha !== 'todos') {
      const fechaNotif = new Date(n.creadoEn);
      const ahora = new Date();
      const diffDias = Math.floor((ahora.getTime() - fechaNotif.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filtroFecha === 'hoy' && diffDias > 0) return false;
      if (filtroFecha === 'semana' && diffDias > 7) return false;
      if (filtroFecha === 'mes' && diffDias > 30) return false;
    }

    return true;
  });

  // Agrupar por fecha
  const agruparPorFecha = (notifs: Notificacion[]) => {
    const grupos: { [key: string]: Notificacion[] } = {
      hoy: [],
      ayer: [],
      semana: [],
      antiguas: []
    };

    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const semanaAtras = new Date(hoy);
    semanaAtras.setDate(semanaAtras.getDate() - 7);

    // Limitar cantidad si no se está mostrando todas
    const notifsLimitadas = (!mostrarTodas && notifs.length > LIMITE_INICIAL) 
      ? notifs.slice(0, LIMITE_INICIAL) 
      : notifs;

    notifsLimitadas.forEach(n => {
      const fecha = new Date(n.creadoEn);
      const fechaSinHora = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

      if (fechaSinHora.getTime() === hoy.getTime()) {
        grupos.hoy.push(n);
      } else if (fechaSinHora.getTime() === ayer.getTime()) {
        grupos.ayer.push(n);
      } else if (fechaSinHora >= semanaAtras) {
        grupos.semana.push(n);
      } else {
        grupos.antiguas.push(n);
      }
    });

    return grupos;
  };

  const gruposNotificaciones = agruparPorFecha(notificacionesFiltradas);
  const hayMasNotificaciones = notificacionesFiltradas.length > LIMITE_INICIAL && !mostrarTodas;

  // Estadísticas rápidas
  const stats = {
    importantes: notificaciones.filter(n => n.importante).length,
    noRespondidas: notificaciones.filter(n => !n.respondida && (n.hilo?.length ?? 0) === 0).length,
    noLeidas: notificaciones.filter(n => !n.leida).length,
  };

  const handleMarcarImportante = (id: string) => {
    setNotificaciones(prev => prev.map(n => 
      n.id === id ? { ...n, importante: !n.importante } : n
    ));
    toast.success('Notificación actualizada');
  };

  const handleEnviarMensaje = (notificacionId: string) => {
    if (!mensajeNuevo.trim()) return;

    const nuevoMensaje = {
      id: `msg-${Date.now()}`,
      remitenteId: usuarioActual.id,
      remitente: usuarioActual.nombre,
      texto: mensajeNuevo,
      creadoEn: new Date().toISOString(),
    };

    setNotificaciones(prev => prev.map(n => {
      if (n.id === notificacionId) {
        return {
          ...n,
          respondida: true,
          hilo: [...(n.hilo || []), nuevoMensaje],
        };
      }
      return n;
    }));

    setMensajeNuevo('');
    toast.success('Mensaje enviado');

    // Notificar a destinatarios
    setTimeout(() => {
      toast.info('Los destinatarios han sido notificados');
    }, 500);
  };

  const handleIrAVinculo = (notificacion: Notificacion) => {
    if (notificacion.vinculo) {
      toast.info(`Redirigiendo a ${notificacion.vinculo.tipo} #${notificacion.vinculo.numero}...`);
      onNotificacionClick?.(notificacion);
      onOpenChange(false);
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'automatica': return 'text-blue-500';
      case 'manual': return 'text-purple-500';
      case 'administrativa': return 'text-orange-500';
      case 'transaccional': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getColorBorde = (tipo: string) => {
    switch (tipo) {
      case 'automatica': return 'border-l-blue-500';
      case 'manual': return 'border-l-purple-500';
      case 'administrativa': return 'border-l-orange-500';
      case 'transaccional': return 'border-l-green-500';
      default: return 'border-l-muted-foreground';
    }
  };

  const getUsuario = (remitenteId: string) => {
    if (remitenteId === 'system') {
      return {
        nombre: 'Sistema',
        avatar: '',
        rol: 'Automatizado',
      };
    }
    return usuarios.find(u => u.id === remitenteId) || {
      nombre: 'Usuario',
      avatar: '',
      rol: 'Desconocido',
    };
  };

  const formatearTiempo = (fecha: string) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora.getTime() - fechaNotif.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    
    return fechaNotif.toLocaleDateString('es-CO', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[380px] sm:max-w-[380px] p-0 flex flex-col">
        {/* Header ultra-compacto */}
        <div className="px-4 py-3 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h3 className="text-sm">Notificaciones</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {notificacionesFiltradas.length}
            </span>
          </div>

          {/* Stats rápidas */}
          {!busqueda && filtroTipo === 'todos' && filtroFecha === 'todos' && (
            <div className="flex gap-2 mb-3">
              {stats.importantes > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-yellow-600 dark:text-yellow-400">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{stats.importantes}</span>
                </div>
              )}
              {stats.noRespondidas > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400">
                  <MessageSquare className="h-3 w-3" />
                  <span>{stats.noRespondidas}</span>
                </div>
              )}
              {stats.noLeidas > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-primary">
                  <Circle className="h-3 w-3 fill-current" />
                  <span>{stats.noLeidas}</span>
                </div>
              )}
            </div>
          )}

          {/* Búsqueda compacta */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 h-8 text-xs border-border/50"
            />
          </div>

          {/* Filtros inline minimalistas */}
          <div className="flex gap-1.5 mt-2">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-6 text-[10px] flex-1 border-0 bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="automatica">Auto</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="administrativa">Admin</SelectItem>
                <SelectItem value="transaccional">Trans.</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtroFecha} onValueChange={setFiltroFecha}>
              <SelectTrigger className="h-6 text-[10px] flex-1 border-0 bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">7d</SelectItem>
                <SelectItem value="mes">30d</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista ultra-compacta agrupada */}
        <ScrollArea className="flex-1">
          {notificacionesFiltradas.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Sin notificaciones</p>
            </div>
          ) : (
            <div>
              {/* Renderizar grupos */}
              {Object.entries(gruposNotificaciones).map(([grupo, notifs]) => {
                if (notifs.length === 0) return null;

                const etiquetas: { [key: string]: string } = {
                  hoy: 'Hoy',
                  ayer: 'Ayer',
                  semana: 'Esta semana',
                  antiguas: 'Anteriores'
                };

                return (
                  <div key={grupo}>
                    {/* Header de grupo sticky */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-1.5 border-b border-border/30">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {etiquetas[grupo]} ({notifs.length})
                      </span>
                    </div>

                    {/* Notificaciones del grupo */}
                    <div className="divide-y divide-border/30">
                      {notifs.map((notificacion) => {
                const usuario = getUsuario(notificacion.remitenteId);
                const esHiloAbierto = hiloAbierto === notificacion.id;

                return (
                  <Collapsible
                    key={notificacion.id}
                    open={esHiloAbierto}
                    onOpenChange={(open) => setHiloAbierto(open ? notificacion.id : null)}
                  >
                    {/* Notificación compacta */}
                    <div className={`
                      px-4 py-2.5 transition-all hover:bg-secondary/30 cursor-pointer border-l-2
                      ${!notificacion.leida 
                        ? 'bg-primary/5 border-l-primary' 
                        : `border-l-transparent hover:${getColorBorde(notificacion.tipo)}`
                      }
                      ${esHiloAbierto ? 'bg-secondary/20' : ''}
                    `}>
                      <div className="flex items-start gap-2.5">
                        {/* Avatar mini */}
                        <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                          {usuario.avatar ? (
                            <AvatarImage src={usuario.avatar} alt={usuario.nombre} />
                          ) : (
                            <AvatarFallback className="text-[10px]">
                              {usuario.nombre.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        {/* Contenido ultra-denso */}
                        <div className="flex-1 min-w-0">
                          {/* Header en una línea */}
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="text-[11px] truncate">
                                {usuario.nombre}
                              </span>
                              <Circle className={`h-1 w-1 fill-current ${getColorTipo(notificacion.tipo)}`} />
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {formatearTiempo(notificacion.creadoEn)}
                              </span>
                            </div>

                            {/* Acciones inline */}
                            <div className="flex items-center gap-1 shrink-0">
                              {notificacion.importante && (
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              )}
                              {!notificacion.leida && (
                                <Circle className="h-1.5 w-1.5 fill-primary text-primary" />
                              )}
                            </div>
                          </div>

                          {/* Mensaje compacto */}
                          <p className="text-xs leading-snug text-foreground/90 mb-1.5">
                            {notificacion.mensaje}
                          </p>

                          {/* Acciones en línea */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Vínculo compacto */}
                            {notificacion.vinculo && (
                              <button
                                onClick={() => handleIrAVinculo(notificacion)}
                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                {notificacion.vinculo.tipo} #{notificacion.vinculo.numero}
                              </button>
                            )}

                            {/* Respuestas */}
                            {notificacion.hilo && notificacion.hilo.length > 0 ? (
                              <CollapsibleTrigger asChild>
                                <button className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                  {esHiloAbierto ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                  {notificacion.hilo.length} resp.
                                </button>
                              </CollapsibleTrigger>
                            ) : (
                              <CollapsibleTrigger asChild>
                                <button className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                                  <MessageSquare className="h-2.5 w-2.5" />
                                  Responder
                                </button>
                              </CollapsibleTrigger>
                            )}

                            {/* Importante toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarcarImportante(notificacion.id);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-yellow-500"
                            >
                              <Star className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Hilo expandible */}
                    <CollapsibleContent>
                      <div className="px-4 pb-3 pt-2 bg-secondary/20 border-t border-border/30">
                        {/* Mensajes */}
                        {notificacion.hilo && notificacion.hilo.length > 0 && (
                          <div className="space-y-1.5 mb-2.5">
                            {notificacion.hilo.map((mensaje) => {
                              const esMio = mensaje.remitenteId === usuarioActual.id;
                              const usuarioMsg = getUsuario(mensaje.remitenteId);

                              return (
                                <div
                                  key={mensaje.id}
                                  className={`flex gap-1.5 ${esMio ? 'flex-row-reverse' : ''}`}
                                >
                                  <Avatar className="h-5 w-5 flex-shrink-0">
                                    {usuarioMsg.avatar ? (
                                      <AvatarImage src={usuarioMsg.avatar} alt={usuarioMsg.nombre} />
                                    ) : (
                                      <AvatarFallback className="text-[9px]">
                                        {usuarioMsg.nombre.charAt(0)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className={`flex-1 ${esMio ? 'text-right' : ''}`}>
                                    <div className={`
                                      inline-block max-w-[85%] rounded-md px-2 py-1 text-[11px]
                                      ${esMio 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-background border border-border/50'
                                      }
                                    `}>
                                      <p className="text-[9px] opacity-70 mb-0.5">
                                        {usuarioMsg.nombre}
                                      </p>
                                      <p className="leading-snug">{mensaje.texto}</p>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground mt-0.5">
                                      {formatearTiempo(mensaje.creadoEn)}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Input respuesta compacto */}
                        <div className="flex gap-1.5">
                          <Textarea
                            value={mensajeNuevo}
                            onChange={(e) => setMensajeNuevo(e.target.value)}
                            placeholder="Responder..."
                            rows={1}
                            className="text-xs resize-none min-h-[32px] h-8 py-1.5"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleEnviarMensaje(notificacion.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleEnviarMensaje(notificacion.id)}
                            disabled={!mensajeNuevo.trim()}
                            className="h-8 w-8 p-0 shrink-0"
                            style={{ 
                              background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', 
                              color: 'white' 
                            }}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer minimalista */}
        <div className="px-4 py-2 border-t border-border/30 flex-shrink-0">
          {hayMasNotificaciones ? (
            <button
              onClick={() => setMostrarTodas(true)}
              className="w-full text-[10px] text-primary hover:text-primary/80 transition-colors py-1"
            >
              Cargar {notificacionesFiltradas.length - LIMITE_INICIAL} más notificaciones
            </button>
          ) : (
            <button
              onClick={() => toast.info('Vista completa de historial próximamente')}
              className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Ver historial completo
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
