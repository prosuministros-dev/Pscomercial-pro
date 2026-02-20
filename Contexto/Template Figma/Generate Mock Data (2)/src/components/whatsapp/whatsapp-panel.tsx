import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, Send, User, CheckCheck, Clock, Bot, Search, 
  Plus, Phone, Video, MoreVertical, Paperclip, Smile, Mic,
  Image as ImageIcon, File, X, Archive, Star, VolumeX, Trash2,
  Download, ArrowLeft, Menu, Info
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { useTheme } from '../theme-provider';
import {
  conversacionesWhatsApp,
  templatesWhatsApp,
  usuarioActual,
  type ConversacionWhatsApp,
  type MensajeWhatsApp,
  type TemplateWhatsApp,
} from '../../lib/mock-data';

export function WhatsAppPanel() {
  const { gradients } = useTheme();
  const [conversaciones, setConversaciones] = useState<ConversacionWhatsApp[]>(conversacionesWhatsApp);
  const [templates, setTemplates] = useState<TemplateWhatsApp[]>(templatesWhatsApp);
  const [conversacionActiva, setConversacionActiva] = useState<ConversacionWhatsApp | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modalTemplate, setModalTemplate] = useState(false);
  const [modalCrearLead, setModalCrearLead] = useState(false);
  const [mostrarInfoContacto, setMostrarInfoContacto] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  const [archivosAdjuntos, setArchivosAdjuntos] = useState<File[]>([]);
  const [vistaMovil, setVistaMovil] = useState<'lista' | 'chat'>('lista');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversacionActiva?.mensajes]);

  const conversacionesFiltradas = conversaciones.filter(conv => {
    const matchBusqueda = busqueda === '' ||
      conv.nombreContacto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      conv.telefono.includes(busqueda);
    const matchEstado = filtroEstado === 'todos' || conv.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const handleEnviarMensaje = () => {
    if ((!nuevoMensaje.trim() && archivosAdjuntos.length === 0) || !conversacionActiva) return;

    const nuevoMsg: MensajeWhatsApp = {
      id: `msg-${Date.now()}`,
      conversacionId: conversacionActiva.id,
      direccion: 'saliente',
      remitente: 'asesor',
      contenido: nuevoMensaje || '📎 Archivo adjunto',
      tipo: archivosAdjuntos.length > 0 ? 'documento' : 'texto',
      adjuntos: archivosAdjuntos.map(f => f.name),
      creadoEn: new Date().toISOString(),
      leido: false,
    };

    setConversaciones(conversaciones.map(conv => {
      if (conv.id === conversacionActiva.id) {
        return {
          ...conv,
          mensajes: [...conv.mensajes, nuevoMsg],
          ultimoMensaje: nuevoMsg.contenido,
          ultimoMensajeEn: new Date().toISOString(),
        };
      }
      return conv;
    }));

    setConversacionActiva({
      ...conversacionActiva,
      mensajes: [...conversacionActiva.mensajes, nuevoMsg],
      ultimoMensaje: nuevoMsg.contenido,
      ultimoMensajeEn: new Date().toISOString(),
    });

    setNuevoMensaje('');
    setArchivosAdjuntos([]);
    toast.success('Mensaje enviado');
  };

  const handleUsarTemplate = (template: TemplateWhatsApp) => {
    setNuevoMensaje(template.contenido);
    setModalTemplate(false);
    toast.success(`Template "${template.nombre}" aplicado`);
  };

  const handleCrearLead = () => {
    if (!conversacionActiva) return;
    
    toast.success(`Lead creado desde conversación con ${conversacionActiva.nombreContacto || conversacionActiva.telefono}`);
    setModalCrearLead(false);
  };

  const handleArchivarConversacion = () => {
    if (!conversacionActiva) return;
    toast.success('Conversación archivada');
    setConversacionActiva(null);
  };

  const handleEliminarConversacion = () => {
    if (!conversacionActiva) return;
    setConversaciones(conversaciones.filter(c => c.id !== conversacionActiva.id));
    setConversacionActiva(null);
    toast.success('Conversación eliminada');
  };

  const handleAdjuntarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setArchivosAdjuntos([...archivosAdjuntos, ...files]);
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearFecha = (fecha: string) => {
    const hoy = new Date();
    const fechaMsg = new Date(fecha);
    
    if (fechaMsg.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    }
    
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (fechaMsg.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }
    
    return fechaMsg.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSeleccionarConversacion = (conv: ConversacionWhatsApp) => {
    // Buscar la conversación actualizada en el estado
    const conversacionActualizada = conversaciones.find(c => c.id === conv.id) || conv;
    setConversacionActiva(conversacionActualizada);
    setVistaMovil('chat');
  };

  const handleVolverLista = () => {
    setVistaMovil('lista');
    setConversacionActiva(null);
  };

  return (
    <div className="space-y-4">
      {/* Header - Solo visible en desktop */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="rounded-lg p-2"
            style={{ background: gradients ? 'var(--grad-accent)' : 'var(--color-primary)' }}
          >
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2>WhatsApp Business</h2>
            <p className="text-xs text-muted-foreground">Chat y gestión de conversaciones</p>
          </div>
        </div>
      </div>

      {/* Stats - Solo visible en desktop */}
      <div className="hidden md:grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-2">
              <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Activas</p>
              <h4>{conversaciones.filter(c => c.estado === 'activa').length}</h4>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pausadas</p>
              <h4>{conversaciones.filter(c => c.estado === 'pausada').length}</h4>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-gray-100 dark:bg-gray-900/20 p-2">
              <CheckCheck className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cerradas</p>
              <h4>{conversaciones.filter(c => c.estado === 'cerrada').length}</h4>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-2">
              <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Templates</p>
              <h4>{templates.filter(t => t.activo).length}</h4>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content - Layout Responsive con altura optimizada para móvil */}
      <Card className="h-[calc(100vh-220px)] md:h-[600px] flex overflow-hidden">
        {/* Lista de Conversaciones - Oculta en mobile cuando hay chat activo */}
        <div className={`${
          vistaMovil === 'chat' ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 border-r flex-col`}>
          {/* Header de Lista */}
          <div className="p-3 md:p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm md:text-base">Conversaciones</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setModalTemplate(true)}
                  className="h-8 w-8 p-0"
                >
                  <Bot className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setModalTemplate(true)}>
                      <Bot className="h-4 w-4 mr-2" />
                      Templates
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archivados
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar o iniciar chat..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 h-9 text-sm"
              />
            </div>

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las conversaciones</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="pausada">Pausadas</SelectItem>
                <SelectItem value="cerrada">Cerradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Conversaciones */}
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {conversacionesFiltradas.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSeleccionarConversacion(conv)}
                  className={`w-full p-3 md:p-4 text-left hover:bg-secondary/50 transition-colors ${
                    conversacionActiva?.id === conv.id ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                      <AvatarFallback>
                        {conv.nombreContacto ? conv.nombreContacto[0].toUpperCase() : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {conv.nombreContacto || conv.telefono}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatearHora(conv.ultimoMensajeEn)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        {conv.mensajes[conv.mensajes.length - 1]?.direccion === 'saliente' && (
                          <CheckCheck className="h-3 w-3 flex-shrink-0" />
                        )}
                        {conv.ultimoMensaje}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant={conv.estado === 'activa' ? 'default' : 'secondary'}
                          className="text-xs h-4 px-1.5"
                        >
                          {conv.estado}
                        </Badge>
                        {conv.leadId && (
                          <Badge variant="outline" className="text-xs h-4 px-1.5">Lead</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Área de Chat - Oculta en mobile cuando no hay chat activo */}
        {conversacionActiva ? (
          <div className={`${
            vistaMovil === 'lista' ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col`}>
            {/* Header del Chat */}
            <div className="p-3 md:p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Botón Volver - Solo mobile */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleVolverLista}
                    className="md:hidden h-8 w-8 p-0 flex-shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback>
                      {conversacionActiva.nombreContacto ? conversacionActiva.nombreContacto[0].toUpperCase() : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversacionActiva.nombreContacto || conversacionActiva.telefono}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {escribiendo ? 'Escribiendo...' : `Última vez ${formatearHora(conversacionActiva.ultimoMensajeEn)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hidden md:flex">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hidden md:flex">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMostrarInfoContacto(true)}
                    className="h-8 w-8 p-0 hidden md:flex"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setMostrarInfoContacto(true)}>
                        <Info className="h-4 w-4 mr-2" />
                        Info del contacto
                      </DropdownMenuItem>
                      {!conversacionActiva.leadId && (
                        <DropdownMenuItem onClick={() => setModalCrearLead(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Lead
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Star className="h-4 w-4 mr-2" />
                        Marcar favorito
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleArchivarConversacion}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archivar chat
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Silenciar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleEliminarConversacion} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 bg-secondary/20">
              <div className="space-y-3 md:space-y-4">
                {conversacionActiva.mensajes.map((mensaje, index) => {
                  const mostrarFecha = index === 0 || 
                    formatearFecha(mensaje.creadoEn) !== formatearFecha(conversacionActiva.mensajes[index - 1].creadoEn);

                  return (
                    <div key={mensaje.id}>
                      {mostrarFecha && (
                        <div className="flex justify-center my-4">
                          <Badge variant="secondary" className="text-xs px-3 py-1">
                            {formatearFecha(mensaje.creadoEn)}
                          </Badge>
                        </div>
                      )}
                      
                      <div
                        className={`flex ${mensaje.direccion === 'saliente' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                          {mensaje.direccion === 'entrante' && (
                            <Avatar className="h-6 w-6 flex-shrink-0 hidden md:block">
                              <AvatarFallback className="text-xs">
                                {conversacionActiva.nombreContacto ? conversacionActiva.nombreContacto[0].toUpperCase() : <User className="h-3 w-3" />}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div
                            className={`rounded-lg p-2 md:p-3 ${
                              mensaje.direccion === 'saliente'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-background border rounded-bl-none'
                            }`}
                          >
                            {mensaje.tipo !== 'texto' && mensaje.adjuntos && mensaje.adjuntos.length > 0 && (
                              <div className="mb-2 space-y-1">
                                {mensaje.adjuntos.map((adjunto, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-secondary/50 rounded">
                                    <File className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-xs truncate flex-1">{adjunto}</span>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <p className="text-sm whitespace-pre-wrap break-words">{mensaje.contenido}</p>
                            
                            <div className="flex items-center gap-1 mt-1 justify-end">
                              <span className={`text-xs ${
                                mensaje.direccion === 'saliente' ? 'opacity-70' : 'text-muted-foreground'
                              }`}>
                                {formatearHora(mensaje.creadoEn)}
                              </span>
                              {mensaje.direccion === 'saliente' && (
                                <CheckCheck className={`h-3 w-3 ${mensaje.leido ? 'text-blue-500' : 'opacity-40'}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input de Mensaje */}
            <div className="p-3 md:p-4 border-t bg-background">
              {/* Archivos adjuntos preview */}
              {archivosAdjuntos.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {archivosAdjuntos.map((archivo, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary p-2 rounded text-xs">
                      <File className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{archivo.name}</span>
                      <button
                        onClick={() => setArchivosAdjuntos(archivosAdjuntos.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalTemplate(true)}
                    className="h-8 w-8 md:h-9 md:w-9 p-0"
                    title="Templates"
                  >
                    <Bot className="h-4 w-4" />
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleAdjuntarArchivo}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 md:h-9 md:w-9 p-0"
                    title="Adjuntar archivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 md:h-9 md:w-9 p-0 hidden md:flex"
                    title="Emojis"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  value={nuevoMensaje}
                  onChange={(e) => {
                    setNuevoMensaje(e.target.value);
                    setEscribiendo(true);
                    setTimeout(() => setEscribiendo(false), 1000);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviarMensaje();
                    }
                  }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm"
                  rows={1}
                />
                
                {nuevoMensaje.trim() || archivosAdjuntos.length > 0 ? (
                  <Button
                    onClick={handleEnviarMensaje}
                    style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
                    className="h-9 w-9 md:h-10 md:w-10 p-0 flex-shrink-0"
                    title="Enviar mensaje"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 md:h-10 md:w-10 p-0 flex-shrink-0"
                    title="Mensaje de voz"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-secondary/20">
            <div className="text-center px-4">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="mb-2">WhatsApp Business</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Selecciona una conversación para ver los mensajes o inicia un nuevo chat
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Sheet - Info del Contacto */}
      <Sheet open={mostrarInfoContacto} onOpenChange={setMostrarInfoContacto}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Información del contacto</SheetTitle>
            <SheetDescription>Detalles y opciones de la conversación</SheetDescription>
          </SheetHeader>

          {conversacionActiva && (
            <div className="space-y-6 mt-6">
              {/* Avatar y nombre */}
              <div className="flex flex-col items-center text-center pb-6 border-b">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {conversacionActiva.nombreContacto ? conversacionActiva.nombreContacto[0].toUpperCase() : <User className="h-12 w-12" />}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mb-1">{conversacionActiva.nombreContacto || 'Sin nombre'}</h3>
                <p className="text-sm text-muted-foreground">{conversacionActiva.telefono}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={conversacionActiva.estado === 'activa' ? 'default' : 'secondary'}>
                    {conversacionActiva.estado}
                  </Badge>
                  {conversacionActiva.leadId && (
                    <Badge variant="outline">Lead asociado</Badge>
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="space-y-3">
                <h4 className="text-sm">Estadísticas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Total mensajes</p>
                    <p className="text-xl">{conversacionActiva.mensajes.length}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">Tiempo activo</p>
                    <p className="text-xl">5d</p>
                  </Card>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-2">
                <h4 className="text-sm mb-3">Acciones</h4>
                
                {!conversacionActiva.leadId && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setMostrarInfoContacto(false);
                      setModalCrearLead(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Crear Lead
                  </Button>
                )}
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Star className="h-4 w-4" />
                  Marcar como favorito
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleArchivarConversacion}>
                  <Archive className="h-4 w-4" />
                  Archivar conversación
                </Button>
                
                <Button variant="outline" className="w-full justify-start gap-2">
                  <VolumeX className="h-4 w-4" />
                  Silenciar notificaciones
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={handleEliminarConversacion}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar conversación
                </Button>
              </div>

              {/* Multimedia compartido */}
              <div className="space-y-3">
                <h4 className="text-sm">Multimedia y archivos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-secondary rounded flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal Templates */}
      <Dialog open={modalTemplate} onOpenChange={setModalTemplate}>
        <DialogContent className="max-w-full md:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Templates de WhatsApp</DialogTitle>
            <DialogDescription>
              Selecciona un template para enviar un mensaje predefinido
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="todos">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto md:h-9 gap-1">
              <TabsTrigger value="todos" className="text-xs py-2">Todos</TabsTrigger>
              <TabsTrigger value="bienvenida" className="text-xs py-2">Bienvenida</TabsTrigger>
              <TabsTrigger value="cotizacion" className="text-xs py-2">Cotización</TabsTrigger>
              <TabsTrigger value="confirmacion" className="text-xs py-2 hidden md:flex">Confirmación</TabsTrigger>
              <TabsTrigger value="recordatorio" className="text-xs py-2 hidden md:flex">Recordatorio</TabsTrigger>
            </TabsList>

            {['todos', 'bienvenida', 'cotizacion', 'confirmacion', 'recordatorio'].map(categoria => (
              <TabsContent key={categoria} value={categoria} className="space-y-3 mt-4">
                {templates
                  .filter(t => categoria === 'todos' || t.categoria === categoria)
                  .map((template) => (
                    <Card key={template.id} className="p-3 md:p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm md:text-base mb-1">{template.nombre}</h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.categoria}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUsarTemplate(template)}
                          style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
                          className="w-full md:w-auto"
                        >
                          Usar Template
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {template.contenido}
                      </p>
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <p className="text-xs text-muted-foreground">Variables:</p>
                          {template.variables.map((variable, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {'{{' + variable + '}}'}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Lead */}
      <Dialog open={modalCrearLead} onOpenChange={setModalCrearLead}>
        <DialogContent className="max-w-full md:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Crear Lead desde WhatsApp</DialogTitle>
            <DialogDescription>
              Convierte esta conversación en un lead comercial
            </DialogDescription>
          </DialogHeader>

          {conversacionActiva && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary rounded-lg space-y-2">
                <p className="text-sm"><strong>Contacto:</strong> {conversacionActiva.nombreContacto || 'Sin nombre'}</p>
                <p className="text-sm"><strong>Teléfono:</strong> {conversacionActiva.telefono}</p>
                <p className="text-sm"><strong>Mensajes:</strong> {conversacionActiva.mensajes.length}</p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  ℹ️ El historial completo de la conversación quedará asociado al lead.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalCrearLead(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleCrearLead}
              className="flex-1"
              style={{ background: gradients ? 'var(--grad-brand)' : 'var(--color-primary)', color: 'white' }}
            >
              Crear Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}