import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'catalogo',
    component: () => import('./views/CatalogoView.vue'),
  },
  {
    path: '/productos/:slug',
    name: 'producto',
    component: () => import('./views/ProductoView.vue'),
    props: true,
    meta: { titulo: 'Producto' },
  },
  {
    path: '/talleres/:id',
    name: 'taller',
    component: () => import('./views/TallerView.vue'),
    props: true,
    meta: { titulo: 'Taller' },
  },
]

export default routes
