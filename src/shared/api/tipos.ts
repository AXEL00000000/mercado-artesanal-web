export type Rol = 'usuario' | 'admin'
export type ModoVenta = 'fijo' | 'tratar'
export type EstadoVerificacion = 'pendiente' | 'aprobado' | 'rechazado'

export interface RespuestaError {
  error: string
  detalles?: string[]
  detalle?: string
}

export interface TallerResumen {
  id: number
  nombre_taller: string
  estado_verificacion: EstadoVerificacion
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  telefono: string | null
  rol: Rol
  activo?: boolean
  created_at?: string
  /** Solo viene en GET /auth/perfil; null si no tiene taller. */
  productor?: TallerResumen | null
}

export interface RespuestaAuth {
  usuario: Usuario
  token: string
}

export interface DatosLogin {
  email: string
  password: string
}

export interface DatosRegistro {
  nombre: string
  email: string
  password: string
  telefono?: string
}

export interface Categoria {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  total_productos?: number
}

export interface Comunidad {
  id: number
  nombre: string
  municipio: string
  distrito: string | null
  region: string
  total_productores?: number
}

export interface ComunidadResumen {
  id: number
  nombre: string
  municipio?: string
  region: string
}

export interface CategoriaResumen {
  slug: string
  nombre: string
}

/** Taller público (GET /productores, /productores/:id). */
export interface Taller {
  id: number
  nombre_taller: string
  artesano: string
  biografia: string | null
  foto_url: string | null
  whatsapp: string
  comunidad: ComunidadResumen
  total_productos: number
}

/** Elemento de GET /productos. */
export interface ProductoTarjeta {
  id: number
  nombre: string
  slug: string
  precio: number
  modo_venta: ModoVenta
  stock: number | null
  imagen: string | null
  categoria: CategoriaResumen
  productor: { id: number; nombre_taller: string }
  comunidad: ComunidadResumen
}

export interface ImagenProducto {
  id: number
  url: string
  orden: number
  es_principal: boolean
}

export interface MedidasCm {
  alto: number | null
  ancho: number | null
  largo: number | null
}

/** GET /productos/:slug */
export interface ProductoDetalle {
  id: number
  nombre: string
  slug: string
  descripcion: string | null
  modo_venta: ModoVenta
  precio: number
  stock: number | null
  material: string | null
  tecnica: string | null
  peso_g: number | null
  medidas_cm: MedidasCm
  imagenes: ImagenProducto[]
  categoria: CategoriaResumen
  productor: {
    id: number
    nombre_taller: string
    artesano: string
    biografia: string | null
    foto_url: string | null
    whatsapp: string
  }
  comunidad: ComunidadResumen
}

export interface PaginaProductos {
  pagina: number
  limite: number
  total: number
  total_paginas: number
  productos: ProductoTarjeta[]
}

export interface FiltrosProductos {
  categoria?: string
  comunidad?: number
  region?: string
  productor?: number
  modo?: ModoVenta
  q?: string
  orden?: 'recientes' | 'precio_asc' | 'precio_desc'
  pagina?: number
  limite?: number
}
