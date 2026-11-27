<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  etiqueta: string
  descripcion?: string
  disabled?: boolean
  /** Oculta la etiqueta a la vista; los lectores de pantalla la siguen leyendo. */
  etiquetaOculta?: boolean
}>()

const activo = defineModel<boolean>({ required: true })
const id = useId()
const idDescripcion = useId()
</script>

<template>
  <div class="interruptor" :class="{ 'interruptor--deshabilitado': disabled }">
    <input
      :id="id"
      v-model="activo"
      type="checkbox"
      role="switch"
      class="interruptor__control solo-lectores"
      :aria-checked="activo"
      :aria-describedby="descripcion ? idDescripcion : undefined"
      :disabled="disabled"
    />
    <label :for="id" class="interruptor__etiqueta">
      <span class="interruptor__pista" aria-hidden="true">
        <span class="interruptor__perilla" />
      </span>
      <span :class="{ 'solo-lectores': etiquetaOculta }">{{ etiqueta }}</span>
    </label>
    <p v-if="descripcion" :id="idDescripcion" class="interruptor__descripcion">
      {{ descripcion }}
    </p>
  </div>
</template>

<style scoped>
.interruptor {
  position: relative;
}

.interruptor__etiqueta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--alto-control);
  cursor: pointer;
  user-select: none;
}

.interruptor__pista {
  position: relative;
  flex: none;
  width: var(--interruptor-ancho);
  height: var(--interruptor-alto);
  border: var(--borde-fino) solid var(--color-texto-secundario);
  border-radius: var(--radius-pildora);
  background: var(--color-linea);
  transition:
    background-color var(--duracion-rapida),
    border-color var(--duracion-rapida);
}

.interruptor__perilla {
  position: absolute;
  top: var(--borde-grueso);
  left: var(--borde-grueso);
  width: calc(var(--interruptor-alto) - 2 * var(--borde-grueso) - 2 * var(--borde-fino));
  height: calc(var(--interruptor-alto) - 2 * var(--borde-grueso) - 2 * var(--borde-fino));
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
  box-shadow: var(--sombra-suave);
  transition: transform var(--duracion-rapida);
}

.interruptor__control:checked + .interruptor__etiqueta .interruptor__pista {
  border-color: var(--color-texto);
  background: var(--color-texto);
}

.interruptor__control:checked + .interruptor__etiqueta .interruptor__perilla {
  transform: translateX(calc(var(--interruptor-ancho) - var(--interruptor-alto)));
}

.interruptor__control:focus-visible + .interruptor__etiqueta .interruptor__pista {
  outline: var(--borde-grueso) solid var(--color-foco);
  outline-offset: var(--borde-grueso);
}

.interruptor--deshabilitado .interruptor__etiqueta {
  cursor: not-allowed;
  opacity: 0.55;
}

.interruptor__descripcion {
  margin-top: calc(-1 * var(--space-1));
  padding-left: calc(var(--interruptor-ancho) + var(--space-3));
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}
</style>
