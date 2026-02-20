**HU-0002 – Asignación de Leads**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
El sistema debe permitir la asignación de los leads capturados a los asesores comerciales disponibles, de forma automática y equitativa según la configuración establecida por la gerencia. También debe permitir la reasignación manual por parte del administrador cuando sea necesario.
**Alcance

**Este requerimiento aplica al **módulo de Gestión Comercial** e involucra las **áreas de Gerencia Comercial y Asesoría Comercial.**
Incluye la **asignación automática**, la notificación al asesor, la validación de disponibilidad, y la posibilidad de reasignar leads desde un panel administrativo.

No incluye la creación del lead ni su validación inicial (cubiertas en la HU01).**Descripción detallada del requerimiento**
1. **Asignación automática:
**
  1. Una vez creado el lead (HU01), el sistema debe asignarlo automáticamente a un asesor comercial activo y disponible.
  2. La distribución debe ser **aleatoria o balanceada** según los usuarios registrados en el módulo de comerciales.
  3. El listado de asesores disponibles será administrado por el rol **Gerencia Comercial**, quien podrá agregar o retirar asesores activos en el sistema.
  4. Si un asesor se desactiva, el sistema debe excluirlo automáticamente del algoritmo de asignación.
2. **Reasignación manual:
**
  1. Un usuario con permisos de administrador podrá reasignar un lead a otro asesor comercial desde la interfaz de gestión de leads.
  2. En el caso que se de baja un asesor comercial y este tenga asignado leads, la administración o gerencia deberá hacer la reasignación manual de estos
  3. El sistema debe registrar en la bitácora la fecha, hora y usuario que realizó la reasignación.
3. **Notificaciones:**
  1. Al momento de la asignación (automática o manual), el sistema debe enviar una **notificación en la bandeja del asesor comercial** correspondiente, indicando:
    1. Código del lead.
    2. Nombre del cliente o empresa.
    3. Canal de origen.
    4. Fecha y hora de asignación.
  2. La notificación debe mostrarse en el panel del usuario y enviarse por correo electrónico (si está habilitado).
4. **Estados y control:
**
  1. Cada lead debe cambiar su estado a **“Asignado”** al completar el proceso.

**Casos de uso **
1. **CU-02.1 – Asignación automática:
**El sistema asigna un lead nuevo de manera aleatoria entre los asesores activos.
2. **CU-02.2 – Asignación manual:
**El administrador reasigna un lead a un asesor específico.
3. **CU-02.3 – Registro de bitácora:
**El sistema registra cada evento de asignación o reasignación con usuario, fecha y hora.

**Flujos de trabajo **
Flujo 1 – Asignación automática:
1. Lead creado en estado “Pendiente de Asignación” (HU01).
2. Sistema verifica asesores activos en el módulo de configuración.
3. Se selecciona aleatoriamente un asesor disponible.
4. El sistema asigna el lead y actualiza su estado a “Asignado”.
5. Se genera y envía notificación al asesor.
6. El sistema registra la asignación en la bitácora.
Flujo 2 – Asignación manual / Reasignación:
1. Usuario administrador ingresa al panel de leads.
2. Selecciona el lead → “Reasignar asesor”.
3. Elige nuevo asesor comercial.
4. El sistema actualiza el registro y genera notificación al nuevo asesor.
5. Se guarda el evento en la bitácora.

** Criterios de aceptación **
1. Los leads deben asignarse automáticamente solo a asesores activos.
2. La reasignación debe estar disponible únicamente para usuarios con permisos administrativos.
3. Toda asignación o reasignación debe registrarse en bitácora con fecha, hora y usuario.
4. El sistema debe notificar al asesor asignado mediante panel y/o correo.
5. Un lead solo puede estar asignado a un asesor a la vez.
6. El cambio de estado debe ser automático según la acción (Asignado)
7. Asignación automática de leads de forma equitativa entre asesores, con límite configurable ( máximo 5 pendientes por asesor).
8. Si un asesor se da de baja, re-asignar automáticamente sus leads al grupo general (no reasignación manual).

**No hace parte del alcance del presente requerimiento**
1. La creación inicial del lead (cubierta en HU01).
2. La gestión de cotizaciones o pedidos derivados del lead.
3. La automatización de alertas de seguimiento (serán cubiertas en requerimientos posteriores).
