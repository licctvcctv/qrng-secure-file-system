<template>
  <div class="min-h-screen flex items-center justify-center bg-dark-900">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 neon-glow">
          <Shield class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white neon-text">QRNG Secure Vault</h1>
        <p class="text-gray-500 mt-2">量子随机数加密系统</p>
      </div>
      
      <!-- 登录表单 -->
      <div class="glass-card p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 用户名 -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">用户名</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                v-model="form.username"
                type="text"
                placeholder="请输入用户名"
                class="input-field pl-10"
                :disabled="loading"
              />
            </div>
          </div>
          
          <!-- 密码 -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">密码</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                class="input-field pl-10 pr-10"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <!-- 错误提示 -->
          <div v-if="error" class="px-4 py-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {{ error }}
          </div>
          
          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            <span>{{ loading ? '登录中...' : '登录' }}</span>
          </button>
        </form>
        
        <!-- 演示账号提示 -->
        <div class="mt-6 pt-6 border-t border-gray-700">
          <p class="text-center text-gray-500 text-sm">演示账号</p>
          <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
            <button 
              @click="fillDemo('admin', 'admin123')"
              class="px-3 py-2 bg-dark-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              管理员: admin
            </button>
            <button 
              @click="fillDemo('user', 'user123')"
              class="px-3 py-2 bg-dark-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              用户: user
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import store from '../store'
import { Shield, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'

const router = useRouter()

const form = reactive({
  username: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

// 登录处理
const handleLogin = async () => {
  error.value = ''
  
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码'
    return
  }
  
  loading.value = true
  
  const result = await store.login(form.username, form.password)
  
  loading.value = false
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.message || '登录失败'
  }
}

// 填充演示账号
const fillDemo = (username, password) => {
  form.username = username
  form.password = password
}
</script>
