<template>
  <div class="follow-up-analytics">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <bar-chart-outlined class="title-icon" />
            跟进分析
          </h1>
          <p class="page-description">深度分析跟进数据，优化跟进策略</p>
        </div>
        <div class="header-actions">
          <a-range-picker 
            v-model:value="dateRange" 
            @change="onDateRangeChange"
            :presets="datePresets"
            format="YYYY-MM-DD"
            class="date-picker"
          />
          <a-button @click="loadAllData" :loading="loading" type="primary">
            <reload-outlined />
            刷新数据
          </a-button>
        </div>
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="metrics-section">
      <a-row :gutter="16">
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="metric-card" hoverable>
            <a-statistic
              title="总跟进次数"
              :value="statisticsData?.week_count || 0"
              :prefix="h(MessageOutlined)"
              :value-style="{ color: '#1890ff' }"
            />
            <div class="metric-trend">
              <arrow-up-outlined v-if="weekGrowth >= 0" class="trend-up" />
              <arrow-down-outlined v-else class="trend-down" />
              <span :class="weekGrowth >= 0 ? 'trend-up' : 'trend-down'">
                {{ Math.abs(weekGrowth) }}%
              </span>
              <span class="trend-label">较上周</span>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="metric-card" hoverable>
            <a-statistic
              title="转化率"
              :value="statisticsData?.conversion_rate || 0"
              suffix="%"
              :precision="1"
              :prefix="h(RiseOutlined)"
              :value-style="{ color: '#52c41a' }"
            />
            <div class="metric-trend">
              <arrow-up-outlined class="trend-up" />
              <span class="trend-up">2.3%</span>
              <span class="trend-label">较上周</span>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="metric-card" hoverable>
            <a-statistic
              title="平均响应时间"
              :value="averageResponseTime"
              suffix="小时"
              :prefix="h(ClockCircleOutlined)"
              :value-style="{ color: '#fa8c16' }"
            />
            <div class="metric-trend">
              <arrow-down-outlined class="trend-up" />
              <span class="trend-up">15%</span>
              <span class="trend-label">较上周</span>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :sm="12" :lg="6">
          <a-card class="metric-card" hoverable>
            <a-statistic
              title="活跃客户数"
              :value="statisticsData?.total_customers || 0"
              :prefix="h(UserOutlined)"
              :value-style="{ color: '#722ed1' }"
            />
            <div class="metric-trend">
              <arrow-up-outlined class="trend-up" />
              <span class="trend-up">8.1%</span>
              <span class="trend-label">较上周</span>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <a-row :gutter="16">
        <!-- 跟进趋势图 -->
        <a-col :xs="24" :lg="12">
          <a-card title="跟进趋势" class="chart-card" :loading="loading">
            <template #extra>
              <a-radio-group v-model:value="trendPeriod" size="small" @change="loadTrendData">
                <a-radio-button value="week">周</a-radio-button>
                <a-radio-button value="month">月</a-radio-button>
              </a-radio-group>
            </template>
            <div ref="trendChartRef" class="chart-container"></div>
          </a-card>
        </a-col>

        <!-- 跟进方式分布 -->
        <a-col :xs="24" :lg="12">
          <a-card title="跟进方式分布" class="chart-card" :loading="loading">
            <div ref="typeChartRef" class="chart-container"></div>
          </a-card>
        </a-col>

        <!-- 跟进结果分析 -->
        <a-col :xs="24" :lg="12">
          <a-card title="跟进结果分析" class="chart-card" :loading="loading">
            <div ref="resultChartRef" class="chart-container"></div>
          </a-card>
        </a-col>

        <!-- 客户状态流转 -->
        <a-col :xs="24" :lg="12">
          <a-card title="客户状态流转" class="chart-card" :loading="loading">
            <div ref="statusChartRef" class="chart-container"></div>
          </a-card>
        </a-col>

        <!-- 跟进效率分析 -->
        <a-col :xs="24">
          <a-card title="跟进效率分析" class="chart-card" :loading="loading">
            <template #extra>
              <a-space>
                <a-select v-model:value="efficiencyMetric" size="small" style="width: 120px">
                  <a-select-option value="response_time">响应时间</a-select-option>
                  <a-select-option value="follow_frequency">跟进频次</a-select-option>
                  <a-select-option value="conversion_rate">转化率</a-select-option>
                </a-select>
                <a-button size="small" @click="exportReport">
                  <download-outlined />
                  导出报告
                </a-button>
              </a-space>
            </template>
            <div ref="efficiencyChartRef" class="chart-container-large"></div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 数据表格 -->
    <div class="data-section">
      <a-card title="详细数据" class="data-card">
        <template #extra>
          <a-button @click="exportData" size="small">
            <export-outlined />
            导出数据
          </a-button>
        </template>
        
        <a-tabs v-model:activeKey="activeDataTab" class="data-tabs">
          <a-tab-pane key="summary" tab="汇总数据">
            <a-table
              :columns="summaryColumns"
              :data-source="summaryData"
              :loading="loading"
              size="small"
              :pagination="false"
            />
          </a-tab-pane>
          
          <a-tab-pane key="detail" tab="明细数据">
            <a-table
              :columns="detailColumns"
              :data-source="detailData"
              :loading="loading"
              size="small"
              :scroll="{ x: 800 }"
              :pagination="{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                onChange: handleTableChange
              }"
            />
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, h, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  BarChartOutlined,
  ReloadOutlined,
  MessageOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DownloadOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import * as echarts from 'echarts'
