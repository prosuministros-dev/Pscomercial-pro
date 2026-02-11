// Mock data para sistema Make to Order - Prosuministros

// Importar data extendida
import { cotizacionesExtendidas, pedidosExtendidos } from './mock-data-extended';

// ============================================
// INTERFACES TYPESCRIPT
// ============================================

export interface Permiso {
  id: string;
  modulo: 'leads' | 'cotizaciones' | 'pedidos' | 'reportes' | 'configuracion' | 'usuarios' | 'financiero' | 'compras' | 'logistica';
  accion: 'crear' | 'editar' | 'ver' | 'eliminar' | 'aprobar' | 'exportar';
  descripcion: string;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  estado: 'activo' | 'inactivo';
  permisos: string[];
  creadoPor: string;
  creadoEn: string;
  modificadoPor?: string;
  modificadoEn?: string;
}

export interface BitacoraAdministrativa {
  id: string;
  tipo: 'rol_creado' | 'rol_modificado' | 'rol_eliminado' | 'usuario_creado' | 'usuario_modificado' | 'rol_asignado' | 'permiso_modificado';
  entidadTipo: 'rol' | 'usuario' | 'permiso';
  entidadId: string;
  usuarioId: string;
  usuario: string;
  accion: string;
  valorAnterior?: any;
  valorNuevo?: any;
  descripcion: string;
  creadoEn: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  avatar: string;
  roles: string[];
  estado: 'activo' | 'inactivo';
  area: string;
  ultimaActividad?: string;
  creadoPor: string;
  creadoEn: string;
}

export interface BloqueoCartera {
  id: string;
  clienteNit: string;
  clienteRazonSocial: string;
  bloqueado: boolean;
  motivo?: string;
  montoDeuda?: number;
  diasVencimiento?: number;
  bloqueadoPor?: string;
  bloqueadoEn?: string;
  desbloqueadoPor?: string;
  desbloqueadoEn?: string;
}

export interface BitacoraBloqueo {
  id: string;
  bloqueoId: string;
  accion: 'bloquear' | 'desbloquear' | 'modificar';
  usuarioId: string;
  usuario: string;
  motivo: string;
  valorAnterior: boolean;
  valorNuevo: boolean;
  creadoEn: string;
}

export interface ConfiguracionMargen {
  id: string;
  categoria: 'software' | 'hardware' | 'partes' | 'servicios';
  margenMinimo: number;
  margenObjetivo: number;
  requiereAprobacion: boolean;
  nivelAprobacion: 'gerencia' | 'financiera' | 'direccion';
}

export interface SolicitudAprobacion {
  id: string;
  tipo: 'margen_bajo' | 'descuento_especial' | 'credito_especial' | 'facturacion_anticipada';
  cotizacionId?: string;
  cotizacionNumero?: number;
  pedidoId?: string;
  pedidoNumero?: number;
  solicitadoPor: string;
  solicitadoEn: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  margenCalculado?: number;
  margenMinimo?: number;
  margenAprobado?: number;
  motivo: string;
  aprobadoPor?: string;
  aprobadoEn?: string;
  comentarios?: string;
}

export interface ConversacionWhatsApp {
  id: string;
  telefono: string;
  nombreContacto?: string;
  leadId?: string;
  estado: 'activa' | 'cerrada' | 'pausada';
  ultimoMensaje: string;
  ultimoMensajeEn: string;
  mensajes: MensajeWhatsApp[];
  creadoEn: string;
}

export interface MensajeWhatsApp {
  id: string;
  conversacionId: string;
  direccion: 'entrante' | 'saliente';
  remitente: 'bot' | 'usuario' | 'asesor';
  contenido: string;
  tipo: 'texto' | 'imagen' | 'documento' | 'template';
  adjuntos?: string[];
  creadoEn: string;
  leido: boolean;
}

export interface TemplateWhatsApp {
  id: string;
  nombre: string;
  categoria: 'bienvenida' | 'cotizacion' | 'seguimiento' | 'confirmacion' | 'recordatorio';
  contenido: string;
  variables: string[];
  activo: boolean;
}

export interface DocumentoGenerado {
  id: string;
  tipo: 'cotizacion' | 'proforma' | 'pedido' | 'factura' | 'remision';
  numero: string;
  relacionadoTipo: 'cotizacion' | 'pedido';
  relacionadoId: string;
  relacionadoNumero: number;
  urlPdf: string;
  generadoPor: string;
  generadoEn: string;
  enviadoPor?: string[];
  enviadoEn?: string;
}

export interface Lead {
  id: string;
  numero: number;
  origen: 'WhatsApp' | 'Web' | 'Manual' | 'Email' | 'Teléfono';
  asignadoA: string;
  asignadoEn?: string;
  asignadoPor?: string;
  razonSocial: string;
  nit: string;
  nombreContacto: string;
  email: string;
  telefono: string;
  requerimiento: string;
  fechaLead: string;
  estado: 'creado' | 'pendiente' | 'en_gestion' | 'convertido' | 'descartado';
  motivoDescarte?: string;
  alerta24h: boolean;
  creadoPor: string;
  creadoEn: string;
  convertidoEn?: string;
  margenEstimado?: number;
  observaciones?: ObservacionLead[];
  conversacionWhatsAppId?: string;
}

export interface ObservacionLead {
  id: string;
  usuarioId: string;
  usuario: string;
  texto: string;
  menciones: string[];
  creadoEn: string;
}

export interface ItemCotizacion {
  id: string;
  sku: string;
  descripcion: string;
  categoria: 'software' | 'hardware' | 'partes';
  cantidad: number;
  costoUnitario: number;
  precioUnitario: number;
  impuesto: number;
  margen: number;
}

