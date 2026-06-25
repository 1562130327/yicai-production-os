<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal" :style="{ width }">
          <h3 v-if="title">{{ title }}</h3>
          <slot />
          <div v-if="$slots.footer" class="btn-row">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    width?: string
  }>(),
  {
    title: '',
    width: '480px',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: $color-surface;
  border: 1px solid $color-border;
  padding: 20px;
  border-radius: $radius-sm;
  max-height: 80vh;
  overflow-y: auto;

  h3 {
    font-size: 15px;
    color: $color-accent;
    margin-bottom: 14px;
  }
}

.btn-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
