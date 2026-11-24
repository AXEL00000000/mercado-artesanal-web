<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCarritoStore } from '@/stores/carrito'
import { get, post } from '@/shared/api/cliente'
import { formatearPrecio } from '@/shared/utils/formato'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'

interface OpcionEntrega {
  id: number
  productor_id: number
  tipo: 'envia' | 'costo_fijo' | 'recoger_taller'
  costo_fijo: number | null
  instrucciones: string | null
  activo: boolean
}

interface OpcionCotizada {
  paqueteria: string
  servicio: string
  costo: number
  dias: number
}

interface RespuestaCotizacion {
  opcion_entrega_id: number
  opciones: OpcionCotizada[]
}

interface RespuestaPedido {
  id: number
  estado: string
}

interface RespuestaPago {
  pago_id: number
  pedido_id: number
  checkout_url: string
}

const router = useRouter()
const carrito = useCarritoStore()

const cargando = ref(true)
const error = ref<unknown>(null)
const opciones = ref<OpcionEntrega[]>([])
const opcionSeleccionada = ref<OpcionEntrega | null>(null)

const direccion = ref({
  destinatario: '',
  telefono: '',
  calle: '',
  colonia: '',
  ciudad: '',
  entidad_federativa: '',
  cp: '',
})

const cotizando = ref(false)
const errorCotizacion = ref<unknown>(null)
const opcionesCotizadas = ref<OpcionCotizada[]>([])
const paqueteriaSeleccionada = ref<OpcionCotizada | null>(null)

const creandoPedido = ref(false)
const errorPedido = ref<unknown>(null)
const nota = ref('')

const necesitaDireccion = computed(() =>
  opcionSeleccionada.value !== null && opcionSeleccionada.value.tipo !== 'recoger_taller',
)

const esEnvia = computed(() => opcionSeleccionada.value?.tipo === 'envia')

const costoEnvio = computed(() => {
  if (!opcionSeleccionada.value) return 0
  if (opcionSeleccionada.value.tipo === 'recoger_taller') return 0
  if (opcionSeleccionada.value.tipo === 'costo_fijo') return opcionSeleccionada.value.costo_fijo ?? 0
  return paqueteriaSeleccionada.value?.costo ?? 0
})

const total = computed(() => carrito.total + costoEnvio.value)

const formularioValido = computed(() => {
  if (!opcionSeleccionada.value) return false
  if (necesitaDireccion.value) {
    const d = direccion.value
    if (!d.destinatario || !d.telefono || !d.calle || !d.colonia || !d.ciudad || !d.entidad_federativa || !d.cp) {
      return false
    }
  }
  if (esEnvia.value && !paqueteriaSeleccionada.value) return false
  return true
})

const etiquetaEntrega: Record<string, string> = {
  recoger_taller: 'Recoger en taller',
  costo_fijo: 'Envío con costo fijo',
  envia: 'Envío por paquetería',
}

watch(opcionSeleccionada, () => {
  opcionesCotizadas.value = []
  paqueteriaSeleccionada.value = null
  errorCotizacion.value = null
})

onMounted(async () => {
  if (carrito.items.length === 0) {
    router.replace({ name: 'carrito' })
    return
  }
  try {
    opciones.value = await get<OpcionEntrega[]>(
      `/productores/${carrito.taller!.id}/opciones-entrega`,
    )
    if (opciones.value.length === 1) {
      opcionSeleccionada.value = opciones.value[0] ?? null
    }
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
})

async function cotizar() {
  if (!opcionSeleccionada.value || !direccion.value.cp) return
  cotizando.value = true
  errorCotizacion.value = null
  opcionesCotizadas.value = []
  paqueteriaSeleccionada.value = null
  try {
    const resp = await post<RespuestaCotizacion>('/envios/cotizar', {
      productor_id: carrito.taller!.id,
      cp_destino: direccion.value.cp,
      productos: carrito.items.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
      })),
    })
    opcionesCotizadas.value = resp.opciones
    if (resp.opciones.length === 1) {
      paqueteriaSeleccionada.value = resp.opciones[0] ?? null
    }
  } catch (err) {
    errorCotizacion.value = err
  } finally {
    cotizando.value = false
  }
}

async function confirmarPedido() {
  if (!opcionSeleccionada.value || creandoPedido.value) return
  creandoPedido.value = true
  errorPedido.value = null

  try {
    const cuerpo: Record<string, unknown> = {
      productor_id: carrito.taller!.id,
      productos: carrito.items.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
      })),
      opcion_entrega_id: opcionSeleccionada.value.id,
    }

    if (necesitaDireccion.value) {
      const envio: Record<string, string> = { ...direccion.value }
      if (esEnvia.value && paqueteriaSeleccionada.value) {
        envio.paqueteria = paqueteriaSeleccionada.value.paqueteria
        envio.servicio = paqueteriaSeleccionada.value.servicio
      }
      cuerpo.envio = envio
    }

    if (nota.value.trim()) {
      cuerpo.nota = nota.value.trim()
    }

    const pedido = await post<RespuestaPedido>('/pedidos', cuerpo)
    const pago = await post<RespuestaPago>(`/pedidos/${pedido.id}/pago`)

    carrito.vaciar()
    window.location.href = pago.checkout_url
  } catch (err) {
    errorPedido.value = err
    creandoPedido.value = false
  }
}
</script>

