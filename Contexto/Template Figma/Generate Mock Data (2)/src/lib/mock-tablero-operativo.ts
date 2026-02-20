// Mock data para el Tablero Operativo de Seguimiento de Pedidos
// Sistema de colores por responsabilidad y acción pendiente

export type ColorEstado = 
  | 'rojo'           // Financiera / Comercial / Bloqueos
  | 'naranja'        // Auxiliar de Bodega
  | 'morado'         // Jefe de Bodega
  | 'amarillo'       // Compras
  | 'azul'           // Licencias / Servicios Recurrentes
  | 'verde-claro'    // Proceso Avanzado
  | 'verde-oscuro'   // Proceso Completado
  | null;            // Sin estado asignado

export interface SubprocesoAdministrativo {
  rem: ColorEstado;
  factura: ColorEstado;
  transportadora: ColorEstado;
  guia: ColorEstado;
  obsCrm: ColorEstado;
  correoUF: ColorEstado;
}

export interface RegistroTablero {
  id: string;
  // Bloque 1: Información Operativa Base
  proveedor: string;
  oc: string;
  cliente: string;
  op: string;
  producto: string;
  cantidad: number;
  fechaEntrega: string;
  responsable: ColorEstado;
  novedades: string;
  
  // Bloque 2: Subprocesos Administrativos
  subprocesos: SubprocesoAdministrativo;
  
  // Metadata para trazabilidad
  cambios: RegistroCambio[];
}

export interface RegistroCambio {
  campo: string;
  valorAnterior: ColorEstado | string;
  valorNuevo: ColorEstado | string;
  usuario: string;
  fecha: string;
  motivo: string;
}

// Configuración de colores - Sistema de responsabilidades
export const configColores = {
  'rojo': {
    label: 'Financiera / Comercial / Bloqueos',
    descripcion: 'Errores o bloqueos que impiden avanzar',
    color: 'bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400',
    colorSolido: 'bg-red-500',
    ejemplos: [
      'Error en pedido (precio, costo, cantidad, IVA)',
      'Pendiente de facturación',
      'Cambio en fecha de entrega no confirmado',
      'Información de despacho incorrecta'
    ],
    sla: '1 hora'
  },
  'naranja': {
    label: 'Auxiliar de Bodega',
    descripcion: 'Acciones de seguimiento operativo',
    color: 'bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-400',
    colorSolido: 'bg-orange-500',
    ejemplos: [
      'Confirmar salida en ruta',
      'Registrar transportadora y guía',
      'Enviar correo al usuario final',
      'Relacionar información en CRM'
    ]
  },
  'morado': {
    label: 'Jefe de Bodega',
    descripcion: 'Ejecución logística interna',
    color: 'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-400',
    colorSolido: 'bg-purple-500',
    ejemplos: [
      'Producto pendiente de recolección',
      'Producto en ruta hacia bodega',
      'Remisión pendiente',
      'Seguimiento de entregas parciales'
    ]
  },
  'amarillo': {
    label: 'Compras',
    descripcion: 'Pendientes del área de compras',
    color: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-700 dark:text-yellow-500',
    colorSolido: 'bg-yellow-500',
    ejemplos: [
      'Producto pendiente de compra',
      'Generación de salida de almacén',
      'Envío de tokens o licencias',
      'Acompañamiento a logística'
    ]
  },
  'azul': {
    label: 'Licencias / Servicios Recurrentes',
    descripcion: 'Licenciamientos y servicios mes a mes',
    color: 'bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400',
    colorSolido: 'bg-blue-500',
    ejemplos: [
      'Control de fechas de inicio y fin',
      'Anticipar facturación recurrente',
      'Renovación de licencias'
    ]
  },
  'verde-claro': {
    label: 'Proceso Avanzado',
    descripcion: 'El proceso va bien pero no ha finalizado',
    color: 'bg-green-400/20 border-green-400/40 text-green-600 dark:text-green-400',
    colorSolido: 'bg-green-400',
    ejemplos: [
      'Producto ingresó completamente a bodega',
      'Pedido despachado pero no entregado'
    ]
  },
  'verde-oscuro': {
    label: 'Proceso Completado',
    descripcion: 'Cierre exitoso del flujo',
    color: 'bg-green-600/20 border-green-600/40 text-green-700 dark:text-green-500',
    colorSolido: 'bg-green-600',
    ejemplos: [
      'Producto entregado sin novedad',
      'Remisión realizada',
      'Factura emitida',
      'Correo enviado',
      'Pedido entregado al cliente'
    ]
  }
} as const;

