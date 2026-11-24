<script setup lang="ts">
// Campo de formulario con etiqueta, texto de ayuda y mensaje de error.
// Lo demás (autocomplete, inputmode, maxlength…) pasa directo al <input>.
import { computed, ref, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    etiqueta: string
    tipo?: 'text' | 'email' | 'password' | 'tel'
    error?: string
    ayuda?: string
    opcional?: boolean
  }>(),
  { tipo: 'text', error: '', ayuda: '' },
)

const valor = defineModel<string>({ required: true })

const id = useId()
const visible = ref(false)

// En contraseñas, el botón "Mostrar" cambia el tipo a texto
const tipoInput = computed(() => (props.tipo === 'password' && visible.value ? 'text' : props.tipo))

const describidoPor = computed(
  () =>
    [props.error && `${id}-error`, props.ayuda && `${id}-ayuda`].filter(Boolean).join(' ') ||
    undefined,
)
</script>

<template>
  <div class="campo">
    <label :for="id" class="campo__etiqueta">
      {{ etiqueta }}
      <span v-if="opcional" class="campo__opcional">(opcional)</span>
    </label>

    <div class="campo__control">
      <input
        :id="id"
        v-model="valor"
        v-bind="$attrs"
        :type="tipoInput"
        class="campo__input"
        :class="{ 'campo__input--con-boton': tipo === 'password' }"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describidoPor"
      />
      <button
        v-if="tipo === 'password'"
        type="button"
        class="campo__ver"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        {{ visible ? 'Ocultar' : 'Mostrar' }}
      </button>
    </div>

    <p v-if="ayuda && !error" :id="`${id}-ayuda`" class="campo__ayuda">{{ ayuda }}</p>
    <p v-if="error" :id="`${id}-error`" class="campo__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.campo__etiqueta {
  color: var(--color-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.campo__opcional {
  color: var(--color-texto-secundario);
  font-weight: 400;
}

.campo__control {
  position: relative;
}

.campo__input {
  width: 100%;
  min-height: var(--alto-control);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-control);
  background: var(--color-superficie);
  color: var(--color-texto);
  font-family: var(--font-texto);
  font-size: var(--texto-base);
  transition: border-color 0.15s;
}

.campo__input:focus {
  outline: none;
  border-color: var(--color-foco);
}

.campo__input[aria-invalid='true'] {
  border-color: var(--color-error);
}

.campo__input--con-boton {
  padding-right: var(--space-7);
}

.campo__ver {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
  font-weight: 600;
  cursor: pointer;
}

.campo__ver:hover {
  color: var(--color-texto);
}

.campo__ayuda {
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.campo__error {
  color: var(--color-error);
  font-size: var(--texto-sm);
  font-weight: 600;
}
</style>