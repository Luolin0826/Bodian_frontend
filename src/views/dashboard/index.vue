<template>
      <div class="dashboard">
        <!-- 统计卡片 --> 
        <div class="stats-grid">
          <a-card 
            v-for="(stat, index) in statsCards" 
            :key="index"
            :hoverable="true"
            class="stat-card"
          >
            <a-statistic
              :title="stat.title"
              :value="stat.value"
              :prefix="h(stat.icon)"
              :value-style="stat.valueStyle"
              :precision="stat.precision || 0"
            >
              <template v-if="stat.suffix" #suffix>
                <span class="stat-suffix">{{ stat.suffix }}</span>
              </template>
            </a-statistic>
            <div class="stat-trend">
              <span class="trend-value" :class="stat.trend.type">
                <component :is="stat.trend.icon" />
                {{ stat.trend.value }}
              </span>
              <span class="trend-label">{{ stat.trend.label }}</span>
            </div>
          </a-card>
        </div>
    
        <!-- 图表区域 -->
        <div class="charts-section">
          <a-card title="销售趋势" :bordered="false" class="chart-card main-chart" :loading="chartsLoading">
            <template #extra>
              <a-radio-group v-model:value="chartPeriod" size="small" @change="updateSalesTrend">
                <a-radio-button value="7d">7天</a-radio-button>
                <a-radio-button value="30d">30天</a-radio-button>
                <a-radio-button value="3m">3个月</a-radio-button>
              </a-radio-group>
            </template>
            <div ref="salesChartRef" class="chart-container"></div>
          </a-card>
          
          <a-card title="渠道分布" :bordered="false" class="chart-card side-chart" :loading="chartsLoading">
            <template #extra>
              <a-tooltip title="刷新数据">
                <a-button type="text" size="small" :icon="h(ReloadOutlined)" @click="refreshChannelChart" />
              </a-tooltip>
            </template>
            <div ref="channelChartRef" class="chart-container small"></div>
          </a-card>
        </div>
    
        <!-- 快捷操作 -->
        <a-card title="快捷操作" :bordered="false" class="actions-card">
          <div class="quick-actions">
            <div
              v-for="action in quickActions"
              :key="action.key"
              class="quick-action-item"
              @click="handleQuickAction(action.key)"
            >
              <div class="action-icon" :style="{ backgroundColor: action.color + '15', color: action.color }">
                <component :is="action.icon" />
              </div>
              <span class="action-title">{{ action.title }}</span>
            </div>
          </div>
        </a-card>
      </div>
    </template>
    
    <script setup lang="ts">
    import { ref, reactive, computed, h, onMounted, onUnmounted, nextTick } from 'vue'
    import { useRouter } from 'vue-router'
    import * as echarts from 'echarts'
    import dayjs from 'dayjs'
    import {
      UserOutlined,
      PlusCircleOutlined,
      CheckCircleOutlined,
      ArrowUpOutlined,
      ArrowDownOutlined,
      UserAddOutlined,
      FileSearchOutlined,
      FileAddOutlined,
      BarChartOutlined,
      ReloadOutlined
    } from '@ant-design/icons-vue'
    
    const router = useRouter()
    
    // 统计数据
    const stats = reactive({
      totalCustomers: 1256,
      monthlyNew: 128,
      dealCustomers: 89,
      monthlySales: 128900.00
    })
    
    // 图表时间范围
    const chartPeriod = ref('30d')
    
    // 图表相关
    const chartsLoading = ref(false)
    const salesChartRef = ref<HTMLDivElement>()
    const channelChartRef = ref<HTMLDivElement>()
    let salesChart: echarts.ECharts | null = null
    let channelChart: echarts.ECharts | null = null
    
    // 统计卡片数据
    const statsCards = computed(() => [
      {
        title: '总客户数',
        value: stats.totalCustomers,
        icon: UserOutlined,
        suffix: '人',
        valueStyle: { color: '#2c3e50' },
        trend: {
          type: 'increase',
          value: '12%',
          label: '较上月',
          icon: ArrowUpOutlined
        }
      },
      {
        title: '本月新增',
        value: stats.monthlyNew,
        icon: PlusCircleOutlined,
        valueStyle: { color: '#3f8600' },
        trend: {
          type: 'increase',
          value: '8%',
          label: '环比增长',
          icon: ArrowUpOutlined
        }
      },
      {
        title: '成交客户',
        value: stats.dealCustomers,
        icon: CheckCircleOutlined,
        valueStyle: { color: '#52c41a' },
        trend: {
          type: 'increase',
          value: '15%',
          label: '转化率提升',
          icon: ArrowUpOutlined
        }
      },
      {
        title: '本月销售额',
        value: stats.monthlySales,
        icon: BarChartOutlined,
        precision: 2,
        suffix: '元',
        valueStyle: { color: '#1890ff' },
        trend: {
          type: 'decrease',
          value: '5%',
          label: '较上月',
          icon: ArrowDownOutlined
        }
      }
    ])
    
    // 快捷操作
    const quickActions = [
      { key: 'addCustomer', title: '新增客户', icon: UserAddOutlined, color: '#1890ff' },
      { key: 'searchScript', title: '查找话术', icon: FileSearchOutlined, color: '#52c41a' },
      { key: 'addKnowledge', title: '添加知识', icon: FileAddOutlined, color: '#722ed1' },
      { key: 'viewStats', title: '查看统计', icon: BarChartOutlined, color: '#fa8c16' }
    ]
    
    const handleQuickAction = (key: string) => {
      const routes: Record<string, string> = {
        addCustomer: '/customer/list',
        searchScript: '/script',
        addKnowledge: '/knowledge',
        viewStats: '/sales/stats'
      }
      router.push(routes[key])
    }

    // 生成销售趋势演示数据
    const generateSalesData = (period: string) => {
      let days = 30
      let format = 'MM-DD'
      
      if (period === '7d') {
        days = 7
      } else if (period === '3m') {
        days = 90
        format = 'MM-DD'
      }
      
      const dates = []
      const sales = []
      const customers = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day')
        dates.push(date.format(format))
        
        // 生成销售额数据 (波动在 5000-25000 之间)
        const baseSales = 15000
        const variation = (Math.random() - 0.5) * 10000
        sales.push(Math.round(baseSales + variation))
        
        // 生成客户数据 (波动在 3-15 之间)
        const baseCustomers = 8
        const customerVariation = (Math.random() - 0.5) * 6
        customers.push(Math.round(baseCustomers + customerVariation))
      }
      
      return { dates, sales, customers }
    }

    // 生成渠道分布演示数据
    const generateChannelData = () => [
      { name: '抖音', value: 45, color: '#ff6b6b' },
      { name: '小红书', value: 28, color: '#ee5a24' },
      { name: '微信朋友圈', value: 15, color: '#00d2d3' },
      { name: '线下推广', value: 8, color: '#54a0ff' },
      { name: '其他渠道', value: 4, color: '#5f27cd' }
    ]

    // 初始化销售趋势图表
    const initSalesChart = async () => {
      await nextTick()
      console.log('Sales chart ref:', salesChartRef.value)
      if (!salesChartRef.value) {
        console.error('Sales chart DOM element not found!')
        return
      }
      
      if (salesChart) {
        salesChart.dispose()
      }
      
      salesChart = echarts.init(salesChartRef.value)
      console.log('Sales chart instance created:', !!salesChart)
      updateSalesTrend()
    }

    // 更新销售趋势图表
    const updateSalesTrend = () => {
      if (!salesChart) {
        console.error('Sales chart instance not available!')
        return
      }
      
      const { dates, sales, customers } = generateSalesData(chartPeriod.value)
      console.log('Sales chart data:', { dates: dates.length, sales: sales.length, customers: customers.length })
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          }
        },
        legend: {
          data: ['销售额', '新增客户'],
          top: '8%',
          textStyle: {
            color: '#666'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates,
          axisLine: {
            lineStyle: { color: '#e8e8e8' }
          },
          axisLabel: {
            color: '#666'
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '销售额(元)',
            position: 'left',
            axisLine: {
              show: true,
              lineStyle: { color: '#1890ff' }
            },
            axisLabel: {
              color: '#666',
              formatter: '{value}'
            }
          },
          {
            type: 'value',
            name: '客户数',
            position: 'right',
            axisLine: {
              show: true,
              lineStyle: { color: '#52c41a' }
            },
            axisLabel: {
              color: '#666'
            }
          }
        ],
        series: [
          {
            name: '销售额',
            type: 'line',
            yAxisIndex: 0,
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
            data: sales
          },
          {
            name: '新增客户',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              color: '#52c41a',
              width: 3
            },
            itemStyle: {
              color: '#52c41a'
            },
            data: customers
          }
        ]
      }
      
      salesChart.setOption(option)
      console.log('Sales chart option set successfully')
    }

    // 初始化渠道分布图表
    const initChannelChart = async () => {
      await nextTick()
      console.log('Channel chart ref:', channelChartRef.value)
      if (!channelChartRef.value) {
        console.error('Channel chart DOM element not found!')
        return
      }
      
      if (channelChart) {
        channelChart.dispose()
      }
      
      channelChart = echarts.init(channelChartRef.value)
      console.log('Channel chart instance created:', !!channelChart)
      
      const data = generateChannelData()
      console.log('Channel chart data:', data)
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#e8e8e8',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          }
        },
        legend: {
          orient: 'vertical',
          right: '10%',
          top: 'center',
          textStyle: {
            color: '#666',
            fontSize: 12
          }
        },
        series: [
          {
            name: '获客渠道',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            labelLine: {
              show: false
            },
            data: data.map(item => ({
              ...item,
              itemStyle: {
                color: item.color,
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
              }
            }))
          }
        ]
      }
      
      channelChart.setOption(option)
      console.log('Channel chart option set successfully')
    }

    // 刷新渠道图表
    const refreshChannelChart = () => {
      if (channelChart) {
        // 重新生成数据并更新图表
        const data = generateChannelData().map(item => ({
          ...item,
          // 添加一些随机变化
          value: Math.max(1, Math.round(item.value + (Math.random() - 0.5) * 10))
        }))
        
        channelChart.setOption({
          series: [{
            data: data.map(item => ({
              ...item,
              itemStyle: {
                color: item.color,
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
              }
            }))
          }]
        })
      }
    }

    // 窗口大小调整处理
    const handleResize = () => {
      salesChart?.resize()
      channelChart?.resize()
    }
    
    onMounted(() => {
      console.log('Dashboard mounted')
      
      // 不显示loading，直接初始化
      chartsLoading.value = false
      
      // 使用requestAnimationFrame确保DOM完全渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('Attempting to initialize charts')
          console.log('DOM refs available:', {
            sales: !!salesChartRef.value,
            channel: !!channelChartRef.value
          })
          
          if (salesChartRef.value && channelChartRef.value) {
            initSalesChart()
            initChannelChart()
          } else {
            console.error('Chart DOM elements not available')
            // 再试一次
            setTimeout(() => {
              console.log('Retry initializing charts')
              console.log('DOM refs available (retry):', {
                sales: !!salesChartRef.value,
                channel: !!channelChartRef.value
              })
              if (salesChartRef.value && channelChartRef.value) {
                initSalesChart()
                initChannelChart()
              }
            }, 1000)
          }
        })
      })
      
      // 添加窗口大小监听
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      // 清理图表实例
      salesChart?.dispose()
      channelChart?.dispose()
      
      // 移除事件监听
      window.removeEventListener('resize', handleResize)
    })
    </script>
    
    <style scoped lang="less">
    .dashboard {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    // 统计卡片网格
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }
    
    .stat-card {
      transition: var(--transition-base);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
      }
      
      :deep(.ant-card-body) {
        padding: 20px;
        
        @media (max-width: 768px) {
          padding: 16px;
        }
      }
      
      :deep(.ant-statistic-title) {
        font-size: 13px;
        color: #8c8c8c;
        margin-bottom: 4px;
      }
      
      :deep(.ant-statistic-content) {
        .ant-statistic-content-value {
          font-size: 24px;
          font-weight: 600;
          
          @media (max-width: 768px) {
            font-size: 20px;
          }
        }
      }
    }
    
    .stat-suffix {
      font-size: 12px;
      color: #8c8c8c;
    }
    
    .stat-trend {
      margin-top: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .trend-value {
      display: flex;
      align-items: center;
      gap: 2px;
      font-weight: 500;
      
      &.increase {
        color: #52c41a;
      }
      
      &.decrease {
        color: #ff4d4f;
      }
    }
    
    .trend-label {
      color: #8c8c8c;
    }
    
    // 图表区域
    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      flex: 1;
      min-height: 0;
      
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }
    
    .chart-card {
      display: flex;
      flex-direction: column;
      
      :deep(.ant-card-body) {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 20px;
        
        @media (max-width: 768px) {
          padding: 16px;
        }
      }
      
      :deep(.ant-card-head) {
        padding: 0 20px;
        
        @media (max-width: 768px) {
          padding: 0 16px;
        }
        
        .ant-card-head-title {
          font-size: 16px;
          font-weight: 600;
        }
      }
    }
    
    .chart-container {
      flex: 1;
      min-height: 280px;
      
      &.small {
        min-height: 240px;
        
        @media (max-width: 1024px) {
          min-height: 280px;
        }
      }
      
      @media (max-width: 768px) {
        min-height: 220px;
      }
    }
    
    // 快捷操作
    .actions-card {
      :deep(.ant-card-body) {
        padding: 20px;
        
        @media (max-width: 768px) {
          padding: 16px;
        }
      }
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      
      @media (max-width: 480px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .quick-action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      border-radius: var(--border-radius-base);
      cursor: pointer;
      transition: var(--transition-base);
      text-align: center;
      
      &:hover {
        background: #f5f5f5;
        transform: translateY(-2px);
      }
      
      @media (max-width: 768px) {
        padding: 12px 8px;
      }
    }
    
    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 8px;
      transition: var(--transition-base);
      
      @media (max-width: 768px) {
        width: 40px;
        height: 40px;
        font-size: 18px;
      }
    }
    
    .action-title {
      font-size: 13px;
      color: #2c3e50;
      font-weight: 500;
      
      @media (max-width: 768px) {
        font-size: 12px;
      }
    }
    
    // 移动端优化
    @media (max-width: 768px) {
      .dashboard {
        gap: 16px;
      }
      
      :deep(.ant-radio-group) {
        .ant-radio-button-wrapper {
          font-size: 12px;
          padding: 0 8px;
        }
      }
    }
    </style>