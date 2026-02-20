**HU-0008 – Gestión de Facturación por Pedido (sin emisión contable)**
**Ultima actualización | **Laura Martínez | 30/01/2025
**Resumen Ejecutivo**
Como usuario del área de **Facturación**, quiero que el sistema **gestione automáticamente el estado de facturación de un pedido y sus productos**, con base en **reglas comerciales, logísticas y contractuales**, para saber **cuándo un pedido puede o no ser facturado**, **sin generar factura electrónica**, garantizando **trazabilidad, bloqueos correctos y notificaciones entre áreas**.
Se requiere un **flujo claro y automático** que indique:
1. cuándo **facturación puede actuar**,
2. cuándo debe **esperar entrega, acta o cierre contable**,
3. y cuándo un pedido ya está **completamente facturado**, evitando errores operativos.

**Alcance

**Aplica a:
1. Gestión de **estados de facturación** del pedido y de sus productos.
2. Evaluación automática de reglas:
  1. Facturación parcial.
  2. Entrega parcial.
  3. Facturación con o sin confirmación de entrega.
  4. Dependencia de acta.
3. Recepción de eventos desde Logística y Comercial.
4. Notificaciones entre áreas.
5. Trazabilidad completa de cambios de estado.
No incluye:
	Generación o emisión de factura electrónica.
	Numeración fiscal, fechas fiscales, XML, DIAN.
Integraciones con ERP o software contable externo.
**Casos de uso

**1. Habilitar facturación tras evento logístico.
2. Bloquear facturación por acta pendiente.
3. Habilitar facturación parcial.
4. Mantener pedido en espera de entrega.
5. Marcar pedido como facturado y cerrar ciclo.

**
Flujo funcional  (facturación total)
**
1. Comercial define reglas del pedido:
  1. Permite / no permite facturación parcial.
  2. Requiere / no requiere acta.
  3. Requiere / no requiere confirmación de entrega.
2. Logística registra remisión y entrega total.
3. El sistema valida reglas.
4. Estado pasa a Pendiente por facturar.
5. Facturación marca como Facturado.
6. Se notifica internamente a Compras para cierre del pedido.**

Flujos alternos
**
**A. Facturación parcial permitida
**
- Logística remisiona parcialmente.
- El sistema habilita Pendiente por facturar (parcial).
- Facturación puede marcar productos específicos como facturados.**
**
**B. Entrega parcial sin facturación parcial
**
- Logística entrega parcial.
- Pedido queda en En proceso de entrega.
- No se habilita facturación hasta entrega total.**
**
**C. Facturación sin confirmación de entrega
**
- Logística remisiona.
- Si el pedido lo permite, se habilita facturación sin esperar entrega.

**Estados / Workflow de Facturación
**
1. Pendiente por facturar
2. Pendiente por facturar por cierre contable cliente
3. Pendiente por facturar por acta
4. En proceso de entrega
5. Facturado

**UI/UX mínimo + vistas de seguimiento**
En el pedido debe verse:
1. Estado actual de facturación.
2. Motivo del bloqueo (si aplica).
3. Indicador de:
  1. Permite facturación parcial.
  2. Requiere acta.
  3. Requiere entrega confirmada.
4. Histórico de cambios de estado (solo lectura).


**Notificaciones internas
**
5. Logística → Facturación: cuando se remisiona o entrega.
6. Comercial → Facturación: cuando se carga acta.
7. Facturación → Compras: cuando el pedido queda facturado.

**Criterios de aceptación**
**CA-01 – Facturación basada únicamente en estados**
El sistema NO debe solicitar ni mostrar:
1. Número de factura
2. Fecha de factura
3. Datos fiscales o contables
La facturación se representa exclusivamente mediante estados del pedido y/o productos.
✅ Aceptado cuando el usuario solo ve estados y acciones, no datos contables.

**CA-02 – Evaluación automática de reglas del pedido**
Cuando ocurre un evento (remisión, entrega o carga de acta):
1. El sistema evalúa automáticamente las reglas definidas en el pedido:
  1. Si permite facturación parcial
  2. Si permite entrega parcial
  3. Si se puede facturar sin confirmar entrega
  4. Si requiere acta
2. El usuario NO decide manualmente si puede facturar.
✅ Aceptado cuando la habilitación o bloqueo ocurre sin intervención humana.

**CA-03 – Estados claros y comprensibles de facturación**
El pedido y/o sus productos deben mostrar uno de los siguientes estados:
1. Pendiente por facturar
2. Pendiente por facturar por cierre contable cliente
3. Pendiente por facturar por acta
4. En proceso de entrega
5. Facturado
✅ Aceptado cuando el estado explica claramente por qué se puede o no facturar.

**CA-04 – Facturación parcial permitida**
Dado un pedido que permite facturación parcial:
1. Si logística entrega parcialmente:
  1. El sistema habilita la facturación parcial.
  2. Facturación puede marcar solo los productos entregados como facturados.
✅ Aceptado cuando no es necesario esperar la entrega total.

**CA-05 – Facturación parcial NO permitida**
Dado un pedido que NO permite facturación parcial:
1. Si logística entrega parcialmente:
  1. El pedido queda en estado En proceso de entrega.
  2. Facturación NO recibe acción para facturar.
✅ Aceptado cuando el sistema bloquea correctamente la facturación.

**CA-06 – Facturación con o sin confirmación de entrega**
1. Si el pedido requiere confirmación de entrega:
  1. No se habilita facturación hasta que logística marque “entregado”.
2. Si el pedido NO requiere confirmación de entrega:
  1. Se habilita facturación desde la remisión.
✅ Aceptado cuando el comportamiento cambia según la regla definida.

**CA-07 – Dependencia de acta**
Si el pedido requiere acta:
1. Mientras el acta no esté cargada:
  1. La facturación permanece bloqueada.
  2. El estado debe indicar claramente “Pendiente por facturar por acta”.
2. Al cargar el acta:
  1. Se habilita automáticamente la facturación.
✅ Aceptado cuando no se puede facturar sin acta y el bloqueo es visible.

**CA-08 – Notificaciones entre áreas**
El sistema debe notificar automáticamente:
1. A Facturación:
  1. Cuando logística remisiona o entrega (según reglas).
  2. Cuando comercial carga el acta.
2. A Compras:
  1. Cuando el pedido queda en estado Facturado.
✅ Aceptado cuando no se requiere seguimiento manual entre áreas.

**CA-09 – Trazabilidad obligatoria**
Cada cambio de estado de facturación debe registrar:
1. Qué evento lo generó
2. Qué área lo originó
3. Qué regla del pedido se aplicó
4. Fecha y hora
Esta información debe ser solo lectura.
✅ Aceptado cuando se puede auditar todo el historial del pedido.

**CA-10 – Cierre del ciclo de facturación**
Cuando facturación marca el pedido (o productos) como Facturado:
1. No se pueden realizar más acciones de facturación.
2. El pedido queda listo para revisión y cierre por Compras.
✅ Aceptado cuando el flujo continúa correctamente sin reprocesos.
**Principio del formulario**

**Final del formulario**

**No hace parte del alcance del presente requerimiento**
1. La emisión o generación de factura electrónica.
2. Integraciones con ERP, sistemas contables o DIAN.
3. La carga automática de archivos o documentos PDF de factura.
