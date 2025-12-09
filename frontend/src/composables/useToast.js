import { reactive } from 'vue'

/**
 * 全局 Toast 状态管理
 */
export const toastState = reactive({
    message: '',
    type: 'info',

    show(message, type = 'info') {
        this.message = ''
        // 使用 nextTick 确保重置后再显示
        setTimeout(() => {
            this.message = message
            this.type = type
        }, 10)
    },

    success(message) {
        this.show(message, 'success')
    },

    error(message) {
        this.show(message, 'error')
    },

    warning(message) {
        this.show(message, 'warning')
    },

    info(message) {
        this.show(message, 'info')
    },

    clear() {
        this.message = ''
    }
})

export default toastState
