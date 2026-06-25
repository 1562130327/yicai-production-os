import { ref, computed, type Ref } from 'vue'

export function usePagination<T>(items: Ref<T[]>, pageSize = 20) {
  const currentPage = ref(1)

  const totalPages = computed(() => Math.ceil(items.value.length / pageSize))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return items.value.slice(start, start + pageSize)
  })

  function goToPage(page: number) {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  }

  function nextPage() {
    goToPage(currentPage.value + 1)
  }

  function prevPage() {
    goToPage(currentPage.value - 1)
  }

  return { currentPage, totalPages, paginatedItems, goToPage, nextPage, prevPage }
}
