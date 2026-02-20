**HU-0007 – Creación y Gestión del Pedido (Pedidos 1)**
**Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
Se requiere implementar la funcionalidad de **creación del pedido a partir de una cotización previamente creada y aprobada**, utilizando dicha cotización como **fuente única de datos comerciales base**.
El pedido representa la **formalización operativa del acuerdo comercial**, por lo cual la información heredada de la cotización **no puede ser modificada una vez se guarde el pedido** y debe mantenerse trazabilidad permanente entre ambos artefactos.
Esta HU se basa exclusivamente en la hoja **“Pedidos 1”** del Excel “Parametrización CRM.xlsx”.

**Alcance

**Esta historia cubre:
1. Creación del pedido **desde una cotización aprobada**
2. Carga automática de información heredada de la cotización
3. Registro de condiciones operativas y financieras
4. Definición de reglas de facturación
5. Definición de forma de pago
6. Registro de uno o varios destinos
7. Bloqueo total de edición posterior
8. Registro de trazabilidad (usuario, fecha, hora)
9. Asociación permanente cotización → pedido
Cualquier funcionalidad no listada se considera **fuera de alcance explícito**.
**Descripción detallada del requerimiento**
El sistema debe permitir la creación de un pedido **únicamente a partir de una cotización existente en estado “Aprobada”**.
El flujo correcto es:
1. Selección de cotización aprobada
2. Carga automática de información comercial base
3. Complemento de información operativa definida en “Pedidos 1”
4. Creación y bloqueo del pedido
La información heredada de la cotización incluye, como mínimo:

1. Cliente
2. Ítems / servicios
3. Cantidades
4. Valores
5. Condiciones comerciales acordadas
Esta información:

1. Debe cargarse automáticamente
2. Debe mostrarse en modo solo lectura

El pedido, una vez creado, se convierte en el **documento operativo base** del ciclo de vida y **no puede editarse, solo podrá el rol super administrador**.


**Casos de Uso 
**
**CU-00: Crear pedido desde cotización
**
**Actor: **Usuario comercial**
Precondición: **Existe al menos una cotización en estado “Aprobada”**
Flujo:**
1. El usuario selecciona una cotización aprobada
2. El sistema carga automáticamente los datos base
3. El usuario diligencia información operativa
4. El sistema crea el pedido vinculado

**CU-01: Validar información heredada**
**Actor: **Sistema**
Resultado: **Campos comerciales quedan bloqueados

**CU-02: Definir tipo de facturación**
**Actor: **Usuario comercial**
Resultado: **Se registran reglas válidas según Excel

**CU-03: Definir forma de pago**
**Actor: **Usuario comercial**
Resultado: **Se validan reglas financieras

**CU-04: Registrar múltiples destinos**
**Actor: **Usuario comercial**
Resultado: **Destinos asociados sin duplicar información comercial

**CU-05: Bloqueo del pedido**
**Actor: **Sistema**
Resultado: **Pedido queda en modo solo lectura

**Criterios de Aceptación 
**
**1. Origen obligatorio del pedido
**
Dado que un usuario intenta crear un pedido entonces el sistema debe exigir la selección de una cotización existente
1. la cotización debe estar en estado “Aprobada”
2. el sistema no debe permitir crear pedidos sin cotización
3. el sistema no debe permitir usar cotizaciones en otros estados

**
2.  Carga automática desde cotización
**
Dado que el usuario selecciona una cotización aprobada entonces el sistema debe cargar automáticamente:

  1. Cliente
  2. Ítems / servicios
  3. Valores
1. estos campos deben mostrarse como solo lectura
2. cualquier intento de modificación debe ser rechazado

**
3.  Formulario Pedidos 1
**
Dado el formulario de creación del pedido Entonces el sistema debe mostrar exactamente los campos definidos en la hoja “Pedidos 1” Y no debe agregar campos no definidos en el Excel

**
4. Campos obligatorios
**
1. Dado el formulario activo entonces todos los campos marcados como obligatorios en el Excel deben ser obligatorios en el sistema y el sistema no debe permitir guardar si falta al menos uno

**
5. Validación de tipo de facturación
**
Dado que el usuario selecciona:

  1. Facturación total o parcial
  2. Con o sin confirmación de entrega
1. Entonces:
  1. El sistema debe permitir únicamente combinaciones definidas en el Excel
  2. El sistema debe bloquear combinaciones no definidas
2. Y debe mostrar mensaje de error funcional (no técnico)

**6. Validación de forma de pago
**
Dado que el usuario selecciona una forma de pago

1. Cuando la forma de pago es “Anticipado”
Entonces:
  1. El sistema debe marcar el pedido como pendiente de confirmación de pago
  2. El pedido no puede avanzar a logística
Y cuando la forma es crédito:
  1. Debe registrarse plazo
  2. El sistema no debe permitir valores fuera de rango

**7. Destinos
**
Dado un pedido en creación cuando el usuario registra múltiples destinos entonces:

  1. El sistema debe asociarlos al mismo pedido
  2. No debe duplicar información comercial
1. Y cada destino debe validarse de forma independiente

**
8. Guardado del pedido
**
Dado que el formulario es válido cuando el usuario guarda el pedido entonces el sistema debe:
  1. Generar un identificador único de pedido (orden de pedido)
  2. Registrar usuario, fecha y hora
  3. Asociar permanentemente la cotización origen

**
9.  Bloqueo total**
**
**Dado un pedido creado entonces:
  1. Ningún usuario puede editar información comercial u operativa
  2. El pedido debe mostrarse en modo solo lectura

**10. Trazabilidad cotización → pedido
**
Dado un pedido existente entonces el sistema debe:

  1. Mostrar el identificador de la cotización origen
  2. Permitir navegación desde el pedido hacia la cotización
1. Y esta relación no puede eliminarse ni reemplazarse

**
11.  Restricciones explícitas
**
El sistema no debe:
1. Crear pedidos sin cotización
2. Permitir cambiar la cotización origen
3. Permitir modificar valores comerciales
4. Inferir información no ingresada
5. Automatizar cambios de estado

**6. No hace parte**
1. Creación o edición de cotizaciones
2. Modificación de información heredada
3. Cambio de cotización asociada
4. Flujo de aprobaciones
5. Integraciones contables
6. Automatización de estados
