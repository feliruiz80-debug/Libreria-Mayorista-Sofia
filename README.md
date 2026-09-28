# Librería Mayorista Sofía

App para que los clientes vean el catálogo y armen un pedido. Los productos, precios, stock y links se leen de una hoja pública de Google Sheets.

## Qué puede hacer un cliente

- Buscar productos por nombre, marca o código
- Filtrar por sección y marca
- Ver precio, presentación, stock y la ficha del sitio
- Armar un pedido y copiarlo o enviarlo por WhatsApp

Los pedidos se guardan en el navegador del cliente. La hoja se usa para leer el catálogo; para que los pedidos se escriban solos en Sheets hace falta una cuenta de servicio de Google, que esta etapa no incluye.

## Hoja

El catálogo piloto está en la pestaña **Catálogo**, con columnas Sección, Marca, Producto, Código, Presentación, Imagen, Precio, Stock y Link. Las pestañas **Secciones** y **Marcas** ordenan los filtros.

La hoja tiene que estar compartida como «Cualquier persona con el enlace puede ver». Si la columna Imagen tiene una URL, se usa esa foto. Si está vacía y Link apunta a la ficha del sitio, la app toma la foto de esa ficha.

Para usar otra hoja, definí `GOOGLE_SHEETS_SPREADSHEET_ID` (ver `.env.example`).

## Desarrollo

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run build
```
