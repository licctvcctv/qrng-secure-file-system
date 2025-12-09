<template>
  <div class="min-h-screen bg-dark-900">
    <!-- 未登录显示登录页 -->
    <template v-if="!store.isAuthenticated && $route.path !== '/login'">
      <router-view />
    </template>
    
    <!-- 已登录显示主布局 -->
    <template v-else-if="store.isAuthenticated">
      <div class="flex min-h-screen">
        <!-- 侧边栏 -->
        <Sidebar 
          :current-view="$route.name"
          @navigate="navigateTo"
          @logout="handleLogout"
        />
        
        <!-- 主内容区 -->
        <main class="flex-1 ml-64 p-6">
          <router-view />
        </main>
      </div>
    </template>
    
    <!-- 登录页单独布局 -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import store from './store'
import Sidebar from './components/Sidebar.vue'

const router = useRouter()
const route = useRoute()

// 初始化检查登录状态
onMounted(async () => {
  await store.checkAuth()
})

// 导航
const navigateTo = (view) => {
  const routes = {
    'Dashboard': '/',
    'Transfer': '/transfer',
    'Keys': '/keys',
    'Audit': '/audit',
    'Users': '/users',
    'Devices': '/devices',
    'Settings': '/settings'
  }
  router.push(routes[view] || '/')
}

// 登出
const handleLogout = async () => {
  await store.logout()
  router.push('/login')
}
</script>
