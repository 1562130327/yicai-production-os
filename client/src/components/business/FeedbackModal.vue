<template>
  <BaseModal v-model="isOpen" title="提交反馈">
    <select v-model="feedbackType" class="fb-select">
      <option value="material_quality">材料质量</option>
      <option value="machine_failure">机器故障</option>
      <option value="staff_shortage">人员不足</option>
      <option value="other">其他</option>
    </select>
    <textarea v-model="description" rows="2" placeholder="描述问题..." class="fb-textarea" />
    <template #footer>
      <button class="btn" @click="close">取消</button>
      <button class="btn btn--danger" @click="submit">提交</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { feedbackApi } from '@/api/feedback'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const isOpen = ref(false)
const orderId = ref('')
const stepId = ref('')
const flowId = ref('')
const feedbackType = ref('material_quality')
const description = ref('')

function open(orderIdVal: string, stepIdVal: string, flowIdVal: string) {
  orderId.value = orderIdVal
  stepId.value = stepIdVal
  flowId.value = flowIdVal
  feedbackType.value = 'material_quality'
  description.value = ''
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function submit() {
  try {
    await feedbackApi.submit({
      orderId: orderId.value,
      processStepId: stepId.value,
      flowId: flowId.value,
      type: feedbackType.value,
      description: description.value,
      severity: 'medium',
    })
    appStore.showToast('反馈已提交', 'success')
    close()
  } catch {
    // error handled by interceptor
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.fb-select {
  width: 100%;
  padding: 6px;
  margin-bottom: 8px;
  background: $color-input;
  border: 1px solid $color-border;
  color: $color-text;
  border-radius: $radius-sm;
}

.fb-textarea {
  width: 100%;
  padding: 6px;
  background: $color-input;
  border: 1px solid $color-border;
  color: $color-text;
  border-radius: $radius-sm;
  font-family: $font-sans;
  font-size: 12px;
  resize: vertical;
}
</style>
