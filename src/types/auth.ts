// Tipos que devuelve mercado-artesanal-api en /auth/*

export type Rol = 'usuario' | 'admin'

export interface TallerResumen {
  id: number
  nombre_taller: string
  estado_verificacion: 'pendiente' | 'aprobado' | 'rechazado'
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  telefono: string | null
  rol: Rol
  created_at?: string
  // Solo viene en GET /auth/perfil (null si el usuario no tiene taller)
  productor?: TallerResumen | null
}

// Respuesta de POST /auth/login y POST /auth/registro
export interface RespuestaAuth {
  usuario: Usuario
  token: string
}

export interface DatosRegistro {
  nombre: string
  email: string
  password: string
  telefono?: string
}