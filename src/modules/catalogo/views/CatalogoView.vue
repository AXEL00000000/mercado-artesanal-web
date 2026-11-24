<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get } from '@/shared/api/cliente'
import type {
  Categoria,
  Comunidad,
  FiltrosProductos,
  ModoVenta,
  PaginaProductos,
  ProductoTarjeta,
} from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import TarjetaProducto from '@/shared/components/TarjetaProducto.vue'
import SelectorDesplegable, {
  type OpcionSelector,
} from '../components/SelectorDesplegable.vue'

const REGIONES_OAXACA = [
  'Cañada',
  'Costa',
  'Istmo',
  'Mixteca',
  'Papaloapan',
  'Sierra Norte',
  'Sierra Sur',
  'Valles Centrales',
]

const route = useRoute()
const router = useRouter()

const categorias = ref<Categoria[]>([])
const comunidades = ref<Comunidad[]>([])

const cargando = ref(true)
const error = ref<unknown>(null)
const productos = ref<ProductoTarjeta[]>([])
const totalProductos = ref(0)
const totalPaginas = ref(1)

// Filtros
const busqueda = ref((route.query.q as string) ?? '')
const categoriaSeleccionada = ref((route.query.categoria as string) ?? '')
const regionSeleccionada = ref((route.query.region as string) ?? '')
const comunidadSeleccionada = ref<number | ''>(
  route.query.comunidad ? Number(route.query.comunidad) : '',
)
const modoSeleccionado = ref<ModoVenta | ''>((route.query.modo as ModoVenta) ?? '')
const ordenSeleccionado = ref<'recientes' | 'precio_asc' | 'precio_desc'>(
  (route.query.orden as 'recientes' | 'precio_asc' | 'precio_desc') ?? 'recientes',
)
const paginaActual = ref(route.query.pagina ? Number(route.query.pagina) : 1)
const limitePorPagina = 12

const comunidadesFiltradas = computed(() => {
  if (!regionSeleccionada.value) return comunidades.value
  return comunidades.value.filter((c) => c.region === regionSeleccionada.value)
})

// Opciones estéticas para los selectores desplegables
const opcionesCategoria = computed<OpcionSelector[]>(() => [
  { valor: '', texto: 'Todas las categorías' },
  ...categorias.value.map((cat) => ({ valor: cat.slug, texto: cat.nombre })),
])

const opcionesRegion = computed<OpcionSelector[]>(() => [
  { valor: '', texto: 'Todas las regiones' },
  ...REGIONES_OAXACA.map((reg) => ({ valor: reg, texto: reg })),
])

const opcionesComunidad = computed<OpcionSelector[]>(() => [
  { valor: '', texto: 'Todas las comunidades' },
  ...comunidadesFiltradas.value.map((com) => ({
    valor: com.id,
    texto: `${com.nombre} (${com.region})`,
  })),
])

const opcionesModo: OpcionSelector[] = [
  { valor: '', texto: 'Todos los tipos' },
  { valor: 'fijo', texto: 'Precio fijo (compra en línea)' },
  { valor: 'tratar', texto: 'Precio a tratar (WhatsApp)' },
]

const opcionesOrden: OpcionSelector[] = [
  { valor: 'recientes', texto: 'Más recientes' },
  { valor: 'precio_asc', texto: 'Menor precio' },
  { valor: 'precio_desc', texto: 'Mayor precio' },
]

const hayFiltrosActivos = computed(() => {
  return (
    Boolean(busqueda.value.trim()) ||
    Boolean(categoriaSeleccionada.value) ||
    Boolean(regionSeleccionada.value) ||
    comunidadSeleccionada.value !== '' ||
    Boolean(modoSeleccionado.value) ||
    ordenSeleccionado.value !== 'recientes'
  )
})

async function cargarCatalogosAuxiliares() {
  try {
    const [cats, coms] = await Promise.all([
      get<Categoria[]>('/categorias'),
      get<Comunidad[]>('/comunidades'),
    ])
    categorias.value = cats
    comunidades.value = coms
  } catch {
    // Si falla cargar opciones, el usuario podrá seguir navegando con filtros básicos
  }
}

