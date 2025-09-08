<template>
  <div class="user-preferences">
    <a-card title="偏好设置" :loading="loading">
      <template #extra>
        <a-space>
          <a-button @click="handleReset" :loading="resetting">
            <ReloadOutlined />
            重置为默认
          </a-button>
          <a-button type="primary" @click="handleSave" :loading="saving">
            <SaveOutlined />
            保存设置
          </a-button>
        </a-space>
      </template>

      <a-tabs>
        <!-- 界面设置 -->
        <a-tab-pane key="appearance" tab="界面设置">
          <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-form-item label="主题模式" name="theme_mode">
              <a-radio-group v-model:value="preferences.appearance.theme_mode">
                <a-radio value="light">浅色主题</a-radio>
                <a-radio value="dark">深色主题</a-radio>
              </a-radio-group>
            </a-form-item>

            <a-form-item label="侧边栏" name="sidebar_collapsed">
              <a-switch 
                v-model:checked="preferences.appearance.sidebar_collapsed"
                checked-children="收起"
                un-checked-children="展开"
              />
            </a-form-item>

            <a-form-item label="面包屑导航" name="show_breadcrumb">
              <a-switch 
                v-model:checked="preferences.appearance.show_breadcrumb"
                checked-children="显示"
                un-checked-children="隐藏"
              />
            </a-form-item>

            <a-form-item label="语言" name="language">
              <a-select v-model:value="preferences.appearance.language" style="width: 200px">
                <a-select-option value="zh-CN">简体中文</a-select-option>
                <a-select-option value="en-US">English</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="字体大小" name="font_size">
              <a-radio-group v-model:value="preferences.appearance.font_size">
                <a-radio value="small">小</a-radio>
                <a-radio value="medium">中</a-radio>
                <a-radio value="large">大</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 通知设置 -->
        <a-tab-pane key="notification" tab="通知设置">
          <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-form-item label="系统通知" name="system_notification">
              <a-switch 
                v-model:checked="preferences.notification.system_notification"
                checked-children="开启"
                un-checked-children="关闭"
              />
              <div class="setting-desc">接收系统重要通知和公告</div>
            </a-form-item>

            <a-form-item label="邮件通知" name="email_notification">
              <a-switch 
                v-model:checked="preferences.notification.email_notification"
                checked-children="开启"
                un-checked-children="关闭"
              />
              <div class="setting-desc">通过邮件接收通知</div>
            </a-form-item>

            <a-form-item label="声音提醒" name="sound_notification">
              <a-switch 
                v-model:checked="preferences.notification.sound_notification"
                checked-children="开启"
                un-checked-children="关闭"
              />
              <div class="setting-desc">新消息时播放提示音</div>
            </a-form-item>

            <a-form-item label="浏览器通知" name="browser_notification">
              <a-switch 
                v-model:checked="preferences.notification.browser_notification"
                checked-children="开启"
                un-checked-children="关闭"
              />
              <div class="setting-desc">在浏览器中显示桌面通知</div>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 安全设置 -->
        <a-tab-pane key="security" tab="安全设置">
          <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-form-item label="自动登出时间" name="auto_logout_time">
              <a-select v-model:value="preferences.security.auto_logout_time" style="width: 200px">
                <a-select-option :value="30">30分钟</a-select-option>
                <a-select-option :value="60">1小时</a-select-option>
                <a-select-option :value="120">2小时</a-select-option>
                <a-select-option :value="240">4小时</a-select-option>
                <a-select-option :value="480">8小时</a-select-option>
              </a-select>
              <div class="setting-desc">无操作自动登出时间</div>
            </a-form-item>

            <a-form-item label="会话超时" name="session_timeout">
              <a-select v-model:value="preferences.security.session_timeout" style="width: 200px">
                <a-select-option :value="15">15分钟</a-select-option>
                <a-select-option :value="30">30分钟</a-select-option>
                <a-select-option :value="60">1小时</a-select-option>
                <a-select-option :value="120">2小时</a-select-option>
              </a-select>
              <div class="setting-desc">会话超时时间</div>
            </a-form-item>

            <a-form-item label="双因素认证" name="enable_two_factor">
              <a-switch 
                v-model:checked="preferences.security.enable_two_factor"
                checked-children="启用"
                un-checked-children="禁用"
                @change="(checked: boolean) => handleTwoFactorChange(checked)"
              />
              <div class="setting-desc">增强账户安全性</div>
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 工作区设置 -->
        <a-tab-pane key="workspace" tab="工作区设置">
          <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
            <a-form-item label="默认首页" name="default_page">
              <a-select v-model:value="preferences.workspace.default_page" style="width: 300px">
                <a-select-option value="/dashboard">仪表盘</a-select-option>
                <a-select-option value="/customer/list">客户管理</a-select-option>
                <a-select-option value="/sales/stats">销售统计</a-select-option>
                <a-select-option value="/knowledge">知识库</a-select-option>
              </a-select>
              <div class="setting-desc">登录后默认跳转的页面</div>
            </a-form-item>

            <a-form-item label="分页大小" name="items_per_page">
              <a-select v-model:value="preferences.workspace.items_per_page" style="width: 200px">
                <a-select-option :value="10">10条/页</a-select-option>
                <a-select-option :value="20">20条/页</a-select-option>
                <a-select-option :value="50">50条/页</a-select-option>
                <a-select-option :value="100">100条/页</a-select-option>
                <a-select-option :value="300">300条/页</a-select-option>
              </a-select>
              <div class="setting-desc">列表页面默认显示条数</div>
            </a-form-item>

            <a-form-item label="日期格式" name="date_format">
              <a-select v-model:value="preferences.workspace.date_format" style="width: 200px">
                <a-select-option value="YYYY-MM-DD">2024-01-15</a-select-option>
                <a-select-option value="YYYY/MM/DD">2024/01/15</a-select-option>
                <a-select-option value="DD-MM-YYYY">15-01-2024</a-select-option>
                <a-select-option value="DD/MM/YYYY">15/01/2024</a-select-option>
              </a-select>
              <div class="setting-desc">系统中日期的显示格式</div>
            </a-form-item>

            <a-form-item label="时间格式" name="time_format">
              <a-radio-group v-model:value="preferences.workspace.time_format">
                <a-radio value="24h">24小时制</a-radio>
                <a-radio value="12h">12小时制</a-radio>
              </a-radio-group>
              <div class="setting-desc">系统中时间的显示格式</div>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 双因素认证设置模态框 -->
    <a-modal 
      v-model:open="twoFactorModal"
      title="双因素认证设置"
      :footer="null"
      @cancel="preferences.security.enable_two_factor = false"
    >
      <div class="two-factor-setup">
        <a-steps :current="twoFactorStep" size="small">
          <a-step title="扫描二维码" />
          <a-step title="验证代码" />
          <a-step title="保存备份码" />
        </a-steps>

        <div class="step-content" style="margin-top: 24px;">
          <!-- 步骤1: 扫描二维码 -->
          <div v-if="twoFactorStep === 0">
            <p>请使用身份验证器应用(如Google Authenticator)扫描下方二维码：</p>
            <div class="qr-code-container">
              <img v-if="qrCode" :src="qrCode" alt="QR Code" />
              <a-spin v-else />
            </div>
            <p>或手动输入密钥: <code>{{ secretKey }}</code></p>
            <div style="text-align: center; margin-top: 16px;">
              <a-button type="primary" @click="twoFactorStep = 1">下一步</a-button>
            </div>
          </div>

          <!-- 步骤2: 验证代码 -->
          <div v-if="twoFactorStep === 1">
            <p>请输入身份验证器显示的6位数字代码：</p>
            <a-input 
              v-model:value="verificationCode"
              placeholder="000000"
              style="width: 200px; text-align: center; font-size: 18px; letter-spacing: 2px;"
              :maxlength="6"
            />
            <div style="text-align: center; margin-top: 16px;">
              <a-space>
                <a-button @click="twoFactorStep = 0">上一步</a-button>
                <a-button type="primary" @click="verifyTwoFactor" :loading="verifying">验证</a-button>
              </a-space>
            </div>
          </div>

          <!-- 步骤3: 保存备份码 -->
          <div v-if="twoFactorStep === 2">
            <a-alert 
              type="warning" 
              message="重要提醒" 
              description="请妥善保存以下备份代码，当您无法使用身份验证器时可以使用这些代码登录。每个代码只能使用一次。"
              show-icon
              style="margin-bottom: 16px;"
            />
            <div class="backup-codes">
              <a-tag v-for="code in backupCodes" :key="code" style="margin: 4px; font-family: monospace;">
                {{ code }}
              </a-tag>
            </div>
            <div style="text-align: center; margin-top: 16px;">
              <a-button type="primary" @click="finishTwoFactorSetup">完成设置</a-button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons-vue'
