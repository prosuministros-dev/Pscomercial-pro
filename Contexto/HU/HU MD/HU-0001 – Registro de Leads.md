**HU-0001 – Registro de Leads**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
El sistema debe permitir la captura automática y manual de leads provenientes de diferentes canales de entrada (chatbot de WhatsApp, **formulario página web** ), registrando su información básica y garantizando la trazabilidad desde el primer punto de contacto hasta su asignación a un asesor comercial.
**Alcance

**El requerimiento aplica al módulo de gestión de leads y abarca los canales de entrada automatizados (chatbot de WhatsApp, **formulario página web** ) y la creación manual desde la interfaz del sistema. 
Involucra las áreas de comercial y administración del sistema, responsables de la configuración de roles y permisos.
**Descripción detallada del requerimiento**
El sistema debe recibir solicitudes de contacto iniciadas por un cliente a través de los canales habilitados (chatbot de WhatsApp, **formulario página web** ).
1. El chatbot debe detectar la intención del cliente y desplegar un mensaje de bienvenida según la plantilla definida.
2. El sistema solicitará y almacenará los datos básicos del cliente, incluyendo:
3. **Número de Lead:** El sistema lo debe generar de manera automática, se debe iniciar a partir del #100
4. **Fecha de creación del lead:** La fecha deberá ponerlo a el sistema de manera automática pero también debe permitir ser modificada por el usuario según necesidad de negocio
5. **Razón social**
6. **NIT o número de identificación**
7. **Nombre del contacto principal**
8. **Celular de contacto**
9. **Correo electrónico del contacto**
10. **Requerimiento **
11. **Canal de entrada** (WhatsApp, Web, Manual)
12. Cada lead debe ser almacenado en la base de datos con un número consecutivo automático, iniciando desde el código 100.
13. El sistema deberá permitir la creación manual de leads por parte del Gerente general y director comercial.
14. El sistema debe registrar automáticamente la fecha y hora de creación del lead y el usuario responsable de su registro.
  1. Debe permitir que sea modificada por el Gerente general y director comercial, según necesidad de negocio
15. El lead quedará en estado “Pendiente de Asignación” hasta ser distribuido a un asesor comercial (ver HU02 – Asignación de Leads).

**Casos de uso **
1. CU-01.1 – Creación automática: El cliente contacta por chatbot (WhatsApp, **formulario página web** ).  y el sistema genera el lead con base en los datos ingresados.
2. CU-01.2 – Creación manual: Un usuario autorizado crea un lead desde la interfaz administrativa.
3. CU-01.3 – Registro incompleto: El sistema almacena el lead con estado “Pendiente de información” cuando falta algún campo obligatorio.

**Flujos de trabajo **
1. Cliente inicia conversación vía chatbot por WhatsApp
2. El sistema detecta la intención → solicita datos básicos.
3. El sistema valida la estructura del correo y número de contacto.
4. Si los datos son válidos → se crea el lead con número consecutivo.
5. El sistema registra el canal de origen, fecha, hora y usuario.
6. El lead queda en estado “Pendiente de Asignación” y disponible para el módulo de distribución.

** Criterios de aceptación **
1. El sistema debe crear el lead de forma automática al recibir la información mínima requerida. Los campos de creación del lead son los que están estipulados en el archivo de excel “Proceso comercial” en la pestaña “Lead”

## El template de bienvenida del chatbot será el siguiente:


## 2.1. Plantilla de bienvenida y flujo conversacional – Registro de Lead (Chatbot PROSUMINISTRO)


### 1. Template de bienvenida (inicio de conversación)

**Objetivo:** Captar la atención del cliente, identificar la intención y guiarlo hacia el registro del lead.


#### 💬 Mensaje inicial (WhatsApp / Web Chatbot)

👋 ¡Hola! Bienvenido a **PROSUMINISTROS** 🧰
Tu aliado en hardware, software, accesorios y servicios de infraestructura IT.
Para poder atenderte mejor, por favor cuéntame qué deseas hacer hoy:
1️⃣ Solicitar una cotización
2️⃣ Consulta el estado de tu pedido 
3️⃣ Recibir asesoría comercial
4️⃣ Otro motivo
Estoy aquí para apoyarte. 🚀
*(El **chatbot** detecta la intención según la opción seleccionada o palabras clave como “cotización”, “pedido”, “**Otro motivo**”, etc.)*


