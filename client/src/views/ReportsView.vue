<template>
  <PageContainer>
    <BaseFilterBar>
      <button class="btn" :class="{ active: activeType === 'daily' }" @click="loadReport('daily')">
        日报
      </button>
      <button
        class="btn"
        :class="{ active: activeType === 'weekly' }"
        @click="loadReport('weekly')"
      >
        周报
      </button>
      <button
        class="btn"
        :class="{ active: activeType === 'monthly' }"
        @click="loadReport('monthly')"
      >
        月报
      </button>
    </BaseFilterBar>

    <template v-if="activeType === 'daily' && daily">
      <div class="stat-row">
        <BaseStatCard :value="daily.totalStock ?? 0" label="当前库存" />
        <BaseStatCard
          :value="daily.inboundToday ?? 0"
          label="今日入库"
          :value-style="{ color: 'var(--success)' }"
        />
        <BaseStatCard :value="daily.outboundToday ?? 0" label="今日出库" variant="warn" />
      </div>
      <table v-if="daily.transactions?.length">
        <thead>
          <tr>
            <th>批次</th>
            <th>类型</th>
            <th>数量</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in daily.transactions" :key="tx.batchId + tx.timestamp">
            <td>{{ tx.batchId }}</td>
            <td>{{ tx.type }}</td>
            <td>{{ tx.quantity }}</td>
            <td>{{ tx.timestamp }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <template v-if="activeType === 'weekly' && weekly">
      <div class="stat-row">
        <BaseStatCard :value="weekly.totalStock ?? 0" label="当前库存" />
        <BaseStatCard :value="weekly.lowStock ?? 0" label="低库存预警" variant="bad" />
      </div>
      <div v-for="(data, supplier) in weekly.bySupplier" :key="supplier" class="card">
        <div class="card__header">{{ supplier }}</div>
        <div class="card__body">入库 {{ data.inbound }} 床 · 出库 {{ data.outbound }} 床</div>
      </div>
    </template>

    <template v-if="activeType === 'monthly' && monthly">
      <div class="stat-row">
        <BaseStatCard :value="monthly.total ?? 0" label="活跃订单" />
        <BaseStatCard :value="monthly.newThisMonth ?? 0" label="本月新增" />
        <BaseStatCard
          :value="monthly.completedThisMonth ?? 0"
          label="本月完成"
          :value-style="{ color: 'var(--success)' }"
        />
      </div>
      <table v-if="monthly.byCustomer?.length">
        <thead>
          <tr>
            <th>客户</th>
            <th>订单数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="([name, count], i) in monthly.byCustomer" :key="i">
            <td>{{ name }}</td>
            <td>{{ count }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseFilterBar from '@/components/common/BaseFilterBar.vue'
import BaseStatCard from '@/components/common/BaseStatCard.vue'
import { reportsApi } from '@/api/reports'
import type { DailyReport, WeeklyReport, MonthlyReport } from '@/types/report'

const activeType = ref<'daily' | 'weekly' | 'monthly'>('daily')
const daily = ref<DailyReport | null>(null)
const weekly = ref<WeeklyReport | null>(null)
const monthly = ref<MonthlyReport | null>(null)

async function loadReport(type: 'daily' | 'weekly' | 'monthly') {
  activeType.value = type
  try {
    if (type === 'daily') {
      const { data } = await reportsApi.daily()
      daily.value = data
    } else if (type === 'weekly') {
      const { data } = await reportsApi.weekly()
      weekly.value = data
    } else {
      const { data } = await reportsApi.monthly()
      monthly.value = data
    }
  } catch {
    // error handled by interceptor
  }
}

onMounted(() => loadReport('daily'))
</script>

<style scoped lang="scss">
.btn.active {
  border-color: $color-accent;
  color: $color-accent;
}
</style>
