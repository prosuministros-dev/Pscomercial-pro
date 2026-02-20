# CONSOLIDADO COMPLETO - DOCUMENTOS GENERALES DE NEGOCIO

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha de consolidacion:** 2026-02-19
**Total archivos fuente:** 18 archivos .md en `Documentos Generales/`

---

## TABLA DE CONTENIDO

1. [Datos Maestros y Catalogos](#1-datos-maestros-y-catalogos)
2. [Gestion de Clientes](#2-gestion-de-clientes)
3. [Gestion de Productos](#3-gestion-de-productos)
4. [Modulo Leads](#4-modulo-leads)
5. [Modulo Cotizaciones](#5-modulo-cotizaciones)
6. [Modulo Pedidos - Panel Principal](#6-modulo-pedidos---panel-principal)
7. [Modulo Pedidos - Informacion General (Pedidos 1)](#7-modulo-pedidos---informacion-general-pedidos-1)
8. [Modulo Pedidos - Despacho y Logistica (Pedidos 2)](#8-modulo-pedidos---despacho-y-logistica-pedidos-2)
9. [Modulo Pedidos - Requerimientos Funcionales](#9-modulo-pedidos---requerimientos-funcionales)
10. [Flujos de Facturacion en Pedidos](#10-flujos-de-facturacion-en-pedidos)
11. [Tablero Operativo de Seguimiento (PRD)](#11-tablero-operativo-de-seguimiento-prd)
12. [Cuadro Operativo SharePoint (AS-IS)](#12-cuadro-operativo-sharepoint-as-is)
13. [Modulo Solicitud de Proforma](#13-modulo-solicitud-de-proforma)
14. [Roles y Permisos Consolidados](#14-roles-y-permisos-consolidados)
15. [Diseno Actual Pedidos en Odoo (Referencia)](#15-diseno-actual-pedidos-en-odoo-referencia)

---

## 1. DATOS MAESTROS Y CATALOGOS

**Fuentes:** `PROCESO COMERCIAL - Formas de pago.md`, `PROCESO COMERCIAL - Moneda.md`, `PROCESO COMERCIAL - Via de contacto.md`, `PROCESO COMERCIAL - Vertical.md`, `PROCESO COMERCIAL - Margenes minimos por vertical.md`

### 1.1 Formas de Pago

| Forma de Pago |
|---|
| ANTICIPADO |
| CONTRA ENTREGA |
| CREDITO 8 DIAS |
| CREDITO 15 DIAS |
| CREDITO 30 DIAS |
| CREDITO 45 DIAS |
| CREDITO 60 DIAS |

**Regla clave**: Los clientes creados por comerciales quedan con forma de pago **"ANTICIPADO"** por defecto. Solo Financiera o Gerencia General pueden cambiar la forma de pago.

### 1.2 Monedas

| Tipo de Moneda |
|---|
| PESOS COLOMBIANOS (COP) |
| DOLARES (USD) |

### 1.3 Vias de Contacto (Canales de Lead)

| Canal |
|---|
| ESTRATEGIA ASUS |
| ESTRATEGIA DELL |
| ESTRATEGIA GOOGLE |
| ESTRATEGIA LENOVO |
| ESTRATEGIA TELEMERCADEO |
| EXISTENTE |
| GESTION COMERCIAL |
| REFERENCIADO |

### 1.4 Verticales

| Vertical |
|---|
| ACCESORIOS |
| HARDWARE |
| OTROS |
| SERVICIOS |
| SOFTWARE |

### 1.5 Margenes Minimos por Vertical y Forma de Pago

| Forma de Pago | Accesorios | Hardware | Otros | Servicios | Software |
|---|:---:|:---:|:---:|:---:|:---:|
| ANTICIPADO | 7% | 7% | 7% | 7% | 5% |
| CONTRA ENTREGA | 7% | 7% | 7% | 7% | 5% |
| CREDITO 8 DIAS | 7% | 7% | 7% | 7% | 5% |
| CREDITO 15 DIAS | 7% | 7% | 7% | 7% | 5% |
| CREDITO 30 DIAS | 7% | 7% | 7% | 7% | 5% |
| CREDITO 45 DIAS | 9% | 9% | 9% | 9% | 7% |
| CREDITO 60 DIAS | 11% | 11% | 11% | 11% | 9% |

**Formula de margen**: `Margen (%) = 1 - (Total costo / Total venta)`

### 1.6 Impuestos Aplicables

| IVA |
|---|
| 0% |
| 5% |
| 19% |

---

## 2. GESTION DE CLIENTES

**Fuente:** `PROCESO COMERCIAL - Creacion de cliente.md`

### 2.1 Campos y Matriz de Permisos

| Campo | Obligatorio | Gerencia General | Gerencia Comercial | Comerciales | Compras | Aux. Financiera | Aux. Administrativa | Jefe Bodega | Aux. Bodega |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| NIT con digito verificacion | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Razon social | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Direccion | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Ciudad | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Departamento | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Telefono principal | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Correo de facturacion | NO | NO | NO | NO | NO | Crear/Modificar | NO | NO | NO |
| Forma de pago | NO | Crear/Modificar | NO | NO | NO | Crear/Modificar | NO | NO | NO |
| Comercial asignado | SI | Modificar | Modificar | NO | NO | NO | NO | NO | NO |

### 2.2 Contactos del Cliente (multiples contactos por cliente)

| Campo | Obligatorio | Gerencia General | Gerencia Comercial | Comerciales | Resto |
|---|:---:|:---:|:---:|:---:|:---:|
| Nombre | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Telefono | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |
| Correo electronico | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO |

---

## 3. GESTION DE PRODUCTOS

**Fuente:** `PROCESO COMERCIAL - Creacion de producto.md`

### 3.1 Campos y Matriz de Permisos

| Campo | Obligatorio | Gerencia General | Gerencia Comercial | Comerciales | Compras | Aux. Financiera | Aux. Administrativa | Jefe Bodega | Aux. Bodega |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Numero de parte | SI | Crear/Modificar | Crear | Crear | NO | NO | NO | NO | NO |
| Nombre del producto | SI | Crear/Modificar | Crear | Crear | NO | NO | NO | NO | NO |
| Vertical | SI | Crear/Modificar | NO | NO | NO | NO | NO | NO | NO |
| Marca | SI | Crear/Modificar | NO | NO | NO | NO | NO | NO | NO |
| Impuesto (0%/5%/19%) | SI | Crear/Modificar | NO | NO | NO | NO | NO | NO | NO |

**Nota importante**: NO se pueden crear productos desde el modulo de pedidos. Solo desde cotizaciones o el modulo de productos.

---

## 4. MODULO LEADS

**Fuente:** `PROCESO COMERCIAL - LEAD.md`

### 4.1 Campos del Lead

| Campo | Tipo |
|---|---|
| Numero de Lead | Auto-generado (consecutivo desde #100) |
| Fecha del Lead | Automatica |
| Razon social | Obligatorio |
| NIT | Obligatorio |
| Nombre del contacto | Obligatorio |
| Celular del contacto | Obligatorio |
| Correo electronico del contacto | Obligatorio |
| Requerimiento | Obligatorio |

### 4.2 Reglas de Negocio

- Consecutivo inicia en **100** y se asigna automaticamente
- Asignacion automatica round-robin a los comerciales que Gerencia seleccione
- Todo lead **debe convertirse en cotizacion en maximo 1 dia**, de lo contrario se genera **alerta de demora**
- Los leads pendientes por atender deben aparecer en **pestana de notificaciones** visible para los comerciales

---

## 5. MODULO COTIZACIONES

**Fuente:** `PROCESO COMERCIAL - Cotizacion.md`

### 5.1 Datos Generales de Cotizacion

| Campo | Obligatorio | Gerencia General | Ger. Comercial | Comerciales | Compras | Aux. Financiera |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Numero cotizacion | SI | Auto (desde #30000) | Auto | Auto | NO | NO |
| Fecha cotizacion | SI | Auto/Editable | Auto/Editable | Auto/Editable | NO | NO |
| NIT | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Razon social | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Forma de pago | SI | Crear/Modificar | NO | NO | NO | Crear/Modificar |
| Cupo credito disponible | SI | Auto | Auto | Auto | NO | NO |
| Nombre del contacto | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Celular del contacto | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Email del contacto | SI | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Asunto | SI | Editable | Editable | Editable | NO | NO |
| Nombre del comercial | SI | N/A (auto) | N/A (auto) | N/A (auto) | N/A | N/A |
| % Interes (estado pipeline) | SI | Modificar | Modificar | Modificar | NO | NO |
| Vigencia de la cotizacion | SI | Editable | Editable | Editable | NO | NO |
| Links adjuntos | NO | Editable | Editable | Editable | NO | NO |
| Condiciones comerciales | NO | Editable | Editable | Editable | NO | NO |
| Avance con cliente (retroalimentacion) | NO | Editable | Editable | Editable | NO | NO |
| Datos adjuntos (archivos) | NO | Editable | Editable | Editable | NO | NO |

### 5.2 Fechas de Cierre

| Campo | Obligatorio | Quien edita |
|---|:---:|---|
| Mes de cierre | SI | Gerencia, Ger. Comercial, Comerciales |
| Semana de cierre | SI | Gerencia, Ger. Comercial, Comerciales |
| Mes de facturacion | SI | Gerencia, Ger. Comercial, Comerciales |

### 5.3 Productos en Cotizacion

| Campo | Obligatorio | Gerencia General | Ger. Comercial | Comerciales | Resto |
|---|:---:|:---:|:---:|:---:|:---:|
| N de parte | SI | Editable | Editable | Editable | NO |
| Observaciones del producto | NO | Editable | Editable | Editable | NO |
| Costo del producto | SI | Modificar | Modificar | Modificar | NO |
| Moneda del costo (COP/USD) | SI | Modificar | Modificar | Modificar | NO |
| Costo final post conversion TRM | SI | Auto (calculado) | Auto | Auto | NO |
| % Utilidad a aplicar | SI | Modificar | Modificar | Modificar | NO |
| Precio de venta | SI | Modificar | Modificar | Modificar | NO |
| IVA a aplicar (0%/5%/19%) | SI | Modificar | Modificar | Modificar | NO |
| Cantidad | SI | Modificar | Modificar | Modificar | NO |
| Proveedor sugerido | SI | Modificar | Modificar | Modificar | NO |
| Tiempo de entrega | SI | Editable | Editable | Editable | NO |
| Garantia | SI | Editable | Editable | Editable | NO |
| Orden (posicion en cotizacion) | NO | Editable | Editable | Editable | NO |

### 5.4 Observaciones Importantes sobre Cotizaciones

1. **Duplicar versiones**: Se requiere poder crear 2+ versiones de una misma cotizacion, seleccionando productos y usando opcion "Duplicar" que replica la misma informacion segun productos seleccionados
2. **Liquidacion visible**: En el panel general debe aparecer: Total venta antes de IVA, Total costo, Utilidad, Margen general
3. **Transporte**: Debe existir casilla que pregunte si el valor de transporte ya esta incluido en los items. Si no, campo para diligenciar el valor y que se incluya en la liquidacion

### 5.5 Estados de Cotizacion (Pipeline)

| Estado | Descripcion |
|---|---|
| Creacion de oferta | Cotizacion recien creada |
| En negociacion | En dialogo activo con el cliente |
| Riesgo | Probabilidad baja de cierre |
| Pendiente por orden de compra | Cliente aceptó, esperando OC |
| Ganada | Cierre exitoso → genera pedido |
| Perdida | Negocio no concretado |

---

## 6. MODULO PEDIDOS - PANEL PRINCIPAL

**Fuente:** `Parametrizacion CRMv3 - Panel principal.md`

### 6.1 Busqueda de Pedidos

**Filtros disponibles:**
- Pedidos en proceso
- Pedidos cerrados
- Pedidos anulados
- Busqueda general

**Permisos de busqueda:**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|---|
| Financiera | N/A | N/A | Todos los filtros |
| Logistica | N/A | N/A | Todos los filtros |
| Compras | N/A | N/A | Todos los filtros |
| Gerencia | N/A | N/A | Todos los filtros |
| Comercial | N/A | N/A | Todos los filtros, **SOLO pedidos de sus clientes asignados** |

### 6.2 Campos del Panel Principal

| Campo | Editable | Descripcion |
|---|:---:|---|
| Estado del pedido | NO | En proceso / Cerrado / Perdido / Anulado |
| Numero de pedido | NO | Consecutivo automatico desde #20000, orden descendente |
| Cantidad pendiente por comprar | NO | Suma de unidades pendientes (ej: 2 productos x 3 unidades = 6) |
| Cliente (razon social) | NO | Heredado de cotizacion |
| Fecha y hora | NO | Fecha/hora de generacion del pedido |
| Responsable | NO | Comercial asignado al cliente |
| Asunto | NO | Diligenciado por comercial al pasar cotizacion a pedido |
| Subtotal | NO | Calculado |
| Moneda de negociacion | NO | COP o USD |

**Reglas del panel:**
- Ningun usuario puede crear ni editar desde el panel
- Vista por defecto: solo pedidos "En proceso"
- Ordenados por numero de pedido **descendente**
- Comercial: **UNICAMENTE** visualiza pedidos de sus clientes asignados
- Financiera, Logistica, Compras, Gerencia: visualizan **todos** los pedidos

### 6.3 Permisos del Panel por Area

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|---|
| Financiera | N/A | N/A | En proceso, cerrados, perdidos y anulados |
| Logistica | N/A | N/A | En proceso, cerrados, perdidos y anulados |
| Compras | N/A | N/A | En proceso, cerrados, perdidos y anulados |
| Gerencia | N/A | N/A | En proceso, cerrados, perdidos y anulados |
| Comercial | N/A | N/A | Solo pedidos de clientes asignados (en proceso, cerrados, perdidos, anulados) |

---

## 7. MODULO PEDIDOS - INFORMACION GENERAL (PEDIDOS 1)

**Fuentes:** `Parametrizacion CRMv3 - Pedidos 1.md`, `PROCESO COMERCIAL - Pedidos.md`

### 7.1 Campos Principales del Pedido

| # | Campo | Obligatorio | Financiera | Logistica | Compras | Gerencia | Comercial |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Razon social usuario final | SI | Ver | Ver | Ver | Crear/Editar | Crear/Editar (1 vez, hasta guardar) |
| 2 | NIT usuario final | SI | Ver | Ver | Ver | Ver (auto de razon social) | Ver (auto de razon social) |
| 3 | Contacto del cliente | SI | Ver | Ver | Ver | Crear/Editar | Crear/Editar |
| 4 | E-mail cliente | SI | Ver | Ver | Ver | Crear/Editar | Crear/Editar |
| 5 | Telefono cliente | SI | Ver | Ver | Ver | Crear/Editar | Crear/Editar |
| 6 | Asunto | SI | Ver | Ver | Ver | Crear/Editar | Crear (no editar) |
| 7 | Asesor (comercial responsable) | SI | Ver | Ver | Ver | Crear/Editar | Ver |
| 8 | Cotizacion origen | SI | Ver | NO ver | Ver | Ver | Ver |
| 9 | Forma de pago | SI | Ver | Ver | Ver | Ver | Ver |
| 10 | Confirmacion de pago | Condicional | Editar | Ver | Ver | Ver | Ver |
| 11 | Facturacion anticipada | Condicional | Parcial | Parcial | Parcial | Parcial | Parcial |
| 12 | Observaciones/Trazabilidad | NO | Crear | Crear | Crear | Crear | Crear |

**Notas:**
- La cotizacion origen debe ser clickeable y permitir navegar a ella
- Toda la informacion guardada en el pedido **NO se puede eliminar ni modificar** (regla general)

### 7.2 Forma de Pago en Pedidos (detalle)

| Forma de Pago | Comportamiento |
|---|---|
| Credito 8 dias | Flujo normal |
| Credito 15 dias | Flujo normal |
| Credito 30 dias | Flujo normal |
| Credito 45 dias | Flujo normal |
| Credito 60 dias | Flujo normal |
| Contra entrega | Unicamente transferencia |
| Anticipado | Default para clientes nuevos. Requiere autorizacion de Financiera o Gerencia ANTES de generar pedido |

**La forma de pago es definida por el area financiera desde el modulo de clientes.**

### 7.3 Confirmacion de Pago (solo para forma de pago Anticipado)

- **Se habilita SOLO** cuando forma de pago = Anticipado
- Boton de seleccion con 2 opciones:
  1. **Pago confirmado**
  2. **Pendiente por confirmar** (default)
- Si el pedido proviene del modulo cotizacion y el cliente tiene forma de pago anticipado → requiere facturacion anticipada, default = "Pendiente por confirmar"
- Cuando se selecciona "Pago confirmado" → **notificacion email a Compras** con referencia del pedido

**Permisos Confirmacion de Pago:**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | NO | **SI** | SI |
| Logistica | NO | NO | SI |
| Compras | NO | NO | SI |
| Gerencia | NO | NO | SI |
| Comercial | NO | NO | SI |

### 7.4 Flujo de Facturacion Anticipada (4 pasos secuenciales)

#### Paso 1: Solicitud de facturacion anticipada

- Boton con 2 opciones: **No requerida** (default) / **Requerida**
- Una vez seleccionada "Requerida" **NO se puede revertir**
- Se registra fecha/hora de activacion (no editable)
- Al seleccionar "Requerida" → **notificacion email a Compras**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | NO | NO | SI |
| Logistica | NO | NO | SI |
| Compras | NO | NO | SI |
| Gerencia | NO | **SI** | SI |
| Comercial | NO | **SI (1 vez)** | SI |

#### Paso 2: Aprobacion de facturacion anticipada

- Boton con 2 opciones: **Pendiente** (default) / **Aprobada**
- Se registra fecha/hora y usuario (no editable)
- Al seleccionar "Aprobada" → **notificacion email a Logistica** (unicamente a Sebastian)

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | NO | NO | SI |
| Logistica | NO | NO | SI |
| Compras | NO | **SI** | SI |
| Gerencia | NO | NO | SI |
| Comercial | NO | NO | SI |

#### Paso 3: Generacion de remision anticipada

- Boton con 2 opciones: **No generada** (default) / **Generada**
- Se registra fecha/hora (no editable)
- Al seleccionar "Generada" → **notificacion email a Financiera**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | NO | NO | SI |
| Logistica | NO | **SI** | SI |
| Compras | NO | **SI** | SI |
| Gerencia | NO | NO | SI |
| Comercial | NO | NO | SI |

#### Paso 4: Generacion de factura anticipada

- Boton con 2 opciones: **No generada** (default) / **Generada**
- Se registra fecha/hora (no editable)
- Al seleccionar "Generada" → **notificacion email a Compras Y al Comercial asignado**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | NO | **SI** | SI |
| Logistica | NO | NO | SI |
| Compras | NO | NO | SI |
| Gerencia | NO | NO | SI |
| Comercial | NO | NO | SI |

### 7.5 Cajon de Observaciones / Trazabilidad

- Permite llevar trazabilidad del pedido mediante observaciones de todos los implicados
- Cada observacion enviada **via correo electronico** a los destinatarios que el remitente seleccione
- En la parte inferior de cada observacion se registra:
  - Remitente
  - Destinatarios
  - Fecha y hora de envio
- **La informacion NO puede ser editada ni borrada por ningun usuario**

---

## 8. MODULO PEDIDOS - DESPACHO Y LOGISTICA (PEDIDOS 2)

**Fuente:** `Parametrizacion CRMv3 - Pedidos 2.md`

### 8.1 Informacion de Despacho (solo Gerencia y Comercial, una sola vez)

**Cajon destinado unicamente al comercial asignado a la cuenta. No se puede editar despues de guardado.**

| Campo | Obligatorio |
|---|:---:|
| Nombre de quien recibe | SI |
| Telefono de quien recibe | SI |
| Direccion de entrega | SI |
| Departamento (selector) | SI |
| Ciudad | SI |
| Horario de entrega | SI |
| E-mail envio de guia | SI |
| E-mail envio copia de factura | SI |

**Selector de Departamentos de Colombia (33 opciones):**
Amazonas, Antioquia, Arauca, Atlantico, Bogota DC, Bolivar, Boyaca, Caldas, Caqueta, Casanare, Cauca, Cesar, Choco, Cordoba, Cundinamarca, Guainia, Guaviare, Huila, La Guajira, Magdalena, Meta, Narino, Norte de Santander, Putumayo, Quindio, Risaralda, San Andres y Providencia, Santander, Sucre, Tolima, Valle del Cauca, Vaupes, Vichada

**Funcionalidades adicionales:**
- Boton para **copiar informacion** de despacho (puntos 1.1.1 a 1.1.7)
- Selector tipo de despacho: **Total / Parcial** (no editable despues de guardar)
- Selector tipo de facturacion: **Total / Parcial** (no editable despues de guardar)
- Selector confirmacion entrega: **Factura CON confirmacion de entrega / Factura SIN confirmacion de entrega** (no editable despues de guardar)

**Permisos despacho:**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | NO | NO | SI |
| Logistica | NO | NO | SI |
| Compras | NO | NO | SI |
| Gerencia | NO | SI (1 vez) | SI |
| Comercial | NO | SI (1 vez) | SI |

### 8.2 Destinos Multiples

- Cajon complementario para informacion de despacho adicional cuando hay multiples destinos
- No editable despues de guardado
- Registra fecha/hora y usuario al guardar

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | NO | NO | SI |
| Logistica | NO | NO | SI |
| Compras | NO | NO | SI |
| Gerencia | SI | NO | SI |
| Comercial | SI | NO | SI |

### 8.3 Informacion de Intangibles / Licencias / Servicios

**Cajon destinado unicamente al comercial. No editable despues de guardado.**

El sistema presenta botones de seleccion en cascada segun el tipo de intangible:

#### 8.3.1 ADP (Accidental Damage Protection)

**Por marca: ACER, ASUS, DELL, HP, LENOVO**

Campos obligatorios por cada marca:
| Campo |
|---|
| Razon social |
| NIT |
| Direccion |
| Ciudad |
| Departamento (selector 33 dptos) |
| Pais |
| Codigo postal |
| Contacto |
| Telefono |
| E-Mail |

+ Selector: **Producto en pedido / Producto no relacionado en pedido**
  - Si "Producto en pedido": no se genera cajon adicional
  - Si "Producto no relacionado en pedido": se genera cajon con:
    - Numero de parte del hardware
    - Serial del hardware
    - Fecha de compra del hardware

#### 8.3.2 Enrolamiento Apple

Campos obligatorios:
| Campo |
|---|
| Razon social |
| NIT |
| Direccion |
| Ciudad |
| Departamento (selector 33 dptos) |
| Pais |
| Codigo postal |
| Contacto |
| Telefono |
| E-Mail |
| **ID cliente** |

#### 8.3.3 Extensiones de Garantia

**Por marca: ACER, ASUS, DELL, HP, LENOVO**

Misma estructura que ADP (mismos campos + selector producto en pedido/no relacionado).

#### 8.3.4 Licenciamiento (por marca)

**Marcas disponibles y sus flujos:**

| Marca | Opciones | Campos adicionales renovacion |
|---|---|---|
| **Adobe** | Nuevo / Renovacion | + VIP |
| **Autodesk** | Nuevo / Renovacion | + Numero de contrato/serial |
| **Cisco** | Nuevo / Renovacion | + Fecha inicio/fin contrato, N parte HW, Serial HW |
| **Fortinet** | Nuevo / Renovacion | + Numero de serial |
| **Kaspersky** | Nuevo / Renovacion | + Fecha inicio/fin contrato |
| **Microsoft** | **CSP** / **ESD** | CSP: + tenant (con/sin tenant, Tenant ID, Dominio) |

**Campos base para todas las marcas (Nuevo y Renovacion):**
| Campo |
|---|
| Razon social |
| NIT |
| Sector economico |
| Contacto |
| Telefono |
| Cargo |
| Direccion |
| E-mail |
| Pais |
| Departamento (selector 33 dptos) |
| Ciudad |
| Codigo postal |

**Nota Cisco nuevo**: Incluye ademas selector "Producto en pedido / No relacionado" con campos de N parte HW, Serial HW, Fecha compra HW.

**Nota Microsoft CSP**: Incluye selector "Cliente sin tenant / Cliente con tenant". Si tiene tenant: campos Tenant ID y Dominio. Microsoft ESD no incluye selector de sector economico ni cargo.

**Marcas de intangibles completas en pedidos (vision general):**
Acronis, Adobe, Autodesk, AWS, Bit Defender, Check Point, ESET, Fortinet, Hillstone, Kaspersky, McAfee, Microsoft Azure, Microsoft O365 CSP, Microsoft O365 ESD, Trellix

#### 8.3.5 Servicios

| Tipo | Campos |
|---|---|
| **Instalacion** | Fecha inicio actividades, Fecha tentativa finalizacion, Fecha finalizacion proyecto |
| **Renting** | Fecha inicio contrato, Fecha finalizacion contrato |

### 8.4 Seguimiento de Entrega (solo Logistica y Compras)

| Campo | Descripcion |
|---|---|
| Tipo de despacho | Selector: Despachado motorizado PDC / Despachado externo PDC / Despachado PDC nacional / Despachado desde mayorista / Despachado Hibrido |
| Transportadora(s) | Cajon libre para relacionar por cual(es) transportadora(s) se envio |
| Numero(s) de guia | Cajon libre para relacionar numero(s) de guia |
| Fecha de despacho | Calendario para seleccionar fecha |
| Fecha de entrega | Calendario para seleccionar fecha |

**Permisos seguimiento entrega:**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | N/A | NO | SI |
| Logistica | N/A | **SI** | SI |
| Compras | N/A | **SI** | SI |
| Gerencia | N/A | NO | SI |
| Comercial | N/A | NO | SI |

### 8.5 Seguimiento de Facturacion (solo Financiera)

- Selector: **Facturado parcial / Facturado total**

| Area | Crear | Editar | Visualizar |
|---|:---:|:---:|:---:|
| Financiera | N/A | **SI** | SI |
| Logistica | N/A | NO | SI |
| Compras | N/A | NO | SI |
| Gerencia | N/A | NO | SI |
| Comercial | N/A | NO | SI |

---

## 9. MODULO PEDIDOS - REQUERIMIENTOS FUNCIONALES

**Fuente:** `Modulo pedidos .md`

### 9.1 Informacion General

- Casilla que indique de cual cotizacion proviene el pedido, con **navegacion clickeable** a la cotizacion
- Toda la informacion guardada en el pedido **NO se puede eliminar ni modificar**
- Opcion de generar **novedades** sobre el pedido con notificacion al comercial via la red de comunicacion interna
- Lugar para **adjuntar documentos de manera organizada**:
  - Documentos del cliente
  - Documentos del proveedor
  - Documentos de Prosuministros
- **Visibilidad**: El comercial solo ve sus pedidos; Facturacion, Logistica, Compras y Gerencia ven todos
- Filtro de pedidos: **abiertos, cerrados, anulados**

### 9.2 Informacion para Compras

- Visualizar **ordenes de compra generadas** correspondientes al pedido, con navegacion a cada OC
- Casilla independiente que indique **cuantos productos estan pendientes por comprar y cuales son**
- **Liquidacion general del pedido**: Total venta, Total costo, Utilidad, Margen, Costo de transporte (item independiente si no esta incluido en items)
- Desde la visualizacion general: validar proveedor cotizado, costo, y generar OC. **El sistema NO debe permitir comprar mas de las cantidades vendidas**
- Al generar OC de un producto: mostrar **proveedor e historico de precio** de la ultima compra con ese numero de parte

### 9.3 Informacion para Financiera

Ciclos de facturacion del pedido:
1. **Facturado**
2. **Pendiente por facturar por cierre contable** del cliente
3. **Pendiente por facturar por acta**

### 9.4 Flujo del Pedido (Reglas de Negocio)

El comercial debe indicar al crear el pedido:
- Si permite o no **entrega parcial**
- Si permite o no **facturacion parcial**
- Si es envio nacional: si se debe esperar entrega en destino final o se puede facturar al enviar

**Reglas del flujo:**

| Caso | Facturacion Parcial | Entrega Parcial | Comportamiento |
|---|:---:|:---:|---|
| 1 | SI | SI | Logistica entrega parcial → accion a Facturacion para factura parcial |
| 2 | NO | SI | Logistica entrega parcial → NO accion a Facturacion hasta entrega total |
| 3 | Total | NO | Logistica entrega completo → accion a Facturacion para factura total |
| 4 | - | - | Requiere confirmacion entrega → no se factura hasta confirmar entrega en destino |
| 5 | - | - | Sin confirmacion → se puede facturar una vez enviada la mercancia |

**Regla de Acta:**
- Si el pedido requiere acta para facturar → bloqueado hasta que el comercial suba el acta
- Comercial sube acta → notificacion a Facturacion para proceder

**Cierre de pedido:**
1. Facturacion adjunta documentos al pedido
2. Compras revisa que el pedido cuente con **todos los documentos adjuntos**
3. Compras **cierra el pedido** en la aplicacion

---

## 10. FLUJOS DE FACTURACION EN PEDIDOS

**Fuente:** `Modulo pedidos .md` (seccion Flujo)

### 10.1 Matriz Combinatoria Completa

| Caso | Facturacion Parcial | Entrega Parcial | Requiere Confirmacion Entrega | Flujo Detallado |
|---|:---:|:---:|:---:|---|
| 1 | SI | SI | NO | Logistica entrega parcial → accion automatica a Facturacion para factura parcial |
| 2 | NO | SI | NO | Logistica entrega parcial pero NO notifica a Facturacion hasta entrega total completada |
| 3 | Total | NO | NO | Logistica entrega total → accion a Facturacion para factura total |
| 4 | Cualquiera | Cualquiera | SI | No se puede facturar hasta que se confirme la entrega en destino final. Pedido en estado "En proceso de entrega" hasta confirmacion |
| 5 | Cualquiera | Cualquiera | NO | Se puede facturar una vez enviada la mercancia sin necesidad de confirmar entrega |

### 10.2 Notificaciones Automaticas

| Evento | Notificacion a |
|---|---|
| Remision realizada + no requiere confirmacion entrega | Facturacion (para que facture) |
| Remision realizada + requiere confirmacion | Comercial (informar que se despacho parcial/total) |
| Entrega confirmada (cuando requiere confirmacion) | Facturacion (para que facture) |
| Factura generada | Compras (para revisar documentos y cerrar pedido) |
| Documentos completos | Compras (puede cerrar pedido) |

### 10.3 Regla de Acta para Facturar

- Si el pedido requiere acta → Facturacion bloqueada
- Comercial carga acta → notificacion automatica a Facturacion
- Facturacion procede con factura

---

## 11. TABLERO OPERATIVO DE SEGUIMIENTO (PRD)

**Fuente:** `PRD.md`

### 11.1 Introduccion y Objetivo

El cliente actualmente realiza seguimiento de pedidos mediante un cuadro operativo en SharePoint con codificacion por colores. El PRD define el desarrollo de un **Tablero Operativo digital** que replica y mejora esta logica.

**Objetivo**: Pantalla operativa en vista **tabla**, orientada al **Gerente Operativo**, que permita:
- Visualizar pedidos a nivel de **producto**
- Identificar rapidamente **quien es el responsable actual**
- Detectar **pendientes, bloqueos y avances**
- Dar seguimiento simultaneo a multiples areas
- Alimentar una **vista ejecutiva agregada (Kanban)** para el Gerente General

### 11.2 Usuarios y Roles del Tablero

| Rol | Acceso | Uso |
|---|---|---|
| **Gerente Operativo** | Vista tabla con todos los colores | Gestion del dia a dia, decisiones tacticas |
| **Gerente General** | Vista Kanban sin colores | Estados consolidados, decisiones estrategicas |

### 11.3 Concepto Clave

**El tablero NO maneja un unico estado por pedido.** Cada columna representa un proceso o responsabilidad independiente. Una misma fila puede tener **multiples colores simultaneamente**.

El color:
- NO es decorativo
- NO es un estado unico
- Es un **indicador de responsabilidad + accion pendiente**, interpretado **por columna**

### 11.4 Estructura del Tablero (Vista Tabla)

#### Bloque 1 - Informacion Operativa Base

| Columna | Descripcion |
|---|---|
| Proveedor | Proveedor asociado |
| OC | Orden de compra |
| Cliente | Cliente del pedido |
| OP | Orden de pedido |
| Producto | Producto especifico |
| Cantidad | Unidades |
| Fecha de entrega | Fecha comprometida |
| Responsable | Quien tiene control operativo |
| Novedades | Pendientes y notas |

**Separador visual fijo** entre Novedades y REM (cambio de logica: izquierda=control operativo, derecha=subprocesos administrativos)

#### Bloque 2 - Subprocesos Administrativos

| Columna | Descripcion |
|---|---|
| REM | Remision |
| Factura | Estado de facturacion |
| Transportadora | Empresa transportadora |
| Guia | Numero de guia |
| Obs. CRM | Observaciones en CRM |
| Correo U.F | Correo al usuario final |

Cada columna tiene estado propio, NO hereda color del bloque operativo, funciona como **checklist visual**.

### 11.5 Mapeo de Colores y Responsabilidades

#### ROJO - Financiera / Comercial / Bloqueos
**Indica errores o bloqueos que impiden avanzar el proceso.**

Ejemplos:
- Error en pedido (precio, costo, cantidad, IVA, razon social, etc.)
- Pendiente de facturacion
- Cambio en fecha de entrega no confirmado
- Informacion de despacho incorrecta

**Regla**: No se generan OCs. Requiere correccion del comercial (**SLA 1 hora**).

#### NARANJA - Auxiliar de Bodega
**Indica acciones de seguimiento operativo.**

Ejemplos:
- Confirmar salida en ruta
- Registrar transportadora y guia
- Enviar correo al usuario final
- Relacionar informacion en CRM
- Gestionar devoluciones o garantias

#### MORADO - Jefe de Bodega
**Indica ejecucion logistica interna.**

Ejemplos:
- Producto pendiente de recoleccion
- Producto en ruta hacia bodega
- Remision pendiente
- Seguimiento de entregas parciales
- Resolucion de novedades logisticas

#### AMARILLO - Compras
**Indica pendientes del area de compras.**

Ejemplos:
- Producto pendiente de compra
- Generacion de salida de almacen
- Envio de tokens o licencias
- Acompanamiento a logistica

#### AZUL - Licencias / Servicios Recurrentes
**Identifica pedidos de licenciamientos y servicios mes a mes o anuales.**

Permite:
- Controlar fechas de inicio y fin
- Anticipar facturacion recurrente

#### VERDE CLARO - Proceso Avanzado
**Indica que el proceso va bien pero no ha finalizado.**

Ejemplos:
- Producto ingreso completamente a bodega
- Pedido despachado pero no entregado

#### VERDE OSCURO - Proceso Completado
**Indica cierre exitoso del flujo.**

Ejemplos:
- Producto entregado sin novedad
- Remision realizada
- Factura emitida
- Correo enviado
- Pedido entregado al cliente

### 11.6 Reglas del Sistema de Colores

1. Una fila puede tener **multiples colores simultaneamente**
2. El color se interpreta **por columna**, no por fila
3. No existe un unico status global del pedido
4. Todo cambio de color debe registrar: **Usuario, Fecha, Motivo**
5. Los colores deben ser **parametrizables**

### 11.7 Vista Ejecutiva Kanban (Gerente General)

- **No muestra colores operativos**
- Agrupa productos/pedidos en estados macro:
  - En compras
  - En proveedor
  - En transporte
  - En bodega
  - Bloqueado
  - Cerrado
- Estos estados se **calculan automaticamente** a partir de la logica de colores del tablero operativo

### 11.8 Beneficios Esperados

- Reduccion de reprocesos
- Menos seguimiento manual
- Claridad inmediata de responsabilidades
- Separacion clara entre operacion y estrategia
- Escalabilidad frente al Excel/SharePoint actual

### 11.9 Fuera de Alcance (por ahora)

- Automatizacion de correos
- Integraciones externas
- Reportes historicos avanzados
- Workflow automatico de aprobaciones

### 11.10 Criterio de Exito

El sistema sera exitoso si:
- El gerente operativo puede gestionar su dia sin apoyo externo
- El gerente general puede entender el estado del negocio sin entrar al detalle
- Se elimina la dependencia del archivo en SharePoint

---

## 12. CUADRO OPERATIVO SHAREPOINT (AS-IS)

**Fuente:** `Cuadro SharePoint.md`

Este documento describe el cuadro operativo **actual** en SharePoint y como se interpretan los colores hoy. Es la referencia para la digitalizacion descrita en el PRD.

### 12.1 Objetivo del Cuadro Actual

Realizar seguimiento a:
- **Area financiera** (rojo): Facturacion oportuna, pendientes
- **Area comercial** (rojo): Novedades antes de iniciar compra, pendientes del comercial
- **Area logistica - Jefe de bodega** (morado): Recoleccion, remisiones, entregas, salidas de almacen
- **Area logistica - Auxiliar de bodega** (naranja): Confirmaciones proveedor, despachos, guias, correos
- **Area de compras** (amarillo): OC pendientes, seguimiento, tokens, certificados

### 12.2 Interpretacion Detallada de Colores por Columna

#### AMARILLO (Compras)

| Columnas subrayadas | Significado |
|---|---|
| Producto a Cantidad | Productos pendientes por comprar |
| Novedades | Generar salida de almacen o dar solucion a novedad |
| Obs. CRM | Pendiente envio de token de activacion al usuario final |
| F. Entrega | Dar acompanamiento a logistica por entrega que no pudieron manejar |

#### VERDE OSCURO (Proceso completado)

| Columnas subrayadas | Significado |
|---|---|
| Proveedor a Responsable | Todos los productos entregados sin novedad |
| Obs. CRM/SI | Pedido ya entregado |
| REM/SI | Jefe de bodega ya realizo remision (parcial/total) |
| Factura/SI | Financiera ya realizo la factura (parcial/total) |
| Correo U.F | Auxiliar ya envio correo informativo al cliente |
| Transportadora a Obs. CRM | Despacho por transportadora fue entregado |

#### AZUL (Licenciamientos/Servicios recurrentes)

- Identificar pedidos de licenciamientos y/o servicios mes a mes
- Identificar fecha inicio/fin de contratos
- Seguimiento de fechas de facturacion recurrente

#### VERDE CLARO (Proceso avanzado)

| Columnas subrayadas | Significado |
|---|---|
| Proveedor a Responsable | Productos de un pedido ya ingresaron a bodega (solo cuando llega cantidad total) |
| Proveedor a Responsable (todos los productos) | Productos en inventario pero cliente solicita fecha especifica de entrega (novedad en pestana Novedades) |
| Transportadora a Obs. CRM | Pedido despachado pero no entregado (al entregar cambia a verde oscuro) |

#### ROJO (Bloqueos/Errores)

| Columnas subrayadas | Significado |
|---|---|
| Proveedor a Responsable (todo) | Error del comercial: precio de venta, costo, cantidad, numero de parte, IVA, enlace SharePoint, descripcion, razon social, productos sin disponibilidad. Novedad en pestana "Novedades" |
| Transportadora a Correo U.F | Informacion de despacho incorrecta |
| Novedades (solo) | Comercial tiene pendientes: fecha entrega, solucion novedad |
| Factura (solo) | Pedido no facturado |
| F. Entrega (solo) | Novedad con tiempo de entrega del proveedor, pendiente confirmacion del comercial con cliente |

**SLA**: Se mantiene rojo hasta correccion. Plazo **1 hora** despues de notificado. Si no corrige → se procede a **anular pedido**. No se genera ninguna OC hasta correccion.

#### NARANJA (Auxiliar de Bodega)

| Columnas subrayadas | Significado |
|---|---|
| Proveedor a Cant (morado) + F. Entrega (naranja) | Confirmar con proveedor que se puede recoger |
| F. Entrega (solo) | Seguimiento a OC que debe ser entregada, confirmar que salio en ruta |
| Obs. CRM (solo) | Confirmar con proveedor si intangibles fueron entregados |
| Transportadora a Obs. CRM | Solicitar/relacionar transportadora y guia + enviar correo al usuario final |
| Obs. CRM (solo) | Pendiente relacionar info de envio en CRM |
| Correo U.F (solo) | Pendiente enviar info de despacho al usuario final |
| Novedades | Adjuntar remision/acta en SharePoint o dar solucion a novedad (devoluciones/garantias) |
| CANT | Si mayorista no despacho completo, indica unidades pendientes de ingreso |

**Seguimiento continuo**: Cada 8 dias a productos bajo pedido para evitar que proveedor no procese la OC.

#### MORADO (Jefe de Bodega)

| Columnas subrayadas | Significado |
|---|---|
| Proveedor a F. Entrega | Auxiliar confirmo recoleccion posible, pendiente de recoger |
| Proveedor a Cant (morado) + F.Entrega (naranja) | Producto debe recogerse pero esperar confirmacion del auxiliar |
| F. Entrega (solo) | Auxiliar confirmo que salio en ruta, jefe debe estar atento a ingreso |
| REM (solo) | Pendiente realizar remision (parcial/total) |
| Obs. CRM (solo) | Producto en ruta, aun no entregado (parcial/total) |
| Novedades | Darle solucion a novedad (solicitudes salidas de almacen, etc.) |

### 12.3 Seguimiento de Entrega por Transportadora

| Color en Transportadora a Correo U.F | Significado |
|---|---|
| Rojo | Pendiente que comercial diligencie info de despacho |
| Verde claro | Pedido enviado, no entregado (local o nacional) |
| Verde oscuro | Pedido enviado y entregado (local o nacional) |
| Naranja | Pendiente relacionar en CRM informacion de despacho |

---

## 13. MODULO SOLICITUD DE PROFORMA

**Fuente:** `Parametrizacion CRMv3 - Pendientes.md`

**Estado: PENDIENTE POR DEFINIR**

- Cuando se solicita proforma para pago del cliente, se debe realizar desde el modulo cotizaciones
- Debe existir un **modulo intermedio entre cotizacion y pedidos** para la aprobacion de financiera y compras para la emision de la proforma
- Nombre propuesto: **Modulo Solicitud de Proforma**

---

## 14. ROLES Y PERMISOS CONSOLIDADOS

**Fuentes:** Todas las matrices de permisos de los documentos anteriores

### 14.1 Roles del Sistema

| Rol | Descripcion | Areas de Accion |
|---|---|---|
| **Gerencia General** | Maximo nivel de acceso | Clientes, productos, cotizaciones, pedidos, reportes, configuracion, tablero. Puede crear, editar y ver todo |
| **Gerencia Comercial** | Gestion del equipo comercial | Clientes, cotizaciones (crear), leads (asignar), reportes comerciales. Puede crear/modificar clientes |
| **Comerciales** | Ejecutores del proceso comercial | Clientes (crear), leads (atender), cotizaciones (crear/editar propias), pedidos (crear desde cotizacion, info despacho), solo ven sus pedidos/clientes |
| **Compras** | Gestion de ordenes de compra | OC, seguimiento proveedores, aprobacion fact. anticipada, cierre pedidos, tokens, certificados |
| **Auxiliar Financiera** | Facturacion y pagos | Forma pago clientes, correo facturacion, confirmacion pagos, facturacion, seguimiento facturacion |
| **Auxiliar Administrativa** | Rol limitado | Sin acceso a modulos principales |
| **Jefe de Bodega** | Logistica interna | Recoleccion, remisiones, ingreso mercancia, entregas locales, seguimiento entrega |
| **Auxiliar de Bodega** | Seguimiento logistico | Confirmacion proveedores, guias, transportadoras, correos al usuario final, seguimiento CRM |
| **Gerente Operativo** | Tablero operativo | Gestion diaria via tablero de colores, asignacion de responsabilidades |

### 14.2 Matriz Resumen de Permisos por Modulo

| Modulo | Ger. General | Ger. Comercial | Comerciales | Compras | Financiera | Logistica | Jefe Bodega | Aux. Bodega |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Clientes | Todo | Crear/Mod | Crear/Mod | NO | Forma pago | NO | NO | NO |
| Productos | Todo | Crear | Crear | NO | NO | NO | NO | NO |
| Leads | Asignar | Asignar | Atender | NO | NO | NO | NO | NO |
| Cotizaciones | Todo | Todo | Propias | NO | Forma pago | NO | NO | NO |
| Pedidos (crear) | SI | SI | SI (desde cotiz.) | NO | NO | NO | NO | NO |
| Pedidos (info gral) | Todo | Ver | Ver propios | Ver | Ver | Ver | NO | NO |
| Pedidos (despacho) | Editar 1x | NO | Editar 1x | NO | NO | NO | NO | NO |
| Pedidos (seguim. entrega) | Ver | NO | Ver | Editar | Ver | Editar | Editar | Editar |
| Pedidos (facturacion) | Ver | NO | Ver | Ver | Editar | Ver | NO | NO |
| Pedidos (cerrar) | Ver | NO | NO | **Cierra** | NO | NO | NO | NO |
| Tablero operativo | Ver | NO | NO | NO | NO | NO | Gestiona | Gestiona |
| Tablero Kanban | Ver | NO | NO | NO | NO | NO | NO | NO |

---

## 15. DISENO ACTUAL PEDIDOS EN ODOO (REFERENCIA)

**Fuente:** `Parametrizacion CRMv3 - Diseno actual pedidos.md`

Este documento contiene capturas de pantalla del diseno actual del modulo de pedidos en Odoo/Berneo. El diseno tiene las siguientes pestanas:

1. **Pestana Datos Generales** - Informacion basica del pedido
2. **Pestana Otros Datos** - Datos complementarios
3. **Pestana Detalle** - Detalle de productos
4. **Pestana Seleccionar** - Seleccion de productos
5. **Pestana Generados** - Documentos generados (OC, remisiones, facturas)
6. **Pestana Condiciones Comerciales** - Condiciones especiales

*Nota: El contenido de las celdas no fue extraido (solo estructura de tablas vacias provenientes de capturas de pantalla).*

---

## GLOSARIO DE TERMINOS

| Termino | Significado |
|---|---|
| OC | Orden de Compra |
| OP | Orden de Pedido |
| REM | Remision |
| CRM | Customer Relationship Management (sistema actual: Odoo/Berneo) |
| WO | World Office (sistema contable) |
| U.F | Usuario Final |
| PDC | Prosuministros de Colombia |
| TRM | Tasa Representativa del Mercado (USD→COP) |
| ADP | Accidental Damage Protection |
| CSP | Cloud Solution Provider (programa Microsoft) |
| ESD | Electronic Software Distribution |
| SLA | Service Level Agreement |
| Tenant | Instancia de Microsoft 365 del cliente |
| VIP | Numero de identificacion Adobe |
| Vertical | Categoria de producto (Accesorios, Hardware, Otros, Servicios, Software) |
| Proforma | Factura proforma (documento previo a factura real, para pago anticipado) |
| Margen | Porcentaje de utilidad sobre el precio de venta |

---

**Documento consolidado generado automaticamente desde 18 archivos .md:**
- `Cuadro SharePoint.md`
- `Modulo pedidos .md`
- `PRD.md`
- `Parametrizacion CRMv3 - Diseno actual pedidos.md`
- `Parametrizacion CRMv3 - Panel principal.md`
- `Parametrizacion CRMv3 - Pedidos 1.md`
- `Parametrizacion CRMv3 - Pedidos 2.md`
- `Parametrizacion CRMv3 - Pendientes.md`
- `PROCESO COMERCIAL - Creacion de cliente.md`
- `PROCESO COMERCIAL - Creacion de producto.md`
- `PROCESO COMERCIAL - Formas de pago.md`
- `PROCESO COMERCIAL - Moneda.md`
- `PROCESO COMERCIAL - Via de contacto.md`
- `PROCESO COMERCIAL - Vertical.md`
- `PROCESO COMERCIAL - Margenes minimos por vertical.md`
- `PROCESO COMERCIAL - LEAD.md`
- `PROCESO COMERCIAL - Cotizacion.md`
- `PROCESO COMERCIAL - Pedidos.md`