export interface Cotizacion {
  id: string;
  numero: number;
  fechaCotizacion: string;
  estadoCotizacion: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida';
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida';
  razonSocial: string;
  nit: string;
  nombreContacto: string;
  email: string;
  telefono: string;
  asunto: string;
  items: ItemCotizacion[];
  observaciones: string;
  subtotal: number;
  impuestos: number;
  total: number;
  vigencia: number;
  creadoPor: string;
  creadoEn: string;
  modificadoEn?: string;
  enviadaEn?: string;
  aprobadaEn?: string;
  vencimiento: string;
  margen: number;
  requiereAprobacion?: boolean;
  aprobadoPor?: string;
  aprobadoEn?: string;
  aprobacionGerenciaRequerida?: boolean;
  leadId?: string;
}

export interface Pedido {
  id: string;
  numero: number;
  cotizacionId?: string;
  fechaPedido: string;
  estado: 'por_facturar' | 'facturado_sin_pago' | 'pendiente_compra' | 'en_bodega' | 'despachado' | 'entregado';
  cliente: {
    razonSocial: string;
    nit: string;
    nombreContacto: string;
    email: string;
    telefono: string;
  };
  items: ItemCotizacion[];
  observaciones: string;
  subtotal: number;
  impuestos: number;
  total: number;
  creadoPor: string;
  creadoEn: string;
  modificadoEn?: string;
  facturado?: boolean;
  fechaFacturacion?: string;
  numeroFactura?: string;
  pagoConfirmado?: boolean;
  fechaPagoConfirmado?: string;
  compraRealizada?: boolean;
  fechaCompra?: string;
  enBodega?: boolean;
  fechaRecepcion?: string;
  fechaDespacho?: string;
  fechaEntrega?: string;
  direccionEntrega?: DireccionEntrega;
}

export interface DireccionEntrega {
  direccion: string;
  ciudad: string;
  departamento: string;
  indicaciones?: string;
}

