import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 请求拦截器：自动注入 token
request.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    const message = error.response?.data?.error || '请求失败'
    const appStore = useAppStore()
    appStore.showToast(
      typeof message === 'string' ? message : message.message || '请求失败',
      'error',
    )
    return Promise.reject(error)
  },
)

export default request
