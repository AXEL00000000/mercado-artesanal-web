<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '@/shared/api/cliente'
import { formatearPrecio } from '@/shared/utils/formato'
import { useCarritoStore } from '@/stores/carrito'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'

interface ProductoPedido {
  producto_id: number
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  imagen: string | null
}

interface EnvioPedido {
  tipo: 'envia' | 'costo_fijo' | 'recoger_taller'
  opcion_entrega_id: number
  costo: number
  paqueteria: string | null
  servicio: string | null
  destinatario: string | null
  telefono: string | null
  calle: string | null
  colonia: string | null
  ciudad: string | null
  entidad_federativa: string | null
  cp: string | null
  guia: string | null
  tracking_url: string | null
  estado_envio: 'pendiente' | 'guia_generada' | 'en_transito' | 'entregado'
}

interface Pedido {
  id: number
  estado: 'pendiente_pago' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'
  estado_pago: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado' | null
  subtotal: number
  costo_envio: number
  total: number
  nota: string | null
  productor: { id: number; nombre_taller: string }
  comprador: { id: number; nombre: string; email: string }
  envio: EnvioPedido
  productos: ProductoPedido[]
  created_at: string
  updated_at: string
}

const props = defineProps<{ id: string }>()
const route = useRoute()
const carrito = useCarritoStore()

const cargando = ref(true)
const error = ref<unknown>(null)
const pedido = ref<Pedido | null>(null)

const pagoQuery = computed(() => {
  const valor = route.query.pago
  if (valor === 'aprobado' || valor === 'rechazado' || valor === 'pendiente') return valor
  return null
})

const etiquetaEstado: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const etiquetaEstadoPago: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  reembolsado: 'Reembolsado',
}

const etiquetaEntrega: Record<string, string> = {
  recoger_taller: 'Recoger en taller',
  costo_fijo: 'Envío con costo fijo',
  envia: 'Envío por paquetería',
}

const etiquetaEstadoEnvio: Record<string, string> = {
  pendiente: 'Pendiente',
  guia_generada: 'Guía generada',
  en_transito: 'En tránsito',
  entregado: 'Entregado',
}

function claseEstadoPago(valor: string): string {
  if (valor === 'aprobado') return 'badge--exito'
  if (valor === 'rechazado') return 'badge--error'
  return 'badge--neutro'
}

