<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { PestanaPanel } from './tipos'

withDefaults(
  defineProps<{
    titulo: string
    descripcion?: string
    /** Texto pequeño sobre el título, p. ej. "Panel del artesano". */
    antetitulo?: string
    pestanas?: PestanaPanel[]
    etiquetaPestanas?: string
  }>(),
  { pestanas: () => [], etiquetaPestanas: 'Secciones' },
)
</script>

<template>
  <div class="panel contenedor">
    <header class="panel__cabecera">
      <div class="panel__textos">
        <p v-if="antetitulo" class="panel__antetitulo">{{ antetitulo }}</p>
        <h1 class="panel__titulo">{{ titulo }}</h1>
        <p v-if="descripcion" class="panel__descripcion">{{ descripcion }}</p>
      </div>
      <div v-if="$slots.acciones" class="panel__acciones">
        <slot name="acciones" />
      </div>
    </header>

    <nav v-if="pestanas.length" class="pestanas" :aria-label="etiquetaPestanas">
      <ul class="pestanas__lista">
        <li v-for="pestana in pestanas" :key="pestana.etiqueta">
          <RouterLink v-slot="{ href, navigate, isExactActive }" :to="pestana.to" custom>
            <a
              :href="href"
              class="pestanas__enlace"
              :class="{ 'pestanas__enlace--activa': isExactActive }"
              :aria-current="isExactActive ? 'page' : undefined"
              @click="navigate"
            >
              {{ pestana.etiqueta }}
              <template v-if="pestana.contador">
                <span class="pestanas__contador" aria-hidden="true">
                  {{ pestana.contador > 99 ? '99+' : pestana.contador }}
                </span>
                <span class="solo-lectores">, {{ pestana.contador }} pendientes</span>
              </template>
            </a>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="panel__contenido">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding-block: var(--space-6) var(--space-7);
}

.panel__cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.panel__textos {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.panel__antetitulo {
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
  font-weight: 600;
  letter-spacing: var(--espaciado-mayusculas);
  text-transform: uppercase;
}

.panel__titulo {
  font-size: var(--texto-2xl);
}

.panel__descripcion {
  max-width: var(--ancho-texto);
  color: var(--color-texto-secundario);
}

.panel__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.pestanas {
  position: relative;
  margin-top: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: var(--borde-fino) solid var(--color-linea);
  overflow-x: auto;
  scrollbar-width: none;
}

.pestanas__lista {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.pestanas__enlace {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--alto-control);
  padding: 0 var(--space-4);
  border: var(--borde-fino) solid var(--color-linea);
  border-radius: var(--radius-pildora);
  background: var(--color-superficie);
  color: var(--color-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color var(--duracion-rapida),
    border-color var(--duracion-rapida);
}

.pestanas__enlace:hover {
  background: var(--color-suave);
  color: var(--color-texto);
}

.pestanas__enlace--activa,
.pestanas__enlace--activa:hover {
  border-color: var(--color-texto);
  background: var(--color-texto);
  color: var(--color-superficie);
}

.pestanas__contador {
  min-width: var(--tamano-contador);
  height: var(--tamano-contador);
  padding-inline: var(--space-1);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-xs);
  line-height: var(--tamano-contador);
  text-align: center;
}

.panel__contenido {
  margin-top: var(--space-5);
}

@media (max-width: 40rem) {
  .panel {
    padding-block: var(--space-5) var(--space-6);
  }

  .panel__titulo {
    font-size: var(--texto-xl);
  }

  .pestanas {
    margin-inline: calc(-1 * var(--margen-lateral));
    padding-inline: var(--margen-lateral);
  }
}
</style>
