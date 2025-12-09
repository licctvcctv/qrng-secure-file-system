<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">设置</h1>
      <p class="text-gray-500 mt-1">个人资料和偏好设置</p>
    </div>
    
    <div class="glass-card p-6 max-w-xl">
      <h2 class="text-lg font-medium text-white mb-6">个人资料</h2>
      
      <form @submit.prevent="saveProfile" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-2">用户名</label>
          <input :value="store.user?.username" disabled class="input-field opacity-50 cursor-not-allowed" />
          <p class="text-xs text-gray-600 mt-1">用户名不可修改</p>
        </div>
        
        <div>
          <label class="block text-sm text-gray-400 mb-2">显示名称</label>
          <input v-model="form.name" type="text" class="input-field" />
        </div>
        
        <div>
          <label class="block text-sm text-gray-400 mb-2">部门</label>
          <input v-model="form.department" type="text" class="input-field" />
        </div>
        
        <div class="pt-4">
          <button 
            type="submit" 
            :disabled="saving"
            class="btn-primary flex items-center space-x-2"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <span>{{ saving ? '保存中...' : '保存更改' }}</span>
          </button>
        </div>
      </form>
    </div>
    
    <!-- 修改密码 -->
    <div class="glass-card p-6 max-w-xl mt-6">
      <h2 class="text-lg font-medium text-white mb-6">修改密码</h2>
      
      <form @submit.prevent="changePassword" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-2">新密码</label>
          <input v-model="passwordForm.password" type="password" class="input-field" minlength="6" />
        </div>
        
        <div>
          <label class="block text-sm text-gray-400 mb-2">确认密码</label>
          <input v-model="passwordForm.confirmPassword" type="password" class="input-field" />
        </div>
        
        <div class="pt-4">
          <button 
            type="submit" 
            :disabled="changingPassword"
            class="btn-secondary flex items-center space-x-2"
          >
            <Loader2 v-if="changingPassword" class="w-4 h-4 animate-spin" />
            <span>{{ changingPassword ? '修改中...' : '修改密码' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import store from '../store'
import { usersAPI } from '../api'
import toast from '../composables/useToast'
import { Loader2 } from 'lucide-vue-next'

const saving = ref(false)
const changingPassword = ref(false)

const form = reactive({
  name: '',
  department: ''
})

const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 初始化表单
onMounted(() => {
  if (store.user) {
    form.name = store.user.name || ''
    form.department = store.user.department || ''
  }
})

// 保存个人资料
const saveProfile = async () => {
  if (!store.user) return
  
  saving.value = true
  try {
    await usersAPI.update(store.user.id, {
      name: form.name,
      department: form.department
    })
    
    // 更新本地状态
    store.user.name = form.name
    store.user.department = form.department
    
    toast.success('资料已保存')
  } catch (e) {
    toast.error(e.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (!store.user) return
  
  if (passwordForm.password !== passwordForm.confirmPassword) {
    toast.error('两次输入的密码不一致')
    return
  }
  
  if (passwordForm.password.length < 6) {
    toast.error('密码长度至少 6 位')
    return
  }
  
  changingPassword.value = true
  try {
    await usersAPI.update(store.user.id, {
      password: passwordForm.password
    })
    
    passwordForm.password = ''
    passwordForm.confirmPassword = ''
    
    toast.success('密码已修改')
  } catch (e) {
    toast.error(e.response?.data?.message || '修改失败')
  } finally {
    changingPassword.value = false
  }
}
</script>
