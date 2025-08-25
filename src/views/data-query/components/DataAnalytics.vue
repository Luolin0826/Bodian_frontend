<template>
  <div class="data-analytics">
    <!-- 分析面板头部 - 紧凑样式 -->
    <div class="analytics-header">
      <div class="header-title">
        <bar-chart-outlined class="title-icon" />
        <span class="title-text">数据概览</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" tip="正在分析数据...">
        <div class="loading-placeholder"></div>
      </a-spin>
    </div>

    <!-- 分析内容 - 仅概览视图 -->
    <div v-else class="analytics-content compact">
      <!-- 核心指标卡片 -->
      <div class="metrics-grid compact">
        <div class="metric-card">
          <div class="metric-icon">
            <team-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ data?.analytics?.total_count || 0 }}</div>
            <div class="metric-label">总录取人数</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <trophy-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ keySchoolCount }}</div>
            <div class="metric-label">重点学校录取人数</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <global-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ secondaryUnitsCount }}</div>
            <div class="metric-label">覆盖二级单位</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">
            <rise-outlined />
          </div>
          <div class="metric-info">
            <div class="metric-value">{{ genderRatio }}</div>
            <div class="metric-label">男女比例</div>
          </div>
        </div>
      </div>

      <!-- 学校数据表格 -->
      <div class="schools-table-section">
        <div class="table-header">
          <h5>学校录取统计</h5>
          <div class="table-actions">
            <span class="sort-tip">点击表头可排序</span>
          </div>
        </div>
        
        <a-table
          :columns="schoolTableColumns"
          :data-source="schoolTableData"
          :pagination="{
            current: currentPage,
            pageSize: 40,
            total: schoolTableData.length,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 所学校`,
            onChange: handlePageChange,
            size: 'small'
          }"
          size="small"
          :scroll="{ y: 400 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'school_name'">
              <span class="school-name-cell">{{ record.school_name }}</span>
            </template>
            <template v-if="column.key === 'school_type'">
              <a-tag :color="getSchoolTypeColor(record.school_type)">
                {{ record.school_type }}
              </a-tag>
            </template>
            <template v-if="column.key === 'school_level'">
              <a-tag :color="getSchoolLevelColor(record.school_level)" size="small">
                {{ record.school_level }}
              </a-tag>
            </template>
            <template v-if="column.key === 'recruitment_count'">
              <span class="count-cell">{{ record.recruitment_count }}</span>
            </template>
            <template v-if="column.key === 'percentage'">
              <span class="percentage-cell">{{ record.percentage }}%</span>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 二级单位分布表格 -->
      <div class="units-table-section">
        <div class="table-header">
          <h5>二级单位分布</h5>
          <div class="table-actions">
            <span class="sort-tip">点击表头可排序</span>
          </div>
        </div>
        
        <a-table
          :columns="unitTableColumns"
          :data-source="unitTableData"
          :pagination="{
            current: unitCurrentPage,
            pageSize: 30,
            total: unitTableData.length,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 个单位`,
            onChange: handleUnitPageChange,
            size: 'small'
          }"
          size="small"
          :scroll="{ y: 350 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'unit_name'">
              <span class="unit-name-cell">{{ record.unit_name }}</span>
            </template>
            <template v-if="column.key === 'region'">
              <a-tag color="blue" size="small">{{ record.region }}</a-tag>
            </template>
            <template v-if="column.key === 'recruitment_count'">
              <span class="count-cell">{{ record.recruitment_count }}</span>
            </template>
            <template v-if="column.key === 'percentage'">
              <span class="percentage-cell">{{ record.percentage }}%</span>
            </template>
          </template>
        </a-table>
      </div>

      <!-- 学校类型分布图 -->
      <div class="chart-wrapper">
        <div class="chart-header">
          <h5>学校类型分布</h5>
        </div>
        <div ref="schoolTypeChartRef" class="chart-container large"></div>
      </div>
    </div>

    <!-- 洞察建议 -->
    <div class="insights-section" v-if="data?.insights?.length">
      <div class="insights-header">
        <bulb-outlined class="insights-icon" />
        <span class="insights-title">数据洞察</span>
      </div>
      <div class="insights-list">
        <div
          v-for="(insight, index) in data.insights"
          :key="index"
          class="insight-item"
        >
          <check-circle-outlined class="insight-bullet" />
          <span class="insight-text">{{ insight }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  BarChartOutlined,
  TeamOutlined,
  TrophyOutlined,
  GlobalOutlined,
  RiseOutlined,
  BulbOutlined,
  CheckCircleOutlined
} from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import type { AnalyticsResponse } from '@/api/recruitment'

