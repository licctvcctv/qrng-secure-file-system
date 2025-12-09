<template>
  <div class="fade-in">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">设备管理</h1>
        <p class="text-gray-500 mt-1">管理受信任设备</p>
      </div>
      <button v-if="store.isAdmin" @click="showAddModal = true" class="btn-primary flex items-center space-x-2">
        <Plus class="w-5 h-5" />
        <span>添加设备</span>
      </button>
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
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Monitor class="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p class="text-white font-medium">{{ device.name }}</p>
              <p class="text-gray-500 text-sm">{{ device.ip }} · {{ device.id }}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- 状态切换（仅管理员） -->
            <div v-if="store.isAdmin" class="flex items-center space-x-2">
              <button 
                @click="updateStatus(device, 'trusted')"
                :class="[
                  'px-3 py-1 rounded text-xs transition-colors',
                  device.status === 'trusted' ? 'bg-green-500 text-white' : 'bg-dark-600 text-gray-400 hover:bg-green-500/20'
                ]"
              >
                信任
              </button>
              <button 
                @click="updateStatus(device, 'pending')"
                :class="[
                  'px-3 py-1 rounded text-xs transition-colors',
                  device.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-dark-600 text-gray-400 hover:bg-yellow-500/20'
                ]"
              >
                待审
              </button>
              <button 
                @click="updateStatus(device, 'revoked')"
                :class="[
                  'px-3 py-1 rounded text-xs transition-colors',
                  device.status === 'revoked' ? 'bg-red-500 text-white' : 'bg-dark-600 text-gray-400 hover:bg-red-500/20'
                ]"
              >
                撤销
              </button>
            </div>
            
            <!-- 只读状态显示（非管理员） -->
            <span v-else :class="[
              'px-2 py-1 rounded text-xs',
              device.status === 'trusted' ? 'bg-green-500/20 text-green-400' :
              device.status === 'revoked' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            ]">{{ device.status }}</span>
            
            <!-- 删除按钮（仅管理员） -->
            <button 
              v-if="store.isAdmin"
              @click="deleteDevice(device)"
              class="p-2 text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加设备弹窗 -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="glass-card p-6 w-full max-w-md">
        <h2 class="text-xl font-bold text-white mb-6">添加设备</h2>
        
        <form @submit.prevent="addDevice" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2">设备名称</label>
            <input v-model="form.name" type="text" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">IP 地址</label>
            <input v-model="form.ip" type="text" class="input-field" placeholder="可选" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">初始状态</label>
            <select v-model="form.status" class="input-field">
              <option value="pending">待审核</option>
              <option value="trusted">已信任</option>
            </select>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button type="submit" class="flex-1 btn-primary">创建</button>
            <button type="button" @click="showAddModal = false" class="flex-1 btn-secondary">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { devicesAPI } from '../api'
import store from '../store'
import { Monitor, Plus, Loader2, Trash2 } from 'lucide-vue-next'

const loading = ref(true)
const devices = ref([])
const showAddModal = ref(false)

const form = reactive({
  name: '',
  ip: '',
  status: 'pending'
})

const resetForm = () => {
  form.name = ''
  form.ip = ''
  form.status = 'pending'
}

const addDevice = async () => {
  try {
    await devicesAPI.add({
      name: form.name,
      ip: form.ip,
      status: form.status
    })
    await loadDevices()
    showAddModal.value = false
    resetForm()
  } catch (e) {
    alert(e.response?.data?.message || '添加失败')
  }
}

const updateStatus = async (device, status) => {
  if (device.status === status) return
  try {
    await devicesAPI.updateStatus(device.id, status)
    device.status = status
  } catch (e) {
    alert(e.response?.data?.message || '更新失败')
  }
}

const deleteDevice = async (device) => {
  if (!confirm(`确定删除设备 ${device.name}？`)) return
  try {
    await devicesAPI.delete(device.id)
    await loadDevices()
  } catch (e) {
    alert(e.response?.data?.message || '删除失败')
  }
}

const loadDevices = async () => {
  try {
    const res = await devicesAPI.list()
    if (res.success) devices.value = res.devices
  } catch (e) { console.error(e) }
}

onMounted(async () => {
  await loadDevices()
  loading.value = false
})
</script>
