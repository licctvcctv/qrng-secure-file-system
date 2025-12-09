<template>
  <Teleport to="body">
    <Transition name="toast">
      <div 
        v-if="visible"
        :class="[
          'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 max-w-md',
          type === 'success' ? 'bg-green-500/90 text-white' :
          type === 'error' ? 'bg-red-500/90 text-white' :
          type === 'warning' ? 'bg-yellow-500/90 text-black' :
          'bg-gray-700/90 text-white'
        ]"
      >
        <CheckCircle v-if="type === 'success'" class="w-5 h-5 flex-shrink-0" />
        <XCircle v-else-if="type === 'error'" class="w-5 h-5 flex-shrink-0" />
        <AlertTriangle v-else-if="type === 'warning'" class="w-5 h-5 flex-shrink-0" />
        <Info v-else class="w-5 h-5 flex-shrink-0" />
        <p class="text-sm">{{ message }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-vue-next'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // success, error, warning, info
  duration: { type: Number, default: 3000 }
})

const emit = defineEmits(['close'])
const visible = ref(false)

watch(() => props.message, (newVal) => {
  if (newVal) {
    visible.value = true
    setTimeout(() => {
      visible.value = false
      emit('close')
    }, props.duration)
  }
}, { immediate: true })
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
