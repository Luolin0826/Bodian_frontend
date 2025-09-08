<template>
  <a-modal
    v-model:open="visible"
    :title="dialogTitle"
    width="600px"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :confirm-loading="loading"
    ok-text="保存"
    cancel-text="取消"
  >
    <div class="field-dialog-content">
      <div class="dialog-description">
        <p>为 <strong>{{ moduleInfo.sectionName }}</strong> 管理字段标题和顺序</p>
      </div>
      
      <a-form
        ref="formRef"
        :model="fieldForm"
        :rules="formRules"
        layout="vertical"
        @finish="handleSubmit"
      >
        <a-form-item label="字段标题" name="title" required>
          <a-input
            v-model:value="fieldForm.title"
            placeholder="请输入字段标题"
            size="large"
          />
        </a-form-item>
        
        
        <a-form-item label="显示顺序" name="displayOrder">
          <a-input-number
            v-model:value="fieldForm.displayOrder"
            :min="1"
            :max="100"
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
import { customFieldsAPI } from '@/api/policies'

// Props
interface Props {
  open?: boolean
  moduleType?: string
  moduleInfo?: any
  unitId?: number | null
  unitInfo?: any
  province?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  moduleType: '',
  moduleInfo: null,
  unitId: null,
  unitInfo: null,
  province: ''
})

// Emits
const emit = defineEmits<{
  'update:open': [open: boolean]
  'field-added': [fieldData: any]
}>()

// 响应式数据
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const loading = ref(false)
const formRef = ref<FormInstance>()

const fieldForm = reactive({
  title: '',
  displayOrder: 1
})

// 对话框标题
const dialogTitle = computed(() => {
  const sectionName = props.moduleInfo?.sectionName || '板块'
  return `添加${sectionName}字段`
})


// 获取模块对应的section值
const getSectionFromModuleType = (moduleType: string): string => {
  const moduleMap: Record<string, string> = {
    'early-batch': 'early_batch',
    'rural-grid': 'rural_grid',
    'basic-policy': 'basic'
  }
  return moduleMap[moduleType] || 'basic'
}

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入字段标题', trigger: 'blur' },
    { max: 50, message: '标题长度不能超过50个字符', trigger: 'blur' }
  ]
}

// 方法

const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value?.validate()
    
    loading.value = true
    
    // 计算section和province
    const section = getSectionFromModuleType(props.moduleType || 'basic-policy')
    const province = props.province || props.unitInfo?.province || ''
    
    console.log('🔍 字段创建参数:', {
      moduleType: props.moduleType,
      section: section,
      province: province,
      propsProvince: props.province,
      unitInfoProvince: props.unitInfo?.province
    })
    
    // 构建API所需的字段数据
    const apiFieldData = {
      field_name: `custom_${Date.now()}`, // 生成唯一的字段名
      display_name: fieldForm.title,
      field_type: 'text',
      section: section, // 根据moduleType动态计算
      province: province, // 优先使用传入的province参数
      is_required: false,
      display_order: fieldForm.displayOrder || 100,
      field_options: null,
      validation_rules: null
    }
    
    console.log('🚀 保存字段数据:', apiFieldData)
    
    // 验证必要参数
    if (!apiFieldData.province) {
      message.error('省份信息缺失，无法创建字段')
      return
    }
    
    // 调用真实API保存到后端
    const result = await customFieldsAPI.createCustomField(apiFieldData)
    
    console.log('字段创建成功:', result)
    
    message.success(`${props.moduleInfo?.sectionName}字段添加成功！`)
    
    // 发射事件通知父组件，传递API返回的字段信息
    emit('field-added', {
      ...result,
      fieldTitle: fieldForm.title,
      moduleType: props.moduleType,
      sectionName: props.moduleInfo?.sectionName
    })
    
    // 关闭对话框
    visible.value = false
    
    // 重置表单
    resetForm()
    
  } catch (error) {
    console.error('保存字段失败:', error)
    message.error('保存失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  fieldForm.title = ''
  fieldForm.displayOrder = 1
  formRef.value?.resetFields()
}

// 监听对话框打开，重置表单
watch(visible, (newVisible) => {
  if (newVisible) {
    resetForm()
    // 根据已有字段数量设置默认显示顺序
    fieldForm.displayOrder = 1
  }
})
</script>

<style scoped lang="less">
.field-dialog-content {
  .dialog-description {
    margin-bottom: 20px;
    padding: 12px 16px;
    background: #f6f8fa;
    border-radius: 6px;
    border-left: 3px solid #1890ff;
    
    p {
      margin: 0;
      color: #333;
      font-size: 14px;
      
      strong {
        color: #1890ff;
      }
    }
  }
  
  .template-suggestions {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }
    
    .suggestion-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .suggestion-btn {
        border-radius: 4px;
        border-color: #d9d9d9;
        color: #666;
        font-size: 12px;
        height: 28px;
        
        &:hover {
          border-color: #1890ff;
          color: #1890ff;
        }
      }
    }
  }
}
</style>