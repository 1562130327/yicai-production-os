<template>
  <button
    class="btn"
    :class="[variant ? `btn--${variant}` : '', size ? `btn--${size}` : '']"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner">⟳</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'danger'
  size?: 'sm'
  disabled?: boolean
  loading?: boolean
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped lang="scss">
.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: 4px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
