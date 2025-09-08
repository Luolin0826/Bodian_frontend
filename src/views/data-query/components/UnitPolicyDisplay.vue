<template>
  <div class="unit-policy-display">
    <!-- 基本信息板块 -->
    <div class="policy-section">
      <div class="section-header">
        <h4 class="section-title">
          <info-circle-outlined class="section-icon" />
          基本政策信息
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
                @click="handleRefresh"
                :loading="refreshing"
                class="refresh-btn"
              >
                <reload-outlined />
              </a-button>
            </a-tooltip>

            <a-tooltip title="编辑政策">
              <a-button
                type="text"
                size="small"
                @click="enterEditMode"
                class="edit-btn"
              >
                <edit-outlined />
              </a-button>
            </a-tooltip>

            <a-tooltip title="管理字段 (添加/编辑/删除/排序)">
              <a-button
                type="text"
                size="small"
                @click="openFieldManagerDialog"
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
                @click="saveChanges"
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
                @click="cancelEdit"
                class="cancel-btn"
              >
                <close-outlined />
              </a-button>
            </a-tooltip>
          </template>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin size="large" tip="正在加载政策信息...">
          <div class="loading-placeholder"></div>
        </a-spin>
      </div>

      <!-- 政策字段展示 -->
      <div v-else-if="policyInfo || showEmptyState" class="policy-fields">
        <!-- 显示模式 -->
        <div v-if="!isEditing" class="fields-grid">
          <!-- 有数据时显示字段 -->
          <template v-if="policyInfo && Object.keys(visibleFields).length > 0">
            <div
              v-for="(fieldConfig, fieldName) in visibleFields"
              :key="fieldName"
              class="field-item"
              :class="[fieldConfig.type, allFields[fieldName]?.is_custom ? 'custom-field' : 'default-field']"
            >
            <div class="field-label">
              <span class="label-text">{{ fieldConfig.display_name }}</span>
            </div>
            <div class="field-value">
              <!-- 文本类型 -->
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
                {{ formatFieldValue(fieldConfig.value) }}
                <!-- 长内容指示器 -->
                <expand-outlined 
                  v-if="isContentLong(fieldConfig.value)" 
                  class="expand-indicator"
                />
              </div>
              
              <!-- 数字类型 -->
              <span
                v-else-if="fieldConfig.type === 'number'"
                class="value-number"
              >
                {{ formatNumber(fieldConfig.value) }}
                <span v-if="isCountField(fieldName)" class="unit">人</span>
                <span v-else-if="isScoreField(fieldName)" class="unit">分</span>
              </span>
              
              <!-- 选择类型 -->
              <a-tag
                v-else-if="fieldConfig.type === 'select'"
                :color="getSelectColor(fieldConfig.value)"
                class="value-select"
              >
                {{ fieldConfig.value || '-' }}
              </a-tag>
              
              <!-- 布尔类型 -->
              <a-tag
                v-else-if="fieldConfig.type === 'boolean'"
                :color="fieldConfig.value ? 'green' : 'red'"
                class="value-boolean"
              >
                {{ fieldConfig.value ? '是' : '否' }}
              </a-tag>
              
              <!-- 默认显示 -->
              <span v-else class="value-default">
                {{ formatFieldValue(fieldConfig.value) }}
              </span>
            </div>
            </div>
          </template>
          
          <!-- 空状态占位 -->
          <template v-else>
            <div class="empty-placeholder">
              <div class="placeholder-grid">
                <div class="placeholder-item" v-for="n in 6" :key="n">
                  <div class="placeholder-label"></div>
                  <div class="placeholder-value"></div>
                </div>
              </div>
              <div class="placeholder-hint">
                <div class="hint-content">
                  <file-text-outlined class="hint-icon" />
                  <h4 class="hint-title">基本政策信息</h4>
                  <p class="hint-text">请先选择一个单位查看对应的政策信息</p>
                  <a-tag color="blue" class="hint-tag">
                    <info-circle-outlined />
                    等待选择单位
                  </a-tag>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="edit-form">
          <a-form
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
                :md="8"
              >
                <a-form-item
                  :label="fieldConfig.display_name"
                  :name="fieldName"
                  :required="isRequiredField(fieldName)"
                >
                  <!-- 文本输入 -->
                  <a-input
                    v-if="fieldConfig.type === 'text'"
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
                  
                  <!-- 数字输入 -->
                  <a-input-number
                    v-else-if="fieldConfig.type === 'number'"
                    v-model:value="editForm[fieldName]"
                    :min="0"
                    :placeholder="`请输入${fieldConfig.display_name}`"
                    size="large"
                    class="uniform-input-number"
                    style="width: 100%"
                  />
                  
                  <!-- 选择器 -->
                  <a-select
                    v-else-if="fieldConfig.type === 'select'"
                    v-model:value="editForm[fieldName]"
                    :placeholder="`请选择${fieldConfig.display_name}`"
                    size="large"
                    class="uniform-select"
                  >
                    <!-- 使用动态选项，如果有field_options则使用，否则使用默认选项 -->
                    <template v-if="fieldConfig.field_options && fieldConfig.field_options.length > 0">
                      <a-select-option 
                        v-for="option in fieldConfig.field_options" 
                        :key="option" 
                        :value="option"
                      >
                        {{ option }}
                      </a-select-option>
                    </template>
                    <!-- 默认选项 -->
                    <template v-else>
                      <a-select-option value="是">是</a-select-option>
                      <a-select-option value="否">否</a-select-option>
                      <a-select-option value="部分">部分</a-select-option>
                      <a-select-option value="视情况">视情况</a-select-option>
                    </template>
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
                  
                  <!-- 日期选择器 -->
                  <a-date-picker
                    v-else-if="fieldConfig.type === 'date'"
                    v-model:value="editForm[fieldName]"
                    :placeholder="`请选择${fieldConfig.display_name}`"
                    size="large"
                    class="uniform-date-picker"
                    style="width: 100%"
                    format="YYYY-MM-DD"
                  />
                  
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

        <!-- 字段配置面板 -->
        <div v-if="showFieldConfig" class="field-config-panel">
          <div class="config-header">
            <h5>字段显示配置</h5>
            <a-button type="text" size="small" @click="showFieldConfig = false">
              <close-outlined />
            </a-button>
          </div>
          <div class="config-content">
            <a-checkbox-group
              v-model:value="enabledFields"
              @change="handleFieldConfigChange"
              class="field-checkboxes"
            >
              <div
                v-for="(fieldConfig, fieldName) in allFields"
                :key="fieldName"
                class="field-checkbox-item"
              >
                <a-checkbox :value="fieldName">
                  {{ fieldConfig.display_name }}
                </a-checkbox>
              </div>
            </a-checkbox-group>
          </div>
        </div>
      </div>

      <!-- 空状态（作为备用，正常情况下不会显示） -->
      <div v-else class="empty-state">
        <a-empty description="加载失败">
          <template #image>
            <file-text-outlined class="empty-icon" />
          </template>
          <p class="empty-hint">系统发生错误，请重新刷新页面</p>
        </a-empty>
      </div>
    </div>
    
    <!-- 字段管理对话框 -->
    <FieldManagerDialog
      v-model:open="fieldManagerDialogVisible"
      module-type="basic-policy"
      :module-info="{ sectionName: '基本政策信息' }"
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
            :color="allFields[Object.keys(visibleFields).find(key => visibleFields[key] === previewFieldConfig)]?.is_custom ? 'purple' : 'blue'"
            class="field-type-indicator"
          >
            {{ allFields[Object.keys(visibleFields).find(key => visibleFields[key] === previewFieldConfig)]?.is_custom ? '附加字段' : '基本字段' }}
          </a-tag>
          <span class="field-name">{{ previewFieldConfig.display_name }}</span>
        </div>
        <div class="content-text">
          {{ formatFieldValue(previewFieldConfig.value) }}
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  InfoCircleOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
  FileTextOutlined,
  EditOutlined,
  SaveOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExpandOutlined
} from '@ant-design/icons-vue'
import {
  getUnitDetails,
  policyManagementAPI,
  policySectionsAPI,
  customFieldsAPI,
  type PolicyInfo,
  type UnitInfo
} from '@/api/policies'
import { useEditMode } from '@/composables/useEditMode'
import FieldManagerDialog from './FieldManagerDialog.vue'

