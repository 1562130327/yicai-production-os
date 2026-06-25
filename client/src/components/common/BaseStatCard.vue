<template>
  <div class="stat" :class="variant ? `stat--${variant}` : ''">
    <div class="val" :style="valueStyle">{{ value }}</div>
    <div class="lbl">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string | number
  label: string
  variant?: 'warn' | 'bad'
  valueStyle?: Record<string, string>
}>()
</script>

<style scoped lang="scss">
.stat {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  padding: 16px;
  text-align: center;
}

.val {
  font-family: $font-mono;
  font-size: 28px;
  color: $color-accent;
}

.lbl {
  font-size: 10px;
  color: $color-dim;
  letter-spacing: 1px;
  margin-top: 4px;
  text-transform: uppercase;
}

.stat--warn .val {
  color: $color-warning;
}

.stat--bad .val {
  color: $color-danger;
}
</style>
