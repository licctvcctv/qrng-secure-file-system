<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">审计日志</h1>
      <p class="text-gray-500 mt-1">系统操作记录</p>
    </div>
    
    <!-- 筛选 -->
    <div class="flex items-center space-x-4 mb-6">
      <select v-model="levelFilter" class="input-field w-40">
        <option value="">全部级别</option>
        <option value="info">信息</option>
        <option value="warning">警告</option>
        <option value="error">错误</option>
      </select>
    </div>
    
    <!-- 日志列表 -->
    <div class="glass-card p-6">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        <Loader2 class="w-6 h-6 animate-spin mx-auto" />
      </div>
      
      <div v-else-if="logs.length === 0" class="text-center py-8 text-gray-500">
        暂无日志记录
      </div>
      
      <div v-else class="space-y-3">
        <div 
          v-for="log in logs" 
          :key="log.id"
          class="flex items-start space-x-3 p-3 bg-dark-700 rounded-lg"
        >
          <div :class="[
            'w-2 h-2 rounded-full mt-2',
            log.level === 'error' ? 'bg-red-500' :
            log.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
          ]"></div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <span class="text-white">{{ log.message }}</span>
              <span class="text-xs text-gray-500">{{ formatTime(log.timestamp) }}</span>
            </div>
            <div class="text-sm text-gray-500 mt-1">
              {{ log.user }} · {{ log.action_type }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { logsAPI } from '../api'
import { Loader2 } from 'lucide-vue-next'

const loading = ref(true)
const logs = ref([])
const levelFilter = ref('')

const formatTime = (isoString) => new Date(isoString).toLocaleString('zh-CN')

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {}
    if (levelFilter.value) params.level = levelFilter.value
    const res = await logsAPI.list(params)
    if (res.success) logs.value = res.logs
  } catch (e) {
    console.error('Failed to load logs:', e)
  } finally {
    loading.value = false
  }
}

watch(levelFilter, loadLogs)
onMounted(loadLogs)
</script>
