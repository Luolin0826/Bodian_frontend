<template>
  <div class="rural-grid-info">
    <div class="info-section">
      <div class="section-header" @click="toggleExpanded">
        <h4 class="section-title">
          <thunderbolt-outlined class="section-icon" />
          农网板块
          <a-tag v-if="hasData" color="green" size="small" class="data-tag">
            有数据
          </a-tag>
          <a-tag v-else color="orange" size="small" class="data-tag">
            暂无数据
          </a-tag>
        </h4>
        <div class="section-actions">
          <!-- 编辑状态指示 -->
          <div v-if="isEditing || hasChanges" class="edit-status">
            <a-tag v-if="saving" color="blue" class="status-tag">
              <save-outlined spin />
              自动保存中...
            </a-tag>
            <a-tag v-else-if="hasChanges && isEditing" color="orange" class="status-tag">
              有未保存更改
            </a-tag>
            <a-tag v-else-if="isEditing" color="green" class="status-tag">
              编辑模式
            </a-tag>
          </div>
          
          <!-- 非编辑模式按钮组 -->
          <template v-if="!isEditing">
            <a-tooltip title="刷新数据">
              <a-button
                type="text"
                size="small"
                @click.stop="handleRefresh"
                :loading="refreshing"
                class="refresh-btn"
              >
                <reload-outlined />
              </a-button>
            </a-tooltip>

            <a-tooltip title="编辑农网信息">
              <a-button
                type="text"
                size="small"
                @click.stop="enterEditMode"
                class="edit-btn"
              >
                <edit-outlined />
              </a-button>
            </a-tooltip>

            <a-tooltip title="管理字段 (添加/编辑/删除/排序)">
              <a-button
                type="text"
                size="small"
                @click.stop="openFieldManagerDialog"
                class="manage-fields-btn"
              >
                <setting-outlined />
              </a-button>
            </a-tooltip>
          </template>
          
          <!-- 编辑模式按钮组 -->
          <template v-if="isEditing">
            <a-tooltip title="保存更改">
              <a-button
                type="text"
                size="small"
                @click.stop="saveChanges"
                :loading="saving"
                class="save-btn"
              >
                <save-outlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="取消编辑">
              <a-button
                type="text"
                size="small"
                @click.stop="cancelEdit"
                class="cancel-btn"
              >
                <close-outlined />
              </a-button>
            </a-tooltip>
          </template>
          <a-button
            type="text"
            size="small"
            class="expand-btn"
            :class="{ expanded: isExpanded }"
          >
            <down-outlined />
          </a-button>
        </div>
      </div>

      <!-- 展开内容 -->
      <div v-if="isExpanded" class="section-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <a-spin size="default" tip="正在加载农网信息...">
            <div class="loading-placeholder"></div>
          </a-spin>
        </div>

        <!-- 显示模式 -->
        <div v-else-if="ruralGridInfo && hasData && !isEditing" class="grid-info-layout">
          <div
            v-for="(fieldConfig, fieldName) in visibleFields"
            :key="fieldName"
            class="info-item"
            :class="[fieldConfig.type, allFields[fieldName]?.is_custom ? 'custom-field' : 'default-field']"
          >
            <div class="info-label">
              <span class="label-text">{{ fieldConfig.display_name }}</span>
              <a-tooltip v-if="fieldConfig.description" :title="fieldConfig.description">
                <question-circle-outlined class="field-help" />
              </a-tooltip>
            </div>
            <div class="info-value">
              <!-- 文本和文本域 -->
              <div
                v-if="fieldConfig.type === 'text' || fieldConfig.type === 'textarea'"
                class="value-text"
                :class="{ 
                  'multiline': fieldConfig.type === 'textarea',
                  'expandable': isContentLong(fieldConfig.value)
                }"
                @click="isContentLong(fieldConfig.value) ? openContentPreview(fieldConfig) : null"
                :title="isContentLong(fieldConfig.value) ? '点击查看完整内容' : ''"
              >
                {{ formatValue(fieldConfig.value) }}
                <!-- 长内容指示器 -->
                <expand-outlined 
                  v-if="isContentLong(fieldConfig.value)" 
                  class="expand-indicator"
                />
              </div>
              
              <!-- 布尔值 -->
              <a-tag
                v-else-if="fieldConfig.type === 'boolean'"
                :color="fieldConfig.value ? 'green' : 'red'"
                class="value-boolean"
              >
                {{ fieldConfig.value ? '是' : '否' }}
              </a-tag>
              
              <!-- 选择类型 -->
              <a-tag
                v-else-if="fieldConfig.type === 'select'"
                :color="getSelectColor(fieldConfig.value)"
                class="value-select"
              >
                {{ fieldConfig.value || '-' }}
              </a-tag>
              
              <!-- 时间类型 -->
              <div
                v-else-if="fieldConfig.type === 'time'"
                class="value-time"
              >
                <calendar-outlined class="time-icon" />
                <span>{{ formatValue(fieldConfig.value) }}</span>
              </div>
              
              <!-- 默认显示 -->
              <span v-else class="value-default">
                {{ formatValue(fieldConfig.value) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 编辑模式 -->
        <div v-else-if="isEditing" class="edit-form">
          <a-form
            ref="formRef"
            :model="editForm"
            :rules="formRules"
            layout="vertical"
            @finish="handleFormSubmit"
            @finishFailed="handleFormSubmitFailed"
          >
            <a-row :gutter="[16, 16]">
              <a-col
                v-for="(fieldConfig, fieldName) in visibleFields"
                :key="fieldName"
                :xs="24"
                :sm="12"
                :md="12"
              >
                <a-form-item
                  :label="fieldConfig.display_name"
                  :name="fieldName"
                  :required="isRequiredField(fieldName)"
                >
                  <!-- 文本输入 -->
                  <a-input
                    v-if="fieldConfig.type === 'text' || fieldConfig.type === 'time'"
                    v-model:value="editForm[fieldName]"
                    :placeholder="`请输入${fieldConfig.display_name}`"
                    size="large"
                    class="uniform-input"
                  />
                  
                  <!-- 文本域 -->
                  <a-textarea
                    v-else-if="fieldConfig.type === 'textarea'"
                    v-model:value="editForm[fieldName]"
                    :rows="4"
                    :placeholder="`请输入${fieldConfig.display_name}`"
                    size="large"
                    class="uniform-textarea"
                    :auto-size="{ minRows: 4, maxRows: 8 }"
                  />
                  
                  <!-- 选择器 -->
                  <a-select
                    v-else-if="fieldConfig.type === 'select'"
                    v-model:value="editForm[fieldName]"
                    :placeholder="`请选择${fieldConfig.display_name}`"
                    size="large"
                    class="uniform-select"
                  >
                    <a-select-option value="高">高</a-select-option>
                    <a-select-option value="中">中</a-select-option>
                    <a-select-option value="低">低</a-select-option>
                    <a-select-option value="优">优</a-select-option>
                    <a-select-option value="良">良</a-select-option>
                    <a-select-option value="中等">中等</a-select-option>
                    <a-select-option value="差">差</a-select-option>
                    <a-select-option value="必须">必须</a-select-option>
                    <a-select-option value="建议">建议</a-select-option>
                    <a-select-option value="可选">可选</a-select-option>
                  </a-select>
                  
                  <!-- 布尔选择 -->
                  <a-radio-group
                    v-else-if="fieldConfig.type === 'boolean'"
                    v-model:value="editForm[fieldName]"
                    size="large"
                    class="uniform-radio-group"
                  >
                    <a-radio :value="true">是</a-radio>
                    <a-radio :value="false">否</a-radio>
                  </a-radio-group>
                  
                  <!-- 默认文本输入 -->
                  <a-input
                    v-else
                    v-model:value="editForm[fieldName]"
                    :placeholder="`请输入${fieldConfig.display_name}`"
                    size="large"
                    class="uniform-input"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
        
        <!-- 原有的农网信息展示（保留但隐藏） -->
        <div v-else-if="false" class="grid-info-layout-original" style="display: none;">
          <div
            v-for="(fieldConfig, fieldName) in visibleFields"
            :key="fieldName"
            class="info-item"
            :class="[fieldConfig.type, allFields[fieldName]?.is_custom ? 'custom-field' : 'default-field']"
          >
            <div class="info-label">
              <span class="label-text">{{ fieldConfig.display_name }}</span>
              <a-tooltip v-if="fieldConfig.description" :title="fieldConfig.description">
                <question-circle-outlined class="field-help" />
              </a-tooltip>
            </div>
            <div class="info-value">
              <!-- 文本和文本域 -->
              <div
                v-if="fieldConfig.type === 'text' || fieldConfig.type === 'textarea'"
                class="value-text"
                :class="{ 
                  'multiline': fieldConfig.type === 'textarea',
                  'expandable': isContentLong(fieldConfig.value)
                }"
                @click="isContentLong(fieldConfig.value) ? openContentPreview(fieldConfig) : null"
                :title="isContentLong(fieldConfig.value) ? '点击查看完整内容' : ''"
              >
                {{ formatValue(fieldConfig.value) }}
                <!-- 长内容指示器 -->
                <expand-outlined 
                  v-if="isContentLong(fieldConfig.value)" 
                  class="expand-indicator"
                />
              </div>
              
              <!-- 布尔值 -->
              <a-tag
                v-else-if="fieldConfig.type === 'boolean'"
                :color="fieldConfig.value ? 'green' : 'red'"
                class="value-boolean"
              >
                {{ fieldConfig.value ? '是' : '否' }}
              </a-tag>
              
              <!-- 选择类型 -->
              <a-tag
                v-else-if="fieldConfig.type === 'select'"
                :color="getSelectColor(fieldConfig.value)"
                class="value-select"
              >
                {{ fieldConfig.value || '-' }}
              </a-tag>
              
              <!-- 时间类型 -->
              <div
                v-else-if="fieldConfig.type === 'time'"
                class="value-time"
              >
                <calendar-outlined class="time-icon" />
                <span>{{ formatValue(fieldConfig.value) }}</span>
              </div>
              
              <!-- 默认显示 -->
              <span v-else class="value-default">
                {{ formatValue(fieldConfig.value) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 无数据状态 -->
        <div v-else class="no-data-state">
          <div class="no-data-content">
            <thunderbolt-outlined class="no-data-icon" />
            <p class="no-data-text">该单位暂无农网相关信息</p>
            <div class="no-data-tips">
              <p>⚡ 农网信息包括：</p>
              <ul>
                <li>农网待遇和薪资结构</li>
                <li>考试时间和报名安排</li>
                <li>年龄要求和学历限制</li>
                <li>网申情况和通过率</li>
                <li>线上测评和考核内容</li>
                <li>性格测试和面试环节</li>
                <li>资格审查和材料要求</li>
                <li>笔试内容和难度分析</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 字段管理对话框 -->
    <FieldManagerDialog
      v-model:open="fieldManagerDialogVisible"
      module-type="rural-grid"
      :module-info="{ sectionName: '农网板块' }"
      :unit-id="unitId"
      :unit-info="unitInfo"
      :province="currentProvince"
      @fields-updated="handleFieldsUpdated"
    />
    
    <!-- 内容预览对话框 -->
    <a-modal
      v-model:open="contentPreviewVisible"
      :title="previewFieldConfig?.display_name || '内容预览'"
      width="80%"
      :max-width="800"
      :footer="null"
      class="content-preview-modal"
    >
      <div class="preview-content" v-if="previewFieldConfig">
        <div class="field-info">
          <a-tag 
            :color="allFields[Object.keys(visibleFields).find(key => visibleFields[key] === previewFieldConfig)]?.is_custom ? 'purple' : 'green'"
            class="field-type-indicator"
          >
            {{ allFields[Object.keys(visibleFields).find(key => visibleFields[key] === previewFieldConfig)]?.is_custom ? '附加字段' : '基本字段' }}
          </a-tag>
          <span class="field-name">{{ previewFieldConfig.display_name }}</span>
        </div>
        <div class="content-text">
          {{ formatValue(previewFieldConfig.value) }}
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  ThunderboltOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  CalendarOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  SettingOutlined,
  ReloadOutlined,
  ExpandOutlined
} from '@ant-design/icons-vue'
import {
  policySectionsAPI,
  customFieldsAPI,
  type RuralGridInfo,
  type RuralGridResponse
} from '@/api/policies'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import { useEditMode } from '@/composables/useEditMode'
import FieldManagerDialog from './FieldManagerDialog.vue'

// Props
interface Props {
  unitId?: number | null
  unitInfo?: any
  defaultExpanded?: boolean
  showEmptyState?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unitId: null,
  unitInfo: null,
  defaultExpanded: false,
  showEmptyState: false
})

// Emits
const emit = defineEmits<{
  'data-loaded': [data: RuralGridResponse['data']]
  'loading-change': [loading: boolean]
  'expanded-change': [expanded: boolean]
}>()

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const isExpanded = ref(props.defaultExpanded)
const ruralGridInfo = ref<RuralGridInfo | null>(null)
const hasData = ref(false)
const enabledFields = ref<string[]>([])

// 内容预览相关
const contentPreviewVisible = ref(false)
const previewFieldConfig = ref<any>(null)

// 编辑模式管理器
const {
  isEditing,
  isSubmitting: saving,
  hasChanges,
  editData: editForm,
  startEdit,
  cancelEdit,
  saveEdit,
  setData,
  getEditStatus
} = useEditMode(
  {},
  {
    autoSave: true,
    autoSaveDelay: 5000,
    onSave: async (data) => {
      if (!props.unitId) {
        throw new Error('缺少单位ID，无法保存')
      }
      
      // 分离原有字段和自定义字段
      const originalFieldsData: Record<string, any> = {}
      const customFieldsData: Record<string, any> = {}
      
      Object.keys(data).forEach(fieldName => {
        const value = data[fieldName] || ''
        const fieldConfig = allFields[fieldName]
        
        if (fieldConfig?.is_custom) {
          // 自定义字段
          customFieldsData[fieldName] = value
        } else {
          // 原有字段
          if (value !== null && value !== undefined && value !== '') {
            originalFieldsData[fieldName] = value
          }
        }
      })
      
      console.log('💾 [农网] 分离字段数据:', {
        originalFields: originalFieldsData,
        customFields: customFieldsData
      })
      
      // 保存原有字段
      if (Object.keys(originalFieldsData).length > 0) {
        console.log('💾 [农网] 保存原有字段...')
        await policySectionsAPI.updateRuralGridPolicy(props.unitId, originalFieldsData)
        console.log('✅ [农网] 原有字段保存成功')
      }
      
      // 保存自定义字段
      if (Object.keys(customFieldsData).length > 0) {
        console.log('💾 [农网] 保存自定义字段...')
        await saveCustomFieldsValues(customFieldsData)
        console.log('✅ [农网] 自定义字段保存成功')
      }
      
      // 保存成功后重新获取最新数据（包括基本字段和自定义字段）
      await loadRuralGridData(props.unitId)
      console.log('✅ [农网] 统一保存完成，已刷新最新数据')
    },
    validateData: (data) => {
      // 基本验证
      return true
    },
    showMessages: true
  }
)

const formRef = ref<FormInstance>()

// 所有可能的农网字段 - 匹配API返回的字段名
const allFields = reactive({
  salary_benefits: {
    display_name: '薪资待遇',
    type: 'text',
    description: '农网岗位的薪资待遇和福利情况'
  },
  exam_schedule: {
    display_name: '考试安排',
    type: 'text',
    description: '农网招聘考试的具体时间安排'
  },
  application_status: {
    display_name: '申请状态',
    type: 'text',
    description: '农网岗位网申的通过率和竞争情况'
  },
  online_assessment: {
    display_name: '线上测评',
    type: 'text',
    description: '线上测评的内容和评估方式'
  },
  personality_test: {
    display_name: '性格测试',
    type: 'text',
    description: '性格测试的形式和重要性'
  },
  qualification_review: {
    display_name: '资格审查',
    type: 'text',
    description: '资格审查的流程和材料要求'
  },
  written_test_content: {
    display_name: '笔试内容',
    type: 'text',
    description: '笔试的科目、题型和考核重点'
  }
})

// 计算属性
const visibleFields = computed(() => {
  const result: Record<string, any> = {}
  
  // 只显示启用的字段
  enabledFields.value.forEach(fieldName => {
    if (allFields[fieldName]) {
      let fieldValue = null
      let fieldDescription = allFields[fieldName].description
      
      // 如果有数据，使用数据中的值
      if (ruralGridInfo.value && ruralGridInfo.value[fieldName]) {
        const backendValue = ruralGridInfo.value[fieldName]
        if (backendValue && backendValue.value !== null && backendValue.value !== undefined) {
          fieldValue = backendValue.value
          fieldDescription = backendValue.description || fieldDescription
        }
      }
      
      result[fieldName] = {
        ...allFields[fieldName],
        value: fieldValue,
        description: fieldDescription
      }
    }
  })
  
  return result
})

// 方法
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' && value.trim() === '') return '-'
  return String(value)
}

