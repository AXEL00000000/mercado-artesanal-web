<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { del, get, post, put } from '@/shared/api/cliente'
import BotonBase from '@/shared/components/BotonBase.vue'
import DialogoConfirmar from '@/shared/components/DialogoConfirmar.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import InterruptorBase from '@/shared/components/InterruptorBase.vue'
import LayoutPanel from '@/shared/components/LayoutPanel.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import { formatearPrecio } from '@/shared/utils/formato'
import { useSesionStore } from '@/stores/sesion'
import {
  DESCRIPCION_ENTREGA,
  ETIQUETA_ENTREGA,
  pestanasArtesano,
  type OpcionEntrega,
  type OpcionEntregaCrear,
  type OpcionEntregaEditar,
  type TipoEntrega,
} from '../tipos'

const TODOS_LOS_TIPOS: TipoEntrega[] = ['envia', 'costo_fijo', 'recoger_taller']

const sesion = useSesionStore()
const pestanas = computed(() => pestanasArtesano(sesion.tieneTaller))

const cargando = ref(true)
const errorCarga = ref<unknown>(null)
const opciones = ref<OpcionEntrega[]>([])
const aviso = ref('')

const nuevoTipo = ref<TipoEntrega>('costo_fijo')
const nuevoCostoTexto = ref('')
const nuevasInstrucciones = ref('')
const nuevoActivo = ref(true)
const creando = ref(false)
const errorCrear = ref<unknown>(null)

const editandoId = ref<number | null>(null)
const editCostoTexto = ref('')
const editInstrucciones = ref('')
const editActivo = ref(true)

const opcionPorEliminar = ref<OpcionEntrega | null>(null)
const eliminando = ref(false)
const procesandoId = ref<number | null>(null)
const errorTarjetaId = ref<number | null>(null)
const errorTarjeta = ref<unknown>(null)

// El backend permite como máximo una configuración por cada tipo de entrega
const tiposDisponibles = computed(() =>
  TODOS_LOS_TIPOS.filter((tipo) => !opciones.value.some((opcion) => opcion.tipo === tipo)),
)

const tituloEliminar = computed(() =>
  opcionPorEliminar.value
    ? `¿Eliminar "${ETIQUETA_ENTREGA[opcionPorEliminar.value.tipo]}"?`
    : '¿Eliminar opción de entrega?',
)

function sincronizarTipoNuevo() {
  const primero = tiposDisponibles.value[0]
  if (primero) nuevoTipo.value = primero
  nuevoCostoTexto.value = ''
  nuevasInstrucciones.value = ''
  nuevoActivo.value = true
}

function abrirEdicion(opcion: OpcionEntrega) {
  errorTarjetaId.value = null
  errorTarjeta.value = null
  editandoId.value = opcion.id
  editCostoTexto.value = opcion.costo_fijo !== null ? String(opcion.costo_fijo) : ''
  editInstrucciones.value = opcion.instrucciones ?? ''
  editActivo.value = opcion.activo
}

function cerrarEdicion() {
  editandoId.value = null
  editCostoTexto.value = ''
  editInstrucciones.value = ''
  editActivo.value = true
}

async function cargar() {
  cargando.value = true
  errorCarga.value = null
  try {
    opciones.value = await get<OpcionEntrega[]>('/mi-taller/opciones-entrega')
    sincronizarTipoNuevo()
  } catch (err) {
    errorCarga.value = err
  } finally {
    cargando.value = false
  }
}

async function crearOpcion() {
  if (creando.value || tiposDisponibles.value.length === 0) return
  errorCrear.value = null
  aviso.value = ''

  const cuerpo: OpcionEntregaCrear = {
    tipo: nuevoTipo.value,
    instrucciones: nuevasInstrucciones.value.trim() || null,
    activo: nuevoActivo.value,
  }

  // costo_fijo solo es aceptado cuando tipo === 'costo_fijo'; en otros tipos la API devuelve 400
  if (nuevoTipo.value === 'costo_fijo') {
    const costo = Number(nuevoCostoTexto.value)
    if (nuevoCostoTexto.value.trim() === '' || !Number.isFinite(costo) || costo < 0) {
      errorCrear.value = 'Ingresa un costo fijo válido mayor o igual a 0.'
      return
    }
    cuerpo.costo_fijo = costo
  }

  creando.value = true
  try {
    const creada = await post<OpcionEntrega>('/mi-taller/opciones-entrega', cuerpo)
    opciones.value = [...opciones.value, creada]
    sincronizarTipoNuevo()
    aviso.value = `Opción "${ETIQUETA_ENTREGA[creada.tipo]}" agregada.`
  } catch (err) {
    errorCrear.value = err
  } finally {
    creando.value = false
  }
}

