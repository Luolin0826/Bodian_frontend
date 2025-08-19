<template>
  <div class="customer-follow">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <clock-circle-outlined class="title-icon" />
            客户跟进
          </h1>
          <p class="page-description">及时跟进客户动态，提升成交率</p>
        </div>
        <div class="header-stats">
          <a-statistic
            title="今日已跟进"
            :value="todayFollowCount"
            suffix="人"
            :value-style="{ color: '#52c41a', fontSize: '20px' }"
          />
        </div>
      </div>
    </div>

    <!-- 快速统计 -->
    <div class="stats-section">
      <div class="stats-grid">
        <a-card class="stat-card urgent" hoverable>
          <div class="stat-content">
            <div class="stat-icon urgent-icon">
              <exclamation-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ urgentCount }}</div>
              <div class="stat-label">紧急跟进</div>
              <div class="stat-desc">3天未联系</div>
            </div>
          </div>
        </a-card>
        
        <a-card class="stat-card normal" hoverable>
          <div class="stat-content">
            <div class="stat-icon normal-icon">
              <clock-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ normalCount }}</div>
              <div class="stat-label">正常跟进</div>
              <div class="stat-desc">1-3天内</div>
            </div>
          </div>
        </a-card>
        
        <a-card class="stat-card potential" hoverable>
          <div class="stat-content">
            <div class="stat-icon potential-icon">
              <user-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ potentialCount }}</div>
              <div class="stat-label">潜在客户</div>
              <div class="stat-desc">待激活</div>
            </div>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-card" :bordered="false">
      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-controls">
          <div class="filter-left">
            <a-segmented 
              v-model:value="filterStatus" 
              :options="statusOptions" 
              @change="loadFollowCustomers"
              class="status-filter"
            />
            
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索客户名称、手机号"
              class="search-input"
              @search="loadFollowCustomers"
              allow-clear
              size="large"
            >
              <template #prefix>
                <search-outlined class="search-icon" />
              </template>
            </a-input-search>
          </div>
          
          <div class="filter-right">
            <a-select
              v-model:value="sortBy"
              placeholder="排序方式"
              class="sort-select"
              @change="loadFollowCustomers"
              size="large"
            >
              <a-select-option value="urgency">按紧急度</a-select-option>
              <a-select-option value="date">按日期</a-select-option>
              <a-select-option value="name">按姓名</a-select-option>
            </a-select>
            
            <a-button type="primary" @click="loadFollowCustomers" size="large" class="refresh-btn">
              <reload-outlined />
              刷新
            </a-button>
          </div>
        </div>
      </div>

      <!-- 待跟进客户列表 -->
      <div class="follow-list-section">
        <div class="section-header">
          <div class="section-title">
            <clock-circle-outlined class="section-icon" />
            <span>待跟进客户</span>
            <a-badge :count="followList.length" class="count-badge" />
          </div>
          
          <div class="view-options desktop-only">
            <a-radio-group v-model:value="viewType" button-style="solid" size="small">
              <a-radio-button value="list">
                <unordered-list-outlined />
                列表
              </a-radio-button>
              <a-radio-button value="cards">
                <appstore-outlined />
                卡片
              </a-radio-button>
            </a-radio-group>
          </div>
        </div>

        <!-- 列表视图 -->
        <a-table
          v-show="viewType === 'list'"
          :columns="followColumns"
          :data-source="followList"
          :loading="loading"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
          row-key="id"
          class="follow-table"
          :row-class-name="getRowClassName"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'customer'">
              <div class="customer-info">
                <a-avatar :size="40" class="customer-avatar">
                  <template #icon><user-outlined /></template>
                </a-avatar>
                <div class="customer-details">
                  <div class="customer-name">{{ record.wechat_name }}</div>
                  <div class="customer-phone">{{ record.phone }}</div>
                  <div class="customer-channel">
                    <component :is="getChannelIcon(record.channel)" class="channel-icon" />
                    {{ record.channel }}
                  </div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)" class="status-tag">
                <component :is="getStatusIcon(record.status)" class="status-icon" />
                {{ record.status }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'last_contact'">
              <div class="contact-info">
                <div class="contact-time" :class="getContactTimeClass(record.updated_at)">
                  {{ getLastContactText(record.updated_at) }}
                </div>
                <div class="contact-urgency">
                  <a-tag v-if="getDaysSinceContact(record.updated_at) > 3" color="red" size="small">
                    紧急
                  </a-tag>
                  <a-tag v-else-if="getDaysSinceContact(record.updated_at) > 1" color="orange" size="small">
                    正常
                  </a-tag>
                  <a-tag v-else color="green" size="small">
                    新近
                  </a-tag>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space class="action-buttons">
                <a-tooltip title="快速跟进">
                  <a-button 
                    type="primary" 
                    size="small" 
                    @click="handleQuickFollow(record)"
                    class="quick-follow-btn"
                  >
                    <message-outlined />
                    快速跟进
                  </a-button>
                </a-tooltip>
                <a-tooltip title="详细跟进">
                  <a-button 
                    size="small" 
                    @click="handleDetailFollow(record)"
                    class="detail-follow-btn"
                  >
                    <edit-outlined />
                  </a-button>
                </a-tooltip>
              </a-space>
            </template>
          </template>
        </a-table>

        <!-- 卡片视图 -->
        <div v-show="viewType === 'cards'" class="follow-cards">
          <div class="cards-grid">
            <a-card 
              v-for="customer in followList" 
              :key="customer.id"
              class="follow-card"
              :class="getCardClass(customer)"
              hoverable
            >
              <div class="card-header">
                <div class="customer-info">
                  <a-avatar :size="48" class="customer-avatar">
                    <template #icon><user-outlined /></template>
                  </a-avatar>
                  <div class="customer-details">
                    <div class="customer-name">{{ customer.wechat_name }}</div>
                    <div class="customer-phone">{{ customer.phone }}</div>
                  </div>
                </div>
                
                <div class="card-badges">
                  <a-tag :color="getStatusColor(customer.status)" class="status-tag">
                    {{ customer.status }}
                  </a-tag>
                  <a-tag v-if="getDaysSinceContact(customer.updated_at) > 3" color="red" size="small">
                    紧急
                  </a-tag>
                </div>
              </div>
              
              <div class="card-content">
                <div class="info-row">
                  <span class="label">获客渠道：</span>
                  <span class="value">
                    <component :is="getChannelIcon(customer.channel)" class="channel-icon" />
                    {{ customer.channel }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">最后联系：</span>
                  <span class="value" :class="getContactTimeClass(customer.updated_at)">
                    {{ getLastContactText(customer.updated_at) }}
                  </span>
                </div>
                <div v-if="customer.remark" class="info-row remark-row">
                  <span class="label">备注：</span>
                  <div class="remark-content">{{ customer.remark }}</div>
                </div>
              </div>
              
              <div class="card-actions">
                <a-button 
                  type="primary" 
                  block 
                  @click="handleQuickFollow(customer)"
                  class="primary-action"
                >
                  <message-outlined />
                  快速跟进
                </a-button>
                <a-button 
                  block 
                  @click="handleDetailFollow(customer)"
                  class="secondary-action"
                >
                  <edit-outlined />
                  详细跟进
                </a-button>
              </div>
            </a-card>
          </div>
        </div>
      </div>

      <!-- 今日成果 -->
      <div class="today-results">
        <a-card title="今日跟进成果" :bordered="false" class="results-card">
          <div v-if="todayFollowCount === 0" class="empty-state">
            <div class="empty-icon">
              <calendar-outlined />
            </div>
            <h3>今日还没有跟进记录</h3>
            <p>开始你的第一个跟进吧！</p>
            <a-button type="primary" @click="handleQuickFollowFromEmpty">
              <plus-outlined />
              开始跟进
            </a-button>
          </div>
          
          <div v-else class="results-content">
            <div class="results-stats">
              <div class="stat-item">
                <a-statistic 
                  title="已跟进客户" 
                  :value="todayFollowCount" 
                  suffix="人"
                  :value-style="{ color: '#52c41a' }"
                />
              </div>
              <div class="stat-item">
                <a-statistic 
                  title="成交客户" 
                  :value="todayDealCount" 
                  suffix="人"
                  :value-style="{ color: '#1890ff' }"
                />
              </div>
              <div class="stat-item">
                <a-statistic 
                  title="跟进率" 
                  :value="followRate" 
                  suffix="%"
                  :precision="1"
                  :value-style="{ color: '#722ed1' }"
                />
              </div>
            </div>
            
            <div class="achievement-badge">
              <a-tag color="gold" class="achievement-tag">
                <trophy-outlined />
                今日表现优秀！
              </a-tag>
            </div>
          </div>
        </a-card>
      </div>
    </a-card>

    <!-- 快速跟进弹窗 -->
    <a-modal
      v-model:open="quickFollowVisible"
      title="快速跟进"
      @ok="handleQuickFollowSubmit"
      @cancel="quickFollowVisible = false"
      :confirm-loading="submitLoading"
      width="600px"
      class="quick-follow-modal"
    >
      <div v-if="currentCustomer">
        <p><strong>客户：</strong>{{ currentCustomer.wechat_name }}</p>
        <p><strong>手机：</strong>{{ currentCustomer.phone }}</p>
        <p><strong>当前状态：</strong>
          <a-tag :color="getStatusColor(currentCustomer.status)">
            {{ currentCustomer.status }}
          </a-tag>
        </p>
        
        <a-form layout="vertical" class="mt-4">
          <a-form-item label="更新状态">
            <a-select v-model:value="quickFollowStatus" placeholder="选择新状态">
              <a-select-option value="跟进中">跟进中</a-select-option>
              <a-select-option value="已成交">已成交</a-select-option>
              <a-select-option value="已流失">已流失</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="跟进备注">
            <a-textarea 
              v-model:value="quickFollowRemark" 
              placeholder="请输入跟进情况..."
              :rows="3"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { 
  ReloadOutlined, 
  ClockCircleOutlined, 
  UserOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  MessageOutlined,
  EditOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  PlusOutlined,
  TrophyOutlined,
  WechatOutlined,
  PhoneOutlined,
  GlobalOutlined,
  TeamOutlined,
  DotChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { useResponsive } from '@/composables/useResponsive'
import { 
  getCustomers, 
  updateCustomer,
  type Customer,
  type CustomerQuery 
} from '@/api/customer'

// 响应式工具
const { isMobile } = useResponsive()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const quickFollowVisible = ref(false)
const followList = ref<Customer[]>([])
const currentCustomer = ref<Customer | null>(null)
const filterStatus = ref<string>('跟进中')
const searchKeyword = ref('')
const quickFollowStatus = ref('')
const quickFollowRemark = ref('')
const viewType = ref<'list' | 'cards'>('list')
const sortBy = ref<string>('urgency')

// 状态选项
const statusOptions = [
  { label: '跟进中', value: '跟进中' },
  { label: '潜在客户', value: '潜在' },
  { label: '全部', value: '' }
]

// 统计数据计算
const urgentCount = computed(() => {
  return followList.value.filter(customer => 
    getDaysSinceContact(customer.updated_at) > 3
  ).length
})

const normalCount = computed(() => {
  return followList.value.filter(customer => {
    const days = getDaysSinceContact(customer.updated_at)
    return days >= 1 && days <= 3
  }).length
})

const potentialCount = computed(() => {
  return followList.value.filter(customer => 
    customer.status === '潜在'
  ).length
})

// 今日跟进数量计算
const todayFollowCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return followList.value.filter(customer => 
    dayjs(customer.updated_at).format('YYYY-MM-DD') === today
  ).length
})

// 今日成交数量
const todayDealCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return followList.value.filter(customer => 
    customer.status === '已成交' && 
    dayjs(customer.updated_at).format('YYYY-MM-DD') === today
  ).length
})

