<template>
  <div class="user-center-index">
    <a-card title="用户中心" class="header-card">
      <template #extra>
        <a-avatar :size="64" :src="userInfo?.avatar" class="user-avatar">
          <template #icon><UserOutlined /></template>
        </a-avatar>
      </template>
      
      <div class="user-intro">
        <h2>欢迎，{{ userInfo?.real_name || userInfo?.username }}</h2>
        <p class="user-desc">
          角色：{{ userInfo?.role_display_name }} | 
          部门：{{ userInfo?.department_name }} | 
          最后登录：{{ formatDateTime(userInfo?.last_login) }}
        </p>
      </div>
    </a-card>

    <a-row :gutter="[24, 24]" style="margin-top: 24px;">
      <a-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in menuItems" :key="item.key">
        <a-card 
          :hoverable="true"
          class="menu-card"
          @click="navigateTo(item.path)"
        >
          <div class="menu-content">
            <div class="menu-icon" :style="{ color: item.color }">
              <component :is="item.icon" />
            </div>
            <div class="menu-info">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 快速统计 -->
    <a-row :gutter="24" style="margin-top: 32px;">
      <a-col :span="24">
        <a-card title="快速统计">
          <a-row :gutter="16">
            <a-col :span="6">
              <a-statistic 
                title="未读通知" 
                :value="stats.unreadNotifications"
                :value-style="{ color: '#cf1322' }"
                prefix="🔔"
              />
            </a-col>
            <a-col :span="6">
              <a-statistic 
                title="登录次数" 
                :value="stats.totalLogins"
                prefix="📊"
              />
            </a-col>
            <a-col :span="6">
              <a-statistic 
                title="活跃会话" 
                :value="stats.activeSessions"
                prefix="🔗"
              />
            </a-col>
            <a-col :span="6">
              <a-statistic 
                title="安全评分" 
                :value="stats.securityScore"
                :value-style="{ color: getScoreColor(stats.securityScore) }"
                suffix="分"
                prefix="🛡️"
              />
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>

    <!-- 最近活动 -->
    <a-row :gutter="24" style="margin-top: 24px;">
      <a-col :span="12">
        <a-card title="最近通知" size="small">
          <a-list 
            :data-source="recentNotifications" 
            :locale="{ emptyText: '暂无通知' }"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a @click="goToNotifications">{{ item.title }}</a>
                  </template>
                  <template #description>
                    {{ formatRelativeTime(item.created_at) }}
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
          <div class="list-footer">
            <a @click="goToNotifications">查看全部 →</a>
          </div>
        </a-card>
      </a-col>

      <a-col :span="12">
        <a-card title="最近登录" size="small">
          <a-list 
            :data-source="recentLogins" 
            :locale="{ emptyText: '暂无记录' }"
            size="small"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <span>{{ item.ip_address }}</span>
                    <a-tag 
                      :color="item.status === 'success' ? 'green' : 'red'" 
                      size="small"
                      style="margin-left: 8px;"
                    >
                      {{ item.status === 'success' ? '成功' : '失败' }}
                    </a-tag>
                  </template>
                  <template #description>
                    {{ formatDateTime(item.login_time) }} | {{ item.location }}
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
          <div class="list-footer">
            <a @click="goToLoginLogs">查看全部 →</a>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  UserOutlined, 
  SettingOutlined, 
  BellOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { 
  getUnreadCount, 
  getNotifications,
  getLoginLogs,
  getSecuritySettings,
  getActiveSessions
} from '@/api/user-center'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const router = useRouter()
const userStore = useUserStore()
const userInfo = ref(userStore.userInfo)

const stats = ref({
  unreadNotifications: 0,
  totalLogins: 0,
  activeSessions: 0,
  securityScore: 85
})

const recentNotifications = ref<any[]>([])
const recentLogins = ref<any[]>([])

