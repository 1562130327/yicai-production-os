import { ref } from 'vue'

export function useConfirm() {
  const isOpen = ref(false)
  const message = ref('')
  let resolvePromise: ((value: boolean) => void) | null = null

  function confirm(msg: string): Promise<boolean> {
    message.value = msg
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function handleConfirm() {
    isOpen.value = false
    resolvePromise?.(true)
  }

  function handleCancel() {
    isOpen.value = false
    resolvePromise?.(false)
  }

  return { isOpen, message, confirm, handleConfirm, handleCancel }
}