// Mock data: 20 registros operativos con múltiples colores simultáneos
export const registrosTableroMock: RegistroTablero[] = [
  {
    id: '1',
    proveedor: 'TECH SUPPLIES S.A.',
    oc: 'OC-2025-001',
    cliente: 'ALLIANZ TECHNOLOGY',
    op: 'OP-5001',
    producto: 'Dell Latitude 5540 - Intel i7',
    cantidad: 15,
    fechaEntrega: '2025-02-10',
    responsable: 'amarillo',
    novedades: 'Pendiente confirmación de stock con proveedor',
    subprocesos: {
      rem: null,
      factura: null,
      transportadora: null,
      guia: null,
      obsCrm: 'naranja',
      correoUF: null
    },
    cambios: [
      {
        campo: 'responsable',
        valorAnterior: null,
        valorNuevo: 'amarillo',
        usuario: 'Juan Pérez',
        fecha: '2025-02-02T08:30:00Z',
        motivo: 'Asignado a compras para validación de stock'
      }
    ]
  },
  {
    id: '2',
    proveedor: 'LICENCIAS SOFT COLOMBIA',
    oc: 'OC-2025-002',
    cliente: 'BANCOLOMBIA S.A.',
    op: 'OP-5002',
    producto: 'Microsoft 365 E3 - 200 licencias',
    cantidad: 200,
    fechaEntrega: '2025-02-05',
    responsable: 'azul',
    novedades: 'Licencias recurrentes - renovación anual',
    subprocesos: {
      rem: 'verde-oscuro',
      factura: 'verde-oscuro',
      transportadora: null,
      guia: null,
      obsCrm: 'verde-oscuro',
      correoUF: 'verde-oscuro'
    },
    cambios: [
      {
        campo: 'subprocesos.correoUF',
        valorAnterior: 'naranja',
        valorNuevo: 'verde-oscuro',
        usuario: 'María López',
        fecha: '2025-02-02T10:15:00Z',
        motivo: 'Correo enviado con credenciales al usuario final'
      }
    ]
  },
  {
    id: '3',
    proveedor: 'GLOBAL HARDWARE SAS',
    oc: 'OC-2025-003',
    cliente: 'AVIANCA S.A.',
    op: 'OP-5003',
    producto: 'Switch Cisco 48 puertos',
    cantidad: 8,
    fechaEntrega: '2025-02-08',
    responsable: 'morado',
    novedades: 'Producto en ruta hacia bodega principal',
    subprocesos: {
      rem: 'morado',
      factura: 'verde-claro',
      transportadora: 'verde-claro',
      guia: 'verde-claro',
      obsCrm: 'naranja',
      correoUF: null
    },
    cambios: [
      {
        campo: 'responsable',
        valorAnterior: 'amarillo',
        valorNuevo: 'morado',
        usuario: 'Carlos Rodríguez',
        fecha: '2025-02-02T09:00:00Z',
        motivo: 'Producto despachado por proveedor, en tránsito'
      }
    ]
  },
  {
    id: '4',
    proveedor: 'DISTRIBUIDORA TECH',
    oc: 'OC-2025-004',
    cliente: 'CLARO COLOMBIA',
    op: 'OP-5004',
    producto: 'iPhone 15 Pro Max 256GB',
    cantidad: 50,
    fechaEntrega: '2025-02-12',
    responsable: 'rojo',
    novedades: 'ERROR: Precio en OC no coincide con cotización aprobada',
    subprocesos: {
      rem: null,
      factura: 'rojo',
      transportadora: null,
      guia: null,
      obsCrm: 'rojo',
      correoUF: null
    },
    cambios: [
      {
        campo: 'responsable',
        valorAnterior: 'amarillo',
        valorNuevo: 'rojo',
        usuario: 'Ana Martínez',
        fecha: '2025-02-02T11:45:00Z',
        motivo: 'Detectado error en precio, requiere corrección comercial urgente'
      }
    ]
  },
  {
    id: '5',
    proveedor: 'LENOVO COLOMBIA',
    oc: 'OC-2025-005',
    cliente: 'ECOPETROL S.A.',
    op: 'OP-5005',
    producto: 'ThinkPad X1 Carbon Gen 11',
    cantidad: 30,
    fechaEntrega: '2025-02-15',
    responsable: 'verde-claro',
    novedades: 'Producto ingresó a bodega, pendiente alistamiento',
    subprocesos: {
      rem: 'naranja',
      factura: 'verde-oscuro',
      transportadora: null,
      guia: null,
      obsCrm: 'verde-claro',
      correoUF: null
    },
    cambios: [
      {
        campo: 'responsable',
        valorAnterior: 'morado',
        valorNuevo: 'verde-claro',
        usuario: 'Pedro Sánchez',
        fecha: '2025-02-02T14:20:00Z',
        motivo: 'Producto recibido en bodega completo'
      }
    ]
  },
  {
    id: '6',
    proveedor: 'ADOBE LATAM',
    oc: 'OC-2025-006',
    cliente: 'PUBLICIS GROUPE',
    op: 'OP-5006',
    producto: 'Adobe Creative Cloud - Team 50 usuarios',
    cantidad: 50,
    fechaEntrega: '2025-02-03',
    responsable: 'azul',
    novedades: 'Servicio mensual recurrente',
    subprocesos: {
      rem: 'verde-oscuro',
      factura: 'verde-oscuro',
      transportadora: null,
      guia: null,
      obsCrm: 'verde-oscuro',
      correoUF: 'verde-oscuro'
    },
    cambios: []
  },
  {
    id: '7',
    proveedor: 'HP INC COLOMBIA',
    oc: 'OC-2025-007',
    cliente: 'UNIVERSIDAD DE LOS ANDES',
    op: 'OP-5007',
    producto: 'HP EliteBook 840 G10',
    cantidad: 100,
    fechaEntrega: '2025-02-20',
    responsable: 'amarillo',
    novedades: 'Pendiente generación de OC por parte de compras',
    subprocesos: {
      rem: null,
      factura: null,
      transportadora: null,
      guia: null,
      obsCrm: 'amarillo',
      correoUF: null
    },
    cambios: []
  },
  {
    id: '8',
    proveedor: 'CISCO SYSTEMS',
    oc: 'OC-2025-008',
    cliente: 'ETB TELECOM',
    op: 'OP-5008',
    producto: 'Router Cisco ISR 4351',
    cantidad: 5,
    fechaEntrega: '2025-02-18',
    responsable: 'rojo',
    novedades: 'Cliente cambió dirección de entrega, actualizar información',
    subprocesos: {
      rem: null,
      factura: 'verde-claro',
      transportadora: null,
      guia: null,
      obsCrm: 'rojo',
      correoUF: null
    },
    cambios: [
      {
        campo: 'novedades',
        valorAnterior: 'Producto en proceso de compra',
        valorNuevo: 'Cliente cambió dirección de entrega',
        usuario: 'Laura Gómez',
        fecha: '2025-02-02T16:00:00Z',
        motivo: 'Cliente notificó cambio de sede'
      }
    ]
  },
  {
    id: '9',
    proveedor: 'SAMSUNG ELECTRONICS',
    oc: 'OC-2025-009',
    cliente: 'FALABELLA COLOMBIA',
    op: 'OP-5009',
    producto: 'Monitor Samsung 32" 4K',
    cantidad: 75,
    fechaEntrega: '2025-02-22',
    responsable: 'morado',
    novedades: 'Entrega parcial: 40 unidades en bodega, 35 pendientes',
    subprocesos: {
      rem: 'morado',
      factura: 'verde-claro',
      transportadora: 'verde-claro',
      guia: 'verde-claro',
      obsCrm: 'morado',
      correoUF: null
    },
    cambios: []
  },
  {
    id: '10',
    proveedor: 'AUTODESK LATAM',
    oc: 'OC-2025-010',
    cliente: 'ARQUITECTURA MODERNA SAS',
    op: 'OP-5010',
    producto: 'AutoCAD - Licencia anual',
    cantidad: 15,
    fechaEntrega: '2025-02-06',
    responsable: 'azul',
    novedades: 'Licencia anual - próxima renovación Feb 2026',
    subprocesos: {
      rem: 'verde-oscuro',
      factura: 'verde-oscuro',
      transportadora: null,
      guia: null,
      obsCrm: 'verde-oscuro',
      correoUF: 'verde-oscuro'
    },
    cambios: []
  },
  {
    id: '11',
    proveedor: 'DELL TECHNOLOGIES',
    oc: 'OC-2025-011',
    cliente: 'GRUPO ÉXITO',
    op: 'OP-5011',
    producto: 'Dell PowerEdge R750 Server',
    cantidad: 3,
    fechaEntrega: '2025-02-25',
    responsable: 'amarillo',
    novedades: 'Cotización aprobada, pendiente emisión de OC',
    subprocesos: {
      rem: null,
      factura: null,
      transportadora: null,
      guia: null,
      obsCrm: 'amarillo',
      correoUF: null
    },
    cambios: []
  },
  {
    id: '12',
    proveedor: 'MICROSOFT COLOMBIA',
    oc: 'OC-2025-012',
    cliente: 'MINISTERIO DE EDUCACIÓN',
    op: 'OP-5012',
    producto: 'Windows Server 2022 STD - 50 CALs',
    cantidad: 50,
    fechaEntrega: '2025-02-09',
    responsable: 'rojo',
    novedades: 'Pendiente aprobación presupuestal del cliente',
    subprocesos: {
      rem: null,
      factura: 'rojo',
      transportadora: null,
      guia: null,
      obsCrm: 'rojo',
      correoUF: null
    },
    cambios: [
      {
        campo: 'responsable',
        valorAnterior: 'amarillo',
        valorNuevo: 'rojo',
        usuario: 'Diego Castro',
        fecha: '2025-02-02T13:30:00Z',
        motivo: 'Cliente solicitó espera por aprobación interna'
      }
    ]
  },
  {
    id: '13',
    proveedor: 'LOGITECH COLOMBIA',
    oc: 'OC-2025-013',
    cliente: 'TERPEL S.A.',
    op: 'OP-5013',
    producto: 'Kit Teclado + Mouse Logitech MK850',
    cantidad: 200,
    fechaEntrega: '2025-02-14',
    responsable: 'verde-oscuro',
    novedades: 'Pedido entregado completamente sin novedad',
    subprocesos: {
      rem: 'verde-oscuro',
      factura: 'verde-oscuro',
      transportadora: 'verde-oscuro',
      guia: 'verde-oscuro',
      obsCrm: 'verde-oscuro',
      correoUF: 'verde-oscuro'
    },
    cambios: [
      {
        campo: 'responsable',
        valorAnterior: 'naranja',
        valorNuevo: 'verde-oscuro',
        usuario: 'Camila Vargas',
        fecha: '2025-02-02T17:45:00Z',
        motivo: 'Cliente confirmó recepción completa y conforme'
      }
    ]
  },
  {
    id: '14',
    proveedor: 'APPLE COLOMBIA',
    oc: 'OC-2025-014',
    cliente: 'JWT COLOMBIA',
    op: 'OP-5014',
    producto: 'MacBook Pro 16" M3 Max',
    cantidad: 12,
    fechaEntrega: '2025-02-28',
    responsable: 'amarillo',
    novedades: 'Producto de importación, tiempo de entrega extendido',
    subprocesos: {
      rem: null,
      factura: null,
      transportadora: null,
      guia: null,
      obsCrm: 'amarillo',
      correoUF: null
    },
    cambios: []
  },
  {
    id: '15',
    proveedor: 'VMware LATAM',
    oc: 'OC-2025-015',
    cliente: 'CEMEX COLOMBIA',
    op: 'OP-5015',
    producto: 'VMware vSphere Enterprise Plus',
    cantidad: 10,
    fechaEntrega: '2025-02-11',
    responsable: 'azul',
    novedades: 'Licencia perpetua con soporte anual',
    subprocesos: {
      rem: 'verde-oscuro',
      factura: 'verde-oscuro',
      transportadora: null,
      guia: null,
      obsCrm: 'verde-oscuro',
      correoUF: 'verde-oscuro'
    },
    cambios: []
  },
  {
    id: '16',
    proveedor: 'APC BY SCHNEIDER',
    oc: 'OC-2025-016',
    cliente: 'DAVIVIENDA S.A.',
    op: 'OP-5016',
    producto: 'UPS APC Smart-UPS 3000VA',
    cantidad: 25,
    fechaEntrega: '2025-02-19',
    responsable: 'naranja',
    novedades: 'Producto despachado, confirmando entrega con transportadora',
    subprocesos: {
      rem: 'verde-oscuro',
      factura: 'verde-oscuro',
      transportadora: 'naranja',
      guia: 'naranja',
      obsCrm: 'verde-claro',
      correoUF: null
    },
    cambios: [
      {
        campo: 'responsable',
        valorAnterior: 'morado',
        valorNuevo: 'naranja',
        usuario: 'Roberto Díaz',
        fecha: '2025-02-02T15:30:00Z',
        motivo: 'Producto salió de bodega, auxiliar debe confirmar guía'
      }
    ]
  },
  {
    id: '17',
    proveedor: 'FORTINET INC',
    oc: 'OC-2025-017',
    cliente: 'SURA S.A.',
    op: 'OP-5017',
    producto: 'FortiGate 600E Firewall',
    cantidad: 4,
    fechaEntrega: '2025-02-21',
    responsable: 'morado',
    novedades: 'Producto llegó a bodega, requiere configuración previa',
    subprocesos: {
      rem: 'morado',
      factura: 'verde-oscuro',
      transportadora: 'verde-claro',
      guia: 'verde-claro',
      obsCrm: 'verde-claro',
      correoUF: null
    },
    cambios: []
  },
  {
    id: '18',
    proveedor: 'SYNOLOGY COLOMBIA',
    oc: 'OC-2025-018',
    cliente: 'CARACOL TELEVISIÓN',
    op: 'OP-5018',
    producto: 'NAS Synology DS1823XS+',
    cantidad: 2,
    fechaEntrega: '2025-02-13',
    responsable: 'rojo',
    novedades: 'ERROR: NIT del cliente incorrecto en factura',
    subprocesos: {
      rem: 'verde-claro',
      factura: 'rojo',
      transportadora: null,
      guia: null,
      obsCrm: 'rojo',
      correoUF: null
    },
    cambios: [
      {
        campo: 'subprocesos.factura',
        valorAnterior: 'verde-claro',
        valorNuevo: 'rojo',
        usuario: 'Patricia Ruiz',
        fecha: '2025-02-02T12:00:00Z',
        motivo: 'Detectado error en NIT, requiere anulación y refacturación'
      }
    ]
  },
  {
    id: '19',
    proveedor: 'TP-LINK COLOMBIA',
    oc: 'OC-2025-019',
    cliente: 'CAFAM',
    op: 'OP-5019',
    producto: 'Access Point TP-Link EAP660 HD',
    cantidad: 50,
    fechaEntrega: '2025-02-16',
    responsable: 'verde-claro',
    novedades: 'Producto completo en bodega, listo para despacho',
    subprocesos: {
      rem: 'naranja',
      factura: 'verde-oscuro',
      transportadora: null,
      guia: null,
      obsCrm: 'verde-claro',
      correoUF: null
    },
    cambios: []
  },
  {
    id: '20',
    proveedor: 'ZOOM VIDEO COMMUNICATIONS',
    oc: 'OC-2025-020',
    cliente: 'UNIVERSIDAD NACIONAL',
    op: 'OP-5020',
    producto: 'Zoom Rooms - Licencia anual 100 salas',
    cantidad: 100,
    fechaEntrega: '2025-02-07',
    responsable: 'azul',
    novedades: 'Servicio anual recurrente - Educación',
    subprocesos: {
      rem: 'verde-oscuro',
      factura: 'verde-oscuro',
      transportadora: null,
      guia: null,
      obsCrm: 'verde-oscuro',
      correoUF: 'verde-oscuro'
    },
    cambios: []
  }
];

