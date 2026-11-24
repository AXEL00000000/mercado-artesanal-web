<script setup lang="ts">
// Marco común de /login y /registro: tarjeta centrada con título, formulario y pie.
defineProps<{ titulo: string; subtitulo: string }>()
</script>

<template>
  <section class="auth contenedor">
    <div class="auth__tarjeta">
      <p class="auth__marca">Mercado Artesanal</p>
      <h1>{{ titulo }}</h1>
      <p class="auth__subtitulo">{{ subtitulo }}</p>

      <slot />

      <p v-if="$slots.pie" class="auth__pie">
        <slot name="pie" />
      </p>
    </div>
  </section>
</template>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  padding-block: var(--space-7);
}

.auth__tarjeta {
  width: 100%;
  max-width: 28rem;
  padding: var(--space-6) var(--space-5);
  border: 1px solid var(--color-linea);
  border-radius: var(--radius-foto);
  background: var(--color-superficie);
  box-shadow: var(--sombra-suave);
}

.auth__marca {
  display: inline-block;
  margin-bottom: var(--space-3);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pildora);
  background: var(--color-etiqueta-fondo);
  color: var(--color-etiqueta-texto);
  font-size: var(--texto-xs);
  font-weight: 600;
}

.auth__subtitulo {
  margin-top: var(--space-2);
  color: var(--color-texto-secundario);
}

/* El <form> viene de la vista */
.auth__tarjeta :slotted(form) {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.auth__pie {
  margin-top: var(--space-5);
  color: var(--color-texto-secundario);
  font-size: var(--texto-sm);
  text-align: center;
}

.auth__pie :slotted(a) {
  color: var(--color-texto);
  font-weight: 600;
}

@media (max-width: 40rem) {
  .auth {
    padding-block: var(--space-5);
  }

  .auth__tarjeta {
    padding: var(--space-5) var(--space-4);
  }
}
</style>