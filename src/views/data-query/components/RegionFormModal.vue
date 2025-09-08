<template>
  <a-modal
    v-model:open="visible"
    :title="modalTitle"
    :width="600"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirm-loading="loading"
    destroy-on-close
  >
    <a-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      layout="horizontal"
    >
      <a-form-item label="区域层级" name="region_level">
        <a-select
          v-model:value="formData.region_level"
          :disabled="mode === 'edit'"
          @change="handleLevelChange"
          placeholder="请选择区域层级"
        >
          <a-select-option value="province">
            <global-outlined />
            省级
          </a-select-option>
          <a-select-option value="city" :disabled="!canAddCity">
            <cluster-outlined />
            市级
          </a-select-option>
          <a-select-option value="company" :disabled="!canAddCompany">
            <bank-outlined />
            区县公司
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item 
        v-if="formData.region_level !== 'province'" 
        label="上级区域" 
        name="parent_id"
      >
        <a-tree-select
          v-model:value="formData.parent_id"
          :tree-data="parentOptions"
          :field-names="{ label: 'title', value: 'value', children: 'children' }"
          placeholder="选择上级区域"
          tree-default-expand-all
          allow-clear
          :loading="parentOptionsLoading"
          @change="handleParentChange"
        />
      </a-form-item>

      <a-form-item label="区域名称" name="region_name">
        <a-input 
          v-model:value="formData.region_name" 
          placeholder="请输入区域名称"
          :maxlength="50"
          show-count
        />
      </a-form-item>

      <a-form-item label="区域代码" name="region_code">
        <a-input 
          v-model:value="formData.region_code" 
          placeholder="请输入区域代码（可选）"
          :maxlength="20"
        />
      </a-form-item>

      <!-- 根据层级显示不同的字段 -->
      <template v-if="formData.region_level === 'province'">
        <a-form-item label="省份名称" name="province">
          <a-input 
            v-model:value="formData.province" 
            placeholder="请输入省份名称"
            :maxlength="50"
          />
        </a-form-item>
      </template>

      <template v-else-if="formData.region_level === 'city'">
        <a-form-item label="城市名称" name="city">
          <a-input 
            v-model:value="formData.city" 
            placeholder="请输入城市名称"
            :maxlength="50"
          />
        </a-form-item>
        
        <a-form-item label="所属省份" name="province_display">
          <a-input 
            :value="selectedProvinceName" 
            disabled 
            placeholder="请先选择上级省份"
          />
        </a-form-item>
      </template>

      <template v-else-if="formData.region_level === 'company'">
        <a-form-item label="公司名称" name="company">
          <a-input 
            v-model:value="formData.company" 
            placeholder="请输入区县公司名称"
            :maxlength="100"
          />
        </a-form-item>
        
        <a-form-item label="所属路径" name="path_display">
          <a-input 
            :value="selectedPathName" 
            disabled 
            placeholder="请先选择上级城市"
          />
        </a-form-item>
      </template>

      <!-- 描述信息 -->
      <a-form-item label="描述" name="description">
        <a-textarea 
          v-model:value="formData.description" 
          placeholder="请输入区域描述信息（可选）"
          :rows="3"
          :maxlength="200"
          show-count
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-space>
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleOk" :loading="loading">
          {{ mode === 'add' ? '创建' : '更新' }}
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { policyManagementAPI } from '@/api/policies'
import {
  GlobalOutlined,
  ClusterOutlined,
  BankOutlined
} from '@ant-design/icons-vue'

// 接口定义
interface FormData {
  region_level: 'province' | 'city' | 'company'
  region_name: string
  region_code: string
  parent_id?: number
  province: string
  city: string
  company: string
  description: string
}

interface ParentOption {
  title: string
  value: number
  children?: ParentOption[]
  region_level: string
  province?: string
  city?: string
}

// Props
interface Props {
  open: boolean
  mode: 'add' | 'edit'
  regionData?: any
  parentNode?: any
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  mode: 'add',
  regionData: null,
  parentNode: null
})

// Emits
const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)
const parentOptionsLoading = ref(false)
const parentOptions = ref<ParentOption[]>([])