import {
  getFollowUpStatistics,
  type FollowUpStatistics
} from '@/api/follow-up'

// 响应式数据
const loading = ref(false)
const statisticsData = ref<FollowUpStatistics | null>(null)
const dateRange = ref<[Dayjs, Dayjs]>([
  dayjs().subtract(7, 'day'),
  dayjs()
])
const trendPeriod = ref('week')
const efficiencyMetric = ref('response_time')
const activeDataTab = ref('summary')

// 图表引用
const trendChartRef = ref()
const typeChartRef = ref()
const resultChartRef = ref()
const statusChartRef = ref()
const efficiencyChartRef = ref()

// 图表实例
let trendChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null
let resultChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let efficiencyChart: echarts.ECharts | null = null

// 日期预设
const datePresets = [
  { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
  { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
  { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
  { label: '上月', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 数据表格
interface SummaryData {
  key: string
  metric: string
  thisWeek: string
  lastWeek: string
  growth: string
  ratio: string
}

interface DetailData {
  key: string
  date: string
  count: number
  customers: number
  deals: number
  rate: string
  responseTime: string
}

const summaryData = ref<SummaryData[]>([])
const detailData = ref<DetailData[]>([])

// 计算属性
const weekGrowth = computed(() => {
  // 模拟数据
  return 12.5
})

const averageResponseTime = computed(() => {
  // 模拟数据
  return 2.4
})

// 汇总数据列配置
const summaryColumns = [
  { title: '指标', dataIndex: 'metric', key: 'metric' },
  { title: '本周', dataIndex: 'thisWeek', key: 'thisWeek' },
  { title: '上周', dataIndex: 'lastWeek', key: 'lastWeek' },
  { title: '增长率', dataIndex: 'growth', key: 'growth' },
  { title: '环比', dataIndex: 'ratio', key: 'ratio' }
]

// 明细数据列配置
const detailColumns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
  { title: '跟进次数', dataIndex: 'count', key: 'count', width: 100 },
  { title: '客户数', dataIndex: 'customers', key: 'customers', width: 100 },
  { title: '成交数', dataIndex: 'deals', key: 'deals', width: 100 },
  { title: '转化率', dataIndex: 'rate', key: 'rate', width: 100 },
  { title: '平均响应时间', dataIndex: 'responseTime', key: 'responseTime', width: 120 }
]

// 日期范围变化
const onDateRangeChange = (dates: [string, string] | [Dayjs, Dayjs] | null) => {
  if (dates) {
    dateRange.value = dates as [Dayjs, Dayjs]
    loadAllData()
  }
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStatistics(),
      loadTrendData(),
      loadTypeData(),
      loadResultData(),
      loadStatusData(),
      loadEfficiencyData(),
      loadTableData()
    ])
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const response = await getFollowUpStatistics()
    statisticsData.value = response.data as unknown as FollowUpStatistics
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载趋势数据
const loadTrendData = async () => {
  await nextTick()
  if (!trendChartRef.value) return
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  
  // 模拟数据
  const dates = []
  const values = []
  for (let i = 6; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
    values.push(Math.floor(Math.random() * 50) + 20)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: { color: '#333' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '跟进次数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        color: '#1890ff',
        width: 3
      },
      itemStyle: {
        color: '#1890ff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ]
        }
      },
      data: values
    }]
  }
  
  trendChart.setOption(option)
}

