<template>
  <div class="login-page">
    <div class="login-box">
      <div class="brand">
        <div class="logo">溢 彩</div>
        <div class="subtitle">Production OS</div>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="form-field">
          <label>用户名</label>
          <input
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>
        <div class="form-field">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <button
          type="submit"
          class="btn btn--primary login-btn"
          :disabled="loading || !username || !password"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg;
}

.login-box {
  width: 380px;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  padding: 44px 40px 36px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, $color-accent, transparent);
  }
}

.brand {
  text-align: center;
  margin-bottom: 36px;
}

.logo {
  font-family: $font-mono;
  font-size: 28px;
  color: $color-accent;
  letter-spacing: 12px;
}

.subtitle {
  font-size: 10px;
  color: $color-dim;
  letter-spacing: 4px;
  margin-top: 6px;
  text-transform: uppercase;
}

.form-field {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 10px;
    color: $color-dim;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 6px;
    font-family: $font-mono;
  }

  input {
    width: 100%;
    padding: 10px 12px;
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

.error {
  color: $color-danger;
  font-size: 11px;
  margin-bottom: 12px;
  text-align: center;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  font-size: 13px;
}
</style>
