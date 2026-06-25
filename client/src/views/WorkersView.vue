<template>
  <PageContainer>
    <div class="worker-grid">
      <div v-for="w in workers" :key="w.name" class="card">
        <div class="card__header">
          {{ w.name }}
          <span class="text-dim">{{ w.role }}</span>
        </div>
        <div class="card__body text-dim text-sm">
          技能: {{ (w.skills || []).join('、') || '-' }}<br />
          状态:
          <span :class="w.status === 'active' ? 'text-success' : 'text-dim'">
            {{ w.status === 'active' ? '在岗' : '休息' }}
          </span>
          <template v-if="w.phone"> | 电话: {{ w.phone }}</template>
        </div>
      </div>
    </div>

    <BaseEmpty v-if="!workers.length" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import { workersApi, type WorkerInfo } from '@/api/workers'

const workers = ref<WorkerInfo[]>([])

onMounted(async () => {
  try {
    const { data } = await workersApi.listAll()
    workers.value = data || []
  } catch {
    // error handled by interceptor
  }
})
</script>

<style scoped lang="scss">
.worker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}
</style>
