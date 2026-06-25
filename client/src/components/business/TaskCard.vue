<template>
  <div
    class="task-item"
    :class="task.stepStatus === 'running' ? 'running' : task.stepStatus === 'ready' ? 'ready' : ''"
  >
    <div class="ti-seq">{{ task.stepSequence }}/{{ task.totalSteps }}</div>
    <div class="ti-info">
      <div class="ti-code">{{ task.orderCode }} · {{ task.customer }}</div>
      <div class="ti-spec">
        {{ task.spec }} | {{ task.machine }} |
        <span :style="{ color: task.priorityColor }">{{ task.priorityLabel }}</span>
      </div>
    </div>
    <div class="ti-act">
      <template v-if="task.stepStatus === 'ready' || task.stepStatus === 'running'">
        <input v-model.number="quantity" type="number" placeholder="量" min="1" />
        <button class="btn btn--primary btn--sm" @click="handleComplete">
          {{ getLabel(task.stepType, task.stepSequence === 1) }}
        </button>
        <button class="btn btn--sm" @click="$emit('feedback', task)">反馈</button>
      </template>
      <span v-else class="text-dim text-sm">
        {{ task.completedQty }}/{{ task.requiredQty || '?' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { WorkerTask } from '@/api/workers'

const props = defineProps<{
  task: WorkerTask
}>()

const emit = defineEmits<{
  complete: [flowId: string, stepId: string, quantity: number]
  feedback: [task: WorkerTask]
}>()

const quantity = ref<number | null>(null)

const BTN_LABEL: Record<string, (first: boolean) => string> = {
  横竖分切: (s) => (s ? '调用原材料' : '分切数量'),
  破片: () => '片材数量',
  直切: () => '切片数量',
  冲型: () => '冲型数量',
  背胶: () => '背胶数量',
  点胶: () => '点胶数量',
  贴布: () => '贴布数量',
  打包: () => '打包数量',
}

function getLabel(type: string, isFirst: boolean): string {
  const fn = BTN_LABEL[type]
  return fn ? fn(isFirst) : '完成数量'
}

function handleComplete() {
  if (!quantity.value || quantity.value <= 0) return
  emit('complete', props.task.flowId, props.task.stepId, quantity.value)
}
</script>

<style scoped lang="scss">
.task-item {
  background: $color-surface-2;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  padding: 12px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    border-color: $color-accent;
  }

  &.running {
    border-left: 3px solid $color-accent;
  }

  &.ready {
    border-left: 3px solid $color-warning;
  }
}

.ti-seq {
  font-family: $font-mono;
  font-size: 20px;
  color: $color-dim;
  width: 32px;
  text-align: center;
}

.ti-info {
  flex: 1;
}

.ti-code {
  font-family: $font-mono;
  font-size: 12px;
  color: $color-accent;
}

.ti-spec {
  font-size: 11px;
  color: $color-dim;
  margin-top: 2px;
}

.ti-act {
  display: flex;
  gap: 4px;
  align-items: center;

  input[type='number'] {
    width: 60px;
    padding: 5px;
    background: $color-input;
    border: 1px solid $color-border;
    color: $color-text;
    font-size: 14px;
    text-align: center;
    border-radius: $radius-sm;
    font-family: $font-mono;
  }
}
</style>
