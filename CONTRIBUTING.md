# Cómo trabajamos

## Módulos y responsables

| Módulo                      | Carpeta(s)                                 | Responsable |
| --------------------------- | ------------------------------------------ | ----------- |
| Auth + app móvil            | `src/modules/auth/`                        | _por definir_ |
| Catálogo + admin            | `src/modules/catalogo/`, `src/modules/admin/` | _por definir_ |
| Compra                      | `src/modules/compra/`                      | _por definir_ |
| Panel del artesano          | `src/modules/artesano/`                    | _por definir_ |

## Ramas

- Nunca se trabaja en `main`.
- Antes de crear una rama:
  ```sh
  git checkout main
  git pull
  git checkout -b feature/<número-de-issue>-<nombre-corto>
  ```
- Una rama por issue. Ejemplo: `feature/12-listado-de-productos`.

## Commits

- Pequeños y en español, diciendo qué hacen: `Agrega filtro por categoría al catálogo`.
- Antes de abrir el PR:
  ```sh
  git pull origin main   # resuelve los conflictos que salgan
  npm run lint
  npm run build          # debe terminar sin errores
  ```

## Pull requests

- En la descripción: `Closes #<número>`, qué hiciste y capturas de pantalla.
- Nadie acepta su propio PR: lo revisa y lo aprueba otra persona del equipo.

## Qué archivos puedes tocar

- Solo tu módulo: `src/modules/<tuyo>/` (sus `routes.ts`, `views/` y `components/`).
- **No se tocan sin avisar al equipo:** `src/shared/`, `src/stores/`, `src/router/index.ts`, `App.vue`, `package.json`.
- No instales librerías sin avisar.
- Nunca subas `.env` (ya está en `.gitignore`; usa `.env.example` como guía).
- Si necesitas algo compartido (un tipo nuevo, un componente base, un cambio en el store), pídelo en un issue o avísale al equipo antes.

## Diseño

Los valores de `tokens.css` salen de la propuesta aprobada (estilo "Pericón"): crema de fondo, rojo barro para comprar, verde para WhatsApp, Bricolage Grotesque en títulos y precios, Onest en el texto. Fotos con radio de 18 px, controles de 14 px y botones en píldora.

- Solo variables de `src/shared/styles/tokens.css` (`--color-*`, `--font-*`, `--space-*`, `--radius-*`). **Nada de colores, fuentes ni medidas escritos a mano.**
- Usa los componentes base de `src/shared/components/` (`BotonBase`, `EtiquetaVenta`, `TarjetaProducto`, `EstadoCarga`, `MensajeError`).
- **El catálogo no lleva botones en las tarjetas**: la tarjeta entera lleva al detalle.
- **El detalle tiene una sola acción principal**:
  - Precio fijo → botón rojo (`variante="comprar"`): se compra en la página.
  - Precio a tratar → botón verde (`variante="whatsapp"`): se consulta por WhatsApp.
  - El rojo y el verde nunca aparecen juntos en la misma pantalla. En precio fijo, las dudas van como enlace de texto, no como segundo botón.
  - El botón principal usa `grande` (52 px de alto, ancho completo hasta 420 px).
- Primero que funcione; al final se unifica el diseño entre módulos.

## Backend (`mercado-artesanal-api`)

- Si algo falla o falta un endpoint: abre un issue con la etiqueta `back` o manda un PR al repo de la API.
- No se renombran ni se cambian endpoints existentes; solo se agregan.
- No se edita `schema.sql`: crea `db/NN-descripcion.sql` y avisa al equipo.
- Todo endpoint nuevo se documenta en Swagger.
- **Merge a `main` en el back despliega a producción.**

## Base de datos compartida

- Todos usamos la misma base de datos.
- Prueba con tus propias cuentas y no borres datos de prueba.
- Cuentas de prueba:

  | Rol      | Email                  | Contraseña  |
  | -------- | ---------------------- | ----------- |
  | Artesana | catalina@example.com   | demo12345   |
  | Admin    | admin@example.com      | demo12345   |
