**HU-0011 – Creación y Gestión de Roles y Permisos de Usuario**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
El sistema debe permitir la **creación, edición y asignación de roles y permisos** a los usuarios que interactúan con los diferentes módulos (Comercial, Logística, Gerencia, Administración, etc.).
Esto garantiza la seguridad de la información y el control de acceso a funcionalidades según el perfil del usuario.
**Alcance

**Este requerimiento aplica al módulo de **Administración del Sistema**.
Involucra principalmente a los roles **Administrador del Sistema** y **Gerencia General**, que son quienes pueden crear o modificar roles.
Incluye la definición de permisos por módulo, vista o acción (crear, editar, ver, aprobar, eliminar) y la asignación de dichos permisos a cada usuario.
No incluye la autenticación de usuarios (login o recuperación de contraseña), ya que se encuentra en otro requerimiento base de acceso.
**Descripción detallada del requerimiento**
1. Creación de roles:
  1. El usuario administrador podrá crear roles desde la interfaz de configuración del sistema.
  2. Cada rol debe incluir los siguientes campos:
    1. Nombre del rol (texto obligatorio).
    2. Descripción breve.
    3. Estado (activo/inactivo).
  3. Los roles creados quedarán disponibles para asignación inmediata.
2. Definición de permisos:
  1. Para cada rol, el administrador podrá asignar permisos específicos sobre módulos y funcionalidades del sistema:
    1. Permisos base: Crear / Editar / Ver / Eliminar / Aprobar.
    2. Permisos específicos: Acceso a flujos o submódulos concretos (por ejemplo: Gestión de Leads, Cotizaciones, Facturación, Reportes).
  2. Los permisos deben almacenarse en una tabla de control relacionada con el ID del rol.
3. Asignación de roles a usuarios:
  1. Al crear o editar un usuario, el sistema debe permitir asignar uno o varios roles.
  2. Cada usuario hereda automáticamente los permisos del rol asignado.
  3. Si un usuario tiene múltiples roles, los permisos se combinan (suma de permisos sin duplicidad).
4. Gestión de usuarios:
  1. El sistema debe permitir visualizar todos los usuarios con su rol actual, estado y fecha de última actividad.
  2. Los roles inactivos no deben poder asignarse.
  3. Si un usuario se desactiva, debe perder inmediatamente acceso al sistema.
5. Control de acceso por rol:
  1. Cada módulo o vista del sistema debe validar el rol del usuario antes de permitir acceso o acciones.
  2. Si el usuario intenta acceder a un módulo sin permiso, el sistema debe mostrar un mensaje:
“Acceso denegado. No cuenta con permisos para esta acción.”
1. Bitácora de control:
  1. Todas las acciones de creación, modificación o eliminación de roles y usuarios deben registrarse en una bitácora administrativa.
  2. La bitácora debe incluir: usuario administrador, acción, fecha, hora y descripción del cambio.

**Casos de uso **
1. CU-11.1 – Crear nuevo rol:
El administrador define un nuevo rol con permisos específicos.
2. CU-11.2 – Editar rol existente:
El administrador actualiza los permisos o la descripción de un rol.
3. CU-11.3 – Asignar rol a usuario:
El administrador asigna un rol a un usuario existente.
4. CU-11.4 – Desactivar usuario o rol:
El administrador inactiva un rol o usuario y el sistema revoca el acceso.
5. CU-11.5 – Validar acceso a módulo:
El sistema valida los permisos antes de ejecutar cualquier acción.
6. CU-11.6 – Registrar cambios en bitácora:
Todas las acciones administrativas se registran con trazabilidad.

**Flujos de trabajo **
Flujo 1 – Creación de rol
1. Administrador ingresa a “Configuración → Roles y Permisos”.
2. Selecciona “Nuevo Rol”.
3. Ingresa nombre, descripción y estado.
4. Asigna permisos por módulo.
5. Guarda cambios → Rol queda activo.
Flujo 2 – Asignación de roles a usuarios
1. Administrador accede a “Gestión de Usuarios”.
2. Selecciona usuario → “Editar”.
3. Asigna uno o más roles disponibles.
4. Guarda cambios → Usuario hereda permisos.
Flujo 3 – Validación de permisos en uso
1. Usuario intenta acceder a módulo.
2. Sistema consulta permisos asociados a su rol.
3. Si tiene permiso → acceso concedido.
4. Si no tiene → mensaje de “Acceso denegado”.
Flujo 4 – Bitácora de control
1. Cada creación, modificación o eliminación de rol/usuario se registra.
2. Registro incluye: usuario admin, acción, fecha, hora, detalles.

**Criterios de aceptación**
1. El sistema debe permitir crear, editar y eliminar roles.
2. Los permisos deben configurarse por módulo y acción.
3. Los roles inactivos no deben poder asignarse a nuevos usuarios.
4. Cada usuario debe heredar permisos del rol asignado.
5. Si el usuario se desactiva, debe perder acceso inmediato.
6. El sistema debe validar los permisos antes de ejecutar cualquier acción.
7. Todas las acciones deben registrarse en una bitácora con trazabilidad.
**Ver anexo: proceso comercial**

**No hace parte del alcance del presente requerimiento**
1. El flujo de autenticación (login, logout, recuperación de contraseña).
2. La integración con sistemas externos de gestión de usuarios (LDAP, Active Directory).
3. La configuración de jerarquías de aprobación o delegación.
