**HU-0012 – Integración Completa del Bot de WhatsApp para Atención, Registro de Solicitudes, Sincronización con WhatsApp Business y Creación de Leads**
**Ultima actualización | **Laura Martínez | 04/12/2025
**Objetivo**
**Como **Usuario del sistema / Cliente / Lead que escribe al WhatsApp oficial,** Quiero **Que un bot gestione mi conversación, clasifique mi necesidad, sincronice el número de WhatsApp Business del asesor con la plataforma, permita convertir la conversación en un Lead con toda la información recolectada y registre correctamente la solicitud en el sistema**, Para **Recibir atención ordenada, que mi información no se pierda y que el equipo pueda gestionar todo desde una misma plataforma con trazabilidad completa.

**Resumen Ejecutivo**
La integración con WhatsApp debe permitir que:
1. El bot reciba todos los mensajes entrantes y ofrezca un menú inicial:
  1. 1: Solicitar una Cotización
  2. 2: Consulta el estado de tu pedido
  3. 3: Otros motivos (soporte, documentos, área financiera)
2. El bot capture y estructure información del usuario (nombre, identificación, motivo, evidencias).
3. Se realice el embedded sign-up, para sincronizar el número WhatsApp Business de los asesores con la plataforma, de manera que:
  1. El asesor siga usando su WhatsApp Business normal.
  2. La plataforma reciba y refleje las conversaciones.
  3. Se pueda crear un Lead desde la plataforma con la información del chat.
  4. Se mantenga trazabilidad completa de mensajes, adjuntos y acciones.
4. La plataforma pueda convertir cualquier conversación de WhatsApp en un Lead, con datos y adjuntos.
5. Se manejen casos especiales como:
  1. Usuario no responde
  2. Archivos sin texto
  3. Solicitudes desordenadas
  4. Duplicados
  5. Conversaciones que deben ser enviadas a un número personal → se usa hyperlink
6. Se cree una solicitud interna según el tipo (cotización, pedido, soporte, financiero, documental).

**Alcance**
1. Recepción de mensajes entrantes por WhatsApp.
Menú inicial interactivo (1–3).
2. Clasificación automática de intención.
3. Captura guiada de datos faltantes.
4. Manejo de adjuntos (fotos, documentos).
5. **Embedded Sign-Up** para sincronizar el número de WhatsApp Business del asesor.
6. Visualización y gestión de conversaciones dentro de la plataforma.
7. Capacidad de responder desde plataforma o desde WhatsApp Business.
8. Creación de Lead desde la conversación (WhatsApp → Lead).
9. Adjuntar el historial conversacional al Lead/caso.
10. Asignación automática o manual de conversaciones.
11. Plantillas de comunicación según escenario.
12. Mensaje final de confirmación con número de caso.
.**Descripción detallada del requerimiento**

# Menú Inicial (Obligatorio)

👋 ¡Hola! Bienvenido a **PROSUMINISTROS** 🧰
Tu aliado en hardware, software, accesorios y servicios de infraestructura IT.
Para poder atenderte mejor, por favor cuéntame qué deseas hacer hoy:


**1️⃣ Solicitar una Cotización**
**2️⃣ Consulta el estado de tu pedido**
**3️⃣ Otro motivo** (soporte, documentos, facturación, área financiera)”
Estoy aquí para apoyarte. 🚀

1. **Workflows Complejamente Integrados (Completo)
**

## Workflow general

1. Usuario escribe.
2. Bot clasifica si es nuevo o recurrente.
3. Bot muestra menú inicial.
4. Bot dirige a uno de los 3 flujos principales.
5. Bot recolecta datos obligatorios.
6. Bot crea la solicitud o permite crear el Lead.
7. Plataforma conserva toda la conversación como historial.
8. Asesor puede continuar desde su WhatsApp Business sincronizado.


## Embedded Sign-Up (Sincronización del número del asesor)

1. El asesor realiza el proceso de **embedded sign-up** para vincular su número de WhatsApp Business con la plataforma.
2. Una vez vinculado:
  1. La plataforma refleja en tiempo real la conversación que llega al número del asesor.
  2. El asesor puede responder desde WhatsApp Business o desde la plataforma.
  3. La conversación se almacena con trazabilidad.

### Limitación técnica clave (Meta API)

Meta NO permite:
❌ Transferir una conversación activa de un número A a un número B.
Por eso:
1. La plataforma solo puede **reflejar** y **gestionar** la conversación del número sincronizado.
2. Si un flujo requiere mandar al usuario a un número personal → se usa **hyperlink** directo (perdiendo trazabilidad).


## Workflow WhatsApp → Lead

1. Durante la conversación el bot detecta intención comercial.
2. La plataforma activa el botón **“Crear Lead”** desde la ventana de conversación.
3. Se extrae automáticamente:
  1. Nombre
  2. Teléfono
  3. ID
  4. Mensajes relevantes
  5. Adjuntos
  6. Tipo de solicitud
