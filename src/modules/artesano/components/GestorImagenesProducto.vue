<script setup lang="ts">
import { ref } from 'vue'
import { del, enviarFormulario, get, patch } from '@/shared/api/cliente'
import type { ImagenProducto } from '@/shared/api/tipos'
import BotonBase from '@/shared/components/BotonBase.vue'
import EstadoCarga from '@/shared/components/EstadoCarga.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import type { MiProductoDetalle } from '../tipos'

// Límites impuestos por el endpoint multipart de Supabase Storage en la API
const FORMATOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_PESO_BYTES = 5 * 1024 * 1024

const props = defineProps<{
  productoId: number
  productoNombre: string
  imagenes: ImagenProducto[]
  cargando?: boolean
  errorCarga?: unknown
}>()

const emit = defineEmits<{
  actualizadas: [imagenes: ImagenProducto[]]
  reintentar: []
}>()

const inputArchivo = ref<HTMLInputElement | null>(null)
const subiendo = ref(false)
const procesandoId = ref<number | null>(null)
const confirmandoId = ref<number | null>(null)
const errorAccion = ref<unknown>(null)
const aviso = ref('')

function seleccionarArchivo() {
  errorAccion.value = null
  aviso.value = ''
  inputArchivo.value?.click()
}

// Se vuelve a consultar el detalle tras subir o borrar porque la API reordena y promueve la principal
async function recargarImagenes(): Promise<ImagenProducto[]> {
  const detalle = await get<MiProductoDetalle>(`/mi-taller/productos/${props.productoId}`)
  return detalle.imagenes
}

async function alElegirArchivo(evento: Event) {
  const input = evento.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return

  errorAccion.value = null
  aviso.value = ''

  if (!FORMATOS_PERMITIDOS.has(archivo.type)) {
    errorAccion.value = 'Formato no válido. Usa una imagen JPG, PNG o WebP.'
    input.value = ''
    return
  }

  if (archivo.size > MAX_PESO_BYTES) {
    errorAccion.value = 'La imagen supera el límite de 5 MB.'
    input.value = ''
    return
  }

  subiendo.value = true
  try {
    const formulario = new FormData()
    // La API exige el archivo en el campo 'imagen'
    formulario.append('imagen', archivo)
    await enviarFormulario<ImagenProducto>(
      `/mi-taller/productos/${props.productoId}/imagenes`,
      formulario,
    )
    const actualizadas = await recargarImagenes()
    emit('actualizadas', actualizadas)
    aviso.value = 'Imagen subida.'
  } catch (err) {
    errorAccion.value = err
  } finally {
    subiendo.value = false
    input.value = ''
  }
}

async function marcarPrincipal(imagenId: number) {
  procesandoId.value = imagenId
  confirmandoId.value = null
  errorAccion.value = null
  aviso.value = ''
  try {
    const ordenadas = await patch<ImagenProducto[]>(
      `/mi-taller/productos/${props.productoId}/imagenes/${imagenId}/principal`,
    )
    emit('actualizadas', ordenadas)
    aviso.value = 'Imagen principal actualizada.'
  } catch (err) {
    errorAccion.value = err
  } finally {
    procesandoId.value = null
  }
}

async function eliminarImagen(imagenId: number) {
  procesandoId.value = imagenId
  errorAccion.value = null
  aviso.value = ''
  try {
    await del(`/mi-taller/productos/${props.productoId}/imagenes/${imagenId}`)
    confirmandoId.value = null
    const actualizadas = await recargarImagenes()
    emit('actualizadas', actualizadas)
    aviso.value = 'Imagen eliminada.'
  } catch (err) {
    errorAccion.value = err
  } finally {
    procesandoId.value = null
  }
}
</script>

<template>
  <section class="gestor" :aria-label="`Fotos de ${productoNombre}`">
    <div class="gestor__cabecera">
      <div>
        <h3 class="gestor__titulo">Fotos de {{ productoNombre }}</h3>
        <p class="gestor__ayuda">JPG, PNG o WebP de hasta 5 MB. La primera foto queda como principal.</p>
      </div>

      <div class="gestor__subida">
        <input
          ref="inputArchivo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="solo-lectores"
          @change="alElegirArchivo"
        />
        <BotonBase variante="comprar" :cargando="subiendo" @click="seleccionarArchivo">
          Subir foto
        </BotonBase>
      </div>
    </div>

    <MensajeError v-if="errorAccion" :error="errorAccion" />
    <p v-if="aviso" class="gestor__aviso" role="status">{{ aviso }}</p>

    <EstadoCarga v-if="cargando" texto="Cargando fotos…" />
    <MensajeError
      v-else-if="errorCarga"
      :error="errorCarga"
      reintentable
      @reintentar="emit('reintentar')"
    />

    <p v-else-if="imagenes.length === 0" class="gestor__vacio">
      Aún no tiene fotos. La primera imagen que subas quedará como principal.
    </p>

    <ul v-else class="galeria">
      <li
        v-for="img in imagenes"
        :key="img.id"
        class="foto"
        :class="{ 'foto--principal': img.es_principal }"
      >
        <div class="foto__marco">
          <img :src="img.url" :alt="`${productoNombre}, foto ${img.orden + 1}`" />
          <span v-if="img.es_principal" class="foto__insignia">Principal</span>
        </div>

        <div class="foto__acciones">
          <BotonBase
            v-if="!img.es_principal"
            variante="secundario"
            bloque
            :cargando="procesandoId === img.id"
            :disabled="procesandoId !== null || subiendo"
            @click="marcarPrincipal(img.id)"
          >
            Hacer principal
          </BotonBase>

          <template v-if="confirmandoId === img.id">
            <p class="foto__pregunta">¿Eliminar esta foto?</p>
            <div class="foto__confirmacion">
              <BotonBase
                variante="comprar"
                bloque
                :cargando="procesandoId === img.id"
                :disabled="procesandoId !== null || subiendo"
                @click="eliminarImagen(img.id)"
              >
                Confirmar
              </BotonBase>
              <BotonBase
                variante="secundario"
                bloque
                :disabled="procesandoId !== null"
                @click="confirmandoId = null"
              >
                Cancelar
              </BotonBase>
            </div>
          </template>

          <BotonBase
            v-else
            variante="secundario"
            bloque
            :disabled="procesandoId !== null || subiendo"
            @click="confirmandoId = img.id"
          >
            Eliminar
          </BotonBase>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.gestor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
}

.gestor__cabecera {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.gestor__titulo {
  font-size: var(--texto-lg);
}

.gestor__ayuda {
  margin-top: var(--space-1);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.gestor__aviso {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.gestor__vacio {
  padding: var(--space-5) var(--space-4);
  border: 1px dashed var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  text-align: center;
}

.galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
}

.foto {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
}

.foto--principal {
  border-color: var(--color-primario);
}

.foto__marco {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-foto);
  background: var(--color-suave);
}

.foto__marco img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto__insignia {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-xs);
  font-weight: 600;
}

.foto__acciones {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.foto__pregunta {
  color: var(--color-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.foto__confirmacion {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
