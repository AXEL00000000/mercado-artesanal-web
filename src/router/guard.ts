import type { NavigationGuardWithThis, RouteLocationRaw } from 'vue-router'
import { useSesionStore } from '@/stores/sesion'

declare module 'vue-router' {
  interface RouteMeta {
    requiereSesion?: boolean
    soloAdmin?: boolean
    requiereTaller?: boolean
    titulo?: string
  }
}

export const guardGlobal: NavigationGuardWithThis<undefined> = async (destino) => {
  const sesion = useSesionStore()

  if (sesion.estaAutenticado && !sesion.perfilCargado) {
    try {
      await sesion.cargarPerfil()
    } catch {
      // Un 401 ya cerró la sesión en el cliente; con otros errores se sigue con el usuario guardado
    }
  }

  const necesitaSesion = destino.matched.some(
    (r) => r.meta.requiereSesion || r.meta.soloAdmin || r.meta.requiereTaller,
  )
  if (necesitaSesion && !sesion.estaAutenticado) {
    return { name: 'login', query: { regreso: destino.fullPath } } satisfies RouteLocationRaw
  }

  const inicio: RouteLocationRaw = { name: 'catalogo' }
  if (destino.matched.some((r) => r.meta.soloAdmin) && !sesion.esAdmin) return inicio
  if (destino.matched.some((r) => r.meta.requiereTaller) && !sesion.tieneTaller) return inicio

  return true
}
