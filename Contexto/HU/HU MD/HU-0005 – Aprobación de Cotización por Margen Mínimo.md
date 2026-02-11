**HU-0005 – Aprobación de Cotización por Margen Mínimo**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
El sistema debe validar automáticamente el margen de utilidad calculado en cada cotización. Cuando el margen esté por debajo del valor mínimo configurado, se debe requerir la aprobación de la gerencia antes de que el asesor pueda continuar con el proceso comercial (envío al cliente o generación de pedido).
**Alcance

**Este requerimiento aplica al módulo de **Gestión de Cotizaciones** e involucra a los roles **Comercial**, **Gerencia Comercial** y **Administración Financiera**.

Incluye la validación automática del margen, la generación de alertas y la aprobación manual por parte de los usuarios con rol de gerencia.
No incluye la revisión del cupo de crédito ni la autorización de extracupo (cubiertas en HU05).
**Descripción detallada del requerimiento**
1. Cálculo del margen:
2. Al guardar o actualizar una cotización, el sistema debe calcular automáticamente el margen de utilidad aplicando la fórmula:

Margen (%) = **1- (Total costo / total venta)**.
3. El costo total debe incluir los valores de transporte, descuentos y TRM del día.
4. Validación contra margen mínimo:
5. El sistema debe comparar el margen calculado con el margen mínimo configurado por categorías y crédito en el módulo de parámetros.
6. Si el margen ≥ margen mínimo → la cotización se aprueba automáticamente.
7. Si el margen < margen mínimo → se bloquea el envío de la cotización a la generación de pedido o aprobación automática y se requiere intervención de la gerencia.
8. Solicitud de aprobación:
9. Cuando se detecte un margen inferior al mínimo, el sistema debe generar un modal para el asesor, indicándole si quiere enviar una solicitud de aprobación dirigida a los usuarios con rol de Gerencia Comercial.
10. La solicitud debe incluir:
  1. Código de la cotización
  2. Cliente
  3. Margen calculado
  4. Margen mínimo requerido
  5. Nombre del asesor
  6. Fecha de creación

1. El asesor no podrá continuar con el envío de la cotización a pedidos hasta recibir una respuesta de aprobación o rechazo, pero si podrá exportarla para enviarla al cliente para su revisión.
2. Al momento de revisar el margen el rol gerencia debe poder suministrar un margen opcional, en el modal, la casilla será de margen aprobado
3. Aprobación o rechazo:
4. El usuario con rol de gerencia podrá aprobar o rechazar la solicitud directamente desde el panel de aprobaciones.
5. En caso de aprobación:
  1. El asesor recibe una notificación de autorización y puede continuar con el proceso.
  2. En el sistema en el campo de observaciones de esa cotización debe quedar el comentario de “aprobado bajo menor margen” por el siguiente margen [margen]
6. En caso de rechazo:
  1. El asesor recibe una notificación con el comentario o motivo de rechazo.
7. Trazabilidad:
8. Cada acción (solicitud, aprobación, rechazo) debe registrarse con usuario, fecha y hora.
9. Los registros deben conservarse en la bitácora general del módulo de cotizaciones.

**Casos de uso **
1. CU-04.1 – Validación de margen:
El sistema compara el margen calculado con el margen mínimo configurado.
2. CU-04.2 – Generación de solicitud:
Si el margen es menor al mínimo, el sistema genera una solicitud de aprobación.
3. CU-04.3 – Aprobación de cotización:
Gerencia revisa la cotización y aprueba el margen, permitiendo continuar el proceso.
4. CU-04.4 – Rechazo de cotización:
Gerencia rechaza la cotización indicando motivo y observaciones.
5. CU-04.5 – Registro de bitácora:
El sistema registra automáticamente todos los eventos de aprobación o rechazo.

**Flujos de trabajo **
Flujo 1 – Validación automática del margen por producto
1. Asesor crea o edita cotización.
2. El sistema calcula margen automáticamente.
3. Compara con el margen mínimo configurado.
4. Si margen ≥ mínimo → cotización se guarda como “Aprobada”.
5. Si margen < mínimo → sistema genera solicitud de aprobación.
Flujo 2 – Proceso de aprobación por gerencia
1. Gerencia recibe notificación de solicitud pendiente.
2. Ingresa al panel de “Aprobaciones de Cotización”.
3. Visualiza datos de cliente, asesor, margen y observaciones.
4. Selecciona acción: Aprobar o Rechazar.
5. Sistema notifica al asesor.
Flujo 3 – Registro y trazabilidad
1. Toda acción se almacena en la tabla de auditoría.
2. Campos registrados: cotización, usuario, rol, acción, fecha y hora.
3. El historial puede consultarse desde el módulo de cotizaciones

** Criterios de aceptación **
1. El sistema debe calcular el margen de utilidad en todas las cotizaciones.
2. La comparación debe realizarse automáticamente al guardar o actualizar una cotización.
3. Si el margen es inferior al mínimo, debe bloquear el envío y solicitar aprobación.
4. Solo usuarios con rol de Gerencia o Finanzas pueden aprobar o rechazar.
5. Toda acción debe quedar registrada en bitácora con trazabilidad completa.
6. La notificación debe enviarse tanto al asesor como a la gerencia.
7. Una cotización no puede ser enviada al cliente si no ha sido aprobada cuando el margen es bajo.

**No hace parte del alcance del presente requerimiento**
1. La validación de cupos de crédito o extracupo.
2. El envío de la cotización al cliente (cubierto en HU06).
3. La configuración de los márgenes en la tabla de parámetros (definida en otro requerimiento).