// 跟进率计算
const followRate = computed(() => {
  if (followList.value.length === 0) return 0
  return (todayFollowCount.value / followList.value.length) * 100
})

// 表格列配置
const followColumns = [
  {
    title: '客户信息',
    key: 'customer',
    width: 250,
    fixed: 'left'
  },
  {
    title: '状态',
    key: 'status',
    width: 100
  },
  {
    title: '最后联系',
    key: 'last_contact',
    width: 150,
    sorter: true
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
]

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    '潜在': 'default',
    '跟进中': 'processing',
    '已成交': 'success',
    '已流失': 'error'
  }
  return colorMap[status] || 'default'
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  const iconMap: Record<string, any> = {
    '潜在': DotChartOutlined,
    '跟进中': ClockCircleOutlined,
    '已成交': CheckCircleOutlined,
    '已流失': CloseCircleOutlined
  }
  return iconMap[status] || DotChartOutlined
}

// 获取渠道图标
const getChannelIcon = (channel: string) => {
  const iconMap: Record<string, any> = {
    '微信': WechatOutlined,
    '电话': PhoneOutlined,
    '网站': GlobalOutlined,
    '推荐': TeamOutlined
  }
  return iconMap[channel] || GlobalOutlined
}

// 计算距离最后联系的天数
const getDaysSinceContact = (lastContactDate?: string) => {
  if (!lastContactDate) return 999
  return dayjs().diff(dayjs(lastContactDate), 'day')
}

