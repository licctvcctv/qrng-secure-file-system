<template>
  <div class="fade-in">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">控制台</h1>
      <p class="text-gray-500 mt-1">系统概览与安全状态</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div 
        v-for="stat in stats" 
        :key="stat.label"
        class="glass-card p-6"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-white mt-1">{{ stat.value }}</p>
            <p v-if="stat.change" :class="[
              'text-xs mt-1',
              stat.change > 0 ? 'text-green-400' : 'text-red-400'
            ]">
              {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}% 较上周
            </p>
          </div>
          <div :class="['p-3 rounded-lg', stat.bgColor]">
            <component :is="stat.icon" :class="['w-6 h-6', stat.iconColor]" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 两列布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近密钥 -->
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">最近密钥</h2>
          <button @click="$router.push('/keys')" class="text-indigo-400 hover:text-indigo-300 text-sm">
            查看全部 →
          </button>
        </div>
        
        <div v-if="loading" class="text-center py-8 text-gray-500">
          <Loader2 class="w-6 h-6 animate-spin mx-auto" />
        </div>
        
        <div v-else-if="recentKeys.length === 0" class="text-center py-8 text-gray-500">
          暂无密钥记录
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="key in recentKeys" 
            :key="key.id"
            class="flex items-center justify-between p-3 bg-dark-700 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Key class="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p class="text-white text-sm truncate max-w-[200px]">{{ key.file_name }}</p>
                <p class="text-gray-500 text-xs">{{ key.algorithm }}</p>
              </div>
            </div>
            <span class="text-xs text-gray-500">{{ formatTime(key.created_at) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 安全状态 -->
      <div class="glass-card p-6">
        <h2 class="text-lg font-semibold text-white mb-4">安全状态</h2>
        
        <div class="space-y-4">
          <div 
            v-for="item in securityStatus" 
            :key="item.label"
            class="flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <div :class="['status-dot', item.statusClass]"></div>
              <span class="text-gray-300">{{ item.label }}</span>
            </div>
            <span :class="['text-sm', item.valueClass]">{{ item.value }}</span>
          </div>
        </div>
        
        <!-- 量子随机源状态 -->
        <div class="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-lg bg-indigo-500/30 flex items-center justify-center">
              <Zap class="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p class="text-white font-medium">QRNG 量子随机源</p>
              <p class="text-green-400 text-sm">在线 · 熵值优秀</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { keysAPI } from '../api'
import { 
  Key, 
  Shield, 
  Lock, 
  FileText, 
  AlertTriangle,
  Zap,
  Loader2
} from 'lucide-vue-next'

const loading = ref(true)
const keys = ref([])

// 统计数据
const stats = computed(() => [
  { 
    label: '加密文件', 
    value: keys.value.length, 
    change: 12, 
    icon: Lock, 
    bgColor: 'bg-indigo-500/20', 
    iconColor: 'text-indigo-400' 
  },
  { 
    label: '存储使用', 
    value: '2.4 GB', 
    change: 8, 
    icon: FileText, 
    bgColor: 'bg-emerald-500/20', 
    iconColor: 'text-emerald-400' 
  },
  { 
    label: '安全评分', 
    value: 'A+', 
    change: null, 
    icon: Shield, 
    bgColor: 'bg-purple-500/20', 
    iconColor: 'text-purple-400' 
  },
  { 
    label: '待处理告警', 
    value: '0', 
    change: null, 
    icon: AlertTriangle, 
    bgColor: 'bg-amber-500/20', 
    iconColor: 'text-amber-400' 
  }
])

// 最近密钥
const recentKeys = computed(() => keys.value.slice(0, 5))

// 安全状态
const securityStatus = [
  { label: '加密通道', value: 'TLS 1.3', statusClass: 'status-online', valueClass: 'text-green-400' },
  { label: '会话状态', value: '已认证', statusClass: 'status-online', valueClass: 'text-green-400' },
  { label: '密钥轮换', value: '正常', statusClass: 'status-online', valueClass: 'text-green-400' },
  { label: '威胁检测', value: '无异常', statusClass: 'status-online', valueClass: 'text-green-400' }
]

// 格式化时间
const formatTime = (isoString) => {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString('zh-CN')
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
