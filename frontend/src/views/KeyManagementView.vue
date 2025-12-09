<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">密钥管理</h1>
      <p class="text-gray-500 mt-1">查看和管理加密密钥</p>
    </div>
    
    <!-- 搜索和筛选 -->
    <div class="flex items-center space-x-4 mb-6">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          v-model="search"
          type="text"
          placeholder="搜索文件名或密钥 ID..."
          class="input-field pl-10"
        />
      </div>
    </div>
    
    <!-- 密钥列表 -->
    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-500">
        <Loader2 class="w-6 h-6 animate-spin mx-auto" />
      </div>
      
      <div v-else-if="filteredKeys.length === 0" class="p-8 text-center text-gray-500">
        暂无密钥记录
      </div>
      
      <table v-else class="w-full">
        <thead class="bg-dark-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">文件名</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">密钥 ID</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">算法</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">创建时间</th>
            <th class="px-4 py-3 text-left text-xs text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800">
          <tr v-for="key in filteredKeys" :key="key.id" class="hover:bg-dark-700/50">
            <td class="px-4 py-3">
              <div class="flex items-center space-x-3">
                <Key class="w-5 h-5 text-indigo-400" />
                <span class="text-white truncate max-w-[200px]">{{ key.file_name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 font-mono text-sm text-gray-400">{{ key.id }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-xs">
                {{ key.algorithm }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-sm">{{ formatTime(key.created_at) }}</td>
            <td class="px-4 py-3">
              <button 
                @click="handleDecrypt(key.id)"
                class="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                解密
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { keysAPI } from '../api'
import { Key, Search, Loader2 } from 'lucide-vue-next'

const loading = ref(true)
const keys = ref([])
const search = ref('')

// 过滤后的密钥
const filteredKeys = computed(() => {
  if (!search.value) return keys.value
  const q = search.value.toLowerCase()
  return keys.value.filter(k => 
    k.file_name.toLowerCase().includes(q) || 
    k.id.toLowerCase().includes(q)
  )
})

// 格式化时间
const formatTime = (isoString) => {
  return new Date(isoString).toLocaleString('zh-CN')
}

// 解密
const handleDecrypt = async (keyId) => {
  try {
    const res = await keysAPI.decrypt(keyId)
    if (res.success) {
      alert(res.simulated ? '模拟解密成功' : `解密成功！下载链接：${res.download_url}`)
    }
  } catch (e) {
    alert('解密失败')
  }
}

// 加载数据
onMounted(async () => {
  try {
    const res = await keysAPI.list()
    if (res.success) {
      keys.value = res.keys
    }
  } catch (e) {
    console.error('Failed to load keys:', e)
  } finally {
    loading.value = false
  }
})
</script>
