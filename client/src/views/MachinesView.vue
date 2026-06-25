<template>
  <PageContainer>
    <div class="stat-row">
      <BaseStatCard :value="machines.length" label="总机器" />
      <BaseStatCard
        :value="machines.filter((m) => m.status === 'idle').length"
        label="空闲"
        :value-style="{ color: 'var(--success)' }"
      />
      <BaseStatCard
        :value="machines.filter((m) => m.status === 'running').length"
        label="运行中"
        :value-style="{ color: 'var(--accent)' }"
      />
      <BaseStatCard
        :value="machines.filter((m) => m.status === 'maintenance').length"
        label="维护中"
        variant="bad"
      />
    </div>

    <div class="mach-grid">
      <div
        v-for="m in machines"
        :key="m.name"
        class="card mach-card"
        :class="`mach-card--${m.status}`"
      >
        <div class="card__header">
          {{ m.name }}
          <span :class="`status-${m.status}`">
            {{ m.status === 'idle' ? '空闲' : m.status === 'running' ? '运行中' : '维护' }}
          </span>
        </div>
        <div class="card__body text-dim text-sm">
          类型: {{ m.type }} | 车间: {{ m.workshop || '-' }}<br />
          可执行: {{ (m.processTypes || []).join('、') || '辅助' }}
        </div>
      </div>
    </div>

    <BaseEmpty v-if="!machines.length" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseStatCard from '@/components/common/BaseStatCard.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import { workersApi, type MachineInfo } from '@/api/workers'

const machines = ref<MachineInfo[]>([])

onMounted(async () => {
  try {
    const { data } = await workersApi.getMachines()
    machines.value = data || []
  } catch {
    // error handled by interceptor
  }
})
</script>

<style scoped lang="scss">
.mach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.mach-card {
  border-left: 3px solid;

  &--idle {
    border-left-color: $color-success;
  }
  &--running {
    border-left-color: $color-accent;
  }
  &--maintenance {
    border-left-color: $color-danger;
  }
}

.status-idle {
  color: $color-success;
  font-family: $font-mono;
  font-size: 10px;
}
.status-running {
  color: $color-accent;
  font-family: $font-mono;
  font-size: 10px;
}
.status-maintenance {
  color: $color-danger;
  font-family: $font-mono;
  font-size: 10px;
}
</style>
