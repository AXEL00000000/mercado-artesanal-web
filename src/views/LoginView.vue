<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/services/api'

type Modo = 'login' | 'registro'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const modo = ref<Modo>('login')
const cargando = ref(false)
const verPassword = ref(false)
const errores = ref<string[]>([])

const formulario = reactive({
  nombre: '',
  email: '',
  password: '',
  telefono: '',
})

const esRegistro = computed(() => modo.value === 'registro')

// Las mismas reglas que valida la API (auth.service.js)
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_VALIDO = /^[0-9]{10,15}$/

function cambiarModo(nuevo: Modo) {
  modo.value = nuevo
  errores.value = []
}

function validar(): string[] {
  const lista: string[] = []
  if (esRegistro.value && !formulario.nombre.trim()) lista.push('Escribe tu nombre.')
  if (!EMAIL_VALIDO.test(formulario.email.trim())) lista.push('El correo no es válido.')
  if (esRegistro.value && formulario.password.length < 8) {
    lista.push('La contraseña debe tener al menos 8 caracteres.')
  }
  if (!esRegistro.value && !formulario.password) lista.push('Escribe tu contraseña.')
  if (esRegistro.value && formulario.telefono && !TELEFONO_VALIDO.test(formulario.telefono)) {
    lista.push('El teléfono debe tener solo dígitos (10 a 15).')
  }
  return lista
}

async function enviar() {
  errores.value = validar()
  if (errores.value.length) return

  cargando.value = true
  try {
    if (esRegistro.value) {
      await auth.registrar({
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim(),
        password: formulario.password,
        telefono: formulario.telefono || undefined,
      })
    } else {
      await auth.login(formulario.email.trim(), formulario.password)
    }
    // Regresa a la página que pidió el login, o al inicio
    const destino = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(destino)
  } catch (error) {
    if (error instanceof ApiError) {
      errores.value = [error.message, ...error.detalles]
    } else {
      errores.value = ['Ocurrió un error inesperado. Intenta de nuevo.']
    }
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="login">
    <!-- Lado izquierdo: mensaje de bienvenida -->
    <section class="bienvenida">
      <p class="etiqueta">Mercado Artesanal · Oaxaca</p>
      <h1>Entra al Mundo<br />de Oaxaca</h1>
      <p class="descripcion">
        Piezas con raíz, identidad y maestría manual, directo de los talleres de las comunidades
        originarias.
      </p>
    </section>

    <!-- Lado derecho: formulario -->
    <section class="tarjeta">
      <div class="pestanas" role="tablist">
        <button
          type="button"
          role="tab"
          :class="{ activa: !esRegistro }"
          :aria-selected="!esRegistro"
          @click="cambiarModo('login')"
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          :class="{ activa: esRegistro }"
          :aria-selected="esRegistro"
          @click="cambiarModo('registro')"
        >
          Crear cuenta
        </button>
      </div>

      <h2>{{ esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo' }}</h2>
      <p class="subtitulo">
        {{
          esRegistro
            ? 'Regístrate para comprar y seguir tus pedidos.'
            : 'Ingresa con tu correo y contraseña.'
        }}
      </p>

      <form novalidate @submit.prevent="enviar">
        <label v-if="esRegistro" class="campo">
          <span>Nombre completo</span>
          <input v-model="formulario.nombre" type="text" autocomplete="name" maxlength="120" />
        </label>

        <label class="campo">
          <span>Correo electrónico</span>
          <input
            v-model="formulario.email"
            type="email"
            autocomplete="email"
            placeholder="tucorreo@ejemplo.com"
          />
        </label>

        <label class="campo">
          <span>Contraseña</span>
          <div class="con-boton">
            <input
              v-model="formulario.password"
              :type="verPassword ? 'text' : 'password'"
              :autocomplete="esRegistro ? 'new-password' : 'current-password'"
            />
            <button type="button" class="ver" @click="verPassword = !verPassword">
              {{ verPassword ? 'Ocultar' : 'Ver' }}
            </button>
          </div>
        </label>

        <label v-if="esRegistro" class="campo">
          <span>Teléfono <small>(opcional)</small></span>
          <input
            v-model="formulario.telefono"
            type="tel"
            inputmode="numeric"
            autocomplete="tel"
            placeholder="9511234567"
          />
        </label>

        <ul v-if="errores.length" class="errores" role="alert">
          <li v-for="error in errores" :key="error">{{ error }}</li>
        </ul>

        <button type="submit" class="principal" :disabled="cargando">
          {{ cargando ? 'Un momento…' : esRegistro ? 'Crear cuenta' : 'Entrar' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login {
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 64px;
  align-items: center;
  min-height: calc(100vh - 90px);
  padding: 56px;
  background:
    linear-gradient(90deg, rgba(23, 17, 13, 0.96) 35%, rgba(23, 17, 13, 0.75)),
    radial-gradient(circle at 25% 40%, #4a3a2c 0%, transparent 60%);
}

.etiqueta {
  color: var(--dorado);
  font-family: var(--fuente-logo);
  font-size: 13px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0 20px;
  font-family: var(--fuente-titulo);
  font-size: 56px;
  font-weight: 400;
  line-height: 1.1;
}

.descripcion {
  max-width: 420px;
  color: var(--texto-suave);
  line-height: 1.7;
}

.tarjeta {
  padding: 40px;
  border: 1px solid var(--borde);
  background: var(--fondo-panel);
}

.pestanas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 28px;
  padding: 4px;
  border: 1px solid var(--borde);
  background: var(--fondo);
}

.pestanas button {
  padding: 10px;
  border: 0;
  background: transparent;
  color: var(--texto-suave);
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
}

.pestanas button.activa {
  background: var(--dorado);
  color: var(--fondo);
  font-weight: 700;
}

h2 {
  margin: 0 0 6px;
  font-family: var(--fuente-titulo);
  font-size: 30px;
  font-weight: 400;
}

.subtitulo {
  margin: 0 0 24px;
  color: var(--texto-suave);
  font-size: 14px;
}

.campo {
  display: block;
  margin-bottom: 18px;
}

.campo > span {
  display: block;
  margin-bottom: 8px;
  color: var(--texto-suave);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.campo small {
  text-transform: none;
  letter-spacing: 0;
}

input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--borde);
  background: var(--fondo-campo);
  color: var(--texto);
  outline: none;
}

input:focus {
  border-color: var(--dorado);
}

input::placeholder {
  color: #6f6255;
}

.con-boton {
  position: relative;
}

.con-boton input {
  padding-right: 80px;
}

.ver {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  border: 0;
  background: none;
  color: var(--dorado);
  font-size: 12px;
  cursor: pointer;
}

.errores {
  margin: 0 0 18px;
  padding: 12px 16px 12px 32px;
  border: 1px solid rgba(229, 138, 122, 0.4);
  background: rgba(229, 138, 122, 0.08);
  color: var(--error);
  font-size: 14px;
}

.principal {
  width: 100%;
  padding: 14px;
  border: 0;
  background: var(--dorado);
  color: var(--fondo);
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
}

.principal:hover:not(:disabled) {
  background: var(--dorado-claro);
}

.principal:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 900px) {
  .login {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 32px 16px;
  }
  h1 {
    font-size: 38px;
  }
  .tarjeta {
    padding: 24px;
  }
}
</style>