// Props
interface Props {
  data: AnalyticsResponse | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits(['drill-down', 'school-detail'])

// 响应式数据 - 简化版本
const currentPage = ref(1)
const unitCurrentPage = ref(1)

// 图表引用
const schoolTypeChartRef = ref<HTMLDivElement>()
const regionChartRef = ref<HTMLDivElement>()

// 图表实例
let schoolTypeChart: echarts.ECharts | null = null
let regionChart: echarts.ECharts | null = null

// 计算属性 - 适配新的后端数据结构
const keySchoolCount = computed(() => {
  // 使用新的university_level_distribution数据结构
  const levelDist = (props.data?.analytics as any)?.university_level_distribution || {}
  
  let keyCount = 0
  // 统计重点学校（985、211、双一流）
  keyCount += levelDist['985工程'] || 0
  keyCount += levelDist['211工程'] || 0
  keyCount += levelDist['双一流'] || 0
  
  return keyCount
})



// 覆盖二级单位数量 - 使用新的unit_statistics数据
const secondaryUnitsCount = computed(() => {
  console.log('🔍 DataAnalytics - Computing secondaryUnitsCount')
  console.log('🔍 props.data:', props.data)
  console.log('🔍 props.data.analytics:', (props.data?.analytics as any))
  console.log('🔍 analytics keys:', Object.keys((props.data?.analytics as any) || {}))
  console.log('🔍 unit_statistics:', (props.data?.analytics as any)?.unit_statistics)
  
  // 优先使用新的unit_statistics.covered_units字段
  if ((props.data?.analytics as any)?.unit_statistics?.covered_units !== undefined) {
    const count = (props.data?.analytics as any).unit_statistics.covered_units
    console.log('✅ Using covered_units:', count)
    return count
  }
  
  // 如果有unit_statistics.units数据，统计有效单位数量
  if ((props.data?.analytics as any)?.unit_statistics?.units) {
    const units = (props.data?.analytics as any).unit_statistics.units
    console.log('📊 units array:', units)
    // 过滤掉录取人数为0的单位
    const validUnits = units.filter((unit: any) => (unit.recruitment_count || 0) > 0)
    console.log('✅ Using units count:', validUnits.length)
    return validUnits.length
  }
  
  // 兼容旧的company_distribution数据
  const companyDist = (props.data?.analytics as any)?.company_distribution || []
  
  if (Array.isArray(companyDist)) {
    return companyDist.length
  } else if (typeof companyDist === 'object') {
    return Object.keys(companyDist).length
  }
  
  return (props.data?.analytics as any)?.total_count > 0 ? 1 : 0
})

// 新增：男女比例
const genderRatio = computed(() => {
  const genderDist = props.data?.analytics?.gender_distribution
  if (!genderDist) return '暂无数据'
  
  const male = genderDist['男'] || genderDist.male || 0
  const female = genderDist['女'] || genderDist.female || 0
  
  if (male === 0 && female === 0) return '暂无数据'
  if (female === 0) return '全男'
  if (male === 0) return '全女'
  
  const ratio = Math.round(male / female * 10) / 10
  return `${ratio}:1`
})

// 二级单位图表标题
const regionChartTitle = computed(() => {
  if (!(props.data?.analytics as any)?.unit_statistics?.units) return '二级单位分布'
  
  const units = (props.data?.analytics as any).unit_statistics.units
  const provinceLevelKeywords = ['山东', '江苏', '浙江', '河南', '四川', '湖北', '福建', '安徽', '湖南', '陕西', '江西', '辽宁', '黑龙江', '新疆', '甘肃', '河北', '山西', '重庆', '青海', '吉林', '宁夏', '上海', '北京', '天津', '西藏']
  
  // 检查是否有更细分的单位（如具体的分公司、研究院等）
  const hasSubUnits = units.some((unit: any) => {
    const unitName = unit.unit_name || ''
    // 如果是省份名称，不算细分单位
    if (provinceLevelKeywords.includes(unitName)) return false
    // 如果包含具体的组织机构关键词，算作细分单位
    return unitName.includes('电力科学研究院') || unitName.includes('经济技术研究院') || 
           unitName.includes('分公司') || unitName.includes('分部') ||
           unitName.includes('产业集团') || unitName.includes('客服中心') ||
           unitName.includes('特高压') || unitName.includes('技术学院')
  })
  
  // 如果有更细分的单位，显示为"下属单位分布"；否则显示为"二级单位分布"
  return hasSubUnits ? '下属单位分布' : '二级单位分布'
})

// 学校表格配置 - 添加排序功能
const schoolTableColumns = [
  {
    title: '学校名称',
    dataIndex: 'school_name',
    key: 'school_name',
    width: 200,
    ellipsis: true,
    sorter: (a: any, b: any) => a.school_name.localeCompare(b.school_name, 'zh-CN'),
    showSorterTooltip: false
  },
  {
    title: '学校类型',
    dataIndex: 'school_type',
    key: 'school_type',
    width: 80,
    align: 'center' as const
  },
  {
    title: '学校层次',
    dataIndex: 'school_level',
    key: 'school_level',
    width: 90,
    align: 'center' as const
  },
  {
    title: '录取人数',
    dataIndex: 'recruitment_count',
    key: 'recruitment_count',
    width: 80,
    align: 'center' as const,
    sorter: (a: any, b: any) => a.recruitment_count - b.recruitment_count,
    showSorterTooltip: false,
    defaultSortOrder: 'descend' as const
  },
  {
    title: '占比',
    dataIndex: 'percentage',
    key: 'percentage',
    width: 80,
    align: 'center' as const,
    sorter: (a: any, b: any) => parseFloat(a.percentage) - parseFloat(b.percentage),
    showSorterTooltip: false
  }
]

// 单位表格列配置
const unitTableColumns = [
  {
    title: '单位名称',
    dataIndex: 'unit_name',
    key: 'unit_name',
    width: 200,
    ellipsis: true,
    sorter: (a: any, b: any) => a.unit_name.localeCompare(b.unit_name, 'zh-CN'),
    showSorterTooltip: false
  },
  {
    title: '地区',
    dataIndex: 'region',
    key: 'region',
    width: 120,
    align: 'center' as const
  },
  {
    title: '录取人数',
    dataIndex: 'recruitment_count',
    key: 'recruitment_count',
    width: 80,
    align: 'center' as const,
    sorter: (a: any, b: any) => a.recruitment_count - b.recruitment_count,
    showSorterTooltip: false,
    defaultSortOrder: 'descend' as const
  },
  {
    title: '占比',
    dataIndex: 'percentage',
    key: 'percentage',
    width: 70,
    align: 'center' as const,
    sorter: (a: any, b: any) => a.percentage - b.percentage,
    showSorterTooltip: false
  }
]

// 学校统计表格数据 - 使用后端返回的school_statistics数据
const schoolTableData = computed(() => {
  // 直接使用后端的school_statistics.schools数据
  const schoolStats = (props.data?.analytics as any)?.school_statistics?.schools || []
  
  if (schoolStats.length === 0) return []
  
  // 转换为表格数据格式，不需要在computed中排序，由Ant Design表格组件处理排序
  return schoolStats.map((school: any) => ({
    school_name: school.school_name,
    school_type: school.school_type,
    school_level: school.school_level,
    recruitment_count: school.recruitment_count,
    percentage: school.percentage?.toFixed(1) || '0.0'
  }))
})

// 单位统计表格数据 - 使用后端返回的unit_statistics数据
const unitTableData = computed(() => {
  // 直接使用后端的unit_statistics.units数据
  const unitStats = (props.data?.analytics as any)?.unit_statistics?.units || []
  
  if (unitStats.length === 0) return []
  
  // 转换为表格数据格式
  return unitStats
    .filter((unit: any) => (unit.recruitment_count || 0) > 0)
    .map((unit: any) => ({
      unit_name: unit.unit_name || '未知',
      region: unit.region || '未知',
      recruitment_count: unit.recruitment_count || 0,
      percentage: (unit.percentage || 0).toFixed(1)
    }))
})

// 学校表格相关方法
const handlePageChange = (page: number) => {
  currentPage.value = page
  // 调用接口获取对应页面的数据
  loadSchoolData()
}

// 单位表格相关方法
const handleUnitPageChange = (page: number) => {
  unitCurrentPage.value = page
}

// 移除手动排序处理，由Ant Design表格组件自动处理排序



// 加载学校数据的方法 (需要集成到后端API调用)
const loadSchoolData = async () => {
  // TODO: 调用 /api/v1/analytics/schools 接口
  // 根据 currentPage 等参数获取数据，排序由表格组件处理
  console.log('加载学校数据', { page: currentPage.value })
}

// 工具方法：获取学校层次颜色
const getSchoolLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '985工程': 'red',
    '211工程': 'orange', 
    '双一流': 'gold',
    '重点大学': 'blue',
    '普通本科': 'green',
    '专科院校': 'cyan',
    '其他': 'default'
  }
  return colorMap[level] || 'default'
}

