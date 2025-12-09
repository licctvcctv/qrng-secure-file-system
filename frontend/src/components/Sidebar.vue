<template>
  <aside class="fixed left-0 top-0 h-screen w-64 bg-dark-800 border-r border-gray-800 flex flex-col">
    <!-- Logo -->
    <div class="p-6 border-b border-gray-800">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Shield class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">QRNG Vault</h1>
          <p class="text-xs text-gray-500">Quantum Security</p>
        </div>
      </div>
    </div>
    
    <!-- 导航菜单 -->
    <nav class="flex-1 py-4 overflow-y-auto">
      <div class="px-3 space-y-1">
        <button
          v-for="item in menuItems"
          :key="item.name"
          @click="$emit('navigate', item.name)"
          :class="[
            'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
            currentView === item.name 
              ? 'bg-indigo-600/20 text-indigo-400 neon-glow' 
              : 'text-gray-400 hover:bg-dark-700 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.label }}</span>
        </button>
      </div>
      
      <!-- 管理员菜单 -->
      <div v-if="store.isAdmin" class="mt-6 px-3">
        <p class="px-4 text-xs text-gray-600 uppercase tracking-wider mb-2">管理</p>
        <div class="space-y-1">
          <button
            v-for="item in adminMenuItems"
            :key="item.name"
            @click="$emit('navigate', item.name)"
            :class="[
              'w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
              currentView === item.name 
                ? 'bg-indigo-600/20 text-indigo-400 neon-glow' 
                : 'text-gray-400 hover:bg-dark-700 hover:text-white'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>
    </nav>
    
    <!-- 用户信息 -->
    <div class="p-4 border-t border-gray-800">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span class="text-white font-medium">{{ userInitial }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white truncate">{{ store.user?.name }}</p>
          <p class="text-xs text-gray-500">{{ store.user?.role === 'admin' ? '管理员' : '用户' }}</p>
        </div>
        <button 
          @click="$emit('logout')"
          class="p-2 text-gray-500 hover:text-red-400 transition-colors"
          title="退出登录"
        >
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import store from '../store'
import { 
  Shield, 
  LayoutDashboard, 
  Upload, 
  Key, 
  FileText, 
  Users, 
  Monitor, 
  Settings,
  LogOut 
} from 'lucide-vue-next'

defineProps({
  currentView: {
    type: String,
    default: 'Dashboard'
  }
})

defineEmits(['navigate', 'logout'])

// 主菜单项
const menuItems = [
  { name: 'Dashboard', label: '控制台', icon: LayoutDashboard },
  { name: 'Transfer', label: '安全传输', icon: Upload },
  { name: 'Keys', label: '密钥管理', icon: Key },
  { name: 'Audit', label: '审计日志', icon: FileText },
  { name: 'Devices', label: '设备管理', icon: Monitor },
  { name: 'Settings', label: '设置', icon: Settings }
]

// 管理员菜单
const adminMenuItems = [
  { name: 'Users', label: '用户管理', icon: Users }
]

// 用户首字母
const userInitial = computed(() => {
  return store.user?.name?.charAt(0)?.toUpperCase() || 'U'
})
</script>
