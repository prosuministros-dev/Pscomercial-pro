# CONSOLIDADO DE VALIDACIONES EN TRANSCRIPCIONES

> **Proyecto**: Pscomercial-pro (PROSUMINISTROS)
> **Fecha de elaboraci&oacute;n**: 2026-02-20
> **Fuente**: 8 transcripciones de reuniones con el cliente (Daniel Valbuena - Gerente Comercial/Due&ntilde;o)
> **Prop&oacute;sito**: Consolidar TODOS los hallazgos validados en transcripciones para servir como referencia &uacute;nica de requisitos discutidos con el cliente.

---

## TABLA DE CONTENIDO

1. [Estados de Cotizaciones (Pipeline Kanban)](#1-estados-de-cotizaciones-pipeline-kanban)
2. [Validaciones del Pipeline Comercial](#2-validaciones-del-pipeline-comercial)
3. [Notificaciones del Sistema (Internas y Externas)](#3-notificaciones-del-sistema-internas-y-externas)
4. [Generaci&oacute;n de Documentos PDF](#4-generacion-de-documentos-pdf)
5. [Gesti&oacute;n de Documentos Adjuntos](#5-gestion-de-documentos-adjuntos)
6. [Visitas Comerciales](#6-visitas-comerciales)
7. [Flujo de Aprobaci&oacute;n de Compra](#7-flujo-de-aprobacion-de-compra)

---

## 1. ESTADOS DE COTIZACIONES (Pipeline Kanban)

### 1.1 Los 4 Estados Definitivos del Pipeline

Daniel Valbuena defini&oacute; expl&iacute;citamente que las cotizaciones manejan **&uacute;nicamente 4 estados** en el pipeline Kanban, cada uno con un porcentaje de probabilidad de cierre:

| # | Estado | Porcentaje | Nombre interno de Daniel |
|---|--------|-----------|--------------------------|
| 1 | Env&iacute;o Cotizaci&oacute;n / Creaci&oacute;n de Oferta | 40% | "Pipe" |
| 2 | En Negociaci&oacute;n | 60% | "Pipe Upside" |
| 3 | Riesgo | 70% | "Riesgo en negociaci&oacute;n" |
| 4 | Pendiente Orden de Compra | 80% | "Pendiente OC" |

**Fuentes**:
- Validaci&oacute;n PS (l&iacute;neas 1886-1887): *"Yo tengo pipe, que es 40, pipe upside 60. Riesgo, pendiente orden de compra. Esos son mis estados de cotizaci&oacute;n, que son 40, 60, 70 y 80"*
- CheckPoint PS (l&iacute;neas 609-610, 623-627): Daniel confirma que los 4 estados ya est&aacute;n en el mockup: *"Creaci&oacute;n de oferta, negociaci&oacute;n, riesgo y pendiente de compra"*

### 1.2 Estados Terminales

Las cotizaciones pueden salir del pipeline hacia tres estados terminales:

| Estado Terminal | Descripci&oacute;n | Requiere |
|----------------|------------|----------|
| **Convertida a Pedido** | La cotizaci&oacute;n se convierte en pedido. Desaparece del m&oacute;dulo de cotizaciones. | Todas las aprobaciones cumplidas |
| **Perdida** | El cliente decidi&oacute; no continuar. | Motivo obligatorio (lista desplegable) |
| **Rechazada** | El cliente rechaz&oacute; expl&iacute;citamente. | Motivo obligatorio |

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 132-134): *"La cotizaci&oacute;n desaparece del m&oacute;dulo de cotizaciones. Se crea el pedido con n&uacute;mero &uacute;nico"*
- PS-Levantamiento requerimientos (l&iacute;nea 266): *"...o que la cotizaci&oacute;n ya perdimos por precio. Listo, pues ya la doy como perdida"*
- Validaci&oacute;n PS (l&iacute;neas 2253-2254): *"Si el cliente rechaza, el sistema cambia el estado a cotizaci&oacute;n rechazada y almacena el motivo"*

### 1.3 Regla Cr&iacute;tica: NO Se Pueden Crear M&aacute;s Estados

Daniel fue **enf&aacute;tico** en que las aprobaciones internas (margen, cartera, cupo) **NO deben crear estados adicionales** en el pipeline. Los sub-estados se manejan v&iacute;a bit&aacute;cora/log de movimientos.

**Fuentes**:
- Validaci&oacute;n PS (l&iacute;neas 1924-1932): *"O sea, la idea es que los estados de la cotizaci&oacute;n sean los que les dije: enviado cotizaci&oacute;n, en negociaci&oacute;n, riesgo y pendiente de compra. O sea, no pueden haber m&aacute;s estados. Ahora que las solicitudes que se hagan en la cotizaci&oacute;n, pues no me puedo alterar el estado"*
- Validaci&oacute;n PS (l&iacute;neas 1934-1945): Freddy propone la soluci&oacute;n: *"Podemos manejar eso como notificaci&oacute;n basada en el log. Cada cotizaci&oacute;n va a tener n cantidad de movimientos. Esos movimientos van a tener razones o motivos. Entonces esos motivos pueden generar notificaciones sin cambiar el estado"*
- Validaci&oacute;n PS (l&iacute;nea 1970): Freddy confirma: *"No es necesario crear un nuevo estado. Manejamos los mismos estados, solo que por el historial de los movimientos podemos notificar a las personas que se tengan que notificar"*

### 1.4 Estados del Pedido (post-cotizaci&oacute;n)

Una vez convertida a pedido, el flujo de estados es:

| Etapa | Estados |
|-------|---------|
| **Despacho** | Pendiente de despacho &rarr; Despachado parcial / Despachado total |
| **Entrega** | Pendiente de entrega &rarr; Entregado parcial / Entregado total |
| **Facturaci&oacute;n** | Pendiente por facturar &rarr; Facturado parcial / Facturado total |
| **Cierre** | Pendiente por cerrar &rarr; Cerrado / Anulado (con motivo) |

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 202-209, 223-248, 251-270)
- PS-LEVANTAMIENTO INFO (l&iacute;nea 422): *"Despachado parcial, despachado total, entregado parcial, entregado total... facturado parcial o facturado total"*

### 1.5 Vigencia de la Cotizaci&oacute;n

- **Valor por defecto**: 5 d&iacute;as calendario
- **Editable**: S&iacute;, el comercial puede modificarlo seg&uacute;n la negociaci&oacute;n
- **Notificaci&oacute;n**: 3 d&iacute;as antes del vencimiento

**Fuente**: Kick off PROSUMINISTROS (l&iacute;nea 445): *"La vigencia de la cotizaci&oacute;n es un tema que nosotros ponemos 5 d&iacute;as calendario, puede ser m&aacute;s dependiente de negociaci&oacute;n, es un campo editable"*

---

## 2. VALIDACIONES DEL PIPELINE COMERCIAL

### 2.1 Validaciones en Generaci&oacute;n/Gesti&oacute;n de Leads

| Validaci&oacute;n | Tipo | Descripci&oacute;n | Fuente |
|------------|------|------------|--------|
| Campos obligatorios del lead | Bloqueante | NIT, Raz&oacute;n Social, Contacto, Celular, Correo, Requerimiento | PS-LEVANTAMIENTO INFO:40 |
| Motivo de rechazo de lead | Bloqueante | Si se descarta un lead, debe seleccionar motivo de lista desplegable | PS-LEVANTAMIENTO INFO:65-74 |
| Asignaci&oacute;n balanceada | Autom&aacute;tica | M&aacute;ximo 5 leads pendientes por asesor antes de asignarle otro | FLUJO CLAUDE:13 |
| Consecutivo de lead | Autom&aacute;tica | Inicia desde 100, autogenerado | FLUJO CLAUDE:13, Simulaci&oacute;n demo:12 |

### 2.2 Validaciones en Cotizaci&oacute;n

#### 2.2.1 Validaci&oacute;n de Margen M&iacute;nimo (DUAL)

El sistema debe validar el margen en **dos dimensiones simult&aacute;neas**:

**Por Categor&iacute;a de Producto:**

| Categor&iacute;a | Margen M&iacute;nimo |
|----------|---------------|
| Hardware | 6-7% |
| Software | 4% |
| Servicios | 6% |
| Accesorios | 6% |

**Por D&iacute;as de Cr&eacute;dito:**

| Plazo de Cr&eacute;dito | Margen M&iacute;nimo |
|-----------------|---------------|
| 30 d&iacute;as | 7% |
| 45 d&iacute;as | 10% |
| 60 d&iacute;as | 12% |

**F&oacute;rmula de c&aacute;lculo**: `Margen = 1 - (Total Costo / Total Venta)`

**Comportamiento cuando el margen est&aacute; por debajo del m&iacute;nimo:**
1. El sistema genera un **modal** al asesor indicando que requiere aprobaci&oacute;n
2. El modal muestra: C&oacute;digo cotizaci&oacute;n, Cliente, Margen calculado, Margen m&iacute;nimo requerido, Nombre asesor, Fecha creaci&oacute;n
3. La solicitud va dirigida a **Gerencia General/Comercial** (Daniel Valbuena) **UNICAMENTE** - NO a financiera
4. La cotizaci&oacute;n **NO queda bloqueada** para edici&oacute;n: el comercial puede seguir agregando productos
5. La cotizaci&oacute;n **S&Iacute; queda bloqueada** para pasar a pedido: hasta que no reciba aprobaci&oacute;n o rechazo, no puede avanzar
6. El comercial **S&Iacute; puede exportar a PDF** y enviar al cliente mientras espera aprobaci&oacute;n
7. El aprobador puede aprobar un **margen diferente** (ej: solicitan 5%, aprueban 4%)
8. El margen aprobado debe ser **visible** en el producto de la cotizaci&oacute;n para que Compras lo vea
9. La validaci&oacute;n es **por producto** Y tambi&eacute;n se muestra un **resumen total** de la cotizaci&oacute;n

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 66-79)
- Validaci&oacute;n PS (l&iacute;neas 1634-1637, 1646-1653, 1665, 1674, 1685-1687, 1752-1779, 1793-1817, 1829-1831, 1845-1860, 1854-1855, 1957-1961, 1990-1991)
- PS-LEVANTAMIENTO INFO (l&iacute;neas 160-162)

> **Cita clave de Daniel** (Validaci&oacute;n PS:1854-1855): *"Financiera no tiene nada que ver ah&iacute;. Gerencia general &uacute;nicamente, porfa."*

#### 2.2.2 Validaci&oacute;n de Valores IVA

| Regla | Detalle |
|-------|---------|
| Valores permitidos | 0%, 5%, 19% |
| Acci&oacute;n si otro valor | El sistema debe **rechazar** cualquier otro porcentaje |

**Fuente**: FLUJO CLAUDE (l&iacute;nea 83)

#### 2.2.3 Consecutivo de Cotizaci&oacute;n

- Inicia desde **30000**
- Autogenerado por el sistema

**Fuente**: FLUJO CLAUDE, Simulaci&oacute;n demo (l&iacute;nea 50)

#### 2.2.4 Orden de Productos en Cotizaci&oacute;n

- Cada producto tiene un campo de **orden** que define su posici&oacute;n en el PDF
- El comercial asigna el orden seg&uacute;n c&oacute;mo lo solicit&oacute; el cliente
- Es **cr&iacute;tico** para el negocio

**Fuentes**:
- Kick off PROSUMINISTROS (l&iacute;neas 449-450): *"B&aacute;sicamente es el orden en que van los productos al momento de imprimirlos en el PDF. Para nosotros es crucial"*
- Validaci&oacute;n PS (l&iacute;neas 1705-1724)

### 2.3 Validaciones Financieras (Bloquean paso a Pedido)

#### 2.3.1 Bloqueo por Cartera en Mora

| Aspecto | Detalle |
|---------|---------|
| **Qui&eacute;n bloquea** | Laura Burgos (Financiera) - MANUALMENTE |
| **Cu&aacute;ndo bloquea** | Cuando el cliente tiene cartera vencida (+35 d&iacute;as adicionales al cr&eacute;dito otorgado) |
| **Efecto en cotizaci&oacute;n** | Aviso visible: *"Cliente bloqueado por cartera en mora"* - NO bloquea cotizar |
| **Efecto en pedido** | BLOQUEA generaci&oacute;n de pedido |
| **C&oacute;mo desbloquear** | Solicitar autorizaci&oacute;n a Laura Burgos o Daniel Valbuena. Debe justificar (ej: "hay compromiso de pago"). Laura/Daniel revisan con Juan. Si aprueban, el comercial puede generar el pedido espec&iacute;fico. El bloqueo sigue activo hasta que Laura lo quite. |
| **MVP** | Bloqueo MANUAL (sin integraci&oacute;n World Office). Integraci&oacute;n autom&aacute;tica queda para Fase 2 |

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 46, 111-120)
- Validaci&oacute;n PS (l&iacute;neas 1194-1195, 1236-1237, 1246-1247, 1332-1334, 1536-1552)

> **Cita de Daniel** (Validaci&oacute;n PS:1194-1195): *"Cuando Laura hace bloqueo de cartera... que entre y ponga bloqueo de cartera y ah&iacute; es donde debe salir el aviso. El aviso no incide nada en la cotizaci&oacute;n, que si va a querer montar un pedido, debe solicitar una aprobaci&oacute;n &uacute;nicamente para esa cotizaci&oacute;n"*

#### 2.3.2 Validaci&oacute;n de Cupo de Cr&eacute;dito (Extra Cupo)

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Valor cotizaci&oacute;n > Cupo de cr&eacute;dito disponible del cliente |
| **Efecto en cotizaci&oacute;n** | Informativo - muestra datos de cupo pero NO bloquea |
| **Efecto en pedido** | BLOQUEA generaci&oacute;n de pedido |
| **Contenido solicitud** | *"Cliente tiene cupo asignado de $X, disponible $Y, pero cotizaci&oacute;n es por $Z"* |
| **Aprobador** | Laura Burgos (primario) / Daniel Valbuena (backup) |
| **MVP** | Cupo de cr&eacute;dito DIFERIDO (sin integraci&oacute;n World Office). Solo funciona el bloqueo de cartera manual |

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 44-45, 121-127)
- Validaci&oacute;n PS (l&iacute;neas 1171-1174, 1187-1188, 1474-1481)

> **Decisi&oacute;n MVP** (Validaci&oacute;n PS:1474-1481): *"Si no vamos a avanzar sin World Office, entonces que no consulte cupos, que no consulte nada de eso... b&aacute;sicamente que Laura entre, ponga bloqueo por cartera y pare de contar"*

#### 2.3.3 Verificaci&oacute;n de Pago (Clientes sin Cr&eacute;dito / Anticipado)

| Aspecto | Detalle |
|---------|---------|
| **Aplica a** | Clientes con forma de pago **anticipado** (sin cr&eacute;dito) |
| **Flujo** | 1. Comercial env&iacute;a cotizaci&oacute;n &rarr; 2. Cliente acepta &rarr; 3. Comercial solicita proforma a Financiera &rarr; 4. Financiera genera proforma &rarr; 5. Comercial env&iacute;a proforma al cliente &rarr; 6. Cliente paga &rarr; 7. Comercial solicita verificaci&oacute;n de pago a Financiera &rarr; 8. Financiera verifica en banco &rarr; 9. Si confirma pago, aprueba y se puede generar pedido |
| **Aprobador** | Laura Burgos (&aacute;rea financiera) |

**Fuentes**:
- Validaci&oacute;n PS (l&iacute;neas 2074-2103, 2345-2358, 2410-2411)

### 2.4 Validaciones en Generaci&oacute;n de Pedido

| Validaci&oacute;n | Tipo | Descripci&oacute;n | Fuente |
|------------|------|------------|--------|
| Correo de facturaci&oacute;n | Bloqueante | Si no est&aacute; diligenciado, el sistema alerta y bloquea | FLUJO CLAUDE:136-138 |
| Informaci&oacute;n de despacho completa | Bloqueante | Nombre receptor, tel&eacute;fono, direcci&oacute;n, ciudad, horario, correo de contacto - todos obligatorios | FLUJO CLAUDE:139-146 |
| Datos de despacho INMUTABLES | Bloqueante | Una vez guardados, NO se pueden modificar. Cambios solo v&iacute;a chat interno | FLUJO CLAUDE:146, PS_TDX:186-195 |
| TRM actualizada | Bloqueante | Antes de montar pedido con conversi&oacute;n de moneda, es obligatorio actualizar la TRM al d&iacute;a del pedido | PS-Levantamiento req:551-554 |
| Aprobaciones previas | Bloqueante | Margen aprobado (si aplica), cartera desbloqueada (si aplica), cupo suficiente (si aplica), pago verificado (si anticipado) | FLUJO CLAUDE:115-127 |

> **Cita de Daniel** sobre datos de despacho (PS_TDX:195): *"Si inicialmente hab&iacute;an puesto esta [direcci&oacute;n] y luego el cliente les cambi&oacute;, no notificaron y la pusieron ah&iacute; y despu&eacute;s fue culpa log&iacute;stica"*

### 2.5 Validaciones en Despacho/Entrega

| Validaci&oacute;n | Tipo | Descripci&oacute;n | Fuente |
|------------|------|------------|--------|
| Permite despacho parcial | Configurable | Se define al crear el pedido. Si NO permite parcial, log&iacute;stica espera toda la mercanc&iacute;a | FLUJO CLAUDE:202-209, PS_TDX:200-204 |
| Permite facturaci&oacute;n sin confirmaci&oacute;n de entrega | Configurable | Si est&aacute; activado, se puede facturar al despachar. Si no, debe esperar confirmaci&oacute;n de entrega del cliente | FLUJO CLAUDE:224-235 |
| Permite facturaci&oacute;n parcial | Configurable | Si NO permite parcial, debe estar todo despachado y entregado antes de facturar | FLUJO CLAUDE:224-235 |

### 2.6 Validaciones en Facturaci&oacute;n

| Validaci&oacute;n | Tipo | Descripci&oacute;n | Fuente |
|------------|------|------------|--------|
| Facturar solo lo entregado | Bloqueante | Solo se puede facturar lo que est&aacute; confirmado como entregado (seg&uacute;n configuraci&oacute;n del pedido) | FLUJO CLAUDE:224-248 |
| N&uacute;mero de factura &uacute;nico | Alerta | Si un n&uacute;mero de factura ya existe en otro registro, mostrar alertamiento de duplicidad | Simulaci&oacute;n demo:257-258 |

### 2.7 Validaciones en Cierre de Pedido

| Validaci&oacute;n | Tipo | Descripci&oacute;n | Fuente |
|------------|------|------------|--------|
| Entregado 100% | Bloqueante | Todos los productos deben estar entregados | FLUJO CLAUDE:252-265 |
| Facturado 100% | Bloqueante | Todas las facturas deben estar generadas | FLUJO CLAUDE:252-265 |
| Documentaci&oacute;n completa | Bloqueante | Todos los documentos adjuntos (certificados, licencias, etc.) | FLUJO CLAUDE:255-264 |
| Certificado de licencia/software | Bloqueante | Si el pedido incluye licencia/software, debe tener el certificado con serial y vencimiento | FLUJO CLAUDE:262-264 |
| Pedidos NO se marcan como "perdidos" | Regla | Solo las cotizaciones pueden ser "perdidas". Los pedidos se **anulan** (con motivo) | FLUJO CLAUDE:268 |

### 2.8 Resumen de los 4 Tipos de Aprobaci&oacute;n del Sistema

| # | Tipo de Solicitud | Aprobador | Trigger |
|---|------------------|-----------|---------|
| 1 | Aprobaci&oacute;n de Margen | Gerencia General (Daniel Valbuena) | Margen por debajo del m&iacute;nimo configurado |
| 2 | Extra Cupo de Cr&eacute;dito | Financiera (Laura Burgos) / Daniel | Cotizaci&oacute;n excede cupo disponible |
| 3 | Montar Pedido por Cartera Retenida | Financiera (Laura Burgos) | Cliente bloqueado por mora |
| 4 | Verificaci&oacute;n de Pago | Financiera (Laura Burgos) | Cliente anticipado pag&oacute; y necesita confirmaci&oacute;n |

**Fuente**: Validaci&oacute;n PS (l&iacute;neas 2355-2358, 2410-2411)

---

## 3. NOTIFICACIONES DEL SISTEMA (Internas y Externas)

### 3.1 NOTIFICACIONES EXTERNAS (al cliente v&iacute;a WhatsApp)

#### 3.1.1 Chatbot WhatsApp - Captura de Leads

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Cliente escribe al n&uacute;mero de WhatsApp de la empresa |
| **Canal** | WhatsApp (Meta API) |
| **Destinatario** | El cliente (interactivo) |
| **Datos que solicita** | Nombre contacto, Empresa, NIT, Tel&eacute;fono, Correo electr&oacute;nico, Requerimiento espec&iacute;fico |
| **Resultado** | Se crea un Lead autom&aacute;ticamente en la plataforma y se asigna a un comercial |
| **Canales de entrada** | WhatsApp chatbot (Fase 1), Formulario web (Fase 2), Manual |

**Fuentes**:
- PS_TDX (l&iacute;neas 22-23): *"Todo lo que llegaba al WhatsApp hab&iacute;a anteriormente el chatbox... autom&aacute;ticamente se me conectaba la herramienta"*
- PS-LEVANTAMIENTO INFO (l&iacute;neas 34, 40)
- Simulaci&oacute;n demo (l&iacute;neas 12, 21)
- Validaci&oacute;n PS (l&iacute;nea 113)

> **Decisi&oacute;n de alcance** (CheckPoint PS:111-115): La integraci&oacute;n con el formulario web de contactos queda para **Fase 2** (requiere API). En Fase 1 solo entra WhatsApp chatbot. Freddy: *"Si queremos que el formulario de contactos se integre e inserte el lead, eso s&iacute; lo consideremos para una segunda fase, porque eso s&iacute; requiere una API"*

#### 3.1.2 Seguimiento Autom&aacute;tico de Cotizaciones v&iacute;a WhatsApp

**REQUISITO PRIORITARIO** - Daniel lo describi&oacute; como *"la columna vertebral de la parte comercial"*.

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Tarea programada (cron) cada **8 d&iacute;as** (configurable globalmente, NO por cotizaci&oacute;n ni por cliente) |
| **Condici&oacute;n** | Cotizaciones emitidas hace 8+ d&iacute;as sin respuesta del cliente y que siguen en estado activo |
| **Canal** | WhatsApp (template aprobado por Meta) |
| **Destinatario** | Contacto principal del cliente asociado a la cotizaci&oacute;n |
| **Contenido del template** | *"Hola [Nombre], c&oacute;mo est&aacute;s, quer&iacute;a validar c&oacute;mo vas con esta cotizaci&oacute;n"* |
| **Adjunto** | URL/link a la cotizaci&oacute;n (NO adjunto PDF directo - limitaci&oacute;n de Meta API) |
| **Interpretaci&oacute;n de respuesta (IA)** | El chatbot interpreta la respuesta del cliente y clasifica en: |
| | - *"Cliente dice que est&aacute; en validaci&oacute;n/estudio"* |
| | - *"Cliente solicita modificaci&oacute;n"* |
| | - *"Cliente indica fecha tentativa de cierre"* |
| | - *"Cliente solicita ficha t&eacute;cnica / documento adicional"* |
| | - *"Cliente rechaz&oacute; por precio"* (cotizaci&oacute;n perdida) |
| | - *"Cliente acepta"* (iniciar proceso de pedido) |
| **Resultado** | Genera notificaci&oacute;n interna al comercial con el feedback interpretado |
| **Restricci&oacute;n t&eacute;cnica** | Despu&eacute;s de 24h sin interacci&oacute;n, WhatsApp API requiere enviar un template aprobado para reabrir conversaci&oacute;n |

**Fuentes**:
- PS_TDX (l&iacute;neas 77-95): *"Como son tantas cotizaciones, pues a m&iacute; se me olvida hacer seguimiento y ser&iacute;a muy bueno que se conecte un WhatsApp"*
- PS-Levantamiento requerimientos (l&iacute;neas 231-310): Discusi&oacute;n t&eacute;cnica m&aacute;s detallada
- PS-LEVANTAMIENTO INFO (l&iacute;neas 283-298)
- FLUJO CLAUDE (l&iacute;neas 87-98)
- Validaci&oacute;n PS (l&iacute;neas 407-423)

> **Cita de Daniel** (PS_TDX:95): *"Como son tantas cotizaciones, pues a m&iacute; se me olvida hacer seguimiento y ser&iacute;a muy bueno que se conecte a la de alguna manera un WhatsApp"*

> **Cita de Daniel** (PS-Levantamiento req:256-257): *"Ese feedback... es casi que la columna vertebral de lo que estoy buscando... el punto m&aacute;s sensible que tenemos actualmente es el seguimiento, el no seguimiento de las cotizaciones"*

> **Limitaci&oacute;n t&eacute;cnica PDF** (Validaci&oacute;n PS:2200-2208): Freddy confirma: *"No va como adjunto. Eso es t&eacute;cnicamente imposible... Limitado por Meta"* - Se usa URL/link en su lugar

#### 3.1.3 Men&uacute; del Chatbot - Ruteo a &Aacute;rea Financiera

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Cliente selecciona "Otro motivo" en el men&uacute; del chatbot |
| **Canal** | WhatsApp &rarr; notificaci&oacute;n interna |
| **Destinatario** | Persona del &aacute;rea financiera |
| **Clasificaci&oacute;n** | Facturaci&oacute;n, Cartera, u otro tema financiero |
| **Estado** | **PUNTO ABIERTO** - El mecanismo exacto de c&oacute;mo llega la notificaci&oacute;n a la persona financiera no qued&oacute; definido |

**Fuente**: Validaci&oacute;n PS (l&iacute;neas 263-265): *"Y otro motivo... venga, es para temas con el &aacute;rea financiera... &iquest;C&oacute;mo va a ser esa comunicaci&oacute;n de ese chat y c&oacute;mo le va a llegar a la persona?"*

> **Contexto**: Daniel confirm&oacute; que el chatbot reemplazar&aacute; el PBX de la empresa para temas comerciales (Validaci&oacute;n PS:263): *"Este chatbox finalmente va a suplir nuestro PBX"*

### 3.2 NOTIFICACIONES INTERNAS (entre usuarios del sistema)

#### 3.2.1 Centro de Notificaciones In-App (Campanita)

| Aspecto | Detalle |
|---------|---------|
| **Ubicaci&oacute;n** | Header de la aplicaci&oacute;n, visible en todas las pantallas |
| **Comportamiento** | Similar a redes sociales: lista de eventos, clic redirige al registro y marca como le&iacute;do |
| **Filtros** | Daniel solicit&oacute; poder filtrar entre notificaciones le&iacute;das y pendientes |
| **Historial** | Se mantiene el historial completo de notificaciones |

**Fuentes**:
- Simulaci&oacute;n demo (l&iacute;neas 28-36): *"Vas a tener la campanita, con todas las notificaciones, como yo te lo dije, en redes sociales"*
- CheckPoint PS (l&iacute;neas 416-426)

> **Cita de Daniel** (Simulaci&oacute;n demo:31): *"En la campanita, ah&iacute; la idea es hacer filtro. Lo que ya est&aacute; chuleado, que ya visto, perfecto, y solamente c&oacute;mo dejarlo pendiente"*

#### 3.2.2 Notificaci&oacute;n de Asignaci&oacute;n de Lead

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Sistema asigna aleatoriamente un lead a un comercial |
| **Canal** | In-app (campanita) |
| **Destinatario** | Comercial asignado |
| **Contenido** | Nuevo lead asignado con datos b&aacute;sicos |

**Fuentes**:
- PS-LEVANTAMIENTO INFO (l&iacute;neas 55, 61): *"Se le env&iacute;a una notificaci&oacute;n de asignaci&oacute;n al comercial, que fue asignado"*
- FLUJO CLAUDE (l&iacute;neas 14-15)

#### 3.2.3 Notificaci&oacute;n por @Menci&oacute;n en Notas Internas

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Usuario escribe `@NombreUsuario` en una nota/observaci&oacute;n de cualquier registro (lead, cotizaci&oacute;n, pedido) |
| **Canal** | In-app (campanita) |
| **Destinatario** | Usuario mencionado |
| **Sin @menci&oacute;n** | La nota queda solo en trazabilidad, sin notificar a nadie |

**Fuente**: Simulaci&oacute;n demo (l&iacute;neas 163-166): *"Si yo le pongo arroba, se va para tu campana, te notifica a ti. Si no le pongo la arroba, me voy a quedar netamente en la trazabilidad de la cotizaci&oacute;n, pero pues no voy a notificar a nadie"*

#### 3.2.4 Chat Interno por Registro + Copia por Correo Electr&oacute;nico

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Usuario env&iacute;a mensaje en el chat interno de un lead/cotizaci&oacute;n/pedido |
| **Canal** | In-app (chat) + **correo electr&oacute;nico** a destinatarios seleccionados |
| **Selecci&oacute;n de destinatarios** | El remitente elige manualmente a qui&eacute;n enviar copia por email |
| **Metadata registrada** | Fecha, hora, remitente, destinatarios copiados |
| **Inmutabilidad** | Los mensajes NO se pueden eliminar |
| **Uso principal** | Log&iacute;stica notifica: env&iacute;os, gu&iacute;as, entregas parciales, novedades |

**Ejemplo de uso**: *"Buen d&iacute;a, confirmo env&iacute;o por transportadora TCC, productos: [lista], gu&iacute;a: [n&uacute;mero]"*

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 210-214)
- PS-LEVANTAMIENTO INFO (l&iacute;neas 453-457): *"En un chat interno que llega por correo electr&oacute;nico... todo lo hacemos ac&aacute; en ese chat, que le llega por notificaci&oacute;n, por correo electr&oacute;nico y que aqu&iacute; guardado"*
- PS-Levantamiento requerimientos (l&iacute;neas 432-434): *"Aqu&iacute; es importante que nos aparezca el d&iacute;a y la hora en el cual fue enviado el mensaje. O sea, de y para... qui&eacute;n estuvo comunicado en esto"*

> **Decisi&oacute;n clave**: Daniel dijo que **NO** es necesario enviar notificaci&oacute;n autom&aacute;tica por correo a log&iacute;stica cuando se crea una orden de compra, porque Andr&eacute;s ya la env&iacute;a manualmente con copia a log&iacute;stica. (PS-LEVANTAMIENTO INFO:344-354): *"No es necesario porque ya lo que dice Andr&eacute;s, env&iacute;a la orden de compra y copia log&iacute;stica"*

#### 3.2.5 Notificaci&oacute;n de Proforma Generada

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Laura (financiera) genera proforma desde una cotizaci&oacute;n |
| **Canal** | In-app (campanita) + el PDF queda disponible dentro de la cotizaci&oacute;n |
| **Destinatario** | Comercial due&ntilde;o de la cotizaci&oacute;n |
| **Contenido** | *"Proforma generada y almacenada exitosamente"* |
| **Objetivo** | Eliminar el paso manual donde Laura exporta PDF y env&iacute;a por correo |

**Fuentes**:
- PS-Levantamiento requerimientos (l&iacute;neas 44-54): *"Cuando Laura ya genere la proforma, este archivo quede disponible en la cotizaci&oacute;n... con alguna notificaci&oacute;n al comercial"*
- PS-LEVANTAMIENTO INFO (l&iacute;nea 275): *"El sistema tiene que almacenar esa cotizaci&oacute;n y enviarle notificaci&oacute;n al comercial en la creaci&oacute;n de la proforma"*
- Validaci&oacute;n PS (l&iacute;neas 2092-2093): *"Se notifica autom&aacute;ticamente al asesor comercial con el mensaje proforma generada y almacenada exitosamente"*

#### 3.2.6 Notificaci&oacute;n de Feedback del Cliente (desde WhatsApp)

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Cliente responde al seguimiento autom&aacute;tico de WhatsApp |
| **Canal** | In-app (campanita) |
| **Destinatario** | Comercial asignado a la cotizaci&oacute;n |
| **Contenido** | Feedback interpretado por IA: *"Cliente solicita cambio en..."*, *"Cliente dice que sigue en estudio"*, *"Cliente tiene fecha tentativa"*, *"Cliente solicita ficha t&eacute;cnica"* |

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 93-98)
- PS-LEVANTAMIENTO INFO (l&iacute;neas 289-298)
- PS-Levantamiento requerimientos (l&iacute;neas 250-264, 295-306)

