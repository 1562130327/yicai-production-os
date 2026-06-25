<template>
  <div class="toast-container">
    <transition-group name="list">
      <div
        v-for="toast in appStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        @click="appStore.removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  top: 60px;
  right: 16px;
  z-index: $z-toast;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 10px 16px;
  border-radius: $radius-sm;
  font-size: 12px;
  cursor: pointer;
  min-width: 200px;
  border: 1px solid;

  &--success {
    background: $color-success-dim;
    color: $color-success;
    border-color: $color-success;
  }

  &--error {
    background: $color-danger-dim;
    color: $color-danger;
    border-color: $color-danger;
  }

  &--warning {
    background: $color-warning-dim;
    color: $color-warning;
    border-color: $color-warning;
  }

  &--info {
    background: $color-accent-dim;
    color: $color-accent;
    border-color: $color-accent;
  }
}
</style>
