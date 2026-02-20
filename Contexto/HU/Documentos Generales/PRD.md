**PRD – Tablero Operativo de Seguimiento de Pedidos**
**1. Introducción**
Actualmente el cliente realiza el seguimiento de pedidos mediante un cuadro operativo en SharePoint, utilizando codificación por colores para identificar responsables, pendientes y estados del proceso.
Este mecanismo ha demostrado ser altamente efectivo a nivel operativo, pero presenta limitaciones en escalabilidad, trazabilidad, control de cambios y segmentación por roles.
Este PRD define el desarrollo de un **Tablero Operativo digital**, que replica y mejora la lógica existente, manteniendo el **lenguaje visual por colores**, pero estructurándolo como un sistema formal.

**2. Objetivo del Producto**
Desarrollar una pantalla operativa en vista **tabla**, orientada al **Gerente Operativo**, que permita:
- Visualizar pedidos a nivel de **producto**
- Identificar rápidamente **quién es el responsable actual**
- Detectar **pendientes, bloqueos y avances**
- Dar seguimiento simultáneo a múltiples áreas
- Alimentar una **vista ejecutiva agregada (Kanban)** para el Gerente General

**3. Usuarios y Roles**
**3.1 Gerente Operativo**
- Usuario principal del tablero operativo
- Visualiza **todos los colores**
- Gestiona el día a día
- Toma decisiones tácticas
**3.2 Gerente General**
- No visualiza colores
- Accede a una **vista Kanban agregada**
- Observa estados consolidados, oportunidades y cuellos de botella
- Toma decisiones estratégicas

**4. Concepto Clave del Sistema**
El tablero no maneja un único estado por pedido.
Cada columna representa un proceso o responsabilidad independiente, por lo que **una misma fila puede tener múltiples colores simultáneamente**.
El color:
- **No es decorativo**
- **No es un estado único**
- Es un **indicador de responsabilidad + acción pendiente**, interpretado por columna.

**5. Estructura del Tablero Operativo (Vista Tabla)**
**5.1 Bloque 1 – Información Operativa Base**
Columnas:
- Proveedor
- OC
- Cliente
- OP
- Producto
- Cantidad
- Fecha de entrega
- Responsable
- Novedades
👉 Estas columnas permiten identificar **quién tiene el control operativo del producto** y qué acciones están pendientes.

**5.2 Separación de Aguas**
Entre la columna **Novedades** y **REM** debe existir un **separador visual fijo**, que indique el cambio de lógica:
- Izquierda: control operativo / responsabilidades
- Derecha: subprocesos administrativos

**5.3 Bloque 2 – Subprocesos Administrativos**
Columnas:
- REM
- Factura
- Transportadora
**Guía**
- Obs. CRM
- Correo U.F
Cada columna:
- Tiene estado propio
- No hereda color del bloque operativo
- Funciona como checklist visual

**6. Mapeo de Colores y Responsabilidades**
**🔴**** ROJO – Financiera / Comercial / Bloqueos**
Indica errores o bloqueos que impiden avanzar el proceso.
Ejemplos:
- Error en pedido (precio, costo, cantidad, IVA, razón social, etc.)
- Pendiente de facturación
- Cambio en fecha de entrega no confirmado
- Información de despacho incorrecta
Regla:
- No se generan OCs
- Requiere corrección del comercial (SLA 1 hora)

**🟠**** NARANJA – Auxiliar de Bodega**
Indica acciones de seguimiento operativo.
Ejemplos:
- Confirmar salida en ruta
- Registrar transportadora y guía
- Enviar correo al usuario final
- Relacionar información en CRM
- Gestionar devoluciones o garantías

**🟣**** MORADO – Jefe de Bodega**
Indica ejecución logística interna.
Ejemplos:
- Producto pendiente de recolección
- Producto en ruta hacia bodega
- Remisión pendiente
- Seguimiento de entregas parciales
- Resolución de novedades logísticas

**🟡**** AMARILLO – Compras**
Indica pendientes del área de compras.
Ejemplos:
- Producto pendiente de compra
- Generación de salida de almacén
- Envío de tokens o licencias
- Acompañamiento a logística

**🔵**** AZUL – Licencias / Servicios Recurrentes**
Identifica pedidos de:
- Licenciamientos
- Servicios mes a mes o anuales
Permite:
- Controlar fechas de inicio y fin
- Anticipar facturación recurrente

**🟢**** VERDE CLARO – Proceso Avanzado**
Indica que el proceso va bien pero no ha finalizado.
Ejemplos:
- Producto ingresó completamente a bodega
- Pedido despachado pero no entregado

**🟢**** VERDE OSCURO – Proceso Completado**
Indica cierre exitoso del flujo.
Ejemplos:
- Producto entregado sin novedad
- Remisión realizada
- Factura emitida
- Correo enviado
- Pedido entregado al cliente

**7. Reglas Clave del Sistema**
- Una fila puede tener **múltiples colores simultáneamente**
- El color se interpreta **por columna**, no por fila
- No existe un único status global del pedido
- Todo cambio de color debe registrar:
  - Usuario
  - Fecha
  - Motivo
- Los colores deben ser **parametrizables**

**8. Vista Ejecutiva – Kanban (Gerente General)**
El sistema debe generar una vista Kanban que:
- No muestre colores operativos
- Agrupe productos/pedidos en estados macro como:
  - En compras
  - En proveedor
  - En transporte
  - En bodega
  - Bloqueado
  - Cerrado
Estos estados se **calculan automáticamente** a partir de la lógica de colores del tablero operativo.

**9. Beneficios Esperados**
- Reducción de reprocesos
- Menos seguimiento manual
- Claridad inmediata de responsabilidades
- Separación clara entre operación y estrategia
- Escalabilidad frente al Excel/SharePoint actual

**10. Fuera de Alcance (por ahora)**
- Automatización de correos
- Integraciones externas
- Reportes históricos avanzados
- Workflow automático de aprobaciones

**11. Criterio de Éxito**
El sistema será exitoso si:
- El gerente operativo puede gestionar su día sin apoyo externo
- El gerente general puede entender el estado del negocio sin entrar al detalle
- Se elimina la dependencia del archivo en SharePoint
-
