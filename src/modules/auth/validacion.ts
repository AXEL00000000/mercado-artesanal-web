import type { LocationQuery } from 'vue-router'

// Las mismas reglas que valida la API (auth.service.js)
export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const TELEFONO_VALIDO = /^[0-9]{10,15}$/
export const PASSWORD_MINIMO = 8

/**
 * Ruta a la que se regresa después de entrar: la de ?regreso= o el inicio.
 * Solo acepta rutas internas ("/pedidos"), nunca otra página ("//sitio.com").
 */
export function rutaDeRegreso(query: LocationQuery): string {
  const regreso = query.regreso
  if (typeof regreso === 'string' && regreso.startsWith('/') && !regreso.startsWith('//')) {
    return regreso
  }
  return '/'
}

/** Conserva ?regreso= al cambiar entre /login y /registro. */
export function consultaDeRegreso(query: LocationQuery): LocationQuery {
  return typeof query.regreso === 'string' ? { regreso: query.regreso } : {}
}