#### 3.2.7 Notificaci&oacute;n de Aprobaci&oacute;n/Rechazo de Margen

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | Gerencia aprueba o rechaza una solicitud de margen |
| **Canal** | In-app (campanita) + visible en el producto de la cotizaci&oacute;n |
| **Destinatario** | Comercial que solicit&oacute; la aprobaci&oacute;n |
| **Contenido** | *"Su margen fue aprobado al X%"* o *"Su solicitud de margen fue rechazada"* |
| **Visibilidad adicional** | El margen aprobado debe aparecer en el producto para que Compras lo vea |

**Fuentes**:
- Validaci&oacute;n PS (l&iacute;neas 1899-1903, 1911-1922, 1957-1961)

> **Cita de Daniel** (Validaci&oacute;n PS:1899-1903): *"Ser&aacute; bueno que le llegue una notificaci&oacute;n al comercial... donde llega 'su margen fue aprobado, tanto por ciento'. Y que igualmente aparezca ac&aacute;"*

#### 3.2.8 Solicitudes de Aprobaci&oacute;n Financiera (solo cuando el comercial lo solicita)

| Aspecto | Detalle |
|---------|---------|
| **Trigger** | SOLO cuando el comercial genera expl&iacute;citamente una solicitud financiera (NO en cada edici&oacute;n de cotizaci&oacute;n) |
| **Canal** | In-app (campanita/solicitudes pendientes) |
| **Destinatario** | Laura Burgos (&aacute;rea financiera) |
| **Tipos** | Extra cupo, Montar pedido por cartera retenida, Verificaci&oacute;n de pago |
| **Contenido** | Incluye motivo/raz&oacute;n arrastrado desde la solicitud del comercial |

