<template>
  <div class="follow-up-reminders">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <bell-outlined class="title-icon" />
            跟进提醒
          </h1>
          <p class="page-description">管理客户跟进提醒，确保及时跟进</p>
        </div>
        <div class="header-stats">
          <a-statistic
            title="待处理提醒"
            :value="pendingCount"
            suffix="个"
            :value-style="{ color: '#fa8c16', fontSize: '20px' }"
          />
        </div>
      </div>
    </div>

    <!-- 快速统计 -->
    <div class="stats-section">
      <div class="stats-grid">
        <a-card class="stat-card today" hoverable>
          <div class="stat-content">
            <div class="stat-icon today-icon">
              <calendar-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ todayCount }}</div>
              <div class="stat-label">今日提醒</div>
              <div class="stat-desc">需要处理</div>
            </div>
          </div>
        </a-card>
        
        <a-card class="stat-card overdue" hoverable>
          <div class="stat-content">
            <div class="stat-icon overdue-icon">
              <exclamation-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ overdueCount }}</div>
              <div class="stat-label">逾期提醒</div>
              <div class="stat-desc">需要关注</div>
            </div>
          </div>
        </a-card>
        
        <a-card class="stat-card completed" hoverable>
          <div class="stat-content">
            <div class="stat-icon completed-icon">
              <check-circle-outlined />
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ completedThisMonth }}</div>
              <div class="stat-label">本月完成</div>
              <div class="stat-desc">已处理</div>
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
              @change="loadReminders"
              class="status-filter"
            />
            
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索客户名称、提醒内容"
              class="search-input"
              @search="loadReminders"
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
              v-model:value="priorityFilter"
              placeholder="优先级"
              class="priority-select"
              @change="loadReminders"
              allow-clear
              size="large"
            >
              <a-select-option value="urgent">紧急</a-select-option>
              <a-select-option value="high">高</a-select-option>
              <a-select-option value="medium">中</a-select-option>
              <a-select-option value="low">低</a-select-option>
            </a-select>
            
            <a-button type="primary" @click="showCreateReminder" size="large" class="add-btn">
              <plus-outlined />
              新增提醒
            </a-button>
          </div>
        </div>
      </div>

      <!-- 提醒列表 -->
      <div class="reminders-list">
        <div class="section-header">
          <div class="section-title">
            <bell-outlined class="section-icon" />
            <span>提醒列表</span>
            <a-badge :count="reminderList.length" class="count-badge" />
          </div>
        </div>

        <a-list
          :data-source="reminderList"
          :loading="loading"
          item-layout="vertical"
          class="reminder-list"
          :pagination="{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: handlePaginationChange,
            onShowSizeChange: handlePaginationChange
          }"
        >
          <template #renderItem="{ item }">
            <a-list-item 
              :key="item.id" 
              class="reminder-item"
              :class="getReminderItemClass(item)"
            >
              <template #actions>
                <a-space>
                  <a-tooltip v-if="!item.is_completed" title="标记完成">
                    <a-button 
                      type="primary" 
                      size="small" 
                      @click="handleCompleteReminder(item)"
                      :loading="item.completing"
                    >
                      <check-outlined />
                      完成
                    </a-button>
                  </a-tooltip>
                  <a-tooltip v-else title="重新打开">
                    <a-button 
                      size="small" 
                      @click="handleReopenReminder(item)"
                      :loading="item.reopening"
                    >
                      <redo-outlined />
                      重开
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="编辑提醒">
                    <a-button type="text" size="small" @click="handleEditReminder(item)">
                      <edit-outlined />
                    </a-button>
                  </a-tooltip>
                  <a-popconfirm
                    title="确定要删除这个提醒吗？"
                    @confirm="handleDeleteReminder(item.id)"
                    placement="topRight"
                  >
                    <a-tooltip title="删除提醒">
                      <a-button type="text" size="small" danger>
                        <delete-outlined />
                      </a-button>
                    </a-tooltip>
                  </a-popconfirm>
                </a-space>
              </template>

              <div class="reminder-content">
                <div class="reminder-header">
                  <div class="customer-info">
                    <a-avatar :size="32" class="customer-avatar">
                      <template #icon><user-outlined /></template>
                    </a-avatar>
                    <div class="customer-details">
                      <div class="customer-name">{{ item.customer_name }}</div>
                      <div class="customer-phone">{{ item.customer_phone }}</div>
                    </div>
                  </div>
                  
                  <div class="reminder-meta">
                    <a-tag :color="getPriorityColor(item.priority)" class="priority-tag">
                      {{ getPriorityText(item.priority) }}
                    </a-tag>
                    <a-tag v-if="item.customer_status" :color="getStatusColor(item.customer_status)">
                      {{ item.customer_status }}
                    </a-tag>
                    <span class="remind-date" :class="getDateClass(item.remind_date)">
                      {{ formatRemindDate(item.remind_date) }}
                    </span>
                  </div>
                </div>
                
                <div class="reminder-body">
                  <div class="reminder-text">{{ item.remind_content }}</div>
                  <div v-if="item.is_completed" class="completion-info">
                    <check-circle-outlined class="completion-icon" />
                    <span>已于 {{ formatDate(item.completed_at) }} 由 {{ item.completer_name }} 完成</span>
                  </div>
                </div>
                
                <div class="reminder-footer">
                  <div class="creator-info">
                    创建人：{{ item.creator_name }} 
                    <span class="create-time">{{ formatDate(item.created_at) }}</span>
                  </div>
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </a-card>

    <!-- 新增/编辑提醒弹窗 -->
    <a-modal
      v-model:open="reminderModalVisible"
      :title="editingReminder ? '编辑提醒' : '新增提醒'"
      @ok="handleReminderSubmit"
      @cancel="handleReminderCancel"
      :confirm-loading="submitLoading"
      width="600px"
      class="reminder-modal"
    >
      <a-form
        ref="reminderFormRef"
        :model="reminderFormData"
        :rules="reminderRules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="选择客户" name="customer_id">
              <a-select 
                v-model:value="reminderFormData.customer_id" 
                placeholder="请选择客户"
                show-search
                :filter-option="filterCustomerOption"
                @focus="loadCustomerOptions"
              >
                <a-select-option 
                  v-for="customer in customerOptions" 
                  :key="customer.id" 
                  :value="customer.id"
                  :label="customer.wechat_name"
                >
                  <div class="customer-option">
                    <span class="customer-name">{{ customer.wechat_name }}</span>
                    <span class="customer-phone">{{ customer.phone }}</span>
                  </div>
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优先级" name="priority">
              <a-select v-model:value="reminderFormData.priority" placeholder="选择优先级">
                <a-select-option value="low">低</a-select-option>
                <a-select-option value="medium">中</a-select-option>
                <a-select-option value="high">高</a-select-option>
                <a-select-option value="urgent">紧急</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="提醒日期" name="remind_date">
          <a-date-picker 
            v-model:value="reminderFormData.remind_date" 
            style="width: 100%" 
            placeholder="选择提醒日期"
            :disabled-date="disabledDate"
          />
        </a-form-item>
        
        <a-form-item label="提醒内容" name="remind_content">
          <a-textarea 
            v-model:value="reminderFormData.remind_content" 
            placeholder="请输入提醒内容..."
            :rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { 
  BellOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  PlusOutlined,
  CheckOutlined,
  RedoOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import { useResponsive } from '@/composables/useResponsive'
import {
  getFollowUpReminders,
  createFollowUpReminder,
  updateFollowUpReminder,
  completeFollowUpReminder,
  reopenFollowUpReminder,
  deleteFollowUpReminder,
  getTodayReminders,
  getReminderStatistics,
  type FollowUpReminder,
  getPriorityText,
  getPriorityColor
} from '@/api/follow-up'
import { getCustomers, type Customer } from '@/api/customer'

// 响应式工具
const { isMobile } = useResponsive()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const reminderModalVisible = ref(false)
const reminderList = ref<FollowUpReminder[]>([])
const editingReminder = ref<FollowUpReminder | null>(null)
const reminderFormRef = ref()
const filterStatus = ref<string>('pending')
const searchKeyword = ref('')
const priorityFilter = ref<string>('')
const customerOptions = ref<Customer[]>([])

// 统计数据
const statsData = ref<any>(null)

// 状态选项
const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '今日', value: 'today' },
  { label: '逾期', value: 'overdue' },
  { label: '已完成', value: 'completed' },
  { label: '全部', value: '' }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0
})

