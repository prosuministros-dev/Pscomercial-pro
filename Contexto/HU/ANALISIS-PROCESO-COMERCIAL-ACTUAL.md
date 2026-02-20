# ANALISIS DEL PROCESO COMERCIAL ACTUAL - PROSUMINISTROS

> **Documento generado a partir del analisis exhaustivo de las 8 transcripciones** de reuniones
> entre el equipo de desarrollo (Cegeka/TDX) y PROSUMINISTROS.
>
> **Fuentes analizadas:**
> - Kick Off (10 oct 2025) - 117,350 caracteres
> - Levantamiento de Requerimientos (15 oct 2025) - 48,215 caracteres
> - Levantamiento de Informacion (20 oct 2025) - 39,995 caracteres
> - Plataforma Odoo Actual (1 oct 2025) - 44,424 caracteres
> - Simulacion Demo (5 nov 2025) - 26,071 caracteres
> - Validacion PS (4 dic 2025) - 147,444 caracteres
> - CheckPoint PS (11 dic 2025) - 44,146 caracteres
> - Flujo Claude - 9,859 caracteres
>
> **Fecha de elaboracion:** 19 de febrero de 2026
> **Elaborado por:** Business Analyst Agent

---

## TABLA DE CONTENIDOS

1. [Contexto General](#1-contexto-general)
2. [Plataforma Actual (AS-IS)](#2-plataforma-actual-as-is)
3. [Roles y Responsabilidades](#3-roles-y-responsabilidades)
4. [Flujo Comercial Completo Paso a Paso](#4-flujo-comercial-completo-paso-a-paso)
5. [Variantes y Caminos Alternativos del Proceso](#5-variantes-y-caminos-alternativos-del-proceso)
6. [Reglas de Negocio Detalladas](#6-reglas-de-negocio-detalladas)
7. [Documentos Generados en el Proceso](#7-documentos-generados-en-el-proceso)
8. [Estados y Transiciones de Cada Entidad](#8-estados-y-transiciones-de-cada-entidad)
9. [Campos y Datos por Entidad](#9-campos-y-datos-por-entidad)
10. [Canales de Captacion de Leads](#10-canales-de-captacion-de-leads)
11. [Automatizaciones y Notificaciones](#11-automatizaciones-y-notificaciones)
12. [Integraciones con Sistemas Externos](#12-integraciones-con-sistemas-externos)
13. [Pain Points de la Plataforma Actual](#13-pain-points-de-la-plataforma-actual)
14. [Puntos de Decision en el Flujo](#14-puntos-de-decision-en-el-flujo)
15. [Logistica y Operaciones](#15-logistica-y-operaciones)
16. [Dashboard y Reportes](#16-dashboard-y-reportes)
17. [WhatsApp y Comunicaciones](#17-whatsapp-y-comunicaciones)
18. [Glosario de Terminos del Negocio](#18-glosario-de-terminos-del-negocio)

---

## 1. CONTEXTO GENERAL

### Sobre PROSUMINISTROS

PROSUMINISTROS es una empresa colombiana dedicada a la **comercializacion de suministros tecnologicos e industriales** (servidores, monitores, licencias de software, accesorios, hardware en general). No fabrica productos; compra a mayoristas/proveedores (Ingram, etc.) y revende a clientes corporativos con un margen de utilidad.

### Volumenes de Operacion

| Metrica | Valor |
|---------|-------|
| Cotizaciones por mes | ~120 (6 diarias aprox.) |
| Asesores comerciales activos | 3 (Jaime, Angela, Camilo; con posibilidad de crecer a 4-5) |
| Leads max por asesor (pendientes) | 5 (configurable) |
| Consecutivo de leads | Inicia en 100 |
| Consecutivo de cotizaciones | Inicia en 30,000 |
| Antigedad de operacion | ~10 anos |

### Equipo Interno

| Persona | Area | Rol Principal |
|---------|------|---------------|
| Daniel Valbuena | Gerencia Comercial | Director comercial, aprobador final, define estrategia |
| Laura Burgos | Financiera/Tesoreria | Bloqueos de cartera, TRM, proformas, creditos, facturacion |
| Juan Angel | Financiera | Analisis financiero, cupos de credito, estructura reportes |
| Andres Valbuena | Compras/Logistica | Ordenes de compra, ingreso de mercancia, despacho, cierre |
| Estefania | Facturacion | Emision de facturas parciales/totales |
| Jaime, Angela, Camilo | Comercial | Asesores que gestionan leads, cotizaciones, pedidos |
| Sebastian | Comercial | Asesor adicional |

---

## 2. PLATAFORMA ACTUAL (AS-IS)

### Sistemas en Uso

| Sistema | Funcion | Estado |
|---------|---------|--------|
| **CRM Berneo/Verneo** (Odoo-based) | CRM + algunas funciones de ERP: cotizaciones, pedidos, OC | Principal, con muchos problemas |
| **World Office** | Sistema contable: facturacion electronica, cuentas por cobrar, conciliacion bancaria | Funcional, on-premise (servidor en bodega) |
| **SharePoint** | Almacenamiento de documentos (OC, facturas proveedores) | Parche tras perdida de datos |
| **Excel + Macros** | Informe de ventas diario, gestion de cartera semanal, envio de correos masivos | Manual, muy laborioso |
| **WhatsApp** | Comunicacion directa con clientes, seguimiento manual de cotizaciones | Sin automatizacion |

### Funcionalidades del CRM Actual (Odoo/Berneo)

**Lo que SI funciona (parcialmente):**
- Flujo basico: cotizacion -> pedido -> orden de compra
- Multimoneda con TRM (ingresada manualmente por Laura)
- Exportacion a PDF de cotizaciones y OC
- Sistema de permisos por rol (Director ve todo, comerciales solo lo suyo)
- Bloqueo de cartera
- Reglas de margen minimo por vertical/categoria
- Notificaciones internas (chat con envio a correo)
- Sistema de adjuntos (actualmente roto)
- Consecutivos para cotizaciones y pedidos

**Lo que esta ROTO o NO funciona:**
- Panel de leads: filtros rotos, muestra todo, Daniel tiene que adivinar
- Chatbox de la pagina web: proveedor dejo de prestar servicio
- Adjuntos: el proveedor les borro TODA la informacion de 5 anos
- Panel de compras invertido: muestra OC generadas en vez de pendientes
- Aprobaciones: aparecen como pendientes despues de aprobadas
- Correos internos: problemas de entrega con Gmail
- Filtros de pedidos (abierto, pendiente facturar, cerrar) no funcionan

**Lo que NO existe y necesitan:**
- Seguimiento automatizado de cotizaciones via WhatsApp
- Dashboard interactivo (tipo Power BI)
- Trazabilidad completa de observaciones (quien, cuando)
- Chatbot inteligente para captura y seguimiento
- Envio de cotizaciones desde la plataforma
- Alertas automaticas por tiempo sin gestion

---

## 3. ROLES Y RESPONSABILIDADES

### 3.1 Director Comercial / Gerencia General (Daniel Valbuena)

| Responsabilidad | Detalle |
|-----------------|---------|
| Asignacion de leads | Filtra leads y los asigna a comerciales (en plataforma actual, manual) |
| Parametrizacion de clientes | Asigna categoria de cliente (Triple A, Doble A, B, C) basado en analisis Pareto |
| Aprobacion de margenes | Unico aprobador cuando un comercial solicita margen inferior al minimo |
| Aprobacion de cartera (backup) | Puede aprobar desbloqueos cuando Laura Burgos no esta |
| Aprobacion de extra cupo (backup) | Puede aprobar extra cupo cuando Laura no esta |
| Vision global | Ve cotizaciones, pedidos y conversaciones de TODOS los comerciales |
| Permisos | Administra permisos de usuarios, puede bloquear/desbloquear |
| Via de contacto | Registra como llego el cliente (Google, referido, campana) |

### 3.2 Asesores Comerciales (Jaime, Angela, Camilo, Sebastian)

| Responsabilidad | Detalle |
|-----------------|---------|
| Atencion de leads | Reciben notificaciones de leads asignados, validan si son reales o basura |
| Creacion de cotizaciones | Diligencian todos los campos: productos, margenes, precios, condiciones |
| Seguimiento | Contactan al cliente para dar seguimiento (actualmente manual) |
| Generacion de pedidos | Seleccionan productos aceptados y generan pedido desde la cotizacion |
| Datos de despacho | Diligencian informacion de entrega (quien recibe, direccion, etc.) |
| Solicitudes | Solicitan aprobacion de margen, desbloqueo de cartera, extra cupo, proformas |
| Vision restringida | Solo ven SUS propias cotizaciones y pedidos, NO los de otros comerciales |
| Restricciones | No pueden exportar datos, no pueden modificar forma de pago, no pueden modificar datos de despacho una vez bloqueados |

### 3.3 Area Financiera / Tesoreria (Laura Burgos)

| Responsabilidad | Detalle |
|-----------------|---------|
| TRM diaria | Ingresa manualmente la TRM cada manana |
| Condiciones de pago | Unica autorizada para asignar credito a clientes (30, 45, 60 dias) |
| Bloqueo de cartera | Bloquea/desbloquea clientes por cartera en mora |
| Aprobacion financiera | Aprueba solicitudes de extra cupo, desbloqueo de cartera |
| Generacion de proformas | Unica autorizada para generar proformas (PDF) para clientes sin credito |
| Verificacion de pagos | Verifica en banco cuando un cliente anticipado paga, aprueba montaje de pedido |
| Costos reales | Captura costos reales de facturacion: factura proveedor, transporte, ICA, 4x1000 |
| Info de tesoreria | Diligencia contactos para cobro de cartera del cliente |
| Informe de ventas | Genera diariamente informe de ventas manual en Excel |
| Gestion de cartera | Gestiona cobros con notificaciones por niveles de riesgo |

### 3.4 Area Financiera (Juan Angel)

| Responsabilidad | Detalle |
|-----------------|---------|
| Analisis financiero | Define cupos de credito |
| Estructura de reportes | Disena reportes de ventas y cartera |
| Revision de cartera | Participa con Laura y Daniel en revision de clientes morosos |

### 3.5 Compras/Logistica (Andres Valbuena)

| Responsabilidad | Detalle |
|-----------------|---------|
| Ordenes de compra | Genera OC a proveedores desde el detalle del pedido |
| Seleccion de proveedor | Puede usar proveedor diferente al sugerido por el comercial |
| Ingreso de mercancia | Registra numero de factura del proveedor y cantidad recibida |
| Despacho | Registra transportadora, guia, fecha de despacho |
| Cierre de pedidos | Cierra pedidos cuando estan 100% entregados, facturados y con documentacion |
| Cierre de OC | Cierra ordenes de compra cuando mercancia esta completa |
| Verificacion de licencias | Para software, verifica certificados (serial, vencimiento) antes de cerrar |

### 3.6 Logistica (equipo de Andres)

| Responsabilidad | Detalle |
|-----------------|---------|
| Despacho fisico | Coordina transportadoras, mensajeros, minivan |
| Registro de guias | Registra: transportadora, numero de guia, fecha despacho, fecha entrega |
| Notificacion | Notifica via chat interno datos de transporte al equipo |
| Confirmacion de entrega | Registra si la mercancia fue entregada al cliente |

### 3.7 Facturacion (Estefania + Laura Burgos)

| Responsabilidad | Detalle |
|-----------------|---------|
| Revisar pedidos facturables | Filtra pedidos que cumplen condiciones para facturar |
| Emision de facturas | Genera facturas en World Office (parciales o totales) |
| Registro de factura | Registra numero, fecha, valor y productos facturados en la plataforma |

### Permisos Definidos por Areas (Confirmado por Daniel)

Se tiene una **matriz de 8 roles** documentada en Excel con pestanas por modulo, donde se especifica que puede hacer cada rol en: creacion de cliente, producto, forma de pago, moneda, via de contacto, vertical, margenes minimos, lead, cotizacion, pedido, OC, etc.

---

## 4. FLUJO COMERCIAL COMPLETO PASO A PASO

### Diagrama de Alto Nivel

```
LEAD → COTIZACION → APROBACIONES → PEDIDO → COMPRAS → DESPACHO → FACTURACION → CIERRE
```

### FASE 1: Captacion y Registro del Lead

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 1.1 | Cliente contacta | Cliente | Via WhatsApp, pagina web, telefono o referido |
| 1.2 | Chatbot captura datos | Sistema (bot) | Preguntas: nombre, empresa, telefono, correo, requerimiento |
| 1.3 | Se crea el lead | Sistema | Numero consecutivo desde 100 (101, 102...) |
| 1.4 | Se registra canal y fecha | Sistema | Canal: WhatsApp, web, manual. Fecha y hora de contacto |
| 1.5 | Asignacion automatica | Sistema | Round-robin entre comerciales activos (max 5 pendientes por asesor) |
| 1.6 | Notificacion al asesor | Sistema | "Tienes X leads pendientes por atender" |

### FASE 2: Validacion del Lead

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 2.1 | Asesor recibe notificacion | Asesor Comercial | Revisa informacion del lead |
| 2.2a | **Si es valido** → Continua | Asesor Comercial | Procede a crear cotizacion |
| 2.2b | **Si es basura** → Descarta | Asesor Comercial | Selecciona razon de rechazo de lista desplegable. Lead queda como "atendido/descartado" |

### FASE 3: Creacion/Busqueda del Cliente

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 3.1 | Buscar cliente existente | Asesor Comercial | Busca por NIT o razon social |
| 3.2a | **Si existe** → Seleccionar | Asesor | Usa el cliente existente |
| 3.2b | **Si no existe** → Crear | Asesor | Diligencia datos del nuevo cliente |
| 3.3 | Datos obligatorios del cliente | Asesor | NIT (tipo: Cedula/NIT/Cedula Extranjeria), Razon social, Actividad economica (vertical), Direccion, Ciudad |
| 3.4 | Contacto(s) del cliente | Asesor | Nombre, Cargo, Ciudad, Telefono, Correo. UNA razon social puede tener MULTIPLES contactos (hasta 57 compradores) |
| 3.5 | Via de contacto | Daniel/Asesor | Google, referido, campana, existente, gestion comercial. Solo al momento de creacion, NO editable despues |
| 3.6 | Categoria del cliente | Daniel (exclusivo) | Triple A, Doble A, B, C - basado en analisis Pareto |
| 3.7 | Moneda predeterminada | Laura/Daniel | Pesos colombianos o Dolares |
| 3.8 | Condiciones de pago | Laura Burgos (exclusivo) | Pago anticipado, 30, 45, 60 dias, Leasing |
| 3.9 | Cupo de credito | Laura/Juan Angel | Cupo asignado y cupo disponible (futuro: via API World Office) |
| 3.10 | Email de facturacion | Asesor | Campo NO obligatorio en creacion, pero SI obligatorio al generar pedido |
| 3.11 | Info de tesoreria | Laura Burgos | Contactos para cobro de cartera |

### FASE 4: Creacion de la Cotizacion

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 4.1 | Crear cotizacion | Asesor Comercial | Vinculada al cliente. Consecutivo desde 30,000 |
| 4.2 | Asunto | Asesor | Campo obligatorio, editable. Descripcion interna de la oportunidad (ej: "25 monitores + licencias"). NO sale en PDF al cliente |
| 4.3 | Asesor asignado | Sistema | Predeterminado del cliente, editable |
| 4.4 | Etapa/probabilidad | Asesor | Creacion de oferta (40%) → Negociacion (60%) → Riesgo (70%) → Pendiente OC (80%) |
| 4.5 | Vigencia | Asesor | Por defecto 5 dias calendario, editable |
| 4.6 | Info de cierre proyectado | Asesor | Mes de cierre, semana de cierre, ano de cierre, mes de facturacion |
| 4.7 | Agregar productos | Asesor | Ver detalle de productos abajo |
| 4.8 | Indicar transporte | Asesor | Si incluye transporte: SI/NO + valor estimado. Es campo INTERNO, no visible al cliente |
| 4.9 | Condiciones comerciales | Asesor | Condiciones de entrega, financieras, de producto |

### FASE 4.1: Detalle de Productos en la Cotizacion

Para **cada producto/linea** de la cotizacion:

| Campo | Obligatorio | Detalle |
|-------|:-----------:|---------|
| Orden de impresion | Si | Numero que define posicion en el PDF (critico: comerciales no reciben costos en el orden del cliente) |
| Numero de parte | Si | Identificador del producto |
| Vertical/Categoria | Si | Hardware, Software, Servicios, Accesorios |
| Subcategoria | No | Clasificacion adicional |
| Marca | Si | Ej: Lenovo, Dell, HP |
| Nombre/Descripcion | Si | Texto descriptivo del producto |
| Cantidad | Si | Unidades solicitadas |
| Costo unitario | Si | En USD o COP (segun proveedor) |
| Moneda del costo | Si | USD o Pesos |
| TRM del dia | Auto | Si el costo es en USD, se multiplica por la TRM para obtener COP |
| Margen % | Si | Porcentaje de margen deseado. Validado contra minimos |
| Precio de venta | Calculado | `Costo / (1 - Margen%)` |
| IVA | Si | Lista cerrada: 0%, 5%, 19% |
| Proveedor/Mayorista | Si | Se selecciona de lista de proveedores creados. Puede ser "no creado" |
| Tiempo de entrega | Si | Editable por producto |
| Garantia | Si | Editable por producto |
| Observaciones | No | Campo libre (links, info del proveedor, notas) |

**Liquidacion total de la cotizacion:** Total Costo + Total Venta + Utilidad + Margen global

### FASE 5: Validacion de Margen

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 5.1 | Sistema valida margen | Sistema | Compara margen de CADA producto contra el minimo de su categoria + plazo de credito |
| 5.2a | **Margen >= minimo** → OK | Sistema | El comercial puede continuar sin restriccion |
| 5.2b | **Margen < minimo** → Alerta | Sistema | Pregunta al comercial si desea solicitar aprobacion |
| 5.3a | Comercial dice NO → Ajuste | Sistema | Automaticamente aplica el margen minimo aprobado para esa categoria |
| 5.3b | Comercial dice SI → Solicitud | Sistema | Envia solicitud de aprobacion a Daniel Valbuena (exclusivamente) |
| 5.4 | Daniel revisa solicitud | Daniel | Puede aprobar el margen solicitado O un margen diferente (ej: se pide 5%, aprueba 4%) |
| 5.5a | **Aprobado** → Cotizacion se puede enviar | Sistema | Se marca "Menor utilidad autorizada: X%" visible en el producto |
| 5.5b | **Rechazado** → Comercial debe ajustar | Sistema | El comercial no puede usar un margen inferior al aprobado |
| 5.6 | **Mientras tanto** | Asesor | La cotizacion se guarda con margen minimo, el comercial puede seguir trabajando y exportando PDF. NO se bloquea para edicion, solo para pasar a pedido |

### FASE 6: Envio de Cotizacion y Seguimiento

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 6.1 | Exportar cotizacion a PDF | Asesor | PDF con formato corporativo, respeta campo "orden" de productos |
| 6.2 | Enviar al cliente | Asesor | Por correo electronico o por link publico via WhatsApp (NO adjunto, sino link) |
| 6.3 | Seguimiento automatico | Sistema (chatbot) | Cada X dias (configurable, ej: 8 dias) envia mensaje automatico por WhatsApp con template aprobado por Meta |
| 6.4 | Mensaje de seguimiento | Bot | "Hola [Nombre], queria validar como vas con esta cotizacion" + link a PDF |
| 6.5 | Cliente responde | Cliente | Via WhatsApp |
| 6.6 | IA interpreta respuesta | Sistema | Clasifica respuesta y genera alertas: "En validacion", "Solicita modificacion", "Fecha tentativa", "Perdida por precio", "Sin respuesta" |
| 6.7 | Notificacion al comercial | Sistema | Alerta con resumen de la respuesta del cliente |
| 6.8 | Comercial actua | Asesor | Modifica cotizacion si es necesario, actualiza etapa |

### FASE 7: Aceptacion del Cliente y Generacion de Pedido

**CAMINO A: Cliente CON credito aprobado (sin bloqueos)**

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 7A.1 | Cliente envia orden de compra | Cliente | Confirmacion de aceptacion |
| 7A.2 | Seleccionar productos aceptados | Asesor | Puede seleccionar todos o solo algunos items de la cotizacion |
| 7A.3 | Clic en "Generar Pedido" | Asesor | Se crea el pedido vinculado a la cotizacion |
| 7A.4 | Cotizacion pasa a "Ganada" | Sistema | Desaparece del modulo de cotizaciones activas |

**CAMINO B: Cliente SIN credito (pago anticipado)**

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 7B.1 | Comercial solicita proforma | Asesor | Marca en la cotizacion "Solicitud de Proforma" para financiera |
| 7B.2 | Financiera recibe solicitud | Laura Burgos | Entra a la cotizacion, revisa margen |
| 7B.3 | Genera proforma (PDF) | Laura Burgos | Formato diferente a la cotizacion, con numeracion consecutiva |
| 7B.4 | Notificacion al comercial | Sistema | "Tu proforma esta lista" |
| 7B.5 | Comercial envia proforma | Asesor | Al cliente, por correo o link WhatsApp |
| 7B.6 | Cliente paga | Cliente | Transferencia bancaria |
| 7B.7 | Comercial solicita verificacion | Asesor | Solicitud de "verificacion de pago" a financiera |
| 7B.8 | Financiera verifica en banco | Laura Burgos | Conciliacion bancaria, verifica deposito |
| 7B.9 | Financiera aprueba | Laura Burgos | Autoriza generacion de pedido |
| 7B.10 | Se genera pedido | Asesor | Mismo flujo que Camino A a partir de 7A.2 |

**CAMINO C: Cliente con BLOQUEO DE CARTERA**

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 7C.1 | Sistema muestra alerta | Sistema | "Este cliente esta bloqueado por cartera en mora" |
| 7C.2 | Comercial PUEDE cotizar | Asesor | El bloqueo NO impide crear/enviar cotizaciones |
| 7C.3 | Para generar pedido → Solicitud | Asesor | Solicita aprobacion de "montar pedido" a financiera |
| 7C.4 | Cliente envia compromiso de pago | Cliente | Correo con compromiso de pago |
| 7C.5 | Laura/Daniel evaluan | Laura/Daniel | Analizan situacion y deciden |
| 7C.6a | **Aprobado** → Pedido habilitado | Sistema | Se puede generar el pedido |
| 7C.6b | **Rechazado** → Bloqueado | Sistema | No se puede generar pedido |

**CAMINO D: Cotizacion EXCEDE cupo de credito disponible**

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 7D.1 | Sistema detecta exceso | Sistema | Cupo disponible < valor de cotizacion |
| 7D.2 | Solicitud de extra cupo | Sistema/Asesor | Automatica: "Necesita extra cupo de $XX" |
| 7D.3 | Laura/Daniel evaluan | Laura/Daniel | Analizan la solicitud |
| 7D.4a | **Aprobado** → Extra cupo otorgado | Sistema | Se puede generar pedido |
| 7D.4b | **Rechazado** → No puede montar pedido | Sistema | Pero SI puede seguir cotizando normalmente |

**NOTA:** Los caminos C y D pueden combinarse: cliente bloqueado por cartera Y que excede cupo.

### FASE 8: Configuracion del Pedido

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 8.1 | Validar email de facturacion | Sistema | Si no hay email → alerta, no permite continuar |
| 8.2 | Datos de despacho (obligatorios) | Asesor | Quien recibe, telefono, direccion, ciudad, horario, correo |
| 8.3 | **Datos se bloquean** | Sistema | Una vez guardados, NADIE puede modificar datos de despacho |
| 8.4 | Configurar despacho parcial | Asesor | SI / NO (checkbox) |
| 8.5 | Configurar facturacion parcial | Asesor | SI / NO (checkbox) |
| 8.6 | Config facturacion sin confirmacion de entrega | Asesor | SI / NO (aplica para envios nacionales) |
| 8.7 | Actualizar TRM | Obligatorio | Si hay conversion de moneda, TRM se actualiza al dia del pedido |
| 8.8 | Adjuntar documentos | Asesor | Carpeta "Documentos cliente": OC del cliente, contratos, polizas |
| 8.9 | Pedido queda inmutable para comercial | Sistema | El comercial ya no puede modificar informacion comercial del pedido |

### FASE 9: Ordenes de Compra

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 9.1 | Andres ve pedidos con items pendientes | Andres (Compras) | Panel muestra: cantidad solicitada, comprada, pendiente |
| 9.2 | Selecciona productos a comprar | Andres | Checkboxes para seleccionar uno o varios items |
| 9.3 | Selecciona proveedor | Andres | Puede usar proveedor diferente al sugerido por el comercial |
| 9.4 | Diligencia datos de la OC | Andres | Mayorista, ejecutivo del proveedor, costo negociado, moneda, garantia, fecha entrega |
| 9.5 | Cantidad no puede exceder pedido | Sistema | Validacion: cantidad a comprar <= cantidad del pedido |
| 9.6 | IVA por producto | Andres | Seleccion de lista desplegable (0%, 5%, 19%) |
| 9.7 | Sistema genera OC con consecutivo | Sistema | Numero de OC propio, diferente al del pedido |
| 9.8 | Exportar OC a PDF | Andres | PDF con: numero de parte, cantidad, costo, IVA, subtotal, total |
| 9.9 | Enviar OC al proveedor | Andres | Por correo electronico, con copia a logistica |
| 9.10 | Adjuntar documentos proveedor | Andres | Carpeta "Documentos proveedor": cotizaciones proveedor, facturas, RUT |
| 9.11 | Pueden generarse multiples OC por pedido | Sistema | Un pedido puede tener varias OC a diferentes proveedores |

### FASE 10: Recepcion de Mercancia

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 10.1 | Mercancia llega | Proveedor | Puede ser en transito o entrega inmediata (despacho directo) |
| 10.2 | Registrar ingreso | Andres | Numero de factura del proveedor + cantidad recibida + fecha |
| 10.3 | Sistema deduce recepcion | Sistema | El registro de factura = mercancia recibida |
| 10.4 | OC se puede cerrar | Andres | Cuando mercancia esta 100% completa, cierra la OC |

### FASE 11: Despacho/Logistica

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 11.1 | Logistica prepara despacho | Logistica | Coordina transportadora o mensajero |
| 11.2 | Registrar datos de despacho | Logistica | Transportadora, numero de guia, fecha de despacho, productos despachados |
| 11.3a | Despacho parcial (si permitido) | Logistica | Marca "Despachado parcial" con detalle de que se despacho |
| 11.3b | Despacho total | Logistica | Marca "Despachado total" |
| 11.4 | Notificacion por chat interno | Logistica | Mensaje con datos de transporte al equipo |
| 11.5 | Confirmacion de entrega | Logistica | Registra si el cliente recibio la mercancia |
| 11.6a | Entregado parcial | Logistica | Si solo llego parte |
| 11.6b | Entregado total | Logistica | Todo fue recibido por el cliente |

### FASE 12: Facturacion

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 12.1 | Sistema filtra pedidos facturables | Sistema | Segun reglas configuradas (ver seccion de reglas) |
| 12.2 | Facturadora revisa lista | Estefania/Laura | Pedidos que cumplen condiciones para facturar |
| 12.3 | Genera factura en World Office | Facturacion | Factura electronica en sistema contable externo |
| 12.4 | Registra factura en plataforma | Facturacion | Numero de factura, fecha, valor, productos facturados |
| 12.5a | Facturacion parcial (si permitida) | Facturacion | Pedido sigue con saldo restante |
| 12.5b | Facturacion total | Facturacion | Pedido queda como facturado |
| 12.6 | Captura de costos reales | Laura Burgos | Factura proveedor, transporte/flete, ICA, 4x1000, otros |

### FASE 13: Cartera y Recaudo

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 13.1 | Descarga reporte de World Office | Laura | Facturas pendientes por cobrar |
| 13.2 | Notificaciones por nivel de riesgo | Sistema | Automaticas segun dias de vencimiento |
| 13.3 | Recordatorio (proxima a vencer) | Sistema | Notificacion amigable al cliente |
| 13.4 | Riesgo bajo (0-5 dias vencido) | Sistema | Notificacion cordial |
| 13.5 | Riesgo medio (5-15 dias vencido) | Sistema | Notificacion firme |
| 13.6 | Riesgo alto (>15 dias vencido) | Sistema | Advertencia de intereses moratorios |
| 13.7 | Pago recibido | Laura | Conciliacion bancaria manual, cruza con facturas |
| 13.8 | Marca como recaudado | Laura | Factura marcada como pagada |

### FASE 14: Cierre del Pedido

| Paso | Accion | Responsable | Detalle |
|------|--------|-------------|---------|
| 14.1 | Andres verifica completitud | Andres | 100% entregado + 100% facturado + documentacion adjunta |
| 14.2a | **Hardware**: Verificar entrega y documentos | Andres | Todo entregado y documentado |
| 14.2b | **Software/Licencias**: Verificar certificados | Andres | Serial, fecha de vencimiento |
| 14.3 | Ejecutar cierre | Andres | Pedido cambia a estado "Cerrado" |
| 14.4 | **Si no esta completo**: No se puede cerrar | Sistema | Queda pendiente hasta completarse |
| 14.5 | **Si se anula**: Indicar motivo | Andres | Pedido pasa a "Anulado" (diferente a "Perdido" que es para cotizaciones) |

---

## 5. VARIANTES Y CAMINOS ALTERNATIVOS DEL PROCESO

### Tabla Resumen de Bifurcaciones

| # | Punto de Bifurcacion | Condicion | Camino A | Camino B |
|---|----------------------|-----------|----------|----------|
| 1 | Lead recibido | Valido o basura | Convertir a cotizacion | Descartar con razon obligatoria |
| 2 | Cliente existe | En sistema o nuevo | Seleccionar existente | Crear nuevo con todos los datos |
| 3 | Margen por debajo del minimo | Margen < minimo categoria+credito | Solicitar aprobacion a Daniel | Automaticamente aplicar margen minimo |
| 4 | Daniel evalua margen | Aprobado o rechazado | Comercial usa margen aprobado (puede ser diferente al solicitado) | Comercial debe ajustar al alza |
| 5 | Cliente con credito | Si / No | Va directo a pedido | Necesita proforma → pago → verificacion |
| 6 | Cliente con factura electronica | Si / No | Proforma no necesaria, se genera factura directa en World Office | Flujo normal con proforma |
| 7 | Cliente bloqueado por cartera | Si / No | Solicitar aprobacion para montar pedido | Flujo normal |
| 8 | Cotizacion excede cupo | Si / No | Solicitar extra cupo a Laura/Daniel | Flujo normal |
| 9 | Combinacion C+D | Bloqueado + excede cupo | Doble aprobacion requerida | N/A |
| 10 | Moneda del costo | USD / COP | Multiplicar por TRM del dia | Usar directamente |
| 11 | Moneda de venta | USD / COP | Conversion inversa si aplica | Usar directamente |
| 12 | Transporte incluido | Si / No | Valor del transporte hace parte de la liquidacion total | Campo estimado interno para proteger margen |
| 13 | Despacho parcial | Permitido / No | Logistica puede despachar por partes | Solo despacho total |
| 14 | Facturacion parcial | Permitida / No | Se puede facturar despues de despacho parcial | Solo despues de despacho total |
| 15 | Facturacion sin confirmacion | Permitida / No | Facturar apenas se despacha | Solo facturar cuando cliente confirma recepcion |
| 16 | Tipo de producto al cerrar | Hardware vs Software | Solo verificar entrega y documentos | Verificar certificado (serial, vencimiento) |
| 17 | Pedido incompleto | Falta algo | No se puede cerrar, queda pendiente | Anular indicando motivo |
| 18 | Cliente acepta totalmente | Si / Parcialmente | Todos los items pasan a pedido | Solo items seleccionados pasan |
| 19 | Cotizacion con multiples alternativas | Si / No | Se duplica cotizacion (ej: Lenovo, Dell, HP para mismo proyecto) | Cotizacion unica |
| 20 | Entrega en Bogota | Cabe en moto / No | Sin costo de transporte (moto) | Minivan de tercero (con costo) |
| 21 | Despacho nacional | Si / No | Transportadora (Envia, Servientrega, etc.) con costo variable | Entrega local |
| 22 | Proveedor para OC | Mismo sugerido / Otro | Usar proveedor sugerido por comercial | Andres elige proveedor diferente |
| 23 | Seguimiento WhatsApp | Cliente responde / No | IA clasifica respuesta y notifica | Registra "sin respuesta", agenda proximo seguimiento |
| 24 | Respuesta del cliente | Multiple | "En estudio", "Necesita modificacion", "Genera OC", "Perdida por precio", "Solicita ficha tecnica" | Cada una tiene accion diferente |

### Reglas de Facturacion Segun Configuracion (Combinatoria)

| Facturacion Parcial | Despacho Parcial | Sin Confirmacion Entrega | Condicion para Facturar |
|:---:|:---:|:---:|---|
| SI | SI | SI | Facturar apenas despachado parcial |
| SI | SI | NO | Facturar cuando despachado parcial + entregado parcial |
| SI | NO | SI | Facturar cuando despachado total |
| SI | NO | NO | Facturar cuando despachado total + entregado total |
| NO | SI | SI | Facturar cuando despachado total |
| NO | SI | NO | Facturar cuando despachado total + entregado total |
| NO | NO | SI | Facturar cuando despachado total |
| NO | NO | NO | Facturar cuando despachado total + entregado total |

---

## 6. REGLAS DE NEGOCIO DETALLADAS

### 6.1 Formula de Calculo de Margen

```
Precio de Venta = Costo / (1 - Margen%)
Utilidad = Precio de Venta - Costo
Margen% = 1 - (Costo / Precio de Venta)
```

**Ejemplo:** Costo USD 179.50, margen 8%
- Precio = 179.50 / (1 - 0.08) = 179.50 / 0.92 = 195.11 USD

**Calculo bidireccional:**
- Dado margen → calcula precio de venta
- Dado precio de venta → calcula margen resultante

### 6.2 Conversion de Moneda (TRM)

| Escenario | Formula |
|-----------|---------|
| Costo en USD, venta en COP | `Costo_COP = Costo_USD x TRM_del_dia` → luego aplicar margen |
| Costo en COP, venta en USD | `Costo_USD = Costo_COP / TRM_del_dia` → luego aplicar margen |
| Redondeo en pesos | Eliminar decimales, redondear por encima |
| Responsable TRM | Laura Burgos, diariamente, manual (deseado: automatico con fallback manual) |

### 6.3 Margenes Minimos por Categoria de Producto

| Categoria | Margen Minimo Base |
|-----------|-------------------|
| Hardware | 6% (temporalmente, subira a 7%) |
| Software | 4% |
| Servicios | 6% |
| Accesorios | 6% |

### 6.4 Margenes Minimos por Plazo de Credito

| Plazo de Credito | Margen Minimo Adicional |
|------------------|------------------------|
| Pago anticipado | Sin restriccion adicional |
| 30 dias | 7% |
| 45 dias | 10% |
| 60 dias | 12% |

**Regla combinada deseada:** Matriz que cruce categoria con plazo de credito. Ejemplo: Hardware a 30 dias = max(6%, 7%) = 7%.

### 6.5 Reglas de Aprobacion de Margenes

- La validacion de margen es **POR PRODUCTO**, no por cotizacion total
- Si margen < minimo: solicitud va EXCLUSIVAMENTE a Daniel Valbuena
- Daniel puede aprobar un margen DIFERENTE al solicitado (ej: se pide 5%, aprueba 4%)
- El comercial NO puede poner un margen inferior al aprobado por Daniel
- La cotizacion NO se bloquea para edicion mientras hay solicitud pendiente
- Si se aprueba al 2%: comercial puede poner 2% pero no menos
- La aprobacion de margen NO cambia el estado de la cotizacion (se registra en bitacora/log)

### 6.6 Reglas de Credito y Cartera

| Regla | Detalle |
|-------|---------|
| Asignacion de credito | Solo Laura Burgos puede asignar condiciones de credito |
| Cupo de credito | Se consulta via API a World Office (futuro). MVP: manual |
| Politica de bloqueo | Factura con mas de 30 dias adicionales al credito otorgado = bloqueo |
| Bloqueo de cartera | Solo Laura puede activar/desactivar. Motivo: cartera en mora |
| Efecto del bloqueo | Puede cotizar, NO puede generar pedido sin aprobacion |
| Aprobadores de desbloqueo | Laura Burgos (principal), Daniel Valbuena (backup) |
| Extra cupo | Si cotizacion excede cupo disponible. Aprobacion de Laura/Daniel |
| Sin bloqueo: cotizar OK | El comercial puede seguir cotizando aunque tenga bloqueo activo |

### 6.7 Reglas de Consecutivos

| Entidad | Inicio | Formato |
|---------|--------|---------|
| Leads | 100 | 100, 101, 102... |
| Cotizaciones | 30,000 | 30000, 30001, 30002... |
| Pedidos | Propio | Consecutivo numerico separado |
| Ordenes de Compra | Propio | Consecutivo numerico separado (diferente al pedido) |
| Proformas | Propio | Consecutivo numerico |

### 6.8 Reglas de IVA

- Valores permitidos: **0%, 5%, 19%** (lista cerrada, NO permitir otros valores)
- Se parametriza por producto al crearlo, pero es **editable por linea en cada cotizacion**
- En el PDF: mostrar solo el porcentaje de IVA por linea, no el valor monetario
- Algunos proyectos son exentos de IVA (se pone 0%)

### 6.9 Reglas de Datos de Despacho

- Son **obligatorios** para generar el pedido
- Una vez guardados con "datos bloqueados", **NADIE puede modificarlos**
- Cualquier cambio en despacho debe notificarse por chat interno (no modificar datos)
- Datos: nombre receptor, telefono, direccion, ciudad, horario, correo

### 6.10 Reglas de Duplicacion de Cotizaciones

- Se necesita cuando se ofrecen **multiples alternativas** al mismo cliente (ej: cotizacion en Lenovo, Dell, HP)
- Las cotizaciones duplicadas deben estar **vinculadas** para no inflar el pipeline (no contar 4 oportunidades cuando es 1 negocio)
- Se puede duplicar para renegociar con cambios menores

### 6.11 Reglas de Cierre

- Las cotizaciones se "pierden" (estado Perdido)
- Los pedidos se "anulan" (con motivo). NO se marcan como "perdidos"
- Para cerrar un pedido: debe estar 100% entregado + 100% facturado + documentacion completa
- Para software/licencias: verificar certificado con serial y vencimiento
- Pedidos incompletos NO se pueden cerrar

---

## 7. DOCUMENTOS GENERADOS EN EL PROCESO

| Documento | Generado por | Formato | Cuando | Contenido Clave |
|-----------|-------------|---------|--------|-----------------|
| **Cotizacion PDF** | Asesor comercial | PDF | Al exportar/enviar al cliente | Items en orden definido, precios, IVA%, condiciones comerciales. NO muestra asunto ni margen ni transporte |
| **Proforma PDF** | Laura Burgos (financiera) | PDF | Cuando cliente sin credito | Formato diferente a cotizacion, con consecutivo propio. Misma info de productos |
| **Orden de Compra PDF** | Andres (compras) | PDF | Al comprar a proveedor | Mayorista, numero de parte, cantidad, costo, IVA%, subtotal, total, fecha entrega |
| **Pedido** | Sistema (desde cotizacion) | Interno | Al aceptar el cliente | Datos comerciales bloqueados, datos de despacho, configuracion de parciales |
| **Factura electronica** | Estefania/Laura (en World Office) | Digital | Al facturar | Generada en sistema contable externo |
| **Informe de ventas** | Laura Burgos | Excel | Diariamente | Manual con macros (quieren automatizar) |
| **Informe de cartera** | Laura/Juan Angel | Excel | Semanalmente | Manual con macros y envio de correos |
| **Certificados de licencias** | Andres (al cerrar pedido) | Adjunto | Al cerrar pedido de software | Serial, vencimiento |
| **Chat interno** | Cualquier usuario | Mensajes | Permanente | Mensajes internos por pedido, con copia opcional por correo |

### Estructura del PDF de Cotizacion

- Encabezado con datos del cliente
- Tabla de productos: orden, numero de parte, nombre, cantidad, precio unitario, subtotal, IVA%, total
- Descripcion/informacion adicional por producto
- Condiciones comerciales (entrega, financieras, producto)
- Tiempo de entrega y garantia por producto
- Datos del comercial asignado
- **NO incluye:** asunto (interno), margen, costo, utilidad, transporte

### Carpetas de Documentos por Pedido

| Carpeta | Contenido |
|---------|-----------|
| **Documentos Cliente** | Orden de compra del cliente, contratos, polizas, cualquier documento del cliente |
| **Documentos Proveedor** | Cotizaciones del proveedor, facturas de compra, RUT, otros documentos del proveedor |

---

## 8. ESTADOS Y TRANSICIONES DE CADA ENTIDAD

### 8.1 Estados del Lead

```
[Chatbot/Web/WhatsApp/Manual]
    ↓
PENDIENTE DE INFORMACION (si registro incompleto)
    ↓
PENDIENTE DE ASIGNACION (si registro completo)
    ↓ (asignacion automatica round-robin)
PENDIENTE (asignado a asesor, en gestion)
    ↓
    ├── CONVERTIDO → Se genera cotizacion
    └── DESCARTADO (con razon de rechazo obligatoria de lista)
```

### 8.2 Estados de la Cotizacion (Vista Kanban - 4 columnas)

```
CREACION DE OFERTA (40%)
    ↓
NEGOCIACION (60%)
    ↓
RIESGO (70%)
    ↓
PENDIENTE DE ORDEN DE COMPRA (80%)
    ↓
    ├── GANADA (100%) → Se genera pedido. Cotizacion desaparece de activas
    └── PERDIDA → Se puede consultar historicamente
```

**IMPORTANTE:** Las aprobaciones de margen NO cambian el estado de la cotizacion. Se manejan por bitacora/notificaciones.

### 8.3 Estados del Pedido

**Estado General:**
```
CREADO/ABIERTO (activo, en proceso)
    ↓
    ├── CERRADO (todo completado)
    └── ANULADO (con motivo obligatorio)
```

**Sub-estados de Despacho:**
```
PENDIENTE DE DESPACHO
    ↓
    ├── DESPACHADO PARCIAL → ENTREGADO PARCIAL → (repetir) → DESPACHADO TOTAL → ENTREGADO TOTAL
    └── DESPACHADO TOTAL → ENTREGADO TOTAL
```

**Sub-estados de Facturacion:**
```
PENDIENTE POR FACTURAR
    ↓
    ├── FACTURADO PARCIAL → (repetir) → FACTURADO TOTAL
    └── FACTURADO TOTAL
```

### 8.4 Estados de la Orden de Compra

```
GENERADA/ABIERTA
    ↓
ENVIADA AL PROVEEDOR
    ↓
MERCANCIA INGRESADA (se registra factura del proveedor)
    ↓
CERRADA
```

### 8.5 Estados de Solicitudes de Aprobacion

```
PENDIENTE (enviada)
    ↓
    ├── APROBADA (con margen especifico si es de margen)
    └── RECHAZADA
```

Tipos de solicitudes:
1. Aprobacion de margen inferior al minimo → Va a Daniel
2. Solicitud de desbloqueo de cartera → Va a Laura/Daniel
3. Solicitud de extra cupo → Va a Laura/Daniel
4. Solicitud de verificacion de pago → Va a Laura
5. Solicitud de generacion de proforma → Va a Laura

---

## 9. CAMPOS Y DATOS POR ENTIDAD

### 9.1 Lead

| Campo | Tipo | Obligatorio | Editable | Notas |
|-------|------|:-----------:|:--------:|-------|
| Numero de lead | Auto (consecutivo desde 100) | Auto | No | |
| Razon social | Texto | Si | Si | Empresa del prospecto |
| NIT | Texto (Cedula/NIT/CE) | No* | Si | *Obligatorio al convertir a cotizacion |
| Contacto principal | Texto | Si | Si | Nombre del contacto |
| Telefono | Texto | Si | Si | |
| Correo electronico | Email | Si | Si | |
| Requerimiento | Texto libre | Si | Si | Lo que el cliente necesita |
| Canal de entrada | Lista | Auto | No | WhatsApp, web, manual |
| Fecha de creacion | Timestamp | Auto | No | |
| Asignado a | Lista (comerciales) | Auto | Si (solo Daniel) | Round-robin automatico |
| Estado | Lista | Auto/Manual | Si | Pendiente info, Pendiente asignacion, Pendiente, Convertido, Descartado |
| Razon de descarte | Lista desplegable | Si (solo si descartado) | No | |
| Observaciones | Chat/notas | No | Si | Trazabilidad con quien/cuando |
| Alertamiento | Auto | Auto | No | Dias sin gestion |

### 9.2 Cliente

| Campo | Tipo | Obligatorio | Quien lo llena | Notas |
|-------|------|:-----------:|:--------------:|-------|
| NIT | Texto | Si | Asesor | Tipo: Cedula, NIT, Cedula Extranjeria |
| Codigo verificacion | Auto | Auto | Sistema | |
| Razon social | Texto | Si | Asesor | |
| Actividad economica / Sector | Lista | Si | Asesor | Educacion, manufactura, seguros, etc. |
| Direccion | Texto | Si | Asesor | |
| Ciudad | Lista/Texto | Si | Asesor | |
| Asesor asignado | Lista | Si | Daniel | Predeterminado |
| Moneda predeterminada | Lista (COP/USD) | Si | Laura/Daniel | |
| Condiciones de pago | Lista | Si | Laura Burgos (exclusivo) | Anticipado, 30, 45, 60 dias, Leasing |
| Via de contacto | Lista | Si | Asesor/Daniel | Solo en creacion, NO editable despues. Google, referido, campana, existente |
| Categoria | Lista | Si | Daniel (exclusivo) | Triple A, Doble A, B, C (analisis Pareto) |
| Cupo asignado | Numero | No | Laura/Juan | Futuro via API World Office |
| Cupo disponible | Calculado | Auto | API | Cupo asignado - cartera pendiente |
| Bloqueo de cartera | Boolean | No | Laura Burgos | Con motivo: "Cartera en mora" |
| Email facturacion | Email | No* | Asesor | *Obligatorio al generar pedido |
| Contactos de tesoreria | Multi-contacto | No | Laura Burgos | Para cobro de cartera |

### 9.3 Contacto del Cliente

Una razon social puede tener **multiples contactos** (hasta 57 compradores en casos extremos).

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| Nombre | Texto | Si | |
| Cargo | Texto | Si | |
| Ciudad | Texto | Si | |
| Telefono | Texto | Si | |
| Correo electronico | Email | Si | Sin estos 5 datos, el sistema no permite crear el contacto |

### 9.4 Cotizacion (Encabezado)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| Numero de cotizacion | Auto (desde 30000) | Auto | |
| Cliente | Referencia | Si | Vinculado a razon social |
| Contacto | Referencia | Si | Destinatario de la cotizacion |
| Asunto | Texto | Si | Descripcion interna. NO sale en PDF |
| Asesor asignado | Lista | Auto | Predeterminado del cliente |
| Etapa/Probabilidad | Lista | Si | Creacion oferta, Negociacion, Riesgo, Pendiente OC |
| Vigencia | Numero (dias) | Si | Default: 5 dias calendario |
| Mes de cierre | Lista | Si | |
| Semana de cierre | Lista | Si | |
| Ano de cierre | Lista | Si | |
| Mes de facturacion | Lista | Si | |
| Ano de facturacion | Lista | Si | |
| Incluye transporte | Boolean | No | INTERNO, no visible al cliente |
| Valor transporte | Numero (libre) | No | INTERNO, editable |
| TRM del dia | Numero | Auto | Del dia de la cotizacion |
| Condiciones comerciales | Texto | No | Entrega, financieras, producto |

### 9.5 Producto en Cotizacion (Linea)

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| Orden de impresion | Numero | Si | Posicion en el PDF |
| Numero de parte | Texto | Si | |
| Vertical/Categoria | Lista | Si | Hardware, Software, Servicios, Accesorios |
| Subcategoria | Lista | No | |
| Marca | Texto | Si | |
| Nombre/Descripcion | Texto | Si | |
| Cantidad | Numero | Si | |
| Costo unitario | Numero | Si | |
| Moneda del costo | Lista (USD/COP) | Si | |
| TRM aplicada | Numero | Auto | Si costo en USD |
| Costo en COP | Calculado | Auto | Costo x TRM (si USD) |
| Margen % | Numero | Si | Validado contra minimo |
| Precio de venta | Calculado | Auto | Costo / (1 - Margen%) |
| IVA | Lista (0%, 5%, 19%) | Si | Editable por linea |
| Proveedor/Mayorista | Lista | Si | Puede ser "no creado" |
| Tiempo de entrega | Texto | Si | Editable |
| Garantia | Texto | Si | Editable |
| Observaciones | Texto libre | No | Links, info proveedor, notas |
| Menor utilidad autorizada | % (auto) | Auto | Aparece si gerencia aprobo margen inferior |

### 9.6 Pedido

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| Numero de pedido | Auto (consecutivo) | Auto | |
| Cotizacion origen | Referencia | Auto | Link navegable a la cotizacion |
| Razon social | Referencia | Auto | Del cliente |
| Contacto | Referencia | Auto | Del cliente |
| Asesor asignado | Referencia | Auto | De la cotizacion |
| Asunto | Texto | Auto | Arrastrado de la cotizacion |
| Condicion de pago | Referencia | Auto | Del cliente |
| Productos | Lista | Auto | Items seleccionados de la cotizacion |
| Nombre receptor | Texto | Si | **Bloqueado una vez guardado** |
| Telefono receptor | Texto | Si | **Bloqueado** |
| Direccion entrega | Texto | Si | **Bloqueado** |
| Ciudad entrega | Texto | Si | **Bloqueado** |
| Horario entrega | Texto | Si | **Bloqueado** |
| Correo contacto | Email | Si | **Bloqueado** |
| Email facturacion | Email | Si | Obligatorio (alerta si falta) |
| Permite despacho parcial | Boolean | Si | Checkbox |
| Permite facturacion parcial | Boolean | Si | Checkbox |
| Facturacion sin confirmacion entrega | Boolean | Si | Checkbox (aplica envios nacionales) |
| TRM del pedido | Numero | Obligatorio si USD | Se actualiza al dia del pedido |
| Documentos cliente (carpeta) | Archivos | No | OC, contratos, polizas |
| Documentos proveedor (carpeta) | Archivos | No | Cotizaciones, facturas, RUT |
| Chat interno | Mensajes | No | Con @menciones y copia por correo |

### 9.7 Orden de Compra

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| Numero de OC | Auto (consecutivo propio) | Auto | |
| Pedido relacionado | Referencia | Auto | Link al pedido |
| Cotizacion origen | Referencia | Auto | Trazabilidad completa |
| Proveedor/Mayorista | Lista | Si | Puede ser diferente al sugerido |
| NIT proveedor | Texto | Si | |
| Razon social proveedor | Texto | Si | |
| Ejecutivo del proveedor | Texto | Si | |
| Productos seleccionados | Lista | Si | Con cantidades |
| Cantidad por producto | Numero | Si | No puede exceder la del pedido |
| Costo de compra negociado | Numero | Si | |
| Moneda | Lista (COP/USD) | Si | |
| IVA por producto | Lista (0%, 5%, 19%) | Si | |
| Garantia | Texto | Si | |
| Fecha estimada de entrega | Fecha | Si | |
| Numero factura proveedor | Texto | No* | *Se diligencia al recibir mercancia |
| Cantidad recibida | Numero | No* | *Se diligencia al recibir mercancia |
| Fecha de recepcion | Fecha | No* | *Se diligencia al recibir mercancia |

### 9.8 Proveedor

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| NIT | Texto | Si | |
| Razon social | Texto | Si | |
| Telefono | Texto | Si | |
| Direccion | Texto | Si | |
| (Andres confirma: "no necesito mas informacion") | | | |

### 9.9 Despacho/Logistica

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| Transportadora | Texto | Si | Envia, Servientrega, etc. |
| Numero de guia | Texto | Si | |
| Fecha de despacho | Fecha | Si | |
| Productos despachados | Lista | Si | Cuales y cuantos |
| Tipo: Parcial/Total | Boolean | Si | |
| Confirmacion de entrega | Boolean | Si | |
| Fecha de entrega | Fecha | Si | Cuando cliente confirma |

### 9.10 Factura

| Campo | Tipo | Obligatorio | Notas |
|-------|------|:-----------:|-------|
| Numero de factura | Texto | Si | De World Office |
| Fecha de facturacion | Fecha | Si | |
| Valor facturado | Numero | Si | |
| Productos facturados | Lista | Si | Cuales y cuantos |
| Tipo: Parcial/Total | Boolean | Si | |
| Validacion duplicidad | Auto | Auto | Si factura ya esta asociada a otro pedido → alerta |

---

## 10. CANALES DE CAPTACION DE LEADS

| Canal | Estado Actual | Deseado |
|-------|---------------|---------|
| **WhatsApp (chatbot)** | Chatbot caido (proveedor dejo de prestar servicio) | Chatbot con Meta API, captura automatica de datos, creacion de lead, asignacion automatica |
| **Pagina web (formulario contacto)** | Envia info por correo, sin integracion | Fase 1: via bot WhatsApp (boton en web abre WhatsApp). Fase 2: API directa formulario → plataforma |
| **Creacion manual** | Funciona en CRM actual | Mantener: asesor crea lead manualmente |
| **Google / Campanas** | Sin tracking | Tracking de efectividad por canal |
| **Referidos** | Sin tracking | Registrar como via de contacto |
| **Clientes existentes (recompra)** | Sin diferenciacion | Identificar como canal separado |

### Datos que Captura el Chatbot de WhatsApp

1. Template de bienvenida
2. Opciones: Solicitar cotizacion, Consultar estado de pedido, Otro motivo
3. Si "Solicitar cotizacion":
   - Nombre del contacto
   - Empresa/Razon social
   - Telefono
   - Correo electronico
   - Requerimiento especifico
4. Se crea como lead en la plataforma
5. Se asigna automaticamente a un comercial

---

## 11. AUTOMATIZACIONES Y NOTIFICACIONES

### 11.1 Automatizaciones del Sistema

| # | Automatizacion | Trigger | Accion |
|---|---------------|---------|--------|
| 1 | Asignacion de leads (round-robin) | Nuevo lead registrado | Asignar al siguiente comercial disponible (max 5 pendientes) |
| 2 | Reasignacion al desactivar asesor | Asesor desactivado | Sus leads y cotizaciones vuelven a la "bolsa" y se reasignan a los restantes |
| 3 | Seguimiento de cotizaciones | Cada X dias (config: 8 dias) sin respuesta | Enviar template WhatsApp con link a cotizacion PDF |
| 4 | Interpretacion de respuestas (IA) | Cliente responde por WhatsApp | Clasificar respuesta, generar alerta al comercial, actualizar % avance |
| 5 | Validacion de margen | Comercial ingresa margen | Comparar contra minimo por categoria + credito |
| 6 | Alerta de margen bajo | Margen < minimo | Solicitud de aprobacion automatica a Daniel |
| 7 | Alerta de cartera bloqueada | Comercial intenta generar pedido con cliente bloqueado | Mostrar aviso + solicitar aprobacion |
| 8 | Alerta de extra cupo | Cotizacion excede cupo disponible | Disparar solicitud automatica |
| 9 | Alerta de email faltante | Generar pedido sin email de facturacion | Bloquear y mostrar alerta |
| 10 | Bloqueo de datos de despacho | Datos guardados | Inmutabilidad activada |
| 11 | Deteccion de pedidos facturables | Reglas de despacho/entrega cumplidas | Aparecen en lista de "pendientes por facturar" |
| 12 | Deteccion de pedidos cerrables | Todo completado | Aparecen en lista de "pendientes por cerrar" |
| 13 | TRM automatica | Diariamente | Consultar servicio publico (con fallback manual) |
| 14 | Proforma disponible | Laura genera proforma | Notificacion automatica al comercial |

### 11.2 Notificaciones

| Evento | Destinatario | Canal |
|--------|-------------|-------|
| Nuevo lead asignado | Asesor comercial | Notificacion interna (campanita) |
| Leads pendientes por atender | Asesor | Notificacion interna |
| Seguimiento de cotizacion | Cliente | WhatsApp (template automatico) |
| Respuesta de cliente analizada | Asesor | Notificacion interna |
| Margen por debajo del minimo | Daniel Valbuena | Solicitud de aprobacion |
| Cliente bloqueado | Asesor (aviso visible) | Banner/alerta en pantalla |
| Solicitud de desbloqueo | Laura/Daniel | Solicitud de aprobacion |
| Solicitud de extra cupo | Laura/Daniel | Solicitud de aprobacion |
| Solicitud de proforma | Laura Burgos | Solicitud |
| Proforma lista | Asesor | Notificacion interna |
| Solicitud verificacion de pago | Laura Burgos | Solicitud |
| Despacho realizado | Equipo (chat interno) | Chat interno + correo |
| Info de transporte (guia) | Equipo | Chat interno |
| Cotizacion proxima a vencer | Asesor | Notificacion 3 dias antes |
| Cartera - recordatorio | Cliente | Correo/WhatsApp |
| Cartera - riesgo bajo (0-5 dias) | Cliente | Correo/WhatsApp |
| Cartera - riesgo medio (5-15 dias) | Cliente | Correo/WhatsApp |
| Cartera - riesgo alto (>15 dias) | Cliente | Correo/WhatsApp |

### 11.3 Notificaciones del Chat Interno

Cada pedido tiene un sistema de chat interno donde:
- Se pueden enviar mensajes entre areas
- Se pueden @mencionar usuarios especificos
- Los mensajes quedan guardados con trazabilidad (quien, cuando, que)
- Los mensajes NO se pueden eliminar (trazabilidad)
- Se puede enviar copia por correo electronico

---

## 12. INTEGRACIONES CON SISTEMAS EXTERNOS

| Sistema | Tipo de Integracion | Datos | Fase |
|---------|---------------------|-------|------|
| **World Office** | API REST | Cupo de credito asignado/disponible, facturas emitidas, cuentas por cobrar | Fase 2 (servidor on-premise en bodega) |
| **WhatsApp / Meta API** | API oficial | Chatbot, seguimiento automatico, templates, embedded sign-up | Fase 1 |
| **TRM (servicio publico)** | Consulta web/API | Tasa representativa del mercado diaria | Fase 1 (con fallback manual) |
| **Correo electronico** | SMTP | Notificaciones internas y externas, copia de chats | Fase 1 |
| **Pagina web** | API (formulario) | Datos del formulario "Contactenos" | Fase 2 |

### Nota sobre World Office

- Es una **aplicacion de escritorio para Windows** (on-premise)
- El servidor esta en la **bodega/cocina** de la empresa
- Para integrar se necesita: exponer APIs publicamente, configurar firewall/DNS
- Posible migracion a la nube en el futuro
- **Decision MVP: se lanza SIN esta integracion**

---

## 13. PAIN POINTS DE LA PLATAFORMA ACTUAL

### Criticos (Afectan operacion diaria)

| # | Pain Point | Impacto | Fuente |
|---|-----------|---------|--------|
| 1 | **Seguimiento manual de cotizaciones** | Se pierden negocios por falta de seguimiento oportuno. "Muchas veces llegamos tarde" | Levantamiento Reqs, Kick Off |
| 2 | **Modulo de leads roto** | Daniel tiene que adivinar que esta pendiente | Odoo |
| 3 | **Chatbox deshabilitado** | No hay captura automatica de leads | Odoo |
| 4 | **Proveedor borro 5 anos de datos** | Perdida total de adjuntos historicos | Odoo |
| 5 | **Panel de compras invertido** | Muestra OC generadas en vez de pendientes | Odoo |
| 6 | **Aprobaciones rotas** | Aparecen pendientes despues de aprobadas | Kick Off |
| 7 | **Filtros no funcionan** | Todo el mundo trabaja con "filtro abierto" | Kick Off |
| 8 | **Informes 100% manuales** | Laura genera informe diario y semanal en Excel manualmente | Kick Off |
| 9 | **Fuga de datos** | Exempleada exporto toda la base de clientes | CheckPoint |

### Importantes (Reducen eficiencia)

| # | Pain Point | Impacto | Fuente |
|---|-----------|---------|--------|
| 10 | **TRM manual diaria** | Laura tiene que ingresar manualmente cada manana | Multiple |
| 11 | **PDF basico** | "Exageradamente clasico", no refleja imagen corporativa | Demo, Kick Off |
| 12 | **Interfaz sobrecargada** | Pestanas innecesarias, campos irrelevantes, "visual tenaz en portatil" | Kick Off, Reqs |
| 13 | **IVA confuso** | Clientes no entienden subtotales con IVA por linea | Kick Off |
| 14 | **Margen no considera credito** | No cruza categoria x dias de credito | Kick Off |
| 15 | **Datos de despacho modificables** | Causaba errores de envio | Kick Off |
| 16 | **Correos que no llegan** | Problemas de integracion con Gmail | Odoo |
| 17 | **Observaciones sin trazabilidad** | No registra quien, cuando | Odoo |
| 18 | **Transporte no contemplado en margen** | Comerciales no lo tienen en cuenta, "vendieron una silla y creen que cabe en moto" | Reqs |
| 19 | **Sin control de base de datos** | No tienen acceso a su propia BD | Odoo |
| 20 | **Sin documentacion tecnica** | Proveedor no entrego documentacion | Odoo |

---

## 14. PUNTOS DE DECISION EN EL FLUJO

| # | Punto de Decision | Quien Decide | Opciones | Consecuencia |
|---|-------------------|-------------|----------|--------------|
| 1 | Lead valido o basura | Asesor comercial | Convertir / Descartar | Continua flujo o se marca descartado con motivo |
| 2 | Margen por debajo del minimo | Sistema → Daniel | Solicitar aprobacion / Aplicar minimo | Se envia solicitud o se auto-aplica minimo |
| 3 | Daniel evalua margen | Daniel | Aprobar (con %) / Rechazar | Comercial usa margen aprobado o ajusta |
| 4 | Tipo de pago del cliente | Laura / Sistema | Credito / Anticipado | Define si necesita proforma o va directo |
| 5 | Cliente bloqueado por cartera | Laura / Daniel | Aprobar desbloqueo / Rechazar | Puede generar pedido o queda bloqueado |
| 6 | Extra cupo requerido | Laura / Daniel | Aprobar / Rechazar | Puede generar pedido o no |
| 7 | Verificacion de pago (anticipado) | Laura | Pago verificado / No verificado | Se habilita o no la generacion de pedido |
| 8 | Items del pedido | Asesor | Todos / Seleccion parcial | Solo los seleccionados pasan al pedido |
| 9 | Despacho parcial permitido | Asesor (al crear pedido) | SI / NO | Afecta flujo de logistica y facturacion |
| 10 | Facturacion parcial permitida | Asesor (al crear pedido) | SI / NO | Afecta cuando aparece para facturar |
| 11 | Sin confirmacion de entrega | Asesor (al crear pedido) | SI / NO | Facturar al despachar vs confirmar entrega |
| 12 | Proveedor para la OC | Andres (compras) | Sugerido / Otro | Puede cambiar proveedor |
| 13 | Cerrar pedido | Andres | Cerrar / No cerrar | Requiere 100% completado |
| 14 | Anular pedido | Gerencia | Anular (con motivo) / Mantener | Pedido anulado, diferente a "perdido" |
| 15 | Duplicar cotizacion | Asesor | Duplicar / No | Para multiples alternativas vinculadas |
| 16 | Medio de envio (Bogota) | Logistica | Moto (gratis) / Minivan ($) | Depende de tamano de mercancia |
| 17 | Respuesta del cliente (seguimiento) | IA + Asesor | Multiple: en estudio, modificacion, OC, perdida, sin respuesta | Cada opcion tiene accion diferente |

---

## 15. LOGISTICA Y OPERACIONES

### 15.1 Entregas en Bogota

| Tipo | Condicion | Costo | Transportista |
|------|-----------|-------|---------------|
| Moto | Paquete pequeno que cabe en moto (5-7 cajas max) | Sin costo | Mensajeros propios |
| Minivan | Mercancia sobredimensionada | Con costo (tercero) | Tercero contratado |

### 15.2 Despachos Nacionales

| Transportadora | Prioridad | Notas |
|----------------|-----------|-------|
| Envia | Primera opcion | |
| Servientrega | Alternativa | |
| InterRapidisimo | Alternativa | |
| Coordinadora | Alternativa | |
| Otras | Segun necesidad | |

### 15.3 Manejo del Transporte en Cotizacion

El transporte es un tema complejo con multiples variantes:

1. **Incluido en el costo del producto** (oculto al cliente): El comercial agrega el costo del transporte al precio del producto. El cliente no lo ve como item separado.

2. **Como item separado**: Se agrega una linea en la cotizacion llamada "Transporte" con un valor.

3. **Campo estimado interno**: El sistema registra un valor estimado del transporte para proteger el margen real, sin que el cliente lo vea.

**Decision actual:** Celda libre donde el comercial pone manualmente el valor estimado. Se dejo como pendiente definir integracion con APIs de couriers para el futuro.

### 15.4 Flujo Despacho → Entrega

```
MERCANCIA DISPONIBLE
    ↓
    ├── Entrega inmediata: proveedor despacha directo al cliente
    └── Mercancia en transito: primero llega a bodega, luego se despacha
            ↓
        PREPARAR DESPACHO
            ↓
            ├── Bogota: moto o minivan
            └── Nacional: transportadora (Envia, Servientrega, etc.)
                    ↓
                REGISTRO: transportadora, guia, fecha
                    ↓
                NOTIFICACION al equipo por chat interno
                    ↓
                SEGUIMIENTO de entrega
                    ↓
                CONFIRMACION de entrega por el cliente
```

### 15.5 Regla de Separacion Logistica-Cliente

**CRITICO:** El area logistica **NO debe tener interaccion directa** con el cliente final. Todo contacto del cliente debe canalizarse a traves de su ejecutivo comercial asignado. Si un cliente consulta estado de pedido por WhatsApp, el sistema lo dirige a su comercial, no a logistica.

---

## 16. DASHBOARD Y REPORTES

### 16.1 Metricas Requeridas (basadas en Power BI actual de Daniel)

| Categoria | Metrica | Filtros |
|-----------|---------|---------|
| **Ventas** | Facturado por comercial | Mes, semana, ano |
| **Ventas** | Pendiente por facturar | Mes, comercial |
| **Pipeline** | Forecast (proyeccion) | Mes, trimestre |
| **Metas** | Meta mensual y trimestral | Comercial, periodo |
| **Metas** | % cumplimiento de meta | Comercial, periodo |
| **Cotizaciones** | Cotizaciones por estado | Semana, mes, comercial |
| **Comercial** | % participacion por ejecutivo | Mes |
| **Clientes** | Numero de clientes por comercial | Activos, inactivos |
| **Clientes** | Clientes por sector/vertical | Educacion, manufactura, etc. |
| **Clientes** | Clientes nuevos | Periodo |
| **Finanzas** | Utilidad acumulada | Periodo |
| **Pipeline** | Mes de cierre, semana de cierre | Comercial |
| **Pipeline** | Mes de facturacion | Comercial |
| **Eficiencia** | Efectividad por canal de captacion | Canal |

### 16.2 Informes Actuales (Manual en Excel)

| Informe | Frecuencia | Responsable | Campos |
|---------|-----------|-------------|--------|
| Informe de ventas | Diario | Laura Burgos | Subtotal venta, costo, utilidad, margen, mes cierre, semana cierre, mes facturacion, probabilidad, asunto |
| Informe de cartera | Semanal | Laura/Juan | Facturas pendientes, dias vencidos, nivel de riesgo |
| Notificaciones de cartera | Semanal | Via macros Excel | Correos automaticos por nivel de riesgo |

### 16.3 Restricciones de Exportacion

- Los comerciales **NO deben poder exportar** informacion de la base de datos
- No debe existir boton de exportar para roles comerciales
- Se solicito bloquear **copiar y pegar** desde las tablas (limitaciones tecnicas reconocidas)
- Motivacion: incidente previo donde exempleada exporto toda la base de clientes

---

## 17. WHATSAPP Y COMUNICACIONES

### 17.1 Arquitectura de WhatsApp

| Componente | Detalle |
|------------|---------|
| **Numero principal** | El de la pagina web (termina en 2161), conectado a Meta API |
| **Bot/Chatbot** | Flujo: bienvenida → opciones (cotizacion, estado pedido, otro) → captura de datos |
| **Numeros individuales** | Comerciales integran su WhatsApp Business personal via Embedded Sign-Up |
| **Modulo web** | Interfaz tipo WhatsApp en la plataforma web |
| **Mobile** | 100% responsive (Chrome en celular, NO app nativa) |

### 17.2 Flujo del Chatbot

```
CLIENTE ESCRIBE AL NUMERO PRINCIPAL
    ↓
TEMPLATE DE BIENVENIDA
    ↓
MENU DE OPCIONES:
    ├── 1. Solicitar cotizacion
    │       → Captura: nombre, empresa, telefono, correo, requerimiento
    │       → Crea lead en plataforma
    │       → Asigna a comercial (round-robin)
    │
    ├── 2. Consultar estado de pedido
    │       → Identifica comercial asignado
    │       → Redirige consulta al comercial (NO a logistica)
    │
    └── 3. Otro motivo (facturacion, cartera, etc.)
            → Genera notificacion interna al area correspondiente
            → El area responde desde su WhatsApp personal
```

### 17.3 Seguimiento Automatico por WhatsApp

| Aspecto | Detalle |
|---------|---------|
| Periodicidad | Configurable (ej: cada 8 dias) |
| Trigger | Cotizacion sin respuesta por X dias |
| Medio | Template aprobado por Meta + link a PDF (NO adjunto directo) |
| Interpretacion | IA analiza respuesta del cliente y clasifica |
| Acciones post-respuesta | Notifica al comercial, actualiza estado, agenda siguiente seguimiento |

### 17.4 Ventana de 24 Horas (Meta API)

- **Opt-in:** Cliente escribe primero → ventana de 24 horas de comunicacion libre
- **Despues de 24h:** Solo se pueden enviar **templates aprobados por Meta** para reiniciar conversacion
- Los templates de seguimiento deben estar aprobados previamente

### 17.5 Embedded Sign-Up (Numeros Individuales)

- Cada comercial puede vincular su WhatsApp Business personal
- Las conversaciones del celular se sincronizan con el modulo web
- El comercial sigue usando su celular normalmente
- **NO se pueden transferir conversaciones** entre el numero principal y los personales
- El administrador ve TODAS las conversaciones; cada comercial solo las suyas

### 17.6 Limitaciones

- **NO se pueden enviar PDFs como adjunto** por WhatsApp API
- Se envia un **template con link publico** donde el cliente descarga el documento
- Si el cliente contacta via link al WhatsApp personal del comercial, **se pierde trazabilidad** en la plataforma

---

## 18. GLOSARIO DE TERMINOS DEL NEGOCIO

| Termino | Definicion |
|---------|------------|
| **Lead** | Prospecto comercial que ha mostrado interes. Se crea al contactar por primera vez. |
| **Cotizacion** | Oferta formal con productos, precios y condiciones que se envia al cliente. |
| **Proforma** | Documento similar a la cotizacion pero emitido por financiera para clientes sin credito que deben pagar anticipadamente. |
| **Pedido** | Se genera cuando el cliente acepta la cotizacion. Contiene info comercial (inmutable) + datos de despacho + configuracion de parciales. |
| **Orden de Compra (OC)** | Documento que PROSUMINISTROS envia a su proveedor/mayorista para comprar los productos del pedido. |
| **TRM** | Tasa Representativa del Mercado. Tasa de cambio USD/COP del dia, usada para convertir precios. |
| **Margen** | Porcentaje de utilidad: `1 - (Costo / Precio Venta)`. Tiene minimos configurables por categoria y credito. |
| **Cupo de credito** | Monto maximo de facturacion pendiente que un cliente puede tener. Asignado - Cartera pendiente = Disponible. |
| **Extra cupo** | Autorizacion especial para exceder el cupo de credito disponible. |
| **Bloqueo de cartera** | Restriccion financiera que impide generar pedidos cuando un cliente tiene facturas vencidas. |
| **Vertical** | Categoria del producto: Hardware, Software, Servicios, Accesorios. |
| **Sector** | Actividad economica del cliente: Educacion, Manufactura, Seguros, etc. |
| **Categoria del cliente** | Clasificacion Pareto: Triple A, Doble A, B, C. Determinada por Daniel. |
| **Via de contacto** | Como llego el cliente: Google, referido, campana, existente, gestion comercial. |
| **Consecutivo** | Numeracion automatica secuencial. Leads desde 100, cotizaciones desde 30,000. |
| **World Office** | Sistema contable on-premise usado para facturacion electronica y gestion financiera. |
| **Despacho parcial** | Enviar solo parte de la mercancia del pedido. Debe estar habilitado en la configuracion. |
| **Facturacion parcial** | Facturar solo parte del pedido. Depende de la configuracion de parciales y despacho. |
| **Analisis Pareto** | Metodo 80/20 para clasificar clientes segun su aporte al negocio. Daniel lo usa para asignar categorias. |
| **Embedded Sign-Up** | Mecanismo de Meta API para vincular numeros de WhatsApp Business individuales a la plataforma. |
| **Template (WhatsApp)** | Mensaje predefinido aprobado por Meta, requerido para enviar mensajes fuera de la ventana de 24 horas. |
| **ICA** | Impuesto de Industria y Comercio (Colombia). Se captura como costo real en facturacion. |
| **4x1000** | Gravamen a los Movimientos Financieros (Colombia). Se captura como costo real en facturacion. |

---

## APENDICE A: TRAZABILIDAD COMPLETA DEL FLUJO

```
LEAD #100
    ↓ (asesor convierte)
CLIENTE (razon social + N contactos)
    ↓ (asesor crea cotizacion)
COTIZACION #30000
    ↓ (aprobacion margen si aplica)
    ↓ (proforma si cliente sin credito)
    ↓ (aprobacion cartera/cupo si aplica)
    ↓ (cliente acepta)
PEDIDO (consecutivo propio)
    ↓ (Andres genera OC)
ORDEN DE COMPRA (consecutivo propio) × N proveedores
    ↓ (proveedor entrega mercancia)
INGRESO DE MERCANCIA
    ↓ (logistica despacha)
DESPACHO (parcial/total)
    ↓ (cliente confirma recepcion)
ENTREGA (parcial/total)
    ↓ (financiera factura)
FACTURA (parcial/total) en World Office
    ↓ (cliente paga)
RECAUDO
    ↓ (todo completado)
CIERRE DEL PEDIDO
```

Cada entidad debe poder **navegar** a las anteriores y siguientes en la cadena para garantizar trazabilidad completa.

---

## APENDICE B: RESUMEN DE DECISIONES DE ALCANCE (MVP)

| Funcionalidad | Fase 1 (MVP) | Fase 2 |
|---------------|:---:|:---:|
| Leads (creacion, asignacion, gestion) | SI | |
| Cotizaciones (CRUD, margenes, PDF) | SI | |
| Pedidos (desde cotizacion, config parciales) | SI | |
| Ordenes de compra | SI | |
| Despacho/Logistica | SI | |
| Facturacion (registro) | SI | |
| WhatsApp Chatbot (Meta API) | SI | |
| WhatsApp Embedded Sign-Up | SI | |
| Seguimiento automatico por WhatsApp | SI | |
| Roles y permisos (8 roles) | SI | |
| Dashboard basico | SI | |
| TRM automatica + fallback manual | SI | |
| Bloqueo de cartera (manual) | SI | |
| Proformas | SI | |
| Integracion World Office (cupo, cartera) | | SI |
| Integracion formulario web | | SI |
| Power BI / Reporteria avanzada | | SI |
| Modulo de garantias y servicios | | SI |
| Lectura de XML facturas electronicas | | SI |
| Tareas automaticas por categoria cliente | | SI |

---

**Documento elaborado por:** Business Analyst Agent
**Basado en:** 8 transcripciones de reuniones (477,504 caracteres de texto fuente)
**Fecha:** 19 de febrero de 2026
