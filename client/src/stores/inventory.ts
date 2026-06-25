import { defineStore } from 'pinia'
import { ref } from 'vue'
import { materialsApi } from '@/api/materials'
import type { InventoryData, MaterialOption } from '@/types/material'

export const useInventoryStore = defineStore('inventory', () => {
  const inventory = ref<InventoryData | null>(null)
  const materialOptions = ref<MaterialOption[]>([])
  const loading = ref(false)

  async function fetchInventory() {
    loading.value = true
    try {
      const { data } = await materialsApi.getInventory()
      inventory.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchMaterialOptions() {
    const { data } = await materialsApi.getOptions()
    materialOptions.value = data?.options || []
  }

  return { inventory, materialOptions, loading, fetchInventory, fetchMaterialOptions }
})