const getSelectColor = (value: any): string => {
  const colorMap: Record<string, string> = {
    '高': 'green',
    '中': 'orange',
    '低': 'red',
    '优': 'green',
    '良': 'blue',
    '中等': 'orange',
    '差': 'red',
    '必须': 'red',
    '建议': 'orange',
    '可选': 'green'
  }
  
  return colorMap[String(value)] || 'default'
}

// 检查内容是否过长（超过100个字符或包含换行）
const isContentLong = (value: any): boolean => {
  if (!value) return false
  const str = String(value)
  return str.length > 100 || str.includes('\n')
}

// 打开内容预览
const openContentPreview = (fieldConfig: any) => {
  previewFieldConfig.value = fieldConfig
  contentPreviewVisible.value = true
}

// 关闭内容预览
const closeContentPreview = () => {
  contentPreviewVisible.value = false
  previewFieldConfig.value = null
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  emit('expanded-change', isExpanded.value)
}

const handleRefresh = async () => {
  if (!props.unitId) return
  
  try {
    refreshing.value = true
    message.loading('正在刷新农网数据...', 0.5)
    
    // 清空现有数据，强制重新加载
    ruralGridInfo.value = null
    hasData.value = false
    
    await loadRuralGridData(props.unitId)
    message.success('农网数据刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    message.error('农网数据刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 计算属性
const unitId = computed(() => props.unitId)
const unitInfo = computed(() => props.unitInfo)

// 计算当前省份
const currentProvince = computed(() => {
  if (!props.unitInfo?.unit_name) return ''
  
  // 从单位名称中提取省份信息
  const unitName = props.unitInfo.unit_name
  
  // 处理包含"省"字的情况
  if (unitName.includes('省')) {
    const match = unitName.match(/([\u4e00-\u9fa5]+)省/)
    if (match) {
      return match[1] + '省'
    }
  }
  
  // 处理直辖市
  if (unitName.includes('北京')) return '北京'
  if (unitName.includes('上海')) return '上海'
  if (unitName.includes('天津')) return '天津'
  if (unitName.includes('重庆')) return '重庆'
  
  // 处理只有省份名没有"省"字的情况
  const provinceMapping: Record<string, string> = {
    '四川': '四川省',
    '广东': '广东省',
    '江苏': '江苏省',
    '浙江': '浙江省',
    '山东': '山东省',
    '河北': '河北省',
    '河南': '河南省',
    '湖北': '湖北省',
    '湖南': '湖南省',
    '江西': '江西省',
    '安徽': '安徽省',
    '福建': '福建省',
    '山西': '山西省',
    '辽宁': '辽宁省',
    '吉林': '吉林省',
    '黑龙江': '黑龙江省',
    '海南': '海南省',
    '贵州': '贵州省',
    '云南': '云南省',
    '陕西': '陕西省',
    '甘肃': '甘肃省',
    '青海': '青海省',
    '内蒙古': '内蒙古自治区',
    '广西': '广西壮族自治区',
    '西藏': '西藏自治区',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区'
  }
  
  // 尝试精确匹配省份名
  if (provinceMapping[unitName]) {
    return provinceMapping[unitName]
  }
  
  // 尝试部分匹配
  for (const [shortName, fullName] of Object.entries(provinceMapping)) {
    if (unitName.includes(shortName)) {
      return fullName
    }
  }
  
  return ''
})

// 保存自定义字段值
const saveCustomFieldsValues = async (customFieldsData: Record<string, any>) => {
  if (!props.unitId) {
    throw new Error('缺少单位ID，无法保存自定义字段')
  }
  
  // 调用自定义字段值更新API
  await customFieldsAPI.updateCustomFieldValues(props.unitId, {
    section: 'rural_grid',
    field_values: customFieldsData
  })
  console.log('✅ [农网] 自定义字段值更新完成:', customFieldsData)
}

// 加载自定义字段
const loadCustomFields = async () => {
  if (!props.unitId || !currentProvince.value) return
  
  try {
    console.log('🔄 [农网] 开始加载自定义字段:', {
      unitId: props.unitId,
      province: currentProvince.value,
      section: 'rural_grid'
    })
    
    const result = await customFieldsAPI.getCustomFieldValues(
      props.unitId,
      'rural_grid',
      currentProvince.value,
      true // includeDefinitions
    )
    
    console.log('✅ [农网] 自定义字段加载结果:', result)
    
    // 清除之前的自定义字段
    const customFieldKeys = Object.keys(allFields).filter(key => allFields[key].is_custom)
    customFieldKeys.forEach(key => {
      delete allFields[key]
      // 同时清除ruralGridInfo中对应的数据
      if (ruralGridInfo.value && ruralGridInfo.value[key]) {
        delete ruralGridInfo.value[key]
      }
    })
    console.log('🗑️ [农网] 清除之前的自定义字段:', customFieldKeys)
    
    // 处理自定义字段定义和值
    result.fields?.forEach((field: any) => {
      if (field.is_visible) {
        // 添加自定义字段定义到 allFields
        allFields[field.field_name] = {
          display_name: field.display_name,
          type: field.field_type || 'text',
          description: field.description || `自定义字段: ${field.display_name}`,
          is_custom: true,
          priority: field.display_order || 999,
          data_source: 'custom_fields'
        }
        
        console.log(`📝 [农网] 添加自定义字段定义: ${field.field_name} = ${field.display_name}`)
        
        // 如果字段有值，设置到ruralGridInfo中（使用正确的数据格式）
        if (field.field_value !== null && field.field_value !== undefined) {
          if (!ruralGridInfo.value) {
            ruralGridInfo.value = {}
          }
          ruralGridInfo.value[field.field_name] = {
            value: field.field_value,
            display_name: field.display_name,
            type: field.field_type || 'text'
          }
          console.log(`📝 [农网] 设置字段值: ${field.field_name} = ${field.field_value}`)
        }
      }
    })
    
    console.log('✅ [农网] 自定义字段加载完成')
    
  } catch (error) {
    console.error('❌ [农网] 加载自定义字段失败:', error)
    // 不抛出错误，让主要数据加载继续进行
  }
}

const loadRuralGridData = async (unitId: number) => {
  try {
    loading.value = true
    emit('loading-change', true)
    
    // 首先加载自定义字段
    await loadCustomFields()
    
    // 优先尝试使用新的统一API获取数据
    try {
      const response = await policySectionsAPI.getRuralGridPolicy(unitId)
      
      // 检查API响应结构，优先使用 rural_grid_info
      let sectionData = null
      let dataSource = ''
      
      if (response?.data?.rural_grid_info) {
        sectionData = response.data.rural_grid_info
        dataSource = 'data.rural_grid_info'
      } else if (response?.rural_grid_info) {
        sectionData = response.rural_grid_info
        dataSource = 'rural_grid_info'
      } else if (response?.data?.section_data) {
        sectionData = response.data.section_data
        dataSource = 'data.section_data'
      } else if (response?.section_data) {
        sectionData = response.section_data
        dataSource = 'section_data'
      } else if (response?.data) {
        // 检查data下是否直接是数据
        sectionData = response.data
        dataSource = 'data'
      }
      
      if (sectionData && Object.keys(sectionData).length > 0) {
        
        // 转换为组件期望的格式
        const convertedData = {}
        Object.keys(sectionData).forEach(fieldName => {
          const fieldData = sectionData[fieldName]
          // 支持多种数据结构格式
          let value = null
          
          if (fieldData && typeof fieldData === 'object' && fieldData.value !== undefined) {
            // 新格式：{ value: "xxx", display_name: "xxx", type: "xxx" }
            value = fieldData.value
          } else if (fieldData !== null && fieldData !== undefined) {
            // 直接值格式
            value = fieldData
          }
          
          convertedData[fieldName] = {
            value: value,
            display_name: fieldData?.display_name || allFields[fieldName]?.display_name || fieldName,
            type: fieldData?.type || allFields[fieldName]?.type || 'text'
          }
        })
        
        // 合并基本字段数据和自定义字段数据
        if (!ruralGridInfo.value) {
          ruralGridInfo.value = {}
        }
        
        // 先保留现有的自定义字段数据，再用新的API数据更新基本字段
        const existingCustomFields = {}
        if (ruralGridInfo.value) {
          Object.keys(ruralGridInfo.value).forEach(fieldName => {
            const fieldConfig = allFields[fieldName]
            if (fieldConfig?.is_custom) {
              existingCustomFields[fieldName] = ruralGridInfo.value[fieldName]
            }
          })
        }
        ruralGridInfo.value = { ...convertedData, ...existingCustomFields }
        hasData.value = Object.keys(convertedData).some(key => {
          const itemValue = convertedData[key]?.value
          return itemValue && itemValue !== '' && itemValue !== null && itemValue !== undefined
        })
        
        // 如果没有设置过字段配置，显示所有可用字段
        if (enabledFields.value.length === 0) {
          enabledFields.value = Object.keys(allFields)
          console.log('📌 初始化农网启用字段列表:', enabledFields.value)
        } else {
          // 添加新的自定义字段到启用列表中
          Object.keys(allFields).forEach(fieldName => {
            if (!enabledFields.value.includes(fieldName)) {
              enabledFields.value.push(fieldName)
              console.log(`📌 添加新字段到农网启用列表: ${fieldName}`)
            }
          })
        }

        emit('data-loaded', { rural_grid_info: convertedData, has_data: hasData.value })
        console.log('✅ 农网信息加载成功')
        return
      } else {
        console.warn('⚠️ 农网API响应中没有预期的数据字段，响应结构:', response)
        console.warn('⚠️ 预期的字段: data.section_data, section_data 或 rural_grid_info')
        // 新版API应该始终返回有效数据，如果没有则说明可能存在配置问题
        ruralGridInfo.value = null
        hasData.value = false
        emit('data-loaded', { rural_grid_info: null, has_data: false })
        return
      }
    } catch (apiError) {
      console.error('❌ 获取农网数据失败:', apiError)
      throw apiError // 直接抛出错误，由外层统一处理
    }
  } catch (error) {
    console.error('❌ 加载农网信息失败:', error)
    message.error('加载农网信息失败，请重试')
    ruralGridInfo.value = null
    hasData.value = false
  } finally {
    loading.value = false
    emit('loading-change', false)
  }
}

// 监听单位ID变化
watch(() => props.unitId, (newUnitId) => {
  if (newUnitId) {
    loadRuralGridData(newUnitId)
  } else {
    ruralGridInfo.value = null
    hasData.value = false
  }
}, { immediate: true })

// 监听省份变化，确保字段隔离
watch(() => currentProvince.value, (newProvince, oldProvince) => {
  if (oldProvince && newProvince && newProvince !== oldProvince) {
    console.log(`🔄 [农网] 省份切换: ${oldProvince} → ${newProvince}`)
    
    // 清空自定义字段定义，防止跨省份污染
    Object.keys(allFields).forEach(fieldName => {
      const fieldConfig = allFields[fieldName]
      if (fieldConfig?.is_custom) {
        delete allFields[fieldName]
        console.log(`🗑️ [农网] 清除旧省份自定义字段: ${fieldName}`)
      }
    })
    
    // 重新加载当前单位的数据
    if (props.unitId) {
      loadRuralGridData(props.unitId)
    }
  }
})

// 编辑相关方法
const enterEditMode = () => {
  // 进入编辑模式时自动展开
  if (!isExpanded.value) {
    isExpanded.value = true
  }
  
  // 准备编辑数据
  const currentData: Record<string, any> = {}
  
  Object.keys(visibleFields.value).forEach(fieldName => {
    const fieldConfig = visibleFields.value[fieldName]
    currentData[fieldName] = fieldConfig.value || ''
  })
  
  setData(currentData)
  startEdit()
}

const saveChanges = async () => {
  await saveEdit('手动保存')
}

const handleFormSubmit = async () => {
  await saveEdit('表单提交')
}

const handleFormSubmitFailed = (errorInfo: any) => {
  console.log('表单验证失败:', errorInfo)
  message.error('请检查表单数据后再提交')
}

// 表单验证规则
const formRules = computed(() => {
  const rules: Record<string, any[]> = {}
  
  // 为必填字段添加验证规则
  Object.keys(visibleFields.value).forEach(fieldName => {
    const fieldConfig = visibleFields.value[fieldName]
    if (isRequiredField(fieldName)) {
      rules[fieldName] = [{
        required: true,
        message: `请输入${fieldConfig.display_name}`,
        trigger: 'blur'
      }]
    }
  })
  
  return rules
})

const isRequiredField = (fieldName: string): boolean => {
  // 不需要必填字段，用户想怎么填怎么填
  return false
}

// 字段管理相关
const fieldManagerDialogVisible = ref(false)


// 打开字段管理对话框

const openFieldManagerDialog = () => {
  fieldManagerDialogVisible.value = true
}

// 处理字段管理更新
const handleFieldsUpdated = async () => {
  console.log('🔄 [农网] 字段管理更新事件被触发！！！')
  console.log('🔄 [农网] 字段管理更新，开始清理和重新加载')
  
  // 清空现有数据和字段配置
  ruralGridInfo.value = null
  hasData.value = false
  enabledFields.value = []
  
  // 清除所有自定义字段
  const customFieldKeys = Object.keys(allFields).filter(key => allFields[key].is_custom)
  customFieldKeys.forEach(key => {
    delete allFields[key]
  })
  console.log('🗑️ [农网] 清除自定义字段:', customFieldKeys)
  
  // 等待DOM更新
  await nextTick()
  
  // 重新加载数据
  if (props.unitId) {
    try {
      await loadRuralGridData(props.unitId)
      console.log('✅ [农网] 字段管理更新后重新加载完成')
    } catch (error) {
      console.error('❌ [农网] 字段管理更新后重新加载失败:', error)
    }
  }
}

// 监听defaultExpanded变化
watch(() => props.defaultExpanded, (newExpanded) => {
  isExpanded.value = newExpanded
})
</script>

<style scoped lang="less">
.rural-grid-info {
  .info-section {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }

  // 区域头部
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%);
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #ecffdb 0%, #e6f7ff 100%);
    }

    .section-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;

      .section-icon {
        color: #52c41a;
        font-size: 14px;
      }

      .data-tag {
        font-size: 10px;
        font-weight: 500;
      }
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 4px;

      .edit-btn,
      .refresh-btn,
      .save-btn,
      .cancel-btn,
      .add-field-btn {
        color: #666;

        &:hover {
          color: #52c41a;
        }
      }
      
      .save-btn {
        &:hover {
          color: #52c41a;
        }
      }
      
      .cancel-btn {
        &:hover {
          color: #ff4d4f;
        }
      }
      
      .add-field-btn {
        &:hover {
          color: #1890ff;
          background-color: #e6f7ff;
        }
      }

      .expand-btn {
        color: #999;
        transition: all 0.2s ease;

        &.expanded {
          transform: rotate(180deg);
          color: #52c41a;
        }

        &:hover {
          color: #52c41a;
        }
      }
    }
  }

  // 区域内容
  .section-content {
    .loading-container {
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;

      .loading-placeholder {
        width: 100%;
        height: 120px;
      }
    }

    // 农网信息布局
    .grid-info-layout {
      padding: 12px;
      display: grid;
      grid-template-columns: repeat(2, 1fr); // 固定2列布局，与提前批一致
      gap: 8px; // 统一间距
      min-height: 300px; // 设置最小高度

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 16px;
      }

      .info-item {
        border-radius: 6px;
        padding: 14px;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;

        // 默认字段（基本字段）- 绿色系
        &.default-field {
          background: #f9fffc;
          border: 1px solid #d9f7be;
          
          &:hover {
            background: #f6ffed;
            border-color: #b7eb8f;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(82, 196, 26, 0.1);
          }
          
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%);
            transition: all 0.3s ease;
          }
          
          &:hover::after {
            background: linear-gradient(90deg, #52c41a 0%, #73d13d 50%, #95de64 100%);
            height: 3px;
          }
        }

        // 附加字段（自定义字段）- 紫色系
        &.custom-field {
          background: linear-gradient(145deg, #fdfaff 0%, #f9f0ff 100%);
          border: 1px solid #d3adf7;
          
          &:hover {
            background: linear-gradient(145deg, #f9f0ff 0%, #efdbff 100%);
            border-color: #b37feb;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(114, 46, 209, 0.1);
          }
          
          &::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #722ed1 0%, #9254de 100%);
            transition: all 0.3s ease;
          }
          
          &:hover::after {
            background: linear-gradient(90deg, #722ed1 0%, #9254de 50%, #b37feb 100%);
            height: 3px;
          }
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;

          .label-text {
            font-size: 12px;
            font-weight: 600;
            color: #389e0d;
          }

          .field-help {
            font-size: 11px;
            color: #52c41a;
            cursor: help;

            &:hover {
              color: #389e0d;
            }
          }
        }

        .info-value {
          .value-text {
            font-size: 12px;
            color: #595959;
            line-height: 1.5;
            position: relative;
            max-height: 60px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            
            &.expandable {
              cursor: pointer;
              transition: all 0.2s ease;
              
              &:hover {
                color: #52c41a;
              }
              
              .expand-indicator {
                position: absolute;
                right: 2px;
                bottom: 2px;
                font-size: 12px;
                color: #52c41a;
                opacity: 0.7;
                transition: all 0.2s ease;
              }
              
              &:hover .expand-indicator {
                opacity: 1;
                transform: scale(1.1);
              }
            }

            &.multiline {
              white-space: pre-wrap;
              word-break: break-word;
            }
          }

          .value-boolean,
          .value-select {
            font-size: 11px;
            font-weight: 500;
          }

          .value-time {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #595959;

            .time-icon {
              color: #52c41a;
              font-size: 12px;
            }
          }

          .value-default {
            font-size: 12px;
            color: #595959;
          }
        }

        // 特殊字段样式
        &.salary_benefits {
          background: linear-gradient(135deg, #f9fffc 0%, #fcffe6 100%);
          border-color: #b7eb8f;
          
          .info-label .label-text {
            color: #d48806;
          }
        }

        &.exam_time {
          background: linear-gradient(135deg, #f0f9ff 0%, #f9fffc 100%);
          border-color: #91d5ff;
          
          .info-label .label-text {
            color: #1890ff;
          }
        }
      }
    }

    // 无数据状态
    .no-data-state {
      padding: 24px;
      text-align: center;

      .no-data-content {
        max-width: 420px;
        margin: 0 auto;

        .no-data-icon {
          font-size: 36px;
          color: #95de64;
          margin-bottom: 12px;
        }

        .no-data-text {
          font-size: 13px;
          color: #666;
          margin-bottom: 16px;
        }

        .no-data-tips {
          background: #f9fffc;
          border: 1px solid #d9f7be;
          border-radius: 6px;
          padding: 14px;
          text-align: left;

          p {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #389e0d;
            font-weight: 600;
          }

          ul {
            margin: 0;
            padding-left: 16px;

            li {
              font-size: 11px;
              color: #8c8c8c;
              line-height: 1.5;
              margin-bottom: 3px;

              &:last-child {
                margin-bottom: 0;
              }
            }
          }
        }
      }
    }
  }
  
  // 编辑表单样式
  .edit-form {
    padding: 16px;
    background: #f9fffc;
    border-radius: 6px;
    margin: 12px;
    
    :deep(.ant-form-item) {
      margin-bottom: 16px;
      
      .ant-form-item-label {
        padding-bottom: 4px;
        
        label {
          font-size: 12px;
          font-weight: 600;
          color: #389e0d;
        }
      }
      
      .ant-form-item-control {
        .ant-input,
        .ant-textarea,
        .ant-select {
          border-radius: 4px;
          font-size: 12px;
        }
        
        .ant-radio-group {
          .ant-radio-wrapper {
            font-size: 12px;
            margin-right: 12px;
          }
        }
      }
      
      .ant-form-item-explain {
        font-size: 11px;
      }
    }
    
    .ant-row {
      .ant-col {
        padding: 4px 8px;
      }
    }
    
    // 统一的输入框样式
    .uniform-input,
    .uniform-textarea,
    .uniform-select,
    .uniform-input-number {
      border-radius: 8px;
      border: 1.5px solid #d9d9d9;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #52c41a;
      }
      
      &:focus,
      &.ant-input-focused,
      &.ant-select-focused {
        border-color: #389e0d;
        box-shadow: 0 0 0 2px rgba(56, 158, 13, 0.1);
      }
    }
    
    .uniform-textarea {
      &.ant-input {
        min-height: 100px;
        padding: 12px;
        line-height: 1.6;
      }
    }
    
    .uniform-radio-group {
      .ant-radio-wrapper {
        font-size: 14px;
        margin-right: 16px;
        padding: 8px 12px;
        border-radius: 6px;
        transition: all 0.2s ease;
        
        &:hover {
          background-color: #f6ffed;
        }
        
        &.ant-radio-wrapper-checked {
          background-color: #f6ffed;
          border-color: #389e0d;
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .rural-grid-info {
    .section-header {
      padding: 12px 14px;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .section-title {
        font-size: 13px;
        gap: 6px;

        .section-icon {
          font-size: 13px;
        }
      }

      .section-actions {
        align-self: flex-end;
        margin-top: -20px;
      }
    }

    .section-content {
      .grid-info-layout {
        .info-item {
          padding: 12px;
          
          .info-label .label-text {
            font-size: 11px;
          }
          
          .info-value {
            .value-text,
            .value-time,
            .value-default {
              font-size: 11px;
            }
          }
        }
      }

      .no-data-state {
        padding: 20px 16px;

        .no-data-content {
          .no-data-icon {
            font-size: 32px;
          }

          .no-data-text {
            font-size: 12px;
          }

          .no-data-tips {
            padding: 12px;

            p {
              font-size: 11px;
            }

            ul li {
              font-size: 10px;
            }
          }
        }
      }
    }
  }
}

// 内容预览对话框样式
:deep(.content-preview-modal) {
  .ant-modal-header {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
    
    .ant-modal-title {
      font-size: 16px;
      font-weight: 600;
      color: #262626;
    }
  }
  
  .ant-modal-body {
    padding: 24px;
    
    .preview-content {
      .field-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
        
        .field-type-indicator {
          font-size: 12px;
          font-weight: 500;
        }
        
        .field-name {
          font-size: 14px;
          font-weight: 600;
          color: #262626;
        }
      }
      
      .content-text {
        font-size: 14px;
        line-height: 1.6;
        color: #595959;
        white-space: pre-wrap;
        word-break: break-word;
        background: #f9fffc;
        border-radius: 6px;
        padding: 16px;
        border: 1px solid #d9f7be;
        min-height: 100px;
        max-height: 400px;
        overflow-y: auto;
        
        &:empty::before {
          content: '暂无内容';
          color: #bfbfbf;
          font-style: italic;
        }
      }
    }
  }
}
</style>