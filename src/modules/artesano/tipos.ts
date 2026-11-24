/** Contratos y diccionarios del panel del artesano (/api/mi-taller/*). */
import type {
  ComunidadResumen,
  EstadoVerificacion,
  ImagenProducto,
  MedidasCm,
  ModoVenta,
} from '@/shared/api/tipos'

/** Respuesta de GET / POST / PUT /mi-taller (estado completo del taller propio). */
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
  comunidad: ComunidadResumen
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

export interface CategoriaProducto {
  id: number
  slug: string
  nombre: string
}

export interface MiProductoBase {
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
  categoria: CategoriaProducto
  created_at: string
  updated_at: string
}

/** El listado GET /mi-taller/productos solo devuelve la URL de la imagen principal. */
export interface MiProductoLista extends MiProductoBase {
  imagen: string | null
}

/** El detalle individual GET /mi-taller/productos/:id devuelve la galería completa. */
export interface MiProductoDetalle extends MiProductoBase {
  imagenes: ImagenProducto[]
}

/** En modo 'fijo' stock es obligatorio; en 'tratar', null representa venta sobre pedido. */
export interface ProductoEntrada {
  categoria_id: number
  nombre: string
  descripcion?: string | null
  modo_venta: ModoVenta
  precio: number
  stock?: number | null
  material?: string | null
  tecnica?: string | null
  peso_g?: number | null
  alto_cm?: number | null
  ancho_cm?: number | null
  largo_cm?: number | null
}

export type TipoEntrega = 'envia' | 'costo_fijo' | 'recoger_taller'

export interface OpcionEntrega {
  id: number
  productor_id: number
  tipo: TipoEntrega
  costo_fijo: number | null
  instrucciones: string | null
  activo: boolean
}

/** costo_fijo solo se acepta cuando tipo === 'costo_fijo'. */
export interface OpcionEntregaCrear {
  tipo: TipoEntrega
  costo_fijo?: number | null
  instrucciones?: string | null
  activo?: boolean
}

/** PUT /mi-taller/opciones-entrega/:id rechaza el campo tipo si se envía. */
export interface OpcionEntregaEditar {
  costo_fijo?: number | null
  instrucciones?: string | null
  activo?: boolean
}

export type EstadoPedido = 'pendiente_pago' | 'pagado' | 'enviado' | 'entregado' | 'cancelado'
export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado'
export type EstadoEnvio = 'pendiente' | 'guia_generada' | 'en_transito' | 'entregado'

export interface PedidoEnvio {
  tipo: TipoEntrega
  opcion_entrega_id: number
  costo: number
  paqueteria: string | null
  servicio: string | null
  destinatario: string | null
  telefono: string | null
  calle: string | null
  colonia: string | null
  ciudad: string | null
  entidad_federativa: string | null
  cp: string | null
  guia: string | null
  tracking_url: string | null
  estado_envio: EstadoEnvio
}

export interface PedidoProducto {
  producto_id: number
  nombre_producto: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  imagen: string | null
}

export interface PedidoTaller {
  id: number
  estado: EstadoPedido
  estado_pago: EstadoPago | null
  subtotal: number
  costo_envio: number
  total: number
  nota: string | null
  productor: {
    id: number
    nombre_taller: string
  }
  comprador: {
    id: number
    nombre: string
    email: string
  }
  envio: PedidoEnvio
  productos: PedidoProducto[]
  created_at: string
  updated_at: string
}

/** guia y tracking_url solo se envían cuando el nuevo estado es 'enviado'. */
export interface CambioEstadoPedido {
  estado: 'enviado' | 'entregado' | 'cancelado'
  guia?: string
  tracking_url?: string
}

export type OrigenConsulta = 'boton_tratar' | 'link_dudas'
export type CanalConsulta = 'web' | 'app'

export interface ResumenConsultaProducto {
  producto_id: number
  nombre: string
  slug: string
  total: number
  boton_tratar: number
  link_dudas: number
  ultima: string
}

/** usuario es null cuando la consulta se originó sin sesión iniciada. */
export interface ConsultaItem {
  id: number
  origen: OrigenConsulta
  canal: CanalConsulta
  created_at: string
  producto: {
    id: number
    nombre: string
  }
  usuario: {
    id: number
    nombre: string
  } | null
}

export interface RespuestaConsultasTaller {
  total: number
  por_producto: ResumenConsultaProducto[]
  consultas: ConsultaItem[]
}

export const ETIQUETA_VERIFICACION: Record<EstadoVerificacion, string> = {
  pendiente: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

export const ETIQUETA_ENTREGA: Record<TipoEntrega, string> = {
  envia: 'Envío por paquetería (Envia.com)',
  costo_fijo: 'Envío con costo fijo',
  recoger_taller: 'Recoger en taller',
}

export const DESCRIPCION_ENTREGA: Record<TipoEntrega, string> = {
  envia: 'Cotiza tarifas en tiempo real según el código postal y dimensiones del producto.',
  costo_fijo: 'Tarifa única configurada por tu taller para los envíos.',
  recoger_taller: 'El comprador acude directamente a la dirección de tu taller sin costo.',
}

export const ETIQUETA_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export const ETIQUETA_ESTADO_PAGO: Record<EstadoPago, string> = {
  pendiente: 'Pago pendiente',
  aprobado: 'Pago aprobado',
  rechazado: 'Pago rechazado',
  reembolsado: 'Pago reembolsado',
}

export const ETIQUETA_ORIGEN_CONSULTA: Record<OrigenConsulta, string> = {
  boton_tratar: 'Precio a tratar',
  link_dudas: 'Duda en producto',
}

export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
