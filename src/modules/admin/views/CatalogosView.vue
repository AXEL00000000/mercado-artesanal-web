<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { del, get, post, put } from '@/shared/api/cliente'
import type { Categoria, Comunidad } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import DialogoConfirmar from '@/shared/components/DialogoConfirmar.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import LayoutPanel from '@/shared/components/LayoutPanel.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import SelectorDesplegable, {
  type OpcionSelector,
} from '../../catalogo/components/SelectorDesplegable.vue'

const pestanasAdmin = [
  { etiqueta: 'Talleres', to: { name: 'admin-talleres' } },
  { etiqueta: 'Catálogos', to: { name: 'admin-catalogos' } },
]

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

const opcionesRegion = computed<OpcionSelector[]>(() =>
  REGIONES_OAXACA.map((reg) => ({ valor: reg, texto: reg })),
)

type SeccionActiva = 'categorias' | 'comunidades'

const seccionActiva = ref<SeccionActiva>('categorias')
const cargando = ref(true)
const error = ref<unknown>(null)
const accionError = ref<unknown>(null)
const mensajeExito = ref<string | null>(null)

// Datos
const categorias = ref<Categoria[]>([])
const comunidades = ref<Comunidad[]>([])

// Modal / Formulario Categoría
const editandoCategoria = ref<Categoria | null>(null)
const mostrandoFormCat = ref(false)
const formCatNombre = ref('')
const formCatSlug = ref('')
const formCatDesc = ref('')
const guardandoCat = ref(false)

// Modal / Formulario Comunidad
const editandoComunidad = ref<Comunidad | null>(null)
const mostrandoFormCom = ref(false)
const formComNombre = ref('')
const formComMunicipio = ref('')
const formComDistrito = ref('')
const formComRegion = ref(REGIONES_OAXACA[7]) // Valles Centrales default
const guardandoCom = ref(false)

// Confirmación de eliminación con DialogoConfirmar
const elementoEliminar = ref<{
  tipo: 'categoria' | 'comunidad'
  identificador: string | number
  nombre: string
} | null>(null)
const eliminando = ref(false)

