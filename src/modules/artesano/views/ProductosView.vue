<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { get, patch, post, put } from '@/shared/api/cliente'
import type { Categoria, ImagenProducto, ModoVenta } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import EtiquetaVenta from '@/shared/components/EtiquetaVenta.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import { formatearPrecio } from '@/shared/utils/formato'
import GestorImagenesProducto from '../components/GestorImagenesProducto.vue'
import NavegacionTaller from '../components/NavegacionTaller.vue'
import type { MiProductoDetalle, MiProductoLista, ProductoEntrada } from '../tipos'

type FiltroEstado = 'todos' | 'activos' | 'inactivos'

const cargando = ref(true)
const errorCarga = ref<unknown>(null)
const productos = ref<MiProductoLista[]>([])
const categorias = ref<Categoria[]>([])

const filtro = ref<FiltroEstado>('todos')
const aviso = ref('')
const errorLista = ref<unknown>(null)
const alternandoId = ref<number | null>(null)

const formularioAbierto = ref(false)
const editandoId = ref<number | null>(null)
const guardando = ref(false)
const errorFormulario = ref<unknown>(null)

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

// Adapta la respuesta detallada (crear/editar/activar) al formato compacto del listado
function aItemLista(detalle: MiProductoDetalle): MiProductoLista {
  const principal = detalle.imagenes.find((img) => img.es_principal) ?? detalle.imagenes[0]
  return {
    id: detalle.id,
    nombre: detalle.nombre,
    slug: detalle.slug,
    descripcion: detalle.descripcion,
    modo_venta: detalle.modo_venta,
    precio: detalle.precio,
    stock: detalle.stock,
    material: detalle.material,
    tecnica: detalle.tecnica,
    peso_g: detalle.peso_g,
    medidas_cm: detalle.medidas_cm,
    activo: detalle.activo,
    categoria: detalle.categoria,
    imagen: principal?.url ?? null,
    created_at: detalle.created_at,
    updated_at: detalle.updated_at,
  }
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

function abrirNuevo() {
  limpiarFormulario()
  productoFotosId.value = null
  formularioAbierto.value = true
  aviso.value = ''
}

function abrirEdicion(producto: MiProductoLista) {
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
  limpiarFormulario()
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
    const detalle = await get<MiProductoDetalle>(`/mi-taller/productos/${productoId}`)
    imagenesActivas.value = detalle.imagenes
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
      get<MiProductoLista[]>('/mi-taller/productos'),
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
      const actualizado = await put<MiProductoDetalle>(
        `/mi-taller/productos/${editandoId.value}`,
        cuerpo,
      )
      const item = aItemLista(actualizado)
      productos.value = productos.value.map((p) => (p.id === item.id ? item : p))
      imagenesActivas.value = actualizado.imagenes
      aviso.value = `"${item.nombre}" actualizado.`
      cerrarFormulario()
      productoFotosId.value = item.id
    } else {
      const creado = await post<MiProductoDetalle>('/mi-taller/productos', cuerpo)
      const item = aItemLista(creado)
      productos.value = [item, ...productos.value]
      if (filtro.value === 'inactivos') filtro.value = 'todos'
      cerrarFormulario()
      productoFotosId.value = item.id
      imagenesActivas.value = creado.imagenes
      aviso.value = `"${item.nombre}" creado. Ya puedes subir sus fotos.`
    }
  } catch (err) {
    errorFormulario.value = err
  } finally {
    guardando.value = false
  }
}

async function alternarActivo(producto: MiProductoLista) {
  if (alternandoId.value !== null) return
  alternandoId.value = producto.id
  errorLista.value = null
  aviso.value = ''
  try {
    const actualizado = await patch<MiProductoDetalle>(`/mi-taller/productos/${producto.id}`, {
      activo: !producto.activo,
    })
    const item = aItemLista(actualizado)
    productos.value = productos.value.map((p) => (p.id === item.id ? item : p))
    aviso.value = item.activo ? `"${item.nombre}" activado.` : `"${item.nombre}" desactivado.`
  } catch (err) {
    errorLista.value = err
  } finally {
    alternandoId.value = null
  }
}

