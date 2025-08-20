<template>
  <ComingSoon
    title="销售统计"
    subtitle="智能数据分析与可视化报表"
    description="强大的销售数据分析平台，为您提供深度的业务洞察和决策支持"
    :icon="PieChartOutlined"
    :features="features"
    :progress="40"
    estimated-date="2025年10月"
  />
</template>

<script setup lang="ts">
import ComingSoon from '@/components/common/ComingSoon.vue'
import { 
  PieChartOutlined,
  LineChartOutlined,
  BarChartOutlined,
  AreaChartOutlined,
  RiseOutlined,
  CalendarOutlined,
  TeamOutlined,
  TagOutlined,
  FunnelPlotOutlined,
  ThunderboltOutlined,
  ArrowUpOutlined,
  DashboardOutlined
} from '@ant-design/icons-vue'

const features = [
  {
    icon: LineChartOutlined,
    title: '销售趋势',
    description: '直观展示销售额、订单量等关键指标的时间趋势'
  },
  {
    icon: PieChartOutlined,
    title: '产品分析',
    description: '按产品分类统计销售占比和热门产品排行'
  },
  {
    icon: BarChartOutlined,
    title: '区域统计',
    description: '按地区展示销售分布，识别高价值市场'
  },
  {
    icon: TeamOutlined,
    title: '销售团队',
    description: '销售人员业绩排行和团队协作效率分析'
  },
  {
    icon: CalendarOutlined,
    title: '时间维度',
    description: '支持日、周、月、季、年等多时间维度统计'
  },
  {
    icon: FunnelPlotOutlined,
    title: '销售漏斗',
    description: '分析客户转化路径，优化销售流程'
  },
  {
    icon: ArrowUpOutlined,
    title: '预测分析',
    description: '基于历史数据预测未来销售趋势'
  },
  {
    icon: DashboardOutlined,
    title: '实时仪表盘',
    description: '关键指标实时监控，数据自动刷新'
  },
  {
    icon: TagOutlined,
    title: '自定义标签',
    description: '支持自定义分类标签，满足个性化需求'
  },
  {
    icon: ThunderboltOutlined,
    title: '智能提醒',
    description: '异常数据智能识别和及时预警通知'
  },
  {
    icon: RiseOutlined,
    title: '同比环比',
    description: '同比环比增长率计算和趋势对比分析'
  },
  {
    icon: AreaChartOutlined,
    title: '多维分析',
    description: '支持多维度交叉分析，深度挖掘数据价值'
  }
]
</script>

<style scoped>
/* 页面特定样式可以在这里添加 */
</style>