const menuItems = [
  {
    key: 'profile',
    title: '个人信息',
    description: '管理个人基本信息和头像',
    icon: UserOutlined,
    color: '#1890ff',
    path: '/user-center/profile'
  },
  {
    key: 'preferences',
    title: '偏好设置',
    description: '个性化界面和通知设置',
    icon: SettingOutlined,
    color: '#52c41a',
    path: '/user-center/preferences'
  },
  {
    key: 'notifications',
    title: '消息通知',
    description: '查看和管理系统通知',
    icon: BellOutlined,
    color: '#faad14',
    path: '/user-center/notifications'
  },
  {
    key: 'security',
    title: '安全设置',
    description: '账户安全和会话管理',
    icon: SafetyCertificateOutlined,
    color: '#f5222d',
    path: '/user-center/security'
  },
  {
    key: 'login-logs',
    title: '登录日志',
    description: '查看登录历史记录',
    icon: HistoryOutlined,
    color: '#722ed1',
    path: '/user-center/login-logs'
  }
]

const formatDateTime = (datetime?: string) => {
  return datetime ? dayjs(datetime).format('YYYY-MM-DD HH:mm') : '-'
}

const formatRelativeTime = (datetime: string) => {
  return dayjs(datetime).fromNow()
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#52c41a'
  if (score >= 70) return '#faad14'
  return '#f5222d'
}

const navigateTo = (path: string) => {
  router.push(path)
}

const goToNotifications = () => {
  router.push('/user-center/notifications')
}

const goToLoginLogs = () => {
  router.push('/user-center/login-logs')
}

const fetchDashboardData = async () => {
  try {
    // 获取未读通知数
    const unreadResponse = await getUnreadCount()
    if (unreadResponse.code === 0) {
      stats.value.unreadNotifications = unreadResponse.data.total_unread
    }

    // 获取最近通知
    const notificationsResponse = await getNotifications({ per_page: 3 })
    if (notificationsResponse.code === 0) {
      recentNotifications.value = notificationsResponse.data.notifications
    }

    // 获取最近登录记录
    const logsResponse = await getLoginLogs({ per_page: 3 })
    if (logsResponse.code === 0) {
      recentLogins.value = logsResponse.data.logs
      stats.value.totalLogins = logsResponse.data.total
    }

    // 获取活跃会话数
    const sessionsResponse = await getActiveSessions()
    if (sessionsResponse.code === 0) {
      stats.value.activeSessions = sessionsResponse.data.total
    }

    // 获取安全设置（计算安全评分）
    const securityResponse = await getSecuritySettings()
    if (securityResponse.code === 0) {
      const security = securityResponse.data
      let score = 60 // 基础分
      if (security.two_factor_enabled) score += 20
      if (security.password_strength === 'strong') score += 15
      else if (security.password_strength === 'medium') score += 10
      if (security.failed_login_attempts === 0) score += 5
      stats.value.securityScore = Math.min(100, score)
    }
  } catch (error) {
    console.error('获取用户中心数据失败:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
})

// 监听用户信息变化
userStore.$subscribe((_mutation, state) => {
  userInfo.value = state.userInfo
})
</script>

<style scoped>
.user-center-index {
  padding: 24px;
}

.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-card :deep(.ant-card-head),
.header-card :deep(.ant-card-body) {
  background: transparent;
  color: white;
}

.header-card :deep(.ant-card-head-title) {
  color: white;
}

.user-intro h2 {
  color: white;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.user-desc {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-size: 14px;
}

.menu-card {
  height: 120px;
  transition: all 0.3s;
}

.menu-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.menu-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.menu-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.menu-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.menu-info p {
  margin: 0;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}

.list-footer {
  text-align: center;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 8px;
}

.list-footer a {
  color: #1890ff;
  font-size: 12px;
  text-decoration: none;
}

.list-footer a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-center-index {
    padding: 16px;
  }
  
  .menu-card {
    height: 100px;
  }
  
  .menu-content {
    gap: 12px;
  }
  
  .menu-icon {
    font-size: 24px;
  }
  
  .menu-info h3 {
    font-size: 14px;
  }
  
  .menu-info p {
    font-size: 11px;
  }
}
</style>