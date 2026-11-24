<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSesionStore } from '@/stores/sesion'

defineProps<{
  titulo: string
  subtitulo?: string
}>()

const sesion = useSesionStore()

const pestanas = computed(() => {
  const base = [{ nombre: 'mi-taller', etiqueta: 'Mi taller' }]
  // El guard de rutas bloquea las subrutas si el usuario aún no registra su taller
  if (!sesion.tieneTaller) return base
  return [
    ...base,
    { nombre: 'mi-taller-productos', etiqueta: 'Productos' },
    { nombre: 'mi-taller-entregas', etiqueta: 'Entregas' },
    { nombre: 'mi-taller-ventas', etiqueta: 'Ventas' },
    { nombre: 'mi-taller-consultas', etiqueta: 'Consultas' },
  ]
})
</script>

<template>
  <header class="cabecera">
    <div class="cabecera__texto">
      <p class="cabecera__migaja">Panel del artesano</p>
      <h1 class="cabecera__titulo">{{ titulo }}</h1>
      <p v-if="subtitulo" class="cabecera__subtitulo">{{ subtitulo }}</p>
    </div>

    <nav class="pestanas" aria-label="Secciones del taller">
      <RouterLink
        v-for="pestana in pestanas"
        :key="pestana.nombre"
        :to="{ name: pestana.nombre }"
        class="pestanas__enlace"
        exact-active-class="pestanas__enlace--activa"
      >
        {{ pestana.etiqueta }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.cabecera {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-linea);
}

.cabecera__texto {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cabecera__migaja {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cabecera__titulo {
  font-size: var(--texto-2xl);
}

.cabecera__subtitulo {
  color: var(--color-texto-secundario);
  font-size: var(--texto-base);
}

.pestanas {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.pestanas__enlace {
  display: inline-flex;
  align-items: center;
  min-height: var(--alto-control);
  padding: 0 var(--space-4);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
  color: var(--color-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

.pestanas__enlace:hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.pestanas__enlace--activa {
  border-color: var(--color-texto);
  background: var(--color-texto);
  color: var(--color-superficie);
}

.pestanas__enlace--activa:hover {
  background: var(--color-texto);
  color: var(--color-superficie);
}

@media (max-width: 40rem) {
  .cabecera__titulo {
    font-size: var(--texto-xl);
  }
}
</style>
