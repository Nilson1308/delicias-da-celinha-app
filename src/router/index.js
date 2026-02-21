import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Vender',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Vender' }
  },
  {
    path: '/historico',
    name: 'Historico',
    component: () => import('@/views/HistoricoView.vue'),
    meta: { title: 'Histórico' }
  },
  {
    path: '/produtos',
    name: 'Produtos',
    component: () => import('@/views/ProdutosView.vue'),
    meta: { title: 'Produtos' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} – Delícias da Celinha` : 'Delícias da Celinha'
})

export default router
