**HU-0006 – Generación de Proforma y Envío de Cotización al Cliente**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
El sistema debe permitir la generación y envío de la cotización o proforma al cliente según su tipo de crédito.

Para clientes sin crédito, se debe generar una **proforma** como documento previo al pago.

Para clientes con crédito, el asesor puede enviar la **cotización oficial** directamente.
El sistema debe registrar el envío, generar recordatorios automáticos y notificar al asesor sobre las respuestas del cliente.
**Alcance

**Este requerimiento aplica a los módulos de **Cotizaciones**, **Chatbot/Comunicación** y **Gestión Comercial**.

Involucra las áreas **Comercial**, **Financiera** y **Administración del Sistema**.

Incluye la generación del documento PDF, envío automatizado, trazabilidad de respuesta y recordatorios automáticos de seguimiento.
No incluye la aprobación de crédito (HU05) ni la generación de órdenes de compra (cubierta en HU07).
**Descripción detallada del requerimiento**
1. Determinación del tipo de documento a enviar:
2. Si el cliente tiene crédito activo, el sistema permite enviar la cotización directamente.
3. Si el cliente no tiene crédito, el sistema debe generar una proforma en formato PDF, con la misma información de la cotización.
4. El campo “Tipo de documento” debe ser visible en la interfaz (valores posibles: Cotización / Proforma).
5. Generación del documento cotización/ proforma (PDF):
6. El sistema debe permitir generar el archivo PDF con la siguiente información:
  1. Datos del cliente (razón social, NIT, contacto, correo).
  2. Información de productos o servicios (cantidad, descripción, valor unitario, valor total).
  3. Condiciones de pago.
  4. Vigencia de la cotización o proforma.
  5. Observaciones o notas del asesor.
7. El documento debe tener numeración consecutiva única y sello de estado (“Cotización” o “Proforma”).
8. Flujo para clientes sin crédito:
9. El asesor envía la solicitud al área financiera para generación de proforma
10. El asesor financiero selecciona “Generar Proforma”.
11. El sistema genera el PDF y lo asocia a la cotización correspondiente.
12. Se notifica automáticamente al asesor con el mensaje:
“Proforma generada y almacenada exitosamente.”
1. La proforma se envía al cliente por correo electrónico y/o canal de chatbot sería un envió del link público.
2. Envío de cotización a cliente (clientes con crédito):
3. El asesor selecciona “Enviar cotización al cliente”.
4. El sistema genera el documento PDF y lo adjunta en el mensaje.
5. El envío puede hacerse mediante:
  1. Correo electrónico (automático).
  2. Mensaje del chatbot con con el link publico.
6. El sistema registra la fecha y hora del envío y cambia el estado a “Enviada al Cliente”.
7. Cuando el cliente y el área financiera confirmen el pago se puede generar el pedido.
8. Recordatorios automáticos:
9. Si el cliente no responde dentro de 8 días, el sistema debe enviar un mensaje automático de seguimiento.
10. **Condicional**: si el cliente responde antes, el recordatorio no se envía.
11. El chatbot debe interpretar la respuesta del cliente (aceptación, solicitud de cambios, o rechazo) y registrar la interacción.
12. Respuestas del cliente:
13. Si el cliente acepta la cotización/proforma, el comercial deberá enviar la solicitud al área financiera para corroborar el pago
14. El área financiera confirmar con el soporte de pago, que el cliente ya pago, ingresando a la solicitud , dando en check ,para que se puede generar el pedido y habilitar el paso siguiente de manera manual: generación de orden de compra (HU07).
15. Si el cliente solicita cambios, el sistema registra la observación y notifica al asesor.
16. Si el cliente rechaza, el sistema cambia el estado a “Cotización Rechazada” y almacena el motivo.

**Casos de uso **
1. CU-06.1 – Generar proforma (cliente sin crédito):
El sistema genera un PDF de proforma y lo envía al cliente.
2. CU-06.2 – Enviar cotización (cliente con crédito):
El asesor envía la cotización generada al cliente mediante correo o chatbot.
3. CU-06.3 – Registro de envío:
El sistema guarda la fecha, hora, usuario y canal de envío.
4. CU-06.4 – Recordatorio automático:
El sistema envía recordatorio al cliente si no hay respuesta en 8 días.
5. CU-06.5 – Interpretación de respuesta:
El chatbot interpreta la respuesta del cliente y actualiza el estado del registro.

**Flujos de trabajo **
Flujo 1 – Cliente con crédito:
1. Asesor selecciona “Enviar cotización al cliente”.
2. El sistema genera PDF de cotización.
3. Envío automático al correo o chatbot.
4. Estado cambia a “Enviada al Cliente”.
5. Se programan recordatorios automáticos de seguimiento.
Flujo 2 – Cliente sin crédito (Proforma):
1. Asesor selecciona “Generar Proforma”.
2. El sistema genera PDF y lo adjunta a la cotización.
3. Se envía automáticamente al cliente.
4. Estado cambia a “Proforma Enviada”.
5. Registro de envío en bitácora.
Flujo 3 – Seguimiento y respuesta:
1. Si el cliente no responde en 8 días → chatbot envía recordatorio.
2. Si el cliente responde:
  1. “Acepto”: estado cambia a “Aceptada por Cliente”.
  2. “Deseo modificar”: estado “Pendiente de ajustes”.
  3. “No acepto”: estado “Rechazada por Cliente”.
3. El sistema notifica al asesor de inmediato.

**Criterios de aceptación**
1. El sistema debe generar **proformas** solo para **clientes sin crédito**.
2. Las cotizaciones y proformas deben tener numeración consecutiva y registro en bitácora.
3. Los documentos PDF deben contener toda la información de cliente, productos y condiciones.
4. El envío debe registrarse con usuario, fecha, hora y canal.
5. Si no hay respuesta en 8 días, se debe enviar recordatorio automático.
6. Las respuestas del cliente deben ser interpretadas automáticamente por el chatbot.
7. Los estados deben actualizarse según la respuesta (Enviada, Aceptada, Rechazada, Pendiente de ajustes).

**No hace parte del alcance del presente requerimiento**
1. La generación de órdenes de compra posteriores a la aceptación (cubierta en HU07).
2. La integración con pasarelas de pago.
3. La configuración de plantillas gráficas del documento (manejado por el módulo de diseño).