4. Se crea un Lead en el módulo Lead
5. Se asocia el historial conversacional al Lead.
6. Si el Lead existe → sugerir “Actualizar Lead”.

1. **Workflows por cada Opción del Menú**
**🔵 OPCIÓN 1 – Cotización**
Incluye:
1. Captura de datos
2. Adjuntos
3. Plantillas
4. Validación
5. Creación de caso en sistema

**🟢 OPCIÓN 2 – Seguimiento de Pedido**
Incluye:
1. Pedir nombre de comercial
2. Identificar al comercial dentro de la plataforma.
3. Crear una notificación automática dirigida a ese comercial.
4. Mostrar plantilla de estado
5. Manejo de errores
6. Vincular adjuntos si aplican

**🟣 OPCIÓN 3 – Otros Motivos: Soporte, Documentos, Área Financiera**
Incluye:
1. Identificación de intención
2. Preguntar qué tipo de documento, soporte o trámite financiero necesita
3. Identificar al comercial dentro de la plataforma.
4. Crear una notificación automática dirigida a ese comercial.
5. Crear caso dirigido al área correcta

**Casos de uso **

### Escenario 1 – Usuario quiere soporte inmediato

El bot debe reconocer palabras clave como:
“dañada”, “fallo”, “no funciona”, “soporte”, “ayuda”, etc.
→ Clasificar como incidente.

### Escenario 2 – Usuario quiere información

El bot debe identificar palabras como:
“precio”, “cotización”, “quiero saber”, “información”.
→ Crear solicitud de información.

### Escenario 3 – Usuario escribe textos sin estructura

El bot debe:
1. Seguir preguntando
2. Ordenar la información
3. No perder el hilo conversacional (tema mencionado explícitamente por ellos)

### Escenario 4 – Usuario envía solo un archivo

El bot solicita detalles:
“Por favor indícame qué necesitas con esa imagen/documento.”

### Escenario 5 – Usuario escribe varias veces sobre lo mismo

El bot debe evitar duplicados y continuar el mismo caso si está dentro de una ventana de tiempo.
**Escenario 6  – Embedded Sign-Up**
1. Validación del proceso
2. Error de vinculación
3. Plataforma reflejando mensajes del número sincronizado
**Escenario 7 – Creación de Lead desde conversación**
1. Lead con adjuntos
2. Lead actualizado si ya existía
**Escenario 8  – Hyperlink a número personal**
1. Confirmación de pérdida de trazabilidad

**Flujos de trabajo **

## Flujo A – Usuario nuevo

1. Usuario escribe por primera vez.
2. Bot responde con saludo y validación de datos.
3. Usuario responde con su nombre.
4. Bot pide identificación.
5. Bot pregunta el motivo/contacto.
6. Bot clasifica según reglas que explicaron.
7. Bot crea el registro en el sistema.
8. Bot confirma.

## Flujo B – Cliente existente

1. Usuario escribe.
2. Bot identifica número asociado.
3. Bot solicita información faltante.
4. Bot clasifica la solicitud.
5. Crea la solicitud en el sistema.
6. Envía confirmación.

## Flujo C – Usuario envia fotos, audios y textos revueltos

1. Usuario envía evidencias antes de que el bot pregunte.
2. Bot las guarda temporalmente.
3. Bot continúa el flujo para capturar los datos restantes.
4. Todas las evidencias se adjuntan a la solicitud final.

## Flujo D – Usuario no responde

1. Bot pregunta algo.
2. Espera X minutos.
3. Envía recordatorio.
4. Si no hay respuesta, cierra conversación y registra como “incompleto”.

**3. Plantillas para TODOS los casos **
A continuación están todas las plantillas que debe usar el bot, organizadas por tipo de escenario.

**PLANTILLA A – Usuario nuevo (primer contacto)**
**Mensaje 1 – Saludo inicial
**
👋 ¡Hola! Bienvenido a **PROSUMINISTROS** 🧰
Tu aliado en hardware, software, accesorios y servicios de infraestructura IT.
**Mensaje 2 – Solicitud de nombre
**“¿Cuál es tu nombre completo?”
**Mensaje 3 – Solicitud de identificación
**“Perfecto, gracias. ¿Podrías indicarme tu número de identificación o documento?”
**Mensaje 4 – Motivo de contacto
**“Gracias. Para poder atenderte mejor, por favor cuéntame qué deseas hacer hoy:

1️⃣ Solicitar una **cotización**
2️⃣ Consulta el estado de tu** pedido**
3️⃣ Otro motivo (soporte técnico, documentación, facturación o área financiera)
**Mensaje 5 – Confirmación de creación del caso
**“Listo, tu solicitud fue registrada correctamente con el número *[**N°** de caso]*. Un asesor la revisará y te contactará.”

