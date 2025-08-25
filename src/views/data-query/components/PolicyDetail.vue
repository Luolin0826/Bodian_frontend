<template>
  <div class="policy-detail">
    <a-spin :spinning="loading" tip="加载详细政策信息...">
    <!-- 详情头部 -->
    <div class="detail-header">
      <div class="region-title">
        <environment-outlined class="location-icon" />
        <span class="location-text">
          {{ detailedPolicy.province }}
          <span v-if="detailedPolicy.city"> - {{ detailedPolicy.city }}</span>
          <span v-if="detailedPolicy.company"> - {{ detailedPolicy.company }}</span>
        </span>
      </div>
      <div class="region-badges">
        <a-tag :color="getRegionTypeColor(detailedPolicy.region_type_name)" size="small">
          {{ detailedPolicy.region_type_name }}
        </a-tag>
        <a-tag v-if="detailedPolicy.company_type" :color="detailedPolicy.company_type === '国网' ? 'blue' : 'green'">
          {{ detailedPolicy.company_type }}
        </a-tag>
        <a-tag v-if="detailedPolicy.batch" color="purple">
          {{ detailedPolicy.batch }}
        </a-tag>
        <a-tag v-if="detailedPolicy.value_info?.is_best_value_city" color="gold" size="small">
          <star-outlined />
          最佳性价比市
        </a-tag>
        <a-tag v-if="detailedPolicy.value_info?.is_best_value_county" color="orange" size="small">
          <crown-outlined />
          最佳性价比区县
        </a-tag>
      </div>
    </div>

    <!-- 一体化详情内容 -->
    <div class="unified-content">
      <!-- 第一行：基本信息和薪资待遇 -->
      <div class="content-row">
        <!-- 基本要求 -->
        <div class="info-section half-width">
          <div class="section-header">
            <idcard-outlined class="section-icon" />
            <h4 class="section-title">基本要求</h4>
          </div>
          <div class="section-content">
            <div class="info-grid">
              <div 
                v-for="(value, key) in filteredBasicRequirements"
                :key="key"
                class="info-item"
              >
                <span class="info-label">{{ getRequirementLabel(key) }}:</span>
                <span class="info-value">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 薪资待遇 -->
        <div class="info-section half-width">
          <div class="section-header">
            <dollar-outlined class="section-icon" />
            <h4 class="section-title">薪资待遇</h4>
          </div>
          <div class="section-content">
            <div class="salary-cards">
              <div v-if="detailedPolicy.salary_info?.bachelor_salary" class="salary-card">
                <div class="salary-type">本科薪资</div>
                <div class="salary-amount">{{ detailedPolicy.salary_info.bachelor_salary }}万</div>
              </div>
              <div v-if="detailedPolicy.salary_info?.master_salary" class="salary-card">
                <div class="salary-type">硕士薪资</div>
                <div class="salary-amount">{{ detailedPolicy.salary_info.master_salary }}万</div>
              </div>
              <div v-if="detailedPolicy.salary_info?.bachelor_interview_line" class="salary-card">
                <div class="salary-type">本科面试线</div>
                <div class="salary-amount">{{ detailedPolicy.salary_info.bachelor_interview_line }}分</div>
              </div>
              <div v-if="detailedPolicy.salary_info?.master_interview_line" class="salary-card">
                <div class="salary-type">硕士面试线</div>
                <div class="salary-amount">{{ detailedPolicy.salary_info.master_interview_line }}分</div>
              </div>
              <div v-if="detailedPolicy.salary_info?.bachelor_comprehensive_score" class="salary-card highlight">
                <div class="salary-type">本科综合分</div>
                <div class="salary-amount">{{ detailedPolicy.salary_info.bachelor_comprehensive_score }}分</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行：学历要求对比 -->
      <div v-if="hasEducationRequirements" class="content-row">
        <div class="info-section full-width">
          <div class="section-header">
            <graduation-cap-outlined class="section-icon" />
            <h4 class="section-title">学历要求对比</h4>
          </div>
          <div class="section-content">
            <div class="education-comparison">
              <!-- 本科要求 -->
              <div class="education-level-section">
                <div class="level-header">本科层次</div>
                <div class="education-grid">
                  <div v-for="item in bachelorRequirements" :key="item.key" class="education-item" v-show="item.value">
                    <div class="education-label">{{ item.label }}</div>
                    <div class="education-values">
                      <div class="education-value">
                        <span class="company-name">{{ detailedPolicy.company || '市级汇总' }}</span>
                        <a-tag :color="getEducationStatusColor(detailedPolicy.education_requirements?.[item.key])" size="small">
                          {{ detailedPolicy.education_requirements?.[item.key] || '无数据' }}
                        </a-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 硕士要求 -->
              <div class="education-level-section">
                <div class="level-header">硕士层次</div>
                <div class="education-grid">
                  <div v-for="item in masterRequirements" :key="item.key" class="education-item" v-show="item.value">
                    <div class="education-label">{{ item.label }}</div>
                    <div class="education-values">
                      <div class="education-value">
                        <span class="company-name">{{ detailedPolicy.company || '市级汇总' }}</span>
                        <a-tag :color="getEducationStatusColor(detailedPolicy.education_requirements?.[item.key])" size="small">
                          {{ detailedPolicy.education_requirements?.[item.key] || '无数据' }}
                        </a-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三行：网申政策和录取政策 -->
      <div class="content-row">
        <!-- 网申政策 -->
        <div class="info-section half-width">
          <div class="section-header">
            <check-circle-outlined class="section-icon" />
            <h4 class="section-title">网申政策</h4>
          </div>
          <div class="section-content">
            <div class="policy-comparison">
              <div class="policy-data-section">
                <div class="policy-data-header">
                  <span class="company-name">{{ detailedPolicy.company || '市级汇总' }}</span>
                  <a-tag v-if="detailedPolicy.value_info?.is_best_value_city" color="gold" size="small">
                    <star-outlined />
                    最佳性价比市
                  </a-tag>
                  <a-tag v-if="detailedPolicy.value_info?.is_best_value_county" color="orange" size="small">
                    <crown-outlined />
                    最佳性价比区县
                  </a-tag>
                </div>
                <div class="policy-items">
                  <div v-if="detailedPolicy.detailed_info?.admission_ratio" class="policy-item">
                    <span class="policy-label">{{ getAdmissionLabel('admission_ratio') }}:</span>
                    <span class="policy-value">{{ detailedPolicy.detailed_info.admission_ratio }}</span>
                  </div>
                  <div v-if="detailedPolicy.detailed_info?.single_cert_probability" class="policy-item">
                    <span class="policy-label">{{ getAdmissionLabel('single_cert_probability') }}:</span>
                    <span class="policy-value">{{ detailedPolicy.detailed_info.single_cert_probability }}</span>
                  </div>
                  <div v-if="detailedPolicy.detailed_info?.stable_score_range" class="policy-item">
                    <span class="policy-label">{{ getAdmissionLabel('stable_score_range') }}:</span>
                    <span class="policy-value success">{{ detailedPolicy.detailed_info.stable_score_range }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 录取政策 -->
        <div class="info-section half-width">
          <div class="section-header">
            <file-text-outlined class="section-icon" />
            <h4 class="section-title">录取政策</h4>
          </div>
          <div class="section-content">
            <div class="admission-policies">
              <div class="admission-data-section">
                <div class="policy-data-header">
                  <span class="company-name">{{ detailedPolicy.company || '市级汇总' }}</span>
                </div>
                <div class="policy-items">
                  <div v-if="detailedPolicy.detailed_info?.first_batch_fail_second_batch" class="policy-item">
                    <span class="policy-label">{{ getAdmissionLabel('first_batch_fail_second_batch') }}:</span>
                    <a-tag :color="getPolicyColor(detailedPolicy.detailed_info.first_batch_fail_second_batch)" size="small">
                      {{ detailedPolicy.detailed_info.first_batch_fail_second_batch }}
                    </a-tag>
                  </div>
                  <div v-if="detailedPolicy.detailed_info?.second_choice_available" class="policy-item">
                    <span class="policy-label">{{ getAdmissionLabel('second_choice_available') }}:</span>
                    <a-tag :color="getPolicyColor(detailedPolicy.detailed_info.second_choice_available)" size="small">
                      {{ detailedPolicy.detailed_info.second_choice_available }}
                    </a-tag>
                  </div>
                  <div v-if="detailedPolicy.basic_requirements?.major_mismatch_allowed" class="policy-item">
                    <span class="policy-label">{{ getRequirementLabel('major_mismatch_allowed') }}:</span>
                    <a-tag :color="getPolicyColor(detailedPolicy.basic_requirements.major_mismatch_allowed)" size="small">
                      {{ detailedPolicy.basic_requirements.major_mismatch_allowed }}
                    </a-tag>
                  </div>
                  <div v-if="detailedPolicy.detailed_info?.campus_recruit_then_first_batch" class="policy-item">
                    <span class="policy-label">{{ getAdmissionLabel('campus_recruit_then_first_batch') }}:</span>
                    <a-tag :color="getPolicyColor(detailedPolicy.detailed_info.campus_recruit_then_first_batch)" size="small">
                      {{ detailedPolicy.detailed_info.campus_recruit_then_first_batch }}
                    </a-tag>
                  </div>
                  <div v-if="detailedPolicy.basic_requirements?.deferred_graduation_impact" class="policy-item">
                    <span class="policy-label">{{ getRequirementLabel('deferred_graduation_impact') }}:</span>
                    <a-tag :color="getPolicyColor(detailedPolicy.basic_requirements.deferred_graduation_impact)" size="small">
                      {{ detailedPolicy.basic_requirements.deferred_graduation_impact }}
                    </a-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第四行：选岗方式和提前批差异 -->
      <div v-if="hasPositionOrBatchInfo" class="content-row">
        <div class="info-section full-width">
          <div class="section-header">
            <info-circle-outlined class="section-icon" />
            <h4 class="section-title">选岗与批次差异</h4>
          </div>
          <div class="section-content">
            <div class="position-batch-info">
              <div v-for="data in detailedPolicyData?.data || []" :key="data.id" class="position-data-section">
                <div class="policy-data-header">
                  <span class="company-name">{{ data.company || '市级汇总' }}</span>
                </div>
                <div class="detail-items">
                  <div v-if="data.position_selection_method" class="detail-item">
                    <div class="detail-label">{{ getAdmissionLabel('position_selection_method') }}</div>
                    <div class="detail-content-text">{{ data.position_selection_method }}</div>
                  </div>
                  
                  <div v-if="data.early_batch_difference" class="detail-item">
                    <div class="detail-label">{{ getAdmissionLabel('early_batch_difference') }}</div>
                    <div class="detail-content-text">{{ data.early_batch_difference }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第五行：详细录取规则和网申不成文规定 -->
      <div v-if="hasDetailedRules" class="content-row">
        <div class="info-section full-width">
          <div class="section-header">
            <file-text-outlined class="section-icon" />
            <h4 class="section-title">详细录取规则与网申规定</h4>
          </div>
          <div class="section-content">
            <div class="rules-info">
              <div v-for="data in detailedPolicyData?.data || []" :key="data.id" class="rules-data-section">
                <div class="policy-data-header">
                  <span class="company-name">{{ data.company || '市级汇总' }}</span>
                </div>
                <div class="detail-items">
                  <div v-if="data.detailed_rules" class="detail-item">
                    <div class="detail-label">{{ getAdmissionLabel('detailed_rules') }}</div>
                    <div class="detail-content-text success">{{ data.detailed_rules }}</div>
                  </div>
                  
                  <div v-if="data.unwritten_rules" class="detail-item">
                    <div class="detail-label">{{ getAdmissionLabel('unwritten_rules') }}</div>
                    <div class="detail-content-text warning">{{ data.unwritten_rules }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 备注信息 -->
      <div v-if="policy.field_notes?.length" class="content-row">
        <div class="info-section full-width">
          <div class="section-header">
            <message-outlined class="section-icon" />
            <h4 class="section-title">字段备注</h4>
          </div>
          <div class="section-content">
            <div class="notes-list">
              <div 
                v-for="(note, index) in policy.field_notes"
                :key="index"
                class="note-item"
              >
                <div class="note-header">
                  <span class="note-field">{{ note.field_name }}</span>
                  <a-tag color="blue" size="small">{{ note.note_type }}</a-tag>
                </div>
                <div class="note-content">{{ note.note_content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="detail-actions">
      <a-space>
        <a-button @click="handleExport">
          <export-outlined />
          导出详情
        </a-button>
        <a-button type="primary" @click="handleCompare">
          <diff-outlined />
          加入对比
        </a-button>
      </a-space>
    </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  EnvironmentOutlined,
  StarOutlined,
  CrownOutlined,
  IdcardOutlined,
  BookOutlined,
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  ExportOutlined,
  DiffOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  BookOutlined as GraduationCapOutlined
} from '@ant-design/icons-vue'
import type { PolicyInfo } from '@/api/recruitment'
import { recruitmentAPI } from '@/api/recruitment'

// Props
interface Props {
  policy: PolicyInfo
  selectedEducationLevel?: 'bachelor' | 'master' | null
}

const props = defineProps<Props>()

// 响应式数据
const activeTab = ref('basic')
const loading = ref(false)
const detailedPolicyData = ref<any>(null)

// 计算属性 - 获取详细政策数据
const detailedPolicy = computed(() => {
  if (detailedPolicyData.value?.data?.length > 0) {
    return detailedPolicyData.value.data[0]
  }
  return props.policy // 降级使用原始数据
})

const filteredBasicRequirements = computed(() => {
  const basicReq = detailedPolicy.value?.basic_requirements || {}
  
  return Object.fromEntries(
    Object.entries(basicReq).filter(([_, value]) => value && value.trim() && value !== '未明确')
  )
})

// 检查是否有学历要求数据
const hasEducationRequirements = computed(() => {
  const eduReq = detailedPolicy.value?.education_requirements || {}
  return !!(eduReq.bachelor_985 || eduReq.bachelor_211 || eduReq.master_985 || eduReq.master_211)
})

// 检查是否有选岗和批次差异信息
const hasPositionOrBatchInfo = computed(() => {
  const detailInfo = detailedPolicy.value?.detailed_info || {}
  return !!(detailInfo.position_selection_method || detailInfo.early_batch_difference)
})

// 检查是否有详细规则信息
const hasDetailedRules = computed(() => {
  const detailInfo = detailedPolicy.value?.detailed_info || {}
  return !!(detailInfo.detailed_rules || detailInfo.unwritten_rules)
})

// 本科要求配置
const bachelorRequirements = computed(() => {
  const eduReq = detailedPolicy.value?.education_requirements || {}
  return [
    { key: 'bachelor_985', label: '985高校', value: !!eduReq.bachelor_985 },
    { key: 'bachelor_211', label: '211高校', value: !!eduReq.bachelor_211 },
    { key: 'bachelor_provincial_double_first', label: '省内双一流', value: !!eduReq.bachelor_provincial_double_first },
    { key: 'bachelor_external_double_first', label: '省外双一流', value: !!eduReq.bachelor_external_double_first },
    { key: 'bachelor_provincial_non_double', label: '省内双非一本', value: !!eduReq.bachelor_provincial_non_double },
    { key: 'bachelor_external_non_double', label: '省外双非一本', value: !!eduReq.bachelor_external_non_double },
    { key: 'bachelor_provincial_second', label: '省内二本', value: !!eduReq.bachelor_provincial_second },
    { key: 'bachelor_external_second', label: '省外二本', value: !!eduReq.bachelor_external_second },
    { key: 'bachelor_private', label: '民办本科', value: !!eduReq.bachelor_private },
    { key: 'bachelor_upgrade', label: '专升本', value: !!eduReq.bachelor_upgrade },
    { key: 'bachelor_college', label: '专科', value: !!eduReq.bachelor_college }
  ]
})

// 硕士要求配置
const masterRequirements = computed(() => {
  const eduReq = detailedPolicy.value?.education_requirements || {}
  return [
    { key: 'master_985', label: '985高校', value: !!eduReq.master_985 },
    { key: 'master_211', label: '211高校', value: !!eduReq.master_211 },
    { key: 'master_provincial_double_first', label: '省内双一流', value: !!eduReq.master_provincial_double_first },
    { key: 'master_external_double_first', label: '省外双一流', value: !!eduReq.master_external_double_first },
    { key: 'master_provincial_non_double', label: '省内双非', value: !!eduReq.master_provincial_non_double },
    { key: 'master_external_non_double', label: '省外双非', value: !!eduReq.master_external_non_double }
  ]
})

const filteredAdmissionPolicies = computed(() => {
  if (!props.policy.admission_policies) return {}
  
  return Object.fromEntries(
    Object.entries(props.policy.admission_policies).filter(([_, value]) => value && value.trim())
  )
})

// 方法
const getRegionTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '直辖市': 'purple',
    '省会城市': 'blue',
    '普通省': 'green',
    '特殊地区': 'orange'
  }
  return colorMap[type] || 'default'
}

const getEducationColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '优先': 'green',
    '大量需求': 'blue',
    '接受': 'cyan',
    '正常录取': 'default'
  }
  return colorMap[status] || 'default'
}

