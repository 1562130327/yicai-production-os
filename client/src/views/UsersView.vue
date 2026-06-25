<template>
  <PageContainer>
    <div class="card">
      <div class="card__header">
        <span>用户管理</span>
        <button class="btn btn--primary btn--sm" @click="openCreate">+ 新增用户</button>
      </div>
      <div class="card__body">
        <BaseSpinner v-if="loading" size="lg" />
        <table v-else>
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>角色</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.username }}</td>
              <td>{{ u.name }}</td>
              <td>
                <BaseBadge :variant="roleVariant(u.role)">{{ roleLabel(u.role) }}</BaseBadge>
              </td>
              <td>
                <span :class="u.enabled ? 'text-success' : 'text-danger'">
                  {{ u.enabled ? '启用' : '禁用' }}
                </span>
              </td>
              <td>
                <button class="btn btn--sm" @click="openEdit(u)">编辑</button>
                <button class="btn btn--sm" @click="openResetPwd(u)">重置密码</button>
                <button
                  class="btn btn--sm"
                  :class="u.enabled ? 'btn--danger' : ''"
                  @click="toggleEnabled(u)"
                >
                  {{ u.enabled ? '禁用' : '启用' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal v-model="showModal" :title="isEditing ? '编辑用户' : '新增用户'">
      <div class="form-field">
        <label>用户名 *</label>
        <input v-model="form.username" :disabled="isEditing" placeholder="登录用户名" />
      </div>
      <div v-if="!isEditing" class="form-field">
        <label>密码 *</label>
        <input v-model="form.password" type="password" placeholder="初始密码" />
      </div>
      <div class="form-field">
        <label>姓名 *</label>
        <input v-model="form.name" placeholder="显示名称" />
      </div>
      <div class="form-field">
        <label>角色 *</label>
        <select v-model="form.role">
          <option value="admin">管理员</option>
          <option value="merchandiser">跟单员</option>
          <option value="worker">师傅</option>
        </select>
      </div>
      <template #footer>
        <button class="btn" @click="showModal = false">取消</button>
        <button class="btn btn--primary" :disabled="!canSubmit" @click="submitForm">
          {{ isEditing ? '保存' : '创建' }}
        </button>
      </template>
    </BaseModal>

    <BaseModal v-model="showResetPwd" title="重置密码">
      <div class="form-field">
        <label>新密码</label>
        <input v-model="newPassword" type="password" placeholder="至少4位" />
      </div>
      <template #footer>
        <button class="btn" @click="showResetPwd = false">取消</button>
        <button class="btn btn--primary" :disabled="newPassword.length < 4" @click="submitResetPwd">
          确认重置
        </button>
      </template>
    </BaseModal>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseSpinner from '@/components/common/BaseSpinner.vue'
import { usersApi, type UserItem } from '@/api/users'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const users = ref<UserItem[]>([])
const loading = ref(true)

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const form = ref({ username: '', password: '', name: '', role: 'worker' })

const showResetPwd = ref(false)
const resetTarget = ref<UserItem | null>(null)
const newPassword = ref('')

const canSubmit = computed(() => {
  if (isEditing.value) return !!form.value.name && !!form.value.role
  return !!form.value.username && !!form.value.password && !!form.value.name && !!form.value.role
})

const roleLabels: Record<string, string> = {
  admin: '管理员',
  merchandiser: '跟单员',
  worker: '师傅',
}

function roleLabel(role: string) {
  return roleLabels[role] || role
}

function roleVariant(role: string) {
  if (role === 'admin') return 'accent'
  if (role === 'merchandiser') return 'warning'
  return 'success'
}

async function loadUsers() {
  loading.value = true
  try {
    const { data } = await usersApi.list()
    users.value = data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEditing.value = false
  editingId.value = ''
  form.value = { username: '', password: '', name: '', role: 'worker' }
  showModal.value = true
}

function openEdit(u: UserItem) {
  isEditing.value = true
  editingId.value = u.id
  form.value = { username: u.username, password: '', name: u.name, role: u.role }
  showModal.value = true
}

function openResetPwd(u: UserItem) {
  resetTarget.value = u
  newPassword.value = ''
  showResetPwd.value = true
}

async function submitForm() {
  if (isEditing.value) {
    await usersApi.update(editingId.value, { name: form.value.name, role: form.value.role })
    appStore.showToast('用户已更新', 'success')
  } else {
    await usersApi.create(form.value)
    appStore.showToast('用户已创建', 'success')
  }
  showModal.value = false
  await loadUsers()
}

async function submitResetPwd() {
  if (!resetTarget.value) return
  await usersApi.resetPassword(resetTarget.value.id, newPassword.value)
  appStore.showToast('密码已重置', 'success')
  showResetPwd.value = false
}

async function toggleEnabled(u: UserItem) {
  await usersApi.update(u.id, { enabled: u.enabled ? 0 : 1 })
  appStore.showToast(u.enabled ? '用户已禁用' : '用户已启用', 'success')
  await loadUsers()
}

onMounted(loadUsers)
</script>

<style scoped lang="scss">
table {
  width: 100%;
}

td {
  .btn {
    margin-right: 4px;
  }
}

.form-field {
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

  input,
  select {
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

    &:disabled {
      opacity: 0.5;
    }
  }
}
</style>