async function guardarEdicion(opcion: OpcionEntrega) {
  if (procesandoId.value !== null || eliminando.value) return
  errorTarjetaId.value = opcion.id
  errorTarjeta.value = null
  aviso.value = ''

  // PUT rechaza cualquier intento de enviar o cambiar 'tipo'
  const cuerpo: OpcionEntregaEditar = {
    instrucciones: editInstrucciones.value.trim() || null,
    activo: editActivo.value,
  }

  if (opcion.tipo === 'costo_fijo') {
    const costo = Number(editCostoTexto.value)
    if (editCostoTexto.value.trim() === '' || !Number.isFinite(costo) || costo < 0) {
      errorTarjeta.value = 'Ingresa un costo fijo válido mayor o igual a 0.'
      return
    }
    cuerpo.costo_fijo = costo
  }

  procesandoId.value = opcion.id
  try {
    const actualizada = await put<OpcionEntrega>(
      `/mi-taller/opciones-entrega/${opcion.id}`,
      cuerpo,
    )
    opciones.value = opciones.value.map((o) => (o.id === actualizada.id ? actualizada : o))
    cerrarEdicion()
    aviso.value = `Opción "${ETIQUETA_ENTREGA[actualizada.tipo]}" actualizada.`
  } catch (err) {
    errorTarjeta.value = err
  } finally {
    procesandoId.value = null
  }
}

async function cambiarDisponibilidad(opcion: OpcionEntrega, disponible: boolean) {
  if (procesandoId.value !== null || eliminando.value) return
  const anterior = opcion.activo
  procesandoId.value = opcion.id
  errorTarjetaId.value = opcion.id
  errorTarjeta.value = null
  aviso.value = ''
  // Actualización optimista para mantener sincronizado el modelo del InterruptorBase
  opciones.value = opciones.value.map((o) =>
    o.id === opcion.id ? { ...o, activo: disponible } : o,
  )
  try {
    const actualizada = await put<OpcionEntrega>(`/mi-taller/opciones-entrega/${opcion.id}`, {
      activo: disponible,
    })
    opciones.value = opciones.value.map((o) => (o.id === actualizada.id ? actualizada : o))
    aviso.value = actualizada.activo
      ? `"${ETIQUETA_ENTREGA[actualizada.tipo]}" disponible.`
      : `"${ETIQUETA_ENTREGA[actualizada.tipo]}" pausada.`
  } catch (err) {
    opciones.value = opciones.value.map((o) =>
      o.id === opcion.id ? { ...o, activo: anterior } : o,
    )
    errorTarjeta.value = err
  } finally {
    procesandoId.value = null
  }
}

async function confirmarEliminacion() {
  const objetivo = opcionPorEliminar.value
  if (!objetivo || eliminando.value) return
  eliminando.value = true
  errorTarjetaId.value = objetivo.id
  errorTarjeta.value = null
  aviso.value = ''
  try {
    // Si la opción ya fue usada en algún pedido, la API responde 409 y sugiere desactivarla
    await del(`/mi-taller/opciones-entrega/${objetivo.id}`)
    opciones.value = opciones.value.filter((o) => o.id !== objetivo.id)
    if (editandoId.value === objetivo.id) cerrarEdicion()
    sincronizarTipoNuevo()
    opcionPorEliminar.value = null
    aviso.value = `Opción "${ETIQUETA_ENTREGA[objetivo.tipo]}" eliminada.`
  } catch (err) {
    errorTarjeta.value = err
    opcionPorEliminar.value = null
  } finally {
    eliminando.value = false
  }
}

function textoCosto(opcion: OpcionEntrega): string {
  if (opcion.tipo === 'recoger_taller') return 'Gratis en el taller'
  if (opcion.tipo === 'envia') return 'Cotización en vivo (Envia.com)'
  return opcion.costo_fijo !== null ? formatearPrecio(opcion.costo_fijo) : 'Sin costo definido'
}

