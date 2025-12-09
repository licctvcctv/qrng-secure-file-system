<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">用户管理</h1>
      <p class="text-gray-500 mt-1">管理系统用户</p>
    </div>
    
    <div class="glass-card p-6">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        <Loader2 class="w-6 h-6 animate-spin mx-auto" />
      </div>
      
      <table v-else class="w-full">
        <thead class="bg-dark-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">用户名</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">角色</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">部门</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">状态</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr v-for="user in users" :key="user.id" class="hover:bg-dark-700/50">
            <td class="px-4 py-3 text-white">{{ user.name }}</td>
            <td class="px-4 py-3">
              <span :class="[
                'px-2 py-1 rounded text-xs',
                user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
              ]">{{ user.role === 'admin' ? '管理员' : '用户' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ user.department || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="[
                'status-dot inline-block',
                user.status === 'active' ? 'status-online' : 'status-offline'
              ]"></span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usersAPI } from '../api'
import { Loader2 } from 'lucide-vue-next'

const loading = ref(true)
const users = ref([])

onMounted(async () => {
  try {
    const res = await usersAPI.list()
    if (res.success) users.value = res.users
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
