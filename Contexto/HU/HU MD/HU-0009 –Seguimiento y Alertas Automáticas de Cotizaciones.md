**HU-0009 – Seguimiento y Alertas Internas en el Proceso Comercial**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
Como **usuario del sistema (comercial, financiero, compras, logística o gerencia)**, quiero que el aplicativo genere **alertas internas de seguimiento** sobre las solicitudes, cotizaciones, órdenes de pedido y órdenes de compra, permitiendo que los usuarios involucrados puedan dejar **comentarios u observaciones** directamente dentro del aplicativo, sin envío de correos electrónicos, para mantener una comunicación ágil y centralizada dentro del flujo operativo.
**Alcance

**Esta historia aplica a todos los módulos que intervienen en el proceso comercial:
**Cotización, Orden de Pedido, Orden de Compra y Facturación.**
Su objetivo es garantizar un **seguimiento interno unificado**, con trazabilidad de comentarios, alertas automáticas y notificaciones por mención (“@usuario”) dentro del sistema.**Descripción detallada del requerimiento**

#### 3.1 Creación del campo de observaciones

1. Cada registro de **cotización, pedido o compra** debe incluir un **campo de observaciones o comentarios** visible en la parte inferior del formulario.
2. Este campo permitirá ingresar texto libre con un límite de **2.000 caracteres**.
3. Los comentarios se almacenan de forma cronológica con:
  1. Fecha y hora del registro.
  2. Usuario que realiza el comentario.
4. Los comentarios no podrán ser eliminados ni editados una vez guardados (solo se pueden agregar nuevos).
5. Los registros deben mostrarse en formato de tipo chat o hilo de seguimiento (timeline).


#### 3.2 Mención de usuarios y notificaciones internas

1. Si un usuario escribe **“@” seguido del nombre de otro usuario**, el sistema debe:
  1. Mostrar una lista desplegable con los usuarios disponibles.
  2. Permitir seleccionar uno o varios usuarios.
2. Al guardar el comentario con mención, el sistema generará una **alerta interna en la campana de notificaciones** del usuario mencionado.
3. La notificación debe incluir:
  1. Nombre del usuario que hizo la mención.
  2. Número y tipo de documento (COT, OP, OC).
  3. Extracto del comentario (primeras 100 letras).
  4. Enlace directo al documento mencionado.
4. **No se debe enviar correo electrónico.**
Las alertas solo deben mostrarse dentro del aplicativo, en la campana de notificaciones superior.
5. Las alertas permanecerán visibles hasta que el usuario las marque como **leídas**.


#### 3.3 Seguimiento y trazabilidad

1. Todos los comentarios y alertas deben almacenarse en una **bitácora de seguimiento** del registro.
2. La bitácora debe permitir filtrar por:
  1. Fecha
  2. Usuario
  3. Tipo de documento
  4. Estado del documento
3. Desde la bitácora, los usuarios con permisos podrán visualizar el historial completo de interacciones internas entre áreas.
4. Cada documento (COT, OP, OC) debe mostrar un contador visual de comentarios (ejemplo: ícono de burbuja con número).


#### 3.4 Tipos de alertas internas

El sistema debe manejar tres tipos de alertas internas automáticas:

| **Tipo de Alerta** | **Desencadenante** | **Notificación a** | **Medio** |
| --- | --- | --- | --- |
| **De estado** | Cambio de estado (Ej: Cotización aprobada, OP generada, OC confirmada) | Rol responsable del siguiente paso | Campana interna |
| **De mención (@)** | Comentario con mención directa | Usuario mencionado | Campana interna |
| **De seguimiento manual** | Creada por un usuario desde el campo “Observaciones” (marcando la opción “Crear alerta”) | Usuario o área seleccionada | Campana interna |


#### 3.5 Roles y permisos


| Rol / Área | Puede crear comentarios | Puede mencionar usuarios (@) | Puede visualizar todos los comentarios | Puede borrar / editar |
| --- | --- | --- | --- | --- |
| Comercial | ✅ | ✅ | ✅ (solo sus clientes) | ❌ |
| Financiera | ✅ | ✅ | ✅ | ❌ |
| Compras | ✅ | ✅ | ✅ | ❌ |
| Logística | ✅ | ✅ | ✅ | ❌ |
| Gerencia | ✅ | ✅ | ✅ (todas las áreas) | ❌ |


#### 3.6 Notificaciones automáticas por evento