### 2. Captura de datos básicos del lead

**Objetivo:** Recolectar la información necesaria para crear el lead en el sistema.

#### 💬 Flujo de mensajes:

**Bot:** Perfecto 👍 Para continuar, necesito algunos datos básicos de tu empresa:
1️⃣ **Razón social o nombre de la empresa:**
*(Cliente responde)*
2️⃣ **Número de NIT o identificación:**
*(Cliente responde)*
3️⃣ **Nombre del contacto principal:**
*(Cliente responde)*
4️⃣ **Número de contacto (celular o fijo):**
*(Cliente responde)*
5️⃣ **Correo electrónico de contacto:**
*(Cliente responde)*
**Bot:** Gracias 🙌
Por último, confirma por favor el **motivo de tu contacto** (por ejemplo: cotización de producto, información de servicio, etc.).
*(Cliente responde)*


### 3. Confirmación y registro del lead

**Bot:** ¡ Excelente, [nombre del contacto]! 🎉
Ya registramos tu solicitud con el código LEAD–###.
Muy pronto uno de nuestros asesores de PROSUMINISTROS se pondrá en contacto contigo para ayudarte con todo lo que necesites.
¡Gracias por confiar en nosotros! 🚀💙
.
*(Si el **chatbot** está conectado al sistema, aquí se genera el registro automático con los campos capturados y queda en estado “Pendiente de Asignación”).*


### 4. Mensajes de validación o error

**Campo faltante:**
⚠️ Parece que faltó un dato. Por favor indícame tu **correo electrónico** para continuar con el registro.
**Formato inválido:**
⚠️ El formato del correo o número de contacto no es válido. Revisa y escríbelo nuevamente, por favor.
**Duplicado:**
⚠️ Hemos detectado que ya existe un registro con este NIT o correo.
Un asesor revisará tu solicitud y te contactará en breve.


### 5. Mensaje final de cierre (todos los casos)

✅ ¡Gracias por comunicarte con **PROSUMINISTROS**!


### 6. Resumen técnico para implementación


| **Campo del lead** | **Fuente (chat)** | **Tipo de validación** | **Obligatorio** |
| --- | --- | --- | --- |
| Razón social / Empresa | Texto libre | No vacío | ✅ |
| NIT | Numérico o alfanumérico | Único en BD | ✅ |
| Nombre del contacto | Texto | No vacío | ✅ |
| Teléfono | Numérico | Validación formato (10 dígitos) | ✅ |
| Correo electrónico | Texto | Validación regex estándar | ✅ |
| Motivo / Intención | Lista o texto libre | No vacío | ✅ |
| Canal | Automático (WhatsApp / Web) | — | ✅ |
| Fecha y hora | Automático (sistema) | — | ✅ |
| Código lead | Autogenerado (ej. 100, 101, 102...) | Secuencia única | ✅ |

1. El consecutivo del lead debe ser único y autogenerado, iniciando en 100.
2. Todos los campos obligatorios deben validarse antes del guardado.
3. Los leads deben ser consultables por usuario con permisos.
4. El sistema debe registrar canal de entrada, fecha, hora y usuario creador.
5. Se debe validar duplicidad por NIT y correo electrónico.
6. Incluir alertas visuales para leads sin avance en cierto tiempo.
7. Habilitar creación manual de leads (no solo desde el chatbot).
8. Agregar **campo de observaciones con chat interno**, donde se vea la trazabilidad y se pueda mencionar usuarios con “@” para que reciban notificación en la campanita.
9. En la **campanita de notificaciones**, permitir filtrar entre “pendientes” y “vistas”.
10. Estados definidos:

Leads: Creado / Pendiente / Convertido.
1. La vista de este registro será en modo Kanban
2. La creación del lead debe respetar una jerarquía, es posible que bajo una misma razón social existan múltiples contactos

**No hace parte del alcance del presente requerimiento**
1. La asignación de leads a asesores (cubierta en HU02).
2. El envío de notificaciones automáticas.
3. Integraciones con APIs externas o validaciones de crédito.
