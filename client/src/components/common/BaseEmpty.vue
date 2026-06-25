<template>
  <div class="empty">
    <div class="empty__icon">📭</div>
    <div class="empty__text">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
  }>(),
  {
    message: '暂无数据',
  },
)
</script>

<style scoped lang="scss">
.empty {
  text-align: center;
  padding: 40px 20px;
  color: $color-dim;

  &__icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  &__text {
    font-size: 12px;
  }
}
</style>
