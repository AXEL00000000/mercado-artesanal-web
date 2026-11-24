<script setup lang="ts">
import { computed } from 'vue'
import { ErrorApi, mensajeDeError } from '@/shared/api/cliente'
import BotonBase from './BotonBase.vue'

const props = defineProps<{
  /** Un texto o el error atrapado (ErrorApi u otro). */
  error: unknown
  reintentable?: boolean
}>()

const emit = defineEmits<{ reintentar: [] }>()

const mensaje = computed(() =>
  typeof props.error === 'string' ? props.error : mensajeDeError(props.error),
)
const detalles = computed(() => (props.error instanceof ErrorApi ? props.error.detalles : []))
</script>

<template>
  <div class="error" role="alert">
    <p class="error__mensaje">{{ mensaje }}</p>
    <ul v-if="detalles.length" class="error__detalles">
      <li v-for="detalle in detalles" :key="detalle">{{ detalle }}</li>
    </ul>
    <BotonBase v-if="reintentable" @click="emit('reintentar')">Reintentar</BotonBase>
  </div>
</template>

<style scoped>
.error {
  padding: var(--space-4);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-control);
  background: var(--color-error-fondo);
  color: var(--color-texto);
}

.error__mensaje {
  margin: 0;
  font-weight: 600;
}

.error__detalles {
  margin: var(--space-2) 0 0;
  padding-left: var(--space-5);
  font-size: var(--texto-sm);
}

.error .boton {
  margin-top: var(--space-3);
}
</style>