<template>
  <section class="checkout">
    <h1 class="checkout__titulo">Pagar</h1>

    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="error" :error="error" reintentable @reintentar="$router.go(0)" />

    <template v-else-if="carrito.items.length === 0">
      <p class="checkout__vacio">Tu carrito está vacío.</p>
      <BotonBase :to="{ name: 'catalogo' }">Ver productos</BotonBase>
    </template>

    <template v-else>
      <!-- Resumen del carrito -->
      <div class="checkout__seccion">
        <h2 class="checkout__subtitulo">Tu pedido</h2>
        <p class="checkout__taller">Taller: <strong>{{ carrito.taller?.nombre_taller }}</strong></p>
        <ul class="resumen-items">
          <li v-for="item in carrito.items" :key="item.producto_id" class="resumen-item">
            <span class="resumen-item__nombre">
              {{ item.nombre }} <span class="resumen-item__cantidad">&times;{{ item.cantidad }}</span>
            </span>
            <span class="resumen-item__precio">{{ formatearPrecio(item.precio * item.cantidad) }}</span>
          </li>
        </ul>
        <div class="resumen-linea">
          <span>Subtotal</span>
          <strong>{{ formatearPrecio(carrito.total) }}</strong>
        </div>
      </div>

      <!-- Opciones de entrega -->
      <div class="checkout__seccion">
        <h2 class="checkout__subtitulo">Entrega</h2>

        <div v-if="opciones.length === 0" class="checkout__vacio">
          Este taller no tiene opciones de entrega configuradas.
        </div>

        <div v-else class="opciones-entrega">
          <label
            v-for="opcion in opciones"
            :key="opcion.id"
            class="opcion-entrega"
            :class="{ 'opcion-entrega--activa': opcionSeleccionada?.id === opcion.id }"
          >
            <input
              type="radio"
              name="entrega"
              :value="opcion.id"
              :checked="opcionSeleccionada?.id === opcion.id"
              class="opcion-entrega__radio"
              @change="opcionSeleccionada = opcion"
            />
            <div class="opcion-entrega__info">
              <strong>{{ etiquetaEntrega[opcion.tipo] }}</strong>
              <span v-if="opcion.tipo === 'costo_fijo' && opcion.costo_fijo !== null" class="opcion-entrega__costo">
                {{ formatearPrecio(opcion.costo_fijo) }}
              </span>
              <span v-else-if="opcion.tipo === 'recoger_taller'" class="opcion-entrega__costo">
                Gratis
              </span>
              <span v-if="opcion.instrucciones" class="opcion-entrega__nota">
                {{ opcion.instrucciones }}
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Dirección de envío -->
      <div v-if="necesitaDireccion" class="checkout__seccion">
        <h2 class="checkout__subtitulo">Dirección de envío</h2>
        <div class="form-grid">
          <div class="campo">
            <label for="destinatario" class="campo__etiqueta">Destinatario</label>
            <input id="destinatario" v-model="direccion.destinatario" type="text" class="campo__input" />
          </div>
          <div class="campo">
            <label for="telefono" class="campo__etiqueta">Teléfono</label>
            <input id="telefono" v-model="direccion.telefono" type="tel" class="campo__input" />
          </div>
          <div class="campo campo--ancho">
            <label for="calle" class="campo__etiqueta">Calle y número</label>
            <input id="calle" v-model="direccion.calle" type="text" class="campo__input" />
          </div>
          <div class="campo">
            <label for="colonia" class="campo__etiqueta">Colonia</label>
            <input id="colonia" v-model="direccion.colonia" type="text" class="campo__input" />
          </div>
          <div class="campo">
            <label for="ciudad" class="campo__etiqueta">Ciudad</label>
            <input id="ciudad" v-model="direccion.ciudad" type="text" class="campo__input" />
          </div>
          <div class="campo">
            <label for="entidad" class="campo__etiqueta">Estado</label>
            <input id="entidad" v-model="direccion.entidad_federativa" type="text" class="campo__input" />
          </div>
          <div class="campo">
            <label for="cp" class="campo__etiqueta">Código postal</label>
            <input
              id="cp"
              v-model="direccion.cp"
              type="text"
              inputmode="numeric"
              maxlength="5"
              class="campo__input"
            />
          </div>
        </div>

        <!-- Cotizar envío por paquetería -->
        <div v-if="esEnvia" class="cotizacion">
          <BotonBase
            variante="secundario"
            :cargando="cotizando"
            :disabled="!direccion.cp || direccion.cp.length < 5"
            @click="cotizar"
          >
            Cotizar envío
          </BotonBase>

          <MensajeError v-if="errorCotizacion" :error="errorCotizacion" />

          <div v-if="opcionesCotizadas.length > 0" class="cotizacion__resultados">
            <label
              v-for="(opc, idx) in opcionesCotizadas"
              :key="idx"
              class="opcion-paqueteria"
              :class="{ 'opcion-paqueteria--activa': paqueteriaSeleccionada === opc }"
            >
              <input
                type="radio"
                name="paqueteria"
                :checked="paqueteriaSeleccionada === opc"
                class="opcion-entrega__radio"
                @change="paqueteriaSeleccionada = opc"
              />
              <div class="opcion-paqueteria__info">
                <strong>{{ opc.paqueteria }} &mdash; {{ opc.servicio }}</strong>
                <span class="opcion-paqueteria__detalle">
                  {{ formatearPrecio(opc.costo) }} &middot; {{ opc.dias }} {{ opc.dias === 1 ? 'día' : 'días' }}
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Nota -->
      <div class="checkout__seccion">
        <h2 class="checkout__subtitulo">Nota (opcional)</h2>
        <textarea
          v-model="nota"
          class="campo__input campo__textarea"
          rows="2"
          placeholder="Instrucciones especiales, envolver para regalo..."
        />
      </div>

      <!-- Total y confirmar -->
      <div class="checkout__seccion checkout__total-seccion">
        <div class="resumen-linea" v-if="costoEnvio > 0">
          <span>Envío</span>
          <span>{{ formatearPrecio(costoEnvio) }}</span>
        </div>
        <div class="resumen-linea resumen-linea--total">
          <span>Total</span>
          <strong>{{ formatearPrecio(total) }}</strong>
        </div>

        <MensajeError v-if="errorPedido" :error="errorPedido" />

        <BotonBase
          variante="comprar"
          grande
          :disabled="!formularioValido"
          :cargando="creandoPedido"
          @click="confirmarPedido"
        >
          Pagar con Mercado Pago
        </BotonBase>
      </div>
    </template>
  </section>
