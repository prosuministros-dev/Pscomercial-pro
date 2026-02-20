# CONSOLIDADO - DOCUMENTOS GENERALES DE NEGOCIO

**Proyecto:** Pscomercial-pro (PROSUMINISTROS)
**Fecha de consolidación:** 2026-02-11
**Fuentes:** 5 archivos originales (3 Word, 2 Excel) → 18 archivos .md extraídos

---

## 1. CATÁLOGOS Y DATOS MAESTROS

### 1.1 Formas de Pago
| Forma de Pago |
|---|
| ANTICIPADO |
| CONTRA ENTREGA |
| CRÉDITO 8 DÍAS |
| CRÉDITO 15 DÍAS |
| CRÉDITO 30 DÍAS |
| CRÉDITO 45 DÍAS |
| CRÉDITO 60 DÍAS |

**Regla**: Los clientes creados por comerciales quedan con forma de pago "ANTICIPADO" por defecto. Solo Financiera o Gerencia pueden cambiar la forma de pago.

### 1.2 Monedas
| Moneda |
|---|
| PESOS COLOMBIANOS (COP) |
| DÓLARES (USD) |

### 1.3 Vías de Contacto (Canales de Lead)
| Canal |
|---|
| ESTRATEGIA ASUS |
| ESTRATEGIA DELL |
| ESTRATEGIA GOOGLE |
| ESTRATEGIA LENOVO |
| ESTRATEGIA TELEMERCADEO |
| EXISTENTE |
| GESTIÓN COMERCIAL |
| REFERENCIADO |

### 1.4 Verticales y Subverticales
| Vertical |
|---|
| ACCESORIOS |
| HARDWARE |
| OTROS |
| SERVICIOS |
| SOFTWARE |

### 1.5 Márgenes Mínimos por Vertical y Forma de Pago

| Forma de Pago | Accesorios | Hardware | Otros | Servicios | Software |
|---|:---:|:---:|:---:|:---:|:---:|
| ANTICIPADO | 7% | 7% | 7% | 7% | 5% |
| CONTRA ENTREGA | 7% | 7% | 7% | 7% | 5% |
| CRÉDITO 8 DÍAS | 7% | 7% | 7% | 7% | 5% |
| CRÉDITO 15 DÍAS | 7% | 7% | 7% | 7% | 5% |
| CRÉDITO 30 DÍAS | 7% | 7% | 7% | 7% | 5% |
| CRÉDITO 45 DÍAS | 9% | 9% | 9% | 9% | 7% |
| CRÉDITO 60 DÍAS | 11% | 11% | 11% | 11% | 9% |

**Fórmula de margen**: `Margen (%) = 1 - (Total costo / Total venta)`

### 1.6 Impuestos Aplicables
| IVA |
|---|
| 0% |
| 5% |
| 19% |

---

## 2. CREACIÓN DE CLIENTE (Matriz de Permisos)

| Campo | Obligatorio | Gerencia General | Gerencia Comercial | Comerciales | Compras | Aux. Financiera | Aux. Administrativa | Jefe Bodega | Aux. Bodega |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| NIT con dígito verificación | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Razón social | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Dirección | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Ciudad | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Departamento | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Teléfono principal | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO | NO | NO | NO |
| Correo de facturación | NO | NO | NO | NO | NO | Crear/Modificar | NO | NO | NO |
| Forma de pago | NO | Crear/Modificar | NO | NO | NO | Crear/Modificar | NO | NO | NO |
| Comercial asignado | SÍ | Modificar | Modificar | NO | NO | NO | NO | NO | NO |

**Contactos del cliente** (puede haber múltiples):

| Campo | Obligatorio | Gerencia | Gerencia Comercial | Comerciales |
|---|:---:|:---:|:---:|:---:|
| Nombre | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar |
| Teléfono | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar |
| Correo electrónico | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar |

---

## 3. CREACIÓN DE PRODUCTO (Matriz de Permisos)

