<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ErrorApi, get, post, put } from '@/shared/api/cliente'
import type { Comunidad, EstadoVerificacion } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import { useSesionStore } from '@/stores/sesion'
import NavegacionTaller from '../components/NavegacionTaller.vue'
import {
  ETIQUETA_VERIFICACION,
  formatearFecha,
  type MiTaller,
  type TallerEntrada,
} from '../tipos'

const sesion = useSesionStore()

const cargando = ref(true)
const errorCarga = ref<unknown>(null)
const guardando = ref(false)
const errorGuardar = ref<unknown>(null)
const aviso = ref('')

const taller = ref<MiTaller | null>(null)
const comunidades = ref<Comunidad[]>([])

const nombreTaller = ref('')
const comunidadId = ref<number | ''>('')
const whatsapp = ref('')
const direccionTaller = ref('')
const cpTaller = ref('')
const biografia = ref('')
const fotoUrl = ref('')

const MENSAJE_ESTADO: Record<EstadoVerificacion, string> = {
  pendiente:
    'Tu taller está pendiente de aprobación. Puedes preparar tus productos y entregas, pero aún no salen en el catálogo público.',
  aprobado: 'Tu taller está aprobado y tus productos activos son visibles en el catálogo público.',
  rechazado:
    'Tu solicitud fue rechazada. Puedes actualizar la información del taller o comunicarte con administración.',
}

const claseEstado = computed(() => {
  if (!taller.value) return ''
  if (taller.value.estado_verificacion === 'aprobado') return 'estado--aprobado'
  if (taller.value.estado_verificacion === 'rechazado') return 'estado--rechazado'
  return 'estado--pendiente'
})

function llenarFormulario(datos: MiTaller) {
  nombreTaller.value = datos.nombre_taller
  comunidadId.value = datos.comunidad.id
  whatsapp.value = datos.whatsapp
  direccionTaller.value = datos.direccion_taller
  cpTaller.value = datos.cp_taller
  biografia.value = datos.biografia ?? ''
  fotoUrl.value = datos.foto_url ?? ''
}