// 获取最后联系文本
const getLastContactText = (lastContactDate?: string) => {
  if (!lastContactDate) return '未联系'
  const days = getDaysSinceContact(lastContactDate)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  return `${days}天前`
}

// 获取联系时间样式类
const getContactTimeClass = (lastContactDate?: string) => {
  const days = getDaysSinceContact(lastContactDate)
  if (days > 3) return 'contact-urgent'
  if (days > 1) return 'contact-normal'
  return 'contact-recent'
}

// 获取表格行样式类
const getRowClassName = (record: Customer) => {
  const days = getDaysSinceContact(record.updated_at)
  if (days > 3) return 'row-urgent'
  if (days > 1) return 'row-normal'
  return 'row-recent'
}

// 获取卡片样式类
const getCardClass = (customer: Customer) => {
  const days = getDaysSinceContact(customer.updated_at)
  if (days > 3) return 'card-urgent'
  if (days > 1) return 'card-normal'
  return 'card-recent'
}

// 加载待跟进客户
const loadFollowCustomers = async () => {
  loading.value = true
  try {
    const params: CustomerQuery = {
      status: filterStatus.value || '跟进中',
      per_page: 100,
      subject: searchKeyword.value.trim()
    }
    
    const response = await getCustomers(params)
    
    // 根据排序方式处理数据
    let sortedData = [...response.data]
    
    switch (sortBy.value) {
      case 'urgency':
        sortedData.sort((a, b) => {
          const daysA = getDaysSinceContact(a.updated_at)
          const daysB = getDaysSinceContact(b.updated_at)
          return daysB - daysA
        })
        break
      case 'date':
        sortedData.sort((a, b) => {
          return dayjs(b.updated_at || '').diff(dayjs(a.updated_at || ''))
        })
        break
      case 'name':
        sortedData.sort((a, b) => {
          return (a.wechat_name || '').localeCompare(b.wechat_name || '')
        })
        break
    }
    
    followList.value = sortedData
  } catch (error) {
    message.error('加载跟进列表失败')
  } finally {
    loading.value = false
  }
}

