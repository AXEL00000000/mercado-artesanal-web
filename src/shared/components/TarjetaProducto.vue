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
        <img v-if="producto.imagen" :src="producto.imagen" :alt="producto.nombre" loading="lazy" />
        <EtiquetaVenta :modo="producto.modo_venta" class="tarjeta__etiqueta" />
      </div>
      <h3 class="tarjeta__nombre">{{ producto.nombre }}</h3>
    </RouterLink>
    <p class="tarjeta__origen">
      {{ producto.productor.nombre_taller }} · {{ producto.comunidad.nombre }}
    </p>
    <p class="tarjeta__precio">
      <template v-if="producto.modo_venta === 'tratar'">Desde </template
      >{{ formatearPrecio(producto.precio) }}
    </p>
  </article>
</template>

<style scoped>
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.tarjeta__enlace {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-decoration: none;
}

.tarjeta__foto {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: var(--radius-foto);
  background: var(--color-suave);
}

.tarjeta__foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.tarjeta__enlace:hover img {
  transform: scale(1.03);
}

.tarjeta__etiqueta {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
}

.tarjeta__nombre {
  margin: 0;
  font-family: var(--font-texto);
  font-size: var(--texto-base);
  font-weight: 600;
  line-height: 1.3;
}

.tarjeta__enlace:hover .tarjeta__nombre {
  text-decoration: underline;
}

.tarjeta__origen {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
}

.tarjeta__precio {
  margin: 0;
  font-family: var(--font-titulos);
  font-size: var(--texto-lg);
  font-weight: 700;
}
</style>
