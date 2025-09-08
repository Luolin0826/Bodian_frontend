<template>
  <div class="custom-field-manager">
    <!-- 自定义字段管理面板 -->
    <a-modal
      v-model:open="visible"
      title="字段管理（简化版）"
      width="1000px"
      :footer="null"
      @cancel="handleClose"
      class="custom-field-modal"
    >
      <div class="field-manager-content">
        <!-- 操作区域 -->
        <div class="manager-header">
          <div class="header-left">
            <div class="search-hint">
              <search-outlined style="color: #1890ff; margin-right: 6px;" />
              <span class="hint-text">按专栏和省份筛选字段：</span>
            </div>
            <div class="search-controls">
              <a-select
                v-model:value="selectedSection"
                placeholder="选择板块"
                style="width: 150px;"
                @change="loadCustomFields"
              >
                <a-select-option value="basic">基本政策信息</a-select-option>
                <a-select-option value="early_batch">提前批板块</a-select-option>
                <a-select-option value="rural_grid">农网板块</a-select-option>
                <a-select-option value="regional">地市县概览</a-select-option>
              </a-select>
              
              <a-select
                v-model:value="selectedProvince"
                placeholder="选择省份"
                style="width: 150px;"
                allow-clear
                show-search
                :loading="provincesLoading"
                :filter-option="(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                @change="loadCustomFields"
              >
                <a-select-option
                  v-for="province in provinces"
                  :key="province"
                  :value="province"
                >
                  {{ province }}
                </a-select-option>
              </a-select>
              
              <!-- 搜索状态提示 -->
              <div class="search-status" v-if="selectedProvince || selectedSection !== 'basic'">
                <a-tag color="blue" closable @close="resetFilters">
                  {{ getSearchStatusText() }}
                </a-tag>
              </div>
            </div>
          </div>
          
          <div class="header-right">
            <a-button
              type="primary"
              @click="showCreateModal"
              :loading="creating"
            >
              <plus-outlined />
              新增字段
            </a-button>
          </div>
        </div>
        
        <!-- 字段列表 -->
        <div class="fields-table">
          <a-table
            :columns="tableColumns"
            :data-source="customFields"
            :pagination="tablePagination"
            :loading="loading"
            size="small"
            :scroll="{ y: 400 }"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'is_active'">
                <a-switch
                  v-model:checked="record.is_active"
                  size="small"
                  @change="handleFieldStatusChange(record)"
                  :loading="updatingFields[record.id]"
                />
              </template>
              
              <template v-if="column.key === 'actions'">
                <div class="field-actions">
                  <a-tooltip title="编辑">
                    <a-button
                      type="text"
                      size="small"
                      @click="editField(record)"
                    >
                      <edit-outlined />
                    </a-button>
                  </a-tooltip>
                  
                  <a-tooltip title="删除">
                    <a-popconfirm
                      title="确定要删除此自定义字段吗？"
                      @confirm="deleteField(record)"
                      ok-text="确定"
                      cancel-text="取消"
                    >
                      <a-button
                        type="text"
                        size="small"
                        danger
                        :loading="deletingFields[record.id]"
                      >
                        <delete-outlined />
                      </a-button>
                    </a-popconfirm>
                  </a-tooltip>
                </div>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>
    
    <!-- 新增/编辑字段模态框 -->
    <a-modal
      v-model:open="fieldModalVisible"
      :title="editingField ? '编辑字段' : '新增字段'"
      width="600px"
      @ok="handleFieldSubmit"
      @cancel="handleFieldModalClose"
      :confirm-loading="submitting"
    >
      <a-form
        ref="fieldFormRef"
        :model="fieldForm"
        :rules="fieldFormRules"
        layout="vertical"
      >
        <!-- 基础信息 -->
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="字段标题" name="display_name">
              <a-input
                v-model:value="fieldForm.display_name"
                placeholder="请输入字段标题"
              />
            </a-form-item>
          </a-col>
          
          <a-col :span="12">
            <a-form-item label="显示顺序" name="display_order">
              <a-input-number
                v-model:value="fieldForm.display_order"
                :min="0"
                :max="999"
                placeholder="显示顺序"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>
        
        <!-- 高级选项 -->
        <template v-if="!editingField">
          <a-divider orientation="left" style="margin: 16px 0;">高级选项</a-divider>
          
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="字段名称" name="field_name">
                <a-input
                  v-model:value="fieldForm.field_name"
                  placeholder="请输入字段名称（英文）"
                />
                <div style="color: #999; font-size: 12px; margin-top: 4px;">
                  用于系统内部标识，建议使用英文
                </div>
              </a-form-item>
            </a-col>
            
            <a-col :span="12">
              <a-form-item label="所属板块" name="section">
                <a-select
                  v-model:value="fieldForm.section"
                  placeholder="选择所属板块"
                >
                  <a-select-option value="basic">基本政策信息</a-select-option>
                  <a-select-option value="early_batch">提前批板块</a-select-option>
                  <a-select-option value="rural_grid">农网板块</a-select-option>
                  <a-select-option value="regional">地市县概览</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="省份限制" name="province">
                <a-select
                  v-model:value="fieldForm.province"
                  placeholder="选择省份（可选，留空表示全国通用）"
                  allow-clear
                  show-search
                  :loading="provincesLoading"
                  :filter-option="(input, option) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0"
                >
                  <a-select-option
                    v-for="province in provinces"
                    :key="province"
                    :value="province"
                  >
                    {{ province }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </template>
        
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import {
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons-vue'
import { customFieldsAPI } from '@/api/policies'

// Props & Emits
interface Props {
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false
})

const emit = defineEmits<{
  'update:open': [open: boolean]
  'field-updated': [section: string]
}>()

// 响应式数据
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const loading = ref(false)
const creating = ref(false)
const submitting = ref(false)
const selectedSection = ref<string>('basic')
const selectedProvince = ref<string>('')
const customFields = ref<any[]>([])
const updatingFields = ref<Record<string, boolean>>({})
const deletingFields = ref<Record<string, boolean>>({})

// 字段编辑相关
const fieldModalVisible = ref(false)
const editingField = ref<any>(null)
const fieldFormRef = ref<FormInstance>()

// 字段表单数据
const fieldForm = reactive({
  field_name: '',
  display_name: '',
  field_type: 'text',
  section: 'basic',
  province: '',
  display_order: 0,
  is_active: true
})

// 省份列表（从API获取）
const provinces = ref<string[]>([])
const provincesLoading = ref(false)

// 表格配置
const tableColumns = [
  {
    title: '字段标题',
    dataIndex: 'display_name',
    key: 'display_name',
    width: 150
  },
  {
    title: '可见状态',
    key: 'is_active',
    width: 100,
    align: 'center' as const
  },
  {
    title: '显示顺序',
    dataIndex: 'display_order',
    key: 'display_order',
    width: 100,
    align: 'center' as const
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'center' as const,
    fixed: 'right' as const
  }
]

const tablePagination = {
  pageSize: 10,
  size: 'small' as const,
  showSizeChanger: true,
  showQuickJumper: true
}

// 表单验证规则  
const fieldFormRules: Record<string, Rule[]> = {
  display_name: [
    { required: true, message: '请输入字段标题', trigger: 'blur' }
  ],
  field_name: [
    { required: true, message: '请输入字段名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: '字段名称只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  section: [
    { required: true, message: '请选择所属板块', trigger: 'change' }
  ]
}

// 方法

// 加载省份列表
const loadProvinces = async () => {
  try {
    provincesLoading.value = true
    const response = await customFieldsAPI.getProvinces()
    provinces.value = response.provinces.map(p => p.province)
    console.log('省份列表加载成功:', provinces.value)
    console.log(`📊 省份统计: 共${response.total_provinces}个省份，包含自定义字段`)
  } catch (error) {
    console.error('加载省份列表失败:', error)
    message.error('加载省份列表失败')
    // 如果API失败，使用默认省份列表
    provinces.value = [
      '北京', '上海', '天津', '重庆',
      '河北', '山西', '辽宁', '吉林', '黑龙江',
      '江苏', '浙江', '安徽', '福建', '江西', '山东',
      '河南', '湖北', '湖南', '广东', '海南',
      '四川', '贵州', '云南', '陕西', '甘肃', '青海',
      '内蒙古', '广西', '西藏', '宁夏', '新疆'
    ]
  } finally {
    provincesLoading.value = false
  }
}

const loadCustomFields = async () => {
  try {
    loading.value = true
    
    const params: any = {
      section: selectedSection.value
    }
    
    if (selectedProvince.value) {
      params.province = selectedProvince.value
    }
    
    const response = await customFieldsAPI.getCustomFields(params)
    customFields.value = response.fields || []
    
    console.log('自定义字段加载成功:', customFields.value)
  } catch (error) {
    console.error('加载自定义字段失败:', error)
    message.error('加载自定义字段失败')
  } finally {
    loading.value = false
  }
}

const showCreateModal = () => {
  editingField.value = null
  resetFieldForm()
  fieldForm.section = selectedSection.value
  fieldModalVisible.value = true
}

const editField = (field: any) => {
  editingField.value = field
  Object.assign(fieldForm, {
    field_name: field.field_name,
    display_name: field.display_name,
    field_type: field.field_type,
    section: field.section,
    province: field.province || '',
    display_order: field.display_order || 0,
    is_active: field.is_active !== false
  })
  
  fieldModalVisible.value = true
}

const resetFieldForm = () => {
  Object.assign(fieldForm, {
    field_name: '',
    display_name: '',
    field_type: 'text',
    section: 'basic',
    province: '',
    display_order: 0,
    is_active: true
  })
}

const handleFieldSubmit = async () => {
  try {
    await fieldFormRef.value?.validate()
    submitting.value = true
    
    const formData = { ...fieldForm }
    
    if (editingField.value) {
      // 更新字段
      await customFieldsAPI.updateCustomField(editingField.value.id, formData)
      message.success('字段更新成功')
    } else {
      // 创建字段
      await customFieldsAPI.createCustomField(formData)
      message.success('字段创建成功')
    }
    
    fieldModalVisible.value = false
    await loadCustomFields()
    emit('field-updated', formData.section)
    
  } catch (error) {
    console.error('保存字段失败:', error)
    message.error('保存字段失败')
  } finally {
    submitting.value = false
  }
}

const handleFieldModalClose = () => {
  fieldModalVisible.value = false
  editingField.value = null
  resetFieldForm()
}

const handleFieldStatusChange = async (field: any) => {
  try {
    updatingFields.value[field.id] = true
    
    await customFieldsAPI.updateCustomField(field.id, {
      is_active: field.is_active
    })
    
    message.success(`字段${field.is_active ? '启用' : '禁用'}成功`)
    emit('field-updated', field.section)
    
  } catch (error) {
    // 回滚状态
    field.is_active = !field.is_active
    console.error('更新字段状态失败:', error)
    message.error('更新字段状态失败')
  } finally {
    delete updatingFields.value[field.id]
  }
}

const deleteField = async (field: any) => {
  try {
    deletingFields.value[field.id] = true
    
    await customFieldsAPI.deleteCustomField(field.id)
    message.success('字段删除成功')
    
    await loadCustomFields()
    emit('field-updated', field.section)
    
  } catch (error) {
    console.error('删除字段失败:', error)
    message.error('删除字段失败')
  } finally {
    delete deletingFields.value[field.id]
  }
}


const handleClose = () => {
  visible.value = false
}

// 获取搜索状态文本
const getSearchStatusText = (): string => {
  const parts: string[] = []
  
  if (selectedSection.value !== 'basic') {
    const sectionNames = {
      'basic': '基本政策信息',
      'early_batch': '提前批板块',
      'rural_grid': '农网板块',
      'regional': '地市县概览'
    }
    parts.push(`专栏：${sectionNames[selectedSection.value as keyof typeof sectionNames]}`)
  }
  
  if (selectedProvince.value) {
    parts.push(`省份：${selectedProvince.value}`)
  }
  
  return parts.join(' | ')
}

// 重置过滤器
const resetFilters = () => {
  selectedSection.value = 'basic'
  selectedProvince.value = ''
  loadCustomFields()
}

// 监听选择变化
watch([selectedSection, selectedProvince], () => {
  if (visible.value) {
    loadCustomFields()
  }
})

// 监听模态框显示
watch(visible, (newVisible) => {
  if (newVisible) {
    loadProvinces()
    loadCustomFields()
  }
})

// 页面加载时获取省份列表
onMounted(() => {
  loadProvinces()
})
</script>

<style scoped lang="less">
.custom-field-manager {
  .manager-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      
      .search-hint {
        display: flex;
        align-items: center;
        
        .hint-text {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }
      }
      
      .search-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      
      .search-status {
        display: flex;
        align-items: center;
        
        .ant-tag {
          margin: 0;
        }
      }
    }
  }
  
  .fields-table {
    :deep(.ant-table) {
      .ant-table-thead > tr > th {
        background: #fafafa;
        font-weight: 600;
        font-size: 13px;
      }
      
      .ant-table-tbody > tr > td {
        font-size: 13px;
        padding: 8px;
      }
    }
  }
  
  .field-actions {
    display: flex;
    gap: 4px;
  }
  
}

.custom-field-modal {
  :deep(.ant-modal-header) {
    background: linear-gradient(135deg, #f6f8fa 0%, #e6f7ff 100%);
    border-bottom: 1px solid #e8e8e8;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .custom-field-manager {
    .manager-header {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      
      .header-left {
        flex-wrap: wrap;
        gap: 8px;
      }
    }
  }
}
</style>