// 加载跟进方式数据
const loadTypeData = async () => {
  await nextTick()
  if (!typeChartRef.value) return
  
  if (!typeChart) {
    typeChart = echarts.init(typeChartRef.value)
  }
  
  const data = statisticsData.value?.type_statistics || [
    { type: 'phone', count: 25 },
    { type: 'wechat', count: 15 },
    { type: 'meeting', count: 8 },
    { type: 'email', count: 5 },
    { type: 'other', count: 3 }
  ]
  
  const typeMap: Record<string, string> = {
    phone: '电话',
    wechat: '微信',
    meeting: '面谈',
    email: '邮件',
    other: '其他'
  }
  
  const chartData = data.map(item => ({
    name: typeMap[item.type] || item.type,
    value: item.count
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '0',
      left: 'center'
    },
    series: [{
      name: '跟进方式',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: chartData
    }]
  }
  
  typeChart.setOption(option)
}

// 加载跟进结果数据
const loadResultData = async () => {
  await nextTick()
  if (!resultChartRef.value) return
  
  if (!resultChart) {
    resultChart = echarts.init(resultChartRef.value)
  }
  
  const data = statisticsData.value?.result_statistics || [
    { result: 'interested', count: 20 },
    { result: 'not_interested', count: 10 },
    { result: 'deal', count: 5 },
    { result: 'no_answer', count: 13 },
    { result: 'reschedule', count: 8 }
  ]
  
  const resultMap: Record<string, string> = {
    interested: '有意向',
    not_interested: '无意向',
    deal: '成交',
    no_answer: '未接听',
    reschedule: '改期'
  }
  
  const categories = data.map(item => resultMap[item.result] || item.result)
  const values = data.map(item => item.count)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '跟进结果',
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2378f7' },
            { offset: 0.7, color: '#2378f7' },
            { offset: 1, color: '#83bff6' }
          ])
        }
      },
      data: values
    }]
  }
  
  resultChart.setOption(option)
}

// 加载状态流转数据
const loadStatusData = async () => {
  await nextTick()
  if (!statusChartRef.value) return
  
  if (!statusChart) {
    statusChart = echarts.init(statusChartRef.value)
  }
  
  // 桑基图数据
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: {
      type: 'sankey',
      data: [
        { name: '潜在客户' },
        { name: '跟进中' },
        { name: '已成交' },
        { name: '已流失' }
      ],
      links: [
        { source: '潜在客户', target: '跟进中', value: 30 },
        { source: '跟进中', target: '已成交', value: 15 },
        { source: '跟进中', target: '已流失', value: 8 },
        { source: '潜在客户', target: '已流失', value: 5 }
      ],
      emphasis: {
        focus: 'adjacency'
      },
      lineStyle: {
        color: 'gradient',
        curveness: 0.5
      }
    }
  }
  
  statusChart.setOption(option)
}

// 加载效率数据
const loadEfficiencyData = async () => {
  await nextTick()
  if (!efficiencyChartRef.value) return
  
  if (!efficiencyChart) {
    efficiencyChart = echarts.init(efficiencyChartRef.value)
  }
  
  // 模拟数据
  const dates = []
  const responseTime = []
  const followFreq = []
  const conversionRate = []
  
  for (let i = 29; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
    responseTime.push((Math.random() * 5 + 1).toFixed(1))
    followFreq.push(Math.floor(Math.random() * 10) + 5)
    conversionRate.push((Math.random() * 20 + 5).toFixed(1))
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['平均响应时间(小时)', '跟进频次(次)', '转化率(%)']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '响应时间(h)',
        position: 'left',
        alignTicks: true,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#5470c6'
          }
        }
      },
      {
        type: 'value',
        name: '频次/转化率',
        position: 'right',
        alignTicks: true,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#91cc75'
          }
        }
      }
    ],
    series: [
      {
        name: '平均响应时间(小时)',
        type: 'line',
        yAxisIndex: 0,
        data: responseTime,
        smooth: true
      },
      {
        name: '跟进频次(次)',
        type: 'line',
        yAxisIndex: 1,
        data: followFreq,
        smooth: true
      },
      {
        name: '转化率(%)',
        type: 'line',
        yAxisIndex: 1,
        data: conversionRate,
        smooth: true
      }
    ]
  }
  
  efficiencyChart.setOption(option)
}

