import axios from 'axios'

// API 基础配置
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api',
    timeout: 30000,
    withCredentials: true, // 携带 Cookie
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器
api.interceptors.request.use(
    config => {
        // 可以在这里添加 token 等
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
api.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        const message = error.response?.data?.message || '网络错误'
        console.error('API Error:', message)
        return Promise.reject(error)
    }
)

// 认证 API
export const authAPI = {
    login: (username, password) => api.post('/login', { username, password }),
    logout: () => api.post('/logout'),
    me: () => api.get('/me')
}

// 密钥/加密 API
export const keysAPI = {
    list: () => api.get('/keys'),
    simulate: (data) => api.post('/encrypt/simulate', data),
    encrypt: (formData) => api.post('/encrypt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    decrypt: (keyId) => api.post('/decrypt', { key_id: keyId })
}

// 用户管理 API
export const usersAPI = {
    list: () => api.get('/users'),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`)
}

// 设备管理 API
export const devicesAPI = {
    list: () => api.get('/devices'),
    add: (data) => api.post('/devices', data),
    updateStatus: (id, status) => api.patch(`/devices/${id}/status`, { status }),
    delete: (id) => api.delete(`/devices/${id}`)
}

// 审计日志 API
export const logsAPI = {
    list: (params = {}) => api.get('/logs', { params }),
    report: (data) => api.post('/logs', data),
    reset: () => api.post('/reset')
}

// 仪表盘 API
export const dashboardAPI = {
    stats: () => api.get('/dashboard/stats')
}

export default api
