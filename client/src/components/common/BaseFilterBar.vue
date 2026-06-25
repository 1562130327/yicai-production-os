<template>
  <div class="filter-bar">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;

  :deep(select),
  :deep(input) {
    background: $color-surface;
    border: 1px solid $color-border;
    color: $color-text;
    padding: 6px 10px;
    font-size: 12px;
    border-radius: $radius-sm;
    outline: none;
    font-family: $font-sans;

    &:focus {
      border-color: $color-accent;
    }
  }
}
</style>