onMounted(cargar)
</script>

<template>
  <LayoutPanel
    antetitulo="Panel del artesano"
    titulo="Opciones de entrega"
    descripcion="Configura cómo pueden recibir o recoger sus piezas tus compradores."
    :pestanas="pestanas"
    etiqueta-pestanas="Secciones del taller"
  >
    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="errorCarga" :error="errorCarga" reintentable @reintentar="cargar" />

    <div v-else class="contenido-entregas">
      <p v-if="aviso" class="aviso" role="status">{{ aviso }}</p>

      <form v-if="tiposDisponibles.length > 0" class="tarjeta-form" @submit.prevent="crearOpcion">
        <h2 class="tarjeta-form__titulo">Agregar opción de entrega</h2>

        <div class="rejilla">
          <div class="campo">
            <label for="nuevo_tipo" class="campo__etiqueta">Tipo de entrega *</label>
            <select id="nuevo_tipo" v-model="nuevoTipo" class="campo__input">
              <option v-for="tipo in tiposDisponibles" :key="tipo" :value="tipo">
                {{ ETIQUETA_ENTREGA[tipo] }}
              </option>
            </select>
            <p class="campo__ayuda">{{ DESCRIPCION_ENTREGA[nuevoTipo] }}</p>
          </div>

          <div v-if="nuevoTipo === 'costo_fijo'" class="campo">
            <label for="nuevo_costo" class="campo__etiqueta">Costo fijo (MXN) *</label>
            <input
              id="nuevo_costo"
              v-model="nuevoCostoTexto"
              type="number"
              step="0.01"
              min="0"
              max="99999"
              required
              placeholder="150"
              class="campo__input"
            />
          </div>

          <div class="campo campo--ancho">
            <label for="nuevas_instrucciones" class="campo__etiqueta">
              Instrucciones para el comprador (opcional)
            </label>
            <textarea
              id="nuevas_instrucciones"
              v-model="nuevasInstrucciones"
              rows="2"
              placeholder="Horarios de atención, zonas o detalles de envío."
              class="campo__input campo__textarea"
            />
          </div>
        </div>

        <InterruptorBase v-model="nuevoActivo" etiqueta="Disponible desde el inicio en el checkout" />

        <MensajeError v-if="errorCrear" :error="errorCrear" />

        <div>
          <BotonBase type="submit" variante="comprar" :cargando="creando">
            Agregar opción
          </BotonBase>
        </div>
      </form>

      <p v-else class="aviso-completo">
        Ya configuraste los 3 tipos de entrega disponibles. Puedes editarlos o activarlos abajo.
      </p>

      <div v-if="opciones.length === 0" class="vacio">
        <p>Aún no has configurado ninguna opción de entrega para tu taller.</p>
      </div>

      <ul v-else class="lista">
        <li
          v-for="opcion in opciones"
          :key="opcion.id"
          class="tarjeta"
          :class="{ 'tarjeta--inactiva': !opcion.activo }"
        >
          <div class="tarjeta__cabecera">
            <div class="tarjeta__info">
              <div class="tarjeta__titulo-fila">
                <h2>{{ ETIQUETA_ENTREGA[opcion.tipo] }}</h2>
                <span
                  class="insignia"
                  :class="opcion.activo ? 'insignia--activa' : 'insignia--inactiva'"
                >
                  {{ opcion.activo ? 'Disponible' : 'Pausada' }}
                </span>
              </div>
              <p class="tarjeta__descripcion">{{ DESCRIPCION_ENTREGA[opcion.tipo] }}</p>
            </div>

            <p class="tarjeta__costo">{{ textoCosto(opcion) }}</p>
          </div>

          <p v-if="opcion.instrucciones" class="tarjeta__instrucciones">
            {{ opcion.instrucciones }}
          </p>

          <MensajeError v-if="errorTarjetaId === opcion.id && errorTarjeta" :error="errorTarjeta" />

          <form
            v-if="editandoId === opcion.id"
            class="edicion"
            @submit.prevent="guardarEdicion(opcion)"
          >
            <div class="rejilla">
              <div v-if="opcion.tipo === 'costo_fijo'" class="campo">
                <label :for="`edit_costo_${opcion.id}`" class="campo__etiqueta">
                  Costo fijo (MXN) *
                </label>
                <input
                  :id="`edit_costo_${opcion.id}`"
                  v-model="editCostoTexto"
                  type="number"
                  step="0.01"
                  min="0"
                  max="99999"
                  required
                  class="campo__input"
                />
              </div>

              <div class="campo campo--ancho">
                <label :for="`edit_inst_${opcion.id}`" class="campo__etiqueta">
                  Instrucciones (opcional)
                </label>
                <textarea
                  :id="`edit_inst_${opcion.id}`"
                  v-model="editInstrucciones"
                  rows="2"
                  class="campo__input campo__textarea"
                />
              </div>
            </div>

            <InterruptorBase v-model="editActivo" etiqueta="Disponible" />

            <div class="acciones">
              <BotonBase type="submit" variante="comprar" :cargando="procesandoId === opcion.id">
                Guardar
              </BotonBase>
              <BotonBase
                variante="secundario"
                :disabled="procesandoId === opcion.id"
                @click="cerrarEdicion"
              >
                Cancelar
              </BotonBase>
            </div>
          </form>

          <div v-else class="tarjeta__pie">
            <InterruptorBase
              :model-value="opcion.activo"
              etiqueta="Disponible"
              :disabled="procesandoId !== null || eliminando"
              @update:model-value="(disponible) => cambiarDisponibilidad(opcion, disponible)"
            />

            <div class="acciones">
              <BotonBase
                variante="secundario"
                :disabled="procesandoId !== null || eliminando"
                @click="abrirEdicion(opcion)"
              >
                Editar
              </BotonBase>

              <BotonBase
                variante="peligro"
                :disabled="procesandoId !== null || eliminando"
                @click="opcionPorEliminar = opcion"
              >
                Eliminar
              </BotonBase>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <DialogoConfirmar
      :abierto="opcionPorEliminar !== null"
      :titulo="tituloEliminar"
      mensaje="Los compradores ya no podrán elegir esta opción al hacer un pedido. Si ya se usó en pedidos anteriores, solo podrás pausarla desactivando Disponible."
      texto-confirmar="Eliminar"
      peligroso
      :cargando="eliminando"
      @confirmar="confirmarEliminacion"
      @cancelar="opcionPorEliminar = null"
    />
  </LayoutPanel>