**Fuentes**:
- Validaci&oacute;n PS (l&iacute;neas 2355-2358, 2406-2411, 2475-2499)

> **Regla cr&iacute;tica** (Validaci&oacute;n PS:2475-2484): Daniel corrigi&oacute; expl&iacute;citamente: *"Ah&iacute; lo que da a entender es que cada vez que se genera o modifica una cotizaci&oacute;n, financiera va a estar notificada y pues no tiene por qu&eacute;. B&aacute;sicamente es cuando el comercial requiera una solicitud por la parte financiera"*

> **Distinci&oacute;n** (Validaci&oacute;n PS:2497-2499): *"Una aprobaci&oacute;n financiera para que quede s&uacute;per claro. Porque pueden haber aprobaciones de m&aacute;rgenes"* - Las aprobaciones de margen van a Gerencia, NO a Financiera.

### 3.3 ALERTAS VISUALES (en pantalla, no son notificaciones push)

| # | Alerta | Trigger | Ubicaci&oacute;n | Acci&oacute;n |
|---|--------|---------|----------|--------|
| 1 | Cliente bloqueado por cartera | Comercial abre cliente marcado en mora | M&oacute;dulo cliente/cotizaci&oacute;n | Puede cotizar, NO puede generar pedido |
| 2 | Margen por debajo del m&iacute;nimo | Comercial ingresa margen inferior al configurado | L&iacute;nea de producto en cotizaci&oacute;n | Modal: solicitar aprobaci&oacute;n a Gerencia |
| 3 | Correo de facturaci&oacute;n faltante | Intenta generar pedido sin correo de facturaci&oacute;n | Formulario de pedido | Bloquea generaci&oacute;n |
| 4 | Lead estancado | Lead sin cambio de estado por X tiempo configurable | Vista de leads (tarjeta) | Indicador visual rojo/alerta |
| 5 | N&uacute;mero de factura duplicado | N&uacute;mero de factura ya existe en otro registro | Campo de factura | Alerta de duplicidad |
| 6 | Margen aprobado visible | Producto tiene margen aprobado por Gerencia | Detalle del producto | Indicador con % aprobado |

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 114, 136-138)
- Simulaci&oacute;n demo (l&iacute;neas 19-21, 51-101, 163-166, 257-258)
- Validaci&oacute;n PS (l&iacute;neas 1957-1961)

