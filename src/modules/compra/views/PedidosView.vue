<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '@/shared/api/cliente'
import { formatearPrecio } from '@/shared/utils/formato'
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

interface PedidoResumen {
  id: number
  estado: 'pendiente_pago' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'
  estado_pago: 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado' | null
  total: number
  productor: { id: number; nombre_taller: string }
  productos: ProductoPedido[]
  created_at: string
}

const cargando = ref(true)
const error = ref<unknown>(null)
const pedidos = ref<PedidoResumen[]>([])

const etiquetaEstado: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

function claseEstado(valor: string): string {
  if (valor === 'entregado' || valor === 'pagado') return 'badge--exito'
  if (valor === 'cancelado') return 'badge--error'
  return 'badge--neutro'
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function totalProductos(productos: ProductoPedido[]): number {
  return productos.reduce((sum, p) => sum + p.cantidad, 0)
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    pedidos.value = await get<PedidoResumen[]>('/pedidos')
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <section class="pedidos">
    <h1 class="pedidos__titulo">Mis compras</h1>

    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="error" :error="error" reintentable @reintentar="cargar" />

    <div v-else-if="pedidos.length === 0" class="pedidos__vacio">
      <p>Aún no tienes compras.</p>
      <BotonBase :to="{ name: 'catalogo' }">Ver productos</BotonBase>
    </div>

    <ul v-else class="pedidos__lista">
      <li v-for="pedido in pedidos" :key="pedido.id" class="tarjeta-pedido">
        <router-link :to="{ name: 'pedido', params: { id: pedido.id } }" class="tarjeta-pedido__enlace">
          <div class="tarjeta-pedido__cabecera">
            <span class="tarjeta-pedido__id">Pedido #{{ pedido.id }}</span>
            <span class="badge" :class="claseEstado(pedido.estado)">
              {{ etiquetaEstado[pedido.estado] }}
            </span>
          </div>

          <div class="tarjeta-pedido__cuerpo">
            <div class="tarjeta-pedido__imagenes">
              <div
                v-for="item in pedido.productos.slice(0, 3)"
                :key="item.producto_id"
                class="tarjeta-pedido__miniatura"
              >
                <img v-if="item.imagen" :src="item.imagen" :alt="item.nombre_producto" />
                <span v-else class="tarjeta-pedido__sin-img">?</span>
              </div>
              <div v-if="pedido.productos.length > 3" class="tarjeta-pedido__miniatura tarjeta-pedido__mas">
                +{{ pedido.productos.length - 3 }}
              </div>
            </div>

            <div class="tarjeta-pedido__info">
              <span class="tarjeta-pedido__taller">{{ pedido.productor.nombre_taller }}</span>
              <span class="tarjeta-pedido__detalle">
                {{ totalProductos(pedido.productos) }}
                {{ totalProductos(pedido.productos) === 1 ? 'producto' : 'productos' }}
                &middot; {{ formatearFecha(pedido.created_at) }}
              </span>
            </div>

            <span class="tarjeta-pedido__total">{{ formatearPrecio(pedido.total) }}</span>
          </div>
        </router-link>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pedidos {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

.pedidos__titulo {
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
  margin: 0 0 var(--space-5);
}

.pedidos__vacio {
  text-align: center;
  padding: var(--space-7) 0;
  color: var(--color-texto-secundario);
}

.pedidos__vacio p {
  font-size: var(--texto-lg);
  margin: 0 0 var(--space-5);
}

/* Lista */
.pedidos__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Tarjeta pedido */
.tarjeta-pedido {
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  transition: border-color 0.15s;
}

.tarjeta-pedido:hover {
  border-color: var(--color-primario);
}

.tarjeta-pedido__enlace {
  display: block;
  padding: var(--space-4);
  text-decoration: none;
  color: var(--color-texto);
}

.tarjeta-pedido__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.tarjeta-pedido__id {
  font-family: var(--font-titulos);
  font-weight: 700;
  font-size: var(--texto-base);
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

.tarjeta-pedido__cuerpo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* Miniaturas de producto */
.tarjeta-pedido__imagenes {
  display: flex;
  gap: var(--space-1);
  flex-shrink: 0;
}

.tarjeta-pedido__miniatura {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-foto);
  overflow: hidden;
  background: var(--color-suave);
}

.tarjeta-pedido__miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tarjeta-pedido__sin-img {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.tarjeta-pedido__mas {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--texto-xs);
  font-weight: 600;
  color: var(--color-texto-secundario);
}

.tarjeta-pedido__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.tarjeta-pedido__taller {
  font-weight: 600;
  font-size: var(--texto-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tarjeta-pedido__detalle {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
}

.tarjeta-pedido__total {
  font-family: var(--font-titulos);
  font-weight: 700;
  font-size: var(--texto-base);
  flex-shrink: 0;
}

@media (max-width: 40rem) {
  .tarjeta-pedido__imagenes {
    display: none;
  }
}
</style>
