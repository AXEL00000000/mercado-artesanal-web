<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <header class="encabezado">
    <RouterLink to="/" class="logo">
      <span class="logo-nombre">Mercado Artesanal</span>
      <span class="logo-lugar">Oaxaca · Valles Centrales</span>
    </RouterLink>

    <nav class="menu">
      <a href="#">Colecciones</a>
      <a href="#">Textiles</a>
      <a href="#">Barro Negro</a>
      <a href="#">Alebrijes</a>
      <a href="#">Historias de Taller</a>
    </nav>

    <!-- Sin sesión: botón Entrar. Con sesión: nombre del usuario -->
    <RouterLink v-if="!auth.estaAutenticado" to="/login" class="cuenta">Entrar</RouterLink>
    <RouterLink v-else to="/mi-cuenta" class="cuenta">
      {{ auth.usuario?.nombre.split(' ')[0] ?? 'Mi cuenta' }}
    </RouterLink>
  </header>
</template>

<style scoped>
.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 56px;
  border-bottom: 1px solid var(--borde);
}

.logo {
  display: flex;
  flex-direction: column;
  text-decoration: none;
}

.logo-nombre {
  font-family: var(--fuente-logo);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.logo-lugar {
  color: var(--dorado);
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}

.menu {
  display: flex;
  gap: 32px;
}

.menu a {
  color: var(--texto);
  font-size: 15px;
  text-decoration: none;
  white-space: nowrap;
  opacity: 0.85;
}

.menu a:hover {
  color: var(--dorado-claro);
  opacity: 1;
}

.cuenta {
  padding: 8px 20px;
  border: 1px solid var(--dorado);
  color: var(--dorado);
  font-size: 13px;
  letter-spacing: 0.12em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.cuenta:hover {
  background: var(--dorado);
  color: var(--fondo);
}

@media (max-width: 1100px) {
  .encabezado {
    padding: 16px;
  }
  .menu {
    display: none;
  }
}

@media (max-width: 600px) {
  .encabezado {
    gap: 12px;
  }
  .logo-nombre {
    font-size: 15px;
    letter-spacing: 0.08em;
  }
  .logo-lugar {
    font-size: 8px;
    letter-spacing: 0.2em;
  }
  .cuenta {
    padding: 6px 12px;
    font-size: 11px;
  }
}
</style>