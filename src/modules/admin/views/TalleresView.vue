<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { get, patch } from '@/shared/api/cliente'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'

interface ArtesanoContacto {
  id: number
  nombre: string
  email: string
  telefono: string | null
}

interface TallerAdmin {
  id: number
  nombre_taller: string
  artesano: ArtesanoContacto | string
  estado_verificacion: 'pendiente' | 'aprobado' | 'rechazado'
  biografia: string | null
  foto_url: string | null
  whatsapp: string
  comunidad: {
    id: number
    nombre: string
    municipio?: string
    region: string
  }
  total_productos: number
  created_at?: string
}

const cargando = ref(true)
const error = ref<unknown>(null)
const talleres = ref<TallerAdmin[]>([])
const filtroEstado = ref<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')
const procesandoId = ref<number | null>(null)
const mensajeAccion = ref<string | null>(null)

function nombreArtesano(taller: TallerAdmin): string {
  if (typeof taller.artesano === 'object' && taller.artesano !== null) {
    return taller.artesano.nombre
  }
  return String(taller.artesano ?? 'Artesano')
}

function emailArtesano(taller: TallerAdmin): string | null {
  if (typeof taller.artesano === 'object' && taller.artesano !== null) {
    return taller.artesano.email
  }
  return null
}

function telefonoArtesano(taller: TallerAdmin): string | null {
  if (typeof taller.artesano === 'object' && taller.artesano !== null) {
    return taller.artesano.telefono
  }
  return taller.whatsapp ?? null
}

async function cargarTalleres() {
  cargando.value = true
  error.value = null
  mensajeAccion.value = null

  try {
    const datos = await get<TallerAdmin[]>('/admin/productores', {
      estado: filtroEstado.value,
    })
    talleres.value = datos
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

async function cambiarEstadoTaller(id: number, nuevoEstado: 'aprobado' | 'rechazado') {
  procesandoId.value = id
  mensajeAccion.value = null

  try {
    await patch(`/admin/productores/${id}`, { estado: nuevoEstado })
    mensajeAccion.value = `Taller ${nuevoEstado === 'aprobado' ? 'aprobado' : 'rechazado'} correctamente.`
    await cargarTalleres()
  } catch (err) {
    error.value = err
  } finally {
    procesandoId.value = null
  }
}

onMounted(() => {
  void cargarTalleres()
})
</script>

<template>
  <div class="admin-talleres contenedor">
    <header class="admin-talleres__cabecera">
      <div class="admin-talleres__titular">
        <h1 class="admin-talleres__titulo">Revisión de Talleres</h1>
        <p class="admin-talleres__subtitulo">
          Verifica y aprueba los talleres artesanales registrados para que aparezcan en el
          catálogo público.
        </p>
      </div>

      <!-- Selector de estado -->
      <div class="admin-talleres__pestanas" role="tablist" aria-label="Filtrar por estado">
        <button
          type="button"
          class="admin-talleres__pestana"
          :class="{ 'admin-talleres__pestana--activa': filtroEstado === 'pendiente' }"
          @click="
            () => {
              filtroEstado = 'pendiente'
              void cargarTalleres()
            }
          "
        >
          Pendientes
        </button>
        <button
          type="button"
          class="admin-talleres__pestana"
          :class="{ 'admin-talleres__pestana--activa': filtroEstado === 'aprobado' }"
          @click="
            () => {
              filtroEstado = 'aprobado'
              void cargarTalleres()
            }
          "
        >
          Aprobados
        </button>
        <button
          type="button"
          class="admin-talleres__pestana"
          :class="{ 'admin-talleres__pestana--activa': filtroEstado === 'rechazado' }"
          @click="
            () => {
              filtroEstado = 'rechazado'
              void cargarTalleres()
            }
          "
        >
          Rechazados
        </button>
      </div>
    </header>

    <!-- Notificación de acción -->
    <div v-if="mensajeAccion" class="admin-talleres__alerta" role="status">
      {{ mensajeAccion }}
    </div>

    <!-- Estados -->
    <EstadoCarga v-if="cargando" texto="Cargando solicitudes de talleres…" />

    <MensajeError
      v-else-if="error"
      :error="error"
      reintentable
      @reintentar="cargarTalleres"
    />

    <!-- Estado vacío -->
    <div v-else-if="talleres.length === 0" class="admin-talleres__vacio">
      <div class="admin-talleres__vacio-tarjeta">
        <h2 class="admin-talleres__vacio-titulo">
          No hay talleres en estado "{{ filtroEstado }}"
        </h2>
        <p class="admin-talleres__vacio-texto">
          {{
            filtroEstado === 'pendiente'
              ? 'Todas las solicitudes han sido atendidas.'
              : 'No se encontraron registros con este filtro.'
          }}
        </p>
      </div>
    </div>

    <!-- Lista de talleres -->
    <div v-else class="admin-talleres__lista">
      <article
        v-for="taller in talleres"
        :key="taller.id"
        class="taller-card"
      >
        <div class="taller-card__principal">
          <div class="taller-card__avatar">
            <img
              v-if="taller.foto_url"
              :src="taller.foto_url"
              :alt="nombreArtesano(taller)"
            />
            <span v-else class="taller-card__avatar-letra">
              {{ taller.nombre_taller.charAt(0) }}
            </span>
          </div>

          <div class="taller-card__info">
            <div class="taller-card__meta">
              <span class="taller-card__comunidad">
                {{ taller.comunidad.nombre }} · {{ taller.comunidad.region }}
              </span>
              <span
                class="taller-card__badge"
                :class="`taller-card__badge--${taller.estado_verificacion}`"
              >
                {{ taller.estado_verificacion }}
              </span>
            </div>

            <h2 class="taller-card__nombre">{{ taller.nombre_taller }}</h2>
            <p class="taller-card__artesano">
              Artesano(a): <strong>{{ nombreArtesano(taller) }}</strong>
            </p>

            <p v-if="taller.biografia" class="taller-card__bio">
              {{ taller.biografia }}
            </p>

            <div class="taller-card__contacto">
              <span v-if="emailArtesano(taller)">
                Email: <strong>{{ emailArtesano(taller) }}</strong>
              </span>
              <span v-if="telefonoArtesano(taller)">
                Teléfono: <strong>{{ telefonoArtesano(taller) }}</strong>
              </span>
              <span>
                Piezas registradas: <strong>{{ taller.total_productos }}</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Acciones: Aprobar / Rechazar -->
        <div class="taller-card__acciones">
          <BotonBase
            v-if="taller.estado_verificacion !== 'aprobado'"
            variante="comprar"
            :disabled="procesandoId === taller.id"
            :cargando="procesandoId === taller.id"
            @click="cambiarEstadoTaller(taller.id, 'aprobado')"
          >
            Aprobar taller
          </BotonBase>

          <BotonBase
            v-if="taller.estado_verificacion !== 'rechazado'"
            variante="secundario"
            :disabled="procesandoId === taller.id"
            @click="cambiarEstadoTaller(taller.id, 'rechazado')"
          >
            Rechazar
          </BotonBase>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.admin-talleres {
  padding-block: var(--space-6);
}

.admin-talleres__cabecera {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-5);
  gap: var(--space-4);
  flex-wrap: wrap;
}

.admin-talleres__titular {
  max-width: 580px;
}

.admin-talleres__titulo {
  font-size: var(--texto-2xl);
  color: var(--color-texto);
  margin-bottom: var(--space-1);
}

.admin-talleres__subtitulo {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

.admin-talleres__pestanas {
  display: flex;
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-pildora);
  padding: var(--space-1);
}

.admin-talleres__pestana {
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-pildora);
  background: transparent;
  font-size: var(--texto-sm);
  font-weight: 600;
  color: var(--color-texto-secundario);
  cursor: pointer;
}

