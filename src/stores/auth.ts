// Estado de la sesión: token, usuario y acciones de login / registro / logout.
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError, guardarToken, obtenerToken, peticion } from '@/services/api'
import type { DatosRegistro, RespuestaAuth, Usuario } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(obtenerToken())
  const usuario = ref<Usuario | null>(null)

  const estaAutenticado = computed(() => token.value !== null)
  const esAdmin = computed(() => usuario.value?.rol === 'admin')

  function iniciarSesion(respuesta: RespuestaAuth) {
    token.value = respuesta.token
    usuario.value = respuesta.usuario
    guardarToken(respuesta.token)
  }

  async function login(email: string, password: string) {
    const respuesta = await peticion<RespuestaAuth>('/auth/login', {
      metodo: 'POST',
      cuerpo: { email, password },
    })
    iniciarSesion(respuesta)
  }

  async function registrar(datos: DatosRegistro) {
    const respuesta = await peticion<RespuestaAuth>('/auth/registro', {
      metodo: 'POST',
      cuerpo: datos,
    })
    iniciarSesion(respuesta)
  }

  // Al recargar la página solo tenemos el token: pedimos el usuario a la API.
  async function cargarPerfil() {
    if (!token.value) return
    try {
      usuario.value = await peticion<Usuario>('/auth/perfil')
    } catch (error) {
      // Token vencido (7 días) o inválido: cerramos la sesión
      if (error instanceof ApiError && error.status === 401) cerrarSesion()
    }
  }

  function cerrarSesion() {
    token.value = null
    usuario.value = null
    guardarToken(null)
  }

  return { token, usuario, estaAutenticado, esAdmin, login, registrar, cargarPerfil, cerrarSesion }
})