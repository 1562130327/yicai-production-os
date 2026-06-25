<template>
  <PageContainer>
    <div class="card">
      <div class="card__header">库存入库</div>
      <div class="card__body">
        <div class="frm-grid">
          <div class="form-field" :class="{ 'form-field--error': errors.supplier }">
            <label>供应商 *</label>
            <input
              v-model="form.supplier"
              list="supList"
              placeholder="选择或输入"
              @blur="validateField('supplier')"
            />
            <span v-if="errors.supplier" class="field-error">{{ errors.supplier }}</span>
            <datalist id="supList" />
          </div>
          <div class="form-field" :class="{ 'form-field--error': errors.material }">
            <label>材质 *</label>
            <input
              v-model="form.material"
              list="matList"
              placeholder="选择或输入"
              @blur="validateField('material')"
            />
            <span v-if="errors.material" class="field-error">{{ errors.material }}</span>
            <datalist id="matList" />
          </div>
          <div class="form-field">
            <label>颜色</label>
            <input v-model="form.color" placeholder="白/黑/灰..." />
          </div>
          <div class="form-field">
            <label>规格 宽×长×厚</label>
            <div class="frm-row">
              <input v-model="form.width" placeholder="宽(m)" />
              <span class="dim">×</span>
              <input v-model="form.length" placeholder="长(m)" />
              <span class="dim">×</span>
              <input v-model="form.thickness" placeholder="厚(mm)" />
            </div>
          </div>
          <div class="form-field" :class="{ 'form-field--error': errors.quantity }">
            <label>数量(床) *</label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="1"
              @blur="validateField('quantity')"
            />
            <span v-if="errors.quantity" class="field-error">{{ errors.quantity }}</span>
          </div>
          <div class="form-field">
            <label>单价(可选)</label>
            <input v-model.number="form.price" type="number" min="0" />
          </div>
          <div class="form-field">
            <label>备注</label>
            <input v-model="form.notes" placeholder="批次号" />
          </div>
        </div>
        <button
          class="btn btn--primary"
          style="margin-top: 12px"
          :disabled="submitting || !isFormValid"
          @click="submitInbound"
        >
          {{ submitting ? '入库中...' : '确认入库' }}
        </button>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import { materialsApi } from '@/api/materials'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const submitting = ref(false)

const form = ref({
  supplier: '',
  material: '',
  color: '',
  width: '',
  length: '',
  thickness: '',
  quantity: 0,
  price: 0,
  notes: '',
})

const errors = ref<Record<string, string>>({})

function validateField(field: string) {
  const f = form.value
  if (field === 'supplier') {
    errors.value.supplier = !f.supplier ? '请输入供应商' : ''
  } else if (field === 'material') {
    errors.value.material = !f.material ? '请输入材质' : ''
  } else if (field === 'quantity') {
    errors.value.quantity = !f.quantity || f.quantity < 1 ? '数量必须大于0' : ''
  }
  if (!errors.value[field]) delete errors.value[field]
}

const isFormValid = computed(() => {
  const f = form.value
  return !!(f.supplier && f.material && f.quantity >= 1)
})

async function submitInbound() {
  validateField('supplier')
  validateField('material')
  validateField('quantity')
  if (!isFormValid.value) return
  const f = form.value
  submitting.value = true
  try {
    await materialsApi.inbound({
      supplier: f.supplier,
      material: f.material,
      color: f.color,
      width: parseFloat(f.width),
      length: parseFloat(f.length),
      thickness: parseFloat(f.thickness),
      quantity: f.quantity,
      price: f.price || undefined,
      notes: f.notes || undefined,
    })
    appStore.showToast('入库成功', 'success')
    form.value = {
      supplier: '',
      material: '',
      color: '',
      width: '',
      length: '',
      thickness: '',
      quantity: 0,
      price: 0,
      notes: '',
    }
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}
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
  margin-top: 0;

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