### 3.4 INFRAESTRUCTURA DE NOTIFICACIONES

#### 3.4.1 Correo de Infraestructura de Plataforma

| Aspecto | Detalle |
|---------|---------|
| **Destino** | Correo corporativo designado (alias @prosuministros.com, ej: licencias@prosuministros.com) |
| **Contenido** | Notificaciones de Vercel, base de datos, Meta API, y dem&aacute;s servicios de infraestructura |
| **Uso exclusivo** | Solo para la plataforma comercial, no compartido con otros usos |

**Fuente**: CheckPoint PS (l&iacute;neas 853-870): *"Todas las notificaciones de las plataformas de la infraestructura. Toda vaina va a llegar ah&iacute;"*

### 3.5 TABLA RESUMEN DE NOTIFICACIONES

| # | Notificaci&oacute;n | Canal | Tipo | Trigger |
|---|--------------|-------|------|---------|
| 1 | Captura de lead por chatbot | WhatsApp | Externa | Cliente escribe al WhatsApp |
| 2 | Seguimiento autom&aacute;tico cotizaciones | WhatsApp (template + link PDF) | Externa | Cron cada 8 d&iacute;as |
| 3 | Ruteo "otro motivo" a financiera | WhatsApp &rarr; interna | Ext/Int | Cliente selecciona opci&oacute;n en men&uacute; |
| 4 | Centro de notificaciones (campanita) | In-app | Interna | Todos los eventos del sistema |
| 5 | Asignaci&oacute;n de lead | In-app | Interna | Asignaci&oacute;n autom&aacute;tica |
| 6 | @Menci&oacute;n en notas | In-app | Interna | Usuario escribe @nombre |
| 7 | Chat interno + copia email | In-app + Email | Interna | Usuario env&iacute;a mensaje |
| 8 | Proforma generada | In-app | Interna | Financiera genera proforma |
| 9 | Feedback del cliente (IA) | In-app | Interna | Cliente responde WhatsApp |
| 10 | Aprobaci&oacute;n/Rechazo de margen | In-app | Interna | Gerencia responde solicitud |
| 11 | Solicitud financiera | In-app | Interna | Comercial solicita expl&iacute;citamente |
| 12 | Cliente bloqueado cartera | Alerta visual | Visual | Abrir cliente en mora |
| 13 | Margen bajo m&iacute;nimo | Alerta visual (modal) | Visual | Margen < configurado |
| 14 | Correo facturaci&oacute;n faltante | Alerta visual (bloqueo) | Visual | Generar pedido sin correo |
| 15 | Lead estancado | Alerta visual | Visual | Lead sin avance X d&iacute;as |
| 16 | Factura duplicada | Alerta visual | Visual | N&uacute;mero ya existe |
| 17 | Margen aprobado visible | Indicador visual | Visual | Producto con margen aprobado |
| 18 | Infraestructura plataforma | Email corporativo | Infra | Eventos de servicios cloud |

