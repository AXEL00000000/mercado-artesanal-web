<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSesionStore } from '@/stores/sesion'
import BotonBase from '@/shared/components/BotonBase.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import TarjetaAuth from '../components/TarjetaAuth.vue'
import CampoAuth from '../components/CampoAuth.vue'
import { EMAIL_VALIDO, consultaDeRegreso, rutaDeRegreso } from '../validacion'

const sesion = useSesionStore()
const route = useRoute()
const router = useRouter()

const datos = reactive({ email: '', password: '' })
const errores = reactive({ email: '', password: '' })
const errorApi = ref<unknown>(null)
const enviando = ref(false)

// Si ya hay sesión, no tiene caso mostrar el login
onMounted(() => {
  if (sesion.estaAutenticado) void router.replace(rutaDeRegreso(route.query))
})

function validar(): boolean {
  errores.email = EMAIL_VALIDO.test(datos.email.trim()) ? '' : 'Escribe un correo válido.'
  errores.password = datos.password ? '' : 'Escribe tu contraseña.'
  return !errores.email && !errores.password
}

async function entrar() {
  errorApi.value = null
  if (!validar() || enviando.value) return

  enviando.value = true
  try {
    await sesion.login({ email: datos.email.trim(), password: datos.password })
    await router.replace(rutaDeRegreso(route.query))
  } catch (error) {
    // 401 "Email o contraseña incorrectos", 403 "La cuenta está desactivada", sin conexión…
    errorApi.value = error
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TarjetaAuth titulo="Entrar" subtitulo="Ingresa con tu correo y contraseña.">
    <form novalidate @submit.prevent="entrar">
      <CampoAuth
        v-model="datos.email"
        etiqueta="Correo electrónico"
        tipo="email"
        autocomplete="email"
        placeholder="tucorreo@ejemplo.com"
        :error="errores.email"
      />
      <CampoAuth
        v-model="datos.password"
        etiqueta="Contraseña"
        tipo="password"
        autocomplete="current-password"
        :error="errores.password"
      />

      <MensajeError v-if="errorApi" :error="errorApi" />

      <BotonBase type="submit" bloque :cargando="enviando">
        {{ enviando ? 'Entrando…' : 'Entrar' }}
      </BotonBase>
    </form>

    <template #pie>
      ¿No tienes cuenta?
      <RouterLink :to="{ name: 'registro', query: consultaDeRegreso(route.query) }">
        Crea una aquí
      </RouterLink>
    </template>
  </TarjetaAuth>
</template>