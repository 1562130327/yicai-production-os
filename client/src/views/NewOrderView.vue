<template>
  <PageContainer>
    <div class="card">
      <div class="card__header">新建订单</div>
      <div class="card__body">
        <div class="frm-grid">
          <div class="form-field" :class="{ 'form-field--error': errors.customerName }">
            <label>客户 *</label>
            <input
              v-model="form.customerName"
              list="custList"
              placeholder="选择或输入"
              autocomplete="off"
              @blur="validateField('customerName')"
            />
            <span v-if="errors.customerName" class="field-error">{{ errors.customerName }}</span>
            <datalist id="custList">
              <option v-for="c in customers" :key="c" :value="c" />
            </datalist>
          </div>
          <div class="form-field">
            <label>款号</label>
            <input v-model="form.productCode" placeholder="可选" />
          </div>
          <div class="form-field" :class="{ 'form-field--error': errors.processTemplate }">
            <label>工艺 *</label>
            <select
              v-model="form.processTemplate"
              @change="onTemplateChange"
              @blur="validateField('processTemplate')"
            >
              <option value="">选工艺...</option>
              <option v-for="item in templates" :key="item" :value="item">{{ item }}</option>
            </select>
            <span v-if="errors.processTemplate" class="field-error">{{
              errors.processTemplate
            }}</span>
          </div>
          <div class="form-field">
            <label>优先级</label>
            <select v-model="form.priority">
              <option value="unmentioned">客户没提</option>
              <option value="attention">客户关注</option>
              <option value="normal">客户催产</option>
              <option value="urgent">客户紧急</option>
              <option value="deadline">死命令</option>
            </select>
          </div>
          <div class="form-field">
            <label>用料</label>
            <select v-model="form.materialSpec">
              <option value="">选择用料...</option>
              <option v-for="opt in materialOptions" :key="opt.id" :value="opt.id">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div v-if="showSheet" class="form-field">
            <label>片材 宽×长×厚</label>
            <div class="frm-row">
              <input v-model="form.sheetWidth" placeholder="宽(m)" />
              <span class="dim">×</span>
              <input v-model="form.sheetLength" placeholder="长(m)" />
              <span class="dim">×</span>
              <input v-model="form.sheetThickness" placeholder="厚(mm)" />
              <input
                v-model.number="form.sheetQty"
                type="number"
                placeholder="总数"
                style="width: 70px"
              />
            </div>
          </div>
        </div>

        <div v-if="showDimRows" style="margin-top: 10px">
          <div v-for="(dim, i) in dimensions" :key="i" class="frm-row">
            <span class="dim-label">行</span>
            <template v-if="needsSlice">
              <input v-model="dim.sliceSize" placeholder="切片尺寸" />
              <input
                v-model.number="dim.sliceQty"
                type="number"
                placeholder="数量"
                style="width: 70px"
              />
            </template>
            <template v-if="needsPunch">
              <input v-model="dim.punchSize" placeholder="冲型后尺寸" />
              <input
                v-model.number="dim.punchQty"
                type="number"
                placeholder="数量"
                style="width: 70px"
              />
            </template>
            <button class="btn btn--danger btn--sm" @click="removeDim(i)">删</button>
          </div>
        </div>

        <div style="margin-top: 10px; display: flex; gap: 8px">
          <button v-if="showDimRows" class="btn" @click="addDim">+ 尺寸行</button>
          <button
            class="btn btn--primary"
            :disabled="submitting || !isFormValid"
            @click="submitOrder"
          >
            {{ submitting ? '提交中...' : '提 交' }}
          </button>
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageContainer from '@/components/layout/PageContainer.vue'
import { useOrdersStore } from '@/stores/orders'
import { useInventoryStore } from '@/stores/inventory'
import { useAppStore } from '@/stores/app'
import type { DimensionRow, OrderPriority } from '@/types/order'

const router = useRouter()
const ordersStore = useOrdersStore()
const inventoryStore = useInventoryStore()
const appStore = useAppStore()