function resumenMedidas(producto: MiProductoLista): string {
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
  <section class="panel">
    <NavegacionTaller
      titulo="Mis productos"
      subtitulo="Administra tu catálogo, precios, existencia, medidas de envío y fotografías."
    />

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
            Activos ({{ conteos.activos }})
          </button>
          <button
            type="button"
            class="filtro"
            :class="{ 'filtro--activo': filtro === 'inactivos' }"
            @click="filtro = 'inactivos'"
          >
            Inactivos ({{ conteos.inactivos }})
          </button>
        </div>

        <BotonBase v-if="!formularioAbierto" variante="comprar" @click="abrirNuevo">
          Nuevo producto
        </BotonBase>
      </div>

      <p v-if="aviso" class="aviso" role="status">{{ aviso }}</p>
      <MensajeError v-if="errorLista" :error="errorLista" />

      <form v-if="formularioAbierto" class="formulario" @submit.prevent="guardar">
        <div class="formulario__cabecera">
          <h2>{{ editandoId !== null ? 'Editar producto' : 'Nuevo producto' }}</h2>
          <BotonBase variante="secundario" @click="cerrarFormulario">Cancelar</BotonBase>
        </div>

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

          <div class="campo">
            <label for="prod_categoria" class="campo__etiqueta">Categoría *</label>
            <select id="prod_categoria" v-model="categoriaId" required class="campo__input">
              <option disabled value="">Selecciona una categoría</option>
              <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                {{ cat.nombre }}
              </option>
            </select>
          </div>

          <div class="campo">
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
              {{ modoVenta === 'fijo' ? 'Existencia (piezas) *' : 'Existencia (vacío = sobre pedido)' }}
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
              placeholder="Ej. Bruñido con piedra de cuarzo"
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

        <div class="formulario__acciones">
          <BotonBase type="submit" variante="comprar" :cargando="guardando">
            {{ editandoId !== null ? 'Guardar cambios' : 'Crear producto' }}
          </BotonBase>
          <BotonBase variante="secundario" @click="cerrarFormulario">Cancelar</BotonBase>
        </div>

        <GestorImagenesProducto
          v-if="editandoId !== null"
          :producto-id="editandoId"
          :producto-nombre="nombre || 'Producto'"
          :imagenes="imagenesActivas"
          :cargando="cargandoFotos"
          :error-carga="errorFotos"
          @actualizadas="(imgs) => actualizarImagenes(editandoId!, imgs)"
          @reintentar="abrirFotos(editandoId!, true)"
        />
      </form>

      <div v-if="productosFiltrados.length === 0" class="vacio">
        <p v-if="productos.length === 0">Aún no tienes productos registrados en tu taller.</p>
        <p v-else>No hay productos en este filtro.</p>
        <BotonBase v-if="productos.length === 0 && !formularioAbierto" variante="comprar" @click="abrirNuevo">
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
                <span class="insignia" :class="producto.activo ? 'insignia--activa' : 'insignia--inactiva'">
                  {{ producto.activo ? 'Activo' : 'Inactivo' }}
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

            <div class="tarjeta__acciones">
              <BotonBase variante="secundario" @click="abrirEdicion(producto)">Editar</BotonBase>
              <BotonBase variante="secundario" @click="abrirFotos(producto.id)">
                {{ productoFotosId === producto.id && !formularioAbierto ? 'Ocultar fotos' : 'Fotos' }}
              </BotonBase>
              <BotonBase
                variante="secundario"
                :cargando="alternandoId === producto.id"
                :disabled="alternandoId !== null"
                @click="alternarActivo(producto)"
              >
                {{ producto.activo ? 'Desactivar' : 'Activar' }}
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
  </section>
</template>

<style scoped>
.panel {
  max-width: var(--ancho-maximo);
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

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
  border: 1px solid var(--color-linea);
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
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  padding: var(--space-5);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.formulario__cabecera {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.rejilla-medidas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.campo--ancho {
  grid-column: 1 / -1;
}

.campo__etiqueta {
  font-size: var(--texto-sm);
  font-weight: 600;
}

.campo__input {
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  font-size: var(--texto-base);
}

.campo__textarea {
  min-height: calc(var(--space-7) + var(--space-5));
  resize: vertical;
}

.grupo-medidas {
  margin: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
}

.grupo-medidas__titulo {
  padding-inline: var(--space-2);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.formulario__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-7) var(--space-4);
  border: 1px dashed var(--color-linea);
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
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.tarjeta--inactiva {
  background: var(--color-fondo);
}

.tarjeta__principal {
  display: grid;
  grid-template-columns: auto 1fr auto;
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

.tarjeta__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}

@media (max-width: 48rem) {
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

  .tarjeta__acciones {
    justify-content: flex-start;
  }
}
</style>
