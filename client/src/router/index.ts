import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false, layout: 'blank' },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, title: '看板' },
    },
    {
      path: '/tasks',
      name: 'Tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true, title: '任务' },
    },
    {
      path: '/orders',
      name: 'Orders',
      component: () => import('@/views/OrdersView.vue'),
      meta: { requiresAuth: true, title: '订单' },
    },
    {
      path: '/orders/new',
      name: 'NewOrder',
      component: () => import('@/views/NewOrderView.vue'),
      meta: { requiresAuth: true, title: '录单', roles: ['admin', 'merchandiser'] },
    },
    {
      path: '/inventory',
      name: 'Inventory',
      component: () => import('@/views/InventoryView.vue'),
      meta: { requiresAuth: true, title: '库存' },
    },
    {
      path: '/inbound',
      name: 'Inbound',
      component: () => import('@/views/InboundView.vue'),
      meta: { requiresAuth: true, title: '入库', roles: ['admin'] },
    },
    {
      path: '/machines',
      name: 'Machines',
      component: () => import('@/views/MachinesView.vue'),
      meta: { requiresAuth: true, title: '机器' },
    },
    {
      path: '/workers',
      name: 'Workers',
      component: () => import('@/views/WorkersView.vue'),
      meta: { requiresAuth: true, title: '工人' },
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { requiresAuth: true, title: '报表' },
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('@/views/UsersView.vue'),
      meta: { requiresAuth: true, title: '用户管理', roles: ['admin'] },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 未登录 → 跳转登录页
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // 已登录访问登录页 → 跳转首页
  if (to.name === 'Login' && authStore.isAuthenticated) {
    return next({ name: 'Dashboard' })
  }

  // 角色权限检查
  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(authStore.user?.role || '')) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
