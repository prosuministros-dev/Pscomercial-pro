**HU-0007 – Panel Principal y Gestión de Pedidos**
**Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
Se requiere implementar el **Panel Principal de Gestión de Pedidos**, el cual será la pantalla inicial del sistema y replicará fielmente la funcionalidad de control actualmente realizada en el Excel “Parametrización CRM.xlsx”.
Este panel **no introduce lógica de negocio nueva**, sino que digitaliza la visualización, búsqueda y acceso a pedidos existentes, manteniendo intacto el flujo operativo actual.

**Alcance

**Esta historia cubre:
1. Consulta de pedidos
2. Visualización por estado
3. Filtros simples
4. Búsqueda textual
5. Navegación al detalle del pedido
6. Orden por número de pedido descendente
Cualquier funcionalidad no listada se considera **fuera de alcance explícito**.
**Descripción detallada del requerimiento**
El sistema debe presentar un listado consolidado de pedidos que permita a los usuarios:

1. Identificar el estado actual de cada pedido
2. Localizar pedidos específicos
3. Acceder al detalle sin modificar información
El panel debe comportarse como una vista de consulta, sin capacidades de edición directa.


**Casos de Uso 
**
**CU-01: Visualización inicial de pedidos**
**Actor:** Usuario autorizado
**Precondición:** El usuario tiene permisos de visualización
**Resultado esperado:** Visualiza pedidos en proceso

**CU-02: Filtrar pedidos por estado**
**Actor:** Usuario autorizado
**Precondición:** El panel está cargado
**Resultado esperado:** Se muestran solo pedidos del estado seleccionado

**CU-03: Búsqueda de pedidos**
**Actor:** Usuario autorizado
**Precondición:** Existe al menos un pedido registrado
**Resultado esperado:** Se muestran pedidos coincidentes

**CU-04: Acceso al detalle**
**Actor:** Usuario autorizado
**Resultado esperado:** Navega al detalle del pedido sin modificar datos

**Criterios de Aceptación 
**
**1. Carga inicial del panel**

Dado que un usuario autenticado accede al sistema cuando el sistema carga el panel principal, entonces debe mostrarse automáticamente el listado de pedidos en estado “En proceso” y el sistema no debe requerir ninguna acción previa del usuario y el listado no debe incluir pedidos en otros estados salvo que el usuario lo solicite

**
2. Estructura mínima del listado
**
Dado un pedido visible en el listado entonces cada registro debe mostrar obligatoriamente:

  1. Número de pedido (no editable)
  2. Nombre del cliente
  3. Estado actual
  4. Fecha de creación
  5. Valor total
  6. Asunto
Y si alguno de estos datos no existe, el sistema debe:
  1. Mostrar un indicador de dato incompleto
  2. No ocultar el pedido

**
3.  Estados permitidos
**
1. El sistema **solo** debe permitir los siguientes estados:
  1. En proceso
  2. Cerrado
  3. Anulado

**
4.  Filtro por estado
**
**Dado** que el usuario selecciona un estado específico c**uando** el filtro es aplicado **Entonces**:

  1. El sistema debe mostrar únicamente pedidos con ese estado
  2. El sistema debe ocultar pedidos de otros estados
**
Y**:
  1. Solo puede existir un filtro activo
  2. El filtro debe ser reversible
  3. El sistema no debe perder el contexto de búsqueda

**
5.  Búsqueda textual**
**
Dado** que el usuario ingresa texto en el campo de búsqueda c**uando** presiona buscar e**ntonces**:

  1. El sistema debe buscar por número de pedido y cliente
  2. La búsqueda debe ejecutarse sobre todos los estados
**Y**:
  1. Si no hay coincidencias, debe mostrarse mensaje informativo
  2. No debe producirse error técnico

**6. Acceso al detalle
**
**Dado** que el usuario selecciona un pedido c**uando** accede al detalle
**entonces**:

  1. El sistema debe redirigir a la vista de detalle
  2. El pedido debe mostrarse en modo solo lectura (solo rol super admin)
**Y**:
  1. No deben existir campos editables desde esta acción

**7. Restricciones explícitas**
El sistema **no debe**:
1. Permitir edición desde el panel
2. Ejecutar acciones masivas
3. Cambiar estados automáticamente
4. Mostrar métricas, KPIs o gráficos