.admin-talleres__pestana--activa {
  background: var(--color-fondo);
  color: var(--color-texto);
  box-shadow: var(--sombra-suave);
}

.admin-talleres__alerta {
  padding: var(--space-3) var(--space-4);
  background: var(--color-suave);
  color: var(--color-whatsapp);
  border: 1px solid var(--color-whatsapp);
  border-radius: var(--radius-control);
  margin-bottom: var(--space-4);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.admin-talleres__vacio {
  padding: var(--space-7) var(--space-4);
  text-align: center;
}

.admin-talleres__vacio-tarjeta {
  max-width: 440px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.admin-talleres__vacio-titulo {
  font-size: var(--texto-xl);
  color: var(--color-texto);
}

.admin-talleres__vacio-texto {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
}

.admin-talleres__lista {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.taller-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-5);
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
}

.taller-card__principal {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  flex: 1;
}

.taller-card__avatar {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-control);
  overflow: hidden;
  background: var(--color-etiqueta-fondo);
  border: 1px solid var(--color-linea);
  flex-shrink: 0;
  display: grid;
  place-items: center;
}

.taller-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.taller-card__avatar-letra {
  font-family: var(--font-titulos);
  font-size: var(--texto-2xl);
  font-weight: 700;
  color: var(--color-etiqueta-texto);
}

.taller-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.taller-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.taller-card__comunidad {
  font-size: var(--texto-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--color-primario);
}

.taller-card__badge {
  font-size: var(--texto-2xs);
  text-transform: uppercase;
  font-weight: 700;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pildora);
}

.taller-card__badge--pendiente {
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
}

.taller-card__badge--aprobado {
  background: var(--color-suave);
  color: var(--color-whatsapp);
}

.taller-card__badge--rechazado {
  background: var(--color-error-fondo);
  color: var(--color-error);
}

.taller-card__nombre {
  font-size: var(--texto-lg);
  color: var(--color-texto);
}

.taller-card__artesano {
  font-size: var(--texto-sm);
  color: var(--color-texto);
}

.taller-card__bio {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
  margin-top: var(--space-1);
  line-height: 1.4;
  max-width: 600px;
}

.taller-card__contacto {
  display: flex;
  gap: var(--space-3);
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
  margin-top: var(--space-2);
  flex-wrap: wrap;
}

.taller-card__acciones {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
  align-items: center;
}

@media (max-width: 48rem) {
  .taller-card {
    flex-direction: column;
    align-items: stretch;
  }

  .taller-card__acciones {
    justify-content: flex-end;
    border-top: 1px solid var(--color-linea);
    padding-top: var(--space-3);
  }
}
</style>
