import { defineStore } from 'pinia'
import { ref } from 'vue'
import { workersApi, type WorkerTaskData } from '@/api/workers'
import { processesApi } from '@/api/processes'

export const useTasksStore = defineStore('tasks', () => {
  const taskData = ref<WorkerTaskData | null>(null)
  const loading = ref(false)

  async function fetchTasks(workerName: string) {
    loading.value = true
    try {
      const { data } = await workersApi.getTasks(workerName)
      taskData.value = data
    } finally {
      loading.value = false
    }
  }

  async function completeTask(flowId: string, stepId: string, quantity: number, worker: string) {
    const { data } = await processesApi.complete(flowId, stepId, quantity, worker)
    return data
  }

  return { taskData, loading, fetchTasks, completeTask }
})