async function cargarProductos() {
  cargando.value = true
  error.value = null

  const params: FiltrosProductos = {
    pagina: paginaActual.value,
    limite: limitePorPagina,
    orden: ordenSeleccionado.value,
  }

  if (busqueda.value.trim()) {
    params.q = busqueda.value.trim()
  }
  if (categoriaSeleccionada.value) {
    params.categoria = categoriaSeleccionada.value
  }
  if (regionSeleccionada.value) {
    params.region = regionSeleccionada.value
  }
  if (comunidadSeleccionada.value !== '') {
    params.comunidad = comunidadSeleccionada.value
  }
  if (modoSeleccionado.value) {
    params.modo = modoSeleccionado.value
  }

  try {
    const respuesta = await get<PaginaProductos>(
      '/productos',
      params as unknown as Record<string, string | number>,
    )
    productos.value = respuesta.productos
    totalProductos.value = respuesta.total
    totalPaginas.value = respuesta.total_paginas
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

function actualizarRuta() {
  const query: Record<string, string | number> = {}

  if (busqueda.value.trim()) query.q = busqueda.value.trim()
  if (categoriaSeleccionada.value) query.categoria = categoriaSeleccionada.value
  if (regionSeleccionada.value) query.region = regionSeleccionada.value
  if (comunidadSeleccionada.value !== '') query.comunidad = comunidadSeleccionada.value
  if (modoSeleccionado.value) query.modo = modoSeleccionado.value
  if (ordenSeleccionado.value !== 'recientes') query.orden = ordenSeleccionado.value
  if (paginaActual.value > 1) query.pagina = paginaActual.value

  void router.push({ query })
}

function aplicarFiltros() {
  paginaActual.value = 1
  actualizarRuta()
  void cargarProductos()
}

function limpiarFiltros() {
  busqueda.value = ''
  categoriaSeleccionada.value = ''
  regionSeleccionada.value = ''
  comunidadSeleccionada.value = ''
  modoSeleccionado.value = ''
  ordenSeleccionado.value = 'recientes'
  paginaActual.value = 1
  actualizarRuta()
  void cargarProductos()
}

function irAPagina(pagina: number) {
  if (pagina < 1 || pagina > totalPaginas.value || pagina === paginaActual.value) return
  paginaActual.value = pagina
  actualizarRuta()
  void cargarProductos()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(
  () => route.query,
  () => {
    busqueda.value = (route.query.q as string) ?? ''
    categoriaSeleccionada.value = (route.query.categoria as string) ?? ''
    regionSeleccionada.value = (route.query.region as string) ?? ''
    comunidadSeleccionada.value = route.query.comunidad ? Number(route.query.comunidad) : ''
    modoSeleccionado.value = (route.query.modo as ModoVenta) ?? ''
    ordenSeleccionado.value =
      (route.query.orden as 'recientes' | 'precio_asc' | 'precio_desc') ?? 'recientes'
    paginaActual.value = route.query.pagina ? Number(route.query.pagina) : 1
    void cargarProductos()
  },
)

onMounted(async () => {
  await cargarCatalogosAuxiliares()
  await cargarProductos()
})
</script>

<template>
  <div class="catalogo contenedor">
    <!-- Hero con enfoque editorial -->
    <header class="catalogo__hero">
      <div class="catalogo__hero-texto">
        <p class="catalogo__subtitulo">Tierra viva, arte inmortal</p>
        <h1 class="catalogo__titulo">Oaxaca y sus Maestros Artesanos</h1>
        <p class="catalogo__descripcion">
          Cada pieza cuenta la historia de una comunidad. Compra directa a talleres
          familiares con precio justo y origen certificado.
        </p>
      </div>
    </header>

    <!-- Barra de filtros -->
    <section class="catalogo__filtros" aria-label="Filtros del catálogo">
      <form class="catalogo__formulario-filtros" @submit.prevent="aplicarFiltros">
        <div class="catalogo__campo catalogo__campo--buscar">
          <label for="filtro-busqueda" class="catalogo__label">Buscar pieza o técnica</label>
          <input
            id="filtro-busqueda"
            v-model="busqueda"
            type="search"
            placeholder="Ej. barro negro, telar, alebrije..."
            class="catalogo__input"
          />
        </div>

        <SelectorDesplegable
          id="filtro-categoria"
          etiqueta="Categoría"
          v-model="categoriaSeleccionada"
          :opciones="opcionesCategoria"
          @change="aplicarFiltros"
        />

        <SelectorDesplegable
          id="filtro-region"
          etiqueta="Región"
          v-model="regionSeleccionada"
          :opciones="opcionesRegion"
          @change="
            () => {
              comunidadSeleccionada = ''
              aplicarFiltros()
            }
          "
        />

        <SelectorDesplegable
          id="filtro-comunidad"
          etiqueta="Comunidad"
          v-model="comunidadSeleccionada"
          :opciones="opcionesComunidad"
          @change="aplicarFiltros"
        />

        <SelectorDesplegable
          id="filtro-modo"
          etiqueta="Tipo de venta"
          :model-value="modoSeleccionado"
          :opciones="opcionesModo"
          @update:model-value="(val) => (modoSeleccionado = val as ModoVenta | '')"
          @change="aplicarFiltros"
        />

        <SelectorDesplegable
          id="filtro-orden"
          etiqueta="Ordenar por"
          :model-value="ordenSeleccionado"
          :opciones="opcionesOrden"
          @update:model-value="
            (val) => (ordenSeleccionado = val as 'recientes' | 'precio_asc' | 'precio_desc')
          "
          @change="aplicarFiltros"
        />

        <div class="catalogo__acciones-filtros">
          <BotonBase variante="comprar" type="submit">Buscar</BotonBase>
          <BotonBase
            v-if="hayFiltrosActivos"
            variante="secundario"
            type="button"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </BotonBase>
        </div>
      </form>
    </section>

    <!-- Resumen de resultados -->
    <div class="catalogo__resumen">
      <p v-if="!cargando && !error" class="catalogo__conteo">
        {{ totalProductos }} {{ totalProductos === 1 ? 'pieza artesanal' : 'piezas artesanales' }}
        encontradas
      </p>
    </div>

    <!-- Tres estados de la vista -->
    <!-- 1. Estado de carga -->
    <EstadoCarga v-if="cargando" texto="Cargando piezas del catálogo…" />

    <!-- 2. Estado de error -->
    <MensajeError
      v-else-if="error"
      :error="error"
      reintentable
      @reintentar="cargarProductos"
    />

    <!-- 3. Estado vacío -->
    <div v-else-if="productos.length === 0" class="catalogo__vacio">
      <div class="catalogo__vacio-caja">
        <h2 class="catalogo__vacio-titulo">No encontramos piezas con estos filtros</h2>
        <p class="catalogo__vacio-texto">
          Prueba cambiando la región, categoría o quitando los términos de búsqueda.
        </p>
        <BotonBase variante="secundario" @click="limpiarFiltros">
          Ver todas las piezas
        </BotonBase>
      </div>
    </div>

    <!-- 4. Cuadrícula de productos -->
    <section v-else class="catalogo__galeria" aria-label="Piezas disponibles">
      <div class="catalogo__cuadricula">
        <TarjetaProducto
          v-for="prod in productos"
          :key="prod.id"
          :producto="prod"
        />
      </div>

      <!-- Paginación -->
      <nav
        v-if="totalPaginas > 1"
        class="catalogo__paginacion"
        aria-label="Paginación de productos"
      >
        <BotonBase
          variante="secundario"
          :disabled="paginaActual <= 1"
          @click="irAPagina(paginaActual - 1)"
        >
          Anterior
        </BotonBase>

        <span class="catalogo__paginacion-info">
          Página {{ paginaActual }} de {{ totalPaginas }}
        </span>

        <BotonBase
          variante="secundario"
          :disabled="paginaActual >= totalPaginas"
          @click="irAPagina(paginaActual + 1)"
        >
          Siguiente
        </BotonBase>
      </nav>
    </section>
  </div>
</template>

<style scoped>
.catalogo {
  padding-block: var(--space-6);
}

.catalogo__hero {
  padding: var(--space-6) var(--space-5);
  margin-bottom: var(--space-6);
  border-radius: var(--radius-foto);
  background: var(--color-suave);
  border: 1px solid var(--color-linea);
}

.catalogo__hero-texto {
  max-width: 640px;
}

.catalogo__subtitulo {
  font-size: var(--texto-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: var(--color-primario);
  margin-bottom: var(--space-2);
}

.catalogo__titulo {
  font-size: var(--texto-3xl);
  line-height: 1.08;
  color: var(--color-texto);
  margin-bottom: var(--space-3);
}

.catalogo__descripcion {
  font-size: var(--texto-base);
  color: var(--color-texto-secundario);
  line-height: 1.5;
}

.catalogo__filtros {
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
}

.catalogo__formulario-filtros {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
  align-items: flex-end;
}

.catalogo__campo--buscar {
  grid-column: 1 / -1;
}

.catalogo__campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.catalogo__label {
  font-size: var(--texto-xs);
  font-weight: 600;
  color: var(--color-texto-secundario);
}

.catalogo__input {
  min-height: var(--alto-control);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  color: var(--color-texto);
  font-size: var(--texto-sm);
}

.catalogo__input:focus {
  outline: 2px solid var(--color-foco);
  outline-offset: 1px;
}

.catalogo__acciones-filtros {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-2);
}

.catalogo__resumen {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  min-height: 1.5rem;
}

.catalogo__conteo {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

.catalogo__cuadricula {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5);
}

.catalogo__vacio {
  display: flex;
  justify-content: center;
  padding: var(--space-7) var(--space-4);
  text-align: center;
}

.catalogo__vacio-caja {
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.catalogo__vacio-titulo {
  font-size: var(--texto-xl);
  color: var(--color-texto);
}

.catalogo__vacio-texto {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

.catalogo__paginacion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-linea);
}

.catalogo__paginacion-info {
  font-size: var(--texto-sm);
  font-weight: 600;
  color: var(--color-texto);
}

@media (max-width: 40rem) {
  .catalogo__hero {
    padding: var(--space-4);
  }

  .catalogo__titulo {
    font-size: var(--texto-2xl);
  }

  .catalogo__cuadricula {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .catalogo__paginacion {
    flex-direction: column;
    gap: var(--space-2);
  }
}
</style>