// 快速跟进
const handleQuickFollow = (customer: Customer) => {
  currentCustomer.value = customer
  quickFollowStatus.value = customer.status || ''
  quickFollowRemark.value = ''
  quickFollowVisible.value = true
}

// 详细跟进
const handleDetailFollow = (customer: Customer) => {
  // 这里可以跳转到客户详情页面或打开详细编辑弹窗
  message.info('详细跟进功能待实现')
}

// 提交快速跟进
const handleQuickFollowSubmit = async () => {
  if (!currentCustomer.value) return
  
  submitLoading.value = true
  try {
    const updateData = {
      status: quickFollowStatus.value,
      remark: `${currentCustomer.value.remark || ''}\n\n[${dayjs().format('YYYY-MM-DD HH:mm')}] ${quickFollowRemark.value}`.trim()
    }
    
    await updateCustomer(currentCustomer.value.id!, updateData)
    message.success('跟进记录更新成功')
    
    quickFollowVisible.value = false
    loadFollowCustomers()
  } catch (error) {
    message.error('更新跟进记录失败')
  } finally {
    submitLoading.value = false
  }
}

// 从空状态开始跟进
const handleQuickFollowFromEmpty = () => {
  if (followList.value.length > 0) {
    handleQuickFollow(followList.value[0])
  } else {
    message.info('暂无客户需要跟进')
  }
}

