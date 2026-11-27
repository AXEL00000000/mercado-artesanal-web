<script setup lang="ts">
import EncabezadoPrincipal from './EncabezadoPrincipal.vue'
import PiePagina from './PiePagina.vue'
</script>

<template>
  <div class="layout">
    <a href="#contenido" class="saltar">Saltar al contenido</a>
    <EncabezadoPrincipal />
    <main id="contenido" class="contenido" tabindex="-1">
      <slot />
    </main>
    <PiePagina />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.saltar {
  position: absolute;
  top: 0;
  left: var(--space-4);
  z-index: var(--z-capa);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-control);
  background: var(--color-texto);
  color: var(--color-superficie);
  transform: translateY(-200%);
}

.saltar:focus {
  transform: translateY(var(--space-2));
}

.contenido {
  flex: 1;
}

.contenido:focus {
  outline: none;
}
</style>
