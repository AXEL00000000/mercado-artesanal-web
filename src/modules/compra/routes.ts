import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/carrito',
    name: 'carrito',
    component: () => import('./views/CarritoView.vue'),
    meta: { titulo: 'Carrito' },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('./views/CheckoutView.vue'),
    meta: { requiereSesion: true, titulo: 'Pagar' },
  },
  {
    path: '/pedidos',
    name: 'pedidos',
    component: () => import('./views/PedidosView.vue'),
    meta: { requiereSesion: true, titulo: 'Mis compras' },
  },
  {
    // Mercado Pago regresa aquí con ?pago=aprobado|rechazado|pendiente
    path: '/pedidos/:id',
    name: 'pedido',
    component: () => import('./views/PedidoView.vue'),
    props: true,
    meta: { requiereSesion: true, titulo: 'Pedido' },
  },
]

export default routes
