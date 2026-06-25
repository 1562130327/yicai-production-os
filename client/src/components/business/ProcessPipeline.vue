<template>
  <div class="pipeline">
    <template v-for="(step, i) in steps" :key="step.id">
      <div class="pipe-node" :class="step.status">
        <div class="pn-type">{{ step.type }}</div>
        <div class="pn-worker">{{ step.sliceSize || step.punchQty || '' }}</div>
        <div class="pn-qty">{{ step.completedQty }}/{{ step.requiredQty || '?' }}</div>
      </div>
      <div
        v-if="i < steps.length - 1"
        class="pipe-arrow"
        :class="{ active: step.status === 'done' }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ProcessStep } from '@/types/process'

defineProps<{
  steps: ProcessStep[]
}>()
</script>

<style scoped lang="scss">
.pipeline {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 20px 10px;
  overflow-x: auto;
}

.pipe-node {
  min-width: 100px;
  padding: 12px 16px;
  background: $color-surface-2;
  border: 2px solid $color-border;
  border-radius: $radius-sm;
  text-align: center;
  position: relative;
  font-size: 11px;
  transition: border-color 0.2s;

  .pn-type {
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 4px;
  }

  .pn-worker {
    font-size: 10px;
    color: $color-dim;
  }

  .pn-qty {
    font-family: $font-mono;
    font-size: 14px;
    color: $color-accent;
    margin-top: 4px;
  }

  &.waiting {
    opacity: 0.5;
  }

  &.ready {
    border-color: $color-warning;
  }

  &.running {
    border-color: $color-accent;
    box-shadow: 0 0 12px rgba(79, 195, 247, 0.2);
  }

  &.done {
    border-color: $color-success;
  }

  &.rework {
    border-color: $color-danger;
    animation: pulse 1.5s infinite;
  }
}

.pipe-arrow {
  width: 32px;
  height: 2px;
  background: $color-border;
  position: relative;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: -3px;
    border: 4px solid transparent;
    border-left-color: $color-border;
  }

  &.active {
    background: $color-accent;

    &::after {
      border-left-color: $color-accent;
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
