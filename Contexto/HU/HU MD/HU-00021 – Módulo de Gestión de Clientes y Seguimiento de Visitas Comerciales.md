**HU-00021 – Módulo de Gestión de Clientes y Seguimiento de Visitas Comerciales**
**Ultima actualización | **Laura Martínez | 19/02/2026
**Origen**: Transcripción reunión CheckPoint PS – 19 de febrero de 2026
**Participantes**: Daniel Valbuena (Gerente General – Cliente), Laura Martínez (PM), Freddy Rincones (Tech Lead), Emma Castillo (Desarrolladora)

**Resumen Ejecutivo**
El sistema debe contar con un **Módulo de Gestión de Clientes (Maestro de Clientes)** que permita visualizar, gestionar, filtrar y exportar la base completa de clientes de la organización. Actualmente, la plataforma gestiona clientes únicamente como parte del flujo de leads y cotizaciones, pero no existe un módulo independiente que permita al equipo comercial consultar su cartera de clientes, realizar seguimiento postventa, registrar visitas comerciales ni gestionar la relación comercial de forma continua.

Este requerimiento fue identificado durante la reunión de CheckPoint del 19 de febrero de 2026, cuando Daniel Valbuena (Gerente General) mostró cómo su plataforma actual dispone de un módulo de "Maestros > Clientes" con funcionalidades de consulta, filtrado por asesor comercial, exportación, historial de gestión (cotizaciones, pedidos, órdenes de compra, tareas/visitas) y seguimiento comercial activo que no fue contemplado en la documentación original del proyecto.

**Contexto de Negocio (extraído de la transcripción)**

Daniel Valbuena explicó textualmente la necesidad:
- *"El líder es aparte. Cliente existente, líder es llega un prospecto de cliente. Ahora bien, yo necesito saber cuál es mi base."* (min 22:41)
- *"Básicamente a mí lo que me interesa es exportar los clientes a mí, solamente que yo sea la persona que los pueda exportar. ¿Por qué? Porque yo con esto hago revisión de: tú tienes una base de 300 a 400 clientes. ¿A cuánto le estás vendiendo?"* (min 24:34)
- *"Si no, ellos no tendrían forma de saber, pues cuál es el total de sus clientes y cómo van gestionando comercialmente su base."* (min 25:31)

Emma Castillo complementó:
- *"Yo sí debería de poder entrar a ver mis clientes para ver a quién voy a llamar [...] decir, le tengo que vender a tal, quiero ver mi lista de clientes, a quién no le he vendido o la otra vez quién quedó pendiente [...] poder navegar como en su parrilla de clientes, actualizar a los que tengan que actualizar."* (min 27:44)
- *"Recuérdate que los clientes van a volver a comprar y volver a comprar y es como un recurrente. Entonces el poder decir: bueno, a Freddy hace 3 meses que le vendí, lo voy a llamar para ver qué necesita. Pero no se va a acordar de Freddy hasta que no lo vea en su lista de clientes."* (min 28:21)

Freddy Rincones confirmó:
- *"Hoy no hay un módulo de clientes como tal [...] un módulo de clientes como tal fue algo que no fue solicitado [en la documentación original]."* (min 22:04)

**Alcance

**Este requerimiento cubre:
1. **Maestro de Clientes**: Vista y gestión de la base completa de clientes por organización.
2. **Cartera por Asesor Comercial**: Cada asesor visualiza únicamente sus clientes asignados.
3. **Ficha del Cliente**: Detalle con información de contacto, historial de cotizaciones, pedidos, órdenes de compra y visitas.
4. **Gestión de Visitas Comerciales (Tareas)**: Registro y seguimiento de visitas presenciales realizadas por los asesores a sus clientes.
5. **Exportación de Datos**: Exportación de la base de clientes restringida al rol Gerente General / Director Comercial.
6. **Pestaña de Clientes en Reportes**: Agregar una pestaña "Clientes" en el módulo de reportes existente.
7. **Migración de Datos**: Importación de la base de clientes existente desde la plataforma actual.

Involucra las áreas de **Gerencia General**, **Dirección Comercial**, **Asesoría Comercial** y **Administración del Sistema**.

