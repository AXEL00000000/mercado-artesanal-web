import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/admin/talleres',
    name: 'admin-talleres',
    component: () => import('./views/TalleresView.vue'),
    meta: { soloAdmin: true, titulo: 'Talleres · Admin' },
  },
  {
    path: '/admin/catalogos',
    name: 'admin-catalogos',
    component: () => import('./views/CatalogosView.vue'),
    meta: { soloAdmin: true, titulo: 'Catálogos · Admin' },
  },
]

export default routes
