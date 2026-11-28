<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { del, get, patch, post, put } from '@/shared/api/cliente'
import type { Categoria, ImagenProducto, MiProducto, ModoVenta } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import DialogoConfirmar from '@/shared/components/DialogoConfirmar.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import EtiquetaVenta from '@/shared/components/EtiquetaVenta.vue'
import InterruptorBase from '@/shared/components/InterruptorBase.vue'
import LayoutPanel from '@/shared/components/LayoutPanel.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import PanelLateral from '@/shared/components/PanelLateral.vue'
import { formatearPrecio } from '@/shared/utils/formato'
import { useSesionStore } from '@/stores/sesion'
import GestorImagenesProducto from '../components/GestorImagenesProducto.vue'
import { pestanasArtesano, type ProductoEntrada } from '../tipos'

type FiltroEstado = 'todos' | 'activos' | 'inactivos'

const sesion = useSesionStore()
const pestanas = computed(() => pestanasArtesano(sesion.tieneTaller))

const cargando = ref(true)
const errorCarga = ref<unknown>(null)
const productos = ref<MiProducto[]>([])
const categorias = ref<Categoria[]>([])

const filtro = ref<FiltroEstado>('todos')
const aviso = ref('')
const errorLista = ref<unknown>(null)
const alternandoId = ref<number | null>(null)

const formularioAbierto = ref(false)
const editandoId = ref<number | null>(null)
const guardando = ref(false)
const errorFormulario = ref<unknown>(null)
const formProducto = ref<HTMLFormElement | null>(null)

const nombre = ref('')
const categoriaId = ref<number | ''>('')
const modoVenta = ref<ModoVenta>('fijo')
const precioTexto = ref('')
const stockTexto = ref('')
const descripcion = ref('')
const material = ref('')
const tecnica = ref('')
const pesoGTexto = ref('')
const altoCmTexto = ref('')
const anchoCmTexto = ref('')
const largoCmTexto = ref('')

const productoFotosId = ref<number | null>(null)
const cargandoFotos = ref(false)
const errorFotos = ref<unknown>(null)
const imagenesActivas = ref<ImagenProducto[]>([])

const productoPorEliminar = ref<MiProducto | null>(null)
const eliminando = ref(false)

const conteos = computed(() => {
  const activos = productos.value.filter((p) => p.activo).length
  const inactivos = productos.value.length - activos
  return { todos: productos.value.length, activos, inactivos }
})

const productosFiltrados = computed(() => {
  if (filtro.value === 'activos') return productos.value.filter((p) => p.activo)
  if (filtro.value === 'inactivos') return productos.value.filter((p) => !p.activo)
  return productos.value
})

const tituloEliminar = computed(() =>
  productoPorEliminar.value
    ? `¿Eliminar "${productoPorEliminar.value.nombre}"?`
    : '¿Eliminar producto?',
)

// Sincroniza la miniatura `imagen` cuando POST/PUT/PATCH responden con `imagenes[]`
function normalizarProducto(producto: MiProducto): MiProducto {
  if (!producto.imagenes) return producto
  const principal = producto.imagenes.find((img) => img.es_principal) ?? producto.imagenes[0]
  return { ...producto, imagen: principal?.url ?? null }
}

function textoOpcional(valor: number | null): string {
  return valor === null ? '' : String(valor)
}

function limpiarFormulario() {
  editandoId.value = null
  nombre.value = ''
  categoriaId.value = ''
  modoVenta.value = 'fijo'
  precioTexto.value = ''
  stockTexto.value = ''
  descripcion.value = ''
  material.value = ''
  tecnica.value = ''
  pesoGTexto.value = ''
  altoCmTexto.value = ''
  anchoCmTexto.value = ''
  largoCmTexto.value = ''
  errorFormulario.value = null
}

function alCerrarPanel() {
  const editandoAnterior = editandoId.value
  limpiarFormulario()
  if (editandoAnterior !== null && productoFotosId.value === editandoAnterior) {
    productoFotosId.value = null
  }
}

function abrirNuevo() {
  limpiarFormulario()
  productoFotosId.value = null
  formularioAbierto.value = true
  aviso.value = ''
}

