<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get, patch } from '@/shared/api/cliente'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import { formatearPrecio } from '@/shared/utils/formato'
import NavegacionTaller from '../components/NavegacionTaller.vue'
import {
  ETIQUETA_ENTREGA,
  ETIQUETA_ESTADO_PAGO,
  ETIQUETA_ESTADO_PEDIDO,
  formatearFechaHora,
  type CambioEstadoPedido,
  type EstadoPedido,
  type PedidoEnvio,
  type PedidoTaller,
} from '../tipos'

type FiltroPedido = '' | EstadoPedido
type AccionPendiente = 'enviado' | 'entregado' | 'cancelado'

const FILTROS: { valor: FiltroPedido; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'pendiente_pago', etiqueta: 'Pendiente de pago' },
  { valor: 'pagado', etiqueta: 'Pagados' },
  { valor: 'enviado', etiqueta: 'Enviados' },
  { valor: 'entregado', etiqueta: 'Entregados' },
  { valor: 'cancelado', etiqueta: 'Cancelados' },
]

const cargando = ref(true)
const errorCarga = ref<unknown>(null)
const pedidos = ref<PedidoTaller[]>([])
const filtroEstado = ref<FiltroPedido>('')
const aviso = ref('')

const pedidoActivoId = ref<number | null>(null)
const accionActiva = ref<AccionPendiente | null>(null)
const guiaTexto = ref('')
const trackingUrlTexto = ref('')
const guardandoId = ref<number | null>(null)
const errorPedidoId = ref<number | null>(null)
const errorPedido = ref<unknown>(null)

function claseEstado(estado: EstadoPedido): string {
  if (estado === 'pagado' || estado === 'entregado') return 'insignia--destacada'
  if (estado === 'cancelado') return 'insignia--error'
  return 'insignia--neutra'
}

function direccionCompleta(envio: PedidoEnvio): string {
  return [envio.calle, envio.colonia, envio.ciudad, envio.entidad_federativa, envio.cp]
    .filter(Boolean)
    .join(', ')
}

function abrirAccion(pedidoId: number, accion: AccionPendiente) {
  pedidoActivoId.value = pedidoId
  accionActiva.value = accion
  guiaTexto.value = ''
  trackingUrlTexto.value = ''
  errorPedidoId.value = null
  errorPedido.value = null
}

function cerrarAccion() {
  pedidoActivoId.value = null
  accionActiva.value = null
  guiaTexto.value = ''
  trackingUrlTexto.value = ''
}

async function cargar() {
  cargando.value = true
  errorCarga.value = null
  cerrarAccion()
  try {
    pedidos.value = await get<PedidoTaller[]>(
      '/mi-taller/pedidos',
      filtroEstado.value ? { estado: filtroEstado.value } : undefined,
    )
  } catch (err) {
    errorCarga.value = err
  } finally {
    cargando.value = false
  }
}

function cambiarFiltro(valor: FiltroPedido) {
  if (filtroEstado.value === valor) return
  filtroEstado.value = valor
  aviso.value = ''
  void cargar()
}

async function confirmarCambioEstado(pedido: PedidoTaller) {
  if (!accionActiva.value || guardandoId.value !== null) return
  errorPedidoId.value = pedido.id
  errorPedido.value = null
  aviso.value = ''

  // La API solo permite enviar guia y tracking_url en la transición hacia 'enviado' (sin cadenas vacías)
  const cuerpo: CambioEstadoPedido = { estado: accionActiva.value }
  if (accionActiva.value === 'enviado') {
    const guia = guiaTexto.value.trim()
    const tracking = trackingUrlTexto.value.trim()
    if (guia) cuerpo.guia = guia
    if (tracking) cuerpo.tracking_url = tracking
  }

  guardandoId.value = pedido.id
  try {
    const actualizado = await patch<PedidoTaller>(`/mi-taller/pedidos/${pedido.id}`, cuerpo)
    if (filtroEstado.value && actualizado.estado !== filtroEstado.value) {
      pedidos.value = pedidos.value.filter((p) => p.id !== actualizado.id)
      aviso.value = `Pedido #${actualizado.id} actualizado a "${ETIQUETA_ESTADO_PEDIDO[actualizado.estado]}" y movido fuera de este filtro.`
    } else {
      pedidos.value = pedidos.value.map((p) => (p.id === actualizado.id ? actualizado : p))
      aviso.value = `Pedido #${actualizado.id} actualizado a "${ETIQUETA_ESTADO_PEDIDO[actualizado.estado]}".`
    }
    cerrarAccion()
  } catch (err) {
    errorPedido.value = err
  } finally {
    guardandoId.value = null
  }
}

onMounted(cargar)
</script>