**Descripción detallada del requerimiento**

### 1. Módulo de Clientes (Maestro de Clientes)

El sistema debe disponer de un módulo de clientes accesible desde el menú lateral, que permita:

1. **Listado de clientes**: Vista tipo tabla con todos los clientes de la organización, con columnas:
   - Razón social / Nombre de la empresa
   - NIT o número de identificación
   - Nombre del contacto principal
   - Teléfono / Celular de contacto
   - Correo electrónico
   - Asesor comercial asignado
   - Estado (Activo / Inactivo)
   - Fecha de última interacción (último pedido, cotización o visita)

2. **Filtros y búsqueda**:
   - Filtrar por asesor comercial asignado (Daniel explicó: *"Si vas a irte por comercial, digamos a Camilo, el es Camilo Ortiz"* – min 20:14)
   - Filtrar por estado (Activo / Inactivo)
   - Búsqueda por razón social, NIT, nombre de contacto
   - Filtrar por rango de fechas de última interacción

3. **Diferenciación Cliente vs Proveedor**: El sistema actual maneja un campo que diferencia clientes (valor 0) de proveedores (valor 1). La migración debe respetar esta clasificación. (Daniel: *"Entiendo que es que ellos manejaban cero y uno, es uno proveedor"* – min 20:51)

4. **Origen de los clientes**: Un cliente se crea en el sistema por dos vías:
   - **Conversión de Lead**: Cuando un lead se convierte en cliente a través del flujo comercial (ya existente en HU-0001 → HU-0003).
   - **Migración masiva**: Importación desde la plataforma actual (ver sección de Migración de Datos).
   - **Creación manual**: Desde el módulo de clientes o desde la cotización al agregar un nuevo cliente.

### 2. Ficha del Cliente (Detalle)

Al hacer clic en un cliente, el sistema debe mostrar una vista de detalle organizada en secciones/pestañas, replicando la funcionalidad actual:

**2.1 Información General**
- Razón social
- NIT / Identificación
- Dirección
- Ciudad
- Teléfono / Celular
- Correo electrónico
- Asesor comercial asignado
- Estado (Activo / Inactivo)

**2.2 Contactos**
- Un cliente puede tener múltiples contactos asociados (Daniel: *"Una cuenta puede tener 1000 contactos"* – min 27:03)
- Cada contacto incluye: Nombre, Cargo, Teléfono, Correo electrónico
- Gestión CRUD de contactos desde la ficha del cliente

**2.3 Gestión Comercial (Historial)**
Desde la ficha del cliente se debe acceder a:

1. **Cotizaciones del cliente**: Listado filtrable por estado (En proceso / Ganada / Perdida / Anulada / Todas) y por rango de fechas.
   - Daniel explicó: *"Yo sin cotizaciones quiero ver las cotizaciones que yo le he dicho, por ejemplo, a Fundación Plan [...] las que están en proceso, todas estas. Yo quiero ver todas, o las que se anularon, las que ganamos o las perdidas o todas y en un rango de fechas."* (min 30:35)

2. **Pedidos del cliente**: Listado filtrable por estado (En proceso / Cerrado / Anulado / Perdido / Todos).
   - Daniel explicó: *"Yo quiero ver cuáles son todos los pedidos gestionados con ellos, es el histórico [...] ¿Cuáles fueron anulados? ¿Cuáles fueron tomados como perdidos? ¿Cuáles son los cerrados que era un won y cuáles están en proceso?"* (min 30:07)

3. **Órdenes de Compra del cliente**: Listado de órdenes de compra generadas asociadas al cliente.
   - Daniel: *"Yo quiero buscar la orden de compra tal, la búsqueda, yo quiero ver cuáles orden de compra se han generado"* (min 34:21)

4. **Visitas / Tareas del cliente**: Registro de visitas comerciales realizadas (ver sección 3).

5. **Ventas totales**: Resumen de ventas acumuladas al cliente.

### 3. Gestión de Visitas Comerciales (Tareas)

El sistema debe permitir el registro y seguimiento de visitas presenciales que realizan los asesores comerciales a sus clientes.

