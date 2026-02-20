# EXTRACCION COMPLETA - Pruebas PS (20 de Febrero de 2026)

> **Reunion**: Pruebas PS - Sesion interna de revision de la plataforma
> **Fecha**: 20 de febrero de 2026, 6:25 p.m.
> **Duracion**: 1h 7m 0s
> **Participantes**: Freddy Rincones, Laura Martinez, Emma Castillo
> **Tipo**: Revision interna del equipo Cegeka - NO es reunion con cliente
> **Contexto**: Freddy presenta el estado actual de la aplicacion a Laura y Emma para identificar correcciones, faltantes y puntos a mejorar antes de las pruebas con el cliente.

---

## TABLA DE CONTENIDO

1. [Objetivo de la Reunion](#1-objetivo-de-la-reunion)
2. [Hallazgos por Modulo](#2-hallazgos-por-modulo)
3. [Bugs y Correcciones Identificados](#3-bugs-y-correcciones-identificados)
4. [Funcionalidades Faltantes](#4-funcionalidades-faltantes)
5. [Confirmaciones y Decisiones](#5-confirmaciones-y-decisiones)
6. [Validaciones del Pipeline Confirmadas](#6-validaciones-del-pipeline-confirmadas)
7. [Proximos Pasos](#7-proximos-pasos)

---

## 1. OBJETIVO DE LA REUNION

Freddy explica el objetivo al inicio (linea 10):
> *"Muy alto nivel y lo que quiero, el objetivo aca es que yo te voy a dar un paseo completo de todo lo que se ha hecho. Pero yo quiero que te enfoques en los detalles de logicas, funcionalidades, todo lo que llegaste a validar con el equipo de Prosuministros en general, me preguntes a ver si esta configurado de alguna manera y poder avanzar."*

---

## 2. HALLAZGOS POR MODULO

### 2.1 Modulo Dashboard

**Estado**: Funcional con correcciones pendientes.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Dashboard requiere rango de fechas para cargar | Bug | Deberia mostrar datos sin necesidad de seleccionar fechas | 12 |
| Etiqueta "ganadas y ganadas" duplicada | Bug | En la tarjeta "Cotizaciones por asesor", al hacer hover sobre el grafico de Andrea asesora, muestra "ganadas 6 y ganadas 3". Una de las "ganadas" deberia decir "perdidas" | 14 |
| Dashboard operativo - contenido a validar | Pendiente | "Distribucion por estados, completados, disponibles, pedidos por semana" - hay que confirmar con Daniel que informacion necesita ver exactamente | 14 |
| Daniel tenia un tablero gigante en Odoo | Contexto | Laura confirma que Daniel tenia mucha informacion pero no sabia que le servia: *"El veia tanta informacion que al final no sabia que le servia"* | 15-19 |
| Existe modulo de reportes separado | Info | Freddy confirma que hay un modulo de reportes con toda la informacion detallada, separado del dashboard | 22 |

### 2.2 Modulo Leads

**Estado**: Funcional con ajustes pendientes en el flujo de conversion.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Leads se crean y quedan en estado "pendiente" | Funcional | Correcto segun diseno | 26 |
| Falta integracion WhatsApp para leads | Pendiente | Los leads del chatbot WhatsApp deben caer automaticamente en este modulo | 26 |
| Flujo "Convertir" no esta claro | Critico | Cuando se le da "Convertir" a un lead, que debe pasar? Segun HUs originales: crear cotizacion. Segun lo que Daniel dijo ayer (19 Feb): pasar a modulo Clientes y desde ahi crear cotizacion | 26-31 |
| Validacion de duplicados en leads | Faltante | No existe validacion de NIT/empresa duplicada al crear un lead. Emma pregunta: *"Cuando tu colocas la empresa, te aparece la empresa ya existente o si tu colocas el NIT te dice que esa empresa ya existe?"*. Freddy confirma que NO existe esta validacion | 170-176 |

**Decision pendiente sobre flujo de conversion de Lead:**

Laura explica (linea 31):
> *"El flujo era tu pasabas del lead y cuando lo convertias, es cuando el asesor de manera manual decide si efectivamente es un cliente potencial o no es spam. Cuando lo conviertes, lo conviertes a una cotizacion. Asi lo tenia yo en mi cabeza, pero ayer con lo que el dijo es que el quiere pasar de leads a clientes."*

### 2.3 Modulo Cotizaciones

**Estado**: Funcional con correcciones en estados y alertas.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| TRM automatica | Funcional | Ya se toma la informacion del TRM de forma automatica | 32 |
| Workbench de cotizaciones funcional | Funcional | Se pueden agregar productos, seleccionar contacto del cliente, liquidacion visible | 40-43 |
| Bloqueo de cartera - alerta faltante | Faltante | Laura indica que cuando un cliente tiene bloqueo de cartera, SIEMPRE debe aparecer una alerta visible: *"Si tu en el formulario le pones el clic en bloqueo de cartera, siempre te tiene que aparecer que el esta bloqueado, como una alerta"* | 57 |
| Bloqueo NO lo hace el comercial | Confirmacion | El bloqueo de cartera lo activa Daniel o Laura (financiera), NO el comercial. El comercial solo ve la alerta | 59-62, 246 |
| Aprobacion de margen - opcion existe pero da error | Bug | En los 3 puntitos de la cotizacion existe la opcion "Aprobacion de margen" pero al darle clic da error | 74 |
| PDF de cotizacion funciona | Funcional | Se genera y se muestra correctamente | 76 |
| Arrastrar tarjetas en Kanban no funciona | Bug | No se puede mover la tarjeta de cotizacion entre columnas en la vista Canvas/Kanban | 86 |
| Crear cotizacion desde lead | Faltante | Cuando se convierte un lead, deberia disparar la modal de crear cotizacion. Esa relacion no existe aun | 192 |
| Liquidacion de cotizacion | Confirmado | Es el total/subtotal de la cotizacion. NO sale en el documento PDF al cliente, es solo interno | 265-272 |

**Estados de cotizacion - CORRECCION REQUERIDA:**

Freddy lista los estados actuales en la aplicacion (linea 192):
> *"Creacion de oferta, negociacion, riesgo, aprobacion, pendiente, aprobada, rechazada, vencida"*

Los estados correctos segun Daniel (confirmado en lineas 207-211):

| Estado Correcto | En la app actual | Accion |
|----------------|-----------------|--------|
| Creacion de Oferta / Envio Cotizacion | Creacion de oferta | OK (mantener) |
| En Negociacion | Negociacion | OK |
| Riesgo | Riesgo | OK |
| Pendiente Orden de Compra | No existe como tal | AGREGAR |
| Perdida (con motivo) | No existe | AGREGAR |
| Convertida a Pedido | No existe | AGREGAR |
| Rechazada (con motivo) | Rechazada | OK |
| Vencida | Vencida | VALIDAR si debe existir |
| ~~Aprobacion~~ | Existe en morado | ELIMINAR |
| ~~Aprobada~~ | Existe en verde | ELIMINAR |
| ~~Borrador~~ | Existe | EVALUAR si mantener |

Freddy confirma la regla critica (linea 211):
> *"Daniel fue muy claro que no pueden haber mas estados en el pipeline. Cualquier otro estado que se necesite debe manejarse como notificaciones, bitacora o log de movimiento de la cotizacion sin alterar las cuatro columnas del Kanban."*

### 2.4 Modulo Pedidos

**Estado**: Funcional con multiples puntos a corregir.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Pedido se crea desde cotizacion | Confirmado | Laura confirma: *"Un pedido si o si tiene que salir de una cotizacion"* | 89 |
| Boton "Crear pedido" en cotizacion | Funcional parcial | Existe pero hay que verificar que funcione correctamente la relacion | 80-91 |
| Facturacion total/parcial debe estar en Pedidos | Confirmado | Laura confirma que facturacion NO va en cotizaciones, va en pedidos: *"En pedidos porque tu en una cotizacion no facturas"* | 93 |
| Pestanas del pedido | Funcional | Detalle, OC, Despachos, Pendientes (tareas), Trazabilidad | 110 |
| Aprobacion de compra - NO existe este flujo | Confirmado | Laura confirma que solo hay aprobaciones de margen y cartera, NO de compra: *"Solo en margen o cuando tienen bloqueo de cartera"* | 113 |
| PDF Orden de Compra funciona | Funcional | Se genera y descarga | 115 |
| PDF no permite seleccionar OC especifica | Bug | Al tener multiples ordenes de compra, el PDF no deja seleccionar cual descargar especificamente | 116 |
| Seleccionar items en despacho da error | Bug | Al intentar seleccionar items para despachar en la modal de nuevo despacho, da error | 120 |
| Estados en trazabilidad en ingles | Bug | Los estados en la trazabilidad aparecen en ingles, deben estar en espanol | 120 |
| PDF de Orden de Despacho no se genera | Bug | No se esta creando ni descargando | 218 |
| Tablero operativo de pedidos | Funcional parcial | Se ve bien pero hay que validar la correlacion entre columnas y estados | 135, 218 |
| Remision - documento PDF | Pendiente | Existe la referencia en el tablero operativo pero hay que verificar si el PDF se genera | 218 |

### 2.5 Modulo Financiero

**Estado**: NO EXISTE en la aplicacion actual. Esta en Figma pero no se desarrollo.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Modulo financiero no esta en la aplicacion | Critico | Esta en el template de Figma pero no en la app. Posiblemente esta desarrollado pero no se muestra | 177-180 |
| Que hace Laura Burgos (financiera) | Confirmado | Laura Martinez confirma: *"En el modulo financiero, ella solamente mira la cartera de los clientes y adjunta el pago del pedido"* | 181 |
| Flujo de bloqueo de cartera | Confirmado | Laura (financiera de Prosuministros) entra, selecciona clientes, registra bloqueo de cartera manualmente. Esa informacion se refleja automaticamente en cotizaciones y pedidos | 239-246 |
| Misma fuente de clientes | Confirmado | Los clientes en el modulo financiero deben ser los MISMOS que en cotizaciones y pedidos | 240 |
| No existe HU del modulo financiero | Observacion | Emma pregunta: *"Sera que porque no tiene un HU?"* | 179 |

### 2.6 Tablas Maestras (Clientes, Proveedores, Productos)

**Estado**: Parcialmente desarrollado. Identificado como faltante critico.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| 3 tablas maestras basicas faltantes | Critico | Despues de la reunion con Daniel (19 Feb) se identifico que faltan: tabla de Clientes, tabla de Proveedores, tabla de Productos | 137 |
| Cliente - informacion requerida | Requisito | El debe ver: que asesor tiene asignado, que cotizaciones se le mandaron, que pedidos tiene, que visitas se realizaron | 141 |
| Contactos de clientes | Faltante | Daniel no mostro como estan los contactos de los clientes. Un cliente puede tener N contactos | 167-169 |
| Proveedores - tabla simple | Requisito | Tabla maestra de proveedores | 163 |
| Productos | Requisito | Tabla maestra de productos | 137 |
| Migrar datos desde Odoo/Bemeo | Pendiente | Hay que ver como extraer datos de clientes, proveedores y productos del sistema actual | 163-166, 228 |
| Filtros por estado | Pendiente | Todos los modulos manejan un filtro similar. Hay que validar que los filtros coincidan con los estados correctos | 147 |

### 2.7 Modulo de Visitas Comerciales

**Estado**: No desarrollado. Confirmado que SI fue discutido en transcripciones.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Visitas NO estan documentadas en HU | Critico | Laura confirma: *"Esa parte de las visitas no esta en ningun archivo. Yo creo que no se si Dani lo hablo contigo, pero conmigo no"* | 144 |
| Visitas SI fueron discutidas | Confirmado | Freddy valida en transcripciones: Daniel las menciono en el kickoff como funcionalidad del MVP: cotizaciones, pedidos, ordenes de compra y visitas | 153-157 |
| Reglas de visitas | Confirmado | Triple A en Bogota = visita mensual. Fuera de Bogota = llamada de seguimiento mensual | 157 |
| Donde se registran | Dentro del modulo de Clientes | En el detalle del cliente, donde el asesor gestiona su pipeline comercial | 161-163 |

### 2.8 Modulo WhatsApp

**Estado**: Pendiente por restriccion externa.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Funciona aparte | Info | El modulo de WhatsApp es independiente | 184 |
| Falta numero de telefono | Bloqueante | Prosuministros sigue sin dar el numero de WhatsApp | 184 |
| Meta no confirma restricciones | Bloqueante | Meta aun no confirma si siguen restringidos | 184 |

### 2.9 Modulo Administrador

**Estado**: Funcional parcial.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Roles activos | Funcional | Se ven los roles configurados | 184 |
| Usuarios con roles asignados | Funcional | Usuarios tienen roles | 184 |
| Permisos no funcionan | Bug | Dice que no tiene ningun tipo de permisos | 184 |
| Auditoria no funciona correctamente | Bug | El modulo de auditoria no esta funcionando | 184 |

### 2.10 Modulo Notificaciones

**Estado**: Existe en sidebar. Confirmaciones importantes sobre alcance.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Notificaciones SOLO internas | Confirmado | Laura confirma: *"Ellos siempre pidieron notificaciones internas, nunca hablaron de notificaciones por correo"* | 254 |
| NO hay notificaciones por email | Confirmado | Daniel no queria notificaciones por correo electronico | 187 |
| Aprobaciones de margen van al sidebar | Confirmado | Las aprobaciones de margen deben llegar como notificacion al sidebar de Daniel | 70-71 |
| Todos los modulos deben tener @mencion | Requisito | Freddy confirma que todos los modulos deben tener opcion de etiquetar/taggear observaciones con @usuario | 188-191 |
| Referencia al sistema actual de Odoo | Contexto | Emma recuerda que Daniel se taggeaba con su equipo y se enviaban cosas por correo para revisar estatus. Ahora eso se maneja con notificaciones internas | 249-253 |

### 2.11 Documentos PDF

**Estado**: Parcialmente funcional.

| Documento | Estado | Donde se genera | Linea |
|-----------|--------|----------------|-------|
| PDF Cotizacion | Funcional | Modulo Cotizaciones | 76 |
| PDF Proforma | Pendiente verificar | Modulo Cotizaciones (lo genera financiera) | 256 |
| PDF Orden de Compra | Funcional (con bug de seleccion) | Modulo Pedidos | 115-116 |
| PDF Orden de Despacho | No funciona | Modulo Pedidos | 218 |
| PDF Remision | Pendiente verificar | Modulo Pedidos (logistica) | 218 |

Freddy confirma los 4 PDFs principales (linea 256):
> *"PDF solamente son cuatro: remision, orden de compra, proforma... y cotizacion"*

**Flujo de Proforma confirmado** (linea 256):
> *"Solo para clientes sin credito, pago anticipado. Cuando el area financiera lo aprueba. Comercial genera la cotizacion, el cliente dice hagamos negocio, genera la proforma para pagar. Comercial envia la solicitud al area financiera. Asesor financiero entra, revisa la cotizacion, valida margenes y que todo este correcto. El asesor financiero selecciona generar proforma. El sistema genera un PDF y lo asocia a la cotizacion. El sistema notifica al comercial: proforma generada y almacenada exitosamente."*

> *"Datos claves: esa la envia el comercial, si, pero no la genera el comercial. Explicito que dijo Daniel."*

### 2.12 Gestion de Documentos Adjuntos

**Estado**: No implementado. Confirmado como requerimiento.

| Hallazgo | Tipo | Detalle | Linea |
|----------|------|---------|-------|
| Si se hablo de documentos adjuntos | Confirmado | Freddy valida en transcripciones: es un requerimiento fuerte, especialmente para pedidos | 273 |
| 2 carpetas por pedido | Confirmado | Carpeta "Documentos Cliente" y Carpeta "Documentos Proveedor" | 273 |
| Contexto del problema | Info | Emma recuerda que Daniel mostraba su SharePoint/OneDrive y dijo que no todos pueden ver todos los documentos | 259 |
| Laura: visualizar y descargar | Confirmado | *"Lo que hablamos era que ellos pudieran ver los documentos en el aplicativo y ellos mismos los descargaban si los necesitaban"* | 274 |
| Componente necesario | Desarrollo | Freddy indica: necesitamos un componente tipo pestana de documentos con la distribucion por tipo y segregacion de carpetas | 276 |

---

## 3. BUGS Y CORRECCIONES IDENTIFICADOS

| # | Modulo | Bug/Correccion | Severidad | Linea |
|---|--------|---------------|-----------|-------|
| 1 | Dashboard | Requiere rango de fechas para cargar (deberia cargar sin filtro) | Media | 12 |
| 2 | Dashboard | "Ganadas y ganadas" - una deberia decir "perdidas" | Baja | 14 |
| 3 | Cotizaciones | Aprobacion de margen (3 puntitos) da error al hacer clic | Alta | 74 |
| 4 | Cotizaciones | No se puede arrastrar tarjetas en vista Kanban/Canvas | Media | 86 |
| 5 | Cotizaciones | Estados incorrectos - hay que eliminar "Aprobacion" y "Aprobada", agregar "Pendiente OC", "Perdida", "Convertida a Pedido" | Alta | 192, 207-211 |
| 6 | Pedidos | PDF de Orden de Compra no permite seleccionar OC especifica cuando hay multiples | Media | 116 |
| 7 | Pedidos | Seleccionar items en modal de nuevo despacho da error | Alta | 120 |
| 8 | Pedidos | Estados en trazabilidad aparecen en ingles | Baja | 120 |
| 9 | Pedidos | PDF de Orden de Despacho no se genera/descarga | Alta | 218 |
| 10 | Admin | Permisos dicen "no tiene ningun tipo de permisos" | Alta | 184 |
| 11 | Admin | Modulo de auditoria no funciona correctamente | Media | 184 |

---

## 4. FUNCIONALIDADES FALTANTES

| # | Funcionalidad | Modulo | Prioridad | Detalle | Linea |
|---|-------------|--------|-----------|---------|-------|
| 1 | Modulo Financiero | Financiero | Critica | No existe en la app. Laura (financiera) necesita: ver cartera de clientes, registrar bloqueos, adjuntar pagos | 177-181 |
| 2 | Tabla maestra Clientes | Clientes | Critica | Con asesor asignado, cotizaciones, pedidos, visitas, contactos multiples | 137-141, 167 |
| 3 | Tabla maestra Proveedores | Proveedores | Alta | Tabla simple de proveedores | 137, 163 |
| 4 | Tabla maestra Productos | Productos | Alta | Catalogo de productos | 137 |
| 5 | Relacion Lead -> Cotizacion | Leads/Cotizaciones | Critica | El boton "Convertir" en lead debe disparar creacion de cotizacion (o pasar a Clientes segun Daniel) | 26-31, 192 |
| 6 | Alerta de bloqueo de cartera | Cotizaciones | Alta | Alerta visual permanente cuando el cliente esta bloqueado | 57 |
| 7 | Flujo automatico: bloqueo de cartera desde financiero | Financiero -> Cotizaciones | Alta | Cuando financiera bloquea un cliente, automaticamente se refleja en cotizaciones y pedidos | 239-246 |
| 8 | @Mencion en todos los modulos | Global | Media | Capacidad de etiquetar usuarios en observaciones/notas de cualquier modulo | 188-191 |
| 9 | Gestion de documentos adjuntos | Pedidos | Alta | Pestana de documentos con 2 carpetas (Cliente/Proveedor), visualizacion y descarga | 259-276 |
| 10 | Visitas comerciales | Clientes | Media | Registro de visitas del asesor al cliente, vinculado a categoria del cliente | 144-163 |
| 11 | Validacion de NIT/empresa duplicada | Leads | Media | Al crear lead, validar si la empresa/NIT ya existe en clientes o contactos | 170-176 |
| 12 | PDF Proforma | Cotizaciones | Alta | Generacion desde el modulo financiero, asociado a la cotizacion | 256 |
| 13 | PDF Remision | Pedidos | Alta | Documento de remision para logistica | 218 |

---

## 5. CONFIRMACIONES Y DECISIONES

### 5.1 Decisiones Confirmadas en esta Reunion

| # | Decision | Quien confirma | Linea |
|---|---------|---------------|-------|
| 1 | Facturacion total/parcial va en Pedidos, NO en Cotizaciones | Laura | 93 |
| 2 | Bloqueo de cartera lo activa Daniel o Laura (financiera), NO el comercial | Laura | 59, 246 |
| 3 | Unicas aprobaciones son: margen y cartera. NO hay aprobacion de compra | Laura | 113 |
| 4 | Notificaciones son SOLO internas (in-app), NO por email | Laura | 187, 254 |
| 5 | Pedido si o si sale de una cotizacion | Laura | 89 |
| 6 | Proforma la envia el comercial, pero NO la genera el comercial | Freddy (citando a Daniel) | 256 |
| 7 | Liquidacion de cotizacion no sale en el PDF al cliente | Laura | 270-272 |
| 8 | 4 estados del pipeline Kanban: Envio, Negociacion, Riesgo, Pendiente OC | Freddy (citando a Daniel) | 207-211 |
| 9 | No pueden haber mas estados en el pipeline | Freddy (citando a Daniel) | 211 |
| 10 | Documentos adjuntos si se deben gestionar (2 carpetas por pedido) | Freddy (validado en transcripciones) | 273-276 |
| 11 | Visitas comerciales son parte del MVP | Freddy (validado en transcripciones) | 153-161 |

### 5.2 Aprobacion de Compra por Gerencia - NO EXISTE

Freddy valida en transcripciones y confirma (linea 256):
> *"Aprobacion de compra por gerencia. Respuesta: no se hablo de un flujo de aprobacion de compra por gerencia en ninguna de las transcripciones. Revise eso exhaustivamente y nada. El flujo que se describe en todas las transcripciones es directo: Andres crea la orden de compra sin paso intermedio de aprobacion."*

Laura habia confirmado antes (linea 113):
> *"Solo en margen o cuando tienen bloqueo de cartera"* (preguntada si hay compras que necesitan ser aprobadas por Daniel).

---

## 6. VALIDACIONES DEL PIPELINE CONFIRMADAS

Freddy lee el consolidado de validaciones durante la reunion y Laura confirma (lineas 301-304). Las validaciones son:

### 6.1 Lead
- Datos minimos obligatorios del lead
- Descarte con motivo obligatorio (lista desplegable)

### 6.2 Creacion de Cotizacion
- No dejar crear sin: NIT, contacto principal, actividad economica, asunto, via de contacto
- Email de facturacion: no obligatorio aqui, se valida al generar pedido
- IVA: solo valores validos (0%, 5%, 19%). Rechazar cualquier otro
- Proveedor sugerido obligatorio por producto
- Tiempo de entrega obligatorio por producto
- Garantia de producto obligatoria
- Orden de aparicion en el PDF obligatorio

### 6.3 Validacion de Margen
- Margen minimo configurable por categoria + credito
- Si margen es bajo: solicitud de aprobacion a Gerencia General (Daniel)

### 6.4 Aprobaciones Financieras
- Bloqueo de cartera: aviso visual, bloquea paso a pedido
- Cupo de credito disponible
- Verificacion de pago (anticipado)

### 6.5 Generacion de Pedido
- Email de facturacion diligenciado (bloqueante)
- Informacion de despacho completa (bloqueante)
- Info despacho NO modificable despues de guardar (cambios solo via chat interno)
- Configuracion de despacho y facturacion (parcial o total)

### 6.6 Ordenes de Compra
- Cantidad a comprar <= cantidad del pedido
- Campos obligatorios: nombre, cantidad, costo unitario, moneda, garantia

### 6.7 Despacho / Logistica
- Si no permite despacho parcial, debe despachar 100%
- Despachado es diferente de entregado
- Informacion del transporte obligatoria

### 6.8 Facturacion
- Solo mostrar en "pendientes por facturar" si se cumplen condiciones segun configuracion del pedido

### 6.9 Cierre de Pedido
- 100% facturado
- 100% entregado
- Toda la documentacion adjunta
- Pedidos NO se marcan como "perdidos" (eso es solo para cotizaciones)
- Pedidos incompletos no se pueden cerrar

Laura confirma todo (linea 304):
> *"No, yo lo veo bien. Yo lo veo bien."*

---

## 7. PROXIMOS PASOS

Acordados al final de la reunion (lineas 305-327):

| # | Accion | Responsable |
|---|--------|-------------|
| 1 | Consolidar todos los hallazgos de esta reunion con la documentacion existente | Freddy |
| 2 | Actualizar los puntos adicionales en la plataforma | Freddy |
| 3 | Realizar retesting la semana siguiente | Freddy |
| 4 | Intentar dejar el desarrollo listo la proxima semana | Freddy |
| 5 | Validar el proceso y pantallas desde Bemeo (sistema Odoo actual) | Emma |
| 6 | Descargar data de clientes/proveedores/productos desde Bemeo | Emma |
| 7 | Verificar campos en cotizaciones y clientes de Bemeo que no se usan | Emma |
| 8 | Buscar el brandbook/logo de Prosuministros en la carpeta PM | Laura |

---

## ANEXO: DATOS DE CONTEXTO MENCIONADOS

### Reunion del dia anterior (19 Feb 2026) con Daniel

Se hacen varias referencias a una reunion que tuvieron con Daniel el dia anterior:

- Daniel mostro clientes pero no mostro contactos de clientes
- Daniel dijo que quiere pasar de leads a clientes (no directo a cotizacion)
- Se identificaron las 3 tablas maestras faltantes (clientes, proveedores, productos)
- Se vieron 5 formatos de impresion/documentos (Emma lo recuerda)
- Daniel exporto datos y se los paso al equipo
- Hay muchos datos en cotizaciones y clientes de Bemeo que no usan

### Sobre el sistema actual (Bemeo/Odoo)

- Bemeo es el nombre del sistema Odoo que actualmente usa Prosuministros
- Tiene un dashboard gigante con mucha informacion que Daniel no sabe que le sirve
- Manejan tageo entre ellos y se envian cosas por correo internamente
- Los documentos estan en SharePoint/OneDrive con problemas de acceso

---

> **Documento generado por**: @business-analyst
> **Fecha**: 2026-02-20
> **Version**: 1.0
> **Tipo**: Extraccion de sesion interna de pruebas