// 方法
const getSchoolTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    '985': 'red',
    '211': 'blue',
    '双一流': 'green',
    '普通本科': 'orange',
    '其他': 'default'
  }
  return colorMap[type] || 'default'
}

const initSchoolTypeChart = () => {
  if (!schoolTypeChartRef.value || !props.data) return
  
  // 如果已存在实例，先销毁
  if (schoolTypeChart) {
    schoolTypeChart.dispose()
  }
  schoolTypeChart = echarts.init(schoolTypeChartRef.value)
  
  let data: Array<{name: string, value: number}> = []
  
  // 多种数据源尝试，确保兼容不同的数据结构
  const analytics = props.data.analytics as any
  const levelDist = analytics?.university_level_distribution || 
                   analytics?.school_type_distribution || 
                   analytics?.school_statistics?.distribution || 
                   {}
  
  if (Object.keys(levelDist).length > 0) {
    data = Object.entries(levelDist).map(([level, count]) => ({
      name: level,
      value: count as number
    })).filter(item => item.value > 0)
  } else {
    // 如果没有分布数据，尝试从school_statistics的schools数据中构建分布
    const schools = analytics?.school_statistics?.schools || []
    if (schools.length > 0) {
      const distribution: Record<string, number> = {}
      schools.forEach((school: any) => {
        const level = school.school_level || school.school_type || '其他'
        distribution[level] = (distribution[level] || 0) + (school.recruitment_count || 0)
      })
      data = Object.entries(distribution).map(([level, count]) => ({
        name: level,
        value: count as number
      })).filter(item => item.value > 0)
    }
  }
  
  if (data.length === 0) return
  
  // 不在标签中添加百分比，保持简洁
  const dataWithPercentage = data

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '5%',
      textStyle: {
        fontSize: 12
      }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: dataWithPercentage,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        borderRadius: 5
      }
    }]
  }
  
  schoolTypeChart.setOption(option)
  
  // 点击事件
  schoolTypeChart.on('click', (params) => {
    emit('drill-down', {
      type: 'school_type',
      value: params.name,
      data: params.data
    })
  })
}

