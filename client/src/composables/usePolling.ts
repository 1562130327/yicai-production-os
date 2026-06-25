import { ref, onUnmounted } from 'vue'

export function usePolling(callback: () => Promise<void>, interval = 30000) {
  const timer = ref<ReturnType<typeof setInterval> | null>(null)
  const isPolling = ref(false)

  function start() {
    if (isPolling.value) return
    isPolling.value = true
    callback()
    timer.value = setInterval(() => {
      callback()
    }, interval)
  }

  function stop() {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
    isPolling.value = false
  }

  onUnmounted(stop)

  return { start, stop, isPolling }
}