**3.1 Registro de Visita**
Cada visita debe registrar:
- Cliente visitado
- Asesor comercial que realizó la visita
- Fecha de la visita
- Tipo de visita (Presencial)
- Observaciones / Notas de la visita
- Estado (Realizada / Programada / Cancelada)

**3.2 Vista de Visitas por Asesor**
El Gerente General debe poder filtrar las visitas por:
- Asesor comercial específico (Daniel: *"Yo quiero ver las visitas que hizo Camilo Ortiz"* – min 32:09)
- Rango de fechas (Daniel: *"Entonces al veinte simplemente va a colocar un día más. Esas son las visitas que generó Camilo presencial a sus clientes"* – min 32:09)
- Cliente específico

**3.3 Vista de Visitas desde la Ficha del Cliente**
Desde la ficha del cliente, sección de gestión > tareas, se debe ver el historial de visitas realizadas a ese cliente.
- Daniel mostró: *"Nos metemos aquí a gestión y vamos a meter a tareas. Aquí aparece la visita, es cuando ellos van a decir, bueno, venga, yo que he hecho con Sabana. ¿Hace cuánto no lo visito? Mira, ese cliente no lo visitan desde enero, febrero no lo han visitado. ¿Qué hubo, qué pasó?"* (min 32:09)

**3.4 Propósito de Negocio**
- Daniel paga por visita a los comerciales: *"Como yo aquí pago por visita"* (min 32:09)
- Se contrasta con el calendario (Outlook) para verificar que la visita efectivamente se realizó: *"Lo que yo hago es contrastar esta información con el Outlook y que en efecto hayan ido"* (min 32:09)
- Permite a los comerciales gestionar su cartera activamente y saber a quién no han visitado recientemente.

### 4. Permisos por Rol

| Funcionalidad | Gerente General / Director Comercial | Asesor Comercial |
| --- | --- | --- |
| Ver todos los clientes | Si | No (solo sus clientes asignados) |
| Ver ficha de cliente | Si (todos) | Si (solo sus clientes) |
| Exportar lista de clientes | Si | **No** |
| Crear / Editar cliente | Si | Si (sus clientes) |
| Gestionar contactos del cliente | Si | Si (sus clientes) |
| Ver historial de cotizaciones/pedidos | Si (todos) | Si (solo los suyos) |
| Registrar visitas | Si | Si (sus visitas) |
| Ver visitas de todos los asesores | Si | No (solo las suyas) |
| Filtrar clientes por asesor | Si | No |

**Justificación de restricción de exportación**:
Daniel explicó: *"También que el comercial pueda, o sea, excúsame [...] actualmente los comerciales tampoco pueden exportar"* y *"Si exporta la información y la están alimentando en otro lado, pierde la conexión con la plataforma"* (min 25:00 – 25:56)

### 5. Pestaña de Clientes en Módulo de Reportes

Se debe agregar una pestaña adicional "Clientes" en el módulo de reportes existente (junto a Cotizaciones, Pedidos, etc.).

Freddy propuso: *"Tú tienes tu módulo de reportes [...] tienes pestañas, cotizaciones, pedidos, tal. Entonces te va a permitir exportar en Excel el detalle. Entonces eso también pudiera servir. Y acá le colocamos una pestaña de clientes."* (min 26:06)

Esta pestaña debe permitir:
- Visualizar la base de clientes con filtros
- Exportar a Excel (solo Gerente General / Director Comercial)
- Filtrar por asesor comercial, estado, rango de fechas

### 6. Integración con Cotizaciones

En el formulario de creación de cotización, al seleccionar o crear un cliente:
- Se debe poder buscar en la base de clientes existentes
- Se debe poder crear un nuevo cliente desde una modal/ventana
- Se debe poder gestionar los contactos del cliente seleccionado

Freddy mencionó: *"Cuando van a agregar la cotización, cuando van a agregar el cliente o el contacto, que una cuenta puede tener 1000 contactos, lo puedas gestionar desde acá sin ningún problema la asignación."* (min 27:03)

### 7. Migración de Datos

**7.1 Origen de los datos**
La base de clientes existente se encuentra en la plataforma actual (tipo Odoo/ERP) bajo el módulo "Maestros > Clientes".