const initRegionChart = () => {
  console.log('🔍 DataAnalytics - initRegionChart called')
  console.log('🔍 regionChartRef.value:', regionChartRef.value)
  console.log('🔍 props.data:', props.data)
  
  if (!regionChartRef.value || !props.data) return
  
  // 如果已存在实例，先销毁
  if (regionChart) {
    regionChart.dispose()
  }
  regionChart = echarts.init(regionChartRef.value)
  
  // 优先使用新的unit_statistics数据构建单位分布
  let data: Array<{name: string, value: number, region?: string, percentage?: number}> = []
  
  console.log('📊 unit_statistics data:', (props.data.analytics as any)?.unit_statistics)
  
  if ((props.data.analytics as any)?.unit_statistics?.units) {
    // 使用新的unit_statistics.units数据
    const units = (props.data.analytics as any).unit_statistics.units
    console.log('📊 Processing units:', units)
    
    // 直接使用所有有效的单位数据（包括省份作为二级单位）
    data = units
      .filter((unit: any) => (unit.recruitment_count || 0) > 0)
      .map((unit: any) => ({
        name: unit.unit_name || '未知',
        value: unit.recruitment_count || 0,
        region: unit.region || '未知',
        percentage: unit.percentage || 0
      }))
    
    console.log('📊 Final chart data:', data)
  } else {
    // 兼容旧的company_distribution数据
    const companyDist = (props.data.analytics as any)?.company_distribution || []
    
    if (Array.isArray(companyDist)) {
      data = companyDist.map((item: any) => ({
        name: item.company || item.name || '未知',
        value: item.count || item.value || 0
      }))
    } else if (typeof companyDist === 'object') {
      data = Object.entries(companyDist).map(([company, count]) => ({
        name: company,
        value: count as number
      }))
    }
  }
  
  // 排序并取前10名
  data = data
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 10)
  
  // 如果没有数据，显示当前查询的公司总数
  if (data.length === 0) {
    const total = (props.data.analytics as any)?.total_count || 0
    if (total > 0) {
      data = [{ name: '国网', value: total }]
    }
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        if (params && params.length > 0) {
          const dataItem = data[params[0].dataIndex]
          if (dataItem.region && dataItem.percentage && dataItem.region !== '未知') {
            return `${dataItem.name}<br/>地区: ${dataItem.region}<br/>录取人数: ${dataItem.value}人<br/>占比: ${dataItem.percentage.toFixed(2)}%`
          }
        }
        return params[0].name + '<br/>录取人数: ' + params[0].value + '人'
      }
    },
    grid: {
      top: 20,
      left: 10,
      right: 10,
      bottom: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisLabel: {
        rotate: 45,
        fontSize: 11,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 10
      }
    },
    series: [{
      type: 'bar',
      data: data.map(item => item.value),
      itemStyle: {
        color: '#1890ff',
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          color: '#40a9ff'
        }
      }
    }]
  }
  
  regionChart.setOption(option)
  
  // 点击事件 - 省份就是二级单位，所以统一使用unit类型
  regionChart.on('click', (params) => {
    emit('drill-down', {
      type: 'unit',
      value: params.name,
      data: params.data
    })
  })
}


