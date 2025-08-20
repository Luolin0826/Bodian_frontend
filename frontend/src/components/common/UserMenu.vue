<template>
  <div class="user-menu">
    <!-- 通知铃铛 -->
    <a-badge :count="unreadCount" :offset="[8, -2]" class="notification-badge">
      <a-button 
        type="text" 
        size="large" 
        @click="goToNotifications"
        class="notification-btn"
      >
        <BellOutlined />
      </a-button>
    </a-badge>

    <!-- 用户下拉菜单 -->
    <a-dropdown placement="bottomRight" :trigger="['click']">
      <div class="user-avatar-section">
        <a-avatar :size="32" :src="userInfo?.avatar" class="user-avatar">
          <template #icon><UserOutlined /></template>
        </a-avatar>
        <span class="user-name">{{ userInfo?.real_name || userInfo?.username }}</span>
        <DownOutlined class="dropdown-icon" />
      </div>
      
      <template #overlay>
        <a-menu class="user-menu-dropdown">
          <a-menu-item key="profile" @click="goToProfile">
            <UserOutlined />
            <span>个人信息</span>
          </a-menu-item>
          
          <a-menu-item key="preferences" @click="goToPreferences">
            <SettingOutlined />
            <span>偏好设置</span>
          </a-menu-item>
          
          <a-menu-item key="security" @click="goToSecurity">
            <SafetyCertificateOutlined />
            <span>安全设置</span>
          </a-menu-item>
          
          <a-menu-item key="login-logs" @click="goToLoginLogs">
            <HistoryOutlined />
            <span>登录日志</span>
          </a-menu-item>
          
          <a-menu-divider />
          
          <a-menu-item key="logout" @click="handleLogout" class="logout-item">
            <LogoutOutlined />
            <span>退出登录</span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  BellOutlined,
  UserOutlined,
  DownOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { getUnreadCount } from '@/api/user-center'

const router = useRouter()
const userStore = useUserStore()

const unreadCount = ref(0)
const userInfo = ref(userStore.userInfo)

// 定时器ID，用于定时获取未读消息数
let unreadCountTimer: NodeJS.Timeout | null = null

const fetchUnreadCount = async () => {
  try {
    const response = await getUnreadCount()
    if (response.code === 0) {
      unreadCount.value = response.data.total_unread
    }
  } catch (error) {
    console.error('获取未读消息数失败:', error)
  }
}

const startUnreadCountTimer = () => {
  // 立即获取一次
  fetchUnreadCount()
  
  // 每30秒更新一次未读消息数
  unreadCountTimer = setInterval(fetchUnreadCount, 30000)
}

const stopUnreadCountTimer = () => {
  if (unreadCountTimer) {
    clearInterval(unreadCountTimer)
    unreadCountTimer = null
  }
}

const goToNotifications = () => {
  router.push('/user-center/notifications')
}

const goToProfile = () => {
  router.push('/user-center/profile')
}

const goToPreferences = () => {
  router.push('/user-center/preferences')
}

const goToSecurity = () => {
  router.push('/user-center/security')
}

const goToLoginLogs = () => {
  router.push('/user-center/login-logs')
}

const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '您确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await userStore.logout()
        message.success('已退出登录')
        router.push('/login')
      } catch (error) {
        console.error('退出登录失败:', error)
        message.error('退出登录失败')
      }
    }
  })
}

onMounted(() => {
  startUnreadCountTimer()
})

onUnmounted(() => {
  stopUnreadCountTimer()
})

// 监听用户信息变化
userStore.$subscribe((_mutation, state) => {
  userInfo.value = state.userInfo
})
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.notification-badge {
  display: flex;
  align-items: center;
}

.notification-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.65);
  transition: color 0.3s;
}

.notification-btn:hover {
  color: #1890ff;
}

.user-avatar-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-avatar-section:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  transition: transform 0.3s;
}

.user-menu-dropdown {
  min-width: 160px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-menu-dropdown :deep(.ant-menu-item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  transition: all 0.3s;
}

.user-menu-dropdown :deep(.ant-menu-item:hover) {
  background-color: #f5f5f5;
}

.logout-item {
  color: #ff4d4f !important;
}

.logout-item:hover {
  background-color: #fff2f0 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-name {
    display: none;
  }
  
  .user-menu {
    gap: 8px;
  }
}
</style>