// 初始化
onMounted(() => {
  loadFollowCustomers()
  // 移动端默认使用卡片视图
  if (isMobile.value) {
    viewType.value = 'cards'
  }
})
</script>

<style scoped lang="less">
.customer-follow {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 页面头部
.page-header {
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    background: linear-gradient(135deg, #fa541c 0%, #faad14 100%);
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
  
  .header-stats {
    :deep(.ant-statistic-title) {
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
    }
    
    :deep(.ant-statistic-content) {
      color: white;
    }
  }
}

// 统计部分
.stats-section {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
  
  .stat-card {
    transition: var(--transition-base);
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
    }
    
    &.urgent {
      border-left: 4px solid #ff4d4f;
    }
    
    &.normal {
      border-left: 4px solid #fa8c16;
    }
    
    &.potential {
      border-left: 4px solid #1890ff;
    }
    
    :deep(.ant-card-body) {
      padding: 20px;
      
      @media (max-width: 768px) {
        padding: 16px;
      }
    }
  }
  
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    
    &.urgent-icon {
      background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%);
      color: white;
    }
    
    &.normal-icon {
      background: linear-gradient(135deg, #ffc069 0%, #fa8c16 100%);
      color: white;
    }
    
    &.potential-icon {
      background: linear-gradient(135deg, #69c0ff 0%, #1890ff 100%);
      color: white;
    }
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 14px;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 2px;
  }
  
  .stat-desc {
    font-size: 12px;
    color: #8c8c8c;
  }
}

// 主卡片
.main-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  :deep(.ant-card-body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    
    @media (max-width: 768px) {
      padding: 16px;
    }
  }
}

// 筛选区域
.filter-section {
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
}

.status-filter {
  :deep(.ant-segmented-item) {
    min-width: 80px;
    text-align: center;
  }
}

.search-input {
  min-width: 300px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
}

.search-icon {
  color: #8c8c8c;
}

.filter-right {
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
}

.sort-select {
  min-width: 120px;
  
  @media (max-width: 768px) {
    flex: 1;
  }
}

.refresh-btn {
  @media (max-width: 768px) {
    flex: 1;
  }
}

// 跟进列表区域
.follow-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  
  .section-icon {
    color: #fa8c16;
  }
  
  .count-badge {
    :deep(.ant-badge-count) {
      background: #fa8c16;
    }
  }
}

