import { createRouter, createWebHistory } from 'vue-router'
import store from './store'

// 懒加载视图组件
const LoginView = () => import('./views/LoginView.vue')
const DashboardView = () => import('./views/DashboardView.vue')
const TransferView = () => import('./views/TransferView.vue')
const KeyManagementView = () => import('./views/KeyManagementView.vue')
const AuditView = () => import('./views/AuditView.vue')
const UserManagementView = () => import('./views/UserManagementView.vue')
const DeviceManagerView = () => import('./views/DeviceManagerView.vue')
const SettingsView = () => import('./views/SettingsView.vue')

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: DashboardView,
        meta: { requiresAuth: true }
    },
    {
        path: '/transfer',
        name: 'Transfer',
        component: TransferView,
        meta: { requiresAuth: true }
    },
    {
        path: '/keys',
        name: 'Keys',
        component: KeyManagementView,
        meta: { requiresAuth: true }
    },
    {
        path: '/audit',
        name: 'Audit',
        component: AuditView,
        meta: { requiresAuth: true }
    },
    {
        path: '/users',
        name: 'Users',
        component: UserManagementView,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/devices',
        name: 'Devices',
        component: DeviceManagerView,
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: SettingsView,
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
    // 如果需要认证且未登录
    if (to.meta.requiresAuth && !store.isAuthenticated) {
        // 尝试恢复登录状态
        const isAuth = await store.checkAuth()
        if (!isAuth) {
            return next('/login')
        }
    }

    // 如果需要管理员权限
    if (to.meta.requiresAdmin && !store.isAdmin) {
        return next('/')
    }

    // 已登录用户访问登录页，重定向到首页
    if (to.path === '/login' && store.isAuthenticated) {
        return next('/')
    }

    next()
})

export default router
