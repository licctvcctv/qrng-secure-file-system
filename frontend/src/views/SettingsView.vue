<template>
  <div class="fade-in">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">设置</h1>
      <p class="text-gray-500 mt-1">个人资料和偏好设置</p>
    </div>
    
    <div class="glass-card p-6">
      <h2 class="text-lg font-medium text-white mb-4">个人资料</h2>
      <form class="space-y-4 max-w-md">
        <div>
          <label class="block text-sm text-gray-400 mb-2">用户名</label>
          <input :value="store.user?.username" disabled class="input-field opacity-50" />
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-2">显示名称</label>
          <input :value="store.user?.name" class="input-field" />
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-2">部门</label>
          <input :value="store.user?.department" class="input-field" />
        </div>
        <button type="button" class="btn-primary">保存更改</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import store from '../store'
</script>