// Props
interface Props {
  unitId?: number | null
  unitInfo?: UnitInfo | null
  showEmptyState?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unitId: null,
  unitInfo: null,
  showEmptyState: false
})

// Emits
const emit = defineEmits<{
  'policy-loaded': [policyInfo: PolicyInfo]
  'loading-change': [loading: boolean]
}>()

// 响应式数据
const loading = ref(false)
const refreshing = ref(false)
const policyInfo = ref<PolicyInfo | null>(null)
const provincePolicyInfo = ref<any>(null)
const showFieldConfig = ref(false)
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
          originalFieldsData[fieldName] = value
        }
      })
      
      console.log('🔄 开始分层保存数据')
      console.log('📊 原有字段数据:', originalFieldsData)
      console.log('🎨 自定义字段数据:', customFieldsData)
      
      // 保存原有字段
      if (Object.keys(originalFieldsData).length > 0) {
        console.log('💾 保存原有字段到省级政策表...')
        await policySectionsAPI.updateBasicPolicy(props.unitId, originalFieldsData)
        console.log('✅ 原有字段保存成功')
      }
      
      // 保存自定义字段
      if (Object.keys(customFieldsData).length > 0) {
        console.log('💾 保存自定义字段...')
        await saveCustomFieldsValues(customFieldsData)
        console.log('✅ 自定义字段保存成功')
      }
      
      // 保存成功后重新获取最新数据
      await loadBasicPolicyData(props.unitId)
      console.log('✅ 统一保存完成，已刷新最新数据')
    },
    validateData: (data) => {
      // 不需要严格验证，用户想怎么填怎么填
      return true
    },
    showMessages: true
  }
)