const getPolicyColor = (value: string) => {
  if (value?.includes('可以') || value?.includes('是') || value?.includes('不影响')) return 'green'
  if (value?.includes('不') || value?.includes('无') || value?.includes('否')) return 'red'
  return 'blue'
}

const getEducationStatusColor = (status: string) => {
  if (!status || status === 'null') return 'default'
  if (status.includes('能过网申') || status.includes('通过')) return 'green'
  if (status.includes('谨慎') || status.includes('困难')) return 'orange'
  if (status.includes('不能') || status.includes('无法')) return 'red'
  return 'blue'
}

const getRequirementLabel = (key: string) => {
  const labelMap: Record<string, string> = {
    'cet_requirement': '四六级要求',
    'computer_requirement': '计算机证书要求',
    'overage_allowed': '超龄能否通过',
    'household_priority': '是否非常看重户籍',
    'non_first_choice_pass': '非第一志愿是否通过网申',
    'major_mismatch_allowed': '本硕专业不一致可否通过网申',
    'deferred_graduation_impact': '延毕休学影响网申吗'
  }
  return labelMap[key] || key
}

const getAdmissionLabel = (key: string) => {
  const labelMap: Record<string, string> = {
    'first_batch_fail_second_batch': '一批进面没录取可以正常报考二批吗',
    'second_choice_available': '是否有二次志愿填报',
    'position_selection_method': '具体选岗方式',
    'early_batch_difference': '提前批岗位和一二批岗位质量有什么差异',
    'campus_recruit_then_first_batch': '校招给了地方但是不满意是否还可以参加一批',
    'detailed_rules': '详细录取规则',
    'unwritten_rules': '网申不成文规定',
    'stable_score_range': '综合成绩多少分稳一点',
    'single_cert_probability': '有一个证书网申概率',
    'admission_ratio': '报录比'
  }
  return labelMap[key] || key
}

