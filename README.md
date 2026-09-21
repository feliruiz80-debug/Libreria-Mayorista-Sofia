# Librería Mayorista Sofía

Aplicación web para catálogo, precios, clientes y pedidos de Librería Mayorista Sofía.

Esta etapa deja **solo la estructura inicial**: no hay lógica de negocio, carrito real ni conexión con Google Sheets.

## Tecnología

| Capa | Elección | Motivo |
| --- | --- | --- |
| Framework | [Next.js](https://nextjs.org/) (App Router) | App web moderna, rutas por carpetas y despliegue nativo en Vercel |
| Lenguaje | TypeScript | Tipos para productos, clientes y pedidos |
| UI | React + [Tailwind CSS](https://tailwindcss.com/) | Componentes y estilos rápidos de mantener |
| Datos (próximo) | Google Sheets (API) | Planificado; el cliente está vacío en `src/lib/sheets/client.ts` |
| Hosting | [Vercel](https://vercel.com/) | Encaja con Next.js y con el repositorio de GitHub |
| Control de versiones | GitHub | Rama, PR y conexión posterior a Vercel |

## Estructura

```text
src/
  app/                 # Rutas: inicio, catálogo, clientes, carrito, pedidos
  components/          # Encabezado y páginas placeholder
  lib/
    types.ts           # Modelos de dominio (aún sin uso)
    sheets/client.ts   # Stub de Google Sheets
```

Variables de entorno previstas (no completar todavía): ver `.env.example`.

## Desarrollo local

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

## GitHub y Vercel

1. El código vive en este repositorio de GitHub.
2. En [Vercel](https://vercel.com/new), importar el repo `Libreria-Mayorista-Sofia`.
3. Framework: Next.js (detección automática). Comando de build: `next build`.
4. Las variables de Google Sheets se cargarán en Vercel cuando se implemente esa integración.

## Próximos pasos (no incluidos ahora)

- Catálogo de productos y precios
- Clientes
- Carrito y generación de pedidos
- Lectura/escritura en Google Sheets
- Publicación en producción en Vercel
