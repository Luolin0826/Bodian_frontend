<template>
  <div class="login-logs-page">
    <a-card title="登录日志">
      <template #extra>
        <a-space>
          <a-button @click="exportLogs" :loading="exporting">
            <DownloadOutlined />
            导出日志
          </a-button>
          <a-button @click="fetchLoginLogs">
            <ReloadOutlined />
            刷新
          </a-button>
        </a-space>
      </template>

      <!-- 筛选条件 -->
      <div class="filters-section">
        <a-row :gutter="16" align="middle">
          <a-col :span="6">
            <a-select 
              v-model:value="filters.status" 
              placeholder="登录状态"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option value="">全部状态</a-select-option>
              <a-select-option value="success">登录成功</a-select-option>
              <a-select-option value="failed">登录失败</a-select-option>
            </a-select>
          </a-col>
          
          <a-col :span="12">
            <a-range-picker 
              v-model:value="dateRange" 
              style="width: 100%"
              @change="handleDateChange"
              :presets="datePresets"
            />
          </a-col>
          
          <a-col :span="6">
            <a-input
              v-model:value="filters.ip_address"
              placeholder="IP地址"
              @pressEnter="handleFilterChange"
              @blur="handleFilterChange"
            >
              <template #prefix>
                <GlobalOutlined />
              </template>
            </a-input>
          </a-col>
        </a-row>
      </div>

      <!-- 当前会话信息 -->
      <a-alert 
        v-if="currentSession"
        type="info" 
        :message="`当前会话：${currentSession.ip_address}`"
        :description="`登录时间：${formatDateTime(currentSession.login_time)} | 过期时间：${formatDateTime(currentSession.expires_at)}`"
        show-icon
        style="margin-bottom: 16px;"
      />

      <!-- 登录日志表格 -->
      <a-table
        :columns="columns"
        :data-source="loginLogs"
        :loading="loading"
        :pagination="paginationConfig"
        :scroll="{ x: 1200 }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态列 -->
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'success' ? 'green' : 'red'">
              {{ record.status === 'success' ? '成功' : '失败' }}
            </a-tag>
          </template>

          <!-- IP地址列 -->
          <template v-else-if="column.key === 'ip_address'">
            <div>
              <div>{{ record.ip_address }}</div>
              <div class="location-info" v-if="record.location">
                <EnvironmentOutlined />
                {{ record.location }}
              </div>
            </div>
          </template>

          <!-- 设备信息列 -->
          <template v-else-if="column.key === 'device_info'">
            <div>
              <div class="device-type">
                <component 
                  :is="getDeviceIcon(record.device_type)" 
                  :style="{ marginRight: '4px' }" 
                />
                {{ record.device_type || '未知设备' }}
              </div>
              <div class="user-agent" v-if="record.user_agent">
                {{ formatUserAgent(record.user_agent) }}
              </div>
            </div>
          </template>

          <!-- 登录时间列 -->
          <template v-else-if="column.key === 'login_time'">
            <div>
              <div>{{ formatDateTime(record.login_time) }}</div>
              <div class="relative-time">{{ formatRelativeTime(record.login_time) }}</div>
            </div>
          </template>

          <!-- 会话时长列 -->
          <template v-else-if="column.key === 'session_duration'">
            <span v-if="record.logout_time">
              {{ calculateDuration(record.login_time, record.logout_time) }}
            </span>
            <a-tag v-else color="processing">进行中</a-tag>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button 
                type="link" 
                size="small"
                @click="showLogDetails(record)"
              >
                详情
              </a-button>
              <a-button 
                v-if="record.status === 'failed'"
                type="link" 
                size="small"
                danger
                @click="reportSuspiciousActivity(record)"
              >
                举报
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 登录详情模态框 -->
    <a-modal 
      v-model:open="detailModal"
      title="登录详情"
      :footer="null"
      width="600px"
    >
      <div v-if="selectedLog" class="login-detail">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="登录状态">
            <a-tag :color="selectedLog.status === 'success' ? 'green' : 'red'">
              {{ selectedLog.status === 'success' ? '登录成功' : '登录失败' }}
            </a-tag>
          </a-descriptions-item>
          
          <a-descriptions-item label="登录时间">
            {{ formatDateTime(selectedLog.login_time) }}
          </a-descriptions-item>
          
          <a-descriptions-item label="登出时间" v-if="selectedLog.logout_time">
            {{ formatDateTime(selectedLog.logout_time) }}
          </a-descriptions-item>
          
          <a-descriptions-item label="会话时长">
            <span v-if="selectedLog.logout_time">
              {{ calculateDuration(selectedLog.login_time, selectedLog.logout_time) }}
            </span>
            <span v-else>进行中</span>
          </a-descriptions-item>
          
          <a-descriptions-item label="IP地址">
            {{ selectedLog.ip_address }}
          </a-descriptions-item>
          
          <a-descriptions-item label="地理位置" v-if="selectedLog.location">
            {{ selectedLog.location }}
          </a-descriptions-item>
          
          <a-descriptions-item label="设备类型">
            {{ selectedLog.device_type || '未知' }}
          </a-descriptions-item>
          
          <a-descriptions-item label="浏览器信息">
            {{ formatUserAgent(selectedLog.user_agent) }}
          </a-descriptions-item>
          
          <a-descriptions-item label="完整User Agent">
            <div class="user-agent-full">{{ selectedLog.user_agent }}</div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>

    <!-- 举报可疑活动模态框 -->
    <a-modal
      v-model:open="reportModal"
      title="举报可疑活动"
      ok-text="提交举报"
      cancel-text="取消"
      @ok="submitReport"
      :confirm-loading="reporting"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="举报原因">
          <a-select v-model:value="reportForm.reason" placeholder="请选择举报原因">
            <a-select-option value="suspicious_ip">可疑IP地址</a-select-option>
            <a-select-option value="unusual_location">异常登录位置</a-select-option>
            <a-select-option value="multiple_failures">多次登录失败</a-select-option>
            <a-select-option value="other">其他原因</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="详细描述">
          <a-textarea 
            v-model:value="reportForm.description"
            placeholder="请详细描述可疑活动的情况"
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
  DownloadOutlined, 
  ReloadOutlined, 
  GlobalOutlined,
  EnvironmentOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined
} from '@ant-design/icons-vue'
import {
  getLoginLogs,
  type LoginLog,
  type LoginLogQueryParams
} from '@/api/user-center'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.locale('zh-cn')

