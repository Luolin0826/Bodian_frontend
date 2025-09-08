<template>
  <a-modal
    v-model:open="visible"
    title="编辑字段标题"
    width="600px"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :confirm-loading="loading"
    ok-text="保存"
    cancel-text="取消"
  >
    <div class="field-edit-content" v-if="fieldData">
      <a-form
        ref="formRef"
        :model="editForm"
        :rules="formRules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <a-form-item label="字段标识" name="field_name">
          <a-input
            v-model:value="editForm.field_name"
            disabled
            placeholder="字段标识（不可修改）"
            size="large"
          />
          <small style="color: #666;">字段标识不可修改</small>
        </a-form-item>
        
        <a-form-item label="显示名称" name="display_name" required>
          <a-input
            v-model:value="editForm.display_name"
            placeholder="请输入字段显示名称"
            size="large"
          />
        </a-form-item>
        
        
        
        <a-form-item label="显示顺序" name="display_order">
          <a-input-number
            v-model:value="editForm.display_order"
            :min="1"
            :max="999"
            placeholder="显示顺序"
            size="large"
            style="width: 150px"
          />
          <span style="margin-left: 8px; color: #666; font-size: 12px;">
            数字越小越靠前显示
          </span>
        </a-form-item>
        
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue/es/form'

// Props
interface Props {
  open?: boolean
  fieldData?: any
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  fieldData: null
})

// Emits
const emit = defineEmits<{
  'update:open': [open: boolean]
  'field-edited': [fieldData: any]
}>()

// 响应式数据
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const loading = ref(false)
const formRef = ref<FormInstance>()

const editForm = reactive({
  field_name: '',
  display_name: '',
  display_order: 1
})


// 表单验证规则
const formRules = {
  display_name: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { max: 100, message: '显示名称长度不能超过100个字符', trigger: 'blur' }
  ]
}

// 监听字段数据变化，初始化表单
watch(() => props.fieldData, (newFieldData) => {
  if (newFieldData && props.open) {
    editForm.field_name = newFieldData.field_name || ''
    editForm.display_name = newFieldData.display_name || ''
    editForm.display_order = newFieldData.display_order || 1
  }
}, { immediate: true })


const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value?.validate()
    
    loading.value = true
    
    // 构建更新数据
    const updateData = {
      display_name: editForm.display_name,
      display_order: editForm.display_order
    }
    
    console.log('编辑字段数据:', updateData)
    
    // 发射事件给父组件处理
    emit('field-edited', updateData)
    
  } catch (error) {
    console.error('字段编辑验证失败:', error)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  editForm.field_name = ''
  editForm.display_name = ''
  editForm.display_order = 1
  formRef.value?.resetFields()
}

// 监听对话框关闭，重置表单
watch(visible, (newVisible) => {
  if (!newVisible) {
    setTimeout(() => {
      resetForm()
    }, 200)
  }
})
</script>

<style scoped lang="less">
.field-edit-content {
  .ant-form-item {
    margin-bottom: 16px;
  }
  
  .ant-input-number {
    width: 100%;
  }
}
</style>