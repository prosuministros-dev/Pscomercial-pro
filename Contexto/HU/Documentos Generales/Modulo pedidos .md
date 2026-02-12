**MODULO PEDIDOS**

**Información general del pedido**
- Casilla que indique ese pedido de cual cotización proviene y que si le doy click a la cotización, me permita navegar en ella.

- Toda la información guardada en el pedido, no se puede eliminar ni modificar.

- Que exista la opción de generar novedades sobre el pedido, y llegue a través de la red que estamos creando. Un ejemplo de ello es cuando suben un producto y hace falta algún adjunto o información, se le envía la notificación al comercial para que haga lo solicitado.

- Debe contar con un lugar para adjuntar documentos de manera organizada. Documentos clientes, documentos proveedor, documentos Prosuministros

- El comercial podrá visualizar únicamente sus pedidos, las áreas de facturación, logística y compras y gerencia general, podrán visualizar todos los pedidos.

- Debe haber un filtro de pedidos abiertos, cerrados y anulados.

**Información para compras**
- En las pestañas del pedido debemos identificar cuáles son las órdenes de compra que se han generado correspondientes a ese pedido y una vez las visualicemos, podamos navegar en ellas.

- Visualización en una casilla independiente dentro del pedido que indique cuantos productos tiene pendiente por comprar y cuales son.

- En la liquidación general del pedido, debe aparecer la información de total venta, total costo, utilidad, margen, incluye costo de transporte en item independiente, si no, cual fue el costo de transporte calculado. Toda esa información en la liquidación.

- Desde la visualización general del pedido, necesitamos permita validar cual es el proveedor con el cual cotizo, el costo y desde ahí dar acción a generar la orden de compra. Es importante que el sistema NO permita comprar más de las cantidades vendidas.

- Cuando compras vaya a generar la orden de compra de un producto, le indique información de con cual fue el proveedor que compro y el precio de su última compra relacionada con ese número de parte.

**Información para financiera**
- Ciclos del pedido en la facturación, facturado, pendiente por facturar por cierre contable cliente y pendiente pro facturar por acta.

**Flujo**
- Requerimos un flujo en el pedido donde el comercial indique si permite o no la entrega parcial, la facturación parcial y si es un envió nacional, que indique si debemos esperar hasta que se entregue el producto en destino final o podemos facturar una vez enviemos la mercancía.

- La idea es que una vez logística indique que ya fue remisionado y si fue marcado por parte comercial que no requiere que sea entregado para facturar, la notificación a facturación que ya puede facturar.

- Si el pedido requiere ser facturado hasta que se entregue el producto, una vez se remisione o envie la mercancía, deberá estar en un estatus de “en proceso de entrega”, pero hasta que no se entregue, no le puede enviar la orden a facturación para facturar. Sin embargo, deberá llegarle la notificación al comercial de la cuenta que su pedido fue despachado de manera parcial o total.

- El flujo deberá funcionar de la siguiente manera 

1. Permite facturación parcial y entrega parcial por parte del área comercial – Logística entrega parcial, le deberá llegar una acción a facturación para que facture parcial.

2. No permite facturación parcial, pero si entrega parcial – logística entrega parcial pero no le debe llegar una acción a facturación hasta que no sea entregado de manera total.

3. Permite facturación total con entrega no parcial – logística entrega completo – debe llegar acción a facturación para que facture total

**Ahora, debemos incluir cuando se requiere ****que hasta que no se confirme la entrega no se p****ue****de facturar y los casos en donde se puede facturar la mercancía una vez se halla enviado sin necesidad de que se halla confirmado la entrega.**

- Una vez facturación realice la factura, deberá adjuntar los documentos correspondientes al pedido. Una vez quede todo cargado, deberá llegarle una acción a Compras para que revise que el pedido cuenta con todos los documentos adjuntos y pueda cerrar el pedido en la aplicación.

- Requiere o no requiere acta para facturar. Si requiere acta, una vez el comercial la ponga, que le llegue la acción a facturación para que proceda con la factura.
