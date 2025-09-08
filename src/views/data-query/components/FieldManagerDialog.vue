<template>
  <a-modal
    v-model:open="visible"
    :title="`${moduleInfo.sectionName}字段管理`"
    width="800px"
    :maskClosable="false"
    @cancel="handleCancel"
  >
    <template #footer>
      <div class="dialog-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleSave" :loading="saving">
          保存更改
        </a-button>
      </div>
    </template>
    
    <div class="field-manager">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="正在加载字段列表...">
          <div class="loading-placeholder"></div>
        </a-spin>
      </div>
      
      <!-- 字段列表 -->
      <div v-else-if="fields.length > 0" class="fields-list">
        <div class="list-header">
          <h4>
            <unordered-list-outlined />
            字段管理
          </h4>
          <div class="header-actions">
            <a-button 
              type="primary" 
              size="small" 
              @click="openAddFieldDialog"
            >
              <plus-outlined />
              新增字段
            </a-button>
          </div>
        </div>
        
        <div class="fields-container">
          <a-table
            :dataSource="fields"
            :columns="columns"
            :pagination="false"
            size="small"
            :scroll="{ y: 400 }"
            rowKey="field_id"
          >
            <!-- 字段名称 -->
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'field_name'">
                <div class="field-info">
                  <div class="field-name">{{ record.display_name }}</div>
                  <div class="field-details" v-if="record.field_name !== record.display_name">
                    <small class="text-muted">{{ record.field_name }}</small>
                  </div>
                </div>
              </template>
              
              <!-- 可见状态 -->
              <template v-else-if="column.key === 'is_visible'">
                <div class="visibility-control">
                  <a-switch
                    :checked="Boolean(record.is_visible)"
                    :loading="record.updating"
                    @change="(checked) => toggleFieldVisibility(record, checked)"
                    size="small"
                  />
                  <div class="status-info">
                    <a-tag 
                      :color="record.is_visible ? 'success' : 'default'" 
                      size="small"
                    >
                      {{ record.is_visible ? '显示' : '隐藏' }}
                    </a-tag>
                    <div class="status-desc" v-if="record.is_required">
                      <small class="text-warning">必填字段</small>
                    </div>
                  </div>
                </div>
              </template>
              
              <!-- 显示顺序 -->
              <template v-else-if="column.key === 'display_order'">
                <div class="order-controls">
                  <a-input-number
                    v-model:value="record.display_order"
                    :min="1"
                    :max="999"
                    size="small"
                    @change="markOrderChanged(record)"
                  />
                  <div class="order-hint">
                    <small class="text-muted">数字越小越靠前</small>
                  </div>
                </div>
              </template>
              
              <!-- 操作 -->
              <template v-else-if="column.key === 'actions'">
                <div class="field-actions">
                  <a-tooltip title="编辑字段">
                    <a-button
                      type="text"
                      size="small"
                      @click="() => { console.log('按钮被点击了'); editField(record) }"
                    >
                      <edit-outlined />
                    </a-button>
                  </a-tooltip>
                  
                  <a-popconfirm
                    :title="`确定要删除字段「${record.display_name}」吗？`"
                    description="删除后无法恢复，请谨慎操作"
                    ok-text="确认删除"
                    cancel-text="取消"
                    ok-type="danger"
                    @confirm="deleteField(record)"
                  >
                    <a-tooltip title="删除字段">
                      <a-button
                        type="text"
                        size="small"
                        danger
                      >
                        <delete-outlined />
                      </a-button>
                    </a-tooltip>
                  </a-popconfirm>
                </div>
              </template>
            </template>
          </a-table>
        </div>
      </div>
      
      <!-- 无字段状态 -->
      <div v-else class="no-fields-state">
        <div class="no-fields-content">
          <inbox-outlined class="no-fields-icon" />
          <p class="no-fields-text">该模块暂无自定义字段</p>
          <a-button 
            type="primary" 
            @click="openAddFieldDialog"
          >
            <plus-outlined />
            创建第一个字段
          </a-button>
        </div>
      </div>
    </div>
    
    <!-- 字段添加对话框 -->
    <SimpleFieldDialog
      v-model:open="addFieldDialogVisible"
      :module-type="moduleType"
      :module-info="moduleInfo"
      :unit-id="unitId"
      :unit-info="unitInfo"
      :province="province"
      @field-added="handleFieldAdded"
    />
    
    <!-- 字段编辑对话框 -->
    <FieldEditDialog
      v-model:open="editFieldDialogVisible"
      :field-data="editingField"
      @field-edited="handleFieldEdited"
    />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { TableColumnsType } from 'ant-design-vue'
import {
  UnorderedListOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined
} from '@ant-design/icons-vue'
import SimpleFieldDialog from './SimpleFieldDialog.vue'
import FieldEditDialog from './FieldEditDialog.vue'
import { customFieldsAPI } from '@/api/policies'

