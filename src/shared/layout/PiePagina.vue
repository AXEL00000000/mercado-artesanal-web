<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { get } from '@/shared/api/cliente'
import type { Comunidad } from '@/shared/api/tipos'
import { useSesionStore } from '@/stores/sesion'
import { tipoDeUsuario } from '@/shared/utils/navegacion'

const MAXIMO_COMUNIDADES = 5

// Se piden una sola vez por visita
let peticionComunidades: Promise<Comunidad[]> | null = null

const sesion = useSesionStore()
const comunidades = ref<Comunidad[]>([])
const anio = new Date().getFullYear()

const tipo = computed(() => tipoDeUsuario(sesion.usuario))
const esAdmin = computed(() => tipo.value === 'admin')

onMounted(async () => {
  peticionComunidades ??= get<Comunidad[]>('/comunidades').catch(() => {
    peticionComunidades = null
    return []
  })
  const todas = await peticionComunidades
  comunidades.value = todas
    .filter((c) => (c.total_productores ?? 0) > 0)
    .slice(0, MAXIMO_COMUNIDADES)
})
</script>

<template>
  <footer class="pie">
    <div class="contenedor">
      <div class="pie__columnas">
        <div class="pie__marca">
          <RouterLink to="/" class="pie__logo">
            <img src="/logo-mercado-artesanal.svg" alt="Mercado Artesanal" />
          </RouterLink>
          <p>Artesanía de comunidades de Oaxaca, vendida por quien la hace.</p>
        </div>

        <nav class="pie__columna" aria-labelledby="pie-compra">
          <h2 id="pie-compra" class="pie__titulo">Compra</h2>
          <ul>
            <li><RouterLink to="/">Catálogo</RouterLink></li>
            <li>
              <RouterLink :to="{ path: '/', query: { modo: 'fijo' } }">Precio fijo</RouterLink>
            </li>
            <li>
              <RouterLink :to="{ path: '/', query: { modo: 'tratar' } }"
                >Precio a tratar</RouterLink
              >
            </li>
            <li v-if="sesion.estaAutenticado && !esAdmin">
              <RouterLink to="/pedidos">Mis compras</RouterLink>
            </li>
            <li v-if="!esAdmin"><RouterLink to="/carrito">Carrito</RouterLink></li>
          </ul>
        </nav>

        <nav class="pie__columna" aria-labelledby="pie-comunidades">
          <h2 id="pie-comunidades" class="pie__titulo">Comunidades</h2>
          <ul>
            <li v-for="comunidad in comunidades" :key="comunidad.id">
              <RouterLink :to="{ path: '/', query: { comunidad: comunidad.id } }">
                {{ comunidad.nombre }}
              </RouterLink>
            </li>
            <li v-if="!comunidades.length"><RouterLink to="/">Todo el catálogo</RouterLink></li>
          </ul>
        </nav>

        <nav class="pie__columna" aria-labelledby="pie-talleres">
          <h2 id="pie-talleres" class="pie__titulo">Talleres</h2>
          <ul>
            <li><RouterLink to="/talleres">Conoce los talleres</RouterLink></li>
            <li v-if="tipo === 'artesano'"><RouterLink to="/mi-taller">Mi taller</RouterLink></li>
            <li v-else-if="!esAdmin">
              <RouterLink to="/mi-taller">Vende tus artesanías</RouterLink>
            </li>
            <li v-if="!sesion.estaAutenticado">
              <RouterLink :to="{ name: 'login' }">Entrar</RouterLink>
            </li>
          </ul>
        </nav>
      </div>

      <p class="pie__legal">© {{ anio }} Mercado Artesanal</p>
    </div>
  </footer>
</template>

<style scoped>
.pie {
  margin-top: var(--space-7);
  padding-block: var(--space-6) var(--space-5);
  border-top: var(--borde-fino) solid var(--color-linea);
  background: var(--color-superficie);
  font-size: var(--texto-sm);
}

.pie__columnas {
  display: grid;
  grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
  gap: var(--space-6) var(--space-5);
}

.pie__logo {
  display: inline-flex;
  border-radius: var(--radius-control);
}

.pie__logo img {
  width: auto;
  height: var(--alto-logo);
}

.pie__marca p {
  max-width: var(--ancho-texto-corto);
  margin-top: var(--space-3);
  color: var(--color-texto-secundario);
}

.pie__titulo {
  margin-bottom: var(--space-3);
  font-family: var(--font-texto);
  font-size: var(--texto-sm);
  font-weight: 600;
}

.pie__columna ul {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.pie__columna a {
  color: var(--color-texto-secundario);
  text-decoration: none;
}

.pie__columna a:hover {
  color: var(--color-texto);
  text-decoration: underline;
}

.pie__legal {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: var(--borde-fino) solid var(--color-linea);
  color: var(--color-texto-secundario);
  font-size: var(--texto-nota);
}

@media (max-width: 60rem) {
  .pie__columnas {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .pie__marca {
    grid-column: 1 / -1;
  }
}

@media (max-width: 40rem) {
  .pie__columnas {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
  }

  .pie__columna a {
    display: inline-flex;
    align-items: center;
    min-height: var(--alto-control);
  }

  .pie__columna ul {
    gap: 0;
  }
}
</style>