function abrirEdicion(producto: MiProducto) {
  editandoId.value = producto.id
  nombre.value = producto.nombre
  categoriaId.value = producto.categoria.id
  modoVenta.value = producto.modo_venta
  precioTexto.value = String(producto.precio)
  stockTexto.value = textoOpcional(producto.stock)
  descripcion.value = producto.descripcion ?? ''
  material.value = producto.material ?? ''
  tecnica.value = producto.tecnica ?? ''
  pesoGTexto.value = textoOpcional(producto.peso_g)
  altoCmTexto.value = textoOpcional(producto.medidas_cm.alto)
  anchoCmTexto.value = textoOpcional(producto.medidas_cm.ancho)
  largoCmTexto.value = textoOpcional(producto.medidas_cm.largo)
  errorFormulario.value = null
  formularioAbierto.value = true
  aviso.value = ''
  void abrirFotos(producto.id, true)
}

function cerrarFormulario() {
  formularioAbierto.value = false
  alCerrarPanel()
}

function enviarFormularioProducto() {
  formProducto.value?.requestSubmit()
}

async function abrirFotos(productoId: number, mantenerAbierto = false) {
  if (!mantenerAbierto && productoFotosId.value === productoId) {
    productoFotosId.value = null
    return
  }

  // Se consulta el detalle individual porque el listado general no incluye imagenes[]
  productoFotosId.value = productoId
  cargandoFotos.value = true
  errorFotos.value = null
  imagenesActivas.value = []
  try {
    const detalle = await get<MiProducto>(`/mi-taller/productos/${productoId}`)
    imagenesActivas.value = detalle.imagenes ?? []
  } catch (err) {
    errorFotos.value = err
  } finally {
    cargandoFotos.value = false
  }
}

function actualizarImagenes(productoId: number, nuevas: ImagenProducto[]) {
  imagenesActivas.value = nuevas
  const principal = nuevas.find((img) => img.es_principal) ?? nuevas[0]
  productos.value = productos.value.map((p) =>
    p.id === productoId ? { ...p, imagen: principal?.url ?? null } : p,
  )
}

function numeroOpcional(texto: string): number | null {
  const limpio = texto.trim()
  if (!limpio) return null
  return Number(limpio)
}

