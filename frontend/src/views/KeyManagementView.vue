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
                @click="handleDecrypt(key)"
                :disabled="decrypting === key.id"
                class="text-indigo-400 hover:text-indigo-300 text-sm disabled:opacity-50 flex items-center space-x-1"
              >
                <Loader2 v-if="decrypting === key.id" class="w-4 h-4 animate-spin" />
                <Download v-else class="w-4 h-4" />
                <span>{{ decrypting === key.id ? '解密中...' : '解密下载' }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- 解密结果提示 -->
    <div v-if="decryptMessage" :class="[
      'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300',
      decryptSuccess ? 'bg-green-500/90' : 'bg-red-500/90'
    ]">
      <p class="text-white text-sm">{{ decryptMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { keysAPI } from '../api'
import { Key, Search, Loader2, Download } from 'lucide-vue-next'

const loading = ref(true)
const keys = ref([])
const search = ref('')
const decrypting = ref(null)
const decryptMessage = ref('')
const decryptSuccess = ref(false)

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

// 显示消息
const showMessage = (message, success = true) => {
  decryptMessage.value = message
  decryptSuccess.value = success
  setTimeout(() => {
    decryptMessage.value = ''
  }, 3000)
}

// 解密并自动下载
const handleDecrypt = async (key) => {
  decrypting.value = key.id
  
  try {
    const res = await keysAPI.decrypt(key.id)
    
    if (res.success) {
      if (res.simulated) {
        // 模拟加密的文件，无法实际下载
        showMessage(`模拟解密成功 - ${key.file_name}`)
      } else {
        // 真实加密的文件，自动触发下载
        showMessage(`解密成功，正在下载...`)
        
        // 使用 download_url 下载文件
        const downloadUrl = `${import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000/api'}${res.download_url.replace('/api', '')}`
        
        // 创建隐藏的 iframe 或 link 进行下载
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = key.file_name
        link.style.display = 'none'
        document.body.appendChild(link)
        
        // 需要携带 cookie，使用 fetch 下载
        try {
          const response = await fetch(downloadUrl, { credentials: 'include' })
          if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            link.href = url
            link.click()
            window.URL.revokeObjectURL(url)
            showMessage(`下载完成 - ${key.file_name}`)
          } else {
            throw new Error('下载失败')
          }
        } catch (e) {
          showMessage(`下载失败: ${e.message}`, false)
        }
        
        document.body.removeChild(link)
      }
      
      // 刷新列表更新解密次数
      await loadKeys()
    } else {
      showMessage(res.message || '解密失败', false)
    }
  } catch (e) {
    console.error('Decrypt failed:', e)
    showMessage(e.response?.data?.message || '解密过程中发生错误', false)
  } finally {
    decrypting.value = null
  }
}

// 加载密钥列表
const loadKeys = async () => {
  try {
    const res = await keysAPI.list()
    if (res.success) {
      keys.value = res.keys
    }
  } catch (e) {
    console.error('Failed to load keys:', e)
  }
}

// 加载数据
onMounted(async () => {
  await loadKeys()
  loading.value = false
})
</script>
