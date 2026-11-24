<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variante?: 'comprar' | 'whatsapp' | 'secundario'
    grande?: boolean
    /** Ruta interna: se dibuja como RouterLink. */
    to?: RouteLocationRaw
    /** Enlace externo (p. ej. WhatsApp): se abre en otra pestaña. */
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    cargando?: boolean
    bloque?: boolean
  }>(),
  { variante: 'secundario', type: 'button' },
)

const etiqueta = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))
const atributos = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener' }
  return { type: props.type, disabled: props.disabled || props.cargando }
})
</script>

<template>
  <component
    :is="etiqueta"
    v-bind="atributos"
    class="boton"
    :class="[`boton--${variante}`, { 'boton--grande': grande, 'boton--bloque': bloque }]"
    :aria-busy="cargando || undefined"
  >
    <span v-if="cargando" class="boton__giro" aria-hidden="true" />
    <slot />
  </component>
</template>

<style scoped>
.boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-5);
  border: 1.5px solid transparent;
  border-radius: var(--radius-control);
  font-family: var(--font-texto);
  font-weight: 600;
  font-size: var(--texto-base);
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

.boton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.boton--comprar {
  background: var(--color-primario);
  color: var(--color-sobre-primario);
}

.boton--comprar:not(:disabled):hover {
  background: var(--color-primario-hover);
}

.boton--whatsapp {
  background: var(--color-whatsapp);
  color: var(--color-sobre-whatsapp);
}

.boton--whatsapp:not(:disabled):hover {
  background: var(--color-whatsapp-hover);
}

.boton--secundario {
  background: var(--color-superficie);
  color: var(--color-texto);
  border-color: var(--color-linea);
}

.boton--secundario:not(:disabled):hover {
  background: var(--color-suave);
}

.boton--grande {
  min-height: 3.25rem;
  padding-inline: var(--space-6);
  font-size: var(--texto-lg);
}

.boton--bloque {
  display: flex;
  width: 100%;
}

.boton__giro {
  width: 1em;
  height: 1em;
  border: 2px solid currentcolor;
  border-right-color: transparent;
  border-radius: var(--radius-pildora);
  animation: girar 0.7s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