1. Cuando un comercial solicita una aprobación financiera de una cotización, el sistema envía alerta a **Financiera**.
2. Cuando **Financiera** valida una proforma, alerta a **Comercial**.
3. Cuando se genera una **Orden de Pedido**, alerta a **Compras y Logística**.
4. Cuando **Compras** confirma una OC, alerta a **Logística y Finanzas**.
5. Cuando **Logística** marca entrega, alerta a **Finanzas**.
6. Cuando cualquier usuario comenta con “@usuario”, se genera la **notificación interna** correspondiente.

**Casos de uso **

### CU-09.1 – Registrar observaciones internas

**Actor principal:** Todos los roles habilitados (Comercial, Financiera, Compras, Logística, Gerencia)
**Precondición:** Existe una Cotización, OP u OC activa en el sistema.
**Descripción:** El usuario agrega un comentario interno dentro del campo “Observaciones”.
**Flujo principal:**
1. El usuario abre el documento (COT, OP u OC).
2. Escribe su comentario en el campo de observaciones.
3. Presiona “Guardar comentario”.
4. El sistema registra fecha, hora y usuario.
5. El comentario se añade a la línea de tiempo.
6. El sistema actualiza el contador de comentarios del registro.
**Flujo alternativo:**
1. Si el usuario intenta editar o eliminar un comentario ya guardado, el sistema mostrará el mensaje:
**“No es posible modificar comentarios registrados. Agregue uno nuevo.”**


### CU-09.2 – Mencionar a un usuario (@usuario)

**Actor principal:** Cualquier usuario autorizado
**Precondición:** El sistema debe tener usuarios registrados con permisos de acceso al módulo.
**Descripción:** El usuario menciona a otro para generar una alerta interna.
**Flujo principal:**
1. En el campo de observaciones, el usuario digita “@” y empieza a escribir el nombre.
2. El sistema despliega una lista de coincidencias.
3. El usuario selecciona el usuario deseado.
4. Guarda el comentario.
5. El sistema genera una **notificación interna** al usuario mencionado con:
  1. Nombre del emisor.
  2. Fragmento del comentario.
  3. Enlace directo al registro.
6. El usuario mencionado ve el icono de notificación activo en la campana.
**Flujo alternativo:**
1. Si el usuario mencionado no tiene permisos para ver el documento, la alerta se genera pero el enlace muestra el mensaje:
**“No tiene permisos para acceder a este registro.”**


### CU-09.3 – Generar alerta automática por evento

**Actor principal:** Sistema 
**Precondición:** Cambio de estado de documento (COT, OP, OC).
**Descripción:** El sistema genera alertas internas automáticas cuando se produce un evento configurado.
**Flujo principal:**
1. Se aprueba o cambia el estado de un documento.
2. El sistema identifica los roles implicados en el siguiente paso.
3. Se genera automáticamente una alerta interna a los usuarios correspondientes.
4. Las alertas se registran en la bitácora del documento.
**Flujo alternativo:**
1. Si no hay usuarios asignados al siguiente rol, el sistema almacena la alerta sin destinatario y muestra un mensaje de advertencia al administrador.


### CU-09.4 – Consultar bitácora de seguimiento

**Actor principal:** Cualquier usuario con permisos de lectura.
**Precondición:** Existen comentarios o cambios registrados en la bitácora.
**Descripción:** Permite visualizar todo el historial de interacciones y eventos relacionados con el documento.
**Flujo principal:**
1. El usuario accede a la pestaña “Seguimiento / Bitácora”.
2. Selecciona filtros de búsqueda (usuario, fecha, tipo de evento).
3. El sistema muestra la lista cronológica de interacciones.
4. El usuario puede expandir o contraer los comentarios según necesidad.

**Criterios de aceptación**
1. Cada documento (COT, OP, OC) debe tener su propio **campo de observaciones interno** con historial visible.
2. Las menciones con “@usuario” deben generar notificaciones internas en la **campana**, sin uso de correo electrónico.
3. El sistema debe registrar en bitácora todos los comentarios, fechas y usuarios.
4. No debe permitirse eliminar ni editar comentarios.
5. Los roles deben poder visualizar los comentarios según su nivel de acceso.
6. Las notificaciones deben ser inmediatas y mostrar el enlace directo al documento.

**No hace parte del alcance del presente requerimiento**
- Notificaciones diferentes  a las estipuladas
