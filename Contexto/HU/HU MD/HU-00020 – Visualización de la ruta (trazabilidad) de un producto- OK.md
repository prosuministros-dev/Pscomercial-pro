**HU-0020 – Visualización de la ruta (trazabilidad) de un producto
Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
Actualmente no existe una forma centralizada y visual de conocer el recorrido que ha tenido un producto específico dentro del sistema (desde su creación hasta su estado actual).
Esta funcionalidad permitirá consultar la **ruta histórica de un producto**, mostrando de manera cronológica los **estados, eventos y transiciones** por los que ha pasado, con el objetivo de mejorar la trazabilidad, reducir consultas manuales y facilitar el análisis operativo.
La HU **no introduce nueva lógica de negocio**, se basa en la información ya registrada y parametrizada en el sistema.

**Alcance

**Esta historia cubre:
1. Consulta de la **ruta histórica de un producto específico**.
2. Visualización cronológica de:
  1. Estados del producto.
  2. Fechas y horas de cada cambio.
  3. Usuario o sistema que ejecutó la acción.
  4. Observaciones asociadas (si existen).
3. Acceso desde:
  1. Detalle del producto.
  2. Módulo correspondiente (ej. compras / productos).
4. Visualización en formato:
  1. Línea de tiempo o listado secuencial.
**No incluye**
1. Creación o modificación de estados.
2. Reprocesamiento o reversión de eventos.
3. Cambios en la lógica actual de negocio.
4. Edición del historial mostrado.
**Descripción detallada del requerimiento**
**Como** usuario del sistema (operativo / administrativo)
**Quiero** visualizar la ruta completa que ha tenido un producto específico
**Para** entender su estado actual, validar su historial y facilitar el seguimiento operativo.
El sistema debe permitir seleccionar un producto y consultar todos los eventos históricos asociados, ordenados cronológicamente, utilizando únicamente información existente


**Casos de Uso 

Caso de uso 1: **Consultar trazabilidad desde el detalle del producto
**Actor: U**suario operativo**
Precondición**: El producto existe en el sistema**
Flujo:**
1. El usuario accede al detalle del producto.
2. Selecciona la opción “Ver ruta / trazabilidad”.
3. El sistema muestra la ruta histórica del producto**.**

**Caso de uso 2: **Validar estado actual con historial
**Actor: **Usuario administrativo
**Precondición: **El producto tiene al menos un cambio de estado registrado**
Flujo:**
1. El usuario consulta la ruta del producto.
2. Revisa los eventos y estados previos.
3. Confirma coherencia entre el estado actual y su historial.

**Flujo propuesto**
1. Usuario ingresa al módulo correspondiente.
2. Selecciona un producto específico.
3. Hace clic en la opción “Ruta del producto”.
4. El sistema:
5. Recupera los eventos históricos asociados.
6. Ordena la información cronológicamente.
5. Se muestra la ruta del producto con:
1. Estado
2. Fecha y hora
3. Responsable
4. Observaciones (si aplica)

**Criterios de Aceptación 
**
  1. El sistema permite consultar la ruta de un producto existente.
  2. La información se presenta en orden cronológico.
  3. Cada evento muestra al menos:
1. Estado
2. Fecha y hora
3. Usuario o sistema responsable.
4. La consulta es solo de lectura (no editable).
  1. No se introduce lógica de negocio nueva.
  2. Si el producto no tiene historial, el sistema informa:
“El producto no cuenta con eventos históricos registrados.”
  1. La visualización es consistente con la parametrización definida en el sistema.