// 表单数据
const reminderFormData = reactive<{
  customer_id?: number
  remind_date?: Dayjs
  remind_content: string
  priority: string
}>({
  customer_id: undefined,
  remind_date: undefined,
  remind_content: '',
  priority: 'medium'
})

// 表单验证规则
const reminderRules = {
  customer_id: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  remind_date: [
    { required: true, message: '请选择提醒日期', trigger: 'change' }
  ],
  remind_content: [
    { required: true, message: '请输入提醒内容', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 统计数据计算
const pendingCount = computed(() => statsData.value?.total_pending || 0)
const todayCount = computed(() => statsData.value?.today_count || 0)
const overdueCount = computed(() => statsData.value?.overdue_count || 0)
const completedThisMonth = computed(() => statsData.value?.completed_this_month || 0)

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

// 获取提醒项样式类
const getReminderItemClass = (reminder: FollowUpReminder) => {
  if (reminder.is_completed) return 'reminder-completed'
  
  const today = dayjs().format('YYYY-MM-DD')
  const remindDate = reminder.remind_date
  
  if (remindDate < today) return 'reminder-overdue'
  if (remindDate === today) return 'reminder-today'
  return 'reminder-pending'
}

// 获取日期样式类
const getDateClass = (date: string) => {
  const today = dayjs().format('YYYY-MM-DD')
  
  if (date < today) return 'date-overdue'
  if (date === today) return 'date-today'
  return 'date-future'
}

// 格式化提醒日期
const formatRemindDate = (date: string) => {
  const today = dayjs()
  const targetDate = dayjs(date)
  const diffDays = targetDate.diff(today, 'day')
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays < -1) return `${Math.abs(diffDays)}天前`
  if (diffDays > 1) return `${diffDays}天后`
  
  return targetDate.format('MM-DD')
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD HH:mm') : '-'
}

// 禁用过去的日期
const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf('day')
}

// 筛选客户选项
const filterCustomerOption = (input: string, option: any) => {
  const customer = customerOptions.value.find(c => c.id === option.value)
  if (!customer) return false
  
  return (customer.wechat_name || '').toLowerCase().includes(input.toLowerCase()) ||
         (customer.phone || '').includes(input)
}

// 加载提醒列表
const loadReminders = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.current,
      per_page: pagination.pageSize
    }
    
    // 处理状态筛选
    if (filterStatus.value === 'today') {
      params.date = dayjs().format('YYYY-MM-DD')
      params.is_completed = false
    } else if (filterStatus.value === 'overdue') {
      params.date = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
      params.is_completed = false
    } else if (filterStatus.value === 'pending') {
      params.is_completed = false
    } else if (filterStatus.value === 'completed') {
      params.is_completed = true
    }
    
    if (searchKeyword.value.trim()) {
      params.customer_name = searchKeyword.value.trim()
    }
    
    if (priorityFilter.value) {
      params.priority = priorityFilter.value
    }
    
    const response = await getFollowUpReminders(params)
    reminderList.value = (response.data.reminders || []).map(item => ({
      ...item,
      completing: false,
      reopening: false
    }))
    pagination.total = response.data.total
  } catch (error) {
    message.error('加载提醒列表失败')
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const response = await getReminderStatistics()
    statsData.value = response.data
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载客户选项
const loadCustomerOptions = async () => {
  if (customerOptions.value.length > 0) return
  
  try {
    const response = await getCustomers({ per_page: 100 })
    customerOptions.value = response.data
  } catch (error) {
    message.error('加载客户列表失败')
  }
}

// 分页变化处理
const handlePaginationChange = (page: number, pageSize: number) => {
  pagination.current = page
  pagination.pageSize = pageSize
  loadReminders()
}

// 显示新增提醒弹窗
const showCreateReminder = () => {
  editingReminder.value = null
  resetReminderForm()
  reminderModalVisible.value = true
}

// 编辑提醒
const handleEditReminder = (reminder: FollowUpReminder) => {
  editingReminder.value = reminder
  Object.assign(reminderFormData, {
    customer_id: reminder.customer_id,
    remind_date: reminder.remind_date ? dayjs(reminder.remind_date) : null,
    remind_content: reminder.remind_content,
    priority: reminder.priority
  })
  reminderModalVisible.value = true
}

// 完成提醒
const handleCompleteReminder = async (reminder: FollowUpReminder) => {
  reminder.completing = true
  try {
    await completeFollowUpReminder(reminder.id!)
    message.success('提醒已标记为完成')
    loadReminders()
    loadStatistics()
  } catch (error) {
    message.error('标记完成失败')
  } finally {
    reminder.completing = false
  }
}

// 重新打开提醒
const handleReopenReminder = async (reminder: FollowUpReminder) => {
  reminder.reopening = true
  try {
    await reopenFollowUpReminder(reminder.id!)
    message.success('提醒已重新打开')
    loadReminders()
    loadStatistics()
  } catch (error) {
    message.error('重新打开失败')
  } finally {
    reminder.reopening = false
  }
}

// 删除提醒
const handleDeleteReminder = async (id?: number) => {
  if (!id) return
  
  try {
    await deleteFollowUpReminder(id)
    message.success('删除提醒成功')
    loadReminders()
    loadStatistics()
  } catch (error) {
    message.error('删除提醒失败')
  }
}

// 提交提醒表单
const handleReminderSubmit = async () => {
  try {
    await reminderFormRef.value.validate()
    submitLoading.value = true
    
    const submitData = {
      customer_id: reminderFormData.customer_id!,
      remind_date: reminderFormData.remind_date!.format('YYYY-MM-DD'),
      remind_content: reminderFormData.remind_content,
      priority: reminderFormData.priority as any
    }
    
    if (editingReminder.value) {
      await updateFollowUpReminder(editingReminder.value.id!, submitData)
      message.success('更新提醒成功')
    } else {
      await createFollowUpReminder(submitData)
      message.success('创建提醒成功')
    }
    
    reminderModalVisible.value = false
    loadReminders()
    loadStatistics()
  } catch (error: any) {
    if (error?.errorFields) return // 表单验证错误
    message.error(editingReminder.value ? '更新提醒失败' : '创建提醒失败')
  } finally {
    submitLoading.value = false
  }
}

// 取消提醒表单
const handleReminderCancel = () => {
  reminderModalVisible.value = false
  resetReminderForm()
}

// 重置提醒表单
const resetReminderForm = () => {
  Object.assign(reminderFormData, {
    customer_id: undefined,
    remind_date: undefined,
    remind_content: '',
    priority: 'medium'
  })
  reminderFormRef.value?.resetFields()
}

// 初始化
onMounted(() => {
  loadReminders()
  loadStatistics()
})
</script>

<style scoped lang="less">
.follow-up-reminders {
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
    background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
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
      grid-template-columns: repeat(2, 1fr);
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
    
    &.today {
      border-left: 4px solid #1890ff;
    }
    
    &.overdue {
      border-left: 4px solid #ff4d4f;
    }
    
    &.completed {
      border-left: 4px solid #52c41a;
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
    
    &.today-icon {
      background: linear-gradient(135deg, #69c0ff 0%, #1890ff 100%);
      color: white;
    }
    
    &.overdue-icon {
      background: linear-gradient(135deg, #ff7875 0%, #ff4d4f 100%);
      color: white;
    }
    
    &.completed-icon {
      background: linear-gradient(135deg, #95de64 0%, #52c41a 100%);
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

.priority-select {
  min-width: 120px;
  
  @media (max-width: 768px) {
    flex: 1;
  }
}

.add-btn {
  @media (max-width: 768px) {
    flex: 1;
  }
}

// 提醒列表
.reminders-list {
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
    color: #13c2c2;
  }
  
  .count-badge {
    :deep(.ant-badge-count) {
      background: #13c2c2;
    }
  }
}

.reminder-list {
  flex: 1;
  
  :deep(.ant-list-item) {
    transition: var(--transition-base);
    border-radius: 8px;
    margin-bottom: 8px;
    border: 1px solid #f0f0f0;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    &.reminder-completed {
      background: #f6ffed;
      border-color: #d9f7be;
    }
    
    &.reminder-overdue {
      background: #fff2f0;
      border-color: #ffccc7;
    }
    
    &.reminder-today {
      background: #e6f7ff;
      border-color: #91d5ff;
    }
    
    &.reminder-pending {
      background: #fafafa;
    }
  }
}

.reminder-content {
  width: 100%;
  
  .reminder-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  
  .customer-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .customer-avatar {
    background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
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
    }
  }
  
  .reminder-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    
    .remind-date {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      
      &.date-overdue {
        background: #ffebe8;
        color: #ff4d4f;
      }
      
      &.date-today {
        background: #e6f7ff;
        color: #1890ff;
      }
      
      &.date-future {
        background: #f6ffed;
        color: #52c41a;
      }
    }
  }
  
  .reminder-body {
    margin-bottom: 12px;
    
    .reminder-text {
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      margin-bottom: 8px;
    }
    
    .completion-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #52c41a;
      
      .completion-icon {
        font-size: 14px;
      }
    }
  }
  
  .reminder-footer {
    .creator-info {
      font-size: 12px;
      color: #8c8c8c;
      
      .create-time {
        margin-left: 8px;
      }
    }
  }
}

// 提醒模态框
.reminder-modal {
  :deep(.ant-modal-body) {
    padding: 24px;
  }
  
  .customer-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .customer-name {
      font-weight: 500;
    }
    
    .customer-phone {
      font-size: 12px;
      color: #8c8c8c;
    }
  }
}
</style>