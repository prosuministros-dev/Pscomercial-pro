**HU-0017 – Logística y Seguimiento (Pedidos 2)
Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
Se requiere implementar la funcionalidad de **registro y gestión de la información logística del pedido**, basada exclusivamente en la hoja **“Pedidos 2 / Logística”** del Excel “Parametrización CRM.xlsx”.
Esta HU permite registrar el avance operativo del pedido (despacho, transporte y entrega), manteniendo control por destino, sin modificar información comercial ni financiera previamente definida.

**Alcance

**Esta historia cubre:
1. Registro de información logística por pedido
2. Registro de información logística por destino
3. Actualización de estados logísticos
4. Registro de fechas logísticas
5. Registro de información de transporte
6. Registro de observaciones logísticas
7. Trazabilidad completa de cambios
Cualquier funcionalidad no listada se considera **fuera de alcance explícito**.
**Descripción detallada del requerimiento**
El sistema debe permitir que usuarios autorizados registren la información logística del pedido, siguiendo **exactamente los campos y lógica definidos en el Excel**.

La logística:

1. Puede registrarse de forma **parcial y completo**
2. Puede variar por **destino**
3. No modifica información del pedido, cotización u OC
4. Impacta únicamente el **estado logístico
**
Toda actualización logística debe quedar registrada en el historial del pedido.


**Casos de Uso 

CU-01: Registrar información logística**
**Actor: **Usuario logístico / operaciones**
Precondición: **Pedido existente**
Resultado: **Información logística registrada

**CU-02: Actualizar estado logístico**
**Actor: **Usuario autorizado**
Resultado: **Estado logístico actualizado y trazado

**CU-03: Registrar logística por destino**
**Actor: **Usuario autorizado**
Resultado: **Información diferenciada por destino

**CU-04: Consultar seguimiento**
**Actor: **Usuario autorizado**
Resultado: **Visualiza avance logístico

**Criterios de Aceptación 
**
1. ** Identificación logística
**
El sistema debe permitir registrar y mostrar:

1. Pedido asociado (número de pedido)
2. Destino asociado
3. Estado logístico
4. Responsable logístico
Reglas:
1. El pedido debe existir
2. El destino debe existir y pertenecer al pedido
3. Campos obligatorios
4. No editables desde la vista de detalle (solo desde logística)

1. ** Fechas logísticas
**
El sistema debe permitir registrar:

1. Fecha estimada de despacho
2. Fecha real de despacho
3. Fecha estimada de entrega
4. Fecha real de entrega
Reglas:
1. Todas las fechas son opcionales
2. No se calculan automáticamente
3. No se infieren si están vacías
4. La fecha real no puede ser anterior a la fecha estimada (si existe)

1. ** Información de transporte
**
El sistema debe permitir registrar:
1. Tipo de envío (nacional / local)
2. Medio de transporte
3. Transportador
4. Número de guía  
Reglas:
5. Campos opcionales según el Excel
6. No se valida formato de guía salvo que el Excel lo indique
7. No se conecta con sistemas externos

1. ** Información de despacho
**
El sistema debe mostrar (heredado del destino):
1. Dirección de entrega
2. Ciudad
3. País
Reglas:
1. No editable desde logística
2. Proviene del destino registrado en HU 14

**5. Observaciones logísticas
**
El sistema debe permitir registrar:
1. Observación logística
2. Usuario que registra
3. Fecha y hora del registro
Reglas:
1. Observaciones no editables ni eliminables
2. Cada observación es un evento independiente

**6. Estados logísticos permitidos
**
El sistema debe permitir únicamente los estados definidos en el Excel, por ejemplo:
1. Pendiente de despacho
2. En preparación
3. Despachado
4. En tránsito
5. Entregado
6. Incidencia logística
Reglas:
1. No se permiten estados adicionales
2. No se permiten transiciones automáticas
3. Todo cambio de estado debe ser manual y trazado

**7.  Trazabilidad logística
**
Por cada acción logística registrada, el sistema debe generar un evento con:
1. Tipo de evento (registro / actualización)
2. Estado anterior
3. Estado nuevo
4. Usuario
5. Fecha
6. Hora
Reglas:
1. Eventos no editables
2. Eventos no eliminables
3. Orden cronológico obligatorio

**8.  Restricciones explícitas
**
El sistema no debe:

1. Modificar información comercial
2. Modificar información financiera
3. Modificar información de cotización
4. Modificar información de OC
5. Calcular fechas automáticamente
6. Inferir estados
7. Consolidar logística entre destinos

**6. No hace parte
**
1. Automatización de flujos logísticos
2. Integraciones con transportadoras
3. Confirmación automática de entrega
4. Generación de documentos de transporte
5. Notificaciones automáticas
