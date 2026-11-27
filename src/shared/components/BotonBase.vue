<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    /** comprar: rojo, solo para comprar · whatsapp: verde · peligro: eliminar y acciones destructivas */
    variante?: 'comprar' | 'whatsapp' | 'secundario' | 'peligro'
    /** Acción principal del detalle: 52 px de alto y ancho completo hasta 420 px. */
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
  min-height: var(--alto-control);
  padding: 0 var(--space-5);
  border: var(--borde-fino) solid transparent;
  border-radius: var(--radius-pildora);
  font-family: var(--font-texto);
  font-weight: 600;
  font-size: var(--texto-base);
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--duracion-rapida),
    border-color var(--duracion-rapida);
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
  color: var(--color-sobre-primario);
}

.boton--whatsapp {
  background: var(--color-whatsapp);
  color: var(--color-sobre-whatsapp);
}

.boton--whatsapp:not(:disabled):hover {
  background: var(--color-whatsapp-hover);
  color: var(--color-sobre-whatsapp);
}

.boton--secundario {
  background: var(--color-superficie);
  color: var(--color-texto);
  border-color: var(--color-linea);
}

.boton--secundario:not(:disabled):hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.boton--peligro {
  background: var(--color-peligro-fondo);
  color: var(--color-peligro);
  border-color: var(--color-peligro);
}

.boton--peligro:not(:disabled):hover {
  background: var(--color-peligro-fondo-hover);
  color: var(--color-peligro);
}

.boton--grande {
  width: 100%;
  max-width: var(--ancho-boton-grande);
  min-height: var(--alto-boton-grande);
}

.boton--bloque {
  display: flex;
  width: 100%;
  max-width: none;
}

.boton__giro {
  width: 1em;
  height: 1em;
  border: var(--borde-grueso) solid currentcolor;
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
