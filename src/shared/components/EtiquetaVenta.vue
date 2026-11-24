<script setup lang="ts">
import type { ModoVenta } from '@/shared/api/tipos'

defineProps<{ modo: ModoVenta }>()
</script>

<template>
  <span class="etiqueta">{{ modo === 'fijo' ? 'Precio fijo' : 'Precio a tratar' }}</span>
</template>

<style scoped>
.etiqueta {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-xs);
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}
</style>