---

## 4. GENERACION DE DOCUMENTOS PDF

### 4.1 Documentos PDF que el Sistema Debe Generar

Se identificaron **4 documentos PDF** principales que el sistema debe generar:

#### 4.1.1 Cotizaci&oacute;n (PDF)

| Aspecto | Detalle |
|---------|---------|
| **Qui&eacute;n la genera** | El comercial (exporta a PDF desde la cotizaci&oacute;n) |
| **Cu&aacute;ndo** | En cualquier momento durante la gesti&oacute;n de la cotizaci&oacute;n (incluso mientras espera aprobaci&oacute;n de margen) |
| **Contenido** | Datos del cliente, productos con orden espec&iacute;fico, precios, condiciones, vigencia |
| **Orden de productos** | Seg&uacute;n el campo "orden" definido por el comercial - **ES CR&Iacute;TICO** |
| **Campo transporte interno** | Se incluye en el c&aacute;lculo pero **NO es visible** al cliente en el PDF |
| **Numeraci&oacute;n** | Consecutivo desde 30000 |
| **Env&iacute;o al cliente** | Por correo electr&oacute;nico (adjunto PDF) o por link/URL |
| **V&iacute;a WhatsApp** | Solo por URL/link (adjuntar PDF directo es t&eacute;cnicamente imposible por limitaci&oacute;n de Meta) |