**7.2 Volumen estimado**
Aproximadamente 2,500+ registros de clientes. (Daniel mencionó exportar la base y Freddy confirmó: *"2500 o lo que sea, pero cuando puedas me lo pasas"* – min 20:22)

**7.3 Campos a migrar**
- Razón social / Nombre de la empresa
- NIT / Identificación
- Nombre de contacto principal
- Teléfono / Celular
- Correo electrónico
- Asesor comercial asignado
- Tipo: Cliente (0) vs Proveedor (1)

**7.4 Proceso de migración**
1. Daniel exporta la base de clientes desde la plataforma actual (archivo Excel/CSV)
2. El equipo técnico transforma los datos al formato de la nueva base de datos
3. Se realiza la carga masiva respetando la asignación por asesor comercial
4. Se valida que la información migrada esté completa y accesible

Freddy indicó: *"Nosotros tenemos que preparar un sitio para esa data y tengo que transformarla, cambiarla a lo que tu base de datos nueva tiene."* (min 20:22)

**7.5 Prioridad de migración**
Daniel fue claro en que la migración de clientes es la prioridad principal:
- *"Lo que más me interesa es que pasemos la data en cuanto a los clientes. Básicamente información de clientes, nombre, teléfono."* (min 19:12)
- Las cotizaciones y pedidos anteriores **no se migran**, se empiezan de cero: *"Las cotizaciones tocan generarse, se hacen desde cero, no tenemos ningún inconveniente."* (min 19:12)
- Los pedidos pendientes se manejarán en paralelo entre ambas plataformas hasta completarlos: *"Los pedidos pendientes los manejamos en las 2 aplicaciones."* (min 19:12)

**Casos de uso**

1. **CU-21.1 – Consultar catálogo de clientes**: El asesor comercial ingresa al módulo de clientes y visualiza su cartera de clientes asignados con filtros de búsqueda.
2. **CU-21.2 – Consultar ficha de cliente**: El usuario accede al detalle de un cliente y navega por sus secciones (información general, contactos, gestión comercial, visitas).
3. **CU-21.3 – Crear cliente manualmente**: Un usuario autorizado crea un nuevo cliente desde el módulo o desde el formulario de cotización.
4. **CU-21.4 – Editar información del cliente**: El asesor comercial actualiza datos de contacto, teléfono o correo de un cliente de su cartera.
5. **CU-21.5 – Exportar base de clientes**: El Gerente General exporta la lista de clientes a Excel, con los filtros aplicados.
6. **CU-21.6 – Registrar visita comercial**: El asesor comercial registra una visita presencial realizada a un cliente.
7. **CU-21.7 – Consultar historial de visitas por asesor**: El Gerente General filtra y consulta las visitas realizadas por un asesor comercial específico en un rango de fechas.
8. **CU-21.8 – Consultar historial comercial del cliente**: Desde la ficha del cliente, el usuario consulta cotizaciones, pedidos, órdenes de compra y visitas asociadas.
9. **CU-21.9 – Seguimiento postventa**: El asesor comercial identifica clientes a los que no ha contactado recientemente para realizar seguimiento proactivo.
10. **CU-21.10 – Migración masiva de clientes**: El equipo técnico importa la base de clientes desde la plataforma actual al nuevo sistema.

**Flujos de trabajo**

**Flujo 1 – Consulta de cartera de clientes por asesor**
1. El asesor comercial ingresa al módulo de Clientes.
2. El sistema muestra únicamente los clientes asignados a ese asesor.
3. El asesor aplica filtros (estado, búsqueda por nombre, NIT).
4. El asesor selecciona un cliente para ver su ficha completa.

**Flujo 2 – Consulta de historial comercial desde ficha del cliente**
1. El usuario accede a la ficha de un cliente.
2. Navega a la sección de "Gestión" o pestañas internas.
3. Selecciona "Cotizaciones" → ve las cotizaciones asociadas al cliente con filtro por estado y fechas.
4. Selecciona "Pedidos" → ve los pedidos asociados al cliente con filtro por estado.
5. Selecciona "Órdenes de Compra" → ve las OC generadas para el cliente.
6. Selecciona "Visitas/Tareas" → ve el historial de visitas realizadas al cliente.