</template>

<style scoped>
.checkout {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

.checkout__titulo {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
  margin: 0 0 var(--space-5);
}

.checkout__subtitulo {
  font-family: var(--font-titulos);
  font-size: var(--texto-lg);
  margin: 0 0 var(--space-3);
}

.checkout__taller {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  margin: 0 0 var(--space-3);
}

.checkout__vacio {
  color: var(--color-texto-secundario);
  margin: 0 0 var(--space-4);
}

.checkout__seccion {
  padding-bottom: var(--space-5);
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-linea);
}

.checkout__seccion:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

/* Resumen items */
.resumen-items {
  list-style: none;
  margin: 0 0 var(--space-3);
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-3);
  font-size: var(--texto-sm);
}

.resumen-item__nombre {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resumen-item__cantidad {
  color: var(--color-texto-secundario);
}

.resumen-item__precio {
  flex-shrink: 0;
  font-weight: 600;
}

.resumen-linea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--texto-base);
}

.resumen-linea--total {
  font-size: var(--texto-lg);
  margin-top: var(--space-2);
}

.resumen-linea--total strong {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
}

/* Opciones de entrega */
.opciones-entrega {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.opcion-entrega {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  cursor: pointer;
  transition: border-color 0.15s;
}

.opcion-entrega--activa {
  border-color: var(--color-primario);
}

.opcion-entrega__radio {
  margin-top: 2px;
  accent-color: var(--color-primario);
}

.opcion-entrega__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--texto-sm);
}

.opcion-entrega__costo {
  font-weight: 600;
}

.opcion-entrega__nota {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

/* Formulario dirección */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  color: var(--color-texto);
}

.campo__input {
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  font-family: var(--font-texto);
  font-size: var(--texto-base);
  color: var(--color-texto);
  transition: border-color 0.15s;
}

.campo__input:focus {
  outline: none;
  border-color: var(--color-foco);
}

.campo__textarea {
  resize: vertical;
  min-height: 60px;
}

/* Cotización */
.cotizacion {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cotizacion__resultados {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.opcion-paqueteria {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  cursor: pointer;
  transition: border-color 0.15s;
}

.opcion-paqueteria--activa {
  border-color: var(--color-primario);
}

.opcion-paqueteria__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--texto-sm);
}

.opcion-paqueteria__detalle {
  color: var(--color-texto-secundario);
}

/* Total final */
.checkout__total-seccion {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.checkout__total-seccion .resumen-linea {
  width: 100%;
}

@media (max-width: 40rem) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
