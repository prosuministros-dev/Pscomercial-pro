**HU-0010 – Reportes y Tablero de Control Comercial**
**Ultima actualización | **Laura Martínez | 21/10/2025
**Resumen Ejecutivo**
El sistema debe proporcionar un módulo de reportes y visualización de indicadores comerciales, que consolide la información generada a lo largo del proceso de gestión de leads, cotizaciones y facturación.
Este tablero permitirá a la Gerencia Comercial y al equipo de ventas tomar decisiones basadas en datos actualizados.
**Alcance

**Este requerimiento aplica al módulo de **Gestión Comercial**, específicamente en la vista de **Reportes / Tablero de Control**.
Involucra los roles **Gerencia Comercial**, **Asesores Comerciales** y **Administración del Sistema**.
Incluye la visualización de métricas clave, filtros dinámicos, estados de cotización, conversión por asesor y alertas de desempeño.
No incluye la exportación automatizada de reportes a sistemas externos (será considerada en una fase futura).
**Descripción detallada del requerimiento**
1. Componentes del tablero:
El tablero debe mostrar de forma gráfica y resumida los siguientes indicadores:
2. Total de leads recibidos (por periodo).
3. Total de cotizaciones creadas.
4. Total de cotizaciones enviadas / aceptadas / rechazadas / vencidas.
5. Porcentaje de conversión lead → cotización → venta.
6. Número de clientes nuevos vs recurrentes.
7. Tiempo promedio de respuesta de clientes.
8. Top 5 de asesores por valor de ventas y cotizaciones cerradas.
9. Filtros disponibles:
10. Rango de fechas (desde / hasta).
11. Asesor comercial.
12. Cliente.
13. Estado de cotización.
14. Canal de origen del lead (WhatsApp, web, desde el aplicativo
15. Reportes descargables:
16. El sistema debe permitir exportar los datos mostrados en formato Excel o PDF.
17. El archivo debe incluir los campos visibles en pantalla más fecha y hora de exportación.
18. Alertas visuales:
19. Las cotizaciones en estado crítico (8+ días sin respuesta) deben resaltarse con color rojo.
20. Las cotizaciones vencidas deben marcarse con un ícono de advertencia.
21. Los asesores con bajo seguimiento (menos del 50% de respuestas atendidas) deben aparecer en el resumen de alertas de gerencia.
22. Acceso a detalles:
23. Cada métrica debe ser clickeable para acceder al listado detallado correspondiente.
24. Ejemplo: al hacer clic en “Cotizaciones Aceptadas”, se muestra el listado filtrado de esas cotizaciones.
25. Frecuencia de actualización:
26. Los datos deben actualizarse en tiempo real.

**Casos de uso **
1. CU-10.1 – Consultar tablero de indicadores:
Gerencia Comercial visualiza métricas y KPIs generales.
2. CU-10.2 – Filtrar información:
El usuario aplica filtros por fecha, cliente, asesor o estado.
3. CU-10.3 – Descargar reporte:
El usuario genera un archivo Excel o PDF con los datos mostrados.
4. CU-10.4 – Analizar desempeño de asesores:
Gerencia revisa los resultados individuales por periodo.
5. CU-10.5 – Revisar alertas:
El sistema resalta cotizaciones críticas o vencidas y bajo rendimiento de seguimiento.

**Flujos de trabajo **
Flujo 1 – Consulta general de métricas
1. Usuario accede al módulo “Reportes”.
2. Sistema carga indicadores generales (por defecto últimos 30 días).
3. Usuario aplica filtros si desea.
4. Los gráficos se actualizan en tiempo real.
Flujo 2 – Exportación de información
1. Usuario selecciona “Exportar” → Excel o PDF.
2. Sistema genera archivo con datos visibles.
3. Archivo queda disponible para descarga inmediata.
Flujo 3 – Visualización de alertas
1. Sistema identifica cotizaciones con 8+ días sin respuesta.
2. Marca en color rojo y las incluye en alerta de gerencia.
3. Gerencia puede ingresar a detalle y asignar seguimiento.

**Criterios de aceptación**
1. El tablero debe mostrar métricas de leads, cotizaciones (según estado, semana y mes de cierre)y ventas consolidadas.
2. Los filtros deben ser funcionales y combinarse libremente.
3. Los reportes deben poder exportarse en Excel y PDF.
4. Los datos deben actualizarse automáticamente en tiempo real.
5. Los indicadores deben ser navegables (clic → detalle).
6. Las alertas visuales deben identificarse por color o ícono.
7. La información debe registrarse con trazabilidad (usuario, fecha y hora).

**No hace parte del alcance del presente requerimiento**
1. La conexión directa a bases externas o sistemas ERP.
2. El envío automático de reportes por correo electrónico.
3. La configuración de KPIs adicionales no definidos en esta HU.