// Props
interface Props {
  open: boolean
  moduleType: 'early-batch' | 'rural-grid' | 'basic-policy'
  moduleInfo: {
    sectionName: string
  }
  unitId?: number | null
  unitInfo?: any
  province?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  unitId: null,
  unitInfo: null,
  province: ''
})

// Emits
const emit = defineEmits<{
  'update:open': [open: boolean]
  'fields-updated': []
}>()

// 响应式数据
const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const loading = ref(false)
const saving = ref(false)
const fields = ref<any[]>([])
const orderChanges = ref<Set<number>>(new Set())
const addFieldDialogVisible = ref(false)

// 表格列定义
const columns: TableColumnsType = [
  {
    title: '字段标题',
    key: 'field_name',
    width: 200
  },
  {
    title: '可见状态',
    key: 'is_visible',
    width: 120,
    align: 'center'
  },
  {
    title: '显示顺序',
    key: 'display_order',
    width: 120,
    align: 'center'
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center'
  }
]

// 获取模块对应的section值
const getSectionFromModuleType = (moduleType: string): string => {
  const moduleMap: Record<string, string> = {
    'early-batch': 'early_batch',
    'rural-grid': 'rural_grid',
    'basic-policy': 'basic'
  }
  return moduleMap[moduleType] || 'basic'
}

// 获取字段类型文本
const getFieldTypeText = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    'text': '文本',
    'textarea': '多行文本',
    'select': '选择',
    'boolean': '是/否',
    'number': '数字',
    'date': '日期'
  }
  return typeMap[fieldType] || fieldType
}

// 获取字段类型颜色
const getFieldTypeColor = (fieldType: string): string => {
  const colorMap: Record<string, string> = {
    'text': 'green',
    'textarea': 'orange',
    'select': 'purple',
    'boolean': 'cyan',
    'number': 'blue',
    'date': 'geekblue'
  }
  return colorMap[fieldType] || 'default'
}

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// 加载字段列表
const loadFields = async () => {
  if (!visible.value) return
  
  try {
    loading.value = true
    const section = getSectionFromModuleType(props.moduleType)
    
    console.log('加载字段列表:', { section, province: props.province })
    console.log('🔍 调试信息:', { 
      'props.province': props.province, 
      'province类型': typeof props.province,
      'province长度': props.province?.length 
    })
    
    // 使用customFieldsAPI获取管理字段列表
    const result = await customFieldsAPI.getFieldsForManagement(section, props.province)
    
    console.log('字段列表加载结果:', result)
    
    // 处理后端数据，确保字段格式正确
    fields.value = (result.fields || []).map((field: any) => ({
      ...field,
      // 确保is_visible是布尔值处理
      is_visible: Boolean(field.is_visible),
      // 确保display_order是数字
      display_order: Number(field.display_order) || 100,
      // 确保is_required是布尔值处理
      is_required: Boolean(field.is_required),
      // 添加临时状态标记
      updating: false
    }))
    
    console.log('处理后的字段列表:', fields.value)
    
  } catch (error) {
    console.error('加载字段列表失败:', error)
    message.error(`加载字段列表失败: ${error.message}`)
    fields.value = []
  } finally {
    loading.value = false
  }
}

// 切换字段可见性
const toggleFieldVisibility = async (field: any, isVisible: boolean) => {
  try {
    field.updating = true
    
    // 使用customFieldsAPI切换字段可见性
    const result = await customFieldsAPI.toggleFieldVisibility(field.field_id, isVisible)
    
    // 更新字段状态，确保是数字格式（后端返回0/1）
    field.is_visible = isVisible ? 1 : 0
    message.success(result.message || `字段已${isVisible ? '显示' : '隐藏'}`)
    
    // 通知父组件刷新数据
    emit('fields-updated')
  } catch (error) {
    console.error('切换字段可见性失败:', error)
    // 恢复原状态
    field.is_visible = !isVisible ? 1 : 0
    message.error(`切换字段可见性失败: ${error.message}`)
  } finally {
    field.updating = false
  }
}

// 标记顺序改变
const markOrderChanged = (field: any) => {
  orderChanges.value.add(field.field_id)
}

// 删除字段
const deleteField = async (field: any) => {
  const loadingKey = `deleting-${field.field_id}`
  
  try {
    message.loading({
      content: `正在删除字段「${field.display_name}」...`,
      key: loadingKey
    })
    
    // 使用customFieldsAPI删除字段
    await customFieldsAPI.deleteCustomField(field.field_id)
    
    // 从列表中移除
    const index = fields.value.findIndex(f => f.field_id === field.field_id)
    if (index > -1) {
      fields.value.splice(index, 1)
    }
    
    message.success({
      content: `字段「${field.display_name}」删除成功`,
      key: loadingKey
    })
    
    // 如果有未保存的顺序更改，移除相关的更改
    orderChanges.value.delete(field.field_id)
    
    // 通知父组件刷新数据
    emit('fields-updated')
    
  } catch (error) {
    console.error('删除字段失败:', error)
    message.error({
      content: `删除字段「${field.display_name}」失败: ${error.message}`,
      key: loadingKey
    })
  }
}