const resizeCharts = () => {
  schoolTypeChart?.resize()
  regionChart?.resize()
}

// 监听数据变化
watch(() => props.data, () => {
  if (props.data && !props.loading) {
    nextTick(() => {
      initSchoolTypeChart()
      initRegionChart()
    })
  }
})

// 生命周期
onMounted(() => {
  if (props.data && !props.loading) {
    nextTick(() => {
      initSchoolTypeChart()
      initRegionChart()
    })
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', resizeCharts)
})

// 组件销毁时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  schoolTypeChart?.dispose()
  regionChart?.dispose()
  window.removeEventListener('resize', resizeCharts)
})
</script>

<style scoped lang="less">
.data-analytics {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

// 头部 - 紧凑样式
.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    
    .title-icon {
      color: #1890ff;
      font-size: 14px;
    }
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    
    .header-title {
      font-size: 13px;
      gap: 4px;
    }
  }
}

// 加载状态
.loading-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  
  .loading-placeholder {
    width: 100%;
    height: 300px;
  }
}

// 分析内容 - 紧凑版本
.analytics-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  
  &.compact {
    padding: 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 指标网格 - 紧凑版本
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  
  &.compact {
    gap: 6px;
    margin-bottom: 6px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    
    &.compact {
      gap: 4px;
    }
  }
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #d6f4ff;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(24, 144, 255, 0.15);
  }
  
  .metric-icon {
    width: 28px;
    height: 28px;
    background: #1890ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    flex-shrink: 0;
  }
  
  .metric-info {
    flex: 1;
    min-width: 0;
    
    .metric-value {
      font-size: 16px;
      font-weight: 600;
      color: #1890ff;
      line-height: 1.2;
    }
    
    .metric-label {
      font-size: 11px;
      color: #666;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  @media (max-width: 768px) {
    padding: 8px;
    gap: 6px;
    
    .metric-icon {
      width: 24px;
      height: 24px;
      font-size: 12px;
    }
    
    .metric-info {
      .metric-value {
        font-size: 14px;
      }
      
      .metric-label {
        font-size: 10px;
      }
    }
  }
}

