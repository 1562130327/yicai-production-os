<template>
  <div class="spinner" :class="size ? `spinner--${size}` : ''">
    <div class="spinner__dot" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'lg'
  }>(),
  {
    size: undefined,
  },
)
</script>

<style scoped lang="scss">
.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner__dot {
  width: 24px;
  height: 24px;
  border: 2px solid $color-border;
  border-top-color: $color-accent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner--sm {
  padding: 8px;

  .spinner__dot {
    width: 14px;
    height: 14px;
  }
}

.spinner--lg .spinner__dot {
  width: 36px;
  height: 36px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
