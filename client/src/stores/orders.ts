import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ordersApi } from '@/api/orders'
import { processesApi } from '@/api/processes'
import type { Order, OrderCreateInput } from '@/types/order'
import type { ProcessFlow } from '@/types/process'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const flows = ref<Record<string, ProcessFlow>>({})
  const loading = ref(false)

  async function fetchOrders() {
    loading.value = true
    try {
      const { data } = await ordersApi.list()
      orders.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function fetchFlow(orderId: string) {
    if (flows.value[orderId]) return flows.value[orderId]
    const { data } = await processesApi.getByOrder(orderId)
    if (data) flows.value[orderId] = data
    return data
  }

  async function createOrder(input: OrderCreateInput) {
    const { data } = await ordersApi.create(input)
    return data
  }

  return { orders, flows, loading, fetchOrders, fetchFlow, createOrder }
})