// 所有可能的政策字段 - 匹配province_policies表结构
const allFields = reactive<Record<string, any>>({
  cet_requirement: {
    display_name: '四六级要求',
    type: 'text',
    description: '英语等级考试要求'
  },
  computer_requirement: {
    display_name: '计算机等级要求',
    type: 'text',
    description: '计算机等级考试要求'
  },
  overage_allowed: {
    display_name: '超龄能否通过',
    type: 'text',
    description: '年龄超出要求是否可以通过'
  },
  household_priority: {
    display_name: '是否非常看重户籍',
    type: 'text',
    description: '户籍对录取的影响程度'
  },
  non_first_choice_pass: {
    display_name: '非第一志愿是否通过网申',
    type: 'text',
    description: '非第一志愿的通过情况'
  },
  detailed_rules: {
    display_name: '详细录取规则',
    type: 'textarea',
    description: '具体的录取流程和规则'
  },
  single_cert_probability: {
    display_name: '有一个证书网申概率',
    type: 'textarea',
    description: '拥有证书对网申成功率的影响'
  },
  admission_ratio: {
    display_name: '报录比',
    type: 'text',
    description: '报名与录取的比例'
  },
  major_mismatch_allowed: {
    display_name: '本硕专业不一致可否通过网申',
    type: 'text',
    description: '专业不匹配的通过可能性'
  },
  first_batch_fail_second_batch: {
    display_name: '一批进面没录取可否正常报考二批',
    type: 'text',
    description: '批次间报考的限制情况'
  },
  deferred_graduation_impact: {
    display_name: '延毕休学影响网申吗',
    type: 'text',
    description: '学业延期对申请的影响'
  },
  second_choice_available: {
    display_name: '是否有二次志愿填报',
    type: 'text',
    description: '二次填报志愿的机会'
  },
  position_selection_method: {
    display_name: '具体选岗方式',
    type: 'textarea',
    description: '岗位选择的具体流程和方法'
  },
  early_batch_difference: {
    display_name: '不成文规则',
    type: 'textarea',
    description: '网申过程中的隐性规定'
  },
  campus_recruit_then_first_batch: {
    display_name: '校招给了地方但是不满意是否还可以参加一批',
    type: 'text',
    description: '校招后是否能继续参加统一批次'
  },
  recruitment_count: {
    display_name: '录取人数',
    type: 'text',
    description: '计划录取的人数'
  },
  comprehensive_score_line: {
    display_name: '综合分数线',
    type: 'text',
    description: '综合成绩的分数线要求'
  },
  best_value_city_rank: {
    display_name: '最具性价比城市排名',
    type: 'text',
    description: '城市性价比排名情况'
  },
  best_value_district_rank: {
    display_name: '最具性价比区县排名',
    type: 'text',
    description: '区县性价比排名情况'
  },
  cost_effectiveness_rank: {
    display_name: '性价比排名',
    type: 'text',
    description: '综合性价比排名'
  },
  difficulty_rank: {
    display_name: '难度排名',
    type: 'text',
    description: '录取难度排名情况'
  },
  qualification_review_requirements: {
    display_name: '资格审查要求',
    type: 'text',
    description: '资格审查的具体要求'
  },
})

// 计算属性
const visibleFields = computed(() => {
  if (!policyInfo.value && !provincePolicyInfo.value) return {}
  
  const result: Record<string, any> = {}
  
  enabledFields.value.forEach(fieldName => {
    if (allFields[fieldName]) {
      // 优先使用省级政策数据，如果没有再使用单位政策数据
      let fieldValue = null
      let fieldDescription = allFields[fieldName].description
      let dataSource = 'unknown'
      
      // 先尝试从省级政策获取数据
      if (provincePolicyInfo.value && provincePolicyInfo.value[fieldName] !== undefined && provincePolicyInfo.value[fieldName] !== null) {
        fieldValue = provincePolicyInfo.value[fieldName]
        dataSource = 'province'
      }
      // 再尝试从单位政策获取数据
      else if (policyInfo.value && policyInfo.value[fieldName]) {
        const backendData = policyInfo.value[fieldName]
        fieldValue = backendData?.value || null
        fieldDescription = backendData?.description || fieldDescription
        dataSource = 'policy'
      }
      
      // 添加调试日志
      console.log(`🔍 visibleFields处理字段 ${fieldName}:`, {
        fieldValue,
        dataSource,
        'provincePolicyInfo存在': !!provincePolicyInfo.value,
        'provincePolicyInfo[fieldName]': provincePolicyInfo.value?.[fieldName],
        'policyInfo存在': !!policyInfo.value,
        'policyInfo[fieldName]': policyInfo.value?.[fieldName],
        'allFields存在': !!allFields[fieldName]
      })
      
      result[fieldName] = {
        ...allFields[fieldName],
        value: fieldValue,
        description: fieldDescription
      }
    }
  })
  
  console.log('🔍 最终visibleFields结果:', result)
  return result
})

// 计算属性
const unitId = computed(() => props.unitId)
const unitInfo = computed(() => props.unitInfo)

// 方法
const formatFieldValue = (value: any): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string' && value.trim() === '') return '-'
  return String(value)
}

const formatNumber = (value: any): string => {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (isNaN(num)) return '-'
  return num.toLocaleString()
}

const isCountField = (fieldName: string): boolean => {
  return false // 移除了录取人数字段
}

const isScoreField = (fieldName: string): boolean => {
  return ['comprehensive_score_line'].includes(fieldName)
}