async function cargarDatos() {
  cargando.value = true
  error.value = null
  accionError.value = null

  try {
    const [cats, coms] = await Promise.all([
      get<Categoria[]>('/categorias'),
      get<Comunidad[]>('/comunidades'),
    ])
    categorias.value = cats
    comunidades.value = coms
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

function mostrarAviso(mensaje: string) {
  mensajeExito.value = mensaje
  setTimeout(() => {
    mensajeExito.value = null
  }, 4000)
}

// Acciones Categorías
function abrirNuevaCategoria() {
  editandoCategoria.value = null
  formCatNombre.value = ''
  formCatSlug.value = ''
  formCatDesc.value = ''
  accionError.value = null
  mostrandoFormCat.value = true
}

function abrirEditarCategoria(cat: Categoria) {
  editandoCategoria.value = cat
  formCatNombre.value = cat.nombre
  formCatSlug.value = cat.slug
  formCatDesc.value = cat.descripcion ?? ''
  accionError.value = null
  mostrandoFormCat.value = true
}

function cerrarFormCat() {
  mostrandoFormCat.value = false
  editandoCategoria.value = null
  accionError.value = null
}

async function guardarCategoria() {
  if (!formCatNombre.value.trim()) return
  guardandoCat.value = true
  accionError.value = null

  try {
    const cuerpo: { nombre: string; slug?: string; descripcion?: string } = {
      nombre: formCatNombre.value.trim(),
      descripcion: formCatDesc.value.trim() || undefined,
    }
    if (formCatSlug.value.trim()) {
      cuerpo.slug = formCatSlug.value.trim()
    }

    if (editandoCategoria.value) {
      await put(`/categorias/${editandoCategoria.value.slug}`, cuerpo)
      mostrarAviso(`Categoría "${cuerpo.nombre}" actualizada exitosamente.`)
    } else {
      await post('/categorias', cuerpo)
      mostrarAviso(`Categoría "${cuerpo.nombre}" creada exitosamente.`)
    }

    cerrarFormCat()
    await cargarDatos()
  } catch (err) {
    accionError.value = err
  } finally {
    guardandoCat.value = false
  }
}

// Acciones Comunidades
function abrirNuevaComunidad() {
  editandoComunidad.value = null
  formComNombre.value = ''
  formComMunicipio.value = ''
  formComDistrito.value = ''
  formComRegion.value = REGIONES_OAXACA[7]
  accionError.value = null
  mostrandoFormCom.value = true
}

function abrirEditarComunidad(com: Comunidad) {
  editandoComunidad.value = com
  formComNombre.value = com.nombre
  formComMunicipio.value = com.municipio
  formComDistrito.value = com.distrito ?? ''
  formComRegion.value = com.region
  accionError.value = null
  mostrandoFormCom.value = true
}

function cerrarFormCom() {
  mostrandoFormCom.value = false
  editandoComunidad.value = null
  accionError.value = null
}

async function guardarComunidad() {
  if (!formComNombre.value.trim() || !formComMunicipio.value.trim()) return
  guardandoCom.value = true
  accionError.value = null

  try {
    const cuerpo = {
      nombre: formComNombre.value.trim(),
      municipio: formComMunicipio.value.trim(),
      distrito: formComDistrito.value.trim() || null,
      region: formComRegion.value,
    }

    if (editandoComunidad.value) {
      await put(`/comunidades/${editandoComunidad.value.id}`, cuerpo)
      mostrarAviso(`Comunidad "${cuerpo.nombre}" actualizada exitosamente.`)
    } else {
      await post('/comunidades', cuerpo)
      mostrarAviso(`Comunidad "${cuerpo.nombre}" creada exitosamente.`)
    }

    cerrarFormCom()
    await cargarDatos()
  } catch (err) {
    accionError.value = err
  } finally {
    guardandoCom.value = false
  }
}

// Eliminación con DialogoConfirmar
function solicitarEliminar(
  tipo: 'categoria' | 'comunidad',
  identificador: string | number,
  nombre: string,
) {
  elementoEliminar.value = { tipo, identificador, nombre }
  accionError.value = null
}

function cancelarEliminar() {
  elementoEliminar.value = null
  accionError.value = null
}

async function confirmarEliminar() {
  if (!elementoEliminar.value) return
  eliminando.value = true
  accionError.value = null

  try {
    const { tipo, identificador, nombre } = elementoEliminar.value
    if (tipo === 'categoria') {
      await del(`/categorias/${identificador}`)
      mostrarAviso(`Categoría "${nombre}" eliminada correctamente.`)
    } else {
      await del(`/comunidades/${identificador}`)
      mostrarAviso(`Comunidad "${nombre}" eliminada correctamente.`)
    }
    cancelarEliminar()
    await cargarDatos()
  } catch (err) {
    accionError.value = err
  } finally {
    eliminando.value = false
  }
}

onMounted(() => {
  void cargarDatos()
})
</script>

<template>
  <LayoutPanel
    antetitulo="Administración"
    titulo="Gestión de Catálogos"
    descripcion="Administración de ramas artesanales y comunidades con origen territorial."
    :pestanas="pestanasAdmin"
  >
    <!-- Selector de subsección tipo píldora -->
    <div class="admin-catalogos__selector-seccion">
      <div class="admin-catalogos__pestanas" role="tablist">
        <button
          type="button"
          class="admin-catalogos__pestana"
          :class="{ 'admin-catalogos__pestana--activa': seccionActiva === 'categorias' }"
          @click="seccionActiva = 'categorias'"
        >
          Categorías ({{ categorias.length }})
        </button>
        <button
          type="button"
          class="admin-catalogos__pestana"
          :class="{ 'admin-catalogos__pestana--activa': seccionActiva === 'comunidades' }"
          @click="seccionActiva = 'comunidades'"
        >
          Comunidades ({{ comunidades.length }})
        </button>
      </div>
    </div>

    <!-- Avisos de éxito o error -->
    <div
      v-if="mensajeExito"
      class="admin-catalogos__aviso admin-catalogos__aviso--exito"
      role="status"
    >
      {{ mensajeExito }}
    </div>

    <MensajeError v-if="accionError" :error="accionError" class="admin-catalogos__error" />

    <!-- Estados globales -->
    <EstadoCarga v-if="cargando" texto="Cargando catálogos…" />

    <MensajeError
      v-else-if="error"
      :error="error"
      reintentable
      @reintentar="cargarDatos"
    />

    <!-- SECCIÓN: CATEGORÍAS -->
    <section v-else-if="seccionActiva === 'categorias'" class="admin-catalogos__cuerpo">
      <div class="admin-catalogos__barra-accion">
        <h2 class="admin-catalogos__subseccion-titulo">Ramas artesanales</h2>
        <BotonBase variante="comprar" @click="abrirNuevaCategoria">
          + Nueva categoría
        </BotonBase>
      </div>

      <!-- Formulario emergente / inline -->
      <div v-if="mostrandoFormCat" class="admin-formulario">
        <h3 class="admin-formulario__titulo">
          {{
            editandoCategoria
              ? `Editar categoría: ${editandoCategoria.nombre}`
              : 'Nueva categoría'
          }}
        </h3>
        <form class="admin-formulario__grid" @submit.prevent="guardarCategoria">
          <div class="admin-formulario__campo">
            <label for="cat-nombre" class="admin-formulario__label">Nombre *</label>
            <input
              id="cat-nombre"
              v-model="formCatNombre"
              type="text"
              required
              placeholder="Ej. Alfarería y cerámica"
              class="admin-formulario__input"
            />
          </div>

          <div class="admin-formulario__campo">
            <label for="cat-slug" class="admin-formulario__label">
              Slug (opcional, se autogenera del nombre)
            </label>
            <input
              id="cat-slug"
              v-model="formCatSlug"
              type="text"
              placeholder="Ej. alfareria-y-ceramica"
              class="admin-formulario__input"
            />
          </div>

          <div class="admin-formulario__campo admin-formulario__campo--full">
            <label for="cat-desc" class="admin-formulario__label">Descripción</label>
            <textarea
              id="cat-desc"
              v-model="formCatDesc"
              rows="3"
              placeholder="Descripción de la rama artesanal..."
              class="admin-formulario__textarea"
            />
          </div>

          <div class="admin-formulario__acciones">
            <BotonBase variante="comprar" type="submit" :cargando="guardandoCat">
              Guardar categoría
            </BotonBase>
            <BotonBase variante="secundario" type="button" @click="cerrarFormCat">
              Cancelar
            </BotonBase>
          </div>
        </form>
      </div>

      <!-- Tabla de categorías -->
      <div class="admin-tabla-contenedor">
        <table class="admin-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th class="admin-tabla__num">Piezas</th>
              <th class="admin-tabla__acciones-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categorias" :key="cat.id">
              <td class="admin-tabla__destacado">{{ cat.nombre }}</td>
              <td class="admin-tabla__desc">{{ cat.descripcion || '—' }}</td>
              <td class="admin-tabla__num">{{ cat.total_productos ?? 0 }}</td>
              <td class="admin-tabla__acciones-td">
                <button
                  type="button"
                  class="admin-tabla__btn-accion"
                  @click="abrirEditarCategoria(cat)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="admin-tabla__btn-accion admin-tabla__btn-accion--peligro"
                  @click="solicitarEliminar('categoria', cat.slug, cat.nombre)"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SECCIÓN: COMUNIDADES -->
    <section v-else class="admin-catalogos__cuerpo">
      <div class="admin-catalogos__barra-accion">
        <h2 class="admin-catalogos__subseccion-titulo">Localidades y regiones de Oaxaca</h2>
        <BotonBase variante="comprar" @click="abrirNuevaComunidad">
          + Nueva comunidad
        </BotonBase>
      </div>

      <!-- Formulario emergente / inline -->
      <div v-if="mostrandoFormCom" class="admin-formulario">
        <h3 class="admin-formulario__titulo">
          {{
            editandoComunidad
              ? `Editar comunidad: ${editandoComunidad.nombre}`
              : 'Nueva comunidad'
          }}
        </h3>
        <form class="admin-formulario__grid" @submit.prevent="guardarComunidad">
          <div class="admin-formulario__campo">
            <label for="com-nombre" class="admin-formulario__label">Nombre de localidad *</label>
            <input
              id="com-nombre"
              v-model="formComNombre"
              type="text"
              required
              placeholder="Ej. San Bartolo Coyotepec"
              class="admin-formulario__input"
            />
          </div>

          <div class="admin-formulario__campo">
            <label for="com-municipio" class="admin-formulario__label">Municipio *</label>
            <input
              id="com-municipio"
              v-model="formComMunicipio"
              type="text"
              required
              placeholder="Ej. San Bartolo Coyotepec"
              class="admin-formulario__input"
            />
          </div>

          <div class="admin-formulario__campo">
            <label for="com-distrito" class="admin-formulario__label">Distrito (opcional)</label>
            <input
              id="com-distrito"
              v-model="formComDistrito"
              type="text"
              placeholder="Ej. Centro"
              class="admin-formulario__input"
            />
          </div>

          <div class="admin-formulario__campo">
            <label class="admin-formulario__label">Región *</label>
            <SelectorDesplegable
              id="com-region"
              :model-value="formComRegion ?? ''"
              :opciones="opcionesRegion"
              placeholder="Seleccionar región..."
              @change="(val) => (formComRegion = String(val))"
            />
          </div>

          <div class="admin-formulario__acciones admin-formulario__campo--full">
            <BotonBase variante="comprar" type="submit" :cargando="guardandoCom">
              Guardar comunidad
            </BotonBase>
            <BotonBase variante="secundario" type="button" @click="cerrarFormCom">
              Cancelar
            </BotonBase>
          </div>
        </form>
      </div>

      <!-- Tabla de comunidades -->
      <div class="admin-tabla-contenedor">
        <table class="admin-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Municipio</th>
              <th>Distrito</th>
              <th>Región</th>
              <th class="admin-tabla__num">Talleres</th>
              <th class="admin-tabla__acciones-th">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="com in comunidades" :key="com.id">
              <td class="admin-tabla__destacado">{{ com.nombre }}</td>
              <td>{{ com.municipio }}</td>
              <td>{{ com.distrito || '—' }}</td>
              <td><span class="admin-tabla__region-tag">{{ com.region }}</span></td>
              <td class="admin-tabla__num">{{ com.total_productores ?? 0 }}</td>
              <td class="admin-tabla__acciones-td">
                <button
                  type="button"
                  class="admin-tabla__btn-accion"
                  @click="abrirEditarComunidad(com)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="admin-tabla__btn-accion admin-tabla__btn-accion--peligro"
                  @click="solicitarEliminar('comunidad', com.id, com.nombre)"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Diálogo accesible de confirmación de eliminación -->
    <DialogoConfirmar
      :abierto="elementoEliminar !== null"
      :titulo="`¿Eliminar ${elementoEliminar?.tipo === 'categoria' ? 'categoría' : 'comunidad'}?`"
      :mensaje="`Estás por eliminar '${elementoEliminar?.nombre}'. Esta acción no se puede deshacer y fallará si tiene piezas o talleres vinculados.`"
      texto-confirmar="Eliminar"
      texto-cancelar="Cancelar"
      peligroso
      :cargando="eliminando"
      @confirmar="confirmarEliminar"
      @cancelar="cancelarEliminar"
    />
  </LayoutPanel>
</template>

<style scoped>
.admin-catalogos__selector-seccion {
  display: flex;
  margin-bottom: var(--space-5);
}

.admin-catalogos__pestanas {
  display: flex;
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-pildora);
  padding: var(--space-1);
}

.admin-catalogos__pestana {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-pildora);
  background: transparent;
  font-family: var(--font-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
  color: var(--color-texto-secundario);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.admin-catalogos__pestana--activa {
  background: var(--color-fondo);
  color: var(--color-texto);
  box-shadow: var(--sombra-suave);
}

.admin-catalogos__aviso {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-control);
  margin-bottom: var(--space-4);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.admin-catalogos__aviso--exito {
  background: var(--color-suave);
  color: var(--color-whatsapp);
  border: 1px solid var(--color-whatsapp);
}

.admin-catalogos__error {
  margin-bottom: var(--space-4);
}

.admin-catalogos__cuerpo {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-catalogos__barra-accion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.admin-catalogos__subseccion-titulo {
  font-size: var(--texto-xl);
  color: var(--color-texto);
}

/* Formulario */
.admin-formulario {
  padding: var(--space-5);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
}

.admin-formulario__titulo {
  font-size: var(--texto-lg);
  margin-bottom: var(--space-4);
  color: var(--color-texto);
}

.admin-formulario__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.admin-formulario__campo--full {
  grid-column: 1 / -1;
}

.admin-formulario__campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.admin-formulario__label {
  font-size: var(--texto-xs);
  font-weight: 600;
  color: var(--color-texto-secundario);
}

.admin-formulario__input,
.admin-formulario__textarea {
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  color: var(--color-texto);
  font-family: var(--font-texto);
  font-size: var(--texto-sm);
}

.admin-formulario__input:focus,
.admin-formulario__textarea:focus {
  outline: 2px solid var(--color-foco);
  outline-offset: 1px;
}

.admin-formulario__textarea {
  min-height: 80px;
  resize: vertical;
}

.admin-formulario__acciones {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

/* Tabla */
.admin-tabla-contenedor {
  overflow-x: auto;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-linea);
  background: var(--color-superficie);
}

.admin-tabla {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--texto-sm);
}

.admin-tabla th {
  background: var(--color-suave);
  padding: var(--space-3) var(--space-4);
  font-weight: 600;
  color: var(--color-texto-secundario);
  border-bottom: 1px solid var(--color-linea);
}

.admin-tabla td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-linea);
  color: var(--color-texto);
}

.admin-tabla tbody tr:last-child td {
  border-bottom: none;
}

.admin-tabla__destacado {
  font-weight: 600;
}

.admin-tabla__desc {
  max-width: 320px;
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.admin-tabla__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.admin-tabla__region-tag {
  display: inline-block;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pildora);
  background: var(--color-suave);
  font-size: var(--texto-2xs);
  font-weight: 600;
  color: var(--color-primario);
}

.admin-tabla__acciones-th,
.admin-tabla__acciones-td {
  text-align: right;
  white-space: nowrap;
}

.admin-tabla__btn-accion {
  background: transparent;
  border: none;
  font-family: var(--font-texto);
  font-size: var(--texto-xs);
  font-weight: 600;
  color: var(--color-primario);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
}

.admin-tabla__btn-accion:hover {
  text-decoration: underline;
}

.admin-tabla__btn-accion--peligro {
  color: var(--color-error);
}

@media (max-width: 40rem) {
  .admin-formulario__grid {
    grid-template-columns: 1fr;
  }
}
</style>