// 编辑字段状态
const editingField = ref<any>(null)
const editFieldDialogVisible = ref(false)

// 编辑字段
const editField = (field: any) => {
  console.log('🔧 编辑字段被点击:', field)
  editingField.value = { ...field }
  editFieldDialogVisible.value = true
  console.log('📝 编辑对话框状态:', editFieldDialogVisible.value)
}

// 处理字段编辑完成
const handleFieldEdited = async (updatedFieldData: any) => {
  try {
    console.log('🔧 收到字段编辑数据:', updatedFieldData)
    
    // 调用API更新字段
    await customFieldsAPI.updateCustomField(editingField.value.field_id, {
      display_name: updatedFieldData.display_name,
      display_order: updatedFieldData.display_order
    })
    
    // 重新加载字段列表
    await loadFields()
    
    editFieldDialogVisible.value = false
    message.success('字段更新成功')
    
    // 通知父组件刷新数据
    emit('fields-updated')
  } catch (error) {
    console.error('更新字段失败:', error)
    message.error(`更新字段失败: ${error.message}`)
  }
}

// 打开添加字段对话框
const openAddFieldDialog = () => {
  console.log('🔧 打开添加字段对话框:', {
    moduleType: props.moduleType,
    province: props.province,
    unitInfo: props.unitInfo
  })
  addFieldDialogVisible.value = true
}

// 处理字段添加完成
const handleFieldAdded = () => {
  loadFields() // 重新加载字段列表
  emit('fields-updated') // 通知父组件刷新数据
}

// 保存更改
const handleSave = async () => {
  if (orderChanges.value.size === 0) {
    handleCancel()
    return
  }
  
  try {
    saving.value = true
    
    // 准备批量更新数据
    const fieldOrders = Array.from(orderChanges.value).map(fieldId => {
      const field = fields.value.find(f => f.field_id === fieldId)
      return {
        field_id: fieldId,
        display_order: field?.display_order || 1
      }
    })
    
    // 使用customFieldsAPI批量更新字段顺序
    await customFieldsAPI.batchUpdateFieldOrder(fieldOrders)
    
    orderChanges.value.clear()
    message.success('字段顺序更新成功')
    emit('fields-updated')
    handleCancel()
  } catch (error) {
    console.error('更新字段顺序失败:', error)
    message.error(`更新字段顺序失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

// 取消操作
const handleCancel = () => {
  orderChanges.value.clear()
  visible.value = false
}

// 监听对话框打开状态
watch(visible, (newVisible) => {
  if (newVisible) {
    loadFields()
  }
})
</script>

<style scoped lang="less">
.field-manager {
  .loading-container {
    padding: 40px;
    text-align: center;
    
    .loading-placeholder {
      height: 200px;
    }
  }
  
  .fields-list {
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
      
      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .anticon {
          color: #1890ff;
        }
      }
    }
    
    .fields-container {
      :deep(.ant-table) {
        .ant-table-tbody {
          .ant-table-cell {
            padding: 12px 8px;
            vertical-align: middle;
            
            .field-info {
              .field-name {
                font-weight: 600;
                color: #262626;
                margin-bottom: 6px;
                font-size: 14px;
              }
              
              .field-details {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
                
                .ant-tag {
                  margin: 0;
                }
                
                .field-meta {
                  font-size: 12px;
                  color: #8c8c8c;
                }
              }
              
              .field-timestamps {
                margin-top: 4px;
                
                .text-muted {
                  color: #bfbfbf;
                  font-size: 11px;
                }
              }
            }
            
            .visibility-control {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
              
              .status-info {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                
                .status-desc {
                  .text-warning {
                    color: #faad14;
                    font-size: 10px;
                  }
                }
              }
            }
            
            .order-controls {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              
              .ant-input-number {
                width: 80px;
              }
              
              .order-hint {
                .text-muted {
                  color: #bfbfbf;
                  font-size: 10px;
                }
              }
            }
            
            .field-actions {
              display: flex;
              justify-content: center;
              gap: 4px;
              
              .ant-btn {
                display: flex;
                align-items: center;
                justify-content: center;
              }
            }
          }
        }
      }
    }
  }
  
  .no-fields-state {
    padding: 60px 20px;
    text-align: center;
    
    .no-fields-content {
      .no-fields-icon {
        font-size: 48px;
        color: #d9d9d9;
        margin-bottom: 16px;
      }
      
      .no-fields-text {
        font-size: 14px;
        color: #666;
        margin-bottom: 24px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>