const getApplicationStatusClass = (status: string) => {
  if (status?.includes('能过') || status?.includes('通过')) {
    return 'success'
  } else if (status?.includes('谨慎') || status?.includes('困难')) {
    return 'warning'
  } else if (status?.includes('不能') || status?.includes('无法')) {
    return 'error'
  }
  return 'info'
}

// 获取规则详情的信息
const getRuleDetails = computed(() => {
  const details = detailedPolicy.value?.detailed_info || {}
  const filteredDetails: Record<string, any> = {}
  
  // 只显示有值的字段
  Object.entries(details).forEach(([key, value]) => {
    if (value && value !== 'null' && value !== '' && value.trim && value.trim() !== '') {
      filteredDetails[key] = value
    }
  })
  
  return filteredDetails
})

// 获取薪资详情信息
const getSalaryDetails = computed(() => {
  const salary = detailedPolicy.value?.salary_info || {}
  const details: Record<string, any> = {}
  
  // 格式化薪资信息
  if (salary.bachelor_salary) details['本科薪资待遇'] = salary.bachelor_salary
  if (salary.master_salary) details['硕士薪资待遇'] = salary.master_salary
  if (salary.bachelor_interview_line) details['本科进面线'] = salary.bachelor_interview_line + '分'
  if (salary.master_interview_line) details['硕士进面分'] = salary.master_interview_line + '分'
  if (salary.bachelor_comprehensive_score) details['本科综合分'] = salary.bachelor_comprehensive_score + '分'
  
  return details
})