function claseEstadoPedido(valor: string): string {
  if (valor === 'entregado' || valor === 'pagado') return 'badge--exito'
  if (valor === 'cancelado') return 'badge--error'
  return 'badge--neutro'
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    pedido.value = await get<Pedido>(`/pedidos/${props.id}`)
    if (pagoQuery.value) {
      carrito.vaciar()
    }
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <section class="pedido-detalle">
    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="error" :error="error" reintentable @reintentar="cargar" />

    <template v-else-if="pedido">
      <!-- Banner de regreso de Mercado Pago -->
      <div v-if="pagoQuery === 'aprobado'" class="banner banner--exito">
        Tu pago fue aprobado. Gracias por tu compra.
      </div>
      <div v-else-if="pagoQuery === 'rechazado'" class="banner banner--error">
        El pago fue rechazado. Puedes intentar de nuevo.
      </div>
      <div v-else-if="pagoQuery === 'pendiente'" class="banner banner--pendiente">
        Tu pago está pendiente de confirmación. Te avisaremos cuando se apruebe.
      </div>

      <div class="pedido-detalle__cabecera">
        <h1 class="pedido-detalle__titulo">Pedido #{{ pedido.id }}</h1>
        <span class="pedido-detalle__fecha">{{ formatearFecha(pedido.created_at) }}</span>
      </div>

      <!-- Estados -->
      <div class="pedido-detalle__estados">
        <span class="badge" :class="claseEstadoPedido(pedido.estado)">
          {{ etiquetaEstado[pedido.estado] }}
        </span>
        <span v-if="pedido.estado_pago" class="badge" :class="claseEstadoPago(pedido.estado_pago)">
          Pago: {{ etiquetaEstadoPago[pedido.estado_pago] }}
        </span>
      </div>

      <!-- Reintentar pago -->
      <div v-if="pedido.estado === 'pendiente_pago'" class="pedido-detalle__accion-pago">
        <BotonBase variante="comprar" :to="{ name: 'checkout' }">
          Reintentar pago
        </BotonBase>
      </div>

      <!-- Taller -->
      <div class="seccion">
        <h2 class="seccion__titulo">Taller</h2>
        <p>{{ pedido.productor.nombre_taller }}</p>
      </div>

      <!-- Productos -->
      <div class="seccion">
        <h2 class="seccion__titulo">Productos</h2>
        <ul class="productos">
          <li v-for="item in pedido.productos" :key="item.producto_id" class="producto-item">
            <div class="producto-item__img-contenedor">
              <img v-if="item.imagen" :src="item.imagen" :alt="item.nombre_producto" class="producto-item__img" />
              <div v-else class="producto-item__sin-img">Sin foto</div>
            </div>
            <div class="producto-item__info">
              <span class="producto-item__nombre">{{ item.nombre_producto }}</span>
              <span class="producto-item__detalle">
                {{ formatearPrecio(item.precio_unitario) }} &times; {{ item.cantidad }}
              </span>
            </div>
            <span class="producto-item__subtotal">{{ formatearPrecio(item.subtotal) }}</span>
          </li>
        </ul>
      </div>

      <!-- Entrega -->
      <div class="seccion">
        <h2 class="seccion__titulo">Entrega</h2>
        <p class="seccion__tipo">{{ etiquetaEntrega[pedido.envio.tipo] }}</p>

        <div v-if="pedido.envio.tipo !== 'recoger_taller' && pedido.envio.destinatario" class="direccion">
          <p>{{ pedido.envio.destinatario }}</p>
          <p>{{ pedido.envio.calle }}</p>
          <p>{{ pedido.envio.colonia }}, {{ pedido.envio.ciudad }}</p>
          <p>{{ pedido.envio.entidad_federativa }} {{ pedido.envio.cp }}</p>
          <p v-if="pedido.envio.telefono">Tel: {{ pedido.envio.telefono }}</p>
        </div>

        <div v-if="pedido.envio.paqueteria" class="envio-info">
          <p>{{ pedido.envio.paqueteria }} &mdash; {{ pedido.envio.servicio }}</p>
          <p v-if="pedido.envio.guia">
            Guía: {{ pedido.envio.guia }}
            <a
              v-if="pedido.envio.tracking_url"
              :href="pedido.envio.tracking_url"
              target="_blank"
              rel="noopener"
              class="enlace-tracking"
            >Rastrear</a>
          </p>
        </div>

        <span class="badge" :class="pedido.envio.estado_envio === 'entregado' ? 'badge--exito' : 'badge--neutro'">
          {{ etiquetaEstadoEnvio[pedido.envio.estado_envio] }}
        </span>
      </div>

      <!-- Nota -->
      <div v-if="pedido.nota" class="seccion">
        <h2 class="seccion__titulo">Nota</h2>
        <p class="seccion__nota">{{ pedido.nota }}</p>
      </div>

      <!-- Totales -->
      <div class="seccion seccion--totales">
        <div class="linea-total">
          <span>Subtotal</span>
          <span>{{ formatearPrecio(pedido.subtotal) }}</span>
        </div>
        <div v-if="pedido.costo_envio > 0" class="linea-total">
          <span>Envío</span>
          <span>{{ formatearPrecio(pedido.costo_envio) }}</span>
        </div>
        <div class="linea-total linea-total--final">
          <span>Total</span>
          <strong>{{ formatearPrecio(pedido.total) }}</strong>
        </div>
      </div>

      <div class="pedido-detalle__volver">
        <BotonBase variante="secundario" :to="{ name: 'pedidos' }">
          Ver mis compras
        </BotonBase>
      </div>
    </template>
  </section>
</template>

<style scoped>
.pedido-detalle {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

/* Banners de pago */
.banner {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-control);
  font-weight: 600;
  font-size: var(--texto-sm);
  margin-bottom: var(--space-5);
}

.banner--exito {
  background: #e6f4ea;
  color: var(--color-whatsapp);
}

.banner--error {
  background: var(--color-error-fondo);
  color: var(--color-error);
}

.banner--pendiente {
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
}

/* Cabecera */
.pedido-detalle__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.pedido-detalle__titulo {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
  margin: 0;
}

.pedido-detalle__fecha {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

/* Estados */
.pedido-detalle__estados {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  font-size: var(--texto-xs);
  font-weight: 600;
}

.badge--exito {
  background: #e6f4ea;
  color: var(--color-whatsapp);
}

.badge--error {
  background: var(--color-error-fondo);
  color: var(--color-error);
}

.badge--neutro {
  background: var(--color-suave);
  color: var(--color-texto-secundario);
}

.pedido-detalle__accion-pago {
  margin-bottom: var(--space-5);
}

/* Secciones */
.seccion {
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-linea);
}

.seccion:last-of-type {
  border-bottom: none;
}

.seccion__titulo {
  font-family: var(--font-titulos);
  font-size: var(--texto-lg);
  margin: 0 0 var(--space-2);
}

.seccion__tipo {
  font-weight: 600;
  margin: 0 0 var(--space-2);
}

.seccion__nota {
  color: var(--color-texto-secundario);
  font-style: italic;
  margin: 0;
}

.seccion p {
  margin: 0 0 var(--space-1);
}

/* Productos */
.productos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.producto-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.producto-item__img-contenedor {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-foto);
  overflow: hidden;
  flex-shrink: 0;
}

.producto-item__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.producto-item__sin-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-suave);
  color: var(--color-texto-secundario);
  font-size: var(--texto-2xs);
}

.producto-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.producto-item__nombre {
  font-weight: 600;
  font-size: var(--texto-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.producto-item__detalle {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
}

.producto-item__subtotal {
  font-family: var(--font-titulos);
  font-weight: 700;
  font-size: var(--texto-sm);
  flex-shrink: 0;
}

/* Dirección y envío */
.direccion {
  font-size: var(--texto-sm);
  margin-bottom: var(--space-3);
}

.envio-info {
  font-size: var(--texto-sm);
  margin-bottom: var(--space-3);
}

.enlace-tracking {
  color: var(--color-primario);
  text-decoration: underline;
  margin-left: var(--space-2);
}

/* Totales */
.seccion--totales {
  border-bottom: none;
}

.linea-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--texto-base);
  padding: var(--space-1) 0;
}

.linea-total--final {
  font-size: var(--texto-lg);
  margin-top: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-linea);
}

.linea-total--final strong {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
}

.pedido-detalle__volver {
  margin-top: var(--space-5);
  text-align: center;
}
</style>