**Flujo 3 – Registro de visita comercial**
1. El asesor comercial ingresa al módulo de Clientes o a la ficha de un cliente específico.
2. Selecciona "Registrar visita" o "Nueva tarea".
3. Completa los datos: fecha, tipo de visita, observaciones.
4. El sistema registra la visita asociada al cliente y al asesor.
5. La visita queda disponible en el historial del cliente y en el reporte de visitas por asesor.

**Flujo 4 – Revisión gerencial de visitas por asesor**
1. El Gerente General ingresa al módulo de Clientes o Reportes.
2. Filtra visitas por asesor comercial y rango de fechas.
3. Visualiza el listado de visitas realizadas por el asesor seleccionado.
4. Contrasta la información con el calendario para verificar cumplimiento.

**Flujo 5 – Exportación de clientes**
1. El Gerente General ingresa al módulo de Reportes > pestaña "Clientes".
2. Aplica filtros (por asesor, estado, fechas).
3. Hace clic en "Exportar".
4. El sistema genera un archivo Excel con los datos filtrados.

**Flujo 6 – Seguimiento postventa (identificar clientes sin contacto reciente)**
1. El asesor comercial ingresa al módulo de Clientes.
2. Ordena o filtra por "fecha de última interacción" (ascendente).
3. Identifica clientes sin contacto reciente.
4. Decide llamar o visitar al cliente.
5. Registra la nueva interacción (visita, cotización, etc.).

** Criterios de aceptación **

### Módulo de Clientes
1. El sistema debe contar con un módulo de Clientes accesible desde el menú lateral de la aplicación.
2. El listado de clientes debe mostrar: razón social, NIT, contacto principal, teléfono, correo, asesor asignado y estado.
3. Los asesores comerciales solo deben ver los clientes que tienen asignados; el Gerente General ve todos.
4. El sistema debe permitir filtrar clientes por: asesor comercial, estado (activo/inactivo), búsqueda libre (razón social, NIT, contacto) y rango de fechas de última interacción.
5. El sistema debe permitir la creación manual de clientes desde el módulo y desde el formulario de cotización.
6. Un cliente puede tener múltiples contactos asociados, gestionables desde su ficha.

### Ficha del Cliente
7. Al seleccionar un cliente, el sistema debe mostrar una vista de detalle con: información general, contactos, y secciones de gestión (cotizaciones, pedidos, órdenes de compra, visitas/tareas).
8. Desde la ficha del cliente se deben poder consultar cotizaciones asociadas filtrables por estado (En proceso / Ganada / Perdida / Anulada / Todas) y por rango de fechas.
9. Desde la ficha del cliente se deben poder consultar pedidos asociados filtrables por estado (En proceso / Cerrado / Anulado / Perdido / Todos).
10. Desde la ficha del cliente se deben poder consultar las órdenes de compra generadas y navegar directamente a ellas.
11. Desde la ficha del cliente se debe ver el historial de visitas/tareas realizadas por los asesores.

### Visitas Comerciales
12. El sistema debe permitir registrar visitas comerciales presenciales asociadas a un cliente y un asesor.
13. Cada visita debe registrar: cliente, asesor, fecha, tipo, observaciones y estado.
14. El Gerente General debe poder filtrar visitas por asesor comercial y rango de fechas.
15. Desde la ficha del cliente se debe visualizar cuándo fue la última visita y el historial completo de visitas.

### Exportación y Reportes
16. Solo el Gerente General / Director Comercial puede exportar la base de clientes. Los asesores comerciales **no** pueden exportar.
17. Se debe agregar una pestaña "Clientes" en el módulo de Reportes existente con capacidad de filtrado y exportación a Excel.

### Migración de Datos
18. El sistema debe soportar la importación masiva de clientes desde un archivo Excel/CSV.
19. La migración debe respetar la asignación de clientes por asesor comercial.
20. La migración debe diferenciar entre clientes y proveedores según la clasificación del sistema origen.

