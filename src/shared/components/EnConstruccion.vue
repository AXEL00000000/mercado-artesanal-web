<script setup lang="ts">
defineProps<{ modulo: string; titulo: string }>()
</script>

<template>
  <section class="construccion contenedor">
    <p class="construccion__modulo">En construcción · {{ modulo }}</p>
    <h1>{{ titulo }}</h1>
    <code>{{ $route.fullPath }}</code>
  </section>
</template>

<style scoped>
.construccion {
  padding-block: var(--space-8);
  text-align: center;
}

.construccion__modulo {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

code {
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}
</style>
