import { reactive } from 'vue'
import { authAPI } from './api'

/**
 * 全局状态管理（简化版 Pinia）
 */
export const store = reactive({
    // 当前用户
    user: null,

    // 加载状态
    loading: false,

    // 全局配置
    config: {
        algorithms: ['AES-256-GCM', 'ChaCha20-Poly1305', 'AES-128-GCM'],
        keyModes: ['QRNG-Auto', 'Custom-Seed'],
        defaultAlgorithm: 'AES-256-GCM'
    },

    // 是否已登录
    get isAuthenticated() {
        return !!this.user
    },

    // 是否为管理员
    get isAdmin() {
        return this.user?.role === 'admin'
    },

    // 登录
    async login(username, password) {
        this.loading = true
        try {
            const res = await authAPI.login(username, password)
            if (res.success) {
                this.user = res.user
                return { success: true }
            }
            return { success: false, message: res.message }
        } catch (error) {
            return { success: false, message: error.response?.data?.message || '登录失败' }
        } finally {
            this.loading = false
        }
    },

    // 登出
    async logout() {
        try {
            await authAPI.logout()
        } catch (e) {
            console.error('Logout error:', e)
        }
        this.user = null
    },

    // 检查登录状态
    async checkAuth() {
        try {
            const res = await authAPI.me()
            if (res.success) {
                this.user = res.user
                return true
            }
        } catch (e) {
            this.user = null
        }
        return false
    }
})

export default store
