<template>
  <div class="customer-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">
            <user-outlined class="title-icon" />
            客户管理
          </h1>
          <p class="page-description">管理和跟进客户信息，提升转化效率</p>
        </div>
        <div class="header-extra desktop-only">
          <a-statistic-countdown
            title="本月目标"
            :value="deadline"
            format="D 天 H 时 m 分 s 秒"
            :value-style="{ fontSize: '14px' }"
            class="countdown"
          />
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <a-card class="stat-card" hoverable>
          <a-statistic
            title="总客户数"
            :value="customerStats.total"
            :prefix="h(UserOutlined)"
            :value-style="{ color: '#1890ff' }"
          />
          <div class="stat-trend increase">
            <arrow-up-outlined />
            <span>较上月 +12%</span>
          </div>
        </a-card>
        
        <a-card class="stat-card" hoverable>
          <a-statistic
            title="跟进中"
            :value="customerStats.following"
            :prefix="h(ClockCircleOutlined)"
            :value-style="{ color: '#fa8c16' }"
          />
          <div class="stat-trend">
            <span>需要关注</span>
          </div>
        </a-card>
        
        <a-card class="stat-card" hoverable>
          <a-statistic
            title="已成交"
            :value="customerStats.completed"
            :prefix="h(CheckCircleOutlined)"
            :value-style="{ color: '#52c41a' }"
          />
          <div class="stat-trend increase">
            <arrow-up-outlined />
            <span>转化率 +5%</span>
          </div>
        </a-card>
        
        <a-card class="stat-card mobile-only" hoverable>
          <a-statistic
            title="已流失"
            :value="customerStats.lost"
            :prefix="h(ExclamationCircleOutlined)"
            :value-style="{ color: '#ff4d4f' }"
          />
        </a-card>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-card" :bordered="false">
      <!-- 搜索和操作区域 -->
      <div class="search-section">
        <div class="search-controls">
          <div class="search-inputs">
            <a-input-search
              v-model:value="searchKeyword"
              placeholder="搜索客户姓名、手机号"
              class="search-input"
              @search="handleSearch"
              allow-clear
              size="large"
            >
              <template #prefix>
                <search-outlined class="search-icon" />
              </template>
            </a-input-search>
            
            <div class="filter-group desktop-only">
              <a-select
                v-model:value="searchParams.status"
                placeholder="客户状态"
                class="filter-select"
                allow-clear
                @change="handleSearch"
                size="large"
              >
                <a-select-option value="潜在">
                  <span class="option-text">
                    <dot-chart-outlined class="option-icon" />
                    潜在
                  </span>
                </a-select-option>
                <a-select-option value="跟进中">
                  <span class="option-text">
                    <clock-circle-outlined class="option-icon" />
                    跟进中
                  </span>
                </a-select-option>
                <a-select-option value="已成交">
                  <span class="option-text">
                    <check-circle-outlined class="option-icon" />
                    已成交
                  </span>
                </a-select-option>
                <a-select-option value="已流失">
                  <span class="option-text">
                    <close-circle-outlined class="option-icon" />
                    已流失
                  </span>
                </a-select-option>
              </a-select>
              
              <a-select
                v-model:value="searchParams.channel"
                placeholder="获客渠道"
                class="filter-select"
                allow-clear
                @change="handleSearch"
                size="large"
              >
                <a-select-option
                  v-for="channelOption in customerChannelOptions"
                  :key="channelOption.value"
                  :value="channelOption.value"
                >
                  <span class="option-text">
                    <component :is="channelOption.icon" class="option-icon" />
                    {{ channelOption.label }} ({{ channelOption.count }})
                  </span>
                </a-select-option>
              </a-select>
            </div>
          </div>
          
          <div class="action-buttons">
            <a-button class="filter-btn mobile-only" @click="showMobileFilters = true" size="large">
              <filter-outlined />
            </a-button>
            
            <a-button type="primary" @click="showCreateModal" size="large" class="add-btn">
              <plus-outlined />
              <span class="desktop-only">新增客户</span>
            </a-button>
          </div>
        </div>
      </div>

      <!-- 客户列表表格 -->
      <div class="table-section">
        <!-- 表格工具栏 -->
        <div class="table-toolbar">
          <div class="toolbar-left">
            <span class="result-count">
              共找到 <strong>{{ pagination.total }}</strong> 个客户
            </span>
          </div>
          <div class="toolbar-right">
            <a-button-group class="view-switcher desktop-only">
              <a-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="viewMode = 'table'">
                <table-outlined />
                表格视图
              </a-button>
              <a-button :type="viewMode === 'card' ? 'primary' : 'default'" @click="viewMode = 'card'">
                <appstore-outlined />
                卡片视图
              </a-button>
            </a-button-group>
            
            <a-dropdown>
              <a-button class="export-btn">
                <download-outlined />
                导出
                <down-outlined />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="excel">
                    <file-excel-outlined />
                    导出Excel
                  </a-menu-item>
                  <a-menu-item key="csv">
                    <file-text-outlined />
                    导出CSV
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>

        <!-- 表格视图 -->
        <a-table
          v-show="viewMode === 'table'"
          :columns="columns"
          :data-source="customerList"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
          class="customer-table"
          :scroll="{ x: 800 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'customer'">
              <div class="customer-info">
                <a-avatar :size="32" class="customer-avatar">
                  <template #icon><user-outlined /></template>
                </a-avatar>
                <div class="customer-details">
                  <div class="customer-name">{{ record.wechat_name }}</div>
                  <div class="customer-phone">{{ record.phone }}</div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)" class="status-tag">
                <component :is="getStatusIcon(record.status)" class="status-icon" />
                {{ record.status }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'channel'">
              <a-tag class="channel-tag">
                <component :is="getChannelIcon(record.channel)" class="channel-icon" />
                {{ record.channel }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'customer_date'">
              <span class="date-text">{{ formatDate(record.customer_date) }}</span>
            </template>
            <template v-else-if="column.key === 'created_at'">
              <span class="date-text">{{ formatDate(record.created_at) }}</span>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space class="action-buttons">
                <a-tooltip title="编辑客户">
                  <a-button type="text" size="small" @click="handleEdit(record)" class="edit-btn">
                    <edit-outlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="快速跟进">
                  <a-button type="text" size="small" @click="handleQuickFollow(record)" class="follow-btn">
                    <message-outlined />
                  </a-button>
                </a-tooltip>
                <a-popconfirm
                  title="确定要删除这个客户吗？"
                  @confirm="handleDelete(record.id)"
                  placement="topRight"
                >
                  <a-tooltip title="删除客户">
                    <a-button type="text" size="small" danger class="delete-btn">
                      <delete-outlined />
                    </a-button>
                  </a-tooltip>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>

        <!-- 卡片视图 -->
        <div v-show="viewMode === 'card'" class="card-view">
          <div class="customer-cards">
            <a-card 
              v-for="customer in customerList" 
              :key="customer.id"
              class="customer-card"
              hoverable
            >
              <div class="card-header">
                <div class="customer-info">
                  <a-avatar :size="40" class="customer-avatar">
                    <template #icon><user-outlined /></template>
                  </a-avatar>
                  <div class="customer-details">
                    <div class="customer-name">{{ customer.wechat_name }}</div>
                    <div class="customer-phone">{{ customer.phone }}</div>
                  </div>
                </div>
                <a-tag :color="getStatusColor(customer.status)" class="status-tag">
                  {{ customer.status }}
                </a-tag>
              </div>
              
              <div class="card-content">
                <div class="info-item">
                  <span class="label">获客渠道：</span>
                  <a-tag class="channel-tag">
                    <component :is="getChannelIcon(customer.channel)" class="channel-icon" />
                    {{ customer.channel }}
                  </a-tag>
                </div>
                <div class="info-item">
                  <span class="label">客户日期：</span>
                  <span>{{ formatDate(customer.customer_date) }}</span>
                </div>
                <div v-if="customer.remark" class="info-item remark">
                  <span class="label">备注：</span>
                  <span class="remark-text">{{ customer.remark }}</span>
                </div>
              </div>
              
              <div class="card-actions">
                <a-button type="link" @click="handleEdit(customer)">
                  <edit-outlined />
                  编辑
                </a-button>
                <a-button type="link" @click="handleQuickFollow(customer)">
                  <message-outlined />
                  跟进
                </a-button>
                <a-popconfirm
                  title="确定要删除这个客户吗？"
                  @confirm="handleDelete(customer.id)"
                >
                  <a-button type="link" danger>
                    <delete-outlined />
                    删除
                  </a-button>
                </a-popconfirm>
              </div>
            </a-card>
          </div>
          
          <!-- 卡片视图分页 -->
          <div class="card-pagination">
            <a-pagination
              v-model:current="pagination.current"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :show-size-changer="pagination.showSizeChanger"
              :show-quick-jumper="pagination.showQuickJumper"
              :show-total="pagination.showTotal"
              @change="handlePaginationChange"
              @showSizeChange="handlePaginationChange"
            />
          </div>
        </div>
      </div>
    </a-card>

    <!-- 移动端筛选器 -->
    <a-drawer
      v-model:open="showMobileFilters"
      title="筛选条件"
      placement="right"
      :width="280"
      class="mobile-filters"
    >
      <div class="mobile-filter-content">
        <a-form layout="vertical">
          <a-form-item label="客户状态">
            <a-select
              v-model:value="searchParams.status"
              placeholder="选择状态"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option value="潜在">潜在</a-select-option>
              <a-select-option value="跟进中">跟进中</a-select-option>
              <a-select-option value="已成交">已成交</a-select-option>
              <a-select-option value="已流失">已流失</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="获客渠道">
            <a-select
              v-model:value="searchParams.channel"
              placeholder="选择渠道"
              allow-clear
              @change="handleSearch"
            >
              <a-select-option
                v-for="channelOption in customerChannelOptions"
                :key="channelOption.value"
                :value="channelOption.value"
              >
                {{ channelOption.label }} ({{ channelOption.count }})
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
        
        <div class="filter-actions">
          <a-button block @click="resetFilters">重置筛选</a-button>
          <a-button type="primary" block @click="showMobileFilters = false" class="apply-btn">
            应用筛选
          </a-button>
        </div>
      </div>
    </a-drawer>

    <!-- 新增/编辑客户弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingCustomer ? '编辑客户' : '新增客户'"
      @ok="handleSubmit"
      @cancel="handleCancel"
      :confirm-loading="submitLoading"
      width="600px"
      class="customer-modal"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="vertical"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="微信昵称" name="wechat_name">
              <a-input v-model:value="formData.wechat_name" placeholder="请输入微信昵称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号" name="phone">
              <a-input v-model:value="formData.phone" placeholder="请输入手机号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="获客渠道" name="channel">
              <a-select v-model:value="formData.channel" placeholder="请选择获客渠道">
                <a-select-option
                  v-for="channelOption in customerChannelOptions"
                  :key="channelOption.value"
                  :value="channelOption.value"
                >
                  {{ channelOption.label }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="客户状态" name="status">
              <a-select v-model:value="formData.status" placeholder="请选择客户状态">
                <a-select-option value="潜在">潜在</a-select-option>
                <a-select-option value="跟进中">跟进中</a-select-option>
                <a-select-option value="已成交">已成交</a-select-option>
                <a-select-option value="已流失">已流失</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="客户日期" name="customer_date">
              <a-date-picker 
                v-model:value="formData.customer_date" 
                style="width: 100%" 
                placeholder="选择客户日期"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="添加日期" name="add_date">
              <a-date-picker 
                v-model:value="formData.add_date" 
                style="width: 100%" 
                placeholder="选择添加日期"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注" name="remark">
          <a-textarea 
            v-model:value="formData.remark" 
            placeholder="请输入备注信息"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 快速跟进弹窗 -->
    <a-modal
      v-model:open="quickFollowVisible"
      title="快速跟进"
      @ok="handleQuickFollowSubmit"
      @cancel="handleQuickFollowCancel"
      :confirm-loading="quickFollowLoading"
      width="600px"
      class="follow-up-modal"
    >
      <div class="customer-info-header">
        <a-avatar :size="40" class="customer-avatar">
          <template #icon><user-outlined /></template>
        </a-avatar>
        <div class="customer-details">
          <div class="customer-name">{{ quickFollowCustomer?.wechat_name }}</div>
          <div class="customer-phone">{{ quickFollowCustomer?.phone }}</div>
          <a-tag :color="getStatusColor(quickFollowCustomer?.status)">
            {{ quickFollowCustomer?.status }}
          </a-tag>
        </div>
      </div>

      <a-form
        ref="quickFollowFormRef"
        :model="quickFollowFormData"
        :rules="quickFollowRules"
        layout="vertical"
        class="follow-up-form-content"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="跟进方式" name="follow_type">
              <a-select v-model:value="quickFollowFormData.follow_type" placeholder="选择跟进方式">
                <a-select-option value="phone">电话</a-select-option>
                <a-select-option value="wechat">微信</a-select-option>
                <a-select-option value="meeting">面谈</a-select-option>
                <a-select-option value="email">邮件</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="跟进结果" name="follow_result">
              <a-select v-model:value="quickFollowFormData.follow_result" placeholder="选择跟进结果">
                <a-select-option value="interested">有意向</a-select-option>
                <a-select-option value="not_interested">无意向</a-select-option>
                <a-select-option value="deal">成交</a-select-option>
                <a-select-option value="no_answer">未接听</a-select-option>
                <a-select-option value="reschedule">改期</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        
        <a-form-item label="跟进内容" name="content">
          <a-textarea 
            v-model:value="quickFollowFormData.content" 
            placeholder="请详细描述跟进情况..."
            :rows="4"
          />
        </a-form-item>
        
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="客户状态" name="customer_status">
              <a-select v-model:value="quickFollowFormData.customer_status" placeholder="更新客户状态">
                <a-select-option value="潜在">潜在</a-select-option>
                <a-select-option value="跟进中">跟进中</a-select-option>
                <a-select-option value="已成交">已成交</a-select-option>
                <a-select-option value="已流失">已流失</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="下次跟进时间" name="next_follow_date">
              <a-date-picker 
                v-model:value="quickFollowFormData.next_follow_date" 
                style="width: 100%" 
                placeholder="选择下次跟进时间"
                :disabled-date="(current) => current && current < dayjs().startOf('day')"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="备注" name="remark">
          <a-textarea 
            v-model:value="quickFollowFormData.remark" 
            placeholder="其他备注信息..."
            :rows="2"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { 
  PlusOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  SearchOutlined,
  FilterOutlined,
  TableOutlined,
  AppstoreOutlined,
  DownloadOutlined,
  DownOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  EditOutlined,
  MessageOutlined,
  DeleteOutlined,
  DotChartOutlined,
  CloseCircleOutlined,
  WechatOutlined,
  PhoneOutlined,
  GlobalOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  HeartOutlined,
  BookOutlined,
  MobileOutlined
} from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import { useResponsive } from '@/composables/useResponsive'
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  type Customer,
  type CustomerFormData,
  type CustomerQuery 
} from '@/api/customer'
import {
  createFollowUpRecord
} from '@/api/follow-up'

// 响应式工具
const { isMobile } = useResponsive()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const modalVisible = ref(false)
const showMobileFilters = ref(false)
const customerList = ref<Customer[]>([])
const editingCustomer = ref<Customer | null>(null)
const formRef = ref()
const viewMode = ref<'table' | 'card'>('table')

// 快速跟进相关
const quickFollowVisible = ref(false)
const quickFollowLoading = ref(false)
const quickFollowCustomer = ref<Customer | null>(null)
const quickFollowFormRef = ref()

// 搜索关键词
const searchKeyword = ref('')

// 倒计时目标时间（本月最后一天）
const deadline = computed(() => {
  return dayjs().endOf('month').valueOf()
})

// 客户统计数据
const customerStats = computed(() => {
  const total = customerList.value.length
  const following = customerList.value.filter(c => c.status === '跟进中').length
  const completed = customerList.value.filter(c => c.status === '已成交').length
  const lost = customerList.value.filter(c => c.status === '已流失').length
  
  return { total, following, completed, lost }
})

// 客户渠道选项（根据数据清洗结果标准化合并）
const customerChannelOptions = ref([
  { value: '抖音', label: '抖音', count: 1086, icon: VideoCameraOutlined },
  { value: '小红书', label: '小红书', count: 613, icon: HeartOutlined },
  { value: '其他', label: '其他', count: 101, icon: GlobalOutlined },
  { value: '木荣', label: '木荣', count: 33, icon: TeamOutlined },
  { value: '题库', label: '题库', count: 30, icon: BookOutlined },
  { value: '小程序', label: '小程序', count: 13, icon: MobileOutlined }
])

// 搜索参数
const searchParams = reactive<CustomerQuery>({
  page: 1,
  per_page: 20,
  status: undefined,
  channel: undefined,
  sort_by: 'created_at',
  sort_order: 'desc'
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 表单数据
const formData = reactive<CustomerFormData & {
  customer_date?: Dayjs | undefined
  add_date?: Dayjs | undefined
}>({
  wechat_name: '',
  phone: '',
  channel: undefined,
  status: '潜在',
  customer_date: undefined,
  add_date: undefined,
  remark: ''
})

// 表单验证规则
const rules = {
  wechat_name: [
    { required: true, message: '请输入微信昵称', trigger: 'blur' as const, type: 'string' as const }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' as const, type: 'string' as const }
  ]
}

// 快速跟进表单数据
const quickFollowFormData = reactive<{
  follow_type: string
  follow_result: string
  content: string
  customer_status?: string
  next_follow_date?: Dayjs
  remark: string
}>({
  follow_type: '',
  follow_result: '',
  content: '',
  customer_status: undefined,
  next_follow_date: undefined,
  remark: ''
})

// 快速跟进表单验证规则
const quickFollowRules = {
  follow_type: [
    { required: true, message: '请选择跟进方式', trigger: 'change' }
  ],
  follow_result: [
    { required: true, message: '请选择跟进结果', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入跟进内容', trigger: 'blur' }
  ]
} as any

// 表格列配置
const columns = computed(() => [
  {
    title: '客户信息',
    key: 'customer',
    width: 200,
    fixed: 'left' as const
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    filters: [
      { text: '潜在', value: '潜在' },
      { text: '跟进中', value: '跟进中' },
      { text: '已成交', value: '已成交' },
      { text: '已流失', value: '已流失' }
    ]
  },
  {
    title: '获客渠道',
    key: 'channel',
    width: 120,
    filters: [
      { text: '微信', value: '微信' },
      { text: '电话', value: '电话' },
      { text: '网站', value: '网站' },
      { text: '推荐', value: '推荐' }
    ]
  },
  {
    title: '客户日期',
    key: 'customer_date',
    width: 120,
    sorter: true
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 120,
    sorter: true,
    defaultSortOrder: 'descend' as const
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right' as const
  }
])

// 获取状态颜色
const getStatusColor = (status?: string) => {
  if (!status) return 'default'
  const colorMap: Record<string, string> = {
    '潜在': 'default',
    '跟进中': 'processing',
    '已成交': 'success',
    '已流失': 'error'
  }
  return colorMap[status] || 'default'
}

// 获取状态图标
const getStatusIcon = (status?: string) => {
  if (!status) return DotChartOutlined
  const iconMap: Record<string, any> = {
    '潜在': DotChartOutlined,
    '跟进中': ClockCircleOutlined,
    '已成交': CheckCircleOutlined,
    '已流失': CloseCircleOutlined
  }
  return iconMap[status] || DotChartOutlined
}

// 获取渠道图标
const getChannelIcon = (channel?: string) => {
  if (!channel) return GlobalOutlined
  const iconMap: Record<string, any> = {
    '抖音': VideoCameraOutlined,
    '小红书': HeartOutlined,
    '其他': GlobalOutlined,
    '木荣': TeamOutlined,
    '题库': BookOutlined,
    '小程序': MobileOutlined,
    // 保留一些老的映射以防数据中还有旧格式
    '微信': WechatOutlined,
    '电话': PhoneOutlined,
    '网站': GlobalOutlined,
    '推荐': TeamOutlined
  }
  return iconMap[channel] || GlobalOutlined
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  return dateStr ? dayjs(dateStr).format('YYYY-MM-DD') : '-'
}

// 加载客户列表
const loadCustomers = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params: CustomerQuery = {
      page: searchParams.page,
      per_page: searchParams.per_page,
      sort_by: searchParams.sort_by,
      sort_order: searchParams.sort_order
    }
    
    // 只有当有值时才添加可选参数
    if (searchKeyword.value.trim()) {
      params.subject = searchKeyword.value.trim()
    }
    if (searchParams.status) {
      params.status = searchParams.status
    }
    if (searchParams.channel) {
      params.channel = searchParams.channel
    }
    
    const response = await getCustomers(params)
    customerList.value = response.data
    pagination.total = response.total
    pagination.current = response.page
  } catch (error) {
    message.error('加载客户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  searchParams.page = 1
  pagination.current = 1
  loadCustomers()
}

// 表格变化处理
const handleTableChange = (pag: any, _filters: any, sorter: any) => {
  searchParams.page = pag.current
  searchParams.per_page = pag.pageSize
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  
  // 处理排序
  if (sorter && sorter.field) {
    searchParams.sort_by = sorter.field === 'customer_date' ? 'customer_date' : sorter.field
    searchParams.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc'
  } else {
    // 没有排序时使用默认排序（创建时间倒序）
    searchParams.sort_by = 'created_at'
    searchParams.sort_order = 'desc'
  }
  
  loadCustomers()
}

// 分页变化处理
const handlePaginationChange = (page: number, pageSize: number) => {
  searchParams.page = page
  searchParams.per_page = pageSize
  pagination.current = page
  pagination.pageSize = pageSize
  loadCustomers()
}

// 显示新增弹窗
const showCreateModal = () => {
  editingCustomer.value = null
  resetForm()
  modalVisible.value = true
}

// 编辑客户
const handleEdit = (customer: Customer) => {
  editingCustomer.value = customer
  Object.assign(formData, {
    wechat_name: customer.wechat_name,
    phone: customer.phone,
    channel: customer.channel,
    status: customer.status,
    customer_date: customer.customer_date ? dayjs(customer.customer_date) : null,
    add_date: customer.add_date ? dayjs(customer.add_date) : null,
    remark: customer.remark
  })
  modalVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    const submitData: CustomerFormData = {
      ...formData,
      customer_date: formData.customer_date?.format('YYYY-MM-DD'),
      add_date: formData.add_date?.format('YYYY-MM-DD')
    }
    
    if (editingCustomer.value) {
      await updateCustomer(editingCustomer.value.id!, submitData)
      message.success('更新客户成功')
    } else {
      await createCustomer(submitData)
      message.success('新增客户成功')
    }
    
    modalVisible.value = false
    loadCustomers()
  } catch (error: any) {
    if (error?.errorFields) return // 表单验证错误
    message.error(editingCustomer.value ? '更新客户失败' : '新增客户失败')
  } finally {
    submitLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    wechat_name: '',
    phone: '',
    channel: undefined,
    status: '潜在',
    customer_date: undefined,
    add_date: undefined,
    remark: ''
  })
  formRef.value?.resetFields()
}

// 删除客户
const handleDelete = async (id?: number) => {
  if (!id) {
    message.error('客户ID不存在')
    return
  }
  try {
    await deleteCustomer(id)
    message.success('删除客户成功')
    loadCustomers()
  } catch (error) {
    message.error('删除客户失败')
  }
}

// 快速跟进
const handleQuickFollow = (customer: Customer) => {
  quickFollowCustomer.value = customer
  resetQuickFollowForm()
  // 默认设置客户状态为当前状态
  quickFollowFormData.customer_status = customer.status
  quickFollowVisible.value = true
}

// 快速跟进提交
const handleQuickFollowSubmit = async () => {
  try {
    await quickFollowFormRef.value.validate()
    quickFollowLoading.value = true
    
    const followUpData = {
      follow_up_type: quickFollowFormData.follow_type as any,
      follow_up_content: quickFollowFormData.content,
      result: quickFollowFormData.follow_result as any,
      next_follow_date: quickFollowFormData.next_follow_date?.format('YYYY-MM-DD'),
      status_before: quickFollowCustomer.value?.status as any,
      status_after: quickFollowFormData.customer_status as any
    }
    
    // 创建跟进记录
    await createFollowUpRecord(quickFollowCustomer.value!.id!, followUpData)
    
    // 如果状态有变化，更新客户状态
    if (quickFollowFormData.customer_status && 
        quickFollowFormData.customer_status !== quickFollowCustomer.value?.status) {
      await updateCustomer(quickFollowCustomer.value!.id!, {
        status: quickFollowFormData.customer_status as "潜在" | "跟进中" | "已成交" | "已流失"
      })
    }
    
    message.success('跟进记录创建成功')
    quickFollowVisible.value = false
    loadCustomers() // 刷新客户列表
  } catch (error: any) {
    if (error?.errorFields) return // 表单验证错误
    message.error('创建跟进记录失败')
  } finally {
    quickFollowLoading.value = false
  }
}

// 快速跟进取消
const handleQuickFollowCancel = () => {
  quickFollowVisible.value = false
  resetQuickFollowForm()
}

// 重置快速跟进表单
const resetQuickFollowForm = () => {
  Object.assign(quickFollowFormData, {
    follow_type: '',
    follow_result: '',
    content: '',
    customer_status: undefined,
    next_follow_date: undefined,
    remark: ''
  })
  quickFollowFormRef.value?.resetFields()
}

// 重置筛选
const resetFilters = () => {
  searchParams.status = undefined
  searchParams.channel = undefined
  searchKeyword.value = ''
  handleSearch()
}

// 初始化
onMounted(() => {
  loadCustomers()
  // 移动端默认使用卡片视图
  if (isMobile.value) {
    viewMode.value = 'card'
  }
})
</script>

<style scoped lang="less">
.customer-list {
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: var(--border-radius-base);
    color: white;
    
    @media (max-width: 768px) {
      padding: 16px;
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
  
  .countdown {
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
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  .stat-card {
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
      font-size: 13px;
      margin-bottom: 4px;
    }
    
    :deep(.ant-statistic-content-value) {
      font-size: 24px;
      font-weight: 600;
      
      @media (max-width: 768px) {
        font-size: 20px;
      }
    }
  }
  
  .stat-trend {
    margin-top: 8px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &.increase {
      color: #52c41a;
    }
    
    &.decrease {
      color: #ff4d4f;
    }
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

// 搜索区域
.search-section {
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
}

.search-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.search-inputs {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
}

.search-input {
  min-width: 300px;
  
  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
  
  :deep(.ant-input-search) {
    .ant-input {
      border-radius: var(--border-radius-base);
    }
  }
}

.search-icon {
  color: #8c8c8c;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  min-width: 140px;
}

.option-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.option-icon {
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
}

.filter-btn,
.add-btn {
  height: 40px;
  
  @media (max-width: 768px) {
    flex: 1;
  }
}

// 表格工具栏
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.result-count {
  color: #666;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
}

.view-switcher {
  :deep(.ant-btn) {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

// 表格样式
.customer-table {
  flex: 1;
  
  :deep(.ant-table) {
    .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
    }
    
    .ant-table-tbody > tr:hover > td {
      background: #f5f7fa;
    }
  }
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.date-text {
  font-size: 13px;
  color: #666;
}

.action-buttons {
  .edit-btn {
    color: #1890ff;
    
    &:hover {
      background: #e6f7ff;
    }
  }
  
  .follow-btn {
    color: #52c41a;
    
    &:hover {
      background: #f6ffed;
    }
  }
  
  .delete-btn {
    &:hover {
      background: #fff2f0;
    }
  }
}

// 卡片视图
.card-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.customer-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.customer-card {
  transition: var(--transition-base);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
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
  
  .card-content {
    margin-bottom: 16px;
    
    .info-item {
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &.remark {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .label {
        font-size: 12px;
        color: #8c8c8c;
        min-width: 60px;
      }
      
      .remark-text {
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
    justify-content: space-between;
    border-top: 1px solid #f0f0f0;
    padding-top: 12px;
    
    :deep(.ant-btn-link) {
      padding: 0;
      height: auto;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.card-pagination {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

// 移动端筛选器
.mobile-filters {
  .mobile-filter-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    
    .filter-actions {
      margin-top: auto;
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .apply-btn {
        margin-top: 8px;
      }
    }
  }
}

// 客户模态框
.customer-modal {
  :deep(.ant-modal-body) {
    padding: 24px;
  }
}

// 跟进模态框
.follow-up-modal {
  :deep(.ant-modal-body) {
    padding: 24px;
  }
  
  .customer-info-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 24px;
    
    .customer-details {
      .customer-name {
        font-weight: 500;
        font-size: 16px;
        margin-bottom: 4px;
      }
      
      .customer-phone {
        font-size: 14px;
        color: #8c8c8c;
        margin-bottom: 4px;
      }
    }
  }
  
  .follow-up-form-content {
    .ant-form-item {
      margin-bottom: 20px;
    }
  }
}

// 客户详情模态框
.customer-detail-modal {
  :deep(.ant-modal-body) {
    padding: 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .detail-section {
    margin-bottom: 32px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
      color: #1890ff;
    }
  }
  
  .customer-basic-info {
    .info-item {
      margin-bottom: 12px;
      
      .label {
        font-weight: 500;
        color: #666;
        margin-right: 8px;
      }
      
      .value {
        color: #2c3e50;
      }
    }
  }
  
  .follow-up-stats {
    :deep(.ant-statistic) {
      text-align: center;
      
      .ant-statistic-title {
        font-size: 13px;
        margin-bottom: 4px;
      }
      
      .ant-statistic-content-value {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }
  
  .recent-follow-ups {
    .timeline-content {
      .timeline-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        
        .follow-up-type {
          font-weight: 500;
          color: #1890ff;
        }
        
        .follow-up-time {
          font-size: 12px;
          color: #8c8c8c;
          margin-left: auto;
        }
      }
      
      .follow-up-content {
        margin-bottom: 4px;
        line-height: 1.4;
        color: #333;
      }
      
      .follow-up-creator {
        font-size: 12px;
        color: #8c8c8c;
      }
    }
  }
  
  .pending-reminders {
    .reminder-content {
      .reminder-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        
        .remind-date {
          font-size: 12px;
          color: #666;
          margin-left: auto;
        }
      }
      
      .reminder-text {
        margin-bottom: 4px;
        color: #333;
      }
      
      .reminder-creator {
        font-size: 12px;
        color: #8c8c8c;
      }
    }
  }
}

// 操作按钮增强
.action-buttons {
  .detail-btn {
    color: #722ed1;
    
    &:hover {
      background: #f9f0ff;
    }
  }
}
</style>
