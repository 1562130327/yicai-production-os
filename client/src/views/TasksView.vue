<template>
  <PageContainer>
    <div class="stat-row">
      <BaseStatCard :value="taskData?.count ?? 0" label="总任务" />
      <BaseStatCard :value="taskData?.running ?? 0" label="进行中" />
      <BaseStatCard :value="taskData?.waiting ?? 0" label="待处理" />
    </div>

    <BaseSpinner v-if="tasksStore.loading && !taskData" />
    <template v-else-if="taskData?.tasks.length">
      <TaskCard
        v-for="task in taskData.tasks"
        :key="task.stepId"
        :task="task"
        @complete="handleComplete"
        @feedback="openFeedback"
      />
    </template>
    <BaseEmpty v-else message="暂无任务" />

    <FeedbackModal ref="feedbackModal" />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseStatCard from '@/components/common/BaseStatCard.vue'
import BaseEmpty from '@/components/common/BaseEmpty.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import TaskCard from '@/components/business/TaskCard.vue'
import FeedbackModal from '@/components/business/FeedbackModal.vue'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { usePolling } from '@/composables/usePolling'
import type { WorkerTask } from '@/api/workers'

const tasksStore = useTasksStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const feedbackModal = ref<InstanceType<typeof FeedbackModal>>()

const taskData = computed(() => tasksStore.taskData)

async function loadTasks() {
  if (authStore.user?.name) {
    await tasksStore.fetchTasks(authStore.user.name)
  }
}

async function handleComplete(flowId: string, stepId: string, quantity: number) {
  if (!authStore.user?.name) return
  try {
    const result = await tasksStore.completeTask(flowId, stepId, quantity, authStore.user.name)
    appStore.showToast(result?.message || '已记录', 'success')
    await loadTasks()
  } catch {
    // error handled by interceptor
  }
}

function openFeedback(task: WorkerTask) {
  feedbackModal.value?.open(task.orderId, task.stepId, task.flowId)
}

onMounted(() => {
  loadTasks()
  usePolling(loadTasks, 30000).start()
})
</script>