import { 
  getUserPreferences, 
  updateUserPreferences, 
  resetUserPreferences,
  enableTwoFactor,
  type UserPreferences 
} from '@/api/user-center'

const loading = ref(false)
const saving = ref(false)
const resetting = ref(false)
const twoFactorModal = ref(false)
const twoFactorStep = ref(0)
const verifying = ref(false)
const qrCode = ref('')
const secretKey = ref('')
const verificationCode = ref('')
const backupCodes = ref<string[]>([])

const preferences = reactive<UserPreferences>({
  appearance: {
    theme_mode: 'light',
    sidebar_collapsed: false,
    show_breadcrumb: true,
    language: 'zh-CN',
    font_size: 'medium'
  },
  notification: {
    system_notification: true,
    email_notification: false,
    sound_notification: true,
    browser_notification: true
  },
  security: {
    auto_logout_time: 60,
    session_timeout: 30,
    enable_two_factor: false
  },
  workspace: {
    default_page: '/dashboard',
    items_per_page: 20,
    date_format: 'YYYY-MM-DD',
    time_format: '24h'
  }
})

const fetchPreferences = async () => {
  try {
    loading.value = true
    const response = await getUserPreferences()
    if (response.code === 0) {
      Object.assign(preferences, response.data)
    }
  } catch (error) {
    console.error('获取偏好设置失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    saving.value = true
    const response = await updateUserPreferences(preferences)
    if (response.code === 0) {
      message.success('偏好设置保存成功')
    }
  } catch (error) {
    console.error('保存偏好设置失败:', error)
  } finally {
    saving.value = false
  }
}

const handleReset = async () => {
  try {
    resetting.value = true
    const response = await resetUserPreferences()
    if (response.code === 0) {
      message.success('偏好设置已重置为默认值')
      await fetchPreferences()
    }
  } catch (error) {
    console.error('重置偏好设置失败:', error)
  } finally {
    resetting.value = false
  }
}

const handleTwoFactorChange = async (enabled: boolean) => {
  if (enabled) {
    try {
      const response = await enableTwoFactor()
      if (response.code === 0) {
        qrCode.value = response.data.qr_code
        secretKey.value = response.data.secret_key
        backupCodes.value = response.data.backup_codes
        twoFactorModal.value = true
        twoFactorStep.value = 0
      }
    } catch (error) {
      preferences.security.enable_two_factor = false
      console.error('启用双因素认证失败:', error)
    }
  } else {
    // 这里应该调用禁用双因素认证的API
    message.info('双因素认证已禁用')
  }
}

const verifyTwoFactor = () => {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    message.error('请输入6位验证码')
    return
  }
  
  verifying.value = true
  // 模拟验证过程
  setTimeout(() => {
    verifying.value = false
    twoFactorStep.value = 2
  }, 1000)
}

const finishTwoFactorSetup = () => {
  twoFactorModal.value = false
  message.success('双因素认证设置完成')
  // 重置状态
  twoFactorStep.value = 0
  verificationCode.value = ''
}

onMounted(() => {
  fetchPreferences()
})
</script>

<style scoped>
.user-preferences {
  padding: 24px;
}

.setting-desc {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.two-factor-setup {
  padding: 16px 0;
}

.qr-code-container {
  text-align: center;
  padding: 20px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  margin: 16px 0;
}

.backup-codes {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.step-content {
  min-height: 200px;
}
</style>