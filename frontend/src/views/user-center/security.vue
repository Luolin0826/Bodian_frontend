<template>
  <div class="security-page">
    <a-row :gutter="24">
      <!-- 安全概览 -->
      <a-col :span="16">
        <a-card title="安全概览" :loading="loading">
          <div class="security-overview">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-statistic 
                  title="密码强度" 
                  :value="securitySettings?.password_strength || '-'"
                  :value-style="getPasswordStrengthStyle(securitySettings?.password_strength)"
                />
              </a-col>
              <a-col :span="8">
                <a-statistic 
                  title="登录成功率" 
                  :value="securitySettings?.login_stats.success_rate || 0"
                  suffix="%"
                  :precision="1"
                />
              </a-col>
              <a-col :span="8">
                <a-statistic 
                  title="信任设备数" 
                  :value="securitySettings?.trusted_devices || 0"
                  suffix="台"
                />
              </a-col>
            </a-row>
          </div>
        </a-card>

        <!-- 安全设置 -->
        <a-card title="安全设置" style="margin-top: 24px;">
          <a-list item-layout="horizontal" :data-source="securityItems">
            <template #renderItem="{ item }">
              <a-list-item>
                <template #actions>
                  <a-switch 
                    v-if="item.type === 'switch'"
                    :checked="item.checked"
                    @change="item.onChange"
                    :loading="item.loading"
                  />
                  <a-button 
                    v-else-if="item.type === 'button'"
                    :type="item.buttonType"
                    @click="item.onClick"
                    :loading="item.loading"
                  >
                    {{ item.buttonText }}
                  </a-button>
                </template>
                <a-list-item-meta>
                  <template #avatar>
                    <component :is="item.icon" :style="{ fontSize: '20px', color: item.iconColor }" />
                  </template>
                  <template #title>
                    {{ item.title }}
                  </template>
                  <template #description>
                    {{ item.description }}
                    <div v-if="item.extra" class="setting-extra">
                      {{ item.extra }}
                    </div>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>

        <!-- 活跃会话 -->
        <a-card title="活跃会话" style="margin-top: 24px;">
          <template #extra>
            <a-space>
              <a-button @click="fetchActiveSessions">
                <ReloadOutlined />
                刷新
              </a-button>
              <a-popconfirm
                title="确定要登出所有其他设备的会话吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleLogoutOtherSessions"
              >
                <a-button danger :loading="loggingOutOthers">
                  登出其他设备
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>

          <a-list 
            :data-source="activeSessions" 
            :loading="sessionsLoading"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <template #actions>
                  <span class="session-status">
                    <a-tag v-if="item.is_current" color="green">当前会话</a-tag>
                    <a-popconfirm
                      v-else
                      title="确定要终止此会话吗？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="handleTerminateSession(item.session_id)"
                    >
                      <a-button 
                        type="link" 
                        danger 
                        size="small"
                        :loading="terminatingIds.includes(item.session_id)"
                      >
                        终止会话
                      </a-button>
                    </a-popconfirm>
                  </span>
                </template>
                <a-list-item-meta>
                  <template #avatar>
                    <DesktopOutlined v-if="getDeviceType(item) === 'desktop'" :style="{ fontSize: '20px' }" />
                    <MobileOutlined v-else-if="getDeviceType(item) === 'mobile'" :style="{ fontSize: '20px' }" />
                    <TabletOutlined v-else :style="{ fontSize: '20px' }" />
                  </template>
                  <template #title>
                    <span>{{ item.ip_address }}</span>
                    <a-tag v-if="item.is_current" color="green" size="small" style="margin-left: 8px;">
                      当前
                    </a-tag>
                  </template>
                  <template #description>
                    <div>创建时间: {{ formatDateTime(item.created_at) }}</div>
                    <div>最后活动: {{ formatDateTime(item.last_activity) }}</div>
                    <div>过期时间: {{ formatDateTime(item.expires_at) }}</div>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 安全统计 -->
      <a-col :span="8">
        <a-card title="安全统计" :loading="loading">
          <div class="security-stats">
            <div class="stat-item">
              <div class="stat-label">总登录次数</div>
              <div class="stat-value">{{ securitySettings?.login_stats.total_logins || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">失败登录次数</div>
              <div class="stat-value danger">{{ securitySettings?.login_stats.failed_logins || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">当前失败次数</div>
              <div class="stat-value">{{ securitySettings?.failed_login_attempts || 0 }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">上次修改密码</div>
              <div class="stat-value">{{ formatDateTime(securitySettings?.last_password_change) }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">密码到期天数</div>
              <div class="stat-value">{{ securitySettings?.password_expires_in || 0 }} 天</div>
            </div>
          </div>
        </a-card>

        <a-card title="安全建议" style="margin-top: 24px;">
          <a-list :data-source="securitySuggestions" size="small">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #avatar>
                    <component :is="item.icon" :style="{ color: item.color }" />
                  </template>
                  <template #title>
                    {{ item.text }}
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <!-- 双因素认证禁用确认 -->
    <a-modal
      v-model:open="disableTwoFactorModal"
      title="禁用双因素认证"
      ok-text="确定"
      cancel-text="取消"
      @ok="confirmDisableTwoFactor"
      :confirm-loading="disabling2FA"
    >
      <a-alert 
        type="warning" 
        message="安全警告" 
        description="禁用双因素认证会降低您账户的安全性，请确认您的身份。"
        show-icon
        style="margin-bottom: 16px;"
      />
      
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="当前密码" required>
          <a-input-password 
            v-model:value="disablePassword"
            placeholder="请输入当前密码确认身份"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { 
  SecurityScanOutlined, 
  ReloadOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import {
  getSecuritySettings,
  getActiveSessions,
  logoutOtherSessions,
  terminateSession,
  enableTwoFactor,
  disableTwoFactor,
  type SecuritySettings,
  type ActiveSession
} from '@/api/user-center'
import dayjs from 'dayjs'

const loading = ref(false)
const sessionsLoading = ref(false)
const loggingOutOthers = ref(false)
const disableTwoFactorModal = ref(false)
const disabling2FA = ref(false)
const enabling2FA = ref(false)
const disablePassword = ref('')
const terminatingIds = ref<string[]>([])

const securitySettings = ref<SecuritySettings>()
const activeSessions = ref<ActiveSession[]>([])

const securityItems = computed(() => [
  {
    type: 'switch',
    icon: SecurityScanOutlined,
    iconColor: '#1890ff',
    title: '双因素认证',
    description: '使用身份验证器应用增强账户安全性',
    extra: securitySettings.value?.two_factor_enabled ? '已启用' : '未启用',
    checked: securitySettings.value?.two_factor_enabled || false,
    loading: enabling2FA.value || disabling2FA.value,
    onChange: handleTwoFactorToggle
  }
])

const securitySuggestions = computed(() => {
  const suggestions = []
  
  if (securitySettings.value) {
    const settings = securitySettings.value
    
    if (settings.password_strength === 'weak') {
      suggestions.push({
        icon: ExclamationCircleOutlined,
        color: '#ff4d4f',
        text: '建议使用更强的密码'
      })
    }
    
    if (!settings.two_factor_enabled) {
      suggestions.push({
        icon: InfoCircleOutlined,
        color: '#1890ff',
        text: '启用双因素认证提升安全性'
      })
    }
    
    if (settings.password_expires_in < 30) {
      suggestions.push({
        icon: ExclamationCircleOutlined,
        color: '#faad14',
        text: '密码即将到期，请及时更新'
      })
    }
    
    if (settings.failed_login_attempts > 0) {
      suggestions.push({
        icon: ExclamationCircleOutlined,
        color: '#ff4d4f',
        text: '检测到登录失败记录，请注意账户安全'
      })
    }
    
    if (suggestions.length === 0) {
      suggestions.push({
        icon: CheckCircleOutlined,
        color: '#52c41a',
        text: '您的账户安全性良好'
      })
    }
  }
  
  return suggestions
})

const getPasswordStrengthStyle = (strength?: string) => {
  const colors: Record<string, string> = {
    weak: '#ff4d4f',
    medium: '#faad14',
    strong: '#52c41a'
  }
  return { color: colors[strength || 'weak'] }
}

const getDeviceType = (session: ActiveSession) => {
  // 简单的设备类型判断逻辑
  const fingerprint = session.device_fingerprint?.toLowerCase() || ''
  if (fingerprint.includes('mobile') || fingerprint.includes('phone')) {
    return 'mobile'
  } else if (fingerprint.includes('tablet') || fingerprint.includes('ipad')) {
    return 'tablet'
  }
  return 'desktop'
}

const formatDateTime = (datetime?: string) => {
  return datetime ? dayjs(datetime).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const fetchSecuritySettings = async () => {
  try {
    loading.value = true
    const response = await getSecuritySettings()
    if (response.code === 0) {
      securitySettings.value = response.data
    }
  } catch (error) {
    console.error('获取安全设置失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchActiveSessions = async () => {
  try {
    sessionsLoading.value = true
    const response = await getActiveSessions()
    if (response.code === 0) {
      activeSessions.value = response.data.sessions
    }
  } catch (error) {
    console.error('获取活跃会话失败:', error)
  } finally {
    sessionsLoading.value = false
  }
}

const handleTwoFactorToggle = async (enabled: boolean) => {
  if (enabled) {
    try {
      enabling2FA.value = true
      const response = await enableTwoFactor()
      if (response.code === 0) {
        message.success('双因素认证已启用')
        if (securitySettings.value) {
          securitySettings.value.two_factor_enabled = true
        }
      }
    } catch (error) {
      console.error('启用双因素认证失败:', error)
      // 恢复开关状态
      if (securitySettings.value) {
        securitySettings.value.two_factor_enabled = false
      }
    } finally {
      enabling2FA.value = false
    }
  } else {
    disableTwoFactorModal.value = true
  }
}

const confirmDisableTwoFactor = async () => {
  if (!disablePassword.value) {
    message.error('请输入当前密码')
    return
  }
  
  try {
    disabling2FA.value = true
    const response = await disableTwoFactor(disablePassword.value)
    if (response.code === 0) {
      message.success('双因素认证已禁用')
      if (securitySettings.value) {
        securitySettings.value.two_factor_enabled = false
      }
      disableTwoFactorModal.value = false
      disablePassword.value = ''
    }
  } catch (error) {
    console.error('禁用双因素认证失败:', error)
  } finally {
    disabling2FA.value = false
  }
}

const handleLogoutOtherSessions = async () => {
  try {
    loggingOutOthers.value = true
    const response = await logoutOtherSessions()
    if (response.code === 0) {
      message.success(`已登出 ${response.data.logged_out_sessions} 个其他会话`)
      await fetchActiveSessions()
    }
  } catch (error) {
    console.error('登出其他会话失败:', error)
  } finally {
    loggingOutOthers.value = false
  }
}

const handleTerminateSession = async (sessionId: string) => {
  try {
    terminatingIds.value.push(sessionId)
    const response = await terminateSession(sessionId)
    if (response.code === 0) {
      message.success('会话已终止')
      await fetchActiveSessions()
    }
  } catch (error) {
    console.error('终止会话失败:', error)
  } finally {
    terminatingIds.value = terminatingIds.value.filter(id => id !== sessionId)
  }
}

onMounted(() => {
  fetchSecuritySettings()
  fetchActiveSessions()
})
</script>

<style scoped>
.security-page {
  padding: 24px;
}

.security-overview {
  padding: 16px 0;
}

.security-stats {
  padding: 8px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-weight: 500;
  color: #262626;
}

.stat-value.danger {
  color: #ff4d4f;
}

.setting-extra {
  color: #8c8c8c;
  font-size: 12px;
  margin-top: 4px;
}

.session-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>