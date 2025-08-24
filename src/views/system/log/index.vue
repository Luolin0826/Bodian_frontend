<template>
  <div class="log-page">
    <div class="page-header">
      <div class="page-title">
        <FileTextOutlined class="title-icon" />
        <h1>操作日志</h1>
        <span class="title-desc">系统操作记录与审计</span>
      </div>
      <div class="page-actions">
        <a-button @click="handleExport" :loading="exportLoading">
          <DownloadOutlined />
          <span class="hidden sm:inline">导出日志</span>
        </a-button>
      </div>
    </div>

    <!-- 统计仪表盘 -->
    <div class="stats-dashboard">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <FileTextOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.total }}</div>
            <div class="stat-label">总日志数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <ClockCircleOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.today }}</div>
            <div class="stat-label">今日操作</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <ExclamationCircleOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.sensitive }}</div>
            <div class="stat-label">敏感操作</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <UserOutlined />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ logStats.activeUsers }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <a-card class="main-content">
      <!-- 搜索和筛选栏 -->
      <div class="search-section">
        <div class="search-filters">
          <a-input-search
            v-model:value="searchKeyword"
            placeholder="搜索用户、操作或描述"
            class="search-input"
            @search="handleSearch"
            allow-clear
            size="large"
          />
          <a-select
            v-model:value="selectedAction"
            placeholder="操作类型"
            class="filter-select"
            allow-clear
            @change="handleSearch"
            size="large"
          >
            <a-select-option value="login">登录</a-select-option>
            <a-select-option value="logout">退出</a-select-option>
            <a-select-option value="create">新增</a-select-option>
            <a-select-option value="update">修改</a-select-option>
            <a-select-option value="delete">删除</a-select-option>
            <a-select-option value="export">导出</a-select-option>
            <a-select-option value="import">导入</a-select-option>
            <a-select-option value="approve">审核</a-select-option>
          </a-select>
          <a-select
            v-model:value="selectedResource"
            placeholder="操作对象"
            class="filter-select"
            allow-clear
            @change="handleSearch"
            size="large"
          >
            <a-select-option value="user">用户</a-select-option>
            <a-select-option value="department">部门</a-select-option>
            <a-select-option value="customer">客户</a-select-option>
            <a-select-option value="sales">销售</a-select-option>
            <a-select-option value="knowledge">知识库</a-select-option>
            <a-select-option value="script">脚本</a-select-option>
            <a-select-option value="system">系统</a-select-option>
          </a-select>
          <a-cascader
            v-model:value="selectedDepartment"
            :options="departmentOptions"
            :field-names="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="选择部门"
            class="filter-select"
            allow-clear
            @change="handleSearch"
            size="large"
          />
          <a-range-picker
            v-model:value="dateRange"
            :show-time="{ format: 'HH:mm' }"
            format="YYYY-MM-DD HH:mm"
            placeholder="时间范围"
            @change="handleSearch"
            size="large"
          />
        </div>
        <div class="filter-controls">
          <a-switch
            v-model:checked="sensitiveOnly"
            checked-children="仅敏感操作"
            un-checked-children="全部操作"
            @change="handleSearch"
          />
          <a-button @click="handleClearFilters">
            <ClearOutlined />
            清空筛选
          </a-button>
        </div>
      </div>

      <!-- 日志表格 -->
      <div class="log-table">
        <a-table
          :columns="tableColumns"
          :data-source="logList"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
          :scroll="{ x: 1400 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'created_at'">
              <div class="log-time">
                <div class="time-primary">{{ formatDate(record.created_at) }}</div>
                <div class="time-secondary">{{ formatTime(record.created_at) }}</div>
              </div>
            </template>
            
            <template v-if="column.key === 'user_info'">
              <div class="user-info">
                <a-badge :dot="record.sensitive_operation" :color="record.sensitive_operation ? 'red' : 'transparent'">
                  <a-avatar :src="record.avatar" :style="{border: record.sensitive_operation ? '2px solid #ff4d4f' : '2px solid #d9d9d9'}">
                    {{ record.username?.[0]?.toUpperCase() }}
                  </a-avatar>
                </a-badge>
                <div class="user-details">
                  <div class="user-name">{{ record.username }}</div>
                  <div class="user-employee">
                    <a-tag size="small" color="blue">{{ record.employee_no }}</a-tag>
                  </div>
                  <div class="user-department">{{ record.department_name }}</div>
                </div>
              </div>
            </template>
            
            <template v-if="column.key === 'action'">
              <div class="action-info">
                <div class="action-main">
                  <a-tag :color="getActionColor(record.action)" class="action-tag">
                    <component :is="getActionIcon(record.action)" />
                    {{ getActionLabel(record.action) }}
                  </a-tag>
                  <a-badge v-if="getResultIcon(record.result)" :color="getResultColor(record.result)" class="result-badge">
                    <component :is="getResultIcon(record.result)" />
                  </a-badge>
                </div>
                <div class="action-meta">
                  <a-tag v-if="record.sensitive_operation" color="red" size="small" class="sensitive-tag">
                    <ExclamationCircleOutlined />
                    敏感操作
                  </a-tag>
                  <span v-if="record.duration" class="duration">
                    {{ formatDuration(record.duration) }}
                  </span>
                </div>
              </div>
            </template>
            
            <template v-if="column.key === 'resource'">
              <div class="resource-info">
                <div class="resource-main">
                  <a-tag :color="getResourceColor(record.resource)" class="resource-tag">
                    <component :is="getResourceIcon(record.resource)" />
                    {{ getResourceLabel(record.resource) }}
                  </a-tag>
                </div>
                <div class="resource-meta">
                  <span v-if="record.resource_id" class="resource-id">#{{ record.resource_id }}</span>
                  <span v-if="record.resource_name" class="resource-name">{{ record.resource_name }}</span>
                </div>
              </div>
            </template>
            
            <template v-if="column.key === 'description'">
              <div class="description-content">
                <div class="description-text">{{ record.description }}</div>
                <a-button
                  v-if="record.description.length > 50"
                  type="link"
                  size="small"
                  @click="showDetail(record)"
                >
                  查看详情
                </a-button>
              </div>
            </template>
            
            <template v-if="column.key === 'ip_address'">
              <div class="ip-info">
                <span class="ip-address">{{ record.ip_address }}</span>
                <a-tooltip :title="record.user_agent">
                  <InfoCircleOutlined class="ip-info-icon" />
                </a-tooltip>
              </div>
            </template>
            
            <template v-if="column.key === 'actions'">
              <div class="action-buttons">
                <a-tooltip title="查看详情">
                  <a-button type="text" size="small" @click="showDetail(record)">
                    <EyeOutlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="查看相关日志">
                  <a-button type="text" size="small" @click="viewRelatedLogs(record)">
                    <LinkOutlined />
                  </a-button>
                </a-tooltip>
              </div>
            </template>
          </template>
        </a-table>
      </div>
    </a-card>

    <!-- 日志详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="操作日志详情"
      :width="isMobile ? '95vw' : '900px'"
      :footer="null"
      class="log-detail-modal"
    >
      <div v-if="currentLog" class="detail-content">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">
            <UserOutlined />
            基本信息
          </h3>
          <div class="detail-header">
            <div class="log-user">
              <a-badge :dot="currentLog.sensitive_operation" :color="currentLog.sensitive_operation ? 'red' : 'transparent'">
                <a-avatar :src="currentLog.avatar" :size="60" :style="{border: currentLog.sensitive_operation ? '3px solid #ff4d4f' : '3px solid #d9d9d9'}">
                  {{ currentLog.username?.[0]?.toUpperCase() }}
                </a-avatar>
              </a-badge>
              <div class="user-info">
                <h4>{{ currentLog.username }}</h4>
                <p>
                  <a-tag size="small" color="blue">{{ currentLog.employee_no }}</a-tag>
                  <a-divider type="vertical" />
                  {{ currentLog.department_name }}
                </p>
                <div class="user-tags">
                  <a-tag :color="getActionColor(currentLog.action)">
                    <component :is="getActionIcon(currentLog.action)" />
                    {{ getActionLabel(currentLog.action) }}
                  </a-tag>
                  <a-tag v-if="getResultIcon(currentLog.result)" :color="getResultColor(currentLog.result)">
                    <component :is="getResultIcon(currentLog.result)" />
                    {{ currentLog.result === 'success' ? '成功' : currentLog.result === 'failed' ? '失败' : '警告' }}
                  </a-tag>
                  <a-tag v-if="currentLog.sensitive_operation" color="red">
                    <ExclamationCircleOutlined />
                    敏感操作
                  </a-tag>
                </div>
              </div>
            </div>
            <div class="log-time">
              <div class="time-stats">
                <div class="time-item">
                  <div class="time-label">操作时间</div>
                  <div class="time-value">{{ formatDateTime(currentLog.created_at) }}</div>
                </div>
                <div v-if="currentLog.duration" class="time-item">
                  <div class="time-label">耗时</div>
                  <div class="time-value">{{ formatDuration(currentLog.duration) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作详情 -->
        <div class="detail-section">
          <h3 class="section-title">
            <SettingOutlined />
            操作详情
          </h3>
          <div class="operation-details">
            <div class="detail-item">
              <label>操作对象</label>
              <div class="detail-value">
                <a-tag :color="getResourceColor(currentLog.resource)">
                  <component :is="getResourceIcon(currentLog.resource)" />
                  {{ getResourceLabel(currentLog.resource) }}
                </a-tag>
                <span v-if="currentLog.resource_id" class="resource-id">#{{ currentLog.resource_id }}</span>
                <span v-if="currentLog.resource_name" class="resource-name">{{ currentLog.resource_name }}</span>
              </div>
            </div>
            <div class="detail-item">
              <label>操作描述</label>
              <div class="detail-value description-full">{{ currentLog.description }}</div>
            </div>
            <div v-if="currentLog.error_message" class="detail-item">
              <label>错误信息</label>
              <div class="detail-value error-message">
                <a-alert type="error" :message="currentLog.error_message" show-icon />
              </div>
            </div>
            <div v-if="currentLog.changes" class="detail-item">
              <label>变更内容</label>
              <div class="detail-value">
                <a-collapse ghost>
                  <a-collapse-panel key="changes" header="查看详细变更">
                    <pre class="changes-content">{{ JSON.stringify(currentLog.changes, null, 2) }}</pre>
                  </a-collapse-panel>
                </a-collapse>
              </div>
            </div>
          </div>
        </div>

        <!-- 技术信息 -->
        <div class="detail-section">
          <h3 class="section-title">
            <InfoCircleOutlined />
            技术信息
          </h3>
          <div class="tech-details">
            <div class="detail-grid">
              <div class="detail-item">
                <label>IP地址</label>
                <div class="detail-value ip-value">
                  <a-tag color="purple">{{ currentLog.ip_address }}</a-tag>
                  <span v-if="currentLog.location" class="location">{{ currentLog.location }}</span>
                </div>
              </div>
              <div v-if="currentLog.browser" class="detail-item">
                <label>浏览器</label>
                <div class="detail-value">{{ currentLog.browser }}</div>
              </div>
              <div v-if="currentLog.os" class="detail-item">
                <label>操作系统</label>
                <div class="detail-value">{{ currentLog.os }}</div>
              </div>
              <div v-if="currentLog.device" class="detail-item">
                <label>设备类型</label>
                <div class="detail-value">{{ currentLog.device }}</div>
              </div>
            </div>
            <div v-if="currentLog.user_agent" class="detail-item full-width">
              <label>用户代理</label>
              <div class="detail-value user-agent">
                <a-typography-text copyable>{{ currentLog.user_agent }}</a-typography-text>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <a-button @click="viewRelatedLogs(currentLog)" type="primary">
            <LinkOutlined />
            查看相关日志
          </a-button>
          <a-button @click="detailVisible = false">
            关闭
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- 相关日志弹窗 -->
    <a-modal
      v-model:open="relatedLogsVisible"
      width="1400px"
      :footer="null"
      class="related-logs-modal"
    >
      <template #title>
        <div class="related-title">
          <LinkOutlined />
          <span>相关操作日志</span>
          <a-tag color="blue" v-if="relatedLogs.length">{{ relatedLogs.length }} 条相关记录</a-tag>
        </div>
      </template>
      
      <div class="related-content">
        <!-- 关联说明 -->
        <a-alert
          message="智能关联分析"
          description="系统自动分析了同一用户的时序操作、同一资源的历史操作、以及相同类型的近期操作"
          type="info"
          show-icon
          class="relation-info"
        />
        
        <a-table
          :columns="relatedLogColumns"
          :data-source="relatedLogs"
          :loading="relatedLogsLoading"
          :pagination="{ pageSize: 20, showSizeChanger: true }"
          row-key="id"
          size="small"
          :scroll="{ x: 1200 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'created_at'">
              <div class="time-cell">
                <div>{{ formatDateTime(record.created_at) }}</div>
                <div class="time-diff">{{ getTimeDiff(record.created_at, currentLog?.created_at) }}</div>
              </div>
            </template>
            
            <template v-if="column.key === 'user_info'">
              <div class="mini-user-info">
                <a-avatar size="small" :src="record.avatar">{{ record.username?.[0]?.toUpperCase() }}</a-avatar>
                <span class="username">{{ record.username }}</span>
                <a-tag v-if="record.user_id === currentLog?.user_id" color="green" size="small">同用户</a-tag>
              </div>
            </template>
            
            <template v-if="column.key === 'action'">
              <div class="action-cell">
                <a-tag :color="getActionColor(record.action)" size="small">
                  <component :is="getActionIcon(record.action)" />
                  {{ getActionLabel(record.action) }}
                </a-tag>
                <a-tag v-if="record.action === currentLog?.action" color="orange" size="small">同操作</a-tag>
              </div>
            </template>
            
            <template v-if="column.key === 'resource'">
              <div class="resource-cell">
                <a-tag :color="getResourceColor(record.resource)" size="small">
                  <component :is="getResourceIcon(record.resource)" />
                  {{ getResourceLabel(record.resource) }}
                </a-tag>
                <span v-if="record.resource_id" class="resource-id">#{{ record.resource_id }}</span>
                <a-tag v-if="record.resource === currentLog?.resource && record.resource_id === currentLog?.resource_id" color="purple" size="small">同资源</a-tag>
              </div>
            </template>
            
            <template v-if="column.key === 'relation'">
              <div class="relation-tags">
                <a-tag v-if="record.user_id === currentLog?.user_id" color="green" size="small">
                  <UserOutlined />用户关联
                </a-tag>
                <a-tag v-if="record.resource === currentLog?.resource && record.resource_id === currentLog?.resource_id" color="purple" size="small">
                  <LinkOutlined />资源关联
                </a-tag>
                <a-tag v-if="record.action === currentLog?.action && record.resource === currentLog?.resource" color="orange" size="small">
                  <SettingOutlined />操作关联
                </a-tag>
              </div>
            </template>
            
            <template v-if="column.key === 'actions'">
              <a-button type="link" size="small" @click="showDetail(record)">
                <EyeOutlined />详情
              </a-button>
            </template>
          </template>
        </a-table>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { 
  FileTextOutlined,
  DownloadOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ClearOutlined,
  EyeOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  TeamOutlined,
  ShoppingOutlined,
  BookOutlined,
  SettingOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons-vue'
import { useResponsive } from '@/composables/useResponsive'
import {
  getOperationLogs,
  getOperationLogDetail,
  getDepartmentTree,
  type OperationLog,
  type Department
} from '@/api/system'

// 响应式工具
const { isMobile } = useResponsive()

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const relatedLogsLoading = ref(false)
const detailVisible = ref(false)
const relatedLogsVisible = ref(false)

const logList = ref<OperationLog[]>([])
const relatedLogs = ref<OperationLog[]>([])
const departmentOptions = ref<Department[]>([])
const currentLog = ref<OperationLog | null>(null)

// 统计数据
const logStats = reactive({
  total: 0,
  today: 0,
  sensitive: 0,
  activeUsers: 0
})

// 搜索参数
const searchKeyword = ref('')
const selectedAction = ref<string>()
const selectedResource = ref<string>()
const selectedDepartment = ref<number>()
const dateRange = ref<[Dayjs, Dayjs]>()
const sensitiveOnly = ref(false)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
})

// 表格列定义
const tableColumns = [
  { title: '操作时间', dataIndex: 'created_at', key: 'created_at', width: 140, fixed: 'left' },
  { title: '操作用户', dataIndex: 'user_info', key: 'user_info', width: 200, fixed: 'left' },
  { title: '操作类型', dataIndex: 'action', key: 'action', width: 120 },
  { title: '操作对象', dataIndex: 'resource', key: 'resource', width: 120 },
  { title: '操作描述', dataIndex: 'description', key: 'description', minWidth: 300 },
  { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 140 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' }
]

// 相关日志表格列
const relatedLogColumns = [
  { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
  { title: '用户', dataIndex: 'user_info', key: 'user_info', width: 140 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 140 },
  { title: '对象', dataIndex: 'resource', key: 'resource', width: 150 },
  { title: '关联类型', dataIndex: 'relation', key: 'relation', width: 180 },
  { title: '描述', dataIndex: 'description', key: 'description', minWidth: 200 },
  { title: '操作', key: 'actions', width: 80, fixed: 'right' }
]

// 获取操作图标
const getActionIcon = (action: string) => {
  const iconMap: Record<string, any> = {
    login: LoginOutlined,
    logout: LogoutOutlined,
    create: PlusOutlined,
    update: EditOutlined,
    delete: DeleteOutlined,
    export: ExportOutlined,
    import: ImportOutlined,
    approve: CheckOutlined
  }
  return iconMap[action] || FileTextOutlined
}

// 获取操作颜色
const getActionColor = (action: string) => {
  const colorMap: Record<string, string> = {
    login: 'green',
    logout: 'orange',
    create: 'blue',
    update: 'purple',
    delete: 'red',
    export: 'cyan',
    import: 'lime',
    approve: 'gold'
  }
  return colorMap[action] || 'default'
}

// 获取操作标签
const getActionLabel = (action: string) => {
  const labelMap: Record<string, string> = {
    login: '登录',
    logout: '退出',
    create: '新增',
    update: '修改',
    delete: '删除',
    export: '导出',
    import: '导入',
    approve: '审核'
  }
  return labelMap[action] || action
}

// 获取资源颜色
const getResourceColor = (resource: string) => {
  const colorMap: Record<string, string> = {
    user: 'blue',
    department: 'green',
    customer: 'orange',
    sales: 'purple',
    knowledge: 'cyan',
    script: 'magenta',
    system: 'red'
  }
  return colorMap[resource] || 'default'
}

// 获取资源标签
const getResourceLabel = (resource: string) => {
  const labelMap: Record<string, string> = {
    user: '用户',
    department: '部门',
    customer: '客户',
    sales: '销售',
    knowledge: '知识库',
    script: '脚本',
    system: '系统'
  }
  return labelMap[resource] || resource
}

// 获取资源图标
const getResourceIcon = (resource: string) => {
  const iconMap: Record<string, any> = {
    user: UserOutlined,
    department: TeamOutlined,
    customer: CustomerServiceOutlined,
    sales: ShoppingOutlined,
    knowledge: BookOutlined,
    script: FileTextOutlined,
    system: SettingOutlined
  }
  return iconMap[resource] || FileTextOutlined
}

// 获取结果图标
const getResultIcon = (result?: string) => {
  if (!result) return null
  const iconMap: Record<string, any> = {
    success: CheckCircleOutlined,
    failed: CloseCircleOutlined,
    warning: WarningOutlined
  }
  return iconMap[result] || null
}

// 获取结果颜色
const getResultColor = (result?: string) => {
  if (!result) return 'default'
  const colorMap: Record<string, string> = {
    success: 'green',
    failed: 'red',
    warning: 'orange'
  }
  return colorMap[result] || 'default'
}

// 格式化持续时间
const formatDuration = (duration: number) => {
  if (duration < 1000) {
    return `${duration}ms`
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`
  } else {
    return `${(duration / 60000).toFixed(1)}m`
  }
}

// 计算时间差
const getTimeDiff = (timeA?: string, timeB?: string) => {
  if (!timeA || !timeB) return ''
  
  const diff = dayjs(timeA).valueOf() - dayjs(timeB).valueOf()
  const absDiff = Math.abs(diff)
  const prefix = diff > 0 ? '+' : '-'
  
  if (absDiff < 60000) {
    return `${prefix}${Math.floor(absDiff / 1000)}秒`
  } else if (absDiff < 3600000) {
    return `${prefix}${Math.floor(absDiff / 60000)}分钟`
  } else if (absDiff < 86400000) {
    return `${prefix}${Math.floor(absDiff / 3600000)}小时`
  } else {
    return `${prefix}${Math.floor(absDiff / 86400000)}天`
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('MM-DD')
}

// 格式化时间
const formatTime = (dateStr: string) => {
  return dayjs(dateStr).format('HH:mm:ss')
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

// 加载日志数据
const loadLogs = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value.trim() || undefined,
      action: selectedAction.value,
      resource: selectedResource.value,
      department_id: selectedDepartment.value,
      date_start: dateRange.value?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
      date_end: dateRange.value?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
      sensitive_only: sensitiveOnly.value || undefined,
      page: pagination.current,
      per_page: pagination.pageSize
    }
    
    const response = await getOperationLogs(params)
    logList.value = response.data
    pagination.total = response.total
    
    // 更新统计数据
    updateStats(response.data)
  } catch (error) {
    message.error('加载操作日志失败')
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStats = (logs: OperationLog[]) => {
  logStats.total = logs.length
  logStats.today = logs.filter(log => 
    dayjs(log.created_at).isAfter(dayjs().startOf('day'))
  ).length
  logStats.sensitive = logs.filter(log => log.sensitive_operation).length
  logStats.activeUsers = new Set(logs.map(log => log.user_id)).size
}

// 加载部门选项
const loadDepartments = async () => {
  try {
    const response = await getDepartmentTree()
    // 确保 departmentOptions 是数组
    departmentOptions.value = Array.isArray(response) ? response : (response?.data || [])
  } catch (error) {
    console.error('加载部门数据失败:', error)
    departmentOptions.value = []
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadLogs()
}

// 表格变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadLogs()
}

// 清空筛选
const handleClearFilters = () => {
  searchKeyword.value = ''
  selectedAction.value = undefined
  selectedResource.value = undefined
  selectedDepartment.value = undefined
  dateRange.value = undefined
  sensitiveOnly.value = false
  handleSearch()
}

// 显示详情
const showDetail = async (log: OperationLog) => {
  try {
    currentLog.value = await getOperationLogDetail(log.id)
    detailVisible.value = true
  } catch (error) {
    message.error('加载日志详情失败')
  }
}

// 查看相关日志
const viewRelatedLogs = async (log: OperationLog) => {
  relatedLogsVisible.value = true
  relatedLogsLoading.value = true
  
  try {
    // 构建多种关联查询条件
    const queries = []
    
    // 1. 同一用户在前后1小时的操作
    queries.push({
      user_id: log.user_id,
      date_start: dayjs(log.created_at).subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      date_end: dayjs(log.created_at).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      per_page: 20
    })
    
    // 2. 同一资源对象的所有操作
    if (log.resource_id) {
      queries.push({
        resource: log.resource,
        resource_id: log.resource_id,
        date_start: dayjs(log.created_at).subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        per_page: 20
      })
    }
    
    // 3. 同一类型操作的最近记录
    queries.push({
      action: log.action,
      resource: log.resource,
      date_start: dayjs(log.created_at).subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      per_page: 10
    })
    
    // 并行查询所有相关日志
    const responses = await Promise.all(
      queries.map(params => getOperationLogs(params))
    )
    
    // 合并去重结果
    const allLogs = responses.flatMap(response => response.data)
    const uniqueLogs = Array.from(
      new Map(allLogs.map(item => [item.id, item])).values()
    ).filter(item => item.id !== log.id)
    
    // 按时间排序
    relatedLogs.value = uniqueLogs.sort((a, b) => 
      dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
    ).slice(0, 50) // 限制显示数量
    
  } catch (error) {
    message.error('加载相关日志失败')
  } finally {
    relatedLogsLoading.value = false
  }
}

// 导出日志
const handleExport = async () => {
  exportLoading.value = true
  try {
    // 这里应该调用导出API
    message.info('导出功能开发中...')
  } catch (error) {
    message.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 初始化
onMounted(() => {
  loadLogs()
  loadDepartments()
})
</script>

<style scoped lang="less">
.log-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 16px;
  
  @media (min-width: 768px) {
    padding: 24px;
  }
}

// 页面头部
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .title-icon {
    font-size: 28px;
    color: #1890ff;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #262626;
    
    @media (max-width: 767px) {
      font-size: 20px;
    }
  }
  
  .title-desc {
    color: #8c8c8c;
    font-size: 14px;
    margin-left: 8px;
    
    @media (max-width: 767px) {
      display: none;
    }
  }
}

// 统计仪表盘
.stats-dashboard {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  
  @media (max-width: 767px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
  }
  
  .stat-content {
    flex: 1;
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #262626;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 13px;
      color: #8c8c8c;
    }
  }
}

// 主要内容
.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
}

// 搜索区域
.search-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.search-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
  
  .search-input {
    width: 250px;
    
    @media (max-width: 767px) {
      width: 100%;
    }
  }
  
  .filter-select {
    width: 120px;
    
    @media (max-width: 767px) {
      width: 100%;
    }
  }
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 767px) {
    justify-content: space-between;
  }
}

// 表格相关
.log-time {
  .time-primary {
    font-weight: 500;
    color: #262626;
    margin-bottom: 2px;
  }
  
  .time-secondary {
    font-size: 12px;
    color: #8c8c8c;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .user-details {
    .user-name {
      font-weight: 500;
      color: #262626;
      margin-bottom: 2px;
    }
    
    .user-employee {
      font-size: 11px;
      color: #1890ff;
      font-family: 'Courier New', monospace;
      margin-bottom: 2px;
    }
    
    .user-department {
      font-size: 11px;
      color: #8c8c8c;
    }
  }
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .action-tag {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.resource-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  .resource-id {
    font-size: 11px;
    color: #8c8c8c;
    font-family: 'Courier New', monospace;
  }
}

.description-content {
  .description-text {
    color: #262626;
    line-height: 1.4;
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.ip-info {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .ip-address {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #262626;
  }
  
  .ip-info-icon {
    color: #8c8c8c;
    font-size: 12px;
    cursor: pointer;
    
    &:hover {
      color: #1890ff;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 4px;
}

// 详情弹窗
.detail-content {
  .detail-section {
    margin-bottom: 24px;
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #262626;
      display: flex;
      align-items: center;
      gap: 8px;
      
      .anticon {
        color: #1890ff;
      }
    }
  }
  
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 16px;
    
    @media (max-width: 767px) {
      flex-direction: column;
      gap: 16px;
    }
    
    .log-user {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .user-info {
        h4 {
          margin: 0 0 4px 0;
          font-size: 18px;
          color: #262626;
        }
        
        p {
          margin: 0 0 8px 0;
          color: #8c8c8c;
        }
      }
    }
    
    .log-time {
      text-align: right;
      
      .time-label {
        font-size: 12px;
        color: #8c8c8c;
        margin-bottom: 4px;
      }
      
      .time-value {
        font-size: 14px;
        color: #262626;
        font-weight: 500;
      }
    }
  }
  
  .operation-details,
  .tech-details {
    .detail-item {
      display: flex;
      margin-bottom: 16px;
      
      @media (max-width: 767px) {
        flex-direction: column;
        gap: 4px;
      }
      
      label {
        width: 100px;
        font-size: 14px;
        color: #8c8c8c;
        font-weight: 500;
        flex-shrink: 0;
      }
      
      .detail-value {
        flex: 1;
        font-size: 14px;
        color: #262626;
        
        &.description-full {
          line-height: 1.6;
          white-space: pre-wrap;
        }
        
        &.user-agent {
          word-break: break-all;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
        
        .resource-id {
          margin-left: 8px;
          font-size: 12px;
          color: #8c8c8c;
          font-family: 'Courier New', monospace;
        }
      }
    }
  }
  
  .detail-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
  
  .user-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  
  .time-stats {
    .time-item {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .full-width {
    grid-column: 1 / -1;
  }
  
  .ip-value {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .location {
      color: #8c8c8c;
      font-size: 12px;
    }
  }
  
  .changes-content {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 12px;
    font-size: 12px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .error-message {
    margin-top: 4px;
  }
}

// 操作信息美化
.action-info {
  .action-main {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  
  .action-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .duration {
      font-size: 11px;
      color: #8c8c8c;
      background: #f5f5f5;
      padding: 1px 4px;
      border-radius: 2px;
    }
    
    .sensitive-tag {
      font-size: 11px;
    }
  }
  
  .result-badge {
    .anticon {
      font-size: 12px;
    }
  }
}

.resource-info {
  .resource-main {
    margin-bottom: 4px;
  }
  
  .resource-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .resource-id {
      font-size: 11px;
      color: #8c8c8c;
      font-family: 'Courier New', monospace;
    }
    
    .resource-name {
      font-size: 11px;
      color: #595959;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// 相关日志弹窗
.related-logs-modal {
  .related-title {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .anticon {
      color: #1890ff;
    }
  }
  
  .related-content {
    .relation-info {
      margin-bottom: 16px;
    }
    
    .time-cell {
      .time-diff {
        font-size: 11px;
        color: #8c8c8c;
        margin-top: 2px;
      }
    }
    
    .mini-user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .username {
        font-size: 12px;
        color: #262626;
      }
    }
    
    .action-cell,
    .resource-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .relation-tags {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
  }
}
</style>