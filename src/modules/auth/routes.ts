import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
    meta: { titulo: 'Entrar' },
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('./views/RegistroView.vue'),
    meta: { titulo: 'Crear cuenta' },
  },
]

export default routes