const handleExport = () => {
  message.info('导出功能开发中...')
}

const handleCompare = () => {
  message.info('已加入对比列表')
}

// 加载详细政策数据
const loadDetailedPolicy = async () => {
  if (!props.policy.province) return
  
  loading.value = true
  try {
    console.log('📋 加载详细政策:', {
      province: props.policy.province,
      city: props.policy.city,
      district: props.policy.district,
      actual_district: (props.policy as any).actual_district,
      company: props.policy.company
    })
    console.log('📋 当前学历层次:', props.selectedEducationLevel)
    
    // 使用实际的区县名称作为company参数，如果没有则使用原始的company字段
    const companyParam = (props.policy as any).actual_district || 
                        (props.policy.district !== '全市' ? props.policy.district : undefined)
    
    console.log('📋 修正后的API参数:', {
      province: props.policy.province,
      city: props.policy.city,
      company: companyParam
    })
    
    const response = await recruitmentAPI.getDetailedPolicy(
      props.policy.province,
      props.policy.city || undefined,
      companyParam
    )
    
    // 转换API数据结构为组件期望的格式
    if (response.data && response.data.length > 0) {
      const rawData = response.data[0] // 取第一条数据
      
      // 构建适配的数据结构
      const adaptedData = {
        province: rawData.province,
        city: rawData.city,
        company: rawData.company,
        company_type: rawData.company_type,
        batch: rawData.batch,
        region_type_name: rawData.data_level,
        
        // 基本要求
        basic_requirements: {
          cet_requirement: rawData.cet_requirement || '未明确',
          computer_requirement: rawData.computer_requirement || '未明确',
          overage_allowed: rawData.overage_allowed || '未明确',
          household_priority: rawData.household_priority || '未明确',
          non_first_choice_pass: rawData.non_first_choice_pass || '未明确',
          major_mismatch_allowed: rawData.major_mismatch_allowed || '未明确',
          deferred_graduation_impact: rawData.deferred_graduation_impact || '未明确'
        },
        
        // 薪资信息
        salary_info: {
          bachelor_salary: rawData.bachelor_salary,
          master_salary: rawData.master_salary,
          bachelor_interview_line: rawData.bachelor_interview_line,
          master_interview_line: rawData.master_interview_line,
          bachelor_comprehensive_score: rawData.bachelor_comprehensive_score
        },
        
        // 学历要求
        education_requirements: {
          // 本科层次要求
          bachelor_985: rawData.bachelor_985,
          bachelor_211: rawData.bachelor_211,
          bachelor_provincial_double_first: rawData.bachelor_provincial_double_first,
          bachelor_provincial_non_double: rawData.bachelor_provincial_non_double,
          bachelor_provincial_second: rawData.bachelor_provincial_second,
          bachelor_external_double_first: rawData.bachelor_external_double_first,
          bachelor_external_non_double: rawData.bachelor_external_non_double,
          bachelor_external_second: rawData.bachelor_external_second,
          bachelor_private: rawData.bachelor_private,
          bachelor_college: rawData.bachelor_college,
          bachelor_upgrade: rawData.bachelor_upgrade,
          
          // 硕士层次要求
          master_985: rawData.master_985,
          master_211: rawData.master_211,
          master_provincial_double_first: rawData.master_provincial_double_first,
          master_provincial_non_double: rawData.master_provincial_non_double,
          master_external_double_first: rawData.master_external_double_first,
          master_external_non_double: rawData.master_external_non_double
        },
        
        // 其他详细信息
        detailed_info: {
          position_selection_method: rawData.position_selection_method,
          campus_recruit_then_first_batch: rawData.campus_recruit_then_first_batch,
          first_batch_fail_second_batch: rawData.first_batch_fail_second_batch,
          second_choice_available: rawData.second_choice_available,
          early_batch_difference: rawData.early_batch_difference,
          stable_score_range: rawData.stable_score_range,
          admission_ratio: rawData.admission_ratio,
          single_cert_probability: rawData.single_cert_probability,
          detailed_rules: rawData.detailed_rules,
          unwritten_rules: rawData.unwritten_rules
        },
        
        // 性价比信息
        value_info: {
          is_best_value_city: rawData.is_best_value_city === '是',
          is_best_value_county: rawData.is_best_value_county === '是'
        }
      }
      
      detailedPolicyData.value = { data: [adaptedData] }
      console.log('📋 详细政策加载成功并已适配:', adaptedData)
    } else {
      detailedPolicyData.value = response
      console.log('📋 详细政策加载成功:', response)
    }
    
  } catch (error) {
    console.error('📋 详细政策加载失败:', error)
    message.error('加载详细政策信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 学历层次相关方法
const getEducationLevelTitle = () => {
  return props.selectedEducationLevel === 'bachelor' ? '本科' : '硕士'
}

const getEducationRequirement = (policy: any, type: string) => {
  const prefix = props.selectedEducationLevel || 'bachelor'
  return policy[`${prefix}_${type}`]
}

const getEducationInfo = (policy: any, type: string) => {
  const prefix = props.selectedEducationLevel || 'bachelor'
  return policy[`${prefix}_${type}`]
}

const getRequirementClass = (value: string) => {
  if (value?.includes('能过') || value?.includes('通过')) return 'success'
  if (value?.includes('谨慎') || value?.includes('困难')) return 'warning'
  if (value?.includes('不能') || value?.includes('无法')) return 'error'
  return 'info'
}

// 组件挂载时加载详细政策数据
onMounted(() => {
  loadDetailedPolicy()
})
</script>

<style scoped lang="less">
.policy-detail {
  max-height: 80vh;
  overflow-y: auto;
}

// 统一内容区域
.unified-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

// 内容行
.content-row {
  display: flex;
  gap: 16px;
  
  &:last-child {
    margin-bottom: 16px;
  }
}

// 信息区块
.info-section {
  &.half-width {
    flex: 1;
  }
  
  &.full-width {
    flex: 1 1 100%;
  }
}

// 详情头部
.detail-header {
  padding: 20px;
  background: linear-gradient(135deg, #f8fbff 0%, #f0f9ff 100%);
  border: 1px solid #d6f4ff;
  border-radius: 8px;
  
  .region-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
    
    .location-icon {
      color: #1890ff;
      font-size: 16px;
    }
  }
  
  .region-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

// 详情内容
.detail-content {
  flex: 1;
  
  :deep(.ant-tabs-content-holder) {
    padding: 0;
  }
  
  :deep(.ant-tabs-tabpane) {
    padding: 16px 0;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 信息区块
.info-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
    
    .section-icon {
      color: #52c41a;
      font-size: 16px;
    }
    
    .section-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .section-content {
    padding-left: 24px;
  }
}

// 信息网格
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
  
  .info-item {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px dashed #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .info-label {
      min-width: 120px;
      color: #666;
      font-weight: 500;
    }
    
    .info-value {
      flex: 1;
      color: #333;
    }
  }
}

// 学历层次
.education-levels {
  .education-level {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .level-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .level-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}

// 网申状态
.application-status {
  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    
    &.success {
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #52c41a;
    }
    
    &.warning {
      background: #fff7e6;
      border: 1px solid #ffd591;
      color: #d48806;
    }
    
    &.error {
      background: #fff2f0;
      border: 1px solid #ffb3b3;
      color: #cf1322;
    }
    
    &.info {
      background: #e6f7ff;
      border: 1px solid #91d5ff;
      color: #1890ff;
    }
  }
}

// 数据卡片
.data-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  
  .data-card {
    text-align: center;
    padding: 20px 16px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
    border: 1px solid #d6f4ff;
    border-radius: 8px;
    
    .data-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .data-value {
      font-size: 20px;
      font-weight: 600;
      color: #1890ff;
      margin-bottom: 4px;
    }
    
    .data-desc {
      font-size: 12px;
      color: #8c8c8c;
    }
  }
}

// 薪资卡片
.salary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  
  .salary-card {
    text-align: center;
    padding: 12px 8px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
    border: 1px solid #d6f4ff;
    border-radius: 6px;
    
    &.highlight {
      background: linear-gradient(135deg, #fff7e6 0%, #fef3e2 100%);
      border-color: #ffec8b;
    }
    
    .salary-type {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .salary-amount {
      font-size: 16px;
      font-weight: 600;
      color: #1890ff;
      
      .highlight & {
        color: #fa8c16;
      }
    }
  }
}

// 政策项目
.policy-items {
  .policy-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px dashed #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .policy-question {
      flex: 1;
      color: #333;
      font-weight: 500;
      margin-right: 12px;
      font-size: 13px;
    }
    
    .policy-answer {
      flex-shrink: 0;
    }
  }
}

// 学历要求对比
.education-comparison {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.education-level-section {
  .level-header {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #1890ff;
    display: inline-block;
  }
}

.education-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.education-item {
  .education-label {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    margin-bottom: 8px;
  }
  
  .education-values {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .education-value {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .company-name {
      font-size: 12px;
      color: #999;
      min-width: 60px;
    }
  }
}

// 政策对比
.policy-comparison,
.admission-policies {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.policy-data-section,
.admission-data-section {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
  
  .policy-data-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #e8e8e8;
    
    .company-name {
      font-weight: 600;
      color: #333;
    }
  }
  
  .policy-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .policy-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .policy-label {
        font-size: 12px;
        color: #666;
        flex-shrink: 0;
        margin-right: 8px;
      }
      
      .policy-value {
        flex: 1;
        text-align: right;
        font-size: 12px;
        
        &.success {
          color: #52c41a;
          font-weight: 600;
        }
      }
    }
  }
}

// 选岗方式和批次差异
.position-batch-info,
.rules-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.position-data-section,
.rules-data-section {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
  
  .policy-data-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #e8e8e8;
    
    .company-name {
      font-weight: 600;
      color: #333;
    }
  }
  
  .detail-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

// 详细项目
.detailed-policy-section {
  border: 1px solid #e8f4fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #f8fcff 0%, #e8f4fd 100%);
  
  &::before {
    content: '🔍 详细政策信息';
    display: block;
    font-weight: 600;
    font-size: 14px;
    color: #1890ff;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #d9d9d9;
  }
}

.empty-state, .loading-state {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 24px 16px;
  
  .anticon {
    margin-right: 8px;
  }
}

.loading-state {
  color: #1890ff;
}

.detail-item {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .detail-label {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  .detail-content-text {
    padding: 12px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    color: #666;
    line-height: 1.5;
    
    &.warning {
      background: #fff7e6;
      border-color: #ffe7ba;
      color: #d48806;
    }
    
    &.success {
      background: #f6ffed;
      border-color: #d9f7be;
      color: #389e0d;
    }
  }
}

// 备注列表
.notes-list {
  .note-item {
    margin-bottom: 16px;
    padding: 16px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .note-field {
        font-weight: 600;
        color: #333;
      }
    }
    
    .note-content {
      color: #666;
      line-height: 1.5;
    }
  }
}

// 操作按钮
.detail-actions {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  text-align: right;
}

// 学历层次录取情况
.education-level-info {
  .education-requirements {
    margin-bottom: 20px;
    
    .requirement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    
    .requirement-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      
      .requirement-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      .requirement-value {
        font-size: 14px;
        font-weight: 600;
        
        &.success {
          color: #52c41a;
        }
        
        &.warning {
          color: #faad14;
        }
        
        &.error {
          color: #ff4d4f;
        }
        
        &.info {
          color: #1890ff;
        }
      }
    }
  }
  
  .score-salary-info {
    .info-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }
    
    .info-card {
      text-align: center;
      padding: 16px 12px;
      background: linear-gradient(135deg, #e6f7ff 0%, #d6f4ff 100%);
      border: 1px solid #b3e0ff;
      border-radius: 8px;
      
      .info-card-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 6px;
      }
      
      .info-card-value {
        font-size: 18px;
        font-weight: 600;
        color: #1890ff;
      }
    }
  }
}

// 响应式优化
@media (max-width: 768px) {
  .detail-header {
    padding: 16px;
    
    .region-title {
      font-size: 16px;
    }
  }
  
  .salary-cards {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .policy-items .policy-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    
    .policy-question {
      margin-right: 0;
    }
  }
}
</style>