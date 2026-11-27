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

export type EstadoPedido = 'pendiente_pago' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'
export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado'

/** GET /mi-taller, POST /mi-taller y PATCH /admin/productores/:id */
export interface MiTaller {
  id: number
  usuario_id: number
  nombre_taller: string
  biografia: string | null
  foto_url: string | null
  whatsapp: string
  direccion_taller: string
  cp_taller: string
  estado_verificacion: EstadoVerificacion
  /** Solo cuando el taller está rechazado. */
  motivo_rechazo: string | null
  comunidad: { id: number; nombre: string; municipio: string; region: string }
  created_at: string
}

export interface TallerEntrada {
  comunidad_id: number
  nombre_taller: string
  biografia?: string | null
  foto_url?: string | null
  whatsapp: string
  direccion_taller: string
  cp_taller: string
}

/**
 * PUT /mi-taller (solo se envían los campos que cambian).
 * `volvio_a_revision` es true si el taller pasó a 'pendiente' con este cambio:
 * un aprobado al cambiar nombre o comunidad, un rechazado con cualquier edición.
 */
export interface MiTallerActualizado extends MiTaller {
  volvio_a_revision: boolean
}

/** GET /admin/productores */
export interface TallerAdmin extends MiTaller {
  artesano: { id: number; nombre: string; email: string; telefono: string | null }
  /** Activos e inactivos, sin los eliminados. */
  total_productos: number
}

/** PATCH /admin/productores/:id: el motivo es obligatorio al rechazar. */
export type DecisionTaller = { estado: 'aprobado' } | { estado: 'rechazado'; motivo: string }

/**
 * Producto propio en /mi-taller/productos. Los eliminados ya no aparecen.
 * DELETE /mi-taller/productos/:id hace un borrado lógico y responde 204 sin cuerpo.
 */
export interface MiProducto {
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
  activo: boolean
  categoria: { id: number; slug: string; nombre: string }
  /** Foto principal; viene en el listado. */
  imagen?: string | null
  /** Todas las fotos; vienen en el detalle. */
  imagenes?: ImagenProducto[]
  created_at: string
  updated_at: string
}

/**
 * POST /pedidos/:id/pago (201). Con `reutilizado: true` es la misma order de Mercado Pago
 * que ya estaba abierta, no un cobro nuevo. Si ya se pagó responde 409 con
 * MENSAJE_PEDIDO_YA_PAGADO.
 */
export interface RespuestaPago {
  pago_id: number
  pedido_id: number
  mp_order_id: string
  estado: EstadoPago
  checkout_url: string
  reutilizado: boolean
}

export const MENSAJE_PEDIDO_YA_PAGADO = 'El pedido ya fue pagado'
