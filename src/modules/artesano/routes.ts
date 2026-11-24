import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/mi-taller',
    name: 'mi-taller',
    component: () => import('./views/MiTallerView.vue'),
    meta: { requiereSesion: true, titulo: 'Mi taller' },
  },
  {
    path: '/mi-taller/productos',
    name: 'mi-taller-productos',
    component: () => import('./views/ProductosView.vue'),
    meta: { requiereSesion: true, requiereTaller: true, titulo: 'Mis productos' },
  },
  {
    path: '/mi-taller/ventas',
    name: 'mi-taller-ventas',
    component: () => import('./views/VentasView.vue'),
    meta: { requiereSesion: true, requiereTaller: true, titulo: 'Ventas' },
  },
  {
    path: '/mi-taller/entregas',
    name: 'mi-taller-entregas',
    component: () => import('./views/EntregasView.vue'),
    meta: { requiereSesion: true, requiereTaller: true, titulo: 'Opciones de entrega' },
  },
  {
    path: '/mi-taller/consultas',
    name: 'mi-taller-consultas',
    component: () => import('./views/ConsultasView.vue'),
    meta: { requiereSesion: true, requiereTaller: true, titulo: 'Consultas' },
  },
]

export default routes
