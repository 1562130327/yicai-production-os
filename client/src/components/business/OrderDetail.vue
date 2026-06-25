<template>
  <BaseModal :model-value="true" title="" width="700px" @update:model-value="close">
    <h3 class="det-title">{{ order.code }} — {{ order.customerName }}</h3>
    <div class="det-info">
      <div><span class="text-dim">工艺</span> {{ order.processTemplate }}</div>
      <div><span class="text-dim">用料</span> {{ order.materialSpec }}</div>
      <div><span class="text-dim">片材</span> {{ order.sheetSize }}</div>
      <div>
        <span class="text-dim">切片</span> {{ order.sliceSize }} ×{{ order.sliceQty || '-' }}
      </div>
      <div>
        <span class="text-dim">冲型</span> {{ order.punchSize || '-' }} ×{{ order.punchQty || '-' }}
      </div>
      <div><span class="text-dim">优先级</span> {{ order.priority }}</div>
    </div>
    <ProcessPipeline v-if="flow" :steps="flow.steps" />
    <template #footer>
      <button class="btn" @click="close">关闭</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ProcessPipeline from './ProcessPipeline.vue'
import { useOrdersStore } from '@/stores/orders'
import type { Order } from '@/types/order'
import type { ProcessFlow } from '@/types/process'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  close: []
}>()

const ordersStore = useOrdersStore()
const flow = ref<ProcessFlow | null>(null)

function close() {
  emit('close')
}

onMounted(async () => {
  flow.value = (await ordersStore.fetchFlow(props.order.id)) || null
})
</script>

<style scoped lang="scss">
.det-title {
  font-size: 15px;
  color: $color-accent;
  margin-bottom: 14px;
}

.det-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 12px;
}
</style>