export interface Producto {
  id: string;
  sku: string;
  descripcion: string;
  categoria: 'software' | 'hardware' | 'partes';
  fabricante: string;
  costo: number;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface Cliente {
  id: string;
  razonSocial: string;
  nit: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
}

export interface Notificacion {
  id: string;
  tipo: 'cotizacion_enviada' | 'pedido_nuevo' | 'lead_nuevo' | 'aprobacion_requerida' | 'pago_confirmado';
  titulo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
  vinculo?: {
    tipo: 'cotizacion' | 'pedido' | 'lead';
    id: string;
  };
}

export interface Observacion {
  id: string;
  pedidoId: string;
  remitente: string;
  destinatarios: string[];
  texto: string;
  creadoEn: string;
  inmutable: boolean;
}

export interface Departamento {
  codigo: string;
  nombre: string;
}

export interface MetricaDashboard {
  id: string;
  label: string;
  valor: string;
  cambio: number;
  tendencia: 'up' | 'down' | 'neutral';
}

export interface InformacionDespacho {
  pedidoId: string;
  transportadora?: string;
  guia?: string;
  fechaEstimadaEntrega?: string;
  destinatario?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  observaciones?: string;
}

// ============================================
// CONFIGURACIÓN DE LA APP
// ============================================

export const configApp = {
  nombre: 'Prosuministros',
  tagline: 'Sistema Make to Order',
  descripcion: 'Gestión integral de leads, cotizaciones y pedidos',
  version: '1.0.0',
  emailSoporte: 'soporte@prosuministros.com',
};

// ============================================
// PERMISOS
// ============================================

export const permisos: Permiso[] = [
  // Leads
  { id: 'perm-1', modulo: 'leads', accion: 'ver', descripcion: 'Ver listado de leads' },
  { id: 'perm-2', modulo: 'leads', accion: 'crear', descripcion: 'Crear nuevos leads' },
  { id: 'perm-3', modulo: 'leads', accion: 'editar', descripcion: 'Editar leads existentes' },
  { id: 'perm-4', modulo: 'leads', accion: 'eliminar', descripcion: 'Eliminar leads' },
  
  // Cotizaciones
  { id: 'perm-5', modulo: 'cotizaciones', accion: 'ver', descripcion: 'Ver listado de cotizaciones' },
  { id: 'perm-6', modulo: 'cotizaciones', accion: 'crear', descripcion: 'Crear cotizaciones' },
  { id: 'perm-7', modulo: 'cotizaciones', accion: 'editar', descripcion: 'Editar cotizaciones' },
  { id: 'perm-8', modulo: 'cotizaciones', accion: 'eliminar', descripcion: 'Eliminar cotizaciones' },
  { id: 'perm-9', modulo: 'cotizaciones', accion: 'aprobar', descripcion: 'Aprobar cotizaciones con margen bajo' },
  
  // Pedidos
  { id: 'perm-10', modulo: 'pedidos', accion: 'ver', descripcion: 'Ver listado de pedidos' },
  { id: 'perm-11', modulo: 'pedidos', accion: 'crear', descripcion: 'Crear pedidos' },
  { id: 'perm-12', modulo: 'pedidos', accion: 'editar', descripcion: 'Editar pedidos' },
  { id: 'perm-13', modulo: 'pedidos', accion: 'aprobar', descripcion: 'Aprobar pedidos' },
  
  // Financiero
  { id: 'perm-14', modulo: 'financiero', accion: 'ver', descripcion: 'Ver información financiera' },
  { id: 'perm-15', modulo: 'financiero', accion: 'editar', descripcion: 'Marcar bloqueo de cartera' },
  { id: 'perm-16', modulo: 'financiero', accion: 'aprobar', descripcion: 'Aprobar facturación anticipada' },
  
  // Reportes
  { id: 'perm-17', modulo: 'reportes', accion: 'ver', descripcion: 'Ver reportes' },
  { id: 'perm-18', modulo: 'reportes', accion: 'exportar', descripcion: 'Exportar reportes' },
  
  // Usuarios
  { id: 'perm-19', modulo: 'usuarios', accion: 'ver', descripcion: 'Ver usuarios' },
  { id: 'perm-20', modulo: 'usuarios', accion: 'crear', descripcion: 'Crear usuarios' },
  { id: 'perm-21', modulo: 'usuarios', accion: 'editar', descripcion: 'Editar usuarios' },
  
  // Configuración
  { id: 'perm-22', modulo: 'configuracion', accion: 'ver', descripcion: 'Ver configuración' },
  { id: 'perm-23', modulo: 'configuracion', accion: 'editar', descripcion: 'Modificar configuración' },
];

// ============================================
// ROLES
// ============================================

export const roles: Rol[] = [
  {
    id: 'rol-1',
    nombre: 'Administrador',
    descripcion: 'Acceso completo al sistema',
    estado: 'activo',
    permisos: permisos.map(p => p.id),
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:00:00Z',
  },
  {
    id: 'rol-2',
    nombre: 'Comercial',
    descripcion: 'Asesor comercial con acceso a leads y cotizaciones',
    estado: 'activo',
    permisos: ['perm-1', 'perm-2', 'perm-3', 'perm-5', 'perm-6', 'perm-7', 'perm-10'],
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:00:00Z',
  },
  {
    id: 'rol-3',
    nombre: 'Gerencia',
    descripcion: 'Gerente con permisos de aprobación',
    estado: 'activo',
    permisos: ['perm-1', 'perm-5', 'perm-6', 'perm-7', 'perm-9', 'perm-10', 'perm-11', 'perm-13', 'perm-17', 'perm-18'],
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:00:00Z',
  },
  {
    id: 'rol-4',
    nombre: 'Financiera',
    descripcion: 'Área financiera con control de cartera',
    estado: 'activo',
    permisos: ['perm-5', 'perm-10', 'perm-14', 'perm-15', 'perm-16', 'perm-17'],
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:00:00Z',
  },
  {
    id: 'rol-5',
    nombre: 'Logística',
    descripcion: 'Gestión de despachos y entregas',
    estado: 'activo',
    permisos: ['perm-10', 'perm-12'],
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:00:00Z',
  },
  {
    id: 'rol-6',
    nombre: 'Compras',
    descripcion: 'Gestión de órdenes de compra',
    estado: 'activo',
    permisos: ['perm-10', 'perm-12'],
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:00:00Z',
  },
];

// ============================================
// USUARIOS
// ============================================

export const usuarios: Usuario[] = [
  {
    id: '1',
    nombre: 'Carlos Mendoza',
    email: 'carlos@prosuministros.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    roles: ['rol-1'],
    estado: 'activo',
    area: 'Administración',
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:00:00Z',
  },
  {
    id: '2',
    nombre: 'Ana García',
    email: 'ana@prosuministros.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    roles: ['rol-2'],
    estado: 'activo',
    area: 'Comercial',
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:30:00Z',
  },
  {
    id: '3',
    nombre: 'Roberto Silva',
    email: 'roberto@prosuministros.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
    roles: ['rol-3'],
    estado: 'activo',
    area: 'Gerencia',
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:30:00Z',
  },
  {
    id: '4',
    nombre: 'Laura Ramírez',
    email: 'laura@prosuministros.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura',
    roles: ['rol-4'],
    estado: 'activo',
    area: 'Financiera',
    creadoPor: 'Sistema',
    creadoEn: '2025-10-24T09:30:00Z',
  },
];

export const usuarioActual = usuarios[0];

// ============================================
// BLOQUEOS DE CARTERA
// ============================================

export const bloqueosCartera: BloqueoCartera[] = [
  {
    id: 'blq-1',
    clienteNit: '900.555.888-1',
    clienteRazonSocial: 'Comercial ZYX S.A.',
    bloqueado: true,
    motivo: 'Cartera vencida mayor a 90 días',
    montoDeuda: 45000000,
    diasVencimiento: 95,
    bloqueadoPor: 'Laura Ramírez',
    bloqueadoEn: '2025-10-15T10:00:00Z',
  },
];

export const bitacoraBloqueos: BitacoraBloqueo[] = [
  {
    id: 'bit-blq-1',
    bloqueoId: 'blq-1',
    accion: 'bloquear',
    usuarioId: '4',
    usuario: 'Laura Ramírez',
    motivo: 'Cartera vencida mayor a 90 días',
    valorAnterior: false,
    valorNuevo: true,
    creadoEn: '2025-10-15T10:00:00Z',
  },
];

// ============================================
// CONFIGURACIÓN DE MÁRGENES
// ============================================

export const configuracionMargen: ConfiguracionMargen[] = [
  {
    id: 'cfg-1',
    categoria: 'software',
    margenMinimo: 25,
    margenObjetivo: 35,
    requiereAprobacion: true,
    nivelAprobacion: 'gerencia',
  },
  {
    id: 'cfg-2',
    categoria: 'hardware',
    margenMinimo: 20,
    margenObjetivo: 30,
    requiereAprobacion: true,
    nivelAprobacion: 'gerencia',
  },
  {
    id: 'cfg-3',
    categoria: 'partes',
    margenMinimo: 15,
    margenObjetivo: 25,
    requiereAprobacion: true,
    nivelAprobacion: 'financiera',
  },
  {
    id: 'cfg-4',
    categoria: 'servicios',
    margenMinimo: 30,
    margenObjetivo: 40,
    requiereAprobacion: true,
    nivelAprobacion: 'gerencia',
  },
];

// ============================================
// SOLICITUDES DE APROBACIÓN
// ============================================

export const solicitudesAprobacion: SolicitudAprobacion[] = [
  {
    id: 'apb-1',
    tipo: 'margen_bajo',
    cotizacionId: '2',
    cotizacionNumero: 30001,
    solicitadoPor: 'Ana García',
    solicitadoEn: '2025-10-22T16:35:00Z',
    estado: 'pendiente',
    margenCalculado: 20,
    margenMinimo: 25,
    motivo: 'Cliente importante con alto volumen de compras recurrentes',
  },
  {
    id: 'apb-2',
    tipo: 'margen_bajo',
    cotizacionId: '4',
    cotizacionNumero: 30003,
    solicitadoPor: 'Ana García',
    solicitadoEn: '2025-10-21T09:15:00Z',
    estado: 'aprobada',
    margenCalculado: 20,
    margenMinimo: 25,
    margenAprobado: 20,
    motivo: 'Oportunidad de negocio a largo plazo',
    aprobadoPor: 'Roberto Silva',
    aprobadoEn: '2025-10-21T10:00:00Z',
    comentarios: 'Aprobado bajo el entendido de que es un cliente estratégico',
  },
];

// ============================================
// TEMPLATES WHATSAPP
// ============================================

export const templatesWhatsApp: TemplateWhatsApp[] = [
  {
    id: 'tpl-1',
    nombre: 'Bienvenida',
    categoria: 'bienvenida',
    contenido: '🎉 ¡Hola! Bienvenido a PROSUMINISTROS 🏢\nTu aliado en hardware, software, accesorios y servicios de infraestructura IT.\n\nPara poder atenderte mejor, por favor cuéntame qué deseas hacer hoy:\n\n1️⃣ Solicitar una cotización\n2️⃣ Consultar el estado de tu pedido\n3️⃣ Recibir asesoría comercial\n4️⃣ Otro motivo\n\nEstoy aquí para apoyarte. 💬',
    variables: [],
    activo: true,
  },
  {
    id: 'tpl-2',
    nombre: 'Confirmación Lead',
    categoria: 'confirmacion',
    contenido: '✅ ¡Excelente, {{nombre_contacto}}! 🎊\nYa registramos tu solicitud con el código LEAD-{{numero_lead}}.\n\nMuy pronto uno de nuestros asesores de PROSUMINISTROS se pondrá en contacto contigo para ayudarte con todo lo que necesites.\n\n¡Gracias por confiar en nosotros! 🙌💼',
    variables: ['nombre_contacto', 'numero_lead'],
    activo: true,
  },
  {
    id: 'tpl-3',
    nombre: 'Envío Cotización',
    categoria: 'cotizacion',
    contenido: '📋 Hola {{nombre_contacto}},\n\nTe enviamos la cotización #{{numero_cotizacion}} para {{asunto}}.\n\nPuedes revisarla en el siguiente enlace:\n{{link_cotizacion}}\n\nSi tienes alguna pregunta o deseas modificar algo, no dudes en contactarnos.\n\nSaludos,\n{{nombre_asesor}}',
    variables: ['nombre_contacto', 'numero_cotizacion', 'asunto', 'link_cotizacion', 'nombre_asesor'],
    activo: true,
  },
  {
    id: 'tpl-4',
    nombre: 'Recordatorio 8 días',
    categoria: 'recordatorio',
    contenido: '👋 Hola {{nombre_contacto}},\n\nQueremos saber si tuviste oportunidad de revisar la cotización #{{numero_cotizacion}} que te enviamos.\n\n¿Hay algo en lo que podamos ayudarte?\n\nQuedamos atentos.',
    variables: ['nombre_contacto', 'numero_cotizacion'],
    activo: true,
  },
];

// ============================================
// CONVERSACIONES WHATSAPP
// ============================================

export const conversacionesWhatsApp: ConversacionWhatsApp[] = [
  {
    id: 'conv-1',
    telefono: '+57 310 555 0100',
    nombreContacto: 'Pedro Martínez',
    leadId: '1',
    estado: 'activa',
    ultimoMensaje: 'Perfecto! ¿Cuántas laptops necesitas?',
    ultimoMensajeEn: '2025-12-10T09:26:00Z',
    mensajes: [
      {
        id: 'msg-conv1-1',
        conversacionId: 'conv-1',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Hola, necesito información',
        tipo: 'texto',
        creadoEn: '2025-12-10T09:20:00Z',
        leido: true,
      },
      {
        id: 'msg-conv1-2',
        conversacionId: 'conv-1',
        direccion: 'saliente',
        remitente: 'bot',
        contenido: '🎉 ¡Hola! Bienvenido a PROSUMINISTROS 🏢\nTu aliado en hardware, software y servicios IT.\n\n1️⃣ Solicitar cotización\n2️⃣ Consultar pedido\n3️⃣ Asesoría comercial\n4️⃣ Otro motivo',
        tipo: 'template',
        creadoEn: '2025-12-10T09:20:05Z',
        leido: true,
      },
      {
        id: 'msg-conv1-3',
        conversacionId: 'conv-1',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: '1',
        tipo: 'texto',
        creadoEn: '2025-12-10T09:21:00Z',
        leido: true,
      },
      {
        id: 'msg-conv1-4',
        conversacionId: 'conv-1',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Necesito cotización para laptops',
        tipo: 'texto',
        creadoEn: '2025-12-10T09:25:00Z',
        leido: true,
      },
      {
        id: 'msg-conv1-5',
        conversacionId: 'conv-1',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: 'Perfecto! ¿Cuántas laptops necesitas?',
        tipo: 'texto',
        creadoEn: '2025-12-10T09:26:00Z',
        leido: false,
      },
    ],
    creadoEn: '2025-12-10T09:20:00Z',
  },
  {
    id: 'conv-2',
    telefono: '+57 320 444 0200',
    nombreContacto: 'María González',
    estado: 'activa',
    ultimoMensaje: 'Gracias! Estoy revisando la cotización',
    ultimoMensajeEn: '2025-12-10T08:15:00Z',
    mensajes: [
      {
        id: 'msg-conv2-1',
        conversacionId: 'conv-2',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Buenos días',
        tipo: 'texto',
        creadoEn: '2025-12-10T07:30:00Z',
        leido: true,
      },
      {
        id: 'msg-conv2-2',
        conversacionId: 'conv-2',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: 'Buenos días María! ¿En qué te puedo ayudar?',
        tipo: 'texto',
        creadoEn: '2025-12-10T07:31:00Z',
        leido: true,
      },
      {
        id: 'msg-conv2-3',
        conversacionId: 'conv-2',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Necesito sistemas POS para mi restaurante',
        tipo: 'texto',
        creadoEn: '2025-12-10T07:32:00Z',
        leido: true,
      },
      {
        id: 'msg-conv2-4',
        conversacionId: 'conv-2',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: 'Te envié la cotización COT-30145 a tu correo',
        tipo: 'texto',
        creadoEn: '2025-12-10T08:00:00Z',
        leido: true,
      },
      {
        id: 'msg-conv2-5',
        conversacionId: 'conv-2',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: '📄 Documento adjunto',
        tipo: 'documento',
        adjuntos: ['Cotizacion_POS_30145.pdf'],
        creadoEn: '2025-12-10T08:00:10Z',
        leido: true,
      },
      {
        id: 'msg-conv2-6',
        conversacionId: 'conv-2',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Gracias! Estoy revisando la cotización',
        tipo: 'texto',
        creadoEn: '2025-12-10T08:15:00Z',
        leido: true,
      },
    ],
    creadoEn: '2025-12-10T07:30:00Z',
  },
  {
    id: 'conv-3',
    telefono: '+57 315 888 0300',
    nombreContacto: 'Carlos Ruiz',
    leadId: '2',
    estado: 'pausada',
    ultimoMensaje: 'Ok, te aviso cuando estén listos',
    ultimoMensajeEn: '2025-12-09T16:45:00Z',
    mensajes: [
      {
        id: 'msg-conv3-1',
        conversacionId: 'conv-3',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Hola, me interesa pero necesito unos días más',
        tipo: 'texto',
        creadoEn: '2025-12-09T16:30:00Z',
        leido: true,
      },
      {
        id: 'msg-conv3-2',
        conversacionId: 'conv-3',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: 'Claro Carlos, sin problema. ¿Qué documentos necesitas?',
        tipo: 'texto',
        creadoEn: '2025-12-09T16:32:00Z',
        leido: true,
      },
      {
        id: 'msg-conv3-3',
        conversacionId: 'conv-3',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Ok, te aviso cuando estén listos',
        tipo: 'texto',
        creadoEn: '2025-12-09T16:45:00Z',
        leido: true,
      },
    ],
    creadoEn: '2025-12-09T16:30:00Z',
  },
  {
    id: 'conv-4',
    telefono: '+57 301 777 0400',
    nombreContacto: 'Andrea López',
    estado: 'activa',
    ultimoMensaje: '¿Cuánto demora el envío a Medellín?',
    ultimoMensajeEn: '2025-12-10T10:00:00Z',
    mensajes: [
      {
        id: 'msg-conv4-1',
        conversacionId: 'conv-4',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Quiero hacer un pedido',
        tipo: 'texto',
        creadoEn: '2025-12-10T09:50:00Z',
        leido: true,
      },
      {
        id: 'msg-conv4-2',
        conversacionId: 'conv-4',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: '¿Cuánto demora el envío a Medellín?',
        tipo: 'texto',
        creadoEn: '2025-12-10T10:00:00Z',
        leido: true,
      },
    ],
    creadoEn: '2025-12-10T09:50:00Z',
  },
  {
    id: 'conv-5',
    telefono: '+57 318 666 0500',
    nombreContacto: 'Roberto Sánchez',
    estado: 'activa',
    ultimoMensaje: '📸 Imagen adjunta',
    ultimoMensajeEn: '2025-12-10T07:45:00Z',
    mensajes: [
      {
        id: 'msg-conv5-1',
        conversacionId: 'conv-5',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Tengo un problema con el software',
        tipo: 'texto',
        creadoEn: '2025-12-10T07:30:00Z',
        leido: true,
      },
      {
        id: 'msg-conv5-2',
        conversacionId: 'conv-5',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: 'Hola Roberto! ¿Qué error te muestra?',
        tipo: 'texto',
        creadoEn: '2025-12-10T07:32:00Z',
        leido: true,
      },
      {
        id: 'msg-conv5-3',
        conversacionId: 'conv-5',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: '📸 Imagen adjunta',
        tipo: 'imagen',
        adjuntos: ['error_pantalla.jpg'],
        creadoEn: '2025-12-10T07:45:00Z',
        leido: true,
      },
    ],
    creadoEn: '2025-12-10T07:30:00Z',
  },
  {
    id: 'conv-6',
    telefono: '+57 312 555 0600',
    nombreContacto: 'Sofía Ramírez',
    estado: 'activa',
    ultimoMensaje: 'Excelente! Muchas gracias 😊',
    ultimoMensajeEn: '2025-12-09T18:30:00Z',
    mensajes: [
      {
        id: 'msg-conv6-1',
        conversacionId: 'conv-6',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: '📋 Te enviamos la cotización #COT-30112',
        tipo: 'template',
        creadoEn: '2025-12-09T18:00:00Z',
        leido: true,
      },
      {
        id: 'msg-conv6-2',
        conversacionId: 'conv-6',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Excelente! Muchas gracias 😊',
        tipo: 'texto',
        creadoEn: '2025-12-09T18:30:00Z',
        leido: true,
      },
    ],
    creadoEn: '2025-12-09T18:00:00Z',
  },
  {
    id: 'conv-7',
    telefono: '+57 304 333 0700',
    nombreContacto: 'Luis Herrera',
    estado: 'cerrada',
    ultimoMensaje: 'Gracias por tu compra!',
    ultimoMensajeEn: '2025-12-08T15:00:00Z',
    mensajes: [
      {
        id: 'msg-conv7-1',
        conversacionId: 'conv-7',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Ya recibí el pedido, todo perfecto!',
        tipo: 'texto',
        creadoEn: '2025-12-08T14:30:00Z',
        leido: true,
      },
      {
        id: 'msg-conv7-2',
        conversacionId: 'conv-7',
        direccion: 'saliente',
        remitente: 'asesor',
        contenido: 'Gracias por tu compra! 😊',
        tipo: 'texto',
        creadoEn: '2025-12-08T15:00:00Z',
        leido: true,
      },
    ],
    creadoEn: '2025-12-08T14:30:00Z',
  },
  {
    id: 'conv-8',
    telefono: '+57 311 222 0800',
    nombreContacto: 'Diana Torres',
    estado: 'activa',
    ultimoMensaje: 'Necesito servicio técnico urgente',
    ultimoMensajeEn: '2025-12-10T11:00:00Z',
    mensajes: [
      {
        id: 'msg-conv8-1',
        conversacionId: 'conv-8',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Necesito servicio técnico urgente',
        tipo: 'texto',
        creadoEn: '2025-12-10T11:00:00Z',
        leido: false,
      },
    ],
    creadoEn: '2025-12-10T10:55:00Z',
  },
  {
    id: 'conv-9',
    telefono: '+57 316 111 0900',
    estado: 'activa',
    ultimoMensaje: 'Hola',
    ultimoMensajeEn: '2025-12-10T11:10:00Z',
    mensajes: [
      {
        id: 'msg-conv9-1',
        conversacionId: 'conv-9',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Hola',
        tipo: 'texto',
        creadoEn: '2025-12-10T11:10:00Z',
        leido: false,
      },
    ],
    creadoEn: '2025-12-10T11:10:00Z',
  },
  {
    id: 'conv-10',
    telefono: '+57 305 999 1000',
    nombreContacto: 'Fernando Castillo',
    estado: 'activa',
    ultimoMensaje: 'Quiero ver opciones de servidores',
    ultimoMensajeEn: '2025-12-10T06:30:00Z',
    mensajes: [
      {
        id: 'msg-conv10-1',
        conversacionId: 'conv-10',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Buenos días',
        tipo: 'texto',
        creadoEn: '2025-12-10T06:20:00Z',
        leido: true,
      },
      {
        id: 'msg-conv10-2',
        conversacionId: 'conv-10',
        direccion: 'entrante',
        remitente: 'usuario',
        contenido: 'Quiero ver opciones de servidores',
        tipo: 'texto',
        creadoEn: '2025-12-10T06:30:00Z',
        leido: true,
      },
    ],
    creadoEn: '2025-12-10T06:20:00Z',
  },
];

// ============================================
// DOCUMENTOS GENERADOS
// ============================================

export const documentosGenerados: DocumentoGenerado[] = [
  {
    id: 'doc-1',
    tipo: 'cotizacion',
    numero: 'COT-30000',
    relacionadoTipo: 'cotizacion',
    relacionadoId: '1',
    relacionadoNumero: 30000,
    urlPdf: '/documentos/COT-30000.pdf',
    generadoPor: 'Ana García',
    generadoEn: '2025-10-23T15:30:00Z',
    enviadoPor: ['sofia@elsol.com'],
    enviadoEn: '2025-10-23T15:35:00Z',
  },
];

// ============================================
// BITÁCORA ADMINISTRATIVA
// ============================================

export const bitacoraAdministrativa: BitacoraAdministrativa[] = [
  {
    id: 'bit-1',
    tipo: 'rol_creado',
    entidadTipo: 'rol',
    entidadId: 'rol-1',
    usuarioId: '1',
    usuario: 'Carlos Mendoza',
    accion: 'Creación de rol',
    descripcion: 'Se creó el rol Administrador con acceso completo',
    creadoEn: '2025-10-24T09:00:00Z',
  },
  {
    id: 'bit-2',
    tipo: 'usuario_creado',
    entidadTipo: 'usuario',
    entidadId: '2',
    usuarioId: '1',
    usuario: 'Carlos Mendoza',
    accion: 'Creación de usuario',
    descripcion: 'Se creó el usuario Ana García',
    creadoEn: '2025-10-24T09:30:00Z',
  },
  {
    id: 'bit-3',
    tipo: 'rol_asignado',
    entidadTipo: 'usuario',
    entidadId: '2',
    usuarioId: '1',
    usuario: 'Carlos Mendoza',
    accion: 'Asignación de rol',
    valorAnterior: [],
    valorNuevo: ['rol-2'],
    descripcion: 'Se asignó el rol Comercial a Ana García',
    creadoEn: '2025-10-24T09:31:00Z',
  },
];

// ============================================
// LEADS
// ============================================

export const leads: Lead[] = [
  {
    id: '1',
    numero: 100,
    origen: 'WhatsApp',
    asignadoA: 'Ana García',
    razonSocial: 'El Sol Restaurante',
    nit: '900.123.456-7',
    nombreContacto: 'Sofía Hernández',
    email: 'sofia@elsol.com',
    telefono: '+57 310 555 0100',
    requerimiento: 'Sistema POS + Módulos de facturación electrónica',
    fechaLead: '2025-10-23T10:30:00Z',
    estado: 'pendiente',
    alerta24h: false,
    creadoPor: 'Ana García',
    creadoEn: '2025-10-23T10:30:00Z',
    margenEstimado: 32,
    observaciones: [],
  },
  {
    id: '2',
    numero: 101,
    origen: 'Web',
    asignadoA: 'Ana García',
    razonSocial: 'TechCorp S.A.S.',
    nit: '900.654.321-8',
    nombreContacto: 'Miguel Ángel Torres',
    email: 'mtorres@techcorp.co',
    telefono: '+57 311 444 0200',
    requerimiento: '10 Laptops HP + Licencias Microsoft Office',
    fechaLead: '2025-10-22T14:15:00Z',
    estado: 'convertido',
    alerta24h: false,
    creadoPor: 'Sistema Web',
    creadoEn: '2025-10-22T14:15:00Z',
    convertidoEn: '2025-10-22T16:00:00Z',
    margenEstimado: 28,
    observaciones: [],
  },
];

// ============================================
// COTIZACIONES
// ============================================

// NOTA: Las cotizaciones se exportan desde mock-data-extended.ts para incluir TODOS los estados
// export const cotizaciones: Cotizacion[] = [
//   ... (datos comentados, ver mock-data-extended.ts para la data completa)
// ];

// ============================================
// PEDIDOS
// ============================================

// NOTA: Los pedidos se exportan desde mock-data-extended.ts para incluir TODOS los estados
// export const pedidos: Pedido[] = [
//   ... (datos comentados, ver mock-data-extended.ts para la data completa)
// ];

// ============================================
// PRODUCTOS
// ============================================

export const productos: Producto[] = [
  {
    id: '1',
    sku: 'HW-101',
    descripcion: 'Laptop HP ProBook 450 G10 - i7 16GB 512GB SSD',
    categoria: 'hardware',
    fabricante: 'HP',
    costo: 3200000,
    precio: 4000000,
    stock: 15,
    activo: true,
  },
  {
    id: '2',
    sku: 'SW-001',
    descripcion: 'Sistema POS RestauPro - Licencia anual',
    categoria: 'software',
    fabricante: 'RestauPro',
    costo: 2500000,
    precio: 3500000,
    stock: 999,
    activo: true,
  },
  {
    id: '3',
    sku: 'HW-045',
    descripcion: 'Terminal táctil 15" todo en uno',
    categoria: 'hardware',
    fabricante: 'Generic',
    costo: 1800000,
    precio: 2400000,
    stock: 8,
    activo: true,
  },
];

// ============================================
// CLIENTES
// ============================================

export const clientes: Cliente[] = [
  {
    id: '1',
    razonSocial: 'El Sol Restaurante',
    nit: '900.123.456-7',
    email: 'sofia@elsol.com',
    telefono: '+57 310 555 0100',
    direccion: 'Carrera 7 # 45-23',
    ciudad: 'Bogotá',
    activo: true,
  },
  {
    id: '2',
    razonSocial: 'TechCorp S.A.S.',
    nit: '900.654.321-8',
    email: 'mtorres@techcorp.co',
    telefono: '+57 311 444 0200',
    direccion: 'Calle 100 # 19-61',
    ciudad: 'Bogotá',
    activo: true,
  },
];

// ============================================
// NOTIFICACIONES
// ============================================

export const notificaciones: Notificacion[] = [
  {
    id: '1',
    tipo: 'cotizacion_enviada',
    titulo: 'Cotización enviada',
    mensaje: 'Cotización #30000 enviada a El Sol Restaurante',
    leida: false,
    creadoEn: '2025-10-23T15:30:00Z',
    vinculo: { tipo: 'cotizacion', id: '1' },
  },
  {
    id: '2',
    tipo: 'pedido_nuevo',
    titulo: 'Nuevo pedido',
    mensaje: 'Pedido #20000 creado desde cotización #30001',
    leida: false,
    creadoEn: '2025-10-23T09:30:00Z',
    vinculo: { tipo: 'pedido', id: '1' },
  },
  {
    id: '3',
    tipo: 'lead_nuevo',
    titulo: 'Nuevo lead',
    mensaje: 'Lead #100 creado desde WhatsApp',
    leida: true,
    creadoEn: '2025-10-23T10:30:00Z',
    vinculo: { tipo: 'lead', id: '1' },
  },
];

// ============================================
// OBSERVACIONES
// ============================================

export const observaciones: Observacion[] = [
  {
    id: '1',
    pedidoId: '1',
    remitente: 'Ana García',
    destinatarios: ['sofia@elsol.com', 'sebastian@prosuministros.com'],
    texto: 'Cliente solicita entrega preferiblemente en horas de la mañana. Coordinar con recepción del edificio.',
    creadoEn: '2025-10-24T12:00:00Z',
    inmutable: true,
  },
];

// ============================================
// DEPARTAMENTOS DE COLOMBIA
// ============================================

export const departamentos: Departamento[] = [
  { codigo: 'AMA', nombre: 'Amazonas' },
  { codigo: 'ANT', nombre: 'Antioquia' },
  { codigo: 'ARA', nombre: 'Arauca' },
  { codigo: 'ATL', nombre: 'Atlántico' },
  { codigo: 'BOG', nombre: 'Bogotá D.C.' },
  { codigo: 'BOL', nombre: 'Bolívar' },
  { codigo: 'BOY', nombre: 'Boyacá' },
  { codigo: 'CAL', nombre: 'Caldas' },
  { codigo: 'CAQ', nombre: 'Caquetá' },
  { codigo: 'CAS', nombre: 'Casanare' },
  { codigo: 'CAU', nombre: 'Cauca' },
  { codigo: 'CES', nombre: 'Cesar' },
  { codigo: 'CHO', nombre: 'Chocó' },
  { codigo: 'COR', nombre: 'Córdoba' },
  { codigo: 'CUN', nombre: 'Cundinamarca' },
  { codigo: 'GUA', nombre: 'Guainía' },
  { codigo: 'GUV', nombre: 'Guaviare' },
  { codigo: 'HUI', nombre: 'Huila' },
  { codigo: 'LAG', nombre: 'La Guajira' },
  { codigo: 'MAG', nombre: 'Magdalena' },
  { codigo: 'MET', nombre: 'Meta' },
  { codigo: 'NAR', nombre: 'Nariño' },
  { codigo: 'NSA', nombre: 'Norte de Santander' },
  { codigo: 'PUT', nombre: 'Putumayo' },
  { codigo: 'QUI', nombre: 'Quindío' },
  { codigo: 'RIS', nombre: 'Risaralda' },
  { codigo: 'SAP', nombre: 'San Andrés y Providencia' },
  { codigo: 'SAN', nombre: 'Santander' },
  { codigo: 'SUC', nombre: 'Sucre' },
  { codigo: 'TOL', nombre: 'Tolima' },
  { codigo: 'VAL', nombre: 'Valle del Cauca' },
  { codigo: 'VAU', nombre: 'Vaupés' },
  { codigo: 'VID', nombre: 'Vichada' },
];

// ============================================
// MÉTRICAS DASHBOARD
// ============================================

export const metricasDashboard: MetricaDashboard[] = [
  {
    id: 'metric-1',
    label: 'Leads Nuevos',
    valor: '24',
    cambio: 5,
    tendencia: 'up',
  },
  {
    id: 'metric-2',
    label: 'Leads Convertidos',
    valor: '18',
    cambio: 3,
    tendencia: 'up',
  },
  {
    id: 'metric-3',
    label: 'Cotizaciones Enviadas',
    valor: '45',
    cambio: 10,
    tendencia: 'up',
  },
  {
    id: 'metric-4',
    label: 'Cotizaciones Aprobadas',
    valor: '32',
    cambio: 4,
    tendencia: 'up',
  },
  {
    id: 'metric-5',
    label: 'Pedidos Activos',
    valor: '15',
    cambio: 2,
    tendencia: 'up',
  },
  {
    id: 'metric-6',
    label: 'Valor Pedidos',
    valor: '285,000,000',
    cambio: 15,
    tendencia: 'up',
  },
  {
    id: 'metric-7',
    label: 'Tasa Conversión',
    valor: '75%',
    cambio: 5,
    tendencia: 'up',
  },
  {
    id: 'metric-8',
    label: 'Margen Promedio',
    valor: '28%',
    cambio: 1,
    tendencia: 'up',
  },
];

// ============================================
// INFORMACIÓN DE DESPACHO
// ============================================

export const informacionDespacho: InformacionDespacho[] = [
  {
    pedidoId: '1',
    transportadora: 'Servientrega',
    guia: 'SRV-2024-001234',
    fechaEstimadaEntrega: '2025-10-26T14:00:00Z',
    destinatario: 'Miguel Ángel Torres',
    direccion: 'Calle 100 # 19-61',
    ciudad: 'Bogotá',
    estado: 'En tránsito',
    observaciones: 'Entrega programada para horario de oficina',
  },
];

// ============================================
// RE-EXPORTAR DATA EXTENDIDA
// ============================================
// 
// Para usar cotizaciones y pedidos con TODOS los estados posibles,
// descomenta las siguientes líneas y comenta las exportaciones originales arriba:

// Usar data extendida con todos los estados
export { cotizacionesExtendidas as cotizaciones } from './mock-data-extended';
export { pedidosExtendidos as pedidos } from './mock-data-extended';

// ============================================
// NOTA IMPORTANTE
// ============================================
//
// COTIZACIONES - Estados disponibles en mock-data-extended.ts:
// ✅ borrador (COT-30002)
// ✅ enviada (COT-30000) 
// ✅ aprobada (COT-30001)
// ✅ rechazada (COT-30003)
// ✅ vencida (COT-30004)
//
// PEDIDOS - Estados disponibles en mock-data-extended.ts:
// ✅ por_facturar (PED-20000)
// ✅ facturado_sin_pago (PED-20001)
// ✅ pendiente_compra (PED-20002)
// ✅ en_bodega (PED-20003)
// ✅ despachado (PED-20004)
// ✅ entregado (PED-20005)