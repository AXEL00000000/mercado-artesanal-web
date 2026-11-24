import router from '@/router'
import { useSesionStore } from '@/stores/sesion'
import type { RespuestaError } from './tipos'

const URL_BASE = import.meta.env.VITE_API_URL.replace(/\/$/, '')

export class ErrorApi extends Error {
  readonly status: number
  readonly mensaje: string
  readonly detalles: string[]

  constructor(status: number, mensaje: string, detalles: string[] = []) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.mensaje = mensaje
    this.detalles = detalles
  }
}

export type Parametros = Record<string, string | number | boolean | null | undefined>
type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function construirUrl(ruta: string, parametros?: Parametros): string {
  const url = new URL(URL_BASE + (ruta.startsWith('/') ? ruta : `/${ruta}`))
  for (const [clave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined && valor !== null && valor !== '') {
      url.searchParams.set(clave, String(valor))
    }
  }
  return url.toString()
}

function esRespuestaError(valor: unknown): valor is RespuestaError {
  return typeof valor === 'object' && valor !== null && 'error' in valor
}

async function leerCuerpo(respuesta: Response): Promise<unknown> {
  if (respuesta.status === 204) return undefined
  const texto = await respuesta.text()
  if (!texto) return undefined
  try {
    return JSON.parse(texto)
  } catch {
    return texto
  }
}

async function solicitar<T>(
  metodo: Metodo,
  ruta: string,
  cuerpo?: unknown,
  parametros?: Parametros,
): Promise<T> {
  const sesion = useSesionStore()
  const encabezados = new Headers({ Accept: 'application/json' })
  if (sesion.token) encabezados.set('Authorization', `Bearer ${sesion.token}`)

  let body: BodyInit | undefined
  if (cuerpo instanceof FormData) {
    body = cuerpo
  } else if (cuerpo !== undefined) {
    encabezados.set('Content-Type', 'application/json')
    body = JSON.stringify(cuerpo)
  }

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta, parametros), {
      method: metodo,
      headers: encabezados,
      body,
    })
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  const datos = await leerCuerpo(respuesta)

  if (!respuesta.ok) {
    if (respuesta.status === 401 && sesion.estaAutenticado) {
      sesion.logout()
      const regreso = router.currentRoute.value.fullPath
      void router.push({ name: 'login', query: regreso === '/' ? {} : { regreso } })
    }
    const mensaje = esRespuestaError(datos) ? datos.error : `Error ${respuesta.status}`
    const detalles = esRespuestaError(datos)
      ? (datos.detalles ?? (datos.detalle ? [datos.detalle] : []))
      : []
    throw new ErrorApi(respuesta.status, mensaje, detalles)
  }

  return datos as T
}

export const get = <T>(ruta: string, parametros?: Parametros) =>
  solicitar<T>('GET', ruta, undefined, parametros)

export const post = <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('POST', ruta, cuerpo)

export const put = <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('PUT', ruta, cuerpo)

export const patch = <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('PATCH', ruta, cuerpo)

export const del = <T = void>(ruta: string) => solicitar<T>('DELETE', ruta)

/** Para subir archivos: el navegador pone el Content-Type multipart. */
export const enviarFormulario = <T>(
  ruta: string,
  datos: FormData,
  metodo: 'POST' | 'PUT' | 'PATCH' = 'POST',
) => solicitar<T>(metodo, ruta, datos)

export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return error.mensaje
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado.'
}