<template>
  <section class="panel">
    <NavegacionTaller
      titulo="Ventas"
      subtitulo="Consulta los pedidos de tu taller, registra guías de envío y actualiza su estado."
    />

    <div class="filtros" role="group" aria-label="Filtrar pedidos por estado">
      <button
        v-for="filtro in FILTROS"
        :key="filtro.valor || 'todos'"
        type="button"
        class="filtro"
        :class="{ 'filtro--activo': filtroEstado === filtro.valor }"
        @click="cambiarFiltro(filtro.valor)"
      >
        {{ filtro.etiqueta }}
      </button>
    </div>

    <p v-if="aviso" class="aviso" role="status">{{ aviso }}</p>

    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="errorCarga" :error="errorCarga" reintentable @reintentar="cargar" />

    <div v-else-if="pedidos.length === 0" class="vacio">
      <p v-if="filtroEstado">No hay pedidos con este estado.</p>
      <p v-else>Aún no has recibido pedidos en tu taller.</p>
    </div>

    <ul v-else class="lista">
      <li v-for="pedido in pedidos" :key="pedido.id" class="tarjeta">
        <div class="tarjeta__cabecera">
          <div>
            <h2 class="tarjeta__id">Pedido #{{ pedido.id }}</h2>
            <p class="tarjeta__fecha">{{ formatearFechaHora(pedido.created_at) }}</p>
          </div>

          <div class="tarjeta__estados">
            <span class="insignia" :class="claseEstado(pedido.estado)">
              {{ ETIQUETA_ESTADO_PEDIDO[pedido.estado] }}
            </span>
            <span v-if="pedido.estado_pago" class="insignia insignia--neutra">
              {{ ETIQUETA_ESTADO_PAGO[pedido.estado_pago] }}
            </span>
          </div>
        </div>

        <div class="bloques">
          <div class="bloque">
            <h3>Comprador</h3>
            <p>{{ pedido.comprador.nombre }}</p>
            <p class="texto-secundario">{{ pedido.comprador.email }}</p>
            <p v-if="pedido.nota" class="nota">Nota: {{ pedido.nota }}</p>
          </div>

          <div class="bloque">
            <h3>Entrega</h3>
            <p>{{ ETIQUETA_ENTREGA[pedido.envio.tipo] }}</p>
            <p v-if="pedido.envio.paqueteria" class="texto-secundario">
              {{ pedido.envio.paqueteria }}
              <span v-if="pedido.envio.servicio">&middot; {{ pedido.envio.servicio }}</span>
            </p>
            <p v-if="pedido.envio.destinatario" class="texto-secundario">
              {{ pedido.envio.destinatario }}
              <span v-if="pedido.envio.telefono">&middot; {{ pedido.envio.telefono }}</span>
            </p>
            <p v-if="direccionCompleta(pedido.envio)" class="texto-secundario">
              {{ direccionCompleta(pedido.envio) }}
            </p>
            <p v-if="pedido.envio.guia" class="guia">
              Guía: <strong>{{ pedido.envio.guia }}</strong>
              <template v-if="pedido.envio.tracking_url">
                &middot;
                <a :href="pedido.envio.tracking_url" target="_blank" rel="noopener">Rastrear envío</a>
              </template>
            </p>
          </div>
        </div>

        <ul class="productos">
          <li v-for="item in pedido.productos" :key="item.producto_id" class="producto-fila">
            <div class="producto-fila__foto">
              <img v-if="item.imagen" :src="item.imagen" :alt="item.nombre_producto" />
              <span v-else class="producto-fila__sin-foto">—</span>
            </div>
            <div class="producto-fila__info">
              <strong>{{ item.nombre_producto }}</strong>
              <span>
                {{ item.cantidad }} &times; {{ formatearPrecio(item.precio_unitario) }}
              </span>
            </div>
            <span class="producto-fila__subtotal">{{ formatearPrecio(item.subtotal) }}</span>
          </li>
        </ul>

        <div class="resumen-montos">
          <span>Subtotal: {{ formatearPrecio(pedido.subtotal) }}</span>
          <span>Envío: {{ formatearPrecio(pedido.costo_envio) }}</span>
          <strong>Total: {{ formatearPrecio(pedido.total) }}</strong>
        </div>

        <MensajeError v-if="errorPedidoId === pedido.id && errorPedido" :error="errorPedido" />

        <form
          v-if="pedidoActivoId === pedido.id && accionActiva === 'enviado'"
          class="panel-accion"
          @submit.prevent="confirmarCambioEstado(pedido)"
        >
          <p class="panel-accion__titulo">Marcar pedido #{{ pedido.id }} como enviado</p>
          <div class="rejilla-envio">
            <div class="campo">
              <label :for="`guia_${pedido.id}`" class="campo__etiqueta">
                Número de guía (opcional)
              </label>
              <input
                :id="`guia_${pedido.id}`"
                v-model="guiaTexto"
                type="text"
                maxlength="60"
                placeholder="7701234567"
                class="campo__input"
              />
            </div>

            <div class="campo">
              <label :for="`tracking_${pedido.id}`" class="campo__etiqueta">
                Enlace de rastreo (opcional)
              </label>
              <input
                :id="`tracking_${pedido.id}`"
                v-model="trackingUrlTexto"
                type="url"
                placeholder="https://www.estafeta.com/rastreo"
                class="campo__input"
              />
            </div>
          </div>

          <div class="acciones">
            <BotonBase type="submit" variante="comprar" :cargando="guardandoId === pedido.id">
              Confirmar envío
            </BotonBase>
            <BotonBase
              variante="secundario"
              :disabled="guardandoId === pedido.id"
              @click="cerrarAccion"
            >
              Cancelar
            </BotonBase>
          </div>
        </form>

        <div
          v-else-if="
            pedidoActivoId === pedido.id &&
            (accionActiva === 'entregado' || accionActiva === 'cancelado')
          "
          class="panel-accion"
        >
          <p class="panel-accion__titulo">
            {{
              accionActiva === 'entregado'
                ? `¿Confirmas que el pedido #${pedido.id} ya fue entregado?`
                : `¿Cancelar el pedido #${pedido.id}?`
            }}
          </p>
          <p v-if="accionActiva === 'cancelado' && pedido.estado === 'pagado'" class="texto-secundario">
            El pedido ya estaba pagado; al cancelarlo se devolverá el stock a tus productos.
          </p>
          <div class="acciones">
            <BotonBase
              variante="comprar"
              :cargando="guardandoId === pedido.id"
              @click="confirmarCambioEstado(pedido)"
            >
              {{ accionActiva === 'entregado' ? 'Confirmar entrega' : 'Confirmar cancelación' }}
            </BotonBase>
            <BotonBase
              variante="secundario"
              :disabled="guardandoId === pedido.id"
              @click="cerrarAccion"
            >
              Volver
            </BotonBase>
          </div>
        </div>

        <!-- Transiciones válidas en backend: pendiente_pago→cancelado, pagado→enviado|cancelado, enviado→entregado -->
        <div
          v-else-if="
            pedido.estado === 'pagado' ||
            pedido.estado === 'pendiente_pago' ||
            pedido.estado === 'enviado'
          "
          class="acciones"
        >
          <BotonBase
            v-if="pedido.estado === 'pagado'"
            variante="comprar"
            @click="abrirAccion(pedido.id, 'enviado')"
          >
            Marcar como enviado
          </BotonBase>

          <BotonBase
            v-if="pedido.estado === 'enviado'"
            variante="comprar"
            @click="abrirAccion(pedido.id, 'entregado')"
          >
            Marcar como entregado
          </BotonBase>

          <BotonBase
            v-if="pedido.estado === 'pagado' || pedido.estado === 'pendiente_pago'"
            variante="secundario"
            @click="abrirAccion(pedido.id, 'cancelado')"
          >
            Cancelar pedido
          </BotonBase>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  max-width: var(--ancho-maximo);
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
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