// 表单数据
const formData = reactive<FormData>({
  region_level: 'province',
  region_name: '',
  region_code: '',
  parent_id: undefined,
  province: '',
  city: '',
  company: '',
  description: ''
})

// 计算属性
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const modalTitle = computed(() => {
  const actionText = props.mode === 'add' ? '新增' : '编辑'
  const levelText = getLevelText(formData.region_level)
  return `${actionText}${levelText}`
})

const canAddCity = computed(() => {
  // 如果有父节点且父节点是省级，或者没有父节点限制
  return !props.parentNode || props.parentNode.region_level === 'province'
})

const canAddCompany = computed(() => {
  // 如果有父节点且父节点是市级，或者没有父节点限制
  return !props.parentNode || props.parentNode.region_level === 'city'
})

const selectedProvinceName = computed(() => {
  if (!formData.parent_id || !parentOptions.value.length) return ''
  
  const findProvince = (options: ParentOption[]): string => {
    for (const option of options) {
      if (option.value === formData.parent_id) {
        return option.province || option.title
      }
      if (option.children) {
        const found = findProvince(option.children)
        if (found) return found
      }
    }
    return ''
  }
  
  return findProvince(parentOptions.value)
})

const selectedPathName = computed(() => {
  if (!formData.parent_id || !parentOptions.value.length) return ''
  
  const findPath = (options: ParentOption[], path: string[] = []): string => {
    for (const option of options) {
      const currentPath = [...path, option.title]
      
      if (option.value === formData.parent_id) {
        return currentPath.join(' / ')
      }
      
      if (option.children) {
        const found = findPath(option.children, currentPath)
        if (found) return found
      }
    }
    return ''
  }
  
  return findPath(parentOptions.value)
})

// 表单验证规则
const formRules: Record<string, Rule[]> = {
  region_level: [
    { required: true, message: '请选择区域层级', trigger: 'change' }
  ],
  region_name: [
    { required: true, message: '请输入区域名称', trigger: 'blur' },
    { min: 2, max: 50, message: '区域名称长度在2-50个字符', trigger: 'blur' }
  ],
  parent_id: [
    { 
      required: true, 
      message: '请选择上级区域', 
      trigger: 'change',
      validator: (rule: any, value: any) => {
        if (formData.region_level !== 'province' && !value) {
          return Promise.reject('请选择上级区域')
        }
        return Promise.resolve()
      }
    }
  ],
  province: [
    { 
      required: true, 
      message: '请输入省份名称', 
      trigger: 'blur',
      validator: (rule: any, value: any) => {
        if (formData.region_level === 'province' && !value) {
          return Promise.reject('请输入省份名称')
        }
        return Promise.resolve()
      }
    }
  ],
  city: [
    { 
      required: true, 
      message: '请输入城市名称', 
      trigger: 'blur',
      validator: (rule: any, value: any) => {
        if (formData.region_level === 'city' && !value) {
          return Promise.reject('请输入城市名称')
        }
        return Promise.resolve()
      }
    }
  ],
  company: [
    { 
      required: true, 
      message: '请输入公司名称', 
      trigger: 'blur',
      validator: (rule: any, value: any) => {
        if (formData.region_level === 'company' && !value) {
          return Promise.reject('请输入公司名称')
        }
        return Promise.resolve()
      }
    }
  ]
}

// 方法
const getLevelText = (level: string) => {
  const levelMap = {
    province: '省份',
    city: '城市',
    company: '区县公司'
  }
  return levelMap[level as keyof typeof levelMap] || '区域'
}

const resetForm = () => {
  Object.assign(formData, {
    region_level: 'province',
    region_name: '',
    region_code: '',
    parent_id: undefined,
    province: '',
    city: '',
    company: '',
    description: ''
  })
}

