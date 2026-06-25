<template>
  <span class="badge" :class="`badge--${variant}`">
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  variant: 'danger' | 'warning' | 'success' | 'accent'
}>()
</script>