**PLANTILLA B – Cliente existente**
**Mensaje 1 – Identificación automática
**“He encontrado tu número en nuestro sistema ✔️. Para continuar solo necesito que me confirmes lo siguiente.”
**Mensaje 2 – Solicitud de datos faltantes
**“¿Puedes indicarme brevemente qué necesitas para poder clasificar correctamente tu solicitud?”
**Mensaje 3 – Confirmación
**“Tu solicitud fue registrada con el número *[**N°** de caso]*. Un asesor se comunicará contigo pronto.”

**PLANTILLA C – Solicitud de seguimiento de pedido**
**Mensaje 1 – Pedir nombre de comercial
**“Para ayudarte mejor, ¿puedes decirme qué comercial te atendió cuando realizaste este pedido?”
**Mensaje 2 – comercial encontrado
**“Perfecto 😊. Ya notifiqué a *[Nombre del Comercial]* sobre tu consulta. Pronto se comunicará contigo.”
**PLANTILLA D – Solicitud de información / cotización**
Detona con: “precio”, “cotización”, “información”, “me gustaría saber”.
**Mensaje 1 – Identificar necesidad
**“Claro, con gusto te ayudo con información. ¿Sobre qué producto deseas recibir detalle?”
**Mensaje 2 – Datos necesarios
**“¿Deseas una cotización formal o solo información general?”
**Mensaje 3 – Confirmación
**“Perfecto. He registrado tu solicitud con el número *[**N°** de caso]*. Un asesor te enviará la información.”

**PLANTILLA E – 3 – Otro motivo**
**Mensaje 1 – Pedir proceso
**“Para ayudarte mejor, ¿puedes decirme qué proceso necesitas realizar?”
**Mensaje 2 – comercial encontrado
**“Perfecto 😊. Ya notifiqué a *[Nombre del Comercial]* sobre tu consulta. Pronto se comunicará contigo.”

**PLANTILLA F – **Usuario escribe mensajes desordenados o mucha información sin estructura
**Mensaje 1
**“Gracias por tu mensaje. Para poder ayudarte necesito organizar un poco la información. ¿Podrías decirme en una frase qué necesitas?”
**Mensaje 2
**“Perfecto, ahora indícame por favor los detalles que consideres importantes para tu solicitud.”

**PLANTILLA G – Usuario no responde**
**Recordatorio 1 (tras X minutos)
**“¿Sigues ahí? 😊 Solo necesito tu respuesta anterior para continuar.”
**Recordatorio 2
**“Si necesitas más tiempo, no te preocupes. Continuaré esperando tu información.”
**Cierre automático
**“No recibimos respuesta, por lo que la conversación se ha cerrado. Si necesitas ayuda, puedes escribirnos de nuevo cuando quieras.”

**PLANTILLA H – Duplicados (usuario escribe varias veces sobre lo mismo)**
**Mensaje 1
**“Ya tenemos un caso abierto para esta misma solicitud ✔️. Continuaremos usándolo para mantener toda la información organizada.”
**Mensaje 2
**“Si deseas agregar más detalles o enviar evidencias, puedes hacerlo aquí mismo.”

**PLANTILLA I – Confirmación final (todos los casos)**
**Mensaje estándar
**“¡Perfecto! Tu solicitud fue registrada con el número *[**N°** de caso]*. Nuestro equipo la revisará y te responderá lo más pronto posible.”

**PLANTILLA J - Embedded Sign-Up**
“Por favor confirma tu número de WhatsApp Business para vincularlo a la plataforma. Este proceso se llama *embedded** **sign**-up*. Una vez vinculado podrás gestionar tus conversaciones directamente desde la plataforma.”

**PLANTILLA K - Limitación Meta**
“⚠️ Meta no permite transferir conversaciones entre números distintos. Podemos enviarte un enlace al número del asesor, pero se perderá la trazabilidad.”

**Criterios de aceptación**
1. El menú inicial debe funcionar con opciones 1, 2 y 3
2. El bot debe clasificar intención en base a palabras clave
3. El sistema debe permitir embedded sign-up del número del asesor
4. Las conversaciones del número sincronizado deben verse en la plataforma
5. Debe existir el botón “Crear Lead” en la conversación
6. Toda conversación convertida en Lead debe conservar mensajes y adjuntos
7. El bot debe manejar inactividad, duplicados y adjuntos
8. Al seleccionar “Seguimiento de pedido” el bot debe obligatoriamente pedir el comercial que atendió al cliente.
9. Al seleccionar “Otro motivo” el bot debe identificar la necesidad para dirigir el requerimiento al área correspondiente.
10. El sistema debe enviar una notificación interna al comercial indicado por el usuario.
11. Se debe poder enviar hyperlink cuando aplica
12. Todas las acciones deben quedar en bitácora
**No hace parte del alcance del presente requerimiento**
1. Transferir la conversación activa entre números distintos (limite de Meta API).
2. Envío automático de documentos (se gestiona como caso).
3. Integración con sistemas contables externos (a futuro).
4. Automatización de diagnósticos técnicos.
