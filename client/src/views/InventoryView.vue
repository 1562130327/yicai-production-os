<template>
  <PageContainer>
    <div class="stat-row">
      <BaseStatCard :value="inventory?.totalStock ?? 0" label="总库存(床)" />
      <BaseStatCard :value="inventory?.lowStockCount ?? 0" label="低库存预警" variant="bad" />
    </div>

    <BaseSpinner v-if="inventoryStore.loading && !inventory" />
    <template v-else>
      <div v-for="(group, name) in inventory?.byMaterial" :key="name" class="card">
        <div class="card__header">
          {{ name }}
          <span class="mono">{{ group.totalQty }} 床</span>
        </div>
        <div class="card__body">
          <div
            v-for="batch in group.batches"
            :key="batch.batchNo"
            class="batch-row"
            :class="{ low: batch.qty > 0 && batch.qty < 10 }"
          >
            <span>{{ batch.batchNo }} · {{ batch.spec }}</span>
            <span class="mono" :class="{ 'text-danger': batch.qty < 10 }">
              {{ batch.qty }} 床
            </span>
          </div>
        </div>
      </div>

      <BaseEmpty v-if="!inventory?.byMaterial || Object.keys(inventory.byMaterial).length === 0" />
    </template>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseStatCard from '@/components/common/BaseStatCard.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import { useInventoryStore } from '@/stores/inventory'

const inventoryStore = useInventoryStore()
const inventory = computed(() => inventoryStore.inventory)

onMounted(() => {
  inventoryStore.fetchInventory()
})
</script>

<style scoped lang="scss">
.batch-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid $color-border;
  font-size: 12px;

  &.low {
    background: $color-danger-dim;
    padding: 6px;
  }
}
</style>
