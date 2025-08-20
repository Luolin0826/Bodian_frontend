<template>
  <ComingSoon
    title="销售记录"
    subtitle="专业的销售数据管理即将上线"
    description="全面的销售记录追踪系统，让您的销售数据管理更加高效便捷"
    :icon="BarChartOutlined"
    :features="features"
    :progress="35"
    estimated-date="2025年9月"
  />
</template>

<script setup lang="ts">
import ComingSoon from '@/components/common/ComingSoon.vue'
import { 
  BarChartOutlined,
  FileTextOutlined,
  SearchOutlined,
  ExportOutlined,
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons-vue'

const features = [
  {
    icon: FileTextOutlined,
    title: '详细记录',
    description: '记录每笔销售的详细信息，包括客户、产品、金额等'
  },
  {
    icon: SearchOutlined,
    title: '智能搜索',
    description: '支持多维度搜索和筛选，快速找到目标记录'
  },
  {
    icon: FilterOutlined,
    title: '高级筛选',
    description: '按时间、客户、产品、销售员等多种条件筛选'
  },
  {
    icon: ExportOutlined,
    title: '数据导出',
    description: '支持Excel、PDF等多种格式的数据导出'
  },
  {
    icon: CalendarOutlined,
    title: '时间统计',
    description: '按日、周、月、年等时间维度进行销售统计'
  },
  {
    icon: UserOutlined,
    title: '销售员管理',
    description: '分销售员统计业绩，支持团队协作管理'
  },
  {
    icon: DollarOutlined,
    title: '收入追踪',
    description: '实时追踪销售收入，自动生成财务报表'
  },
  {
    icon: BarChartOutlined,
    title: '数据可视化',
    description: '直观的图表展示销售趋势和业绩分析'
  }
]
</script>

<style scoped>
/* 页面特定样式可以在这里添加 */
</style>