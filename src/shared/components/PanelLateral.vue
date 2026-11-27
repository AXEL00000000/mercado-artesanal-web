<script setup lang="ts">
import { ref, useId, useSlots } from 'vue'
import { useCapa } from '@/shared/composables/useCapa'

const props = defineProps<{
  titulo: string
  descripcion?: string
  /** Impide cerrar mientras se guarda. */
  bloqueado?: boolean
}>()

const abierto = defineModel<boolean>('abierto', { required: true })
const emit = defineEmits<{ cerrar: [] }>()
const slots = useSlots()

const panel = ref<HTMLElement | null>(null)
const idTitulo = useId()
const idDescripcion = useId()

function cerrar() {
  if (props.bloqueado) return
  abierto.value = false
  emit('cerrar')
}

useCapa(abierto, { contenedor: panel, alCerrar: cerrar })
</script>

<template>
  <Teleport to="body">
    <Transition name="lateral">
      <div v-if="abierto" class="capa" @click.self="cerrar">
        <section
          ref="panel"
          class="lateral"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="idTitulo"
          :aria-describedby="descripcion ? idDescripcion : undefined"
          tabindex="-1"
        >
          <header class="lateral__cabecera">
            <div>
              <h2 :id="idTitulo" class="lateral__titulo">{{ titulo }}</h2>
              <p v-if="descripcion" :id="idDescripcion" class="lateral__descripcion">
                {{ descripcion }}
              </p>
            </div>
            <button
              type="button"
              class="lateral__cerrar"
              aria-label="Cerrar"
              :disabled="bloqueado"
              @click="cerrar"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div class="lateral__cuerpo">
            <slot />
          </div>

          <footer v-if="slots.pie" class="lateral__pie">
            <slot name="pie" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.capa {
  position: fixed;
  inset: 0;
  z-index: var(--z-capa);
  display: flex;
  justify-content: flex-end;
  background: var(--color-velo);
}

.lateral {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--ancho-panel-lateral);
  height: 100%;
  background: var(--color-fondo);
  box-shadow: var(--sombra-capa);
}

.lateral:focus {
  outline: none;
}

.lateral__cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border-bottom: var(--borde-fino) solid var(--color-linea);
  background: var(--color-superficie);
}

.lateral__titulo {
  font-size: var(--texto-xl);
}

.lateral__descripcion {
  margin-top: var(--space-1);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.lateral__cerrar {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--alto-control);
  height: var(--alto-control);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-fondo);
  cursor: pointer;
}

.lateral__cerrar:hover:not(:disabled) {
  background: var(--color-suave);
}

.lateral__cerrar:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.lateral__cerrar svg {
  width: var(--tamano-icono);
  height: var(--tamano-icono);
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
}

.lateral__cuerpo {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
  overscroll-behavior: contain;
}

.lateral__pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: var(--borde-fino) solid var(--color-linea);
  background: var(--color-superficie);
}

.lateral-enter-active,
.lateral-leave-active {
  transition: background-color var(--duracion-capa);
}

.lateral-enter-active .lateral,
.lateral-leave-active .lateral {
  transition: transform var(--duracion-capa) ease;
}

.lateral-enter-from,
.lateral-leave-to {
  background-color: transparent;
}

.lateral-enter-from .lateral,
.lateral-leave-to .lateral {
  transform: translateX(100%);
}

@media (max-width: 40rem) {
  .lateral {
    max-width: none;
  }

  .lateral__cabecera,
  .lateral__cuerpo {
    padding: var(--space-4);
  }

  .lateral__pie {
    padding: var(--space-3) var(--space-4);
  }

  .lateral__pie > :deep(*) {
    flex: 1;
  }
}
</style>
