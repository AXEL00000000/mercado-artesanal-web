import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { get, post } from '@/shared/api/cliente'
import type { DatosLogin, DatosRegistro, RespuestaAuth, Usuario } from '@/shared/api/tipos'

const CLAVE_TOKEN = 'ma.token'
const CLAVE_USUARIO = 'ma.usuario'

function leerUsuarioGuardado(): Usuario | null {
  const guardado = localStorage.getItem(CLAVE_USUARIO)
  if (!guardado) return null
  try {
    return JSON.parse(guardado) as Usuario
  } catch {
    return null
  }
}

export const useSesionStore = defineStore('sesion', () => {
  const token = ref<string | null>(localStorage.getItem(CLAVE_TOKEN))
  const usuario = ref<Usuario | null>(leerUsuarioGuardado())
  const perfilCargado = ref(false)

  const estaAutenticado = computed(() => token.value !== null)
  const esAdmin = computed(() => usuario.value?.rol === 'admin')
  const tieneTaller = computed(() => Boolean(usuario.value?.productor))

  function guardar(nuevoToken: string | null, nuevoUsuario: Usuario | null) {
    token.value = nuevoToken
    usuario.value = nuevoUsuario
    if (nuevoToken) localStorage.setItem(CLAVE_TOKEN, nuevoToken)
    else localStorage.removeItem(CLAVE_TOKEN)
    if (nuevoUsuario) localStorage.setItem(CLAVE_USUARIO, JSON.stringify(nuevoUsuario))
    else localStorage.removeItem(CLAVE_USUARIO)
  }

  async function cargarPerfil() {
    const perfil = await get<Usuario>('/auth/perfil')
    guardar(token.value, perfil)
    perfilCargado.value = true
    return perfil
  }

  async function iniciar(respuesta: RespuestaAuth) {
    guardar(respuesta.token, respuesta.usuario)
    // login y registro no traen el taller; el perfil sí
    return cargarPerfil()
  }

  async function login(datos: DatosLogin) {
    return iniciar(await post<RespuestaAuth>('/auth/login', datos))
  }

  async function registrar(datos: DatosRegistro) {
    return iniciar(await post<RespuestaAuth>('/auth/registro', datos))
  }

  function logout() {
    guardar(null, null)
    perfilCargado.value = false
  }

  return {
    token,
    usuario,
    perfilCargado,
    estaAutenticado,
    esAdmin,
    tieneTaller,
    login,
    registrar,
    cargarPerfil,
    logout,
  }
})