async function cargar() {
  cargando.value = true
  errorCarga.value = null
  try {
    const [listaProductos, listaCategorias] = await Promise.all([
      get<MiProducto[]>('/mi-taller/productos'),
      get<Categoria[]>('/categorias'),
    ])
    productos.value = listaProductos
    categorias.value = listaCategorias
  } catch (err) {
    errorCarga.value = err
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  if (guardando.value) return
  errorFormulario.value = null
  aviso.value = ''

  if (categoriaId.value === '') {
    errorFormulario.value = 'Selecciona una categoría.'
    return
  }

  const precio = Number(precioTexto.value)
  if (!Number.isFinite(precio) || precio <= 0) {
    errorFormulario.value = 'Ingresa un precio mayor a 0.'
    return
  }

  const stock = numeroOpcional(stockTexto.value)
  // En modo 'fijo' el backend exige stock >= 0; en 'tratar', null indica sobre pedido
  if (modoVenta.value === 'fijo' && stock === null) {
    errorFormulario.value = 'En productos de precio fijo la existencia es obligatoria.'
    return
  }

  const cuerpo: ProductoEntrada = {
    categoria_id: Number(categoriaId.value),
    nombre: nombre.value.trim(),
    modo_venta: modoVenta.value,
    precio,
    stock,
    descripcion: descripcion.value.trim() || null,
    material: material.value.trim() || null,
    tecnica: tecnica.value.trim() || null,
    peso_g: numeroOpcional(pesoGTexto.value),
    alto_cm: numeroOpcional(altoCmTexto.value),
    ancho_cm: numeroOpcional(anchoCmTexto.value),
    largo_cm: numeroOpcional(largoCmTexto.value),
  }

  guardando.value = true
  try {
    if (editandoId.value !== null) {
      const actualizado = await put<MiProducto>(`/mi-taller/productos/${editandoId.value}`, cuerpo)
      const item = normalizarProducto(actualizado)
      productos.value = productos.value.map((p) => (p.id === item.id ? item : p))
      imagenesActivas.value = actualizado.imagenes ?? []
      aviso.value = `"${item.nombre}" actualizado.`
      cerrarFormulario()
    } else {
      const creado = await post<MiProducto>('/mi-taller/productos', cuerpo)
      const item = normalizarProducto(creado)
      productos.value = [item, ...productos.value]
      if (filtro.value === 'inactivos') filtro.value = 'todos'
      cerrarFormulario()
      productoFotosId.value = item.id
      imagenesActivas.value = creado.imagenes ?? []
      aviso.value = `"${item.nombre}" creado. Ya puedes subir sus fotos.`
    }
  } catch (err) {
    errorFormulario.value = err
  } finally {
    guardando.value = false
  }
}

async function cambiarVisibilidad(producto: MiProducto, visible: boolean) {
  if (alternandoId.value !== null || eliminando.value) return
  const anterior = producto.activo
  alternandoId.value = producto.id
  errorLista.value = null
  aviso.value = ''
  // Actualización optimista para mantener sincronizado el modelo del InterruptorBase
  productos.value = productos.value.map((p) =>
    p.id === producto.id ? { ...p, activo: visible } : p,
  )
  try {
    const actualizado = await patch<MiProducto>(`/mi-taller/productos/${producto.id}`, {
      activo: visible,
    })
    const item = normalizarProducto(actualizado)
    productos.value = productos.value.map((p) => (p.id === item.id ? item : p))
    aviso.value = item.activo
      ? `"${item.nombre}" visible en el catálogo.`
      : `"${item.nombre}" oculto del catálogo.`
  } catch (err) {
    productos.value = productos.value.map((p) =>
      p.id === producto.id ? { ...p, activo: anterior } : p,
    )
    errorLista.value = err
  } finally {
    alternandoId.value = null
  }
}

async function confirmarEliminacion() {
  const objetivo = productoPorEliminar.value
  if (!objetivo || eliminando.value) return
  eliminando.value = true
  errorLista.value = null
  aviso.value = ''
  try {
    // Borrado lógico en el backend: responde 204 sin cuerpo y conserva pedidos previos
    await del(`/mi-taller/productos/${objetivo.id}`)
    productos.value = productos.value.filter((p) => p.id !== objetivo.id)
    if (productoFotosId.value === objetivo.id) {
      productoFotosId.value = null
      imagenesActivas.value = []
    }
    if (editandoId.value === objetivo.id) {
      cerrarFormulario()
    }
    productoPorEliminar.value = null
    aviso.value = `"${objetivo.nombre}" eliminado.`
  } catch (err) {
    errorLista.value = err
    productoPorEliminar.value = null
  } finally {
    eliminando.value = false
  }
}

function resumenMedidas(producto: MiProducto): string {
  const partes: string[] = []
  if (producto.material) partes.push(producto.material)
  if (producto.tecnica) partes.push(producto.tecnica)
  const { alto, ancho, largo } = producto.medidas_cm
  if (alto !== null && ancho !== null && largo !== null) {
    partes.push(`${alto} × ${ancho} × ${largo} cm`)
  }
  if (producto.peso_g !== null) partes.push(`${producto.peso_g} g`)
  return partes.join(' · ')
}

onMounted(cargar)
</script>

<template>
  <LayoutPanel
    antetitulo="Panel del artesano"
    titulo="Mis productos"
    descripcion="Administra tu catálogo, precios, existencia, medidas de envío y fotografías."
    :pestanas="pestanas"
    etiqueta-pestanas="Secciones del taller"
  >
    <template v-if="!cargando && !errorCarga" #acciones>
      <BotonBase variante="comprar" @click="abrirNuevo">Nuevo producto</BotonBase>
    </template>

    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="errorCarga" :error="errorCarga" reintentable @reintentar="cargar" />

    <template v-else>
      <div class="barra-acciones">
        <div class="filtros" role="group" aria-label="Filtrar productos">
          <button
            type="button"
            class="filtro"
            :class="{ 'filtro--activo': filtro === 'todos' }"
            @click="filtro = 'todos'"
          >
            Todos ({{ conteos.todos }})
          </button>
          <button
            type="button"
            class="filtro"
            :class="{ 'filtro--activo': filtro === 'activos' }"
            @click="filtro = 'activos'"
          >
            Visibles ({{ conteos.activos }})
          </button>
          <button
            type="button"
            class="filtro"
            :class="{ 'filtro--activo': filtro === 'inactivos' }"
            @click="filtro = 'inactivos'"
          >
            Ocultos ({{ conteos.inactivos }})
          </button>
        </div>
      </div>

      <p v-if="aviso" class="aviso" role="status">{{ aviso }}</p>
      <MensajeError v-if="errorLista" :error="errorLista" />

      <div v-if="productosFiltrados.length === 0" class="vacio">
        <p v-if="productos.length === 0">Aún no tienes productos registrados en tu taller.</p>
        <p v-else>No hay productos en este filtro.</p>
        <BotonBase v-if="productos.length === 0" variante="comprar" @click="abrirNuevo">
          Crear primer producto
        </BotonBase>
      </div>

      <ul v-else class="lista">
        <li
          v-for="producto in productosFiltrados"
          :key="producto.id"
          class="tarjeta"
          :class="{ 'tarjeta--inactiva': !producto.activo }"
        >
          <div class="tarjeta__principal">
            <div class="tarjeta__foto">
              <img v-if="producto.imagen" :src="producto.imagen" :alt="producto.nombre" />
              <span v-else class="tarjeta__sin-foto">Sin foto</span>
            </div>

            <div class="tarjeta__info">
              <div class="tarjeta__etiquetas">
                <EtiquetaVenta :modo="producto.modo_venta" />
                <span
                  class="insignia"
                  :class="producto.activo ? 'insignia--activa' : 'insignia--inactiva'"
                >
                  {{ producto.activo ? 'Visible' : 'Oculto' }}
                </span>
              </div>

              <h2 class="tarjeta__nombre">{{ producto.nombre }}</h2>
              <p class="tarjeta__categoria">{{ producto.categoria.nombre }}</p>

              <p class="tarjeta__precio">
                <strong>{{ formatearPrecio(producto.precio) }}</strong>
                <span>
                  &middot;
                  {{
                    producto.stock !== null ? `${producto.stock} en existencia` : 'Sobre pedido'
                  }}
                </span>
              </p>

              <p v-if="resumenMedidas(producto)" class="tarjeta__detalles">
                {{ resumenMedidas(producto) }}
              </p>
            </div>
          </div>

          <div class="tarjeta__pie">
            <InterruptorBase
              :model-value="producto.activo"
              etiqueta="Visible en el catálogo"
              :disabled="alternandoId !== null || eliminando"
              @update:model-value="(visible) => cambiarVisibilidad(producto, visible)"
            />

            <div class="tarjeta__acciones">
              <BotonBase
                variante="secundario"
                :disabled="eliminando"
                @click="abrirEdicion(producto)"
              >
                Editar
              </BotonBase>
              <BotonBase
                variante="secundario"
                :disabled="eliminando"
                @click="abrirFotos(producto.id)"
              >
                {{
                  productoFotosId === producto.id && !formularioAbierto ? 'Ocultar fotos' : 'Fotos'
                }}
              </BotonBase>
              <BotonBase
                variante="peligro"
                :disabled="alternandoId !== null || eliminando"
                @click="productoPorEliminar = producto"
              >
                Eliminar
              </BotonBase>
            </div>
          </div>

          <GestorImagenesProducto
            v-if="productoFotosId === producto.id && !formularioAbierto"
            :producto-id="producto.id"
            :producto-nombre="producto.nombre"
            :imagenes="imagenesActivas"
            :cargando="cargandoFotos"
            :error-carga="errorFotos"
            @actualizadas="(imgs) => actualizarImagenes(producto.id, imgs)"
            @reintentar="abrirFotos(producto.id, true)"
          />
        </li>
      </ul>
    </template>

    <PanelLateral
      v-model:abierto="formularioAbierto"
      :titulo="editandoId !== null ? 'Editar producto' : 'Nuevo producto'"
      :descripcion="
        editandoId !== null
          ? 'Actualiza los datos, medidas o fotos de tu pieza.'
          : 'Completa los datos para agregar una pieza a tu taller.'
      "
      :bloqueado="guardando"
      @cerrar="alCerrarPanel"
    >
      <form ref="formProducto" class="formulario-panel" @submit.prevent="guardar">
        <div class="rejilla">
          <div class="campo campo--ancho">
            <label for="prod_nombre" class="campo__etiqueta">Nombre del producto *</label>
            <input
              id="prod_nombre"
              v-model="nombre"
              type="text"
              maxlength="150"
              required
              placeholder="Ej. Cántaro de barro negro"
              class="campo__input"
            />
          </div>

          <div class="campo campo--ancho">
            <label for="prod_categoria" class="campo__etiqueta">Categoría *</label>
            <select id="prod_categoria" v-model="categoriaId" required class="campo__input">
              <option disabled value="">Selecciona una categoría</option>
              <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                {{ cat.nombre }}
              </option>
            </select>
          </div>

          <div class="campo campo--ancho">
            <label for="prod_modo" class="campo__etiqueta">Modo de venta *</label>
            <select id="prod_modo" v-model="modoVenta" required class="campo__input">
              <option value="fijo">Precio fijo (compra en línea)</option>
              <option value="tratar">Precio a tratar (consulta por WhatsApp)</option>
            </select>
          </div>

          <div class="campo">
            <label for="prod_precio" class="campo__etiqueta">
              {{ modoVenta === 'fijo' ? 'Precio (MXN) *' : 'Precio de referencia (MXN) *' }}
            </label>
            <input
              id="prod_precio"
              v-model="precioTexto"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="1200"
              class="campo__input"
            />
          </div>

          <div class="campo">
            <label for="prod_stock" class="campo__etiqueta">
              {{
                modoVenta === 'fijo' ? 'Existencia (piezas) *' : 'Existencia (vacío = sobre pedido)'
              }}
            </label>
            <input
              id="prod_stock"
              v-model="stockTexto"
              type="number"
              step="1"
              min="0"
              :required="modoVenta === 'fijo'"
              :placeholder="modoVenta === 'fijo' ? '5' : 'Sobre pedido'"
              class="campo__input"
            />
          </div>

          <div class="campo">
            <label for="prod_material" class="campo__etiqueta">Material (opcional)</label>
            <input
              id="prod_material"
              v-model="material"
              type="text"
              maxlength="150"
              placeholder="Ej. Barro de Coyotepec"
              class="campo__input"
            />
          </div>

          <div class="campo">
            <label for="prod_tecnica" class="campo__etiqueta">Técnica (opcional)</label>
            <input
              id="prod_tecnica"
              v-model="tecnica"
              type="text"
              maxlength="150"
              placeholder="Ej. Bruñido con cuarzo"
              class="campo__input"
            />
          </div>

          <div class="campo campo--ancho">
            <label for="prod_descripcion" class="campo__etiqueta">Descripción (opcional)</label>
            <textarea
              id="prod_descripcion"
              v-model="descripcion"
              rows="3"
              placeholder="Describe detalles de elaboración, usos o cuidados."
              class="campo__input campo__textarea"
            />
          </div>
        </div>

        <fieldset class="grupo-medidas">
          <legend class="grupo-medidas__titulo">
            Peso y medidas para envío por paquetería (opcionales)
          </legend>
          <div class="rejilla-medidas">
            <div class="campo">
              <label for="prod_peso" class="campo__etiqueta">Peso (g)</label>
              <input
                id="prod_peso"
                v-model="pesoGTexto"
                type="number"
                step="1"
                min="1"
                placeholder="2500"
                class="campo__input"
              />
            </div>

            <div class="campo">
              <label for="prod_alto" class="campo__etiqueta">Alto (cm)</label>
              <input
                id="prod_alto"
                v-model="altoCmTexto"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="32"
                class="campo__input"
              />
            </div>

            <div class="campo">
              <label for="prod_ancho" class="campo__etiqueta">Ancho (cm)</label>
              <input
                id="prod_ancho"
                v-model="anchoCmTexto"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="22"
                class="campo__input"
              />
            </div>

            <div class="campo">
              <label for="prod_largo" class="campo__etiqueta">Largo (cm)</label>
              <input
                id="prod_largo"
                v-model="largoCmTexto"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="22"
                class="campo__input"
              />
            </div>
          </div>
        </fieldset>

        <MensajeError v-if="errorFormulario" :error="errorFormulario" />
      </form>

      <GestorImagenesProducto
        v-if="editandoId !== null"
        class="panel-fotos"
        :producto-id="editandoId"
        :producto-nombre="nombre || 'Producto'"
        :imagenes="imagenesActivas"
        :cargando="cargandoFotos"
        :error-carga="errorFotos"
        @actualizadas="(imgs) => editandoId !== null && actualizarImagenes(editandoId, imgs)"
        @reintentar="editandoId !== null && abrirFotos(editandoId, true)"
      />

      <template #pie>
        <BotonBase variante="secundario" :disabled="guardando" @click="cerrarFormulario">
          Cancelar
        </BotonBase>
        <BotonBase variante="comprar" :cargando="guardando" @click="enviarFormularioProducto">
          {{ editandoId !== null ? 'Guardar cambios' : 'Crear producto' }}
        </BotonBase>
      </template>
    </PanelLateral>

    <DialogoConfirmar
      :abierto="productoPorEliminar !== null"
      :titulo="tituloEliminar"
      mensaje="El producto desaparecerá de tu taller y del catálogo. Tus ventas anteriores se conservan."
      texto-confirmar="Eliminar"
      peligroso
      :cargando="eliminando"
      @confirmar="confirmarEliminacion"
      @cancelar="productoPorEliminar = null"
    />
  </LayoutPanel>
</template>

<style scoped>
.barra-acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.filtro {
  min-height: var(--alto-control);
  padding: 0 var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
  font-size: var(--texto-sm);
  font-weight: 600;
  cursor: pointer;
}

.filtro--activo {
  border-color: var(--color-primario);
  background: var(--color-suave);
  color: var(--color-primario);
}

.aviso {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.formulario-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.panel-fotos {
  margin-top: var(--space-5);
}

.rejilla,
.rejilla-medidas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.campo--ancho {
  grid-column: 1 / -1;
}

.campo__etiqueta {
  font-size: var(--texto-sm);
  font-weight: 600;
}

.campo__input {
  width: 100%;
  min-width: 0;
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  font-size: var(--texto-base);
}

.campo__textarea {
  min-height: calc(var(--space-7) + var(--space-5));
  resize: vertical;
}

.grupo-medidas {
  margin: 0;
  padding: var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.grupo-medidas__titulo {
  padding-inline: var(--space-2);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-4);
  border: var(--borde-fino) dashed var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  text-align: center;
}

.lista {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  list-style: none;
  margin: 0;
  padding: 0;
}

.tarjeta {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.tarjeta--inactiva {
  background: var(--color-fondo);
}

.tarjeta__principal {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--space-4);
}

.tarjeta__foto {
  width: calc(var(--space-7) + var(--space-5));
  height: calc(var(--space-7) + var(--space-5));
  overflow: hidden;
  border-radius: var(--radius-foto);
  background: var(--color-suave);
}

.tarjeta__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tarjeta__sin-foto {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
  text-align: center;
}

.tarjeta__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.tarjeta__etiquetas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.insignia {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  font-size: var(--texto-xs);
  font-weight: 600;
}

.insignia--activa {
  background: var(--color-suave);
  color: var(--color-texto);
}

.insignia--inactiva {
  background: var(--color-error-fondo);
  color: var(--color-error);
}

.tarjeta__nombre {
  font-size: var(--texto-lg);
}

.tarjeta__categoria {
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.tarjeta__precio {
  font-size: var(--texto-base);
}

.tarjeta__precio strong {
  font-family: var(--font-titulos);
}

.tarjeta__precio span {
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.tarjeta__detalles {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.tarjeta__pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: var(--borde-fino) solid var(--color-linea);
}

.tarjeta__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (max-width: 40rem) {
  .rejilla,
  .rejilla-medidas {
    grid-template-columns: 1fr;
  }

  .tarjeta__principal {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .tarjeta__foto {
    width: var(--space-7);
    height: var(--space-7);
  }

  .tarjeta__pie {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