const templates = [
  '片材',
  '片材切片',
  '片材冲型',
  '片材切片冲型',
  '切片冲型',
  '片材背胶',
  '片材背胶冲型',
  '片材背胶切片',
  '片材背胶切片冲型',
  '片材贴布',
  '片材贴布冲型',
  '片材贴布切片',
  '片材贴布切片冲型',
  '库存片材',
  '库存切片',
  '库存冲型',
  '库存切片冲型',
]

const customers = ref<string[]>([])
const submitting = ref(false)

const form = ref({
  customerName: '',
  productCode: '',
  processTemplate: '',
  priority: 'unmentioned',
  materialSpec: '',
  sheetWidth: '',
  sheetLength: '',
  sheetThickness: '',
  sheetQty: 0,
})

const dimensions = ref<DimensionRow[]>([])

const errors = ref<Record<string, string>>({})

function validateField(field: string) {
  const val = form.value[field as keyof typeof form.value]
  if (field === 'customerName' && !val) {
    errors.value.customerName = '请输入客户名'
  } else if (field === 'customerName') {
    delete errors.value.customerName
  }
  if (field === 'processTemplate' && !val) {
    errors.value.processTemplate = '请选择工艺'
  } else if (field === 'processTemplate') {
    delete errors.value.processTemplate
  }
}

const isFormValid = computed(() => {
  return !!form.value.customerName && !!form.value.processTemplate
})

const materialOptions = computed(() => inventoryStore.materialOptions)

const tpl = computed(() => form.value.processTemplate)
const showSheet = computed(() => tpl.value && !tpl.value.startsWith('库存') && tpl.value !== '打包')
const needsSlice = computed(() => tpl.value.includes('切片'))
const needsPunch = computed(() => tpl.value.includes('冲型'))
const showDimRows = computed(() => needsSlice.value || needsPunch.value)

function onTemplateChange() {
  if (showDimRows.value && dimensions.value.length === 0) {
    addDim()
  }
}

function addDim() {
  dimensions.value.push({ sliceSize: '', sliceQty: 0, punchSize: '', punchQty: 0 })
}

function removeDim(i: number) {
  dimensions.value.splice(i, 1)
}

async function submitOrder() {
  validateField('customerName')
  validateField('processTemplate')
  if (!isFormValid.value) return
  if (
    showSheet.value &&
    (!form.value.sheetWidth ||
      !form.value.sheetLength ||
      !form.value.sheetThickness ||
      !form.value.sheetQty)
  ) {
    appStore.showToast('请填片材尺寸和数量', 'warning')
    return
  }
  submitting.value = true
  try {
    const code = 'ORD-' + Date.now().toString(36).toUpperCase()
    await ordersStore.createOrder({
      code,
      customerName: form.value.customerName,
      productCode: form.value.productCode,
      processTemplate: form.value.processTemplate,
      priority: form.value.priority as OrderPriority,
      materialSpec: form.value.materialSpec,
      sheetSize: showSheet.value
        ? `${form.value.sheetWidth}×${form.value.sheetLength}×${form.value.sheetThickness}`
        : '',
      sliceSize: dimensions.value[0]?.sliceSize || '',
      sliceQty: dimensions.value[0]?.sliceQty || form.value.sheetQty,
      punchSize: dimensions.value[0]?.punchSize,
      punchQty: dimensions.value[0]?.punchQty,
      category: '未分类',
      dimensions: dimensions.value,
    })
    appStore.showToast('订单创建成功', 'success')
    router.push('/orders')
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  inventoryStore.fetchMaterialOptions()
})
</script>

<style scoped lang="scss">
.frm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  max-width: 700px;
}

.frm-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 8px;

  input {
    flex: 1;
    padding: 6px 8px;
    background: $color-input;
    border: 1px solid $color-border;
    color: $color-text;
    font-size: 12px;
    font-family: $font-sans;
    border-radius: $radius-sm;
    outline: none;

    &:focus {
      border-color: $color-accent;
    }
  }
}

.dim {
  color: $color-dim;
}

.dim-label {
  font-size: 10px;
  color: $color-dim;
  min-width: 24px;
}

.form-field--error {
  input,
  select {
    border-color: $color-danger;
  }
}

.field-error {
  display: block;
  font-size: 10px;
  color: $color-danger;
  margin-top: 2px;
}
</style>
