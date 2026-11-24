import { createRouter, createWebHistory } from 'vue-router'
import { guardGlobal } from './guard'
import authRoutes from '@/modules/auth/routes'
import catalogoRoutes from '@/modules/catalogo/routes'
import compraRoutes from '@/modules/compra/routes'
import artesanoRoutes from '@/modules/artesano/routes'
import adminRoutes from '@/modules/admin/routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...catalogoRoutes,
    ...compraRoutes,
    ...artesanoRoutes,
    ...adminRoutes,
    {
      path: '/:rutaNoEncontrada(.*)*',
      name: 'no-encontrado',
      component: () => import('@/shared/views/NoEncontrado.vue'),
      meta: { titulo: 'Página no encontrada' },
    },
  ],
  scrollBehavior: (_destino, _origen, guardada) => guardada ?? { top: 0 },
})

router.beforeEach(guardGlobal)

router.afterEach((destino) => {
  document.title = destino.meta.titulo
    ? `${destino.meta.titulo} · Mercado Artesanal`
    : 'Mercado Artesanal'
})

export default router
