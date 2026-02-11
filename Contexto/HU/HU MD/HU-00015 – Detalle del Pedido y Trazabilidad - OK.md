**HU-0015 – Detalle del Pedido y Trazabilidad**
**Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
Se requiere implementar la **vista de Detalle del Pedido**, la cual consolida **toda la información asociada a un pedido**, permitiendo su consulta completa y garantizando trazabilidad de punta a punta, desde la cotización origen hasta el estado operativo actual.
Esta vista es **exclusivamente de consulta (solo lectura para los comerciales para el rol administrador)** y reemplaza la revisión manual del Excel.

**Alcance

**Esta historia cubre:
1. Visualización completa del pedido
2. Visualización de información heredada
3. Visualización de estados y fechas
4. Historial de eventos
5. Observaciones
Cualquier funcionalidad no listada se considera **fuera de alcance explícito**.
**Descripción detallada del requerimiento**
El sistema debe permitir acceder a una vista única que muestre **toda la información asociada a un pedido**, organizada por secciones, con campos claramente identificados y **sin permitir edición consulta (solo lectura para los comerciales para el rol administrador)**.
Todos los datos deben provenir de:
1. Cotización origen
2. Pedido (Pedidos 1)
3. Procesos posteriores (OC, logística)
4. Registro automático del sistema


**Casos de Uso 
**
**CU-01: Consultar detalle del pedido**
**Actor: **Usuario autorizado**
Resultado: **Visualiza toda la información consolidada**
**
**CU-02: Consultar trazabilidad**
**Actor: **Usuario autorizado**
Resultado: **Visualiza historial cronológico

**Criterios de Aceptación 
**
**1. Identificación del pedido
**
El sistema debe mostrar los siguientes campos:

1. Número de pedido (sistema)
2. Estado actual del pedido (sistema)
3. Fecha de creación del pedido (sistema)
4. Usuario creador del pedido (sistema)
Reglas:
1. Todos los campos son obligatorios
2. Todos son de solo lectura
3. No pueden ocultarse

**
2. Información de la cotización origen
**
El sistema debe mostrar:
1. Número de cotización origen
2. Estado de la cotización
3. Fecha de aprobación de la cotización
4. Usuario aprobador
Reglas:
1. Información heredada automáticamente
2. Navegación permitida hacia la cotización
3. No editable

**
3.  Información comercial (heredada de la cotización)
**
El sistema debe mostrar:
1. Cliente
2. Identificación del cliente
3. Lista de ítems / servicios
4. Cantidad por ítem
5. Valor unitario
6. Valor total de la cotización
7. Moneda
Reglas:

1. Información no editable
2. No puede recalcularse
3. No puede reemplazarse

**
4. Condiciones operativas y financieras (Pedidos 1)
**
El sistema debe mostrar:

1. Tipo de facturación (total / parcial)
2. Facturación con o sin confirmación de entrega
3. Forma de pago
4. Condiciones de pago / plazo
5. Requiere pago anticipado (sí / no)
6. Estado de confirmación de pago
Reglas:
1. Información no editable
2. Debe coincidir exactamente con lo registrado en HU 14

4.1 acción de reabrir pedido
 En el caso de que se requiera reabrir un pedido solo podrá realizarse por el rol super adm y el rol de compras.

**
5.  Información de destinos
**
Por cada destino asociado, el sistema debe mostrar:
1. Dirección de despacho
2. Ciudad
3. País
4. Contacto de recepción
5. Observaciones del destino
Reglas:
1. Puede existir uno o varios destinos
2. No editable
3. No puede eliminarse desde esta vista

**
6. Órdenes de compra asociadas (referencial)
**
El sistema debe mostrar, si existen:

1. Número de orden de compra
2. Proveedor
3. Estado de la OC
4. Fecha de creación de la OC
Reglas:
1. Información solo informativa
2. No editable

**
7.  Información Logística (Pedidos 2 )
**
El sistema debe mostrar la información logística asociada al pedido, basada exclusivamente en la hoja “Pedidos 2 / Logística” del Excel “Parametrización CRM.xlsx”.

Esta información:

1. Se registra en etapas posteriores al pedido
2. Es solo de consulta en la vista de detalle
3. Puede estar parcial o completamente vacía, dependiendo del avance del pedido

**7.1. Campos logísticos obligatorios a mostrar
**
El sistema debe mostrar los siguientes campos, exactamente como existen en el Excel:

Identificación logística
1. Estado logístico del pedido
2. Responsable logístico
**7.2. Fechas logísticas**

1. Fecha de despacho
2. Fecha de entrega

**Reglas:**
1. El sistema no debe calcular fechas automáticamente

**7.3. Información de transporte
**
1. Tipo de envío (nacional / local)
2. Transportadora
3. Número de guía

**7.4.  Información de despacho
**
1. Origen del despacho
2. Destino asociado
3. Dirección de entrega
4. Ciudad
5. País

**7.5 Observaciones logísticas
**
1. Observaciones de logística
2. Usuario que registró la observación
3. Fecha y hora de registro

**8. Estados y fechas clave
**
El sistema debe mostrar:
1. Estado actual del pedido
2. Fecha de último cambio de estado
3. Usuario que realizó el cambio

**
9. Historial y trazabilidad
**
El sistema debe mostrar una línea de tiempo con:
1. Evento
2. Descripción del evento
3. Usuario
4. Fecha
5. Hora
Reglas:
1. Orden cronológico ascendente
2. Eventos no editables
3. Eventos no eliminables

**
10.  Observaciones
**
El sistema debe mostrar:
1. Observaciones registradas
2. Usuario que registró la observación
3. Fecha y hora
Reglas:
1. Solo lectura
2. No eliminables

**
11.  Restricciones explícitas
**
El sistema no debe:
1. Permitir eliminación de información
2. Permitir cambios de estado
3. Inferir información faltante
4. Consolidar o resumir campos automáticamente

**
6. No hace parte**
1. Reversión de estados
2. Auditoría legal avanzada
