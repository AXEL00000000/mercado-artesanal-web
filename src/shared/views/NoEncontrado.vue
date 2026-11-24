<script setup lang="ts">
import BotonBase from '@/shared/components/BotonBase.vue'
</script>

<template>
  <section class="no-encontrado contenedor">
    <p class="no-encontrado__codigo">404</p>
    <h1>No encontramos esta página</h1>
    <p>Puede que el enlace esté mal escrito o que la página ya no exista.</p>
    <BotonBase :to="{ name: 'catalogo' }" variante="secundario">Volver al catálogo</BotonBase>
  </section>
</template>

<style scoped>
.no-encontrado {
  padding-block: var(--space-8);
  text-align: center;
}

.no-encontrado__codigo {
  margin: 0;
  color: var(--color-primario);
  font-family: var(--font-titulos);
  font-size: var(--texto-3xl);
  font-weight: 800;
}

.no-encontrado p {
  color: var(--color-texto-secundario);
}
</style>
