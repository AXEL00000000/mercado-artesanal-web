<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { del, get, post, put } from '@/shared/api/cliente'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import { formatearPrecio } from '@/shared/utils/formato'
import NavegacionTaller from '../components/NavegacionTaller.vue'
import {
  DESCRIPCION_ENTREGA,
  ETIQUETA_ENTREGA,
  type OpcionEntrega,
  type OpcionEntregaCrear,
  type OpcionEntregaEditar,
  type TipoEntrega,
} from '../tipos'

const TODOS_LOS_TIPOS: TipoEntrega[] = ['envia', 'costo_fijo', 'recoger_taller']

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

const confirmandoId = ref<number | null>(null)
const procesandoId = ref<number | null>(null)
const errorTarjetaId = ref<number | null>(null)
const errorTarjeta = ref<unknown>(null)

// El backend permite como máximo una configuración por cada tipo de entrega
const tiposDisponibles = computed(() =>
  TODOS_LOS_TIPOS.filter((tipo) => !opciones.value.some((opcion) => opcion.tipo === tipo)),
)

function sincronizarTipoNuevo() {
  const primero = tiposDisponibles.value[0]
  if (primero) nuevoTipo.value = primero
  nuevoCostoTexto.value = ''
  nuevasInstrucciones.value = ''
  nuevoActivo.value = true
}

function abrirEdicion(opcion: OpcionEntrega) {
  confirmandoId.value = null
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
  if (procesandoId.value !== null) return
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

async function alternarActivo(opcion: OpcionEntrega) {
  if (procesandoId.value !== null) return
  procesandoId.value = opcion.id
  confirmandoId.value = null
  errorTarjetaId.value = opcion.id
  errorTarjeta.value = null
  aviso.value = ''
  try {
    const actualizada = await put<OpcionEntrega>(`/mi-taller/opciones-entrega/${opcion.id}`, {
      activo: !opcion.activo,
    })
    opciones.value = opciones.value.map((o) => (o.id === actualizada.id ? actualizada : o))
    aviso.value = actualizada.activo
      ? `"${ETIQUETA_ENTREGA[actualizada.tipo]}" activada.`
      : `"${ETIQUETA_ENTREGA[actualizada.tipo]}" desactivada.`
  } catch (err) {
    errorTarjeta.value = err
  } finally {
    procesandoId.value = null
  }
}

async function eliminarOpcion(opcion: OpcionEntrega) {
  if (procesandoId.value !== null) return
  procesandoId.value = opcion.id
  errorTarjetaId.value = opcion.id
  errorTarjeta.value = null
  aviso.value = ''
  try {
    // Si la opción ya fue usada en algún pedido, la API responde 409 y sugiere desactivarla
    await del(`/mi-taller/opciones-entrega/${opcion.id}`)
    opciones.value = opciones.value.filter((o) => o.id !== opcion.id)
    confirmandoId.value = null
    if (editandoId.value === opcion.id) cerrarEdicion()
    sincronizarTipoNuevo()
    aviso.value = `Opción "${ETIQUETA_ENTREGA[opcion.tipo]}" eliminada.`
  } catch (err) {
    errorTarjeta.value = err
    confirmandoId.value = null
  } finally {
    procesandoId.value = null
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
  <section class="panel">
    <NavegacionTaller
      titulo="Opciones de entrega"
      subtitulo="Configura cómo pueden recibir o recoger sus piezas tus compradores."
    />

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

        <label class="casilla">
          <input v-model="nuevoActivo" type="checkbox" />
          <span>Disponible desde el inicio en el checkout</span>
        </label>

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
                <span class="insignia" :class="opcion.activo ? 'insignia--activa' : 'insignia--inactiva'">
                  {{ opcion.activo ? 'Activa' : 'Inactiva' }}
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

            <label class="casilla">
              <input v-model="editActivo" type="checkbox" />
              <span>Opción activa</span>
            </label>

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

          <div v-else class="acciones">
            <BotonBase
              variante="secundario"
              :disabled="procesandoId !== null"
              @click="abrirEdicion(opcion)"
            >
              Editar
            </BotonBase>

            <BotonBase
              variante="secundario"
              :cargando="procesandoId === opcion.id"
              :disabled="procesandoId !== null"
              @click="alternarActivo(opcion)"
            >
              {{ opcion.activo ? 'Desactivar' : 'Activar' }}
            </BotonBase>

            <template v-if="confirmandoId === opcion.id">
              <span class="confirmacion-texto">¿Eliminar opción?</span>
              <BotonBase
                variante="comprar"
                :cargando="procesandoId === opcion.id"
                :disabled="procesandoId !== null"
                @click="eliminarOpcion(opcion)"
              >
                Confirmar
              </BotonBase>
              <BotonBase
                variante="secundario"
                :disabled="procesandoId !== null"
                @click="confirmandoId = null"
              >
                Cancelar
              </BotonBase>
            </template>

            <BotonBase
              v-else
              variante="secundario"
              :disabled="procesandoId !== null"
              @click="confirmandoId = opcion.id"
            >
              Eliminar
            </BotonBase>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.panel {
  max-width: var(--ancho-maximo);
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

.contenido-entregas {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.aviso,
.aviso-completo {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-linea);
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
  border: 1px solid var(--color-linea);
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
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  font-size: var(--texto-base);
}

.campo__textarea {
  min-height: calc(var(--space-7) + var(--space-2));
  resize: vertical;
}

.casilla {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--texto-sm);
  font-weight: 600;
  cursor: pointer;
}

.vacio {
  padding: var(--space-6) var(--space-4);
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
  border-top: 1px solid var(--color-linea);
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.confirmacion-texto {
  font-size: var(--texto-sm);
  font-weight: 600;
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
}
</style>