// 图表容器
.charts-container {
  display: grid;
  gap: 16px;
  
  // 紧凑版本 - 左右排列
  &.compact {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 6px;
    }
  }
  
  // 垂直版本 - 上下排列
  &.vertical {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.chart-wrapper {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  
  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  h5 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: #333;
  }
  
  .help-icon {
    color: #8c8c8c;
    cursor: help;
    font-size: 12px;
  }
}

.chart-container {
  height: 200px;
  
  &.compact {
    height: 120px;
  }
  
  &.large {
    height: 400px;
  }
  
  @media (max-width: 768px) {
    height: 150px;
    
    &.compact {
      height: 100px;
    }
  }
}

// 统计表格
.stats-table {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  .count-cell {
    font-weight: 600;
    color: #1890ff;
  }
  
  .percentage-cell {
    font-weight: 500;
    color: #52c41a;
  }
}

// 趋势和对比容器
.trend-container,
.comparison-container {
  .trend-chart-wrapper,
  .comparison-chart-wrapper {
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 16px;
  }
}

// 洞察建议
.insights-section {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #f6ffed 0%, #fcffe6 100%);
  border: 1px solid #d9f7be;
  border-radius: 8px;
  
  .insights-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .insights-icon {
      color: #faad14;
      font-size: 16px;
    }
    
    .insights-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .insights-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #666;
      
      .insight-bullet {
        color: #52c41a;
        font-size: 12px;
        margin-top: 2px;
        flex-shrink: 0;
      }
      
      .insight-text {
        flex: 1;
        line-height: 1.4;
      }
    }
  }
}

// 学校表格样式
.schools-table-section,
.units-table-section {
  margin-top: 12px;
  
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    
    h5 {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      color: #333;
    }
    
    .table-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .sort-tip {
        font-size: 11px;
        color: #666;
        font-style: italic;
      }
    }
  }
  
  :deep(.ant-table) {
    .clickable-row {
      cursor: pointer;
      
      &:hover {
        background-color: #f5f5f5;
      }
    }
    
    .ant-table-tbody > tr > td {
      padding: 4px 8px;
      font-size: 12px;
    }
    
    .ant-table-thead > tr > th {
      padding: 6px 8px;
      font-size: 12px;
      font-weight: 600;
      background: #fafafa;
      
      &.ant-table-column-has-sorters {
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background: #e6f7ff;
          color: #1890ff;
        }
      }
      
      .ant-table-column-sorters {
        padding: 0;
      }
      
      .ant-table-column-sorter {
        color: #bfbfbf;
        
        &.ant-table-column-sorter-up.active,
        &.ant-table-column-sorter-down.active {
          color: #1890ff;
        }
      }
    }
    
    .school-name-cell {
      font-weight: 500;
      color: #1890ff;
      
      &:hover {
        color: #40a9ff;
        text-decoration: underline;
      }
    }
    
    .unit-name-cell {
      font-weight: 500;
      color: #1890ff;
    }
    
    .count-cell {
      font-weight: 600;
      color: #333;
    }
    
    .percentage-cell {
      color: #666;
      font-size: 11px;
    }
    
    .ant-tag {
      margin: 0;
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 3px;
      line-height: 1.2;
    }
    
    .ant-btn-link {
      padding: 0;
      height: auto;
      font-size: 11px;
      color: #1890ff;
    }
  }
  
  :deep(.ant-pagination) {
    margin-top: 8px;
    text-align: center;
    
    .ant-pagination-item,
    .ant-pagination-prev,
    .ant-pagination-next {
      min-width: 24px;
      height: 24px;
      line-height: 22px;
      font-size: 12px;
    }
    
    .ant-pagination-total-text {
      font-size: 11px;
      color: #666;
    }
    
    .ant-pagination-options {
      .ant-pagination-options-quick-jumper {
        font-size: 12px;
        
        input {
          width: 40px;
          height: 24px;
          padding: 2px 4px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>