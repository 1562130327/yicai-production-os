<template>
  <PageContainer>
    <BaseFilterBar>
      <input v-model="search" type="text" placeholder="搜索" />
      <select v-model="statusFilter">
        <option value="">全部</option>
        <option value="pending">待排</option>
        <option value="in_progress">生产中</option>
        <option value="completed">完成</option>
      </select>
      <button class="btn" @click="loadOrders">刷新</button>
    </BaseFilterBar>

    <BaseSpinner v-if="ordersStore.loading && !ordersStore.orders.length" />
    <template v-else>
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>工艺</th>
            <th>优先级</th>
            <th>状态</th>
            <th>工序流</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id" @click="openDetail(order)">
            <td>
              <a class="mono text-accent">{{ order.code }}</a>
            </td>
            <td>{{ order.customerName }}</td>
            <td>{{ order.processTemplate }}</td>
            <td>
              <BaseBadge v-if="order.priority === 'deadline'" variant="danger">死命令</BaseBadge>
              <BaseBadge v-else-if="order.priority === 'urgent'" variant="warning">催产</BaseBadge>
              <span v-else>{{ priorityLabel(order.priority) }}</span>
            </td>
            <td>{{ statusLabel(order.status) }}</td>
            <td>
              <div class="mini-pipeline">
                <template v-if="flows[order.id]">
                  <div
                    v-for="(step, i) in flows[order.id].steps"
                    :key="step.id"
                    class="mini-node"
                    :class="step.status"
                  >
                    {{ step.type }}
                    <span v-if="i < flows[order.id].steps.length - 1" class="mini-arrow" />
                  </div>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <BaseEmpty v-if="!filteredOrders.length" />
    </template>

    <OrderDetail v-if="selectedOrder" :order="selectedOrder" @close="selectedOrder = null" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseFilterBar from '@/components/common/BaseFilterBar.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import OrderDetail from '@/components/business/OrderDetail.vue'
import { useOrdersStore } from '@/stores/orders'
import type { Order, OrderStatus, OrderPriority } from '@/types/order'

const ordersStore = useOrdersStore()
const search = ref('')
const statusFilter = ref('')
const selectedOrder = ref<Order | null>(null)

const flows = computed(() => ordersStore.flows)

const filteredOrders = computed(() => {
  const s = search.value.toLowerCase()
  const st = statusFilter.value
  return ordersStore.orders.filter((o) => {
    if (s && !o.code.toLowerCase().includes(s) && !o.customerName.toLowerCase().includes(s))
      return false
    if (st && o.status !== st) return false
    return true
  })
})

const statusLabels: Record<string, string> = {
  pending: '待排',
  scheduled: '已排',
  in_progress: '生产中',
  completed: '✅',
  cancelled: '取消',
}

const priorityLabels: Record<string, string> = {
  deadline: '死命令',
  urgent: '催产',
  normal: '关注',
  attention: '没提',
  unmentioned: '没提',
}

function statusLabel(s: OrderStatus) {
  return statusLabels[s] || s
}
function priorityLabel(p: OrderPriority) {
  return priorityLabels[p] || p
}

function openDetail(order: Order) {
  selectedOrder.value = order
}

async function loadOrders() {
  await ordersStore.fetchOrders()
  for (const order of ordersStore.orders.slice(0, 20)) {
    ordersStore.fetchFlow(order.id)
  }
}

onMounted(loadOrders)
</script>

<style scoped lang="scss">
.mini-pipeline {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0;
}

.mini-node {
  min-width: 50px;
  padding: 4px 8px;
  font-size: 10px;
  position: relative;
  background: $color-surface-2;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  text-align: center;

  &.waiting {
    opacity: 0.5;
  }
  &.ready {
    border-color: $color-warning;
  }
  &.running {
    border-color: $color-accent;
  }
  &.done {
    border-color: $color-success;
  }
  &.rework {
    border-color: $color-danger;
  }
}

.mini-arrow {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border: 4px solid transparent;
  border-left-color: $color-border;
}

tr {
  cursor: pointer;
}
</style>