async function cargar() {
  cargando.value = true
  errorCarga.value = null
  try {
    const listaComunidades = await get<Comunidad[]>('/comunidades')
    comunidades.value = listaComunidades

    if (sesion.tieneTaller) {
      try {
        const datosTaller = await get<MiTaller>('/mi-taller')
        taller.value = datosTaller
        llenarFormulario(datosTaller)
      } catch (err) {
        // 403 indica que la cuenta aún no tiene taller; no es un fallo de carga
        if (err instanceof ErrorApi && err.status === 403) {
          taller.value = null
        } else {
          throw err
        }
      }
    } else {
      taller.value = null
    }
  } catch (err) {
    errorCarga.value = err
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  if (guardando.value) return
  errorGuardar.value = null
  aviso.value = ''

  if (comunidadId.value === '') {
    errorGuardar.value = 'Selecciona una comunidad.'
    return
  }

  const cuerpo: TallerEntrada = {
    comunidad_id: Number(comunidadId.value),
    nombre_taller: nombreTaller.value.trim(),
    whatsapp: whatsapp.value.trim(),
    direccion_taller: direccionTaller.value.trim(),
    cp_taller: cpTaller.value.trim(),
    // La API rechaza "" en foto_url con 400; los opcionales vacíos deben ir como null
    biografia: biografia.value.trim() || null,
    foto_url: fotoUrl.value.trim() || null,
  }

  guardando.value = true
  try {
    if (taller.value) {
      const actualizado = await put<MiTaller>('/mi-taller', cuerpo)
      taller.value = actualizado
      llenarFormulario(actualizado)
      // Refresca el perfil para mantener sincronizado el nombre del taller en el menú global
      await sesion.cargarPerfil()
      aviso.value = 'Cambios guardados.'
    } else {
      const creado = await post<MiTaller>('/mi-taller', cuerpo)
      taller.value = creado
      llenarFormulario(creado)
      // Habilita sesion.tieneTaller para desbloquear el resto de pestañas del panel
      await sesion.cargarPerfil()
      aviso.value =
        'Taller registrado. Quedará pendiente de aprobación antes de mostrarse en el catálogo.'
    }
  } catch (err) {
    errorGuardar.value = err
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <section class="panel">
    <NavegacionTaller
      :titulo="taller ? 'Mi taller' : 'Abrir mi taller'"
      :subtitulo="
        taller
          ? 'Consulta el estado de verificación y mantén actualizados los datos de tu taller.'
          : 'Registra tu taller para publicar artesanías y gestionar pedidos.'
      "
    />

    <EstadoCarga v-if="cargando" />
    <MensajeError v-else-if="errorCarga" :error="errorCarga" reintentable @reintentar="cargar" />

    <div v-else-if="comunidades.length === 0" class="vacio">
      <p>No hay comunidades registradas todavía para asociar tu taller.</p>
    </div>

    <div v-else class="contenido-taller">
      <article v-if="taller" class="estado" :class="claseEstado">
        <div class="estado__cabecera">
          <span class="insignia">{{ ETIQUETA_VERIFICACION[taller.estado_verificacion] }}</span>
          <span class="estado__fecha">Registrado el {{ formatearFecha(taller.created_at) }}</span>
        </div>
        <p class="estado__texto">{{ MENSAJE_ESTADO[taller.estado_verificacion] }}</p>
      </article>

      <article v-else class="estado estado--pendiente">
        <div class="estado__cabecera">
          <span class="insignia">Paso inicial</span>
        </div>
        <p class="estado__texto">
          Al registrar tu taller quedará pendiente de aprobación por un administrador. Mientras
          esperas aprobación podrás preparar tus productos y entregas.
        </p>
      </article>

      <article v-if="taller" class="resumen">
        <div class="resumen__foto">
          <img v-if="taller.foto_url" :src="taller.foto_url" :alt="taller.nombre_taller" />
          <span v-else class="resumen__inicial" aria-hidden="true">
            {{ taller.nombre_taller.charAt(0).toUpperCase() }}
          </span>
        </div>

        <div class="resumen__datos">
          <h2>{{ taller.nombre_taller }}</h2>
          <p class="resumen__comunidad">
            {{ taller.comunidad.nombre }} &middot; {{ taller.comunidad.region }}
          </p>
          <p v-if="taller.biografia" class="resumen__bio">{{ taller.biografia }}</p>
        </div>
      </article>

      <form class="tarjeta-form" @submit.prevent="guardar">
        <h2 class="tarjeta-form__titulo">
          {{ taller ? 'Editar datos del taller' : 'Datos del taller' }}
        </h2>

        <div class="rejilla">
          <div class="campo campo--ancho">
            <label for="nombre_taller" class="campo__etiqueta">Nombre del taller *</label>
            <input
              id="nombre_taller"
              v-model="nombreTaller"
              type="text"
              maxlength="120"
              required
              placeholder="Ej. Barro Negro Doña Catalina"
              class="campo__input"
            />
          </div>

          <div class="campo">
            <label for="comunidad_id" class="campo__etiqueta">Comunidad *</label>
            <select id="comunidad_id" v-model="comunidadId" required class="campo__input">
              <option disabled value="">Selecciona una comunidad</option>
              <option v-for="comunidad in comunidades" :key="comunidad.id" :value="comunidad.id">
                {{ comunidad.nombre }} ({{ comunidad.region }})
              </option>
            </select>
          </div>

          <div class="campo">
            <label for="whatsapp" class="campo__etiqueta">WhatsApp (solo dígitos con lada) *</label>
            <input
              id="whatsapp"
              v-model="whatsapp"
              type="tel"
              inputmode="numeric"
              minlength="10"
              maxlength="15"
              required
              placeholder="529511234567"
              class="campo__input"
            />
          </div>

          <div class="campo">
            <label for="direccion_taller" class="campo__etiqueta">Dirección del taller *</label>
            <input
              id="direccion_taller"
              v-model="direccionTaller"
              type="text"
              required
              placeholder="Calle, número y referencia"
              class="campo__input"
            />
          </div>

          <div class="campo">
            <label for="cp_taller" class="campo__etiqueta">Código postal *</label>
            <input
              id="cp_taller"
              v-model="cpTaller"
              type="text"
              inputmode="numeric"
              minlength="5"
              maxlength="5"
              required
              placeholder="71256"
              class="campo__input"
            />
          </div>

          <div class="campo campo--ancho">
            <label for="foto_url" class="campo__etiqueta">URL de foto del taller (opcional)</label>
            <input
              id="foto_url"
              v-model="fotoUrl"
              type="url"
              placeholder="https://ejemplo.com/taller.jpg"
              class="campo__input"
            />
          </div>

          <div class="campo campo--ancho">
            <label for="biografia" class="campo__etiqueta">Historia / biografía (opcional)</label>
            <textarea
              id="biografia"
              v-model="biografia"
              rows="3"
              placeholder="Cuenta brevemente sobre tu oficio, técnicas y tradición familiar."
              class="campo__input campo__textarea"
            />
          </div>
        </div>

        <MensajeError v-if="errorGuardar" :error="errorGuardar" />
        <p v-if="aviso" class="aviso" role="status">{{ aviso }}</p>

        <div class="acciones">
          <BotonBase type="submit" variante="comprar" grande :cargando="guardando">
            {{ taller ? 'Guardar cambios' : 'Registrar taller' }}
          </BotonBase>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.panel {
  max-width: var(--ancho-maximo);
  margin: 0 auto;
  padding: var(--space-5) var(--margen-lateral);
}

.contenido-taller {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.vacio {
  padding: var(--space-6) var(--space-4);
  border: 1px dashed var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  text-align: center;
}

.estado {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.estado--pendiente {
  background: var(--color-suave);
}

.estado--aprobado {
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
}

.estado--rechazado {
  border-color: var(--color-error);
  background: var(--color-error-fondo);
}

.estado__cabecera {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.insignia {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
  color: var(--color-texto);
  font-size: var(--texto-xs);
  font-weight: 600;
}

.estado__fecha {
  font-size: var(--texto-xs);
  color: var(--color-texto-secundario);
}

.estado__texto {
  font-size: var(--texto-sm);
}

.resumen {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.resumen__foto {
  flex-shrink: 0;
  width: var(--space-7);
  height: var(--space-7);
  overflow: hidden;
  border-radius: var(--radius-foto);
  background: var(--color-suave);
}

.resumen__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resumen__inicial {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-family: var(--font-titulos);
  font-size: var(--texto-xl);
  font-weight: 700;
}

.resumen__datos {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.resumen__comunidad {
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.resumen__bio {
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.tarjeta-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
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

.campo__input {
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  font-size: var(--texto-base);
}

.campo__textarea {
  min-height: calc(var(--space-7) + var(--space-5));
  resize: vertical;
}

.aviso {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.acciones {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 40rem) {
  .resumen {
    flex-direction: column;
    align-items: flex-start;
  }

  .rejilla {
    grid-template-columns: 1fr;
  }

  .tarjeta-form {
    padding: var(--space-4);
  }
}
</style>
