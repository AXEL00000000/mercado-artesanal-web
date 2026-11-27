<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSesionStore } from '@/stores/sesion'
import BotonBase from '@/shared/components/BotonBase.vue'
import MensajeError from '@/shared/components/MensajeError.vue'
import TarjetaAuth from '../components/TarjetaAuth.vue'
import CampoAuth from '../components/CampoAuth.vue'
import { destinoTrasSesion } from '@/shared/utils/navegacion'
import {
  EMAIL_VALIDO,
  PASSWORD_MINIMO,
  TELEFONO_VALIDO,
  consultaDeRegreso,
} from '../validacion'

const sesion = useSesionStore()
const route = useRoute()
const router = useRouter()

const datos = reactive({ nombre: '', email: '', password: '', telefono: '' })
const errores = reactive({ nombre: '', email: '', password: '', telefono: '' })
const errorApi = ref<unknown>(null)
const enviando = ref(false)

onMounted(() => {
  if (sesion.estaAutenticado) {
    void router.replace(destinoTrasSesion(sesion.usuario, route.query.regreso))
  }
})

function validar(): boolean {
  const telefono = datos.telefono.trim()
  errores.nombre = datos.nombre.trim() ? '' : 'Escribe tu nombre.'
  errores.email = EMAIL_VALIDO.test(datos.email.trim()) ? '' : 'Escribe un correo válido.'
  errores.password =
    datos.password.length >= PASSWORD_MINIMO
      ? ''
      : `La contraseña debe tener al menos ${PASSWORD_MINIMO} caracteres.`
  errores.telefono =
    !telefono || TELEFONO_VALIDO.test(telefono) ? '' : 'Solo números, de 10 a 15 dígitos.'
  return Object.values(errores).every((mensaje) => !mensaje)
}

async function crearCuenta() {
  errorApi.value = null
  if (!validar() || enviando.value) return

  enviando.value = true
  try {
    const telefono = datos.telefono.trim()
    await sesion.registrar({
      nombre: datos.nombre.trim(),
      email: datos.email.trim(),
      password: datos.password,
      ...(telefono && { telefono }),
    })
    await router.replace(destinoTrasSesion(sesion.usuario, route.query.regreso))
  } catch (error) {
    // 409 "Ya existe una cuenta con ese email", 400 "Datos inválidos" con detalles…
    errorApi.value = error
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TarjetaAuth titulo="Crear cuenta" subtitulo="Regístrate para comprar y seguir tus pedidos.">
    <form novalidate @submit.prevent="crearCuenta">
      <CampoAuth
        v-model="datos.nombre"
        etiqueta="Nombre completo"
        autocomplete="name"
        maxlength="120"
        :error="errores.nombre"
      />
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
        autocomplete="new-password"
        :ayuda="`Mínimo ${PASSWORD_MINIMO} caracteres.`"
        :error="errores.password"
      />
      <CampoAuth
        v-model="datos.telefono"
        etiqueta="Teléfono"
        tipo="tel"
        inputmode="numeric"
        autocomplete="tel"
        placeholder="9511234567"
        opcional
        ayuda="Solo números, de 10 a 15 dígitos."
        :error="errores.telefono"
      />

      <MensajeError v-if="errorApi" :error="errorApi" />

      <BotonBase type="submit" bloque :cargando="enviando">
        {{ enviando ? 'Creando tu cuenta…' : 'Crear cuenta' }}
      </BotonBase>
    </form>

    <template #pie>
      ¿Ya tienes cuenta?
      <RouterLink :to="{ name: 'login', query: consultaDeRegreso(route.query) }">Entra</RouterLink>
    </template>
  </TarjetaAuth>
</template>