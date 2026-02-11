**HU-0016 – Órdenes de Compra y Proveedores
Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
Se requiere implementar la **gestión de Órdenes de Compra (OC) asociadas a un pedido**, permitiendo registrar, consultar y dar seguimiento a las compras realizadas a proveedores para cumplir con un pedido específico.
La Orden de Compra representa el **vínculo operativo entre el pedido y el proveedor**, y su información debe mantenerse **trazable, controlada y no ambigua**, tal como se gestiona actualmente en el Excel “Parametrización CRM.xlsx”.

**Alcance

**Esta historia cubre:
1. Creación de órdenes de compra asociadas a un pedido
2. Asociación de proveedores a cada OC
3. Registro de información económica y operativa de la OC
4. Visualización del estado de la OC
5. Asociación de una o varias OC a un mismo pedido
6. Trazabilidad OC → Pedido → Cotización
Cualquier funcionalidad no listada se considera **fuera de alcance explícito**.
**Descripción detallada del requerimiento**
El sistema debe permitir registrar **una o varias órdenes de compra** asociadas a un pedido existente.
Cada OC:
1. Está asociada a **un solo proveedor**
2. Puede cubrir **uno o varios ítems** del pedido
3. Tiene vida propia, pero siempre vinculada al pedido
La información registrada en la OC **no modifica** la información comercial del pedido ni de la cotización.


**Casos de Uso 

CU-01: Crear orden de compra**
**Actor:** Usuario autorizado (compras / operaciones)
**Precondición:** Pedido existente
**Resultado:** OC creada y asociada al pedido

**CU-02: Asociar proveedor**
**Actor:** Usuario autorizado
**Resultado:** Proveedor vinculado a la OC

**CU-03: Consultar OC**
**Actor:** Usuario autorizado
**Resultado:** Visualiza información completa de la OC

**CU-04: Asociar múltiples OC a un pedido**
**Actor:** Usuario autorizado
**Resultado:** Pedido con una o varias OC asociadas

**Criterios de Aceptación 
**
1. ** Identificación de la Orden de Compra**
El sistema debe mostrar los siguientes campos obligatorios:
1. Número de orden de compra (sistema)
2. Pedido asociado (número de pedido)
3. Estado de la orden de compra
4. Fecha de creación de la OC
5. Usuario creador de la OC
6. Ítem que reemplace flete
Reglas:
1. Campos obligatorios
2. No editables después de la creación, solo el área de compras lo puede editar.
3. No ocultables

1. ** Información del proveedor
**
El sistema debe mostrar y registrar:
1. Nombre del proveedor
2. Identificación del proveedor
3. Tipo de proveedor (si aplica según Excel)
4. Contacto del proveedor
5. Correo electrónico del proveedor
Reglas:
1. Un proveedor por OC
2. No se permiten múltiples proveedores en una misma OC
3. La información del proveedor no modifica un maestro global (si existe)

**3. Ítems asociados a la OC
**
El sistema debe permitir asociar a la OC:
1. Ítems del pedido
2. Cantidad por ítem
3. Observaciones por ítem (si aplica)
Reglas:
1. Solo se pueden seleccionar ítems existentes en el pedido
2. No se pueden crear ítems nuevos
3. Las cantidades no pueden exceder las del pedido
4. Se recalculan valores comerciales del la orden de compra según la TRM de día.

**4. Información económica de la OC
**
El sistema debe mostrar:
1. Valor total de la OC
2. Moneda (Pesos y USD)
3. Condición de pago al proveedor
Reglas:
1. Valores informativos
2. No impactan valores del pedido
3. No se calculan automáticamente si no están definidos
4. Debe permitir cambiar moneda por producto en OC (pesos y USD)

**5.  Fechas de la OC
**
El sistema debe mostrar:
1. Fecha estimada de entrega del proveedor
2. Fecha real de entrega del proveedor
Reglas:
1. Fechas opcionales
2. No inferidas
3. No calculadas automáticamente

**6.  Estados de la Orden de Compra
**
El sistema debe permitir únicamente los estados definidos en el Excel, por ejemplo:
1. Creada
2. Enviada al proveedor
3. Confirmada por proveedor
4. Recibida
5. Cerrada
6. Cancelada
Reglas:
1. No se permiten estados adicionales
2. No se permiten cambios automáticos de estado
3. Todo cambio de estado debe registrarse como evento

**7.  Asociación OC ↔ Pedido
**
1. Cada OC debe estar asociada a un único pedido
2. Un pedido puede tener múltiples OC
3. La relación no puede eliminarse una vez creada la OC

**8. Trazabilidad de la OC
**
Por cada evento de la OC, el sistema debe registrar:
1. Evento
2. Estado anterior
3. Estado nuevo
4. Usuario
5. Fecha
6. Hora
Reglas:
1. No editable
2. No eliminable
3. Orden cronológico obligatorio

**9.  Restricciones explícitas
**
El sistema no debe:
1. Modificar información del pedido
2. Modificar información de la cotización
3. Crear OC sin pedido
4. Asociar OC a múltiples pedidos
5. Inferir valores o fechas
6. Automatizar aprobaciones o envíos

**
6. No hace parte
**
1. Gestión contractual de proveedores
2. Pagos a proveedores
3. Integraciones contables
4. Automatización de estados
5. Aprobaciones automáticas