// 加载表格数据
const loadTableData = async () => {
  // 生成汇总数据
  summaryData.value = [
    {
      key: '1',
      metric: '跟进次数',
      thisWeek: '158',
      lastWeek: '142',
      growth: '+11.3%',
      ratio: '↗'
    },
    {
      key: '2',
      metric: '客户数',
      thisWeek: '89',
      lastWeek: '82',
      growth: '+8.5%',
      ratio: '↗'
    },
    {
      key: '3',
      metric: '成交数',
      thisWeek: '12',
      lastWeek: '9',
      growth: '+33.3%',
      ratio: '↗'
    },
    {
      key: '4',
      metric: '转化率',
      thisWeek: '13.5%',
      lastWeek: '11.0%',
      growth: '+2.5%',
      ratio: '↗'
    }
  ]
  
  // 生成明细数据
  const details = []
  for (let i = 6; i >= 0; i--) {
    details.push({
      key: i.toString(),
      date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      count: Math.floor(Math.random() * 30) + 10,
      customers: Math.floor(Math.random() * 20) + 5,
      deals: Math.floor(Math.random() * 5) + 1,
      rate: (Math.random() * 20 + 5).toFixed(1) + '%',
      responseTime: (Math.random() * 3 + 1).toFixed(1) + 'h'
    })
  }
  detailData.value = details
  pagination.total = details.length
}

// 表格分页处理
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

// 导出报告
const exportReport = () => {
  message.success('报告导出功能开发中')
}

// 导出数据
const exportData = () => {
  message.success('数据导出功能开发中')
}

// 窗口大小调整
const handleResize = () => {
  trendChart?.resize()
  typeChart?.resize()
  resultChart?.resize()
  statusChart?.resize()
  efficiencyChart?.resize()
}

// 初始化
onMounted(() => {
  loadAllData()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  typeChart?.dispose()
  resultChart?.dispose()
  statusChart?.dispose()
  efficiencyChart?.dispose()
})
</script>

<style scoped lang="less">
.follow-up-analytics {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

// 页面头部
.page-header {
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    background: linear-gradient(135deg, #722ed1 0%, #9254de 100%);
    border-radius: var(--border-radius-base);
    color: white;
    
    @media (max-width: 768px) {
      padding: 16px;
      flex-direction: column;
      gap: 16px;
    }
  }
  
  .page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
  
  .title-icon {
    font-size: 28px;
    
    @media (max-width: 768px) {
      font-size: 24px;
    }
  }
  
  .page-description {
    margin: 4px 0 0 0;
    opacity: 0.9;
    font-size: 14px;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    
    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-between;
    }
    
    .date-picker {
      :deep(.ant-picker) {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.1);
        color: white;
        
        .ant-picker-input input {
          color: white;
          
          &::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }
        }
        
        .ant-picker-suffix {
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }
  }
}

// 指标卡片
.metrics-section {
  .metric-card {
    transition: var(--transition-base);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
    }
    
    :deep(.ant-card-body) {
      padding: 20px;
      
      @media (max-width: 768px) {
        padding: 16px;
      }
    }
    
    :deep(.ant-statistic-title) {
      font-size: 14px;
      margin-bottom: 8px;
      color: #666;
    }
    
    :deep(.ant-statistic-content) {
      .ant-statistic-content-value {
        font-size: 28px;
        font-weight: 600;
        
        @media (max-width: 768px) {
          font-size: 24px;
        }
      }
      
      .ant-statistic-content-prefix {
        margin-right: 8px;
        font-size: 20px;
        
        @media (max-width: 768px) {
          font-size: 18px;
        }
      }
    }
  }
  
  .metric-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-size: 12px;
    
    .trend-up {
      color: #52c41a;
    }
    
    .trend-down {
      color: #ff4d4f;
    }
    
    .trend-label {
      color: #8c8c8c;
    }
  }
}

// 图表区域
.charts-section {
  .chart-card {
    height: 400px;
    
    :deep(.ant-card-body) {
      height: calc(100% - 60px);
      display: flex;
      flex-direction: column;
    }
    
    .chart-container {
      flex: 1;
      height: 300px;
      min-height: 250px;
    }
    
    .chart-container-large {
      flex: 1;
      height: 350px;
      min-height: 300px;
    }
  }
}

// 数据表格
.data-section {
  .data-card {
    :deep(.ant-card-body) {
      padding: 24px;
      
      @media (max-width: 768px) {
        padding: 16px;
      }
    }
  }
  
  .data-tabs {
    :deep(.ant-tabs-content-holder) {
      .ant-tabs-content {
        .ant-tabs-tabpane {
          padding-top: 16px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .charts-section {
    .chart-card {
      height: 350px;
      margin-bottom: 16px;
      
      .chart-container {
        height: 250px;
        min-height: 200px;
      }
      
      .chart-container-large {
        height: 280px;
        min-height: 250px;
      }
    }
  }
}
</style>