<template>
  <div class="query-panel">
    <!-- 基础查询区域 -->
    <div class="basic-query-section">
      <div class="query-form compact-layout">
        <!-- 第一行：公司类型、批次、二级单位、学校名称 + 查询按钮 -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">公司类型</label>
            <a-select
              v-model:value="localQuery.company_type"
              placeholder="选择公司类型"
              allow-clear
              @change="handleCompanyTypeChange"
              class="query-select"
            >
              <a-select-option value="国网">国家电网</a-select-option>
              <a-select-option value="南网">南方电网</a-select-option>
            </a-select>
          </div>

          <div class="form-group">
            <label class="form-label">批次</label>
            <a-select
              v-model:value="localQuery.batch"
              placeholder="选择批次"
              allow-clear
              :disabled="localQuery.company_type !== '国网'"
              class="query-select"
            >
              <a-select-option value="第一批">第一批</a-select-option>
              <a-select-option value="第二批">第二批</a-select-option>
              <a-select-option value="第三批">第三批</a-select-option>
            </a-select>
          </div>

          <div class="form-group">
            <label class="form-label">二级单位</label>
            <a-select
              v-model:value="localQuery.province"
              placeholder="选择二级单位"
              allow-clear
              show-search
              :filter-option="filterOption"
              :disabled="!localQuery.company_type"
              @change="handleProvinceChange"
              class="query-select"
            >
              <a-select-option
                v-for="unit in availableOptions.secondaryUnits"
                :key="unit.unit_name"
                :value="unit.unit_name"
              >
                {{ unit.unit_name }} <span class="unit-info">({{ unit.region }} - {{ unit.recruitment_count }}人)</span>
              </a-select-option>
            </a-select>
          </div>

          <div class="form-group">
            <label class="form-label">学校名称</label>
            <a-auto-complete
              v-model:value="localQuery.school_name"
              placeholder="输入学校名称搜索"
              allow-clear
              :options="schoolOptions"
              @search="handleSchoolSearch"
              @change="handleSchoolChange"
              class="query-select"
            >
              <template #option="{ value, label, school_type, school_level, count }">
                <div class="school-option">
                  <span class="school-name">{{ label }}</span>
                  <span class="school-level">{{ school_level }}</span>
                  <span class="school-type">{{ school_type }}</span>
                  <span class="school-count">({{ count }}人)</span>
                </div>
              </template>
            </a-auto-complete>
          </div>

          <!-- 查询按钮 -->
          <div class="form-group button-group">
            <a-button
              type="primary"
              :loading="loading"
              @click="handleSearch"
              class="compact-btn search-btn"
            >
              <search-outlined />
              查询
            </a-button>
          </div>
        </div>

        <!-- 第二行：城市、区县/单位、本科层次、硕士层次 + 重置按钮 -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">城市</label>
            <a-select
              v-model:value="localQuery.city"
              placeholder="选择城市"
              allow-clear
              show-search
              :filter-option="filterOption"
              :disabled="!localQuery.province"
              @change="handleCityChange"
              class="query-select"
            >
              <a-select-option
                v-for="city in availableCities"
                :key="city"
                :value="city"
              >
                {{ city }}
              </a-select-option>
            </a-select>
          </div>

          <div class="form-group">
            <label class="form-label">区县/单位</label>
            <a-select
              v-model:value="localQuery.county"
              placeholder="选择区县或具体单位"
              allow-clear
              show-search
              :filter-option="filterOption"
              :disabled="!localQuery.city"
              class="query-select"
            >
              <a-select-option
                v-for="county in availableCounties"
                :key="county"
                :value="county"
              >
                {{ county }}
              </a-select-option>
            </a-select>
          </div>

          <div class="form-group">
            <label class="form-label">本科层次</label>
            <a-select
              v-model:value="localQuery.bachelor_level"
              placeholder="选择本科层次"
              allow-clear
              show-search
              :filter-option="filterOption"
              class="query-select"
            >
              <a-select-option value="985本">985本</a-select-option>
              <a-select-option value="211本">211本</a-select-option>
              <a-select-option value="省内双一流本">省内双一流本</a-select-option>
              <a-select-option value="省外双一流本">省外双一流本</a-select-option>
              <a-select-option value="省内双非一本">省内双非一本</a-select-option>
              <a-select-option value="省外双非一本">省外双非一本</a-select-option>
              <a-select-option value="省内二本">省内二本</a-select-option>
              <a-select-option value="省外二本">省外二本</a-select-option>
              <a-select-option value="民办本">民办本</a-select-option>
              <a-select-option value="专升本">专升本</a-select-option>
              <a-select-option value="专科">专科</a-select-option>
            </a-select>
          </div>

          <div class="form-group">
            <label class="form-label">硕士层次</label>
            <a-select
              v-model:value="localQuery.master_level"
              placeholder="选择硕士层次"
              allow-clear
              show-search
              :filter-option="filterOption"
              class="query-select"
            >
              <a-select-option value="985硕">985硕</a-select-option>
              <a-select-option value="211硕">211硕</a-select-option>
              <a-select-option value="省内双一流硕">省内双一流硕</a-select-option>
              <a-select-option value="省外双一流硕">省外双一流硕</a-select-option>
              <a-select-option value="省内双非硕">省内双非硕</a-select-option>
              <a-select-option value="省外双非硕">省外双非硕</a-select-option>
            </a-select>
          </div>

          <!-- 重置按钮 -->
          <div class="form-group button-group">
            <a-button @click="handleReset" class="compact-btn reset-btn">
              <reload-outlined />
              重置
            </a-button>
          </div>
        </div>

      </div>
    </div>

    <!-- 快速查询标签 -->
    <div class="quick-query-section">
      <div class="section-title">
        <history-outlined />
        快速查询
      </div>
      <div class="quick-tags">
        <a-tag
          v-for="(tag, index) in quickQueryTags"
          :key="index"
          :color="tag.color"
          class="quick-tag"
          @click="handleQuickQuery(tag)"
        >
          {{ tag.label }}
        </a-tag>
      </div>
    </div>

    <!-- 查询历史 -->
    <div class="query-history-section" v-if="queryHistory.length > 0">
      <div class="section-title">
        <clock-circle-outlined />
        查询历史
      </div>
      <div class="history-list">
        <a-tag
          v-for="(history, index) in queryHistory.slice(0, 5)"
          :key="index"
          closable
          class="history-tag"
          @click="handleHistoryQuery(history)"
          @close="removeHistory(index)"
        >
          {{ formatHistoryLabel(history) }}
        </a-tag>
        <a-button
          v-if="queryHistory.length > 5"
          type="text"
          size="small"
          @click="showAllHistory = !showAllHistory"
        >
          {{ showAllHistory ? '收起' : `查看全部(${queryHistory.length})` }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { debounce } from 'lodash-es'
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  HistoryOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import { 
  getAvailableOptions, 
  getProvinces,
  getCitiesByProvince,
  getDistrictsByProvinceAndCity,
  getCompaniesByProvince,
  getCompaniesByProvinceAndCity,
  searchSchools,
  getSecondaryUnits,
  type DistrictPolicyQuery, 
  type SchoolLevelQuery 
} from '@/api/recruitment'

// Props
interface Props {
  query: DistrictPolicyQuery
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits(['update:query', 'search', 'reset'])

// 响应式数据
const localQuery = reactive<DistrictPolicyQuery>({ 
  ...props.query,
  company_type: undefined,
  batch: undefined,
  province: undefined,
  city: undefined,
  county: undefined,
  school_name: undefined,
  bachelor_level: undefined,
  master_level: undefined
})

const showAllHistory = ref(false)

// 可用选项数据
const availableOptions = reactive({
  provinces: [] as string[],
  cities: {} as Record<string, string[]>,
  counties: {} as Record<string, string[]>,
  secondaryUnits: [] as Array<{
    unit_name: string
    region: string
    recruitment_count: number
  }>
})

// 学校搜索相关数据
const schoolOptions = ref<Array<{
  value: string
  label: string
  school_type: string
  school_level: string
  count: number
}>>([])
const searchingSchools = ref(false)

// 快速查询标签
const quickQueryTags = [
  { label: '江苏电网', province: '江苏', color: 'blue' },
  { label: '广东南网', province: '广东', color: 'green' },
  { label: '北京电网', province: '北京', color: 'purple' },
  { label: '上海电网', province: '上海', color: 'orange' },
  { label: '四川电网', province: '四川', color: 'red' },
  { label: '重庆电网', province: '重庆', color: 'cyan' }
]

// 查询历史 (使用localStorage)
const queryHistory = ref<DistrictPolicyQuery[]>([])

// 计算属性
const availableCities = computed(() => {
  return localQuery.province ? availableOptions.cities[localQuery.province] || [] : []
})

const availableCounties = computed(() => {
  const key = `${localQuery.province}-${localQuery.city}`
  return localQuery.city ? availableOptions.counties[key] || [] : []
})

// 方法
const filterOption = (input: string, option: any) => {
  return option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

const handleProvinceChange = async () => {
  // 省份变化时清空城市和区县
  localQuery.city = undefined
  localQuery.county = undefined
  
  if (localQuery.province) {
    try {
      console.log(`🔄 加载省份 "${localQuery.province}" 的城市列表...`)
      const response = await getCitiesByProvince(localQuery.province)
      
      // 适配新的API响应格式
      const cityNames = response.options.map(opt => opt.name)
      availableOptions.cities[localQuery.province] = cityNames
      
      console.log(`✅ 成功加载 ${response.options.length} 个城市:`, cityNames)
      console.log(`📊 数据来源: ${response.data_source}`)
    } catch (error) {
      console.error('加载城市列表失败:', error)
      message.warning('加载城市列表失败，使用默认选项')
    }
  }
  
  updateQuery()
}

const handleCityChange = async () => {
  // 城市变化时清空区县
  localQuery.county = undefined
  
  if (localQuery.province && localQuery.city) {
    try {
      console.log(`🔄 加载城市 "${localQuery.city}" 的区县列表...`)
      const response = await getDistrictsByProvinceAndCity(localQuery.province, localQuery.city)
      
      // 适配新的API响应格式
      const districtNames = response.options.map(opt => opt.name)
      const key = `${localQuery.province}-${localQuery.city}`
      availableOptions.counties[key] = districtNames
      
      console.log(`✅ 成功加载 ${response.options.length} 个区县:`, districtNames)
      console.log(`📊 数据来源: ${response.data_source}`)
    } catch (error) {
      console.error('加载区县列表失败:', error)
      message.warning('加载区县列表失败，使用默认选项')
    }
  }
  
  updateQuery()
}


const handleCompanyTypeChange = async () => {
  // 公司类型变化时，清空相关字段
  localQuery.batch = undefined
  localQuery.province = undefined
  localQuery.city = undefined
  localQuery.county = undefined
  
  // 如果切换到南网则清空批次
  if (localQuery.company_type === '南网') {
    localQuery.batch = undefined
  }
  
  // 根据公司类型加载对应的二级单位
  if (localQuery.company_type) {
    try {
      console.log(`🔄 加载公司类型 "${localQuery.company_type}" 的二级单位...`)
      const response = await getSecondaryUnits(localQuery.company_type)
      availableOptions.secondaryUnits = response.secondary_units
      console.log(`✅ 成功加载 ${response.count} 个二级单位`, response.secondary_units)
    } catch (error) {
      console.error('加载二级单位失败:', error)
      message.warning('加载二级单位失败，请重试')
      availableOptions.secondaryUnits = []
    }
  } else {
    availableOptions.secondaryUnits = []
  }
  
  updateQuery()
}


const updateQuery = () => {
  emit('update:query', { ...localQuery })
}

// 学校搜索核心方法（不防抖）
const performSchoolSearch = async (value: string) => {
  if (!value || value.length < 2) {
    schoolOptions.value = []
    return
  }
  
  try {
    searchingSchools.value = true
    const response = await searchSchools(value, 10)
    
    console.log(`🔍 学校搜索 "${value}": 找到 ${response.schools.length}/${response.total_schools} 所学校`)
    
    // 适配新的API响应格式
    schoolOptions.value = response.schools.map(school => ({
      value: school.school_name,
      label: school.school_name,
      school_type: school.school_type,
      school_level: school.school_level,
      count: school.recruitment_count
    }))
  } catch (error) {
    console.error('学校搜索失败:', error)
    schoolOptions.value = []
    message.warning('学校搜索失败，请检查网络连接')
  } finally {
    searchingSchools.value = false
  }
}

// 学校搜索处理方法 - 添加防抖（800ms）
const handleSchoolSearch = debounce(performSchoolSearch, 800)

const handleSchoolChange = (value: string) => {
  localQuery.school_name = value
  updateQuery()
}

const handleSearch = () => {
  // 检查是否有任何查询条件
  const hasCondition = localQuery.province || 
                      localQuery.city || 
                      localQuery.county || 
                      localQuery.company_type || 
                      localQuery.batch ||
                      localQuery.school_name ||
                      localQuery.bachelor_level || 
                      localQuery.master_level

  // 调试信息
  console.log('查询条件检查:', {
    province: localQuery.province,
    city: localQuery.city,
    county: localQuery.county,
    company_type: localQuery.company_type,
    batch: localQuery.batch,
    bachelor_level: localQuery.bachelor_level,
    master_level: localQuery.master_level,
    hasCondition
  })
  
  if (!hasCondition) {
    message.warning('请至少选择一个查询条件')
    return
  }

  // 确保数据同步到父组件
  updateQuery()
  
  // 保存查询历史
  saveQueryHistory()
  
  // 使用nextTick确保数据更新后再触发搜索
  nextTick(() => {
    emit('search')
  })
}

const handleReset = () => {
  Object.assign(localQuery, {
    company_type: undefined,
    batch: undefined,
    province: undefined,
    city: undefined,
    county: undefined,
    school_name: undefined,
    bachelor_level: undefined,
    master_level: undefined
  })
  
  // 清空学校搜索选项和二级单位
  schoolOptions.value = []
  availableOptions.secondaryUnits = []
  
  updateQuery()
  emit('reset')
}


const handleQuickQuery = (tag: any) => {
  Object.assign(localQuery, {
    province: tag.province
  })
  updateQuery()
  handleSearch()
}

const handleHistoryQuery = (history: DistrictPolicyQuery) => {
  Object.assign(localQuery, history)
  updateQuery()
  handleSearch()
}

const saveQueryHistory = () => {
  // 避免重复保存相同查询
  const exists = queryHistory.value.some(h => 
    h.province === localQuery.province &&
    h.city === localQuery.city &&
    h.county === localQuery.county &&
    h.company_type === localQuery.company_type
  )
  
  if (!exists) {
    queryHistory.value.unshift({ ...localQuery })
    // 最多保存20条历史
    if (queryHistory.value.length > 20) {
      queryHistory.value = queryHistory.value.slice(0, 20)
    }
    
    // 保存到localStorage
    localStorage.setItem('dataQueryHistory', JSON.stringify(queryHistory.value))
  }
}

const removeHistory = (index: number) => {
  queryHistory.value.splice(index, 1)
  localStorage.setItem('dataQueryHistory', JSON.stringify(queryHistory.value))
}

const formatHistoryLabel = (history: DistrictPolicyQuery) => {
  const parts = []
  if (history.province) parts.push(history.province)
  if (history.city) parts.push(history.city)
  if (history.county) parts.push(history.county)
  if (history.company_type) parts.push(history.company_type)
  if (history.bachelor_level) parts.push(history.bachelor_level)
  if (history.master_level) parts.push(history.master_level)
  return parts.join(' - ') || '全国查询'
}

const loadAvailableOptions = async () => {
  try {
    const options = await getAvailableOptions()
    // 适配新的后端接口数据结构
    if (options.regions) {
      // 如果返回的是 regions，将其作为省份
      availableOptions.provinces = options.regions || []
    } else {
      availableOptions.provinces = options.provinces || []
    }
    
    availableOptions.cities = options.cities || {}
    
    console.log('✅ 成功加载选项数据:', {
      provinces: availableOptions.provinces.length,
      cities: Object.keys(availableOptions.cities).length,
      rawData: options
    })
  } catch (error) {
    console.error('加载可用选项失败:', error)
    // 使用默认数据
    availableOptions.provinces = [
      '江苏', '广东', '北京', '上海', '四川', '重庆', 
      '浙江', '山东', '河南', '湖北', '湖南', '安徽', '河北', '山西', '辽宁', '吉林',
      '黑龙江', '江西', '福建', '海南', '贵州', '云南', '陕西', '甘肃', '青海', '台湾',
      '内蒙古', '广西', '西藏', '宁夏', '新疆'
    ]
    
    availableOptions.cities = {
      '江苏': ['南京', '苏州', '无锡', '常州', '南通', '镇江', '扬州', '盐城', '淮安', '宿迁', '连云港', '徐州', '泰州'],
      '广东': ['广州', '深圳', '佛山', '东莞', '中山', '珠海', '惠州', '江门', '肇庆'],
      '北京': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区', '通州区'],
      '上海': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区']
    }
    
    console.log('✅ 使用默认选项数据')
  }
}

const loadQueryHistory = () => {
  try {
    const saved = localStorage.getItem('dataQueryHistory')
    if (saved) {
      queryHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载查询历史失败:', error)
  }
}

// 监听props变化
watch(() => props.query, (newQuery) => {
  Object.assign(localQuery, newQuery)
}, { deep: true })

// 生命周期
onMounted(async () => {
  await loadAvailableOptions()
  loadQueryHistory()
})
</script>

<style scoped lang="less">
.query-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  padding: 20px;
  margin-bottom: 16px;
}

// 基础查询区域
.basic-query-section {
  .query-form {
    // 紧凑布局样式
    &.compact-layout {
      .form-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr) auto;
        gap: 12px;
        margin-bottom: 10px;
        align-items: end;

        @media (max-width: 1200px) {
          grid-template-columns: repeat(2, 1fr) auto;
          
          .form-group:nth-child(n+3):not(.button-group) {
            grid-column: 1 / -2;
          }
          
          .button-group {
            grid-column: -2;
          }
        }

        @media (max-width: 768px) {
          grid-template-columns: 1fr auto;
          
          .form-group:not(.button-group) {
            grid-column: 1;
          }
          
          .button-group {
            grid-column: 2;
          }
        }
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      // 高级筛选行样式
      &.advanced-row {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 6px;
        border-left: 3px solid #1890ff;
        margin-top: 8px;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.button-group {
        justify-content: flex-end;
        align-items: center;
        
        .compact-btn {
          width: 80px;
          height: 36px;
          font-size: 14px;
          
          .anticon {
            font-size: 14px;
          }
        }
      }

      .form-label {
        font-size: 13px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
        
        .required {
          color: #ff4d4f;
          margin-left: 2px;
        }
      }

      .query-select {
        height: 36px;
        font-size: 14px;
      }
    }
  }

  .advanced-filters {
    padding-top: 16px;
    border-top: 1px dashed #e8e8e8;
    margin-top: 16px;
  }

  .query-actions {
    display: flex;
    justify-content: center;
    padding-top: 20px;
    border-top: 1px solid #f0f0f0;
    margin-top: 20px;

    .search-btn {
      min-width: 120px;
    }

    .advanced-btn {
      color: #1890ff;
      
      &:hover {
        color: #40a9ff;
      }
    }

    @media (max-width: 768px) {
      .ant-space {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
}

// 快速查询区域
.quick-query-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    margin-bottom: 12px;
  }

  .quick-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .quick-tag {
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

// 查询历史区域
.query-history-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #666;
    margin-bottom: 12px;
  }

  .history-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .history-tag {
      cursor: pointer;
      background: #f6f6f6;
      border: 1px solid #e8e8e8;
      
      &:hover {
        background: #e6f7ff;
        border-color: #1890ff;
        color: #1890ff;
      }
    }
  }
}

// 学校搜索选项样式
.school-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  
  .school-name {
    flex: 1;
    font-weight: 500;
    color: #333;
  }
  
  .school-level {
    padding: 2px 6px;
    font-size: 10px;
    color: #fff;
    background: #1890ff;
    border-radius: 3px;
    flex-shrink: 0;
    
    &:empty {
      display: none;
    }
  }
  
  .school-type {
    padding: 2px 6px;
    font-size: 11px;
    color: #666;
    background: #f5f5f5;
    border-radius: 3px;
    flex-shrink: 0;
  }
  
  .school-count {
    font-size: 11px;
    color: #999;
    flex-shrink: 0;
  }
}

// 二级单位选项样式
.unit-info {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}

// 响应式优化
@media (max-width: 768px) {
  .query-panel {
    padding: 16px;
  }

  .quick-query-section,
  .query-history-section {
    .quick-tags,
    .history-list {
      gap: 6px;
    }
  }
  
  .school-option {
    .school-name {
      font-size: 12px;
    }
    
    .school-type,
    .school-count {
      font-size: 10px;
    }
  }
}
</style>