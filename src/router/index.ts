import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'

// Datos extra que puede llevar cada ruta
declare module 'vue-router' {
  interface RouteMeta {
    requiereAuth?: boolean // solo con sesión iniciada
    soloInvitados?: boolean // solo sin sesión (login)
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'inicio', component: HomeView },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { soloInvitados: true },
    },
    {
      path: '/mi-cuenta',
      name: 'mi-cuenta',
      component: () => import('@/views/MiCuentaView.vue'),
      meta: { requiereAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiereAuth && !auth.estaAutenticado) {
    // Lo mandamos al login y después lo regresamos a donde iba
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.soloInvitados && auth.estaAutenticado) {
    return { name: 'inicio' }
  }
})

export default router