<script setup lang="ts">
import { computed, ref, toRef, useId } from 'vue'
import { useCapa } from '@/shared/composables/useCapa'
import BotonBase from './BotonBase.vue'

const props = withDefaults(
  defineProps<{
    abierto: boolean
    titulo: string
    mensaje?: string
    textoConfirmar?: string
    textoCancelar?: string
    /** Acción destructiva (eliminar, rechazar…). */
    peligroso?: boolean
    cargando?: boolean
  }>(),
  { textoConfirmar: 'Confirmar', textoCancelar: 'Cancelar' },
)

const emit = defineEmits<{ confirmar: []; cancelar: [] }>()

const dialogo = ref<HTMLElement | null>(null)
const botonCancelar = ref<InstanceType<typeof BotonBase> | null>(null)
const enfoqueInicial = computed(() => (botonCancelar.value?.$el as HTMLElement | undefined) ?? null)
const idTitulo = useId()
const idMensaje = useId()

function cancelar() {
  if (!props.cargando) emit('cancelar')
}

useCapa(toRef(props, 'abierto'), { contenedor: dialogo, alCerrar: cancelar, enfoqueInicial })
</script>

<template>
  <Teleport to="body">
    <Transition name="dialogo">
      <div v-if="abierto" class="capa" @click.self="cancelar">
        <div
          ref="dialogo"
          class="dialogo"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="idTitulo"
          :aria-describedby="mensaje || $slots.default ? idMensaje : undefined"
          :aria-busy="cargando || undefined"
          tabindex="-1"
        >
          <h2 :id="idTitulo" class="dialogo__titulo">{{ titulo }}</h2>
          <div v-if="mensaje || $slots.default" :id="idMensaje" class="dialogo__mensaje">
            <slot>{{ mensaje }}</slot>
          </div>
          <div class="dialogo__acciones">
            <BotonBase ref="botonCancelar" :disabled="cargando" @click="cancelar">
              {{ textoCancelar }}
            </BotonBase>
            <BotonBase
              :variante="peligroso ? 'peligro' : 'secundario'"
              :class="{ 'dialogo__confirmar--neutro': !peligroso }"
              :cargando="cargando"
              @click="emit('confirmar')"
            >
              {{ textoConfirmar }}
            </BotonBase>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.capa {
  position: fixed;
  inset: 0;
  z-index: var(--z-capa);
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: var(--color-velo);
}

.dialogo {
  width: 100%;
  max-width: var(--ancho-dialogo);
  padding: var(--space-5);
  border-radius: var(--radius-foto);
  background: var(--color-fondo);
  box-shadow: var(--sombra-capa);
}

.dialogo:focus {
  outline: none;
}

.dialogo__titulo {
  font-size: var(--texto-xl);
}

.dialogo__mensaje {
  margin-top: var(--space-2);
  color: var(--color-texto-secundario);
}

.dialogo__acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.dialogo__confirmar--neutro {
  border-color: var(--color-texto);
}

.dialogo-enter-active,
.dialogo-leave-active {
  transition: opacity var(--duracion-rapida);
}

.dialogo-enter-active .dialogo,
.dialogo-leave-active .dialogo {
  transition: transform var(--duracion-rapida);
}

.dialogo-enter-from,
.dialogo-leave-to {
  opacity: 0;
}

.dialogo-enter-from .dialogo,
.dialogo-leave-to .dialogo {
  transform: translateY(var(--space-2));
}

@media (max-width: 40rem) {
  .dialogo__acciones {
    flex-direction: column-reverse;
  }

  .dialogo__acciones > * {
    width: 100%;
  }
}
</style>
