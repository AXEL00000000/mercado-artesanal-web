<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { get } from '@/shared/api/cliente'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import LayoutPanel from '@/shared/components/LayoutPanel.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import { useSesionStore } from '@/stores/sesion'
import {
  ETIQUETA_ORIGEN_CONSULTA,
  formatearFechaHora,
  pestanasArtesano,
  type RespuestaConsultasTaller,
} from '../tipos'

const sesion = useSesionStore()
const pestanas = computed(() => pestanasArtesano(sesion.tieneTaller))

const cargando = ref(true)
const errorCarga = ref<unknown>(null)
const datos = ref<RespuestaConsultasTaller>({
  total: 0,
  por_producto: [],
  consultas: [],
})
const productoFiltroId = ref<number | null>(null)

const productoSeleccionado = computed(() =>
  datos.value.por_producto.find((p) => p.producto_id === productoFiltroId.value) ?? null,
)

async function cargar() {
  cargando.value = true
  errorCarga.value = null
  try {
    // El filtro producto_id solo filtra 'consultas'; 'total' y 'por_producto' mantienen el resumen global
    datos.value = await get<RespuestaConsultasTaller>(
      '/mi-taller/consultas',
      productoFiltroId.value !== null ? { producto_id: productoFiltroId.value } : undefined,
    )
  } catch (err) {
    errorCarga.value = err
  } finally {
    cargando.value = false
  }
}

function seleccionarProducto(productoId: number | null) {
  const nuevo = productoFiltroId.value === productoId ? null : productoId
  productoFiltroId.value = nuevo
  void cargar()
}

onMounted(cargar)
</script>

<template>
  <LayoutPanel
    antetitulo="Panel del artesano"
    titulo="Consultas"
    descripcion="Revisa cuántas personas han consultado tus piezas por WhatsApp."
    :pestanas="pestanas"
    etiqueta-pestanas="Secciones del taller"
  >

    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="errorCarga" :error="errorCarga" reintentable @reintentar="cargar" />

    <div v-else-if="datos.total === 0" class="vacio">
      <p>Aún no has recibido consultas por WhatsApp en tus productos.</p>
    </div>

    <div v-else class="contenido-consultas">
      <div class="resumen-total">
        <span class="resumen-total__numero">{{ datos.total }}</span>
        <div>
          <h2>{{ datos.total === 1 ? 'Consulta recibida' : 'Consultas recibidas' }}</h2>
          <p>Incluye solicitudes de precio a tratar y dudas desde productos de precio fijo.</p>
        </div>
      </div>

      <section aria-labelledby="resumen-por-producto" class="bloque">
        <div class="bloque__cabecera">
          <h2 id="resumen-por-producto">Por producto</h2>
          <BotonBase
            v-if="productoFiltroId !== null"
            variante="secundario"
            @click="seleccionarProducto(null)"
          >
            Ver todos
          </BotonBase>
        </div>

        <ul class="productos">
          <li v-for="item in datos.por_producto" :key="item.producto_id">
            <button
              type="button"
              class="producto-tarjeta"
              :class="{ 'producto-tarjeta--activo': productoFiltroId === item.producto_id }"
              @click="seleccionarProducto(item.producto_id)"
            >
              <div class="producto-tarjeta__cabecera">
                <strong>{{ item.nombre }}</strong>
                <span class="conteo">{{ item.total }}</span>
              </div>
              <p class="producto-tarjeta__desglose">
                {{ item.boton_tratar }} a tratar &middot; {{ item.link_dudas }} dudas
              </p>
              <p v-if="item.ultima" class="producto-tarjeta__fecha">
                Última: {{ formatearFechaHora(item.ultima) }}
              </p>
            </button>
          </li>
        </ul>
      </section>

      <section aria-labelledby="consultas-recientes" class="bloque">
        <div class="bloque__cabecera">
          <h2 id="consultas-recientes">
            {{
              productoSeleccionado
                ? `Consultas de ${productoSeleccionado.nombre}`
                : 'Consultas recientes'
            }}
          </h2>
        </div>

        <p v-if="datos.consultas.length === 0" class="vacio-lista">
          No hay consultas recientes para este filtro.
        </p>

        <ul v-else class="lista-consultas">
          <li v-for="consulta in datos.consultas" :key="consulta.id" class="consulta">
            <div class="consulta__info">
              <strong>{{ consulta.producto.nombre }}</strong>
              <p class="consulta__meta">
                <!-- usuario llega null si quien consultó por WhatsApp no había iniciado sesión -->
                {{ consulta.usuario ? consulta.usuario.nombre : 'Visitante sin cuenta' }}
                &middot; Canal: {{ consulta.canal === 'web' ? 'Web' : 'App' }}
              </p>
            </div>

            <div class="consulta__derecha">
              <span class="insignia">{{ ETIQUETA_ORIGEN_CONSULTA[consulta.origen] }}</span>
              <span class="consulta__fecha">{{ formatearFechaHora(consulta.created_at) }}</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </LayoutPanel>
</template>

<style scoped>
.vacio,
.vacio-lista {
  padding: var(--space-7) var(--space-4);
  border: var(--borde-fino) dashed var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  text-align: center;
}

.contenido-consultas {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.resumen-total {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.resumen-total__numero {
  display: grid;
  place-items: center;
  min-width: var(--space-7);
  height: var(--space-7);
  padding-inline: var(--space-3);
  border-radius: var(--radius-control);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-family: var(--font-titulos);
  font-size: var(--texto-2xl);
  font-weight: 700;
}

.resumen-total p {
  margin-top: var(--space-1);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.bloque {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bloque__cabecera {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}

.productos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

.producto-tarjeta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--duracion-rapida);
}

.producto-tarjeta:hover,
.producto-tarjeta--activo {
  border-color: var(--color-primario);
  background: var(--color-suave);
}

.producto-tarjeta__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-2);
}

.conteo {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-family: var(--font-titulos);
  font-size: var(--texto-xs);
  font-weight: 700;
}

.producto-tarjeta__desglose,
.producto-tarjeta__fecha {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.lista-consultas {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
}

.consulta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.consulta__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.consulta__meta,
.consulta__fecha {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.consulta__derecha {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.insignia {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-xs);
  font-weight: 600;
}

@media (max-width: 40rem) {
  .resumen-total {
    flex-direction: column;
    align-items: flex-start;
  }

  .consulta__derecha {
    align-items: flex-start;
  }
}
</style>
