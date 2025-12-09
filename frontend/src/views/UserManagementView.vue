<template>
  <div class="fade-in">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">用户管理</h1>
        <p class="text-gray-500 mt-1">管理系统用户账户</p>
      </div>
      <button @click="showAddModal = true" class="btn-primary flex items-center space-x-2">
        <Plus class="w-5 h-5" />
        <span>添加用户</span>
      </button>
    </div>
    
    <div class="glass-card p-6">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        <Loader2 class="w-6 h-6 animate-spin mx-auto" />
      </div>
      
      <table v-else class="w-full">
        <thead class="bg-dark-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">用户</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">角色</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">部门</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">状态</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr v-for="user in users" :key="user.id" class="hover:bg-dark-700/50">
            <td class="px-4 py-3">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span class="text-indigo-400 text-sm">{{ user.name?.charAt(0) || 'U' }}</span>
                </div>
                <div>
                  <p class="text-white">{{ user.name }}</p>
                  <p class="text-gray-500 text-xs">{{ user.username }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span :class="[
                'px-2 py-1 rounded text-xs',
                user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
              ]">{{ user.role === 'admin' ? '管理员' : '用户' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ user.department || '-' }}</td>
            <td class="px-4 py-3">
              <button 
                @click="toggleStatus(user)"
                :class="[
                  'px-2 py-1 rounded text-xs transition-colors',
                  user.status === 'active' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                ]"
              >
                {{ user.status === 'active' ? '正常' : '已锁定' }}
              </button>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center space-x-2">
                <button @click="editUser(user)" class="text-indigo-400 hover:text-indigo-300 text-sm">
                  编辑
                </button>
                <button 
                  v-if="user.username !== 'admin'"
                  @click="deleteUser(user)" 
                  class="text-red-400 hover:text-red-300 text-sm"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 添加/编辑用户弹窗 -->
    <div v-if="showAddModal || editingUser" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="glass-card p-6 w-full max-w-md">
        <h2 class="text-xl font-bold text-white mb-6">{{ editingUser ? '编辑用户' : '添加用户' }}</h2>
        
        <form @submit.prevent="submitUser" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2">用户名</label>
            <input 
              v-model="form.username" 
              type="text" 
              class="input-field"
              :disabled="!!editingUser"
              required
            />
          </div>
          <div v-if="!editingUser">
            <label class="block text-sm text-gray-400 mb-2">密码</label>
            <input v-model="form.password" type="password" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">显示名称</label>
            <input v-model="form.name" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">部门</label>
            <input v-model="form.department" type="text" class="input-field" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">角色</label>
            <select v-model="form.role" class="input-field">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button type="submit" class="flex-1 btn-primary">
              {{ editingUser ? '保存' : '创建' }}
            </button>
            <button type="button" @click="closeModal" class="flex-1 btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usersAPI } from '../api'
import { Plus, Loader2 } from 'lucide-vue-next'

const loading = ref(true)
const users = ref([])
const showAddModal = ref(false)
const editingUser = ref(null)

const form = reactive({
  username: '',
  password: '',
  name: '',
  department: '',
  role: 'user'
})

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.name = ''
  form.department = ''
  form.role = 'user'
}

const closeModal = () => {
  showAddModal.value = false
  editingUser.value = null
  resetForm()
}

const editUser = (user) => {
  editingUser.value = user
  form.username = user.username
  form.name = user.name
  form.department = user.department
  form.role = user.role
}

const submitUser = async () => {
  try {
    if (editingUser.value) {
      await usersAPI.update(editingUser.value.id, {
        name: form.name,
        department: form.department,
        role: form.role
      })
    } else {
      await usersAPI.create({
        username: form.username,
        password: form.password,
        name: form.name || form.username,
        department: form.department,
        role: form.role
      })
    }
    await loadUsers()
    closeModal()
  } catch (e) {
    alert(e.response?.data?.message || '操作失败')
  }
}

const toggleStatus = async (user) => {
  const newStatus = user.status === 'active' ? 'locked' : 'active'
  try {
    await usersAPI.update(user.id, { status: newStatus })
    user.status = newStatus
  } catch (e) {
    alert('更新失败')
  }
}

const deleteUser = async (user) => {
  if (!confirm(`确定删除用户 ${user.name}？`)) return
  try {
    await usersAPI.delete(user.id)
    await loadUsers()
  } catch (e) {
    alert(e.response?.data?.message || '删除失败')
  }
}

const loadUsers = async () => {
  try {
    const res = await usersAPI.list()
    if (res.success) users.value = res.users
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  await loadUsers()
  loading.value = false
})
</script>