const loading = ref(false)
const exporting = ref(false)
const reporting = ref(false)
const detailModal = ref(false)
const reportModal = ref(false)

const loginLogs = ref<LoginLog[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const currentSession = ref()
const selectedLog = ref<LoginLog>()
const dateRange = ref()

const filters = reactive({
  ip_address: ''
})

const reportForm = reactive({
  reason: '',
  description: ''
})

const datePresets = [
  { label: '今天', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
  { label: '昨天', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
  { label: '最近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
  { label: '最近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
  { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] }
]

const columns = [
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    filters: [
      { text: '成功', value: 'success' },
      { text: '失败', value: 'failed' }
    ]
  },
  {
    title: 'IP地址/位置',
    dataIndex: 'ip_address',
    key: 'ip_address',
    width: 180
  },
  {
    title: '设备信息',
    dataIndex: 'device_info',
    key: 'device_info',
    width: 200
  },
  {
    title: '登录时间',
    dataIndex: 'login_time',
    key: 'login_time',
    width: 180,
    sorter: true
  },
  {
    title: '会话时长',
    dataIndex: 'session_duration',
    key: 'session_duration',
    width: 120
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right'
  }
]

const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
  onChange: (page: number, size: number) => {
    currentPage.value = page
    pageSize.value = size
    fetchLoginLogs()
  }
}))

const formatDateTime = (datetime?: string) => {
  return datetime ? dayjs(datetime).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const formatRelativeTime = (datetime: string) => {
  return dayjs(datetime).fromNow()
}

const formatUserAgent = (userAgent?: string) => {
  if (!userAgent) return '未知'
  
  // 简单的User Agent解析
  const ua = userAgent.toLowerCase()
  let browser = '未知浏览器'
  let os = '未知系统'
  
  if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('edge')) browser = 'Edge'
  
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('ios')) os = 'iOS'
  
  return `${browser} / ${os}`
}

const getDeviceIcon = (deviceType?: string) => {
  const type = deviceType?.toLowerCase()
  if (type?.includes('mobile') || type?.includes('phone')) {
    return MobileOutlined
  } else if (type?.includes('tablet')) {
    return TabletOutlined
  }
  return DesktopOutlined
}

const calculateDuration = (startTime: string, endTime: string) => {
  const start = dayjs(startTime)
  const end = dayjs(endTime)
  const diff = end.diff(start)
  return dayjs.duration(diff).format('H[小时]m[分钟]')
}

const fetchLoginLogs = async () => {
  try {
    loading.value = true
    
    const params: LoginLogQueryParams = {
      page: currentPage.value,
      per_page: pageSize.value,
      ...filters
    }

    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.end_date = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }

    const response = await getLoginLogs(params)
    if (response.code === 0) {
      const data = response.data
      loginLogs.value = data.logs
      total.value = data.total
      currentPage.value = data.page
      currentSession.value = data.current_session
    }
  } catch (error) {
    console.error('获取登录日志失败:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchLoginLogs()
}

const handleDateChange = () => {
  currentPage.value = 1
  fetchLoginLogs()
}

const showLogDetails = (log: LoginLog) => {
  selectedLog.value = log
  detailModal.value = true
}

const reportSuspiciousActivity = (log: LoginLog) => {
  selectedLog.value = log
  reportModal.value = true
  reportForm.reason = ''
  reportForm.description = `可疑登录记录：\nIP: ${log.ip_address}\n时间: ${formatDateTime(log.login_time)}\n位置: ${log.location || '未知'}`
}

const submitReport = async () => {
  if (!reportForm.reason) {
    message.error('请选择举报原因')
    return
  }
  
  try {
    reporting.value = true
    // 这里应该调用举报API
    // await reportSuspiciousLogin({
    //   log_id: selectedLog.value?.id,
    //   reason: reportForm.reason,
    //   description: reportForm.description
    // })
    
    message.success('举报已提交，我们会尽快处理')
    reportModal.value = false
  } catch (error) {
    console.error('提交举报失败:', error)
  } finally {
    reporting.value = false
  }
}

const exportLogs = async () => {
  try {
    exporting.value = true
    
    // 构建导出参数
    const params = {
      ...filters,
      export: true
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.end_date = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    
    // 这里应该调用导出API
    // const response = await exportLoginLogs(params)
    // const blob = new Blob([response.data], { type: 'text/csv' })
    // const url = URL.createObjectURL(blob)
    // const a = document.createElement('a')
    // a.href = url
    // a.download = `login-logs-${dayjs().format('YYYY-MM-DD')}.csv`
    // a.click()
    // URL.revokeObjectURL(url)
    
    message.success('登录日志导出成功')
  } catch (error) {
    console.error('导出登录日志失败:', error)
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchLoginLogs()
})
</script>

<style scoped>
.login-logs-page {
  padding: 24px;
}

.filters-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.location-info {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.device-type {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.user-agent {
  font-size: 12px;
  color: #8c8c8c;
}

.relative-time {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.login-detail {
  padding: 8px 0;
}

.user-agent-full {
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  max-height: 100px;
  overflow-y: auto;
}
</style>