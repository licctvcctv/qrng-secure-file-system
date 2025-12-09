<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">安全传输</h1>
      <p class="text-gray-500 mt-1">使用量子随机数加密传输文件</p>
    </div>
    
    <!-- 上传区域 -->
    <div class="glass-card p-8 mb-6">
      <div 
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        :class="[
          'border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer',
          isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600'
        ]"
        @click="$refs.fileInput.click()"
      >
        <input 
          ref="fileInput"
          type="file"
          class="hidden"
          @change="handleFileSelect"
        />
        
        <div v-if="!selectedFile">
          <Upload class="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <p class="text-white text-lg mb-2">拖拽文件到此处或点击选择</p>
          <p class="text-gray-500 text-sm">支持所有常见文件格式，最大 20MB</p>
        </div>
        
        <div v-else class="flex items-center justify-center space-x-4">
          <FileText class="w-12 h-12 text-indigo-400" />
          <div class="text-left">
            <p class="text-white font-medium">{{ selectedFile.name }}</p>
            <p class="text-gray-500 text-sm">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button 
            @click.stop="selectedFile = null"
            class="p-2 text-gray-500 hover:text-red-400"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <!-- 加密选项 -->
      <div v-if="selectedFile" class="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-400 mb-2">加密算法</label>
          <select v-model="algorithm" class="input-field">
            <option value="AES-256-GCM">AES-256-GCM (推荐)</option>
            <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-2">密钥模式</label>
          <select v-model="keyMode" class="input-field">
            <option value="QRNG-Auto">QRNG 自动生成</option>
            <option value="Custom-Seed">自定义种子</option>
          </select>
        </div>
      </div>
      
      <!-- 加密按钮 -->
      <button 
        v-if="selectedFile && !encrypting"
        @click="startEncryption"
        class="mt-6 w-full btn-primary py-3 flex items-center justify-center space-x-2"
      >
        <Lock class="w-5 h-5" />
        <span>开始加密</span>
      </button>
    </div>
    
    <!-- 加密进度 -->
    <div v-if="encrypting" class="glass-card p-6">
      <h3 class="text-white font-medium mb-4">加密进度</h3>
      
      <div class="space-y-4">
        <div v-for="(step, index) in steps" :key="index" class="flex items-center space-x-3">
          <div :class="[
            'w-6 h-6 rounded-full flex items-center justify-center',
            step.status === 'complete' ? 'bg-green-500' :
            step.status === 'active' ? 'bg-indigo-500 animate-pulse' :
            'bg-gray-700'
          ]">
            <Check v-if="step.status === 'complete'" class="w-4 h-4 text-white" />
            <Loader2 v-else-if="step.status === 'active'" class="w-4 h-4 text-white animate-spin" />
            <span v-else class="text-xs text-gray-400">{{ index + 1 }}</span>
          </div>
          <span :class="[
            step.status === 'complete' ? 'text-green-400' :
            step.status === 'active' ? 'text-white' :
            'text-gray-500'
          ]">{{ step.label }}</span>
        </div>
      </div>
      
      <div class="mt-6 bg-dark-700 rounded-full h-2 overflow-hidden">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="text-center text-gray-500 text-sm mt-2">{{ progress }}%</p>
    </div>
    
    <!-- 加密结果 -->
    <div v-if="result" class="glass-card p-6 mt-6">
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check class="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 class="text-white font-medium">加密成功</h3>
          <p class="text-gray-500 text-sm">文件已安全加密</p>
        </div>
      </div>
      
      <div class="bg-dark-700 rounded-lg p-4 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">密钥 ID</span>
          <span class="text-indigo-400 font-mono">{{ result.key_id }}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">指纹</span>
          <span class="text-white font-mono">{{ result.fingerprint }}</span>
        </div>
      </div>
      
      <button 
        @click="reset"
        class="mt-4 w-full btn-secondary"
      >
        加密新文件
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { keysAPI } from '../api'
import { Upload, FileText, X, Lock, Check, Loader2 } from 'lucide-vue-next'

const selectedFile = ref(null)
const isDragging = ref(false)
const algorithm = ref('AES-256-GCM')
const keyMode = ref('QRNG-Auto')
const encrypting = ref(false)
const progress = ref(0)
const result = ref(null)

const steps = ref([
  { label: '计算文件哈希', status: 'pending' },
  { label: '连接量子随机源', status: 'pending' },
  { label: '生成加密密钥', status: 'pending' },
  { label: '加密文件数据', status: 'pending' },
  { label: '保存加密记录', status: 'pending' }
])

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 文件选择
const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) selectedFile.value = file
}

// 拖拽上传
const handleDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) selectedFile.value = file
}

// 延时函数
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 开始加密
const startEncryption = async () => {
  encrypting.value = true
  progress.value = 0
  result.value = null
  
  // 模拟加密步骤
  for (let i = 0; i < steps.value.length; i++) {
    steps.value[i].status = 'active'
    await wait(500 + Math.random() * 500)
    steps.value[i].status = 'complete'
    progress.value = Math.round(((i + 1) / steps.value.length) * 100)
  }
  
  // 调用后端 API
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('algorithm', algorithm.value)
    formData.append('keyMode', keyMode.value)
    formData.append('mode', 'simulate') // 使用模拟模式
    
    const res = await keysAPI.encrypt(formData)
    if (res.success) {
      result.value = res
    }
  } catch (e) {
    console.error('Encryption failed:', e)
  }
  
  encrypting.value = false
}

// 重置
const reset = () => {
  selectedFile.value = null
  result.value = null
  progress.value = 0
  steps.value.forEach(s => s.status = 'pending')
}
</script>
