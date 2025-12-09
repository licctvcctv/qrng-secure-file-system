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
      <div v-if="selectedFile" class="mt-6 grid grid-cols-3 gap-4">
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
        <div>
          <label class="block text-sm text-gray-400 mb-2">加密模式</label>
          <select v-model="encryptMode" class="input-field">
            <option value="real">真实加密（落盘）</option>
            <option value="simulate">模拟演示</option>
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
            'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
            step.status === 'complete' ? 'bg-green-500' :
            step.status === 'active' ? 'bg-indigo-500 animate-pulse' :
            step.status === 'error' ? 'bg-red-500' :
            'bg-gray-700'
          ]">
            <Check v-if="step.status === 'complete'" class="w-4 h-4 text-white" />
            <X v-else-if="step.status === 'error'" class="w-4 h-4 text-white" />
            <Loader2 v-else-if="step.status === 'active'" class="w-4 h-4 text-white animate-spin" />
            <span v-else class="text-xs text-gray-400">{{ index + 1 }}</span>
          </div>
          <div class="flex-1">
            <span :class="[
              'transition-colors duration-300',
              step.status === 'complete' ? 'text-green-400' :
              step.status === 'active' ? 'text-white' :
              step.status === 'error' ? 'text-red-400' :
              'text-gray-500'
            ]">{{ step.label }}</span>
            <span v-if="step.status === 'active' && step.detail" class="text-gray-500 text-xs ml-2">
              {{ step.detail }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="mt-6 bg-dark-700 rounded-full h-2 overflow-hidden">
        <div class="progress-bar transition-all duration-300" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="text-center text-gray-500 text-sm mt-2">{{ progress }}%</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="error" class="glass-card p-6 mt-6 border border-red-500/50">
      <div class="flex items-center space-x-3">
        <AlertCircle class="w-6 h-6 text-red-400" />
        <div>
          <h3 class="text-red-400 font-medium">加密失败</h3>
          <p class="text-gray-500 text-sm">{{ error }}</p>
        </div>
      </div>
      <button @click="reset" class="mt-4 btn-secondary">重试</button>
    </div>
    
    <!-- 加密结果 -->
    <div v-if="result" class="glass-card p-6 mt-6">
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check class="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 class="text-white font-medium">加密成功</h3>
          <p class="text-gray-500 text-sm">
            {{ encryptMode === 'real' ? '文件已安全加密并存储' : '模拟加密完成' }}
          </p>
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
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">模式</span>
          <span :class="encryptMode === 'real' ? 'text-green-400' : 'text-yellow-400'">
            {{ encryptMode === 'real' ? '真实加密' : '模拟演示' }}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">耗时</span>
          <span class="text-white">{{ elapsedTime }}</span>
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
import { Upload, FileText, X, Lock, Check, Loader2, AlertCircle } from 'lucide-vue-next'

const selectedFile = ref(null)
const isDragging = ref(false)
const algorithm = ref('AES-256-GCM')
const keyMode = ref('QRNG-Auto')
const encryptMode = ref('real')
const encrypting = ref(false)
const progress = ref(0)
const result = ref(null)
const error = ref('')
const startTime = ref(0)
const elapsedTime = ref('')

const steps = ref([
  { label: '计算文件哈希', status: 'pending', detail: '' },
  { label: '连接量子随机源', status: 'pending', detail: '' },
  { label: '生成加密密钥', status: 'pending', detail: '' },
  { label: '加密文件数据', status: 'pending', detail: '' },
  { label: '保存加密记录', status: 'pending', detail: '' }
])

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) selectedFile.value = file
}

const handleDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) selectedFile.value = file
}

// 更新步骤状态
const updateStep = (index, status, detail = '') => {
  steps.value[index].status = status
  steps.value[index].detail = detail
  // 计算进度
  const completed = steps.value.filter(s => s.status === 'complete').length
  progress.value = Math.round((completed / steps.value.length) * 100)
}

// 开始加密
const startEncryption = async () => {
  encrypting.value = true
  progress.value = 0
  result.value = null
  error.value = ''
  startTime.value = Date.now()
  
  // 重置步骤
  steps.value.forEach(s => { s.status = 'pending'; s.detail = '' })
  
  try {
    // Step 1: 计算哈希（前端模拟）
    updateStep(0, 'active', '正在计算...')
    await new Promise(r => setTimeout(r, 200))
    updateStep(0, 'complete')
    
    // Step 2: 连接 QRNG
    updateStep(1, 'active', '正在连接...')
    await new Promise(r => setTimeout(r, 150))
    updateStep(1, 'complete')
    
    // Step 3: 生成密钥
    updateStep(2, 'active', '生成 256-bit 密钥')
    await new Promise(r => setTimeout(r, 100))
    updateStep(2, 'complete')
    
    // Step 4: 加密文件（准备上传）
    updateStep(3, 'active', `加密 ${formatFileSize(selectedFile.value.size)}`)
    
    // 调用后端 API
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('algorithm', algorithm.value)
    formData.append('keyMode', keyMode.value)
    formData.append('mode', encryptMode.value)
    
    const res = await keysAPI.encrypt(formData)
    
    updateStep(3, 'complete')
    
    // Step 5: 保存记录
    updateStep(4, 'active', '写入数据库')
    await new Promise(r => setTimeout(r, 100))
    
    if (res.success) {
      updateStep(4, 'complete')
      progress.value = 100
      result.value = res
      
      // 计算耗时
      const elapsed = Date.now() - startTime.value
      if (elapsed < 1000) {
        elapsedTime.value = `${elapsed} ms`
      } else {
        elapsedTime.value = `${(elapsed / 1000).toFixed(2)} 秒`
      }
    } else {
      throw new Error(res.message || '加密失败')
    }
  } catch (e) {
    console.error('Encryption failed:', e)
    const activeStep = steps.value.findIndex(s => s.status === 'active')
    if (activeStep >= 0) updateStep(activeStep, 'error')
    error.value = e.response?.data?.message || e.message || '加密过程中发生错误'
  } finally {
    encrypting.value = false
  }
}

const reset = () => {
  selectedFile.value = null
  result.value = null
  error.value = ''
  progress.value = 0
  elapsedTime.value = ''
  steps.value.forEach(s => { s.status = 'pending'; s.detail = '' })
}
</script>
