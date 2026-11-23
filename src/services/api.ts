// Cliente para hablar con mercado-artesanal-api.
// Agrega el token JWT automáticamente y convierte los errores de la API en ApiError.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const CLAVE_TOKEN = 'mercado_artesanal_token'

export class ApiError extends Error {
  status: number
  detalles: string[]

  constructor(status: number, mensaje: string, detalles: string[] = []) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status // 0 = no hubo respuesta del servidor
    this.detalles = detalles // errores de validación que manda la API
  }
}

export function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN)
}

export function guardarToken(token: string | null): void {
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
  else localStorage.removeItem(CLAVE_TOKEN)
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  cuerpo?: unknown
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opciones.cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  const token = obtenerToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers,
      body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor. Revisa que la API esté encendida.')
  }

  // La API siempre responde JSON; si no, datos queda en null
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    const detalles = Array.isArray(datos?.detalles) ? (datos.detalles as string[]) : []
    throw new ApiError(respuesta.status, datos?.error ?? `Error ${respuesta.status}`, detalles)
  }
  return datos as T
}