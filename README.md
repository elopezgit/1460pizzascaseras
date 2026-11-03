# 14-60 Pizzas Caseras

Sitio web de pedidos auto-gestionados por WhatsApp para **14-60 Pizzas Caseras**.

## Descripción

Catálogo de pizzas listas para hornear (LPH), con delivery y retiro en puntos de venta. Incluye carrito, checkout, descuento por pago en efectivo, ticket del pedido, panel de administración y servicio de Pizza Party para eventos.

## Ejecución local

```bash
npm install
npm run dev
```

## Archivos principales

- `index.html`, `styles.css`, `app.js`: sitio público.
- `admin.html`, `admin.css`, `admin.js`: panel de administración.
- `data.js`: configuración de marca, Supabase, empresa, categorías, productos y banners.
- `scripts/build_assets.py`: generación de imágenes optimizadas.

## Supabase

Los datos se filtran por `empresa_id` (`3a9972e1-d620-4074-9922-0e06cae36f68`). No modifica datos ni políticas de otras empresas.