<template>
  <div class="user-center-index">
    <!-- 用户信息头部 -->
    <div class="header-section">
      <a-card class="user-header-card">
        <div class="user-header-content">
          <div class="user-avatar-section">
            <AvatarSelector 
              v-model="currentAvatar" 
              :size="80" 
              :editable="true"
              @change="handleAvatarChange"
            />
            <div class="user-status">
              <a-badge status="processing" text="在线" />
            </div>
          </div>
          <div class="user-info-section">
            <h1 class="user-name">{{ userInfo?.real_name || userInfo?.username }}</h1>
            <div class="user-meta">
              <a-tag color="blue">{{ userInfo?.role_display_name }}</a-tag>
              <a-tag color="green">{{ userInfo?.department_name }}</a-tag>
            </div>
            <p class="last-login">最后登录：{{ formatDateTime(userInfo?.last_login) }}</p>
          </div>
          <div class="user-stats-section">
            <div class="stat-item">
              <span class="stat-number">{{ stats.totalLogins }}</span>
              <span class="stat-label">总登录</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.activeSessions }}</span>
              <span class="stat-label">活跃会话</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ stats.securityScore }}</span>
              <span class="stat-label">安全评分</span>
            </div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions-section">
      <a-card title="快速操作" class="section-card">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12" v-for="item in coreMenuItems" :key="item.key">
            <div class="quick-action-item" @click="navigateTo(item.path)">
              <div class="action-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
                <component :is="item.icon" />
              </div>
              <div class="action-content">
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </div>
              <div class="action-arrow">
                <RightOutlined />
              </div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 数据概览 -->
    <div class="overview-section">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :lg="14">
          <a-card title="登录统计" class="section-card stats-card">
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-icon success">
                  <CheckCircleOutlined />
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ loginStats?.stats?.total_logins || 0 }}</span>
                  <span class="stat-title">总登录次数</span>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon warning">
                  <ExclamationCircleOutlined />
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ loginStats?.stats?.failed_logins || 0 }}</span>
                  <span class="stat-title">失败次数</span>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon info">
                  <PieChartOutlined />
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ loginStats?.stats?.success_rate || 0 }}%</span>
                  <span class="stat-title">成功率</span>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon primary">
                  <GlobalOutlined />
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ loginStats?.stats?.unique_ips || 0 }}</span>
                  <span class="stat-title">不同IP</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <a-button type="link" @click="navigateTo('/user-center/login-logs')" class="view-more-btn">
                查看详细日志 <RightOutlined />
              </a-button>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="10">
          <a-card title="安全状态" class="section-card security-card">
            <div class="security-items">
              <div class="security-item">
                <div class="security-icon">
                  <LockOutlined />
                </div>
                <div class="security-content">
                  <span class="security-title">密码强度</span>
                  <a-tag :color="getPasswordStrengthColor(securitySettings?.password_strength)">
                    {{ getPasswordStrengthText(securitySettings?.password_strength) }}
                  </a-tag>
                </div>
              </div>
              <div class="security-item">
                <div class="security-icon">
                  <SafetyCertificateOutlined />
                </div>
                <div class="security-content">
                  <span class="security-title">双因素认证</span>
                  <a-tag :color="securitySettings?.two_factor_enabled ? 'green' : 'orange'">
                    {{ securitySettings?.two_factor_enabled ? '已启用' : '未启用' }}
                  </a-tag>
                </div>
              </div>
              <div class="security-item">
                <div class="security-icon">
                  <MobileOutlined />
                </div>
                <div class="security-content">
                  <span class="security-title">在线设备</span>
                  <span class="device-count">{{ activeSessions.length }} 台</span>
                </div>
              </div>
            </div>
            <div class="security-score">
              <div class="score-circle">
                <span class="score-number" :style="{ color: getScoreColor(stats.securityScore) }">
                  {{ stats.securityScore }}
                </span>
                <span class="score-label">安全评分</span>
              </div>
            </div>
            <div class="card-footer">
              <a-button type="link" @click="navigateTo('/user-center/security')" class="view-more-btn">
                安全设置 <RightOutlined />
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 更多功能 -->
    <div class="more-functions-section">
      <a-card title="更多功能" class="section-card">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="8" v-for="item in moreMenuItems" :key="item.key">
            <div class="more-function-item" @click="navigateTo(item.path)">
              <div class="function-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
                <component :is="item.icon" />
              </div>
              <span class="function-title">{{ item.title }}</span>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>


    <!-- 最近活动 -->
    <div class="recent-activities-section">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :lg="12">
          <a-card title="最近通知" class="section-card activity-card">
            <div class="activity-list">
              <div v-if="recentNotifications.length === 0" class="empty-state">
                <BellOutlined class="empty-icon" />
                <span>暂无通知</span>
              </div>
              <div v-else class="notification-item" v-for="item in recentNotifications" :key="item.id">
                <div class="notification-dot"></div>
                <div class="notification-content">
                  <div class="notification-title">{{ item.title }}</div>
                  <div class="notification-time">{{ formatRelativeTime(item.created_at) }}</div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <a-button type="link" @click="goToNotifications" class="view-more-btn">
                查看全部通知 <RightOutlined />
              </a-button>
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="12">
          <a-card title="最近登录" class="section-card activity-card">
            <div class="activity-list">
              <div v-if="recentLogins.length === 0" class="empty-state">
                <HistoryOutlined class="empty-icon" />
                <span>暂无记录</span>
              </div>
              <div v-else class="login-item" v-for="item in recentLogins" :key="item.id">
                <div class="login-status" :class="item.status">
                  <CheckCircleOutlined v-if="item.status === 'success'" />
                  <CloseCircleOutlined v-else />
                </div>
                <div class="login-content">
                  <div class="login-info">
                    <span class="login-ip">{{ item.ip_address }}</span>
                    <a-tag 
                      :color="item.status === 'success' ? 'green' : 'red'" 
                      size="small"
                    >
                      {{ item.status === 'success' ? '成功' : '失败' }}
                    </a-tag>
                  </div>
                  <div class="login-details">
                    {{ formatDateTime(item.login_time) }} | {{ item.location || '未知位置' }}
                  </div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <a-button type="link" @click="goToLoginLogs" class="view-more-btn">
                查看登录历史 <RightOutlined />
              </a-button>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  UserOutlined, 
  SettingOutlined, 
  BellOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PieChartOutlined,
  GlobalOutlined,
  LockOutlined,
  MobileOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import AvatarSelector from '@/components/AvatarSelector.vue'