**Fuentes**:
- Kick off PROSUMINISTROS (l&iacute;neas 449-450): *"B&aacute;sicamente es el orden en que van los productos al momento de imprimirlos en el PDF. Para nosotros es crucial"*
- Validaci&oacute;n PS (l&iacute;neas 1705-1724, 1793-1794, 2200-2227)
- PS_TDX (l&iacute;nea 70): *"Aqu&iacute; lo &uacute;nico que yo hago es exportar la cotizaci&oacute;n a PDF y se la env&iacute;o al cliente"*

#### 4.1.2 Proforma (PDF)

| Aspecto | Detalle |
|---------|---------|
| **Qui&eacute;n la genera** | El SISTEMA, despu&eacute;s de que Financiera (Laura) aprueba la solicitud |
| **NO la genera** | El comercial NI Laura manualmente |
| **Cu&aacute;ndo** | Solo para clientes SIN cr&eacute;dito (pago anticipado), despu&eacute;s de que el cliente acepta la cotizaci&oacute;n |
| **Contenido** | Misma informaci&oacute;n que la cotizaci&oacute;n, pero en formato de proforma |
| **Numeraci&oacute;n** | Consecutivo propio (diferente al de cotizaci&oacute;n) |
| **Formato** | Diferente de la cotizaci&oacute;n |
| **Almacenamiento** | Se asocia autom&aacute;ticamente a la cotizaci&oacute;n correspondiente |
| **Notificaci&oacute;n** | Se notifica al comercial que la proforma fue generada |
| **Env&iacute;o al cliente** | Lo hace el COMERCIAL (no Financiera) |

**Flujo completo de Proforma:**
1. Comercial env&iacute;a cotizaci&oacute;n al cliente
2. Cliente acepta la cotizaci&oacute;n
3. Comercial solicita generaci&oacute;n de proforma al &aacute;rea financiera
4. Financiera (Laura) revisa la cotizaci&oacute;n: valida m&aacute;rgenes, que todo est&eacute; bien
5. Financiera aprueba &rarr; El sistema genera el PDF de proforma
6. PDF queda almacenado y disponible en la cotizaci&oacute;n
7. Se notifica al comercial: "Proforma generada y almacenada exitosamente"
8. El comercial env&iacute;a la proforma al cliente
9. Cliente paga
10. Comercial solicita verificaci&oacute;n de pago a Financiera
11. Financiera verifica en banco
12. Financiera aprueba &rarr; Se puede generar pedido

**Fuentes**:
- PS-LEVANTAMIENTO INFO (l&iacute;neas 253-279): *"El tema de la proforma es un tema diferente, es decir, cuando el cliente no tiene cr&eacute;dito"*
- PS-Levantamiento requerimientos (l&iacute;neas 17-54)
- Validaci&oacute;n PS (l&iacute;neas 2074-2103, 2345-2352): *"Si el cliente no tiene cr&eacute;dito, el sistema debe generar una proforma en formato PDF... pero esa la env&iacute;a el comercial, s&iacute;, pero no la genera el comercial"*