.view-options {
  :deep(.ant-radio-button-wrapper) {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

// 表格样式
.follow-table {
  flex: 1;
  
  :deep(.ant-table) {
    .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
    }
    
    .ant-table-tbody > tr {
      &.row-urgent {
        background: #fff2f0;
        
        &:hover > td {
          background: #ffebe8 !important;
        }
      }
      
      &.row-normal {
        background: #fff7e6;
        
        &:hover > td {
          background: #ffecc4 !important;
        }
      }
      
      &.row-recent {
        &:hover > td {
          background: #f5f7fa;
        }
      }
    }
  }
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-avatar {
  background: linear-gradient(135deg, #fa8c16 0%, #faad14 100%);
}

.customer-details {
  .customer-name {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 2px;
  }
  
  .customer-phone {
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 2px;
  }
  
  .customer-channel {
    font-size: 11px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 4px;
    
    .channel-icon {
      font-size: 10px;
    }
  }
}

.status-tag,
.channel-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .status-icon,
  .channel-icon {
    font-size: 12px;
  }
}

.contact-info {
  .contact-time {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
    
    &.contact-urgent {
      color: #ff4d4f;
    }
    
    &.contact-normal {
      color: #fa8c16;
    }
    
    &.contact-recent {
      color: #52c41a;
    }
  }
}

.action-buttons {
  .quick-follow-btn {
    background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    border: none;
    
    &:hover {
      background: linear-gradient(135deg, #73d13d 0%, #95de64 100%);
    }
  }
  
  .detail-follow-btn {
    &:hover {
      background: #f5f7fa;
    }
  }
}

// 卡片视图
.follow-cards {
  flex: 1;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.follow-card {
  transition: var(--transition-base);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
  }
  
  &.card-urgent {
    border-left: 4px solid #ff4d4f;
  }
  
  &.card-normal {
    border-left: 4px solid #fa8c16;
  }
  
  &.card-recent {
    border-left: 4px solid #52c41a;
  }
  
  :deep(.ant-card-body) {
    padding: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  
  .card-badges {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
  }
  
  .card-content {
    margin-bottom: 16px;
    
    .info-row {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &.remark-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .label {
        font-size: 12px;
        color: #8c8c8c;
        min-width: 60px;
      }
      
      .value {
        font-size: 13px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 4px;
        
        .channel-icon {
          font-size: 12px;
        }
      }
      
      .remark-content {
        font-size: 13px;
        color: #666;
        line-height: 1.4;
        background: #f5f5f5;
        padding: 8px;
        border-radius: 4px;
        width: 100%;
      }
    }
  }
  
  .card-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .primary-action {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
      border: none;
      
      &:hover {
        background: linear-gradient(135deg, #73d13d 0%, #95de64 100%);
      }
    }
    
    .secondary-action {
      &:hover {
        background: #f5f7fa;
      }
    }
  }
}

// 今日成果
.today-results {
  .results-card {
    :deep(.ant-card-body) {
      padding: 24px;
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    
    .empty-icon {
      font-size: 64px;
      color: #d9d9d9;
      margin-bottom: 16px;
    }
    
    h3 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 16px;
    }
    
    p {
      margin: 0 0 24px 0;
      color: #8c8c8c;
      font-size: 14px;
    }
  }
  
  .results-content {
    .results-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 24px;
      margin-bottom: 20px;
      
      @media (max-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      
      .stat-item {
        text-align: center;
        
        :deep(.ant-statistic-title) {
          font-size: 12px;
          margin-bottom: 4px;
        }
        
        :deep(.ant-statistic-content-value) {
          font-size: 20px;
          font-weight: 600;
        }
      }
    }
    
    .achievement-badge {
      text-align: center;
      
      .achievement-tag {
        font-size: 14px;
        padding: 8px 16px;
        border-radius: 20px;
        
        :deep(.anticon) {
          margin-right: 4px;
        }
      }
    }
  }
}

// 快速跟进模态框
.quick-follow-modal {
  :deep(.ant-modal-body) {
    padding: 24px;
  }
}
</style>
