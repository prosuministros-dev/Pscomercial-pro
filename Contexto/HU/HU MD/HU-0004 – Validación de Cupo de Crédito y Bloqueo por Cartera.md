**HU-0004 – Validación Manual de Bloqueo de Cartera (MVP)**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
Para el MVP del proceso de cotización, la única validación financiera requerida será confirmar si el cliente presenta **bloqueo de cartera**. Esta validación será **100% manual y exclusiva del área financiera**, ya que el sistema no realizará cálculos automáticos de margen, crédito ni cartera vencida. El área financiera será la única autorizada para marcar si un cliente tiene o no bloqueo, y dicha selección determinará si una cotización puede avanzar hacia la creación de un pedido.
**Alcance

**El sistema mostrará un campo manual denominado **“Cliente con bloqueo de cartera”**, pero **solo visible y editable para el área financiera**.
1. Los usuarios comerciales podrán ver el estado, pero **no modificarlo**.
2. El sistema no hará validaciones automáticas de margen, crédito ni cartera; solo se registra la selección hecha por el área financiera.
3. Si el cliente está bloqueado, la cotización se guarda, pero no podrá generar pedido.
4. Si está desbloqueado, continúa el flujo normal.

**Descripción detallada del requerimiento**
1. Al crear una cotización, el usuario comercial puede completarla sin restricciones.
2. En el detalle de la cotización, el sistema mostrará el campo “**Cliente con bloqueo de cartera**”:
  1. **Área financiera**: puede modificarlo.
  2. **Área comercial**: solo puede visualizarlo.
3. El área financiera será responsable de marcar:
  1. **Sí** → Cliente bloqueado
  2. **No** → Cliente sin bloqueo
4. Si se marca **Sí**, el sistema:
  1. Permite guardar la cotización.
  2. **Bloquea la creación de pedido.**
  3. Muestra mensaje informativo indicando que el cliente tiene bloqueo de cartera.
5. Si se marca **No**, la cotización puede avanzar al flujo normal de generación de pedido.
6. Toda acción del área financiera sobre este campo se registrará en la bitácora.

**Casos de uso **

### Caso 1 – Cliente sin bloqueo (rol financiero)

1. Dado que el área financiera accede a la cotización
2. Y marca “Bloqueo de cartera: No”
3. Entonces el sistema guarda el estado
4. Y el comercial puede generar el pedido

### Caso 2 – Cliente con bloqueo (rol financiero)

1. Dado que el área financiera accede a la cotización
2. Y marca “Bloqueo de cartera: Sí”
3. Entonces el sistema guarda la cotización
4. Y el comercial ve bloqueada la acción de generar pedido
5. Y se muestra un mensaje indicando el bloqueo

### Caso 3 – Comercial sin permisos

1. Dado que un comercial ingresa al detalle
2. Entonces puede ver el estado del bloqueo
3. Pero **no puede modificarlo**

### Caso 4 – Cambio de estado por finanzas

1. Dado que el cliente estaba bloqueado
2. Y el área financiera cambia a “No”
3. Entonces el comercial recupera la opción de generar pedido

**Flujos de trabajo **

### Flujo Principal del Comercial

1. El comercial crea una cotización.
2. Guarda la cotización.
3. Observa el estado del campo “Bloqueo de cartera” (solo lectura).
4. Si está en “No”, puede generar un pedido.
5. Si está en “Sí”, la opción de generar pedido está bloqueada.

### Flujo del Área Financiera

1. El área financiera ingresa al detalle de la cotización.
2. Modifica el campo “Cliente con bloqueo de cartera”.
3. Guarda la selección.
4. El sistema actualiza el estado y registra el cambio en bitácora.

** Criterios de aceptación **
1. El campo “Bloqueo de cartera” es visible para todos, pero **editable solo por el área financiera**.
2. El sistema no realiza ninguna validación automática (margen, crédito o cartera).
3. Si el estado es **“Sí”**, el pedido **no puede generarse**.
4. Si el estado es **“No”**, el flujo continúa normal.
5. El sistema debe registrar en bitácora:
  1. Quién cambió el estado
  2. Cuándo
  3. Valor anterior y nuevo
6. El mensaje de bloqueo debe ser claro y visible para el comercial.

**No hace parte del alcance del presente requerimiento**
1. Validación automática de margen.
2. Validación automática de cupo o cartera vencida.
3. Integración con sistemas financieros externos.
4. Automatización de aprobaciones.
5. Cálculo de margen por producto o por cotización.
6. Cambios automáticos de estado basados en reglas financieras.
