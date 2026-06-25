<template>
  <header class="topbar">
    <div class="logo">溢 彩</div>
    <nav>
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="{ active: isActive(item.path) }"
      >
        {{ item.label }}
      </router-link>
    </nav>
    <div class="user">
      <span>{{ authStore.user?.name || '--' }}</span>
      <button @click="logout">退出</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const allNavItems = [
  { path: '/dashboard', label: '看 板', roles: ['admin', 'merchandiser', 'worker'] },
  { path: '/tasks', label: '任 务', roles: ['admin', 'merchandiser', 'worker'] },
  { path: '/orders', label: '订 单', roles: ['admin', 'merchandiser', 'worker'] },
  { path: '/orders/new', label: '录 单', roles: ['admin', 'merchandiser'] },
  { path: '/inventory', label: '库 存', roles: ['admin', 'merchandiser', 'worker'] },
  { path: '/inbound', label: '入 库', roles: ['admin'] },
  { path: '/machines', label: '机 器', roles: ['admin', 'merchandiser', 'worker'] },
  { path: '/workers', label: '工 人', roles: ['admin', 'merchandiser', 'worker'] },
  { path: '/reports', label: '报 表', roles: ['admin', 'merchandiser', 'worker'] },
]

const navItems = allNavItems.filter((item) => {
  const role = authStore.user?.role
  return role && item.roles.includes(role)
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.topbar {
  background: $color-surface;
  border-bottom: 1px solid $color-border;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  position: sticky;
  top: 0;
  z-index: $z-topbar;
}

.logo {
  font-family: $font-mono;
  font-size: 18px;
  color: $color-accent;
  letter-spacing: 6px;
  margin-right: 24px;
  flex-shrink: 0;
}

nav {
  display: flex;
  gap: 2px;
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

nav a {
  color: $color-dim;
  text-decoration: none;
  padding: 13px 14px;
  font-size: 12px;
  letter-spacing: 1px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color $transition-fast;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover,
  &.active {
    color: $color-text;
  }

  &.active {
    border-bottom-color: $color-accent;
  }
}

.user {
  font-size: 11px;
  color: $color-dim;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;

  button {
    background: none;
    border: 1px solid $color-border;
    color: $color-dim;
    padding: 3px 10px;
    border-radius: $radius-sm;
    cursor: pointer;
    font-size: 10px;
    letter-spacing: 1px;

    &:hover {
      color: $color-danger;
      border-color: $color-danger;
    }
  }
}

@media (max-width: 768px) {
  .topbar {
    height: auto;
    flex-wrap: wrap;
    padding: 8px 12px;
  }

  .logo {
    font-size: 16px;
    margin-right: 12px;
  }

  nav {
    order: 3;
    width: 100%;
    padding-top: 6px;
  }

  nav a {
    padding: 8px 10px;
    font-size: 11px;
  }

  .user {
    margin-left: auto;
  }
}
</style>
