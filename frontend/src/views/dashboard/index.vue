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
          <a-card title="销售趋势" :bordered="false" class="chart-card main-chart">
            <template #extra>
              <a-radio-group v-model:value="chartPeriod" size="small">
                <a-radio-button value="7d">7天</a-radio-button>
                <a-radio-button value="30d">30天</a-radio-button>
                <a-radio-button value="3m">3个月</a-radio-button>
              </a-radio-group>
            </template>
            <div class="chart-placeholder">
              <div class="placeholder-content">
                <bar-chart-outlined class="placeholder-icon" />
                <p>图表组件待实现</p>
                <a-button type="primary" size="small">配置图表</a-button>
              </div>
            </div>
          </a-card>
          
          <a-card title="渠道分布" :bordered="false" class="chart-card side-chart">
            <template #extra>
              <a-tooltip title="刷新数据">
                <a-button type="text" size="small" :icon="h(ReloadOutlined)" />
              </a-tooltip>
            </template>
            <div class="chart-placeholder small">
              <div class="placeholder-content">
                <pie-chart-outlined class="placeholder-icon" />
                <p>饼图待实现</p>
              </div>
            </div>
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
    import { ref, reactive, computed, h, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
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
      PieChartOutlined,
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
    
    onMounted(() => {
      // TODO: 获取真实统计数据
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
    
    .chart-placeholder {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
      border-radius: var(--border-radius-base);
      min-height: 280px;
      
      &.small {
        min-height: 200px;
        
        @media (max-width: 1024px) {
          min-height: 240px;
        }
      }
      
      @media (max-width: 768px) {
        min-height: 200px;
      }
    }
    
    .placeholder-content {
      text-align: center;
      color: #8c8c8c;
      
      .placeholder-icon {
        font-size: 48px;
        margin-bottom: 12px;
        color: #d9d9d9;
      }
      
      p {
        margin: 0 0 12px 0;
        font-size: 14px;
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