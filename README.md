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
    ├── components/       Componentes base (ver abajo)
    ├── composables/      useCapa (comportamiento de ventanas modales)
    ├── layout/           LayoutPrincipal: encabezado según el usuario y pie de página
    ├── styles/           tokens.css (variables de diseño) y base.css
    ├── utils/            formatearPrecio, destinoTrasSesion, enlaces de navegación
    └── views/            404
```

### Rutas protegidas

En `meta` de cada ruta:

| meta             | Efecto                                          |
| ---------------- | ----------------------------------------------- |
| `requiereSesion` | Sin sesión → `/login?regreso=<ruta>`            |
| `soloAdmin`      | Sin sesión → login; si no es admin → inicio     |
| `requiereTaller` | Sin sesión → login; si no tiene taller → inicio |

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
const sesion = useSesionStore() // token, usuario, estaAutenticado, esAdmin, tieneTaller, login(), logout()…
const carrito = useCarritoStore() // items, total, cantidadTotal, agregar(), quitar(), cambiarCantidad(), vaciar()

const resultado = carrito.agregar(producto, 1)
if (!resultado.ok) mostrarError(resultado.error)
```

### Después de iniciar sesión

```ts
import { destinoTrasSesion } from '@/shared/utils/navegacion'

await sesion.login(datos)
await router.replace(destinoTrasSesion(sesion.usuario, route.query.regreso))
```

Si `regreso` es una ruta interna válida, va ahí. Si no: admin → `/admin/talleres`, con taller → `/mi-taller`, comprador → `/`.

## Componentes compartidos

Todos están en `src/shared/components/`, usan solo variables de `tokens.css`, funcionan con teclado y en celular.

### BotonBase

| Prop                   | Tipo                                                                   | Por defecto    |
| ---------------------- | ---------------------------------------------------------------------- | -------------- |
| `variante`             | `'comprar' \| 'whatsapp' \| 'secundario' \| 'peligro'`                 | `'secundario'` |
| `grande`               | `boolean`: acción principal del detalle (52 px, hasta 420 px de ancho) | `false`        |
| `bloque`               | `boolean`: ocupa todo el ancho                                         | `false`        |
| `to`                   | `RouteLocationRaw`: se dibuja como enlace interno                      |                |
| `href`                 | `string`: enlace externo, abre otra pestaña                            |                |
| `type`                 | `'button' \| 'submit' \| 'reset'`                                      | `'button'`     |
| `disabled`, `cargando` | `boolean`                                                              | `false`        |

`comprar` (rojo) es solo para comprar en la página; `whatsapp` (verde) solo para WhatsApp; `peligro` para eliminar.

### EtiquetaVenta · TarjetaProducto · EstadoCarga · MensajeError

- `<EtiquetaVenta :modo="'fijo' | 'tratar'" />`
- `<TarjetaProducto :producto="ProductoTarjeta" />`: sin botones; toda la tarjeta lleva al detalle.
- `<EstadoCarga texto="Cargando…" />`
- `<MensajeError :error="error" reintentable @reintentar="cargar" />`: `error` puede ser un texto o lo atrapado en un `catch` (muestra `detalles` si es `ErrorApi`).

### LayoutPanel

Cabecera y pestañas iguales para Mi taller y Administración.

| Prop               | Tipo                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `titulo`           | `string` (obligatorio)                                                      |
| `descripcion`      | `string`                                                                    |
| `antetitulo`       | `string`: texto pequeño sobre el título ("Panel del artesano")              |
| `pestanas`         | `PestanaPanel[]`: `{ etiqueta, to, contador? }`                             |
| `etiquetaPestanas` | `string`: nombre de la navegación para lectores de pantalla (`'Secciones'`) |

Slots: `default` (contenido) y `acciones` (botones a la derecha del título). La pestaña activa se marca sola según la ruta exacta.

```vue
<LayoutPanel
  antetitulo="Panel del artesano"
  titulo="Ventas"
  :pestanas="[
    { etiqueta: 'Mi taller', to: { name: 'mi-taller' } },
    { etiqueta: 'Ventas', to: { name: 'mi-taller-ventas' }, contador: 3 },
  ]"
>
  <template #acciones><BotonBase>Exportar</BotonBase></template>
  …
</LayoutPanel>
```

`PestanaPanel` se importa de `@/shared/components/tipos`.

### PanelLateral

Cajón que se abre desde la derecha; en celular ocupa toda la pantalla. Cierra con Escape, clic fuera o ✕, bloquea el scroll del fondo y devuelve el foco al botón que lo abrió.

| Prop / evento     | Tipo                                                 |
| ----------------- | ---------------------------------------------------- |
| `v-model:abierto` | `boolean` (obligatorio)                              |
| `titulo`          | `string` (obligatorio)                               |
| `descripcion`     | `string`                                             |
| `bloqueado`       | `boolean`: no deja cerrarlo (p. ej. mientras guarda) |
| `@cerrar`         | se emite al cerrarse                                 |

Slots: `default` (contenido con scroll) y `pie` (botones).

```vue
<PanelLateral v-model:abierto="editando" titulo="Editar producto" :bloqueado="guardando">
  <FormularioProducto … />
  <template #pie>
    <BotonBase @click="editando = false">Cancelar</BotonBase>
    <BotonBase type="submit" form="form-producto" :cargando="guardando">Guardar</BotonBase>
  </template>
</PanelLateral>
```

### DialogoConfirmar

Ventana para confirmar una acción. El foco empieza en Cancelar; Escape y clic fuera cancelan (salvo mientras `cargando`).

| Prop / evento             | Tipo                                       | Por defecto   |
| ------------------------- | ------------------------------------------ | ------------- |
| `abierto`                 | `boolean` (obligatorio)                    |               |
| `titulo`                  | `string` (obligatorio)                     |               |
| `mensaje`                 | `string` (o el slot `default`)             |               |
| `textoConfirmar`          | `string`                                   | `'Confirmar'` |
| `textoCancelar`           | `string`                                   | `'Cancelar'`  |
| `peligroso`               | `boolean`: botón de confirmar en `peligro` | `false`       |
| `cargando`                | `boolean`                                  | `false`       |
| `@confirmar`, `@cancelar` | eventos                                    |               |

El diálogo no se cierra solo: ciérralo tú al terminar `@confirmar`.

```vue
<DialogoConfirmar
  :abierto="porEliminar !== null"
  titulo="¿Eliminar este producto?"
  mensaje="Dejará de aparecer en el catálogo. Los pedidos anteriores no cambian."
  texto-confirmar="Eliminar"
  peligroso
  :cargando="eliminando"
  @confirmar="eliminar"
  @cancelar="porEliminar = null"
/>
```

### InterruptorBase

Switch accesible (Espacio lo cambia; los lectores lo anuncian como interruptor).

| Prop             | Tipo                                                        |
| ---------------- | ----------------------------------------------------------- |
| `v-model`        | `boolean` (obligatorio)                                     |
| `etiqueta`       | `string` (obligatorio)                                      |
| `descripcion`    | `string`: texto de ayuda debajo                             |
| `disabled`       | `boolean`                                                   |
| `etiquetaOculta` | `boolean`: oculta la etiqueta a la vista, no a los lectores |

```vue
<InterruptorBase v-model="producto.activo" etiqueta="Visible en el catálogo" />
```

Reglas del equipo y de diseño: [CONTRIBUTING.md](CONTRIBUTING.md).