import { useUserAvatar } from '@/composables/useUserAvatar'
import { 
  getUnreadCount, 
  getNotifications,
  getLoginLogs,
  getLoginStats,
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
const avatar = useUserAvatar()
const userInfo = ref(userStore.userInfo || {})

// 当前头像值（用于AvatarSelector）
const currentAvatar = ref(userStore.userInfo?.avatar || '')

const stats = ref({
  unreadNotifications: 0,
  totalLogins: 0,
  activeSessions: 0,
  securityScore: 85
})

const loginStats = ref<any>(null)
const securitySettings = ref<any>(null)
const activeSessions = ref<any[]>([])
const recentNotifications = ref<any[]>([])
const recentLogins = ref<any[]>([])

// 核心功能菜单
const coreMenuItems = [
  {
    key: 'profile',
    title: '个人信息',
    description: '管理个人基本信息和头像',
    icon: UserOutlined,
    color: '#1890ff',
    path: '/user-center/profile'
  },
  {
    key: 'security',
    title: '安全设置',
    description: '账户安全和会话管理',
    icon: SafetyCertificateOutlined,
    color: '#f5222d',
    path: '/user-center/security'
  }
]

// 更多功能菜单
const moreMenuItems = [
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

// 获取密码强度颜色
const getPasswordStrengthColor = (strength: string) => {
  switch (strength) {
    case 'strong': return 'green'
    case 'medium': return 'orange'  
    case 'weak': return 'red'
    default: return 'default'
  }
}

// 获取密码强度文本
const getPasswordStrengthText = (strength: string) => {
  switch (strength) {
    case 'strong': return '强'
    case 'medium': return '中等'
    case 'weak': return '弱'
    default: return '未知'
  }
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

const handleAvatarChange = async (newAvatar: string) => {
  try {
    // 调用API更新用户头像
    const { updateUserProfile } = await import('@/api/user-center')
    await updateUserProfile({ avatar: newAvatar })
    
    // 更新全局用户状态
    userStore.updateAvatar(newAvatar)
    
    // 更新本地状态
    currentAvatar.value = newAvatar
    if (userInfo.value) {
      userInfo.value.avatar = newAvatar
    }
    
    console.log('✅ 用户中心概览头像更新:', newAvatar)
    message.success('头像更新成功')
  } catch (error) {
    console.error('头像更新失败:', error)
    message.error('头像更新失败')
  }
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

    // 获取登录统计
    const loginStatsResponse = await getLoginStats({ days: 30 })
    if (loginStatsResponse) {
      loginStats.value = loginStatsResponse
      stats.value.totalLogins = loginStatsResponse.stats?.total_logins || 0
    }

    // 获取最近登录记录
    const logsResponse = await getLoginLogs({ page_size: 3 })
    if (logsResponse.login_logs) {
      recentLogins.value = logsResponse.login_logs
    }

    // 获取活跃会话数
    const sessionsResponse = await getActiveSessions()
    if (sessionsResponse.code === 0) {
      activeSessions.value = sessionsResponse.data.sessions
      stats.value.activeSessions = sessionsResponse.data.total
    }

    // 获取安全设置（计算安全评分）
    const securityResponse = await getSecuritySettings()
    if (securityResponse.code === 0) {
      securitySettings.value = securityResponse.data
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
  currentAvatar.value = state.userInfo?.avatar || ''
  console.log('🔄 用户中心概览监听到userStore变化:', state.userInfo?.avatar)
})
</script>

<style scoped>
.user-center-index {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* 头部区域 */
.header-section {
  margin-bottom: 32px;
}

.user-header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
  border-radius: 16px;
  overflow: hidden;
}

.user-header-card :deep(.ant-card-body) {
  padding: 32px;
  background: transparent;
}

.user-header-content {
  display: flex;
  align-items: center;
  gap: 32px;
  color: white;
}

.user-avatar-section {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  border: 4px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.user-status {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: white;
  border-radius: 20px;
  padding: 4px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-status :deep(.ant-badge) {
  color: #52c41a;
}

.user-info-section {
  flex: 1;
}

.user-name {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 600;
  color: white;
}

.user-meta {
  margin-bottom: 8px;
}

.user-meta .ant-tag {
  border: none;
  border-radius: 20px;
  margin-right: 8px;
}

.last-login {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.user-stats-section {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

/* 节段卡片通用样式 */
.section-card {
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
  border: none;
  overflow: hidden;
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.section-card :deep(.ant-card-head) {
  border-bottom: 1px solid #f0f2f5;
  padding: 20px 24px 16px;
}

.section-card :deep(.ant-card-head-title) {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.section-card :deep(.ant-card-body) {
  padding: 24px;
}

/* 快速操作区域 */
.quick-actions-section {
  margin-bottom: 32px;
}

.quick-action-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-action-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.1);
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 16px;
}

.action-content {
  flex: 1;
}

.action-content h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.action-content p {
  margin: 0;
  font-size: 14px;
  color: #8c8c8c;
}

.action-arrow {
  color: #bfbfbf;
  font-size: 14px;
}

/* 数据概览区域 */
.overview-section {
  margin-bottom: 32px;
}

.stats-card .stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-icon.success {
  background: #f6ffed;
  color: #52c41a;
}

.stat-icon.warning {
  background: #fff7e6;
  color: #faad14;
}

.stat-icon.info {
  background: #e6f7ff;
  color: #1890ff;
}

.stat-icon.primary {
  background: #f0f5ff;
  color: #2f54eb;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  line-height: 1;
}

.stat-title {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

/* 安全卡片 */
.security-card .security-items {
  margin-bottom: 24px;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.security-item:last-child {
  border-bottom: none;
}

.security-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c8c8c;
  font-size: 14px;
  margin-right: 12px;
}

.security-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.security-title {
  font-size: 14px;
  color: #262626;
}

.device-count {
  font-size: 14px;
  font-weight: 500;
  color: #1890ff;
}

.security-score {
  text-align: center;
  margin-bottom: 20px;
}

.score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border: 2px solid #d9f4ff;
}

.score-number {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

/* 更多功能区域 */
.more-functions-section {
  margin-bottom: 32px;
}

.more-function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  background: white;
  border: 1px solid #f0f2f5;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.more-function-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.1);
  transform: translateY(-2px);
}

.function-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 12px;
}

.function-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

/* 最近活动区域 */
.recent-activities-section {
  margin-bottom: 32px;
}

.activity-card .activity-list {
  margin-bottom: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #bfbfbf;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.notification-item, .login-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.notification-item:last-child, .login-item:last-child {
  border-bottom: none;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890ff;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-content, .login-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  color: #262626;
  margin-bottom: 4px;
}

.notification-time, .login-details {
  font-size: 12px;
  color: #8c8c8c;
}

.login-status {
  margin-right: 12px;
  flex-shrink: 0;
}

.login-status.success {
  color: #52c41a;
}

.login-status.failed {
  color: #ff4d4f;
}

.login-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.login-ip {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

/* 卡片底部 */
.card-footer {
  text-align: center;
  border-top: 1px solid #f0f2f5;
  margin: 20px -24px -24px;
  padding: 16px 24px;
  background: #fafafa;
}

.view-more-btn {
  color: #1890ff;
  font-size: 14px;
  padding: 0;
  height: auto;
}

.view-more-btn:hover {
  color: #40a9ff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .user-stats-section {
    gap: 20px;
  }
  
  .stat-number {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .user-center-index {
    padding: 16px;
  }
  
  .user-header-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .user-info-section {
    order: 2;
  }
  
  .user-stats-section {
    order: 3;
    justify-content: center;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr !important;
  }
  
  .section-card :deep(.ant-card-body) {
    padding: 16px;
  }
  
  .quick-action-item, .more-function-item {
    padding: 16px;
  }
  
  .action-icon, .function-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .card-footer {
    margin: 16px -16px -16px;
    padding: 12px 16px;
  }
}

@media (max-width: 576px) {
  .user-name {
    font-size: 24px;
  }
  
  .stat-item {
    gap: 8px;
  }
  
  .stat-number {
    font-size: 18px;
  }
  
  .quick-action-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .action-content {
    margin: 0;
  }
  
  .action-arrow {
    display: none;
  }
}
</style>