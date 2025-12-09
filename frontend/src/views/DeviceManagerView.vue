<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">设备管理</h1>
      <p class="text-gray-500 mt-1">管理受信任设备</p>
    </div>
    
    <div class="glass-card p-6">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        <Loader2 class="w-6 h-6 animate-spin mx-auto" />
      </div>
      
      <div v-else-if="devices.length === 0" class="text-center py-8 text-gray-500">
        暂无设备记录
      </div>
      
      <div v-else class="space-y-3">
        <div 
          v-for="device in devices" 
          :key="device.id"
          class="flex items-center justify-between p-4 bg-dark-700 rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <Monitor class="w-6 h-6 text-gray-400" />
            <div>
              <p class="text-white">{{ device.name }}</p>
              <p class="text-gray-500 text-sm">{{ device.ip }}</p>
            </div>
          </div>
          <span :class="[
            'px-2 py-1 rounded text-xs',
            device.status === 'trusted' ? 'bg-green-500/20 text-green-400' :
            device.status === 'revoked' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          ]">{{ device.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { devicesAPI } from '../api'
import { Monitor, Loader2 } from 'lucide-vue-next'

const loading = ref(true)
const devices = ref([])

onMounted(async () => {
  try {
    const res = await devicesAPI.list()
    if (res.success) devices.value = res.devices
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>