const getSelectColor = (value: any): string => {
  const colorMap: Record<string, string> = {
    '是': 'green',
    '否': 'red',
    '可以': 'green',
    '不可以': 'red',
    '很难': 'volcano',
    '视情况而定': 'orange',
    '视具体情况': 'orange',
    '有影响': 'red',
    '无影响': 'green',
    '有限制': 'orange',
    '部分地区有': 'blue',
    '需要放弃校招': 'volcano',
    '不限': 'cyan',
    '四级': 'blue',
    '六级': 'green',
    '四级优先': 'geekblue',
    '六级优先': 'green',
    '二级': 'orange',
    '三级': 'red',
    '二级优先': 'gold',
    '三级优先': 'red',
    '略有影响': 'orange'
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

const router = useRouter()

const handleEditPolicy = () => {
  if (!props.unitId) {
    message.warning('请先选择一个单位')
    return
  }
  
  // 跳转到政策管理页面，并传递当前选中的单位信息
  router.push({
    name: 'PolicyManagement',
    query: {
      unitId: props.unitId,
      unitName: props.unitInfo?.unit_name || ''
    }
  })
}

const handleRefresh = async () => {
  if (!props.unitId) return
  
  try {
    refreshing.value = true
    message.loading('正在刷新数据...', 0.5)
    await loadPolicyInfo(props.unitId)
    message.success('数据刷新成功')
  } catch (error) {
    console.error('刷新失败:', error)
    message.error('数据刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 字段管理相关
const fieldManagerDialogVisible = ref(false)

// 计算省份名称
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
  
  // 处理只有省份名没有"省"字的情况（如"四川"、"广东"等）
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
    '安徽': '安徽省',
    '福建': '福建省',
    '江西': '江西省',
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

// 打开字段管理对话框
const openFieldManagerDialog = () => {
  console.log('🔧 打开字段管理对话框:', {
    'unitInfo': props.unitInfo,
    'unitName': props.unitInfo?.unit_name,
    'currentProvince': currentProvince.value,
    'currentProvince类型': typeof currentProvince.value
  })
  fieldManagerDialogVisible.value = true
}

// 处理字段管理更新
const handleFieldsUpdated = async () => {
  console.log('🔄 [基本政策] 字段管理更新，开始清理和重新加载')
  
  // 清空现有数据和字段配置
  policyInfo.value = null
  provincePolicyInfo.value = null
  enabledFields.value = []
  
  // 清除所有自定义字段
  const customFieldKeys = Object.keys(allFields).filter(key => allFields[key].is_custom)
  customFieldKeys.forEach(key => {
    delete allFields[key]
  })
  console.log('🗑️ [基本政策] 清除自定义字段:', customFieldKeys)
  
  // 等待DOM更新
  await nextTick()
  
  // 重新加载数据
  if (props.unitId) {
    try {
      await loadPolicyInfo(props.unitId)
      console.log('✅ [基本政策] 字段管理更新后重新加载完成')
    } catch (error) {
      console.error('❌ [基本政策] 字段管理更新后重新加载失败:', error)
    }
  }
}

// 加载自定义字段
// 保存自定义字段值
const saveCustomFieldsValues = async (customFieldsData: Record<string, any>) => {
  if (!props.unitId) {
    throw new Error('缺少单位ID，无法保存自定义字段')
  }
  
  // 调用自定义字段值更新API
  await customFieldsAPI.updateCustomFieldValues(props.unitId, {
    section: 'basic',
    field_values: customFieldsData
  })
  console.log('✅ 自定义字段值更新完成:', customFieldsData)
}

const loadCustomFields = async () => {
  try {
    const provinceToUse = currentProvince.value
    console.log('🔍 加载自定义字段，使用省份:', provinceToUse)
    
    if (!provinceToUse) {
      console.log('⚠️ 没有省份信息，跳过加载自定义字段')
      return
    }
    
    const section = 'basic' // 基本政策对应的section
    // 使用合并接口获取字段定义和值
    const result = await customFieldsAPI.getCustomFieldValues(
      props.unitId, 
      section, 
      provinceToUse, 
      true // includeDefinitions
    )
    
    console.log('加载自定义字段:', result)
    
    // 将自定义字段添加到allFields中并处理字段值
    if (result.fields && Array.isArray(result.fields)) {
      console.log('📋 获取到的字段数据:', result.fields.map(f => ({
        field_name: f.field_name,
        display_name: f.display_name,
        is_visible: f.is_visible,
        field_type: f.field_type,
        field_value: f.field_value,
        has_value: f.has_value
      })))
      
      // 初始化 policyInfo 如果还没有
      if (!policyInfo.value) {
        policyInfo.value = {}
      }
      
      // 首先清理旧的自定义字段（防止已删除/隐藏字段仍然显示）
      const existingCustomFields = Object.keys(allFields).filter(key => allFields[key].is_custom)
      existingCustomFields.forEach(fieldName => {
        delete allFields[fieldName]
        if (policyInfo.value && policyInfo.value[fieldName]) {
          delete policyInfo.value[fieldName]
        }
        // 也要从启用列表中移除
        const index = enabledFields.value.indexOf(fieldName)
        if (index > -1) {
          enabledFields.value.splice(index, 1)
        }
      })
      console.log('🗑️ 清理了旧的自定义字段:', existingCustomFields)
      
      result.fields.forEach((field: any) => {
        console.log(`🔍 处理字段: ${field.field_name}, is_visible: ${field.is_visible}, value: ${field.field_value}`)
        
        if (field.is_visible) {
          // 添加字段定义到allFields
          allFields[field.field_name] = {
            display_name: field.display_name,
            type: field.field_type || 'text',
            description: field.field_content || field.display_name,
            is_custom: true
          }
          
          // 添加字段值到policyInfo
          policyInfo.value[field.field_name] = {
            value: field.field_value || '',
            display_name: field.display_name,
            type: field.field_type || 'text',
            priority: 999, // 自定义字段放在最后
            data_source: 'custom_fields'
          }
          
          console.log(`✅ 字段 ${field.field_name} 已添加，值: ${field.field_value}`)
        } else {
          console.log(`⚠️ 字段 ${field.field_name} 不可见，已跳过`)
        }
      })
      
      // 更新启用的字段列表
      const allFieldKeys = Object.keys(allFields)
      console.log('🗂️ 当前allFields包含字段:', allFieldKeys)
      
      if (enabledFields.value.length === 0) {
        // 初次加载，显示所有字段
        enabledFields.value = allFieldKeys
        console.log('📌 初次设置启用字段列表:', enabledFields.value)
      } else {
        // 更新启用列表：添加新字段，移除不存在的字段
        result.fields.forEach((field: any) => {
          if (field.is_visible && !enabledFields.value.includes(field.field_name)) {
            enabledFields.value.push(field.field_name)
            console.log(`📌 添加新字段到启用列表: ${field.field_name}`)
          }
        })
        
        // 确保启用列表与当前allFields保持一致
        enabledFields.value = enabledFields.value.filter(fieldName => allFieldKeys.includes(fieldName))
        console.log('📌 清理后的启用字段列表:', enabledFields.value)
      }
      
      console.log('✅ 自定义字段已添加到allFields和policyInfo')
      console.log('🔍 最终policyInfo:', policyInfo.value)
    }
  } catch (error) {
    console.error('加载自定义字段失败:', error)
  }
}

// 编辑相关方法
const enterEditMode = () => {
  // 准备编辑数据 - 包含所有字段，不仅仅是可见字段
  const currentData: Record<string, any> = {}
  
  // 包含所有已启用字段的数据
  enabledFields.value.forEach(fieldName => {
    if (allFields[fieldName]) {
      // 优先从可见字段获取当前值
      if (visibleFields.value[fieldName]) {
        currentData[fieldName] = visibleFields.value[fieldName].value || ''
      } else {
        // 如果不在可见字段中，从原始数据获取
        let fieldValue = ''
        
        // 先尝试从单位政策数据获取
        if (policyInfo.value?.[fieldName]) {
          fieldValue = policyInfo.value[fieldName].value || ''
        }
        // 再尝试从省级政策数据获取
        else if (provincePolicyInfo.value?.[fieldName]) {
          fieldValue = provincePolicyInfo.value[fieldName] || ''
        }
        
        currentData[fieldName] = fieldValue
      }
    }
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

const handleFieldConfigChange = (checkedValues: string[]) => {
  enabledFields.value = checkedValues
  // 不再保存字段配置到本地存储，因为用户希望始终显示所有字段
}

const loadBasicPolicyData = async (unitId: number) => {
  try {
    // 首先加载自定义字段定义，确保 allFields 包含自定义字段
    if (currentProvince.value) {
      await loadCustomFields()
    }
    
    // 使用新的统一API获取基本政策数据
    const response = await policySectionsAPI.getBasicPolicy(unitId)
    
    let basicPolicyData = null
    
    // 统一处理多种响应格式
    if (response?.data?.section_data) {
      basicPolicyData = response.data.section_data
    } else if (response?.section_data) {
      basicPolicyData = response.section_data
    } else if (response?.basic_policy_info) {
      basicPolicyData = response.basic_policy_info
    }
    
    if (basicPolicyData) {
      // 初始化 policyInfo
      if (!policyInfo.value) {
        policyInfo.value = {}
      }
      
      // 将新API的数据格式转换为组件期望的格式
      Object.keys(basicPolicyData).forEach(fieldName => {
        const fieldData = basicPolicyData[fieldName]
        if (policyInfo.value) {
          policyInfo.value[fieldName] = {
            value: fieldData.value,
            display_name: fieldData.display_name,
            type: fieldData.type,
            priority: fieldData.priority,
            data_source: fieldData.data_source || 'policy_sections'
          }
        }
      })
      
      console.log('✅ 基本政策数据刷新成功')
    }
    
    // 自定义字段数据已在 loadCustomFields() 中使用合并接口加载，避免重复请求
    console.log('✅ 基本政策数据加载完成，自定义字段将由 loadCustomFields() 统一处理')
    
  } catch (error) {
    console.error('❌ 获取基本政策数据失败:', error)
    // 如果获取基本政策失败，仍然尝试重新加载完整数据
    await loadPolicyInfo(unitId)
  }
}

const loadPolicyInfo = async (unitId: number) => {
  try {
    loading.value = true
    emit('loading-change', true)
    
    // 首先加载自定义字段定义，确保 allFields 包含自定义字段
    if (currentProvince.value) {
      await loadCustomFields()
    }
    
    // 直接使用新的统一API获取基本政策数据
    try {
      const basicPolicyResponse = await policySectionsAPI.getBasicPolicy(unitId)
      
      let basicPolicyData = null
      
      // 新API统一使用data.section_data格式
      if (basicPolicyResponse?.data?.section_data) {
        basicPolicyData = basicPolicyResponse.data.section_data
        console.log('✅ 使用data.section_data格式，包含', Object.keys(basicPolicyData).length, '个字段')
      } else if (basicPolicyResponse?.section_data) {
        basicPolicyData = basicPolicyResponse.section_data
        console.log('✅ 使用section_data格式，包含', Object.keys(basicPolicyData).length, '个字段')
      } else if (basicPolicyResponse?.basic_policy_info) {
        basicPolicyData = basicPolicyResponse.basic_policy_info
        console.log('✅ 使用basic_policy_info格式')
      } else {
        console.warn('⚠️ 基本政策API响应中没有预期的数据字段，响应结构:', basicPolicyResponse)
        console.warn('⚠️ 预期的字段: data.section_data, section_data 或 basic_policy_info')
        // 即使没有数据，也要初始化空的policyInfo以避免组件错误（保留已有的自定义字段）
        if (!policyInfo.value) {
          policyInfo.value = {}
        }
      }
      
      if (basicPolicyData) {
        // 初始化 policyInfo（如果还没有），保留已有的自定义字段数据
        if (!policyInfo.value) {
          policyInfo.value = {}
        }
        
        console.log('🔍 loadPolicyInfo - 处理基本政策数据前，当前policyInfo包含:', Object.keys(policyInfo.value))
        
        // 将新API的数据格式转换为组件期望的格式
        Object.keys(basicPolicyData).forEach(fieldName => {
          const fieldData = basicPolicyData[fieldName]
          if (policyInfo.value) {
            policyInfo.value[fieldName] = {
              value: fieldData.value,
              display_name: fieldData.display_name,
              type: fieldData.type,
              priority: fieldData.priority,
              data_source: fieldData.data_source || 'policy_sections'
            }
          }
        })
        
        console.log('✅ 基本政策数据加载成功 (统一API):', basicPolicyData)
        
        // 尝试获取省级政策信息（如果需要）
        if (props.unitInfo?.unit_name) {
          const unitName = props.unitInfo.unit_name
          if (unitName.includes('省')) {
            const match = unitName.match(/([\u4e00-\u9fa5]+)省/)
            if (match) {
              const provinceName = match[1]
              try {
                const provincePolicyResponse = await policyManagementAPI.getProvincePolicies({
                  province: provinceName,
                  limit: 1
                })
                
                if (provincePolicyResponse?.policies && provincePolicyResponse.policies.length > 0) {
                  provincePolicyInfo.value = provincePolicyResponse.policies[0]
                  console.log('✅ 省级政策信息加载成功:', provincePolicyInfo.value)
                }
              } catch (provincePolicyError) {
                console.warn('⚠️ 获取省级政策失败:', provincePolicyError)
                provincePolicyInfo.value = null
              }
            }
          }
        }
      }
    } catch (newApiError) {
      console.error('❌ 新API获取基本政策失败:', newApiError)
      throw newApiError // 不再回退到旧API，直接抛出错误
    }
    
    // 自定义字段数据已在 loadCustomFields() 中使用合并接口加载，避免重复请求
    console.log('✅ 政策信息加载完成，自定义字段将由 loadCustomFields() 统一处理')
    
    // 如果没有设置过字段配置，显示所有可用字段
    if (enabledFields.value.length === 0) {
      enabledFields.value = Object.keys(allFields)
    }
    
    emit('policy-loaded', policyInfo.value)
    console.log('✅ 政策信息加载成功:', policyInfo.value)
  } catch (error) {
    console.error('❌ 加载政策信息失败:', error)
    message.error('加载政策信息失败，请重试')
    policyInfo.value = null
    provincePolicyInfo.value = null
  } finally {
    loading.value = false
    emit('loading-change', false)
  }
}

const initializeFieldConfig = () => {
  // 清除旧的字段配置限制，始终显示所有字段
  try {
    // 清除本地存储的字段配置限制
    localStorage.removeItem('policyFieldsConfig')
    
    // 默认显示所有可用字段
    enabledFields.value = Object.keys(allFields)
  } catch (error) {
    console.error('字段配置初始化失败:', error)
    enabledFields.value = Object.keys(allFields)
  }
}

// 监听单位ID变化
watch(() => props.unitId, (newUnitId) => {
  if (newUnitId) {
    loadPolicyInfo(newUnitId)
  } else {
    policyInfo.value = null
    provincePolicyInfo.value = null
  }
}, { immediate: true })

// 监听省份变化，确保省份切换时清除旧数据并重新加载
watch(() => currentProvince.value, async (newProvince, oldProvince) => {
  if (newProvince !== oldProvince && newProvince && props.unitId) {
    console.log('🔄 省份变化，清除旧数据并重新加载:', {
      oldProvince,
      newProvince,
      unitId: props.unitId
    })
    
    // 清除旧的自定义字段定义和值
    Object.keys(allFields).forEach(fieldName => {
      if (allFields[fieldName].is_custom) {
        delete allFields[fieldName]
      }
    })
    
    // 清除 policyInfo 中的自定义字段
    if (policyInfo.value) {
      Object.keys(policyInfo.value).forEach(fieldName => {
        if (policyInfo.value[fieldName].data_source === 'custom_fields') {
          delete policyInfo.value[fieldName]
        }
      })
    }
    
    // 重新加载新省份的自定义字段
    await loadCustomFields()
    
    console.log('✅ 省份切换完成，已加载新省份的自定义字段')
  }
})

// 生命周期
onMounted(async () => {
  initializeFieldConfig()
  // 加载自定义字段
  if (currentProvince.value) {
    await loadCustomFields()
  }
})
</script>

<style scoped lang="less">
.unit-policy-display {
  .policy-section {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }

  // 区域头部 - 紧凑版本
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;

    .section-title {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 6px;

      .section-icon {
        color: #1890ff;
        font-size: 12px;
      }
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .edit-status {
        .status-tag {
          font-size: 11px;
          line-height: 1.2;
          height: auto;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 4px;
          
          .anticon {
            font-size: 10px;
            margin-right: 2px;
          }
        }
      }

      .edit-btn,
      .config-btn,
      .refresh-btn,
      .save-btn,
      .cancel-btn,
      .add-field-btn {
        color: #666;
        width: 24px;
        height: 24px;
        font-size: 12px;

        &:hover {
          color: #1890ff;
        }
      }
      
      .edit-btn {
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
    }
  }

  // 加载状态
  .loading-container {
    padding: 40px;
    display: flex;
    justify-content: center;
    align-items: center;

    .loading-placeholder {
      width: 100%;
      height: 200px;
    }
  }

  // 政策字段展示 - 高密度布局
  .policy-fields {
    padding: 6px;

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
        gap: 6px;
      }
    }

    .field-item {
      background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%);
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 10px 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 65px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;

      // 默认字段（基本字段）- 蓝色系
      &.default-field {
        border-color: #d1e7ff;
        background: linear-gradient(145deg, #fafcff 0%, #f0f8ff 100%);
        
        &:hover {
          border-color: #91caff;
          background: linear-gradient(145deg, #f0f8ff 0%, #e6f4ff 100%);
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.08), 0 2px 4px rgba(24, 144, 255, 0.04);
        }
      }

      // 附加字段（自定义字段）- 紫色系
      &.custom-field {
        border-color: #d3adf7;
        background: linear-gradient(145deg, #fdfaff 0%, #f9f0ff 100%);
        
        &:hover {
          border-color: #b37feb;
          background: linear-gradient(145deg, #f9f0ff 0%, #efdbff 100%);
          box-shadow: 0 4px 12px rgba(114, 46, 209, 0.08), 0 2px 4px rgba(114, 46, 209, 0.04);
        }
      }

      // 添加顶部装饰边框 - 根据字段类型区分颜色
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        transition: all 0.3s ease;
      }

      &.default-field::after {
        background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%);
      }

      &.custom-field::after {
        background: linear-gradient(90deg, #722ed1 0%, #9254de 100%);
      }

      &:hover {
        transform: translateY(-2px);

        &.default-field::after {
          background: linear-gradient(90deg, #1890ff 0%, #40a9ff 50%, #52c41a 100%);
          height: 3px;
        }

        &.custom-field::after {
          background: linear-gradient(90deg, #722ed1 0%, #9254de 50%, #b37feb 100%);
          height: 3px;
        }
      }
      .field-label {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        padding: 2px 0;
        position: relative;

        // 添加左边的装饰条
        &::before {
          content: '';
          width: 3px;
          height: 12px;
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          border-radius: 2px;
          flex-shrink: 0;
        }

        .label-text {
          font-size: 11px;
          font-weight: 600;
          color: #1890ff;
          line-height: 1.2;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #bae7ff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        .field-help {
          font-size: 10px;
          color: #999;
          cursor: help;

          &:hover {
            color: #1890ff;
          }
        }
      }

      .field-value {
        padding: 6px 8px;
        background: white;
        border-radius: 4px;
        border: 1px solid #f0f0f0;
        min-height: 28px;
        display: flex;
        align-items: center;
        position: relative;
        transition: all 0.2s ease;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #52c41a 0%, #73d13d 100%);
          border-radius: 0 1px 1px 0;
        }

        &:hover {
          background: #fafafa;
          border-color: #d9d9d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .value-text {
          font-size: 13px;
          color: #262626;
          line-height: 1.4;
          font-weight: 500;
          margin-left: 6px;
          flex: 1;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
          position: relative;
          
          &.expandable {
            cursor: pointer;
            transition: all 0.2s ease;
            
            &:hover {
              color: #1890ff;
            }
            
            .expand-indicator {
              position: absolute;
              right: 2px;
              bottom: 2px;
              font-size: 12px;
              color: #1890ff;
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
            max-height: 60px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
          }
          
          // 为所有文本内容设置固定高度和截断
          max-height: 60px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .value-number {
          font-size: 14px;
          font-weight: 700;
          color: #1890ff;
          margin-left: 6px;
          display: flex;
          align-items: baseline;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;

          .unit {
            font-size: 11px;
            font-weight: 500;
            color: #8c8c8c;
            margin-left: 3px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
        }

        .value-select,
        .value-boolean {
          font-size: 12px;
          font-weight: 500;
          margin-left: 6px;
          
          :deep(.ant-tag) {
            margin: 0;
            font-size: 11px;
            padding: 2px 8px;
            line-height: 1.4;
            border-radius: 4px;
            font-weight: 500;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
        }

        .value-default {
          font-size: 13px;
          color: #262626;
          font-weight: 500;
          margin-left: 6px;
          flex: 1;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
        }
      }
    }
  }

  // 字段配置面板
  .field-config-panel {
    margin-top: 20px;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;

      h5 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
    }

    .config-content {
      padding: 16px;

      .field-checkboxes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }

        .field-checkbox-item {
          :deep(.ant-checkbox-wrapper) {
            font-size: 13px;
            color: #666;

            &:hover {
              color: #1890ff;
            }
          }
        }
      }
    }
  }

  // 空状态
  .empty-state {
    padding: 40px;
    text-align: center;

    .empty-icon {
      font-size: 48px;
      color: #d9d9d9;
      margin-bottom: 16px;
    }

    .empty-hint {
      font-size: 13px;
      color: #999;
      margin: 0;
    }
  }

  // 空状态占位符美化样式
  .empty-placeholder {
    position: relative;
    
    .placeholder-grid {
      margin-bottom: 24px;
    }

    .placeholder-hint {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 120px;
      
      .hint-content {
        text-align: center;
        padding: 20px;
        
        .hint-icon {
          font-size: 36px;
          color: #1890ff;
          margin-bottom: 12px;
          opacity: 0.8;
        }
        
        .hint-title {
          font-size: 16px;
          font-weight: 600;
          color: #262626;
          margin: 8px 0;
          font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .hint-text {
          font-size: 13px;
          color: #8c8c8c;
          margin: 8px 0 12px 0;
          line-height: 1.5;
        }
        
        .hint-tag {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          
          .anticon {
            margin-right: 4px;
          }
        }
      }
    }
  }
  
  // 编辑表单样式
  .edit-form {
    padding: 16px;
    background: #fafafa;
    border-radius: 6px;
    margin: 6px;
    
    :deep(.ant-form-item) {
      margin-bottom: 16px;
      
      .ant-form-item-label {
        padding-bottom: 4px;
        
        label {
          font-size: 12px;
          font-weight: 600;
          color: #333;
        }
      }
      
      .ant-form-item-control {
        .ant-input,
        .ant-textarea,
        .ant-input-number,
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
        border-color: #40a9ff;
      }
      
      &:focus,
      &.ant-input-focused,
      &.ant-select-focused {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
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
          background-color: #f0f8ff;
        }
        
        &.ant-radio-wrapper-checked {
          background-color: #e6f7ff;
          border-color: #1890ff;
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .unit-policy-display {
    .section-header {
      padding: 8px 10px;

      .section-title {
        font-size: 12px;
        gap: 4px;

        .section-icon {
          font-size: 11px;
        }
      }

      .section-actions {
        .edit-btn,
        .config-btn,
        .refresh-btn,
        .save-btn,
        .cancel-btn {
          width: 20px;
          height: 20px;
          font-size: 11px;
        }
      }
    }

    .policy-fields {
      padding: 8px;

      .field-item {
        padding: 6px 8px;
        min-height: 45px;

        .field-label .label-text {
          font-size: 10px;
        }

        .field-value {
          .value-text,
          .value-default {
            font-size: 11px;
          }

          .value-number {
            font-size: 12px;

            .unit {
              font-size: 10px;
            }
          }

          .value-select,
          .value-boolean {
            font-size: 10px;
            
            :deep(.ant-tag) {
              font-size: 9px;
              padding: 1px 4px;
            }
          }
        }
      }
    }

    // 移动端美化样式优化
    .policy-fields {
      .field-item {
        padding: 8px 10px;
        min-height: 55px;
        border-radius: 6px;

        // 移动端装饰边框调整
        &::after {
          height: 2px;
        }

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

          &::after {
            height: 2px;
          }
        }

        .field-label {
          margin-bottom: 4px;
          gap: 4px;

          &::before {
            width: 2px;
            height: 10px;
          }

          .label-text {
            font-size: 10px;
            padding: 1px 4px;
            letter-spacing: 0.2px;
          }
        }

        .field-value {
          padding: 4px 6px;
          min-height: 22px;

          &::before {
            width: 1px;
          }

          .value-text,
          .value-default {
            font-size: 11px;
            margin-left: 4px;
          }

          .value-number {
            font-size: 12px;
            margin-left: 4px;

            .unit {
              font-size: 10px;
            }
          }

          .value-select,
          .value-boolean {
            margin-left: 4px;

            :deep(.ant-tag) {
              font-size: 9px;
              padding: 1px 4px;
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
        background: #fafafa;
        border-radius: 6px;
        padding: 16px;
        border: 1px solid #f0f0f0;
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