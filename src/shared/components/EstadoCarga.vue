<script setup lang="ts">
withDefaults(defineProps<{ texto?: string }>(), { texto: 'Cargando…' })
</script>

<template>
  <div class="carga" role="status" aria-live="polite">
    <span class="carga__giro" aria-hidden="true" />
    <span>{{ texto }}</span>
  </div>
</template>

<style scoped>
.carga {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-7) var(--space-4);
  color: var(--color-texto-secundario);
}

.carga__giro {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-linea);
  border-top-color: var(--color-primario);
  border-radius: var(--radius-pildora);
  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
