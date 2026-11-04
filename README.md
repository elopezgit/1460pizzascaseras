# 1460pizzascaseras

Sitio web de pedidos autogestionados estilo PedidosYa con envío por WhatsApp y gestión en Supabase para **14-60 Pizzas Caseras** (San Miguel de Tucumán).

## Características principales

- **Diseño estilo PedidosYa (Modo Claro por defecto):** Portada de tienda con logo, estado del local en vivo (Abierto/Cerrado), calificación, tiempos de horneado, banners promocionales, barra de categorías sticky con buscador y tarjetas horizontales de productos.
- **Catálogo por categorías:** Pizzas Clásicas, Especiales, Fugazzas y Promos, con control de cantidades directo en cada tarjeta y modal de detalle.
- **Carrito lateral y barra flotante:** Carrito interactivo en escritorio y barra flotante inferior en móviles, con cálculo automático de **10% de descuento en efectivo** o pago por transferencia (`alias: 1460pizzas`).
- **Delivery y 3 Puntos de Retiro:** Centro de producción (Luis Patrón Costa 1460), Punto 28 y Punto 51.
- **Servicio de Pizza Party:** Sección dedicada para eventos (mínimo 25 personas, variedades a elección al reservar).
- **Panel de Administración (`admin.html`):** Gestión de pedidos, clientes, productos, categorías y banners conectado a Supabase.

## Ejecución local

```bash
npm install
npm run dev
```
