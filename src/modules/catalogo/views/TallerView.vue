<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { get } from '@/shared/api/cliente'
import type { ProductoTarjeta, Taller } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import TarjetaProducto from '@/shared/components/TarjetaProducto.vue'

interface TallerDetalleConProductos extends Taller {
  productos?: ProductoTarjeta[]
}

const props = defineProps<{ id?: string | number }>()
const route = useRoute()

const cargando = ref(true)
const error = ref<unknown>(null)
const taller = ref<TallerDetalleConProductos | null>(null)

const productosTaller = computed(() => taller.value?.productos ?? [])
const totalPiezas = computed(
  () => taller.value?.productos?.length ?? taller.value?.total_productos ?? 0,
)
const biografiaTaller = computed(() => taller.value?.biografia ?? null)

async function cargarTaller() {
  cargando.value = true
  error.value = null

  const tallerId = props.id || route.params.id
  try {
    const datos = await get<TallerDetalleConProductos>(`/productores/${tallerId}`)
    taller.value = datos
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

watch(
  () => props.id,
  () => {
    void cargarTaller()
  },
)

onMounted(() => {
  void cargarTaller()
})
</script>

<template>
  <div class="taller-vista contenedor">
    <!-- Navegación de retorno -->
    <nav class="taller-vista__volver" aria-label="Miga de pan">
      <RouterLink :to="{ name: 'catalogo' }" class="taller-vista__enlace-volver">
        ← Volver al catálogo
      </RouterLink>
    </nav>

    <!-- Estados -->
    <EstadoCarga v-if="cargando" texto="Cargando perfil del taller…" />

    <MensajeError
      v-else-if="error"
      :error="error"
      reintentable
      @reintentar="cargarTaller"
    />

    <div v-else-if="taller" class="taller-vista__contenido">
      <!-- Encabezado editorial del taller -->
      <header class="taller-header">
        <div class="taller-header__portada">
          <div class="taller-header__avatar">
            <img
              v-if="taller.foto_url"
              :src="taller.foto_url"
              :alt="taller.artesano"
              class="taller-header__avatar-img"
            />
            <span v-else class="taller-header__avatar-inicial">
              {{ taller.artesano.charAt(0) }}
            </span>
          </div>

          <div class="taller-header__datos">
            <span class="taller-header__comunidad">
              {{ taller.comunidad.nombre }}, {{ taller.comunidad.region }}
            </span>
            <h1 class="taller-header__nombre">{{ taller.nombre_taller }}</h1>
            <p class="taller-header__artesano">Taller de {{ taller.artesano }}</p>

            <div v-if="taller.whatsapp" class="taller-header__contacto">
              <BotonBase
                variante="whatsapp"
                :href="`https://wa.me/${taller.whatsapp}?text=${encodeURIComponent('Hola, me interesa conocer más sobre su trabajo artesanal.')}`"
              >
                Contactar por WhatsApp
              </BotonBase>
            </div>
          </div>
        </div>
      </header>

      <!-- Biografía e historia -->
      <section v-if="biografiaTaller" class="taller-historia" aria-label="Historia del taller">
        <h2 class="taller-historia__titulo">Tradición e Historia</h2>
        <p class="taller-historia__texto">{{ biografiaTaller }}</p>
      </section>

      <!-- Catálogo de piezas del taller -->
      <section class="taller-piezas" aria-label="Piezas elaboradas por este taller">
        <div class="taller-piezas__cabecera">
          <h2 class="taller-piezas__titulo">Piezas de este taller</h2>
          <span class="taller-piezas__conteo">{{ totalPiezas }} piezas activas</span>
        </div>

        <!-- Estado vacío si no tiene piezas -->
        <div v-if="productosTaller.length === 0" class="taller-piezas__vacio">
          <p>Este taller no tiene piezas publicadas por el momento.</p>
        </div>

        <!-- Cuadrícula de piezas -->
        <div v-else class="taller-piezas__grid">
          <TarjetaProducto
            v-for="producto in productosTaller"
            :key="producto.id"
            :producto="producto"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.taller-vista {
  padding-block: var(--space-5) var(--space-7);
}

.taller-vista__volver {
  margin-bottom: var(--space-5);
}

.taller-vista__enlace-volver {
  display: inline-flex;
  align-items: center;
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  text-decoration: none;
  font-weight: 500;
}

.taller-vista__enlace-volver:hover {
  color: var(--color-primario);
}

.taller-vista__contenido {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Header */
.taller-header {
  border-radius: var(--radius-foto);
  background: var(--color-suave);
  border: 1px solid var(--color-linea);
  padding: var(--space-6);
}

.taller-header__portada {
  display: flex;
  gap: var(--space-5);
  align-items: center;
}

.taller-header__avatar {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-pildora);
  overflow: hidden;
  background: var(--color-etiqueta-fondo);
  border: 2px solid var(--color-linea);
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.taller-header__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.taller-header__avatar-inicial {
  font-family: var(--font-titulos);
  font-size: var(--texto-3xl);
  font-weight: 700;
  color: var(--color-etiqueta-texto);
}

.taller-header__datos {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.taller-header__comunidad {
  font-size: var(--texto-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: var(--color-primario);
}

.taller-header__nombre {
  font-size: var(--texto-3xl);
  line-height: 1.1;
  color: var(--color-texto);
}

.taller-header__artesano {
  font-size: var(--texto-base);
  color: var(--color-texto-secundario);
}

.taller-header__contacto {
  margin-top: var(--space-3);
}

/* Historia */
.taller-historia {
  padding: var(--space-5);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
}

.taller-historia__titulo {
  font-size: var(--texto-lg);
  margin-bottom: var(--space-2);
  color: var(--color-texto);
}

.taller-historia__texto {
  font-size: var(--texto-base);
  color: var(--color-texto-secundario);
  line-height: 1.6;
}

/* Piezas */
.taller-piezas__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-4);
}

.taller-piezas__titulo {
  font-size: var(--texto-xl);
  color: var(--color-texto);
}

.taller-piezas__conteo {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

.taller-piezas__vacio {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-texto-secundario);
  background: var(--color-superficie);
  border-radius: var(--radius-control);
  border: 1px solid var(--color-linea);
}

.taller-piezas__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5);
}

@media (max-width: 40rem) {
  .taller-header {
    padding: var(--space-4);
  }

  .taller-header__portada {
    flex-direction: column;
    text-align: center;
    gap: var(--space-3);
  }

  .taller-header__nombre {
    font-size: var(--texto-2xl);
  }

  .taller-piezas__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }
}
</style>
