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
      <button @click="showPwdModal = true">改密</button>
      <button @click="logout">退出</button>
    </div>
  </header>

  <BaseModal v-model="showPwdModal" title="修改密码">
    <div class="pwd-field">
      <label>原密码</label>
      <input v-model="oldPwd" type="password" placeholder="当前密码" />
    </div>
    <div class="pwd-field">
      <label>新密码</label>
      <input v-model="newPwd" type="password" placeholder="至少4位" />
    </div>
    <div class="pwd-field">
      <label>确认密码</label>
      <input v-model="confirmPwd" type="password" placeholder="再输入一次" />
    </div>
    <div v-if="pwdError" class="pwd-error">{{ pwdError }}</div>
    <template #footer>
      <button class="btn" @click="showPwdModal = false">取消</button>
      <button class="btn btn--primary" :disabled="!canSubmitPwd" @click="changePwd">确认</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import { authApi } from '@/api/auth'
import { useAppStore } from '@/stores/app'

const authStore = useAuthStore()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const showPwdModal = ref(false)
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const pwdError = ref('')

const canSubmitPwd = computed(
  () => oldPwd.value && newPwd.value.length >= 4 && newPwd.value === confirmPwd.value,
)

async function changePwd() {
  pwdError.value = ''
  if (newPwd.value !== confirmPwd.value) {
    pwdError.value = '两次密码不一致'
    return
  }
  try {
    await authApi.changePassword(authStore.user!.username, oldPwd.value, newPwd.value)
    appStore.showToast('密码已修改', 'success')
    showPwdModal.value = false
    oldPwd.value = ''
    newPwd.value = ''
    confirmPwd.value = ''
  } catch {
    pwdError.value = '原密码错误'
  }
}

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
  { path: '/users', label: '用 户', roles: ['admin'] },
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

.pwd-field {
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 10px;
    color: $color-dim;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 4px;
    font-family: $font-mono;
  }

  input {
    width: 100%;
    padding: 7px 10px;
    background: $color-input;
    border: 1px solid $color-border;
    color: $color-text;
    font-size: 13px;
    font-family: $font-sans;
    border-radius: $radius-sm;
    outline: none;

    &:focus {
      border-color: $color-accent;
    }
  }
}

.pwd-error {
  color: $color-danger;
  font-size: 11px;
  margin-bottom: 8px;
}
</style>
