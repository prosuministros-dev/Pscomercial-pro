**HU-0019 – Tablero Operativo de Seguimiento de Pedidos (Vista Matricial por Colores)
Ultima actualización | **Laura Martínez | 19/01/2025
**Resumen Ejecutivo**
El negocio requiere un **Tablero Operativo digital** que replique **exactamente** la matriz operativa que hoy se gestiona en Excel, conservando su lógica de **múltiples colores por pedido** para representar **responsabilidades y acciones pendientes**, no un único estado.
El tablero será el **sistema maestro de seguimiento diario** del rol Gerente operativo, permitiéndole visualizar, en una sola pantalla, el estado real de cada producto dentro de un pedido, identificar cuellos de botella y saber **quién debe hacer qué**, sin depender de reportes ni validaciones externas.
El sistema debe respetar que:
1. Un pedido puede tener **múltiples colores simultáneamente**.
2. El color **no es decorativo ni un estado único**, sino un **indicador de responsabilidad + acción pendiente por columna**.
3. El tablero será un **módulo independiente** al módulo principal de pedidos, ya que su información no es relevante para todos los usuarios del sistema.

**Alcance

**Esta historia cubre:
1. Pantalla tipo **tabla/matriz**, visualmente equivalente al Excel actual.
2. Gestión de pedidos **a nivel de producto** (no solo por pedido).
3. Soporte para **múltiples colores simultáneos por fila**.
4. Parametrización de colores y su significado operativo.
5. Registro de trazabilidad por cada cambio de color.
6. Vista operativa (Gerente Operativo).
7. Vista ejecutiva agregada tipo **Kanban** (Gerente General), derivada automáticamente de la lógica de colores.

Cualquier funcionalidad no listada se considera **fuera de alcance explícito**.
**Descripción detallada del requerimiento**
Como **Gerente Operativo**, quiero contar con un **Tablero Operativo digital** que replique mi cuadro de seguimiento actual, para **gestionar diariamente pedidos y productos**, identificando responsabilidades, pendientes y avances mediante colores,
sin perder la lógica ni el control que hoy tengo en Excel.

El sistema debe permitir:
1. Visualizar pedidos por producto.
2. Asignar y quitar responsabilidades mediante colores.
3. Reflejar avances parciales (ej. entregas parciales).
4. Entender el estado real del negocio sin depender de la información auto-reportada por otras áreas.


**Casos de Uso 

CU-01 – Visualizar tablero operativo**

El usuario visualiza una tabla con pedidos y productos, donde cada columna puede tener un color independiente que indica responsabilidad o acción pendiente.

**CU-02 – Asignar color a una columna
**
El usuario selecciona una celda (pedido + columna) y asigna un color según la acción o responsable pendiente.**
**
**CU-03 – Retirar responsabilidad
**
Cuando una acción se cumple (ej. proveedor confirma recolección), el usuario retira el color correspondiente y lo asigna a la siguiente responsabilidad.

**CU-04 – Manejar múltiples estados simultáneos
**
Un mismo producto puede:
1. Estar listo para despacho (verde),
2. Sin remisión generada (morado),
3. Sin factura (rojo),
4. Sin guía relacionada (naranja),
todo al mismo tiempo.
**CU-05 – Visualización solo lectura para otros roles
**
Jefe y auxiliar de bodega pueden ver el tablero en tiempo real, pero no modificarlo.

**CU-06 – Vista ejecutiva Kanban**
El Gerente General visualiza una vista agregada sin colores operativos, basada en estados macro calculados.

**Criterios de Aceptación 

1. Reglas Clave de Negocio**

### Una fila puede tener múltiples colores simultáneamente.


### El color se interpreta por columna, no por pedido.


### Los colores representan responsabilidad + acción pendiente.


### El Gerente Operativo es el único rol que modifica el tablero.


### Cada cambio de color debe registrar:


### Usuario


### Fecha


### Motivo

**2. Visualización general del tablero**
**2.1. Estructura del Tablero Operativo (Vista Tabla)**
**Bloque 1 – Información Operativa Base**
Columnas:
1. Proveedor
2. OC
3. Cliente
4. OP
5. Producto
6. Cantidad
7. Fecha de entrega
8. Responsable
9. Novedades

**2.2 Renderizado de la vista matriz**

### El sistema debe mostrar una vista tipo tabla.


### Cada fila representa un producto dentro de un pedido.


### Las columnas deben agruparse visualmente en:


### Bloque Operativo (izquierda)


### Separador visual fijo


### Bloque Administrativo (derecha)


### 2.3. Persistencia visual


### Al recargar la pantalla:


### Los colores asignados previamente deben mantenerse.


### No debe recalcularse ningún color automáticamente.


### 3. Significado funcional de colores


### 3.1. Colores de responsabilidad


### El sistema debe permitir al menos:


### 🔴 Rojo


### Bloqueos financieros/comerciales


### Impide avance operativo


### 🟠 Naranja


### Pendientes del Auxiliar de Bodega


### 🟣 Morado


### Pendientes del Jefe de Bodega


### 🟡 Amarillo


### Pendientes de Compras


### 🔵 Azul


### Licencias / servicios recurrentes


### 🟢 Verde claro


### Proceso avanzado, no cerrado


### 🟢 Verde oscuro


### Proceso completado


### ⚠️ El sistema no interpreta el significado, solo lo muestra y registra.


### 4. Asignación de colores


### 4.1.  Acción manual obligatoria


### Ningún color puede asignarse:


### Por reglas automáticas


### Por acciones de otros usuarios


### Solo el Gerente Operativo puede:


### Asignar


### Cambiar


### Eliminar colores


### 4.2.  Flujo de asignación


### Cuando el usuario asigna un color:


### Selecciona una celda (producto + columna).


### Selecciona un color del catálogo.


### El sistema solicita:


### Motivo (campo obligatorio).


### Al confirmar:


### Se pinta la celda.


### Se registra la trazabilidad.

**5. Trazabilidad y auditoría**
**5.1  Registro obligatorio
**
Cada acción de color debe generar un registro con:
1. Pedido
2. Producto
3. Columna
4. Color anterior
5. Color nuevo
6. Usuario
7. Fecha y hora
8. Motivo
**5.2.  Historial consultable
**
1. El historial debe poder consultarse:
  1. Por pedido
  2. Por producto
2. No es editable.

**6. Roles y permisos
**
**6.1 Edición restringida
**
1. Solo el Gerente Operativo puede:
  1. Modificar colores
  2. Cambiar estados**
**
**6.2 Visualización para otros roles
**
1. Jefe de Bodega y Auxiliar:
  1. Solo pueden ver el tablero.
  2. No pueden modificar nada.

**
 No hace parte**
1. Alertas automáticas
2. Notificaciones por correo o WhatsApp
3. Reglas predictivas
4. Priorización inteligente
5. Configuración de colores
