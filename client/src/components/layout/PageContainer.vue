<template>
  <div class="page-container">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.page-container {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
