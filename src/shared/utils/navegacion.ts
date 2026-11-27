import type { Usuario } from '@/shared/api/tipos'

export type TipoUsuario = 'visitante' | 'comprador' | 'artesano' | 'admin'

export interface EnlaceNavegacion {
  etiqueta: string
  ruta: string
  /** Prefijos de ruta que marcan el enlace como activo. */
  activoEn: string[]
}

const RUTAS_SIN_REGRESO = ['/login', '/registro']

export function tipoDeUsuario(usuario: Usuario | null | undefined): TipoUsuario {
  if (!usuario) return 'visitante'
  if (usuario.rol === 'admin') return 'admin'
  return usuario.productor ? 'artesano' : 'comprador'
}

const CATALOGO: EnlaceNavegacion = {
  etiqueta: 'Catálogo',
  ruta: '/',
  activoEn: ['/', '/productos/'],
}
const TALLERES: EnlaceNavegacion = {
  etiqueta: 'Talleres',
  ruta: '/talleres',
  activoEn: ['/talleres'],
}
const MIS_COMPRAS: EnlaceNavegacion = {
  etiqueta: 'Mis compras',
  ruta: '/pedidos',
  activoEn: ['/pedidos'],
}
const VENDER: EnlaceNavegacion = {
  etiqueta: 'Vende tus artesanías',
  ruta: '/mi-taller',
  activoEn: ['/mi-taller'],
}
const MI_TALLER: EnlaceNavegacion = {
  etiqueta: 'Mi taller',
  ruta: '/mi-taller',
  activoEn: ['/mi-taller'],
}
const ADMINISTRACION: EnlaceNavegacion = {
  etiqueta: 'Administración',
  ruta: '/admin/talleres',
  activoEn: ['/admin'],
}

/** Enlaces del encabezado, iguales para todos. */
export const ENLACES_PRINCIPALES: readonly EnlaceNavegacion[] = [CATALOGO, TALLERES]

/** Opciones del menú de la cuenta (avatar) según el tipo de usuario. */
export function opcionesDeCuenta(tipo: TipoUsuario): EnlaceNavegacion[] {
  switch (tipo) {
    case 'visitante':
      return []
    case 'comprador':
      return [MIS_COMPRAS, VENDER]
    case 'artesano':
      return [MI_TALLER, MIS_COMPRAS]
    case 'admin':
      return [ADMINISTRACION]
  }
}

/** "/" solo coincide exacto; los demás prefijos incluyen sus subrutas. */
export function estaActivo(enlace: EnlaceNavegacion, rutaActual: string): boolean {
  return enlace.activoEn.some((prefijo) => {
    if (prefijo === '/') return rutaActual === '/'
    if (prefijo.endsWith('/')) return rutaActual.startsWith(prefijo)
    return rutaActual === prefijo || rutaActual.startsWith(`${prefijo}/`)
  })
}

/** Solo rutas de esta app: descarta "//otro-sitio.com", "/\\otro" y URLs completas. */
export function esRutaInterna(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    valor.startsWith('/') &&
    !valor.startsWith('//') &&
    !valor.startsWith('/\\')
  )
}

/**
 * A dónde ir después de entrar o registrarse.
 * `regreso` suele venir de `route.query.regreso`.
 */
export function destinoTrasSesion(usuario: Usuario | null | undefined, regreso?: unknown): string {
  if (esRutaInterna(regreso)) {
    const ruta = regreso.split(/[?#]/)[0] ?? regreso
    if (!RUTAS_SIN_REGRESO.includes(ruta)) return regreso
  }
  switch (tipoDeUsuario(usuario)) {
    case 'admin':
      return '/admin/talleres'
    case 'artesano':
      return '/mi-taller'
    default:
      return '/'
  }
}