| Campo | Obligatorio | Gerencia General | Gerencia Comercial | Comerciales | Resto |
|---|:---:|:---:|:---:|:---:|:---:|
| Número de parte | SÍ | Crear/Modificar | Crear | Crear | NO |
| Nombre del producto | SÍ | Crear/Modificar | Crear | Crear | NO |
| Vertical | SÍ | Crear/Modificar | NO | NO | NO |
| Marca | SÍ | Crear/Modificar | NO | NO | NO |
| Impuesto (0%/5%/19%) | SÍ | Crear/Modificar | NO | NO | NO |

---

## 4. LEADS

### 4.1 Campos del Lead
| Campo | Tipo |
|---|---|
| Número de Lead | Auto-generado desde #100 |
| Fecha del Lead | Automática |
| Razón social | Obligatorio |
| NIT | Obligatorio |
| Nombre del contacto | Obligatorio |
| Celular del contacto | Obligatorio |
| Correo electrónico | Obligatorio |
| Requerimiento | Obligatorio |

### 4.2 Reglas
- Consecutivo inicia en **100**
- Asignación automática a los comerciales configurados por Gerencia
- Todo lead debe convertirse en cotización en máximo **1 día**, si no → alerta de demora
- Los leads pendientes deben aparecer en pestaña de notificaciones

---

## 5. COTIZACIÓN (Campos y Permisos Detallados)

### 5.1 Datos Generales de Cotización

