<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { ProductoTarjeta } from '@/shared/api/tipos'
import { formatearPrecio } from '@/shared/utils/formato'
import EtiquetaVenta from './EtiquetaVenta.vue'

defineProps<{ producto: ProductoTarjeta }>()
</script>

<template>
  <article class="tarjeta">
    <RouterLink :to="{ name: 'producto', params: { slug: producto.slug } }" class="tarjeta__enlace">
      <div class="tarjeta__foto">
        <span class="tarjeta__hueco" aria-hidden="true">Foto</span>
        <img v-if="producto.imagen" :src="producto.imagen" :alt="producto.nombre" loading="lazy" />
      </div>
      <EtiquetaVenta :modo="producto.modo_venta" class="tarjeta__etiqueta" />
      <div class="tarjeta__info">
        <h3 class="tarjeta__nombre">{{ producto.nombre }}</h3>
        <p class="tarjeta__origen">
          {{ producto.productor.nombre_taller }}, {{ producto.comunidad.nombre }}
        </p>
        <p class="tarjeta__precio">
          <template v-if="producto.modo_venta === 'tratar'">Desde </template
          >{{ formatearPrecio(producto.precio) }}
        </p>
      </div>
    </RouterLink>
  </article>
</template>

<style scoped>
.tarjeta {
  min-width: 0;
}

.tarjeta__enlace {
  position: relative;
  display: flex;
  flex-direction: column;
  text-decoration: none;
}

.tarjeta__enlace:hover {
  color: inherit;
}

.tarjeta__foto {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: var(--radius-foto);
  background: var(--color-suave);
}

.tarjeta__foto img {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tarjeta__hueco {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--color-texto-secundario);
  font-size: var(--texto-xs);
}

.tarjeta__etiqueta {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 2;
  max-width: calc(100% - 2 * var(--space-3));
}

.tarjeta__info {
  padding-top: var(--space-3);
}

.tarjeta__nombre {
  font-size: 1.0625rem;
  line-height: 1.25;
}

.tarjeta__enlace:hover .tarjeta__nombre {
  text-decoration: underline;
}

.tarjeta__origen {
  margin-top: var(--space-1);
  color: var(--color-texto-secundario);
  font-size: 0.8125rem;
}

.tarjeta__precio {
  margin-top: var(--space-2);
  font-family: var(--font-titulos);
  font-size: var(--texto-lg);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 40rem) {
  .tarjeta__foto {
    border-radius: var(--radius-control);
  }

  .tarjeta .tarjeta__etiqueta {
    top: var(--space-2);
    left: var(--space-2);
    max-width: calc(100% - 2 * var(--space-2));
    padding-inline: var(--space-2);
    font-size: var(--texto-2xs);
  }

  .tarjeta__nombre {
    font-size: 0.9375rem;
  }

  .tarjeta__origen {
    font-size: var(--texto-xs);
  }

  .tarjeta__precio {
    font-size: var(--texto-base);
  }
}
</style>