const initFormData = () => {
  if (props.mode === 'add') {
    resetForm()
    
    // 如果有父节点，则根据父节点设置默认值
    if (props.parentNode) {
      const parentLevel = props.parentNode.region_level
      
      if (parentLevel === 'province') {
        formData.region_level = 'city'
        formData.parent_id = props.parentNode.region_id
        formData.province = props.parentNode.province || props.parentNode.title
      } else if (parentLevel === 'city') {
        formData.region_level = 'company'
        formData.parent_id = props.parentNode.region_id
        formData.province = props.parentNode.province || ''
        formData.city = props.parentNode.city || props.parentNode.title
      }
    }
  } else if (props.mode === 'edit' && props.regionData) {
    // 编辑模式，填充现有数据
    Object.assign(formData, {
      region_level: props.regionData.region_level,
      region_name: props.regionData.region_name || '',
      region_code: props.regionData.region_code || '',
      parent_id: props.regionData.parent_id,
      province: props.regionData.province || '',
      city: props.regionData.city || '',
      company: props.regionData.company || '',
      description: props.regionData.description || ''
    })
  }
}

const loadParentOptions = async () => {
  if (formData.region_level === 'province') {
    parentOptions.value = []
    return
  }
  
  try {
    parentOptionsLoading.value = true
    
    const targetLevel = formData.region_level === 'city' ? 'province' : 'city'
    const regions = await policyManagementAPI.getRegions({
      region_level: targetLevel
    })
    
    if (targetLevel === 'province') {
      // 省级选项，直接转换
      parentOptions.value = regions.map(region => ({
        title: region.region_name || region.province,
        value: region.region_id,
        region_level: region.region_level,
        province: region.province
      }))
    } else {
      // 市级选项，需要按省份分组
      const provinceMap = new Map<string, ParentOption>()
      
      for (const region of regions) {
        const provinceName = region.province || '未知省份'
        
        if (!provinceMap.has(provinceName)) {
          provinceMap.set(provinceName, {
            title: provinceName,
            value: -1, // 省份组节点，不可选
            region_level: 'province',
            province: provinceName,
            children: []
          })
        }
        
        provinceMap.get(provinceName)!.children!.push({
          title: region.city || region.region_name,
          value: region.region_id,
          region_level: region.region_level,
          province: region.province,
          city: region.city
        })
      }
      
      parentOptions.value = Array.from(provinceMap.values())
    }
    
  } catch (error) {
    console.error('加载上级区域选项失败:', error)
    message.error('加载上级区域选项失败')
  } finally {
    parentOptionsLoading.value = false
  }
}

const handleLevelChange = () => {
  formData.parent_id = undefined
  formData.province = ''
  formData.city = ''
  formData.company = ''
  
  loadParentOptions()
}

const handleParentChange = (value: number) => {
  if (!value || !parentOptions.value.length) return
  
  const findSelected = (options: ParentOption[]): ParentOption | null => {
    for (const option of options) {
      if (option.value === value) {
        return option
      }
      if (option.children) {
        const found = findSelected(option.children)
        if (found) return found
      }
    }
    return null
  }
  
  const selected = findSelected(parentOptions.value)
  if (selected) {
    if (formData.region_level === 'city') {
      formData.province = selected.province || selected.title
    } else if (formData.region_level === 'company') {
      formData.province = selected.province || ''
      formData.city = selected.city || selected.title
    }
  }
}

const handleOk = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    const submitData = {
      region_name: formData.region_name,
      region_level: formData.region_level,
      region_code: formData.region_code || undefined,
      parent_id: formData.parent_id,
      province: formData.province || undefined,
      city: formData.city || undefined,
      company: formData.company || undefined,
      description: formData.description || undefined
    }
    
    if (props.mode === 'add') {
      await policyManagementAPI.createRegion(submitData)
    } else {
      await policyManagementAPI.updateRegion(props.regionData.region_id, submitData)
    }
    
    emit('success')
    
  } catch (error) {
    console.error('保存区域失败:', error)
    message.error('保存区域失败')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  visible.value = false
  resetForm()
}

// 监听器
watch(() => props.open, (open) => {
  if (open) {
    nextTick(() => {
      initFormData()
      loadParentOptions()
    })
  }
})

watch(() => formData.region_level, () => {
  loadParentOptions()
})
</script>

<style scoped lang="less">
.ant-form {
  .ant-select,
  .ant-input,
  .ant-textarea {
    width: 100%;
  }
  
  .ant-form-item-label {
    > label {
      font-weight: 500;
    }
  }
}

:deep(.ant-tree-select) {
  .ant-select-selector {
    .ant-select-selection-item {
      display: flex;
      align-items: center;
    }
  }
}
</style>