| Campo | Obligatorio | Gerencia | Ger. Comercial | Comerciales | Compras | Financiera |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Número cotización | SÍ | Auto (#30000) | Auto | Auto | NO | NO |
| Fecha cotización | SÍ | Auto/Editable | Auto/Editable | Auto/Editable | NO | NO |
| NIT | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Razón social | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Forma de pago | SÍ | Crear/Modificar | NO | NO | NO | Crear/Modificar |
| Cupo crédito disponible | SÍ | Auto | Auto | Auto | NO | NO |
| Contacto | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Celular contacto | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Email contacto | SÍ | Crear/Modificar | Crear/Modificar | Crear/Modificar | NO | NO |
| Asunto | SÍ | Editable | Editable | Editable | NO | NO |
| Nombre comercial | SÍ | Auto | Auto | Auto | N/A | N/A |
| % Interés (estado) | SÍ | Modificar | Modificar | Modificar | NO | NO |
| Vigencia | SÍ | Editable | Editable | Editable | NO | NO |
| Links adjuntos | NO | Editable | Editable | Editable | NO | NO |
| Condiciones comerciales | NO | Editable | Editable | Editable | NO | NO |
| Avance con cliente | NO | Editable | Editable | Editable | NO | NO |
| Datos adjuntos | NO | Editable | Editable | Editable | NO | NO |

### 5.2 Fechas de Cierre
| Campo | Obligatorio |
|---|:---:|
| Mes de cierre | SÍ |
| Semana de cierre | SÍ |
| Mes de facturación | SÍ |

### 5.3 Productos en Cotización

| Campo | Obligatorio | Gerencia | Ger. Comercial | Comerciales |
|---|:---:|:---:|:---:|:---:|
| N° de parte | SÍ | Editable | Editable | Editable |
| Observaciones producto | NO | Editable | Editable | Editable |
| Costo producto | SÍ | Modificar | Modificar | Modificar |
| Moneda costo (COP/USD) | SÍ | Modificar | Modificar | Modificar |
| Costo final (post TRM) | SÍ | Auto | Auto | Auto |
| % Utilidad | SÍ | Modificar | Modificar | Modificar |
| Precio de venta | SÍ | Modificar | Modificar | Modificar |
| IVA (0%/5%/19%) | SÍ | Modificar | Modificar | Modificar |
| Cantidad | SÍ | Modificar | Modificar | Modificar |
| Proveedor sugerido | SÍ | Modificar | Modificar | Modificar |
| Tiempo de entrega | SÍ | Editable | Editable | Editable |
| Garantía | SÍ | Editable | Editable | Editable |
| Orden (posición) | NO | Editable | Editable | Editable |

### 5.4 Observaciones Importantes
1. Se requiere poder **duplicar versiones** de una cotización seleccionando productos
2. **Liquidación visible**: Total venta antes IVA, Total costo, Utilidad, Margen general
3. **Transporte**: Casilla que pregunte si está incluido en los ítems; si no, campo para valor separado que se incluya en la liquidación

### 5.5 Estados de Cotización
- Creación de oferta
- En negociación
- Riesgo
- Pendiente por orden de compra
- Ganada (→ genera pedido)
- Perdida

---

## 6. PEDIDOS - PANEL PRINCIPAL

### 6.1 Campos del Panel

| Campo | Editable |
|---|:---:|
| Estado (En proceso / Cerrado / Perdido / Anulado) | NO |
| Número de pedido (consecutivo desde #20000, descendente) | NO |
| Cantidad pendiente por comprar | NO |
| Cliente (razón social) | NO |
| Fecha y hora | NO |
| Responsable (comercial) | NO |
| Asunto | NO |
| Subtotal | NO |
| Moneda negociación | NO |

### 6.2 Permisos del Panel
- **Financiera, Logística, Compras, Gerencia**: Visualizan todos los pedidos
- **Comercial**: Solo visualiza pedidos de **sus clientes asignados**
- **Nadie** puede crear ni editar desde el panel

### 6.3 Vista por Defecto
- Solo pedidos "En proceso"
- Ordenados por número de pedido descendente

---

## 7. PEDIDOS 1 - INFORMACIÓN GENERAL DEL PEDIDO

### 7.1 Campos Principales (heredados de cotización + operativos)

| Campo | Obligatorio | Financiera | Logística | Compras | Gerencia | Comercial |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Razón social | SÍ | Ver | Ver | Ver | Todo | Crear/Editar (1 vez) |
| NIT | SÍ | Ver | Ver | Ver | Ver | Ver |
| Contacto cliente | SÍ | Ver | Ver | Ver | Todo | Todo |
| Email cliente | SÍ | Ver | Ver | Ver | Todo | Todo |
| Teléfono | SÍ | Ver | Ver | Ver | Todo | Todo |
| Asunto | SÍ | Ver | Ver | Ver | Todo | Crear (no editar) |
| Asesor | SÍ | Ver | Ver | Ver | Todo | Ver |
| Cotización origen | SÍ | Ver | NO | Ver | Ver | Ver |
| Forma de pago | SÍ | Ver | Ver | Ver | Ver | Ver |

### 7.2 Formas de Pago en Pedido
- Crédito 8/15/30/45/60 días
- Contra entrega (solo transferencia)
- **Anticipado**: Clientes nuevos → requiere autorización financiera/gerencia antes de generar pedido

### 7.3 Confirmación de Pago (solo para Anticipado)
- Se habilita SOLO cuando forma de pago = Anticipado
- Opciones: "Pago confirmado" / "Pendiente por confirmar"
- Solo **Financiera** puede editar
- Cuando "Pago confirmado" → notificación email a Compras

### 7.4 Flujo de Facturación Anticipada
1. **Solicitud** (Gerencia/Comercial): No requerida (default) / Requerida → notificación email a Compras
2. **Aprobación** (Compras): Pendiente (default) / Aprobada → notificación email a Logística
3. **Remisión anticipada** (Logística/Compras): No generada (default) / Generada → notificación email a Financiera
4. **Factura anticipada** (Financiera): No generada (default) / Generada → notificación email a Compras y Comercial

### 7.5 Observaciones/Trazabilidad
- Cajón de observaciones con @menciones
- Cada observación enviada vía correo a los destinatarios mencionados
- Registra: remitente, destinatarios, fecha y hora
- **No editable ni borrable** por ningún usuario

---

## 8. PEDIDOS 2 - INFORMACIÓN DE DESPACHO Y LOGÍSTICA

### 8.1 Información de Despacho (solo Gerencia y Comercial, una vez)

| Campo | Obligatorio |
|---|:---:|
| Nombre de quien recibe | SÍ |
| Teléfono de quien recibe | SÍ |
| Dirección de entrega | SÍ |
| Departamento (selector 33 dptos Colombia) | SÍ |
| Ciudad | SÍ |
| Horario de entrega | SÍ |
| Email envío de guía | SÍ |
| Email envío copia factura | SÍ |

### 8.2 Selectores de Despacho/Facturación (no editables después de guardar)
1. **Tipo de despacho**: Total / Parcial
2. **Tipo de facturación**: Total / Parcial
3. **Confirmación de entrega**: Factura CON confirmación / Factura SIN confirmación

### 8.3 Destinos Múltiples
- Botón para copiar info de despacho principal
- Cajón complementario para destinos adicionales (no editable después de guardar)

### 8.4 Información de Intangibles/Licencias

#### ADP (por marca: ACER, ASUS, DELL, HP, LENOVO)
Campos: Razón social, NIT, Dirección, Ciudad, Departamento, País, Código postal, Contacto, Teléfono, Email
+ Selector: Producto en pedido / No relacionado → Si no relacionado: N° parte HW, Serial HW, Fecha compra HW

#### Enrolamiento Apple
Campos: Razón social, NIT, Dirección, Ciudad, Departamento, País, Código postal, Contacto, Teléfono, Email, ID cliente

#### Extensiones de Garantía (por marca)
Misma estructura que ADP

#### Licenciamiento (por marca)
- **Adobe, Autodesk, Cisco, Fortinet, Kaspersky**: Nuevo/Renovación
  - Campos base: Razón social, NIT, Sector económico, Contacto, Teléfono, Cargo, Dirección, Email, País, Departamento, Ciudad, Código postal
  - Renovaciones: + VIP, N° contrato/serial, Fechas inicio/fin, Serial HW
- **Microsoft**: CSP / ESD
  - CSP agrega: Cliente sin tenant / Con tenant (Tenant ID, Dominio)

#### Servicios
- Instalación: Fecha inicio, Fecha tentativa finalización, Fecha finalización proyecto
- Renting: Fecha inicio contrato, Fecha finalización contrato

### 8.5 Seguimiento de Entrega (solo Logística y Compras)
| Campo |
|---|
| Tipo despacho (Motorizado PDC / Externo PDC / Nacional PDC / Desde mayorista / Híbrido) |
| Transportadora(s) |
| Número(s) de guía |
| Fecha despacho |
| Fecha entrega |

### 8.6 Seguimiento Facturación (solo Financiera)
- Selector: Facturado parcial / Facturado total

---

## 9. CUADRO OPERATIVO SHAREPOINT (ACTUAL → DIGITALIZAR)

### 9.1 Objetivo
Replicar digitalmente el cuadro de seguimiento operativo actualmente en SharePoint/Excel, manteniendo la lógica de colores por responsable.

### 9.2 Estructura del Tablero

**Bloque Operativo** (izquierda):
| Columna |
|---|
| Proveedor |
| OC (Orden de Compra) |
| Cliente |
| OP (Orden de Pedido) |
| Producto |
| Cantidad |
| Fecha de entrega |
| Responsable |
| Novedades |

**Separador visual fijo**

**Bloque Administrativo** (derecha):
| Columna |
|---|
| REM (Remisión) |
| Factura |
| Transportadora |
| Guía |
| Obs. CRM |
| Correo U.F. (Usuario Final) |

### 9.3 Sistema de Colores por Responsabilidad

| Color | Área Responsable | Significado |
|---|---|---|
| **ROJO** | Financiera / Comercial | Bloqueos, errores en pedido, pendiente facturación, SLA 1h para corrección |
| **NARANJA** | Auxiliar de Bodega | Seguimiento despachos, confirmar guías, enviar correos al cliente |
| **MORADO** | Jefe de Bodega | Ejecución logística: recolección, remisión, ingreso mercancía |
| **AMARILLO** | Compras | Pendientes de compra, salidas almacén, tokens, licencias |
| **AZUL** | N/A | Licenciamientos y servicios recurrentes (mes/mes, anuales) |
| **VERDE CLARO** | N/A | Proceso avanzado pero no completado (en bodega, despachado no entregado) |
| **VERDE OSCURO** | N/A | Proceso completado exitosamente |

### 9.4 Reglas Clave
- Una fila puede tener **múltiples colores simultáneamente**
- Color se interpreta **por columna**, NO por fila
- Solo el **Gerente Operativo** modifica colores
- Cada cambio registra: usuario, fecha, motivo (obligatorio)
- Los colores son persistentes (no se recalculan al recargar)

### 9.5 Vista Ejecutiva Kanban (Gerente General)
- Sin colores operativos
- Agrupa en estados macro: En compras, En proveedor, En transporte, En bodega, Bloqueado, Cerrado
- Calculados automáticamente desde la lógica de colores

---

## 10. FLUJOS DE FACTURACIÓN EN PEDIDOS

### 10.1 Combinaciones de Despacho/Facturación

| Caso | Permite Facturación Parcial | Permite Entrega Parcial | Requiere Confirmación Entrega | Flujo |
|---|:---:|:---:|:---:|---|
| 1 | SÍ | SÍ | NO | Logística entrega parcial → acción a Facturación para factura parcial |
| 2 | NO | SÍ | NO | Logística entrega parcial → NO acción a Facturación hasta entrega total |
| 3 | SÍ/NO | NO | NO | Logística entrega total → acción a Facturación para factura total |
| 4 | - | - | SÍ | No se puede facturar hasta confirmación de entrega en destino final |
| 5 | - | - | NO | Se puede facturar una vez enviada la mercancía (sin confirmar entrega) |

### 10.2 Regla de Acta
- Si el pedido requiere acta para facturar → bloqueado hasta que el comercial suba el acta
- Comercial sube acta → notificación a Facturación

### 10.3 Cierre de Pedido
1. Facturación adjunta documentos al pedido
2. Compras revisa que todo esté completo
3. Compras cierra el pedido en la aplicación

---

## 11. MÓDULO SOLICITUD DE PROFORMA

**Pendiente definido en Parametrización**:
- Cuando se solicita proforma para pago del cliente, se debe hacer desde el módulo cotizaciones
- Debe existir un módulo entre cotización y pedidos para la aprobación de financiera y compras para la emisión de la proforma

---

## 12. ROLES DEL SISTEMA (CONSOLIDADO)

| Rol | Áreas de Acción |
|---|---|
| **Gerencia General** | Todo: clientes, productos, cotizaciones, pedidos, reportes, configuración |
| **Gerencia Comercial** | Clientes, cotizaciones, asignación de leads, reportes |
| **Comerciales** | Clientes, leads, cotizaciones, pedidos (propios), despacho |
| **Compras** | Órdenes de compra, seguimiento proveedores, cierre pedidos, tokens |
| **Auxiliar Financiera** | Forma pago clientes, facturación, confirmación pagos |
| **Auxiliar Administrativa** | Ningún acceso a módulos principales |
| **Jefe de Bodega** | Recolección, remisiones, ingreso mercancía, entregas |
| **Auxiliar de Bodega** | Seguimiento despachos, guías, correos a cliente, confirmaciones |
| **Gerente Operativo** | Tablero operativo (semáforo de colores), gestión diaria |

---

**Documento consolidado generado automáticamente desde:**
- Cuadro SharePoint.docx
- Modulo pedidos.docx
- PRD.docx
- Parametrización CRMv3.xlsx (5 pestañas)
- PROCESO COMERCIAL.xlsx (10 pestañas)
