<template>
  <PageContainer>
    <div class="stat-row">
      <BaseStatCard :value="orders.length" label="活跃订单" />
      <BaseStatCard :value="urgentOrders.length" label="急单" variant="warn" />
      <BaseStatCard :value="inProgressOrders.length" label="生产中" />
    </div>
    <div class="card">
      <div class="card__header">急单队列</div>
      <div class="card__body">
        <BaseSpinner v-if="ordersStore.loading" size="sm" />
        <template v-else>
          <div
            v-for="order in urgentOrders.slice(0, 8)"
            :key="order.id"
            class="urgent-item"
            @click="openDetail(order.id)"
          >
            <span
              class="dot"
              :style="{
                background: order.priority === 'deadline' ? 'var(--danger)' : 'var(--warning)',
              }"
            />
            <span class="mono text-accent">{{ order.code }}</span>
            <span>{{ order.customerName }} · {{ order.processTemplate }}</span>
          </div>
          <BaseEmpty v-if="!urgentOrders.length" message="暂无急单" />
        </template>
      </div>
    </div>

    <OrderDetail v-if="selectedOrder" :order="selectedOrder" @close="selectedOrder = null" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseStatCard from '@/components/common/BaseStatCard.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import OrderDetail from '@/components/business/OrderDetail.vue'
import { useOrdersStore } from '@/stores/orders'
import { usePolling } from '@/composables/usePolling'
import type { Order } from '@/types/order'

const ordersStore = useOrdersStore()
const selectedOrder = ref<Order | null>(null)

const orders = computed(() => ordersStore.orders)
const urgentOrders = computed(() =>
  orders.value.filter(
    (o) => (o.priority === 'deadline' || o.priority === 'urgent') && o.status !== 'completed',
  ),
)
const inProgressOrders = computed(() => orders.value.filter((o) => o.status === 'in_progress'))

function openDetail(id: string) {
  selectedOrder.value = orders.value.find((o) => o.id === id) || null
}

onMounted(() => {
  ordersStore.fetchOrders()
  usePolling(() => ordersStore.fetchOrders(), 30000).start()
})
</script>

<style scoped lang="scss">
.urgent-item {
  padding: 8px;
  border-bottom: 1px solid $color-border;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: $color-accent-dim;
  }
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
</style>
