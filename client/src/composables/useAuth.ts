import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  async function login(username: string, password: string) {
    await authStore.login({ username, password })
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  }

  function logout() {
    authStore.logout()
  }

  return {
    ...authStore,
    login,
    logout,
  }
}