</template>

<style scoped>
.contenido-entregas {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.aviso,
.aviso-completo {
  padding: var(--space-3) var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.aviso-completo {
  background: var(--color-suave);
  color: var(--color-texto-secundario);
  font-weight: 400;
}

.tarjeta-form,
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.tarjeta--inactiva {
  background: var(--color-fondo);
}

.tarjeta-form__titulo {
  font-size: var(--texto-xl);
}

.rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
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

.campo__ayuda {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.campo__input {
  width: 100%;
  min-width: 0;
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  font-size: var(--texto-base);
}

.campo__textarea {
  min-height: calc(var(--space-7) + var(--space-2));
  resize: vertical;
}

.vacio {
  padding: var(--space-6) var(--space-4);
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

.tarjeta__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.tarjeta__info {
  flex: 1;
  min-width: 0;
}

.tarjeta__titulo-fila {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.tarjeta__titulo-fila h2 {
  font-size: var(--texto-lg);
}

.tarjeta__descripcion {
  margin-top: var(--space-1);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.tarjeta__costo {
  flex-shrink: 0;
  font-family: var(--font-titulos);
  font-size: var(--texto-lg);
  font-weight: 700;
  white-space: nowrap;
}

.tarjeta__instrucciones {
  padding: var(--space-3);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.insignia {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  font-size: var(--texto-xs);
  font-weight: 600;
}

.insignia--activa {
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
}

.insignia--inactiva {
  background: var(--color-error-fondo);
  color: var(--color-error);
}

.edicion {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: var(--borde-fino) solid var(--color-linea);
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

.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

@media (max-width: 40rem) {
  .rejilla {
    grid-template-columns: 1fr;
  }

  .tarjeta-form,
  .tarjeta {
    padding: var(--space-4);
  }

  .tarjeta__cabecera {
    flex-direction: column;
    gap: var(--space-2);
  }

  .tarjeta__costo {
    white-space: normal;
  }

  .tarjeta__pie {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
