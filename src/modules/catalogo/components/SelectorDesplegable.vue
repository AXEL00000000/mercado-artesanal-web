<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface OpcionSelector {
  valor: string | number
  texto: string
}

const props = defineProps<{
  id: string
  etiqueta?: string
  modelValue: string | number
  opciones: OpcionSelector[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [valor: string | number]
  change: [valor: string | number]
}>()

const abierto = ref(false)
const contenedorRef = ref<HTMLElement | null>(null)

const opcionSeleccionada = computed(() => {
  return props.opciones.find((op) => String(op.valor) === String(props.modelValue))
})

const textoMostrado = computed(() => {
  if (opcionSeleccionada.value) {
    return opcionSeleccionada.value.texto
  }
  return props.placeholder || 'Seleccionar...'
})

function alternarMenu() {
  abierto.value = !abierto.value
}

function seleccionarOpcion(opcion: OpcionSelector) {
  emit('update:modelValue', opcion.valor)
  emit('change', opcion.valor)
  abierto.value = false
}

function manejarClicFuera(evento: MouseEvent) {
  if (
    contenedorRef.value &&
    evento.target instanceof Node &&
    !contenedorRef.value.contains(evento.target)
  ) {
    abierto.value = false
  }
}

function manejarTecla(evento: KeyboardEvent) {
  if (!abierto.value) {
    if (evento.key === 'ArrowDown' || evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      abierto.value = true
    }
    return
  }

  if (evento.key === 'Escape') {
    evento.preventDefault()
    abierto.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', manejarClicFuera)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', manejarClicFuera)
})
</script>

<template>
  <div ref="contenedorRef" class="selector-personalizado">
    <label v-if="etiqueta" :for="id" class="selector-personalizado__label">
      {{ etiqueta }}
    </label>

    <div class="selector-personalizado__control">
      <button
        :id="id"
        type="button"
        class="selector-personalizado__boton"
        :class="{ 'selector-personalizado__boton--abierto': abierto }"
        aria-haspopup="listbox"
        :aria-expanded="abierto"
        @click="alternarMenu"
        @keydown="manejarTecla"
      >
        <span class="selector-personalizado__texto">{{ textoMostrado }}</span>
        <svg
          class="selector-personalizado__flecha"
          :class="{ 'selector-personalizado__flecha--girada': abierto }"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      <!-- Menú desplegable estilizado con estética artesanal -->
      <ul
        v-show="abierto"
        class="selector-personalizado__menu"
        role="listbox"
        :aria-labelledby="id"
      >
        <li
          v-for="opcion in opciones"
          :key="opcion.valor"
          role="option"
          :aria-selected="String(opcion.valor) === String(modelValue)"
          class="selector-personalizado__item"
          :class="{
            'selector-personalizado__item--seleccionado':
              String(opcion.valor) === String(modelValue),
          }"
          @click="seleccionarOpcion(opcion)"
        >
          <span>{{ opcion.texto }}</span>
          <svg
            v-if="String(opcion.valor) === String(modelValue)"
            class="selector-personalizado__check"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m4 10 4 4 8-8" />
          </svg>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.selector-personalizado {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  position: relative;
  width: 100%;
}

.selector-personalizado__label {
  font-size: var(--texto-xs);
  font-weight: 600;
  color: var(--color-texto-secundario);
}

.selector-personalizado__control {
  position: relative;
  width: 100%;
}

.selector-personalizado__boton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--alto-control);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-fondo);
  color: var(--color-texto);
  font-family: var(--font-texto);
  font-size: var(--texto-sm);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.selector-personalizado__boton:hover {
  background: var(--color-superficie);
  border-color: var(--color-texto-secundario);
}

.selector-personalizado__boton:focus-visible,
.selector-personalizado__boton--abierto {
  outline: 2px solid var(--color-foco);
  outline-offset: 1px;
  border-color: var(--color-primario);
  background: var(--color-superficie);
}

.selector-personalizado__texto {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.selector-personalizado__flecha {
  width: 16px;
  height: 16px;
  color: var(--color-texto-secundario);
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.selector-personalizado__flecha--girada {
  transform: rotate(180deg);
  color: var(--color-primario);
}

.selector-personalizado__menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  background: var(--color-superficie);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  box-shadow: var(--sombra-suave);
  overscroll-behavior: contain;
}

/* Scrollbar sutil y estético */
.selector-personalizado__menu::-webkit-scrollbar {
  width: 6px;
}

.selector-personalizado__menu::-webkit-scrollbar-track {
  background: transparent;
}

.selector-personalizado__menu::-webkit-scrollbar-thumb {
  background: var(--color-linea);
  border-radius: var(--radius-pildora);
}

.selector-personalizado__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: calc(var(--radius-control) - 4px);
  color: var(--color-texto);
  font-size: var(--texto-sm);
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
  user-select: none;
}

.selector-personalizado__item:hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.selector-personalizado__item--seleccionado {
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-weight: 600;
}

.selector-personalizado__item--seleccionado:hover {
  background: var(--color-etiqueta-fondo);
}

.selector-personalizado__check {
  width: 14px;
  height: 14px;
  color: var(--color-primario);
  flex-shrink: 0;
}
</style>
