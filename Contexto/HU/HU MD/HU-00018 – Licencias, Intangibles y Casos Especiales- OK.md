**HU-0018 – Licencias, Intangibles y Casos Especiales
Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
Se requiere implementar la gestión de **licencias, intangibles y casos especiales** asociados a un pedido, los cuales **no siguen un flujo logístico tradicional** (despacho físico), pero sí requieren control operativo, fechas, estados y trazabilidad.
Esta HU permite registrar y consultar este tipo de pedidos **sin forzar campos logísticos físicos**, respetando la forma en que hoy se gestiona en el Excel “Parametrización CRM.xlsx”.

**Alcance

**Esta historia cubre:
1. Identificación de pedidos con licencias o intangibles
2. Registro de información específica para licencias/intangibles
3. Estados especiales no logísticos
4. Fechas relevantes
5. Observaciones
6. Trazabilidad de eventos
Cualquier funcionalidad no listada se considera **fuera de alcance explícito**.
**Descripción detallada del requerimiento**
El sistema debe permitir que ciertos pedidos o ítems del pedido sean marcados como **licencias, intangibles o casos especiales**, lo que implica:
1. No requerir información de transporte físico
2. No exigir fechas de despacho
3. Manejar estados distintos a los logísticos tradicionales
Estos casos deben coexistir con pedidos físicos sin romper el flujo general.


**Casos de Uso 

CU-01: Marcar pedido como licencia / intangible**
**Actor: **Usuario autorizado**
Precondición: **Pedido existente**
Resultado: **Pedido identificado como no físico

**CU-02: Registrar información de licencia**
**Actor: **Usuario autorizado**
Resultado: **Información específica registrada

**CU-03: Consultar estado del intangible**
**Actor: **Usuario autorizado**
Resultado: **Visualiza estado y fechas

**Criterios de Aceptación 
**
1. ** Identificación del tipo de pedido
**
El sistema debe permitir identificar si el pedido o ítem corresponde a:
1. Licencia (tangibles)
2. Intangible
3. Caso especial
4. Servicios (Se adiciona al archivo Excel)
Reglas:
1. Esta identificación debe provenir del Excel o selección explícita
2. No debe inferirse automáticamente
3. No es editable desde el detalle

**
2. Información específica de licencias / intangibles
**
El sistema debe permitir registrar y mostrar:
1. Tipo de licencia / intangible
2. Alcance de la licencia
3. Duración (si aplica)
4. Fecha de inicio
5. Fecha de vencimiento
6. Proveedor o fabricante
7. Modalidad de entrega (correo, portal, acceso remoto, etc.)
Reglas:
1. Campos opcionales según Excel
2. No se validan reglas externas
3. No se generan activaciones automáticas

- **
3.  Fechas relevantes
**
El sistema debe permitir registrar:
1. Fecha estimada de entrega
2. Fecha real de entrega
3. Fecha de activación (si aplica)
Reglas:
1. Fechas no obligatorias
2. No se calculan automáticamente
3. No se infieren

**4. Estados especiales permitidos
**
El sistema debe permitir únicamente estados definidos en el Excel, por ejemplo:
1. Pendiente de entrega
2. Entregado
3. Activado
4. Vencido
5. Incidencia
Reglas:
1. No se permiten estados adicionales
2. No se permiten cambios automáticos
3. Cada cambio genera evento

**5. Observaciones
**
El sistema debe permitir registrar:
1. Observación
2. Usuario
3. Fecha
4. Hora
Reglas:
1. No editables
2. No eliminables

**6. Trazabilidad
**
Por cada evento registrado, el sistema debe almacenar:
1. Tipo de evento
2. Estado anterior
3. Estado nuevo
4. Usuario
5. Fecha
6. Hora
Reglas:
1. Eventos inmutables
2. Orden cronológico

**7.  Restricciones explícitas
**
El sistema no debe:
1. Exigir información logística física
2. Generar guías
3. Calcular fechas de vencimiento
4. Activar licencias automáticamente
5. Integrarse con proveedores

**6. No hace parte**
1. Activación automática de licencias
2. Envío automático de credenciales
3. Integraciones externas
4. Facturación automática