### Integración con Módulos Existentes
21. Desde el formulario de creación de cotización, se debe poder buscar y seleccionar clientes existentes o crear uno nuevo.
22. Los clientes convertidos desde leads (HU-0001 → HU-0003) deben aparecer automáticamente en el módulo de clientes.

**Información adicional de la reunión (Contexto del proyecto)**

### Estado del Proyecto al 19/02/2026
- Avance general: **55%**
- Desarrollo: **100%** completado
- Pruebas internas: **66%** completado
- Semana anterior: 68% desarrollo, 19% pruebas → Avance de 29% a 55% en una semana

### Ambientes de Despliegue (acordados en la reunión)
1. **Dev** (developer): Ambiente de desarrollo y pruebas internas con datos ficticios.
2. **UAT** (uat.prosuministro.com): Ambiente para pruebas del cliente. Se entregarán credenciales con diferentes roles. Fecha máxima de entrega: 27 de febrero de 2026, estimado real: antes (posiblemente jueves 26).
3. **Producción**: Ambiente final al que accederán todos los usuarios. Estimado: primeras semanas de marzo de 2026.

### Proceso de Despliegue (acordado)
- Correcciones se prueban en Dev → se despliegan en UAT → el cliente prueba → autoriza → se sube a Producción.
- Freddy: *"Cada cambio, cada corrección o algo así, nosotros la probamos en Dev, te la desplegamos en UAT, la pruebas que todo está bien [...] nos autorizan y se lo subimos a producción."* (min 10:52)

### Pruebas UAT
- Se entregarán credenciales con diferentes roles para que Daniel y su equipo prueben.
- Freddy entregará una guía de todos los flujos End-to-End con variaciones.
- Lo documentado y aprobado es lo que debe estar en la aplicación. Ajustes menores pueden hacerse de inmediato; módulos nuevos requieren nueva definición.
- Freddy: *"El alcance de tu aplicación fue lo documentado y lo aprobado [...] si identificamos algo en las pruebas, lo revisamos, si es algo que no implica un módulo nuevo [...] lo podemos ajustar de una vez."* (min 8:05)

### Verificación WhatsApp Business / Meta
- Se está realizando la verificación del portafolio comercial en la cuenta de Facebook de Daniel.
- Facebook puso la cuenta en estado restrictivo, se está realizando la validación.
- Plan C: Crear la aplicación desde la plataforma de Cegeka, usar el número de Daniel, y agregar su tarjeta de crédito como método de pago.
- Código de verificación enviado al 3204170057.

### Módulos Presentados en la Demo
Durante la reunión, Freddy mostró el estado actual de la aplicación:
1. **Módulo de Leads**: Listado con estados (Creado, Pendiente, Convertido).
2. **Cotizaciones**: Listado con información de cotizaciones.
3. **Productos y Liquidaciones**: Disponibles.
4. **Módulo de Pedidos**: Con detalle de pedido, despachos, pendientes y trazabilidad.
5. **Control de Pendientes**: Tablero operativo funcional.
6. **Reportes**: Cotizaciones, pedidos, ingresos y rendimientos.
7. **WhatsApp (módulo habilitado)**: Para conectar WhatsApp Business del asesor comercial y chatear desde la plataforma. Aún sin probar.
8. **WhatsApp de Meta**: Para creación automática de leads desde conversaciones.
9. **Notificaciones**: Campana de notificaciones funcional que redirige a cotizaciones.
10. **Modo claro/oscuro**: Disponible con colores del branding.

**No hace parte del alcance del presente requerimiento**
1. La creación del flujo de leads (cubierta en HU-0001).
2. La conversión de lead a cliente (cubierta en HU-0003).
3. La gestión de cotizaciones, pedidos y órdenes de compra (cubiertas en HU-0003 a HU-0020).
4. La integración con WhatsApp (cubierta en HU-0012).
5. La gestión de proveedores (aunque la migración diferencia clientes de proveedores, el módulo de proveedores como tal no es parte de este requerimiento).
6. Alertas automáticas de seguimiento postventa (pueden definirse en un requerimiento posterior).
7. Geolocalización de visitas.
8. Integración con calendarios externos (Outlook, Google Calendar).
