# Especificaciones de Automatizaciones y Alertas

## Regla de Oro (Core Rule)
**EL SISTEMA ES ESTRICTAMENTE DE CONTROL INTERNO.**

Bajo ninguna circunstancia el sistema debe ejecutar acciones externas automáticas hacia el cliente (no enviar emails, no enviar WhatsApps, no realizar llamadas, ni notificaciones automáticas externas).

## Alcance de las Alertas
El sistema debe funcionar como un "asistente silencioso" que analiza la base de datos de manera pasiva y genera **Alertas Internas** únicamente visibles para los administradores o empleados con los permisos adecuados.

### Ejemplos de Alertas Permitidas:
- **Órdenes estancadas:** Notificar en el dashboard si un equipo lleva más de X días en estado "Listo para Retirar".
- **Control de Deudas:** Mostrar un listado de clientes que tienen saldo pendiente de pago.
- **Control de Inventario:** Avisar en el sistema cuando un repuesto alcanza el nivel crítico de stock.

Toda acción derivada de estas alertas (contactar al cliente, realizar compras) debe ser **100% de ejecución humana**.
