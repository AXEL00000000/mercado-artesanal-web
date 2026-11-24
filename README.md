# Mercado Artesanal · Web

Frontend del marketplace de artesanía de comunidades de Oaxaca. Proyecto final de Servicios Web.

- API: https://oaken-darkgray-panther-10.hostingersite.com/api
- Swagger: https://oaken-darkgray-panther-10.hostingersite.com/api/docs

## Stack

Vue 3 · Vite · TypeScript · Vue Router · Pinia · ESLint + oxlint · Prettier

## Cómo correrlo

Necesitas Node `^22.18` o `>=24.12`.

```sh
npm install
cp .env.example .env   # apunta VITE_API_URL a la API
npm run dev            # http://localhost:5173
```

Otros comandos: `npm run build` (revisa tipos y compila), `npm run lint`, `npm run format`.

## Estructura

```
src/
├── modules/              Un módulo por equipo; cada quien trabaja solo en el suyo
│   ├── auth/             /login, /registro
│   ├── catalogo/         /, /productos/:slug, /talleres/:id
│   ├── compra/           /carrito, /checkout, /pedidos, /pedidos/:id
│   ├── artesano/         /mi-taller y sus secciones
│   └── admin/            /admin/talleres, /admin/catalogos
│       ├── routes.ts     Rutas del módulo
│       ├── views/        Páginas
│       └── components/   Componentes propios del módulo
├── router/               Junta las rutas de los módulos y aplica el guard global
├── stores/               sesion.ts y carrito.ts (compartidos)
└── shared/
    ├── api/              cliente.ts (fetch + token + errores) y tipos.ts
    ├── components/       BotonBase, EtiquetaVenta, TarjetaProducto, EstadoCarga, MensajeError
    ├── layout/           LayoutPrincipal (encabezado y pie)
    ├── styles/           tokens.css (variables de diseño) y base.css
    ├── utils/            formatearPrecio, etc.
    └── views/            404
```

### Rutas protegidas

En `meta` de cada ruta:

| meta             | Efecto                                              |
| ---------------- | --------------------------------------------------- |
| `requiereSesion` | Sin sesión → `/login?regreso=<ruta>`                |
| `soloAdmin`      | Sin sesión → login; si no es admin → inicio         |
| `requiereTaller` | Sin sesión → login; si no tiene taller → inicio     |

### Uso rápido

```ts
import { get, post, ErrorApi } from '@/shared/api/cliente'
import type { PaginaProductos } from '@/shared/api/tipos'

const pagina = await get<PaginaProductos>('/productos', { categoria: 'textiles', pagina: 1 })

try {
  await post('/pedidos', datos)
} catch (e) {
  if (e instanceof ErrorApi) console.log(e.status, e.mensaje, e.detalles)
}
```

```ts
const sesion = useSesionStore()   // token, usuario, estaAutenticado, esAdmin, tieneTaller, login(), logout()…
const carrito = useCarritoStore() // items, total, cantidadTotal, agregar(), quitar(), cambiarCantidad(), vaciar()

const resultado = carrito.agregar(producto, 1)
if (!resultado.ok) mostrarError(resultado.error)
```

Reglas del equipo y de diseño: [CONTRIBUTING.md](CONTRIBUTING.md).