> **Cita clave de Daniel** (Validaci&oacute;n PS:2080-2084): *"Si el cliente tiene cr&eacute;dito activo, el sistema permite enviar la cotizaci&oacute;n directamente al cliente. Si el cliente no tiene cr&eacute;dito, el sistema debe generar una proforma en formato PDF con la misma informaci&oacute;n de la cotizaci&oacute;n... pero no la genera el comercial"*

#### 4.1.3 Orden de Compra (PDF)

| Aspecto | Detalle |
|---------|---------|
| **Qui&eacute;n la genera** | El sistema al crear la orden de compra |
| **Cu&aacute;ndo** | Despu&eacute;s de que el pedido est&aacute; generado y se crean las &oacute;rdenes de compra a proveedores |
| **Contenido** | N&uacute;mero de parte, cantidad, costo unitario, IVA (%), subtotal por &iacute;tem, total general |
| **Env&iacute;o** | Andr&eacute;s (Compras) la env&iacute;a por correo con copia a log&iacute;stica |

**Fuente**: FLUJO CLAUDE (l&iacute;neas 173-179)

#### 4.1.4 Remisi&oacute;n (PDF)

| Aspecto | Detalle |
|---------|---------|
| **Qui&eacute;n la genera** | El sistema |
| **Cu&aacute;ndo** | Al momento del despacho de mercanc&iacute;a |
| **Contenido** | Datos de despacho, productos enviados, cantidades, transportadora, gu&iacute;a |

**Fuente**: Simulaci&oacute;n demo (l&iacute;nea 151)

### 4.2 Reglas Transversales de los PDFs

| Regla | Detalle | Fuente |
|-------|---------|--------|
| Orden de productos | Definido por campo "orden" del comercial, NO por fecha de creaci&oacute;n | Kick off:449-450, Validaci&oacute;n PS:1705-1724 |
| Transporte interno | Se calcula pero NO se muestra al cliente en cotizaci&oacute;n/proforma | FLUJO CLAUDE:83 |
| Numeraci&oacute;n consecutiva | Cada tipo de documento tiene su propio consecutivo | Validaci&oacute;n PS:2089-2090 |
| Registro de env&iacute;o | El sistema registra fecha y hora del env&iacute;o | Validaci&oacute;n PS:2252-2253 |
| Formato nuevo | Daniel solicit&oacute; dise&ntilde;o nuevo (el actual es "demasiado cl&aacute;sico") | Kick off:527-535 |

---

## 5. GESTION DE DOCUMENTOS ADJUNTOS

### 5.1 Estructura de Carpetas por Pedido

Cada pedido debe tener **dos carpetas** organizadas para documentos adjuntos:

| Carpeta | Contenido | Qui&eacute;n la usa |
|---------|-----------|----------------|
| **Documentos Cliente** | Orden de compra del cliente, Contratos, P&oacute;lizas, Cualquier documento del cliente | Comercial |
| **Documentos Proveedor** | Cotizaciones del proveedor, Facturas de compra, RUT, Otros documentos del proveedor | Andr&eacute;s (Compras), Log&iacute;stica |

**Fuentes**:
- FLUJO CLAUDE (l&iacute;neas 180-191): *"Carpeta 'Documentos Cliente': Orden de compra del cliente, Contratos, P&oacute;lizas... Carpeta 'Documentos Proveedor': Cotizaciones del proveedor, Facturas de compra, RUT..."*
- Kick off PROSUMINISTROS (l&iacute;neas 599-603): *"Crear una carpeta que se llame documentos proveedor... y documentos cliente... para que quede de una manera exageradamente organizada"*
- PS_TDX (l&iacute;neas 443-466)

> **Cita de Daniel** (Kick off:600): *"Si no le va a parecer un chorrero de PDF y tiene que entrar a revisar qu&eacute; es de proveedor y qu&eacute; es de cliente. Documentos proveedor y documentos cliente, con eso lo manejamos de una manera exageradamente organizada"*

### 5.2 Problema Actual y Motivaci&oacute;n

| Aspecto | Detalle |
|---------|---------|
| **Proveedor anterior** | Se perdieron **5 a&ntilde;os** de documentos adjuntos almacenados en la nube del proveedor |
| **Workaround actual** | Usan un grupo en SharePoint donde ponen el pedido y adjuntan documentos |
| **Problema de seguridad** | Cualquier comercial puede acceder a cualquier pedido de cualquier otro comercial en SharePoint |
| **Expectativa** | El nuevo sistema debe tener gesti&oacute;n de documentos integrada, con acceso controlado por permisos |

**Fuentes**:
- PS_TDX (l&iacute;neas 443-452): *"Como ellos han sido tan malos proveedores, se nos borr&oacute; toda la informaci&oacute;n de 5 a&ntilde;os. Todos los adjuntos"*
- PS_TDX (l&iacute;neas 451-452): *"Tenemos un grupito en SharePoint... el problema es que cualquier comercial puede acceder a mi pedido y puede revisar toda la informaci&oacute;n"*

### 5.3 Documentaci&oacute;n como Requisito de Cierre

La documentaci&oacute;n completa es un **requisito bloqueante** para cerrar un pedido:

| Validaci&oacute;n | Detalle |
|------------|---------|
| Documentaci&oacute;n general | Toda la documentaci&oacute;n debe estar adjunta antes de poder cerrar |
| Licencias/Software | Debe tener certificado adjunto con serial, vencimiento, etc. |
| Responsable de cierre | Andr&eacute;s revisa que todo est&eacute; completo antes de cerrar |

**Fuente**: FLUJO CLAUDE (l&iacute;neas 252-265): *"Revisa que todo est&eacute; completo: Productos entregados 100%, Facturas generadas 100%, Documentaci&oacute;n adjunta (certificados, licencias, etc.)"*

---

## 6. VISITAS COMERCIALES

### 6.1 Hallazgos en las Transcripciones

Las visitas comerciales **S&Iacute;** fueron discutidas, pero como una funcionalidad deseada m&aacute;s que como un requisito de Fase 1.

#### 6.1.1 Concepto de Visitas seg&uacute;n Daniel

Las visitas est&aacute;n ligadas a la **categor&iacute;a del cliente** (clasificaci&oacute;n Pareto asignada por Daniel):

| Categor&iacute;a Cliente | Ubicaci&oacute;n | Regla de Visita |
|-------------------|----------|----------------|
| Triple A (AAA) | Bogot&aacute; | Visita presencial obligatoria, m&iacute;nimo 1 vez al mes |
| Triple A (AAA) | Fuera de Bogot&aacute; | Llamada de seguimiento, m&iacute;nimo 1 vez al mes |
| Doble A (AA) | Cualquiera | Seguimiento peri&oacute;dico (frecuencia menor) |
| B, C | Cualquiera | Seguimiento seg&uacute;n necesidad |

**Fuentes**:
- PS_TDX (l&iacute;neas 344-350, 519-525)
- Kick off PROSUMINISTROS (l&iacute;nea 519)

