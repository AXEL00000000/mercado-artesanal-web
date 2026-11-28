<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { get, patch } from '@/shared/api/cliente'
import type { DecisionTaller, TallerAdmin } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import DialogoConfirmar from '@/shared/components/DialogoConfirmar.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import LayoutPanel from '@/shared/components/LayoutPanel.vue'
import MensajeError from '@/shared/components/MensajeError.vue'

const pestanasAdmin = [
  { etiqueta: 'Talleres', to: { name: 'admin-talleres' } },
  { etiqueta: 'Catálogos', to: { name: 'admin-catalogos' } },
]

const cargando = ref(true)
const error = ref<unknown>(null)
const todosLosTalleres = ref<TallerAdmin[]>([])
const filtroEstado = ref<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')
const procesandoId = ref<number | null>(null)
const mensajeAccion = ref<string | null>(null)

// Contadores de estado para las pestañas
const conteoPendientes = computed(
  () => todosLosTalleres.value.filter((t) => t.estado_verificacion === 'pendiente').length,
)
const conteoAprobados = computed(
  () => todosLosTalleres.value.filter((t) => t.estado_verificacion === 'aprobado').length,
)
const conteoRechazados = computed(
  () => todosLosTalleres.value.filter((t) => t.estado_verificacion === 'rechazado').length,
)

const talleres = computed(() =>
  todosLosTalleres.value.filter((t) => t.estado_verificacion === filtroEstado.value),
)

// Diálogo de rechazo con motivo obligatorio
const tallerPorRechazar = ref<TallerAdmin | null>(null)
const motivoRechazo = ref('')
const errorMotivo = ref<string | null>(null)

async function cargarTalleres() {
  cargando.value = true
  error.value = null
  mensajeAccion.value = null

  try {
    const datos = await get<TallerAdmin[]>('/admin/productores')
    todosLosTalleres.value = datos
  } catch (err) {
    error.value = err
  } finally {
    cargando.value = false
  }
}

async function aprobarTaller(taller: TallerAdmin) {
  procesandoId.value = taller.id
  mensajeAccion.value = null

  try {
    const decision: DecisionTaller = { estado: 'aprobado' }
    await patch(`/admin/productores/${taller.id}`, decision)
    mensajeAccion.value = `Taller "${taller.nombre_taller}" aprobado correctamente.`
    await cargarTalleres()
  } catch (err) {
    error.value = err
  } finally {
    procesandoId.value = null
  }
}

function abrirDialogoRechazo(taller: TallerAdmin) {
  tallerPorRechazar.value = taller
  motivoRechazo.value = ''
  errorMotivo.value = null
}

