<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function salir() {
  auth.cerrarSesion()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="cuenta">
    <h1>Mi cuenta</h1>

    <p v-if="!auth.usuario" class="suave">Cargando tus datos…</p>

    <dl v-else class="datos">
      <dt>Nombre</dt>
      <dd>{{ auth.usuario.nombre }}</dd>
      <dt>Correo</dt>
      <dd>{{ auth.usuario.email }}</dd>
      <dt>Teléfono</dt>
      <dd>{{ auth.usuario.telefono ?? '—' }}</dd>
      <dt>Taller</dt>
      <dd>
        <template v-if="auth.usuario.productor">
          {{ auth.usuario.productor.nombre_taller }} ({{ auth.usuario.productor.estado_verificacion }})
        </template>
        <template v-else>Sin taller registrado</template>
      </dd>
    </dl>

    <button type="button" class="salir" @click="salir">Cerrar sesión</button>
  </main>
</template>

<style scoped>
.cuenta {
  max-width: 560px;
  padding: 56px;
}

h1 {
  font-family: var(--fuente-titulo);
  font-weight: 400;
}

.suave {
  color: var(--texto-suave);
}

.datos {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  margin: 24px 0 32px;
}

dt {
  color: var(--texto-suave);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

dd {
  margin: 0;
}

.salir {
  padding: 12px 24px;
  border: 1px solid var(--dorado);
  background: none;
  color: var(--dorado);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

@media (max-width: 900px) {
  .cuenta {
    padding: 32px 16px;
  }
}
</style>