> **Cita de Daniel** (PS_TDX:519-525): *"Cuando yo hago la calificaci&oacute;n de clientes triple A... yo digo a un cliente triple A s&iacute; o s&iacute; lo visitas. Si es Bogot&aacute;, lo visitas una vez al mes. Si es fuera de Bogot&aacute; le tienes que hacer una llamada por tips de seguimiento... m&iacute;nimo una vez al mes te tiene que hacer una alerta. Est&aacute; pendiente esta cita"*

#### 6.1.2 Sistema Actual (No Funciona)

- En el sistema actual (Odoo) existe un m&oacute;dulo de "Tareas" que deber&iacute;a manejar visitas, pero **nunca funcion&oacute; correctamente**
- Daniel lo describi&oacute; como "demasiado b&aacute;sico"

**Fuente**: PS_TDX (l&iacute;nea 519): *"Es lo que tengo, es demasiado b&aacute;sico y lo que siempre he querido son temas bastante... que se automaticen"*

#### 6.1.3 Automatizaci&oacute;n Deseada

Daniel quiere que el sistema genere **alertas autom&aacute;ticas** cuando:
- Un cliente AAA no ha sido visitado/contactado en el mes
- Hay citas pendientes de agendar
- Se acerca la fecha de una visita programada

**Fuente**: PS_TDX (l&iacute;nea 525): *"M&iacute;nimo una vez al mes te tiene que hacer una alerta. Est&aacute; pendiente esta cita, ta, ta, ta"*

#### 6.1.4 Alcance

Las visitas comerciales como m&oacute;dulo completo parecen estar m&aacute;s orientadas a una **fase futura**. En la demostraci&oacute;n y validaci&oacute;n se mencion&oacute; como parte del concepto general de "tareas" del comercial, pero no se profundiz&oacute; en criterios de aceptaci&oacute;n detallados.

**Fuente**: PS_TDX (l&iacute;neas 344-350): Daniel lo menciona como *"visitas... cuando el comercial va y visita TDX de manera presencial"* junto con cotizaciones, pedidos y &oacute;rdenes de compra.

---

## 7. FLUJO DE APROBACION DE COMPRA

### 7.1 Resultado de la Validaci&oacute;n

**NO se discuti&oacute;** en ninguna transcripci&oacute;n un flujo de "Aprobaci&oacute;n de Compra" por parte de Gerencia entre la generaci&oacute;n del pedido y la generaci&oacute;n de la orden de compra.

Se revis&oacute; exhaustivamente en las 8 transcripciones y **no existe evidencia** de que Daniel o alg&uacute;n participante haya solicitado un paso de aprobaci&oacute;n gerencial para las compras.

### 7.2 Lo que S&Iacute; Existe (Aprobaciones Confirmadas)

Todas las aprobaciones ocurren **ANTES** de generar el pedido, no despu&eacute;s:

| # | Aprobaci&oacute;n | Momento | Aprobador |
|---|------------|---------|-----------|
| 1 | Aprobaci&oacute;n de margen | Durante la cotizaci&oacute;n (antes de pasar a pedido) | Gerencia General (Daniel) |
| 2 | Extra cupo de cr&eacute;dito | Durante la cotizaci&oacute;n (antes de pasar a pedido) | Financiera (Laura) / Daniel |
| 3 | Montar pedido con cartera retenida | Al intentar generar pedido | Financiera (Laura) |
| 4 | Verificaci&oacute;n de pago | Despu&eacute;s de proforma, antes de generar pedido | Financiera (Laura) |

### 7.3 Flujo Post-Pedido (sin aprobaci&oacute;n gerencial)

Una vez generado el pedido, el flujo de compras es:
1. Se genera la orden de compra (Andr&eacute;s la env&iacute;a al proveedor con copia a log&iacute;stica)
2. Log&iacute;stica recibe, verifica y registra ingreso de mercanc&iacute;a
3. Todo se comunica por chat interno
4. **No hay paso de aprobaci&oacute;n gerencial en este flujo**

**Fuente**: PS-LEVANTAMIENTO INFO (l&iacute;neas 330-354, 405-406)

---

## ANEXO: FUENTES Y TRANSCRIPCIONES

### Archivos Analizados

| Archivo | Fecha Reuni&oacute;n | Participantes Clave |
|---------|--------------|-------------------|
| Kick off- PROSUMINISTROS.txt | 10 Oct 2025 | Laura Martinez, Daniel Valbuena, Freddy Rincones |
| PS_TDX - PLataforma de cotizacion Odoo (2).txt | ~Oct 2025 | Daniel Valbuena, Freddy Rincones |
| PS-LEVANTAMIENTO INFO.txt | ~Oct-Nov 2025 | Laura Martinez, Daniel Valbuena, Andr&eacute;s Valbuena |
| PS-Levantamiento requerimientos.txt | 15 Oct 2025 | Laura Martinez, Daniel Valbuena, Andr&eacute;s, Emma |
| Simulaci&oacute;n demo Ps.txt | 5 Nov 2025 | Laura Martinez, Daniel Valbuena |
| CheckPoint PS.txt | 11 Dic 2025 | Laura Martinez, Daniel Valbuena, Freddy Rincones, Emma |
| Validaci&oacute;n PS.txt | 4 Dic 2025 | Laura Martinez, Daniel Valbuena, Freddy Rincones, Emma |
| FLUJO CLAUDE.txt | N/A (compilado) | Documento de referencia generado por Claude |

### Personas Clave del Cliente

| Persona | Rol | Responsabilidades en el Sistema |
|---------|-----|-------------------------------|
| Daniel Valbuena | Gerente Comercial / Due&ntilde;o | Aprobaci&oacute;n de m&aacute;rgenes, clasificaci&oacute;n de clientes, decisiones de negocio |
| Laura Burgos | &Aacute;rea Financiera | Bloqueo de cartera, generaci&oacute;n de proformas, verificaci&oacute;n de pagos, extra cupo |
| Andr&eacute;s Valbuena | Compras / Log&iacute;stica | Generaci&oacute;n de &oacute;rdenes de compra, recepci&oacute;n de mercanc&iacute;a, cierre de pedidos |
| Juan | Auxiliar Contable | Consulta de cartera con Laura y Daniel |

### Puntos Abiertos Identificados

| # | Punto Abierto | Contexto |
|---|-------------|----------|
| 1 | Mecanismo de notificaci&oacute;n al &aacute;rea financiera desde el chatbot "otro motivo" | Validaci&oacute;n PS:265 - No qued&oacute; definido c&oacute;mo le llega la notificaci&oacute;n a Laura |
| 2 | Integraci&oacute;n World Office para cupo de cr&eacute;dito autom&aacute;tico | Diferido a Fase 2 |
| 3 | Integraci&oacute;n World Office para bloqueo de cartera autom&aacute;tico | Diferido a Fase 2 |
| 4 | Integraci&oacute;n formulario web de contactos con la plataforma | Diferido a Fase 2 |
| 5 | Dise&ntilde;o del formato/template de PDFs | Daniel solicit&oacute; propuestas de dise&ntilde;o nuevas |
| 6 | Visitas comerciales como m&oacute;dulo completo | Mencionado pero sin criterios de aceptaci&oacute;n detallados |
| 7 | Lista de motivos de rechazo de lead | Daniel debe compartir la lista desplegable |

---

> **Documento generado por**: @business-analyst
> **Fecha**: 2026-02-20
> **Versi&oacute;n**: 1.0
> **Estado**: Validado contra transcripciones originales