// Estados macro para vista Kanban ejecutiva (sin colores operativos)
export type EstadoMacro = 
  | 'en_compras'
  | 'en_proveedor'
  | 'en_transporte'
  | 'en_bodega'
  | 'bloqueado'
  | 'cerrado';

export interface VistaEjecutiva {
  id: string;
  cliente: string;
  producto: string;
  cantidad: number;
  estadoMacro: EstadoMacro;
  fechaEntrega: string;
  valorTotal: number;
}

// Función para calcular estado macro desde colores operativos
export function calcularEstadoMacro(registro: RegistroTablero): EstadoMacro {
  // Bloqueado (Rojo en responsable)
  if (registro.responsable === 'rojo') {
    return 'bloqueado';
  }
  
  // Cerrado (Verde oscuro en responsable y todos los subprocesos críticos)
  if (
    registro.responsable === 'verde-oscuro' &&
    registro.subprocesos.factura === 'verde-oscuro' &&
    registro.subprocesos.correoUF === 'verde-oscuro'
  ) {
    return 'cerrado';
  }
  
  // En bodega (Verde claro o Naranja en responsable)
  if (registro.responsable === 'verde-claro' || registro.responsable === 'naranja') {
    return 'en_bodega';
  }
  
  // En transporte (Morado en responsable)
  if (registro.responsable === 'morado') {
    return 'en_transporte';
  }
  
  // En proveedor (Amarillo en responsable + subprocesos no iniciados)
  if (registro.responsable === 'amarillo') {
    if (registro.subprocesos.rem || registro.subprocesos.factura) {
      return 'en_proveedor';
    }
    return 'en_compras';
  }
  
  // Licencias/Servicios (Azul) se consideran como proceso especial
  if (registro.responsable === 'azul') {
    if (registro.subprocesos.correoUF === 'verde-oscuro') {
      return 'cerrado';
    }
    return 'en_proveedor';
  }
  
  return 'en_compras';
}

// Generar vista ejecutiva
export function generarVistaEjecutiva(): VistaEjecutiva[] {
  return registrosTableroMock.map(registro => ({
    id: registro.id,
    cliente: registro.cliente,
    producto: registro.producto,
    cantidad: registro.cantidad,
    estadoMacro: calcularEstadoMacro(registro),
    fechaEntrega: registro.fechaEntrega,
    valorTotal: Math.random() * 100000000 // Mock de valor
  }));
}

export const labelEstadosMacro = {
  'en_compras': 'En Compras',
  'en_proveedor': 'En Proveedor',
  'en_transporte': 'En Transporte',
  'en_bodega': 'En Bodega',
  'bloqueado': 'Bloqueado',
  'cerrado': 'Cerrado'
} as const;