async function confirmarRechazo() {
  if (!tallerPorRechazar.value) return
  if (!motivoRechazo.value.trim()) {
    errorMotivo.value = 'El motivo del rechazo es obligatorio para orientar al artesano.'
    return
  }
  if (motivoRechazo.value.trim().length > 500) {
    errorMotivo.value = 'El motivo no puede exceder los 500 caracteres.'
    return
  }

  const id = tallerPorRechazar.value.id
  const nombre = tallerPorRechazar.value.nombre_taller
  procesandoId.value = id
  errorMotivo.value = null

  try {
    const decision: DecisionTaller = {
      estado: 'rechazado',
      motivo: motivoRechazo.value.trim(),
    }
    await patch(`/admin/productores/${id}`, decision)
    mensajeAccion.value = `Taller "${nombre}" rechazado con su respectivo motivo.`
    tallerPorRechazar.value = null
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
  <LayoutPanel
    antetitulo="Administración"
    titulo="Revisión de Talleres"
    descripcion="Verifica y aprueba los talleres artesanales para que sus piezas aparezcan en el catálogo público."
    :pestanas="pestanasAdmin"
  >
    <!-- Selector de estado tipo píldora -->
    <div class="admin-talleres__filtros-estado">
      <div class="admin-talleres__pestanas" role="tablist" aria-label="Filtrar por estado">
        <button
          type="button"
          class="admin-talleres__pestana"
          :class="{ 'admin-talleres__pestana--activa': filtroEstado === 'pendiente' }"
          @click="filtroEstado = 'pendiente'"
        >
          Pendientes ({{ conteoPendientes }})
        </button>
        <button
          type="button"
          class="admin-talleres__pestana"
          :class="{ 'admin-talleres__pestana--activa': filtroEstado === 'aprobado' }"
          @click="filtroEstado = 'aprobado'"
        >
          Aprobados ({{ conteoAprobados }})
        </button>
        <button
          type="button"
          class="admin-talleres__pestana"
          :class="{ 'admin-talleres__pestana--activa': filtroEstado === 'rechazado' }"
          @click="filtroEstado = 'rechazado'"
        >
          Rechazados ({{ conteoRechazados }})
        </button>
      </div>
    </div>

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
              :alt="taller.artesano.nombre"
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
              Artesano(a): <strong>{{ taller.artesano.nombre }}</strong>
            </p>

            <p v-if="taller.biografia" class="taller-card__bio">
              {{ taller.biografia }}
            </p>

            <div v-if="taller.motivo_rechazo" class="taller-card__motivo-rechazo">
              <span class="taller-card__motivo-titulo">Motivo de rechazo actual:</span>
              <p>{{ taller.motivo_rechazo }}</p>
            </div>

            <div class="taller-card__contacto">
              <span v-if="taller.artesano.email">
                Email: <strong>{{ taller.artesano.email }}</strong>
              </span>
              <span v-if="taller.artesano.telefono || taller.whatsapp">
                Teléfono: <strong>{{ taller.artesano.telefono || taller.whatsapp }}</strong>
              </span>
              <span v-if="taller.direccion_taller">
                Ubicación: <strong>{{ taller.direccion_taller }} (C.P. {{ taller.cp_taller }})</strong>
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
            @click="aprobarTaller(taller)"
          >
            Aprobar taller
          </BotonBase>

          <BotonBase
            v-if="taller.estado_verificacion !== 'rechazado'"
            variante="peligro"
            :disabled="procesandoId === taller.id"
            @click="abrirDialogoRechazo(taller)"
          >
            Rechazar
          </BotonBase>
        </div>
      </article>
    </div>

    <!-- Diálogo accesible de rechazo con motivo obligatorio -->
    <DialogoConfirmar
      :abierto="tallerPorRechazar !== null"
      titulo="Rechazar solicitud de taller"
      texto-confirmar="Confirmar rechazo"
      texto-cancelar="Cancelar"
      peligroso
      :cargando="procesandoId !== null"
      @confirmar="confirmarRechazo"
      @cancelar="tallerPorRechazar = null"
    >
      <div class="dialogo-rechazo">
        <p class="dialogo-rechazo__instruccion">
          Estás por rechazar el taller
          <strong>"{{ tallerPorRechazar?.nombre_taller }}"</strong>.
          Indica el motivo claramente para que el artesano pueda resolverlo desde su panel:
        </p>
        <textarea
          v-model="motivoRechazo"
          rows="4"
          maxlength="500"
          placeholder="Ejemplo: Las fotos adjuntas no muestran las piezas ni el espacio del taller artesanal..."
          class="dialogo-rechazo__textarea"
        />
        <div class="dialogo-rechazo__contador">
          {{ motivoRechazo.length }} / 500 caracteres
        </div>
        <p v-if="errorMotivo" class="dialogo-rechazo__error" role="alert">
          {{ errorMotivo }}
        </p>
      </div>
    </DialogoConfirmar>
  </LayoutPanel>
</template>

<style scoped>
.admin-talleres__filtros-estado {
  display: flex;
  margin-bottom: var(--space-5);
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
  font-family: var(--font-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
  color: var(--color-texto-secundario);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
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
  letter-spacing: var(--espaciado-mayusculas);
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

.taller-card__motivo-rechazo {
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-error-fondo);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);
  font-size: var(--texto-xs);
  color: var(--color-texto);
}

.taller-card__motivo-titulo {
  font-weight: 600;
  color: var(--color-error);
  display: block;
  margin-bottom: var(--space-1);
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

/* Diálogo de rechazo */
.dialogo-rechazo {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dialogo-rechazo__instruccion {
  font-size: var(--texto-sm);
  color: var(--color-texto-secundario);
  line-height: 1.4;
}

.dialogo-rechazo__textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  color: var(--color-texto);
  font-family: var(--font-texto);
  font-size: var(--texto-sm);
  resize: vertical;
}

.dialogo-rechazo__textarea:focus {
  outline: 2px solid var(--color-foco);
  outline-offset: 1px;
}

.dialogo-rechazo__contador {
  font-size: var(--texto-2xs);
  color: var(--color-texto-secundario);
  text-align: right;
}

.dialogo-rechazo__error {
  font-size: var(--texto-xs);
  color: var(--color-error);
  font-weight: 600;
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