.vacio {
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
  padding: var(--space-5);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.tarjeta__cabecera {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.tarjeta__id {
  font-size: var(--texto-lg);
}

.tarjeta__fecha {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.tarjeta__estados {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.insignia {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  font-size: var(--texto-xs);
  font-weight: 600;
}

.insignia--destacada {
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
}

.insignia--error {
  background: var(--color-error-fondo);
  color: var(--color-error);
}

.insignia--neutra {
  background: var(--color-suave);
  color: var(--color-texto-secundario);
}

.bloques {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
}

.bloque {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--texto-sm);
}

.bloque h3 {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.texto-secundario {
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.nota {
  margin-top: var(--space-1);
  font-style: italic;
}

.guia {
  margin-top: var(--space-1);
}

.productos {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.producto-fila {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-3);
}

.producto-fila__foto {
  width: var(--alto-control);
  height: var(--alto-control);
  overflow: hidden;
  border-radius: var(--radius-control);
  background: var(--color-suave);
}

.producto-fila__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-fila__sin-foto {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--color-texto-secundario);
}

.producto-fila__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-size: var(--texto-sm);
}

.producto-fila__info span {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.producto-fila__subtotal {
  font-family: var(--font-titulos);
  font-weight: 700;
}

.resumen-montos {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: baseline;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-linea);
  font-size: var(--texto-sm);
}

.resumen-montos strong {
  font-family: var(--font-titulos);
  font-size: var(--texto-lg);
}

.panel-accion {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
}

.panel-accion__titulo {
  font-weight: 600;
}

.rejilla-envio {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
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
  background: var(--color-superficie);
  font-size: var(--texto-base);
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (max-width: 40rem) {
  .tarjeta {
    padding: var(--space-4);
  }

  .bloques,
  .rejilla-envio {
    grid-template-columns: 1fr;
  }

  .resumen-montos {
    justify-content: space-between;
  }
}
</style>
