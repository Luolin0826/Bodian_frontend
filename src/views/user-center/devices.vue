<template>
  <div class="devices-page">
    <a-card title="设备管理" class="devices-card">
      <template #extra>
        <a-space>
          <a-button @click="refreshDevices" :loading="loading">
            <ReloadOutlined />
            刷新
          </a-button>
          <a-button 
            @click="logoutAllOthers" 
            :loading="loggingOutOthers"
            danger
          >
            <LogoutOutlined />
            注销其他设备
          </a-button>
        </a-space>
      </template>

      <!-- 设备统计 -->
      <div class="device-stats" style="margin-bottom: 24px;">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-statistic
              title="在线设备"
              :value="onlineDevices.length"
              :value-style="{ color: '#52c41a' }"
            >
              <template #suffix>
                <span>/{{ activeSessions.length }}</span>
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="桌面设备"
              :value="deviceStats.desktop"
              :value-style="{ color: '#1890ff' }"
            />
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="移动设备"
              :value="deviceStats.mobile"
              :value-style="{ color: '#722ed1' }"
            />
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="信任设备"
              :value="trustedDevices.length"
              :value-style="{ color: '#fa8c16' }"
            />
          </a-col>
        </a-row>
      </div>

      <!-- 设备筛选 -->
      <div class="device-filters" style="margin-bottom: 24px;">
        <a-row :gutter="16" align="middle">
          <a-col :span="6">
            <a-select
              v-model:value="filterStatus"
              placeholder="设备状态"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option value="">全部设备</a-select-option>
              <a-select-option value="online">在线</a-select-option>
              <a-select-option value="offline">离线</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="6">
            <a-select
              v-model:value="filterDeviceType"
              placeholder="设备类型"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option value="">全部类型</a-select-option>
              <a-select-option value="desktop">桌面设备</a-select-option>
              <a-select-option value="mobile">移动设备</a-select-option>
              <a-select-option value="tablet">平板设备</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="6">
            <a-select
              v-model:value="filterTrusted"
              placeholder="信任状态"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option value="">全部设备</a-select-option>
              <a-select-option value="trusted">信任设备</a-select-option>
              <a-select-option value="untrusted">非信任设备</a-select-option>
            </a-select>
          </a-col>
        </a-row>
      </div>

      <!-- 设备列表 -->
      <a-list
        :data-source="filteredDevices"
        :loading="loading"
        item-layout="horizontal"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-space>
                <a-tooltip title="设备详情">
                  <a-button 
                    type="link" 
                    size="small"
                    @click="showDeviceDetail(item)"
                  >
                    <EyeOutlined />
                  </a-button>
                </a-tooltip>
                
                <a-tooltip :title="item.is_trusted ? '取消信任' : '设为信任'">
                  <a-button 
                    type="link" 
                    size="small"
                    @click="toggleTrustDevice(item)"
                    :loading="trustingIds.includes(item.session_id)"
                  >
                    <HeartOutlined v-if="!item.is_trusted" />
                    <HeartFilled v-else style="color: #f5222d;" />
                  </a-button>
                </a-tooltip>
                
                <a-tooltip title="注销设备">
                  <a-button 
                    v-if="!item.is_current"
                    type="link" 
                    size="small"
                    danger
                    @click="terminateDevice(item)"
                    :loading="terminatingIds.includes(item.session_id)"
                  >
                    <PoweroffOutlined />
                  </a-button>
                </a-tooltip>
              </a-space>
            </template>
            
            <a-list-item-meta>
              <template #avatar>
                <a-badge 
                  :dot="isOnline(item)" 
                  :color="isOnline(item) ? 'green' : 'red'"
                >
                  <DesktopOutlined 
                    v-if="getDeviceType(item) === 'desktop'" 
                    :style="{ fontSize: '32px', color: '#1890ff' }" 
                  />
                  <MobileOutlined 
                    v-else-if="getDeviceType(item) === 'mobile'" 
                    :style="{ fontSize: '32px', color: '#722ed1' }" 
                  />
                  <TabletOutlined 
                    v-else 
                    :style="{ fontSize: '32px', color: '#fa8c16' }" 
                  />
                </a-badge>
              </template>
              
              <template #title>
                <div class="device-title">
                  <span class="device-name">{{ getDeviceName(item) }}</span>
                  <a-space style="margin-left: 12px;">
                    <a-tag v-if="item.is_current" color="green" size="small">
                      <CheckCircleOutlined />
                      当前设备
                    </a-tag>
                    <a-tag v-if="item.is_trusted" color="orange" size="small">
                      <HeartFilled />
                      信任设备
                    </a-tag>
                    <a-tag v-if="isOnline(item)" color="processing" size="small">
                      在线
                    </a-tag>
                    <a-tag v-else color="default" size="small">
                      离线
                    </a-tag>
                  </a-space>
                </div>
              </template>
              
              <template #description>
                <div class="device-info">
                  <div class="info-row">
                    <GlobalOutlined />
                    <span>{{ item.ip_address }}</span>
                    <span v-if="item.location" class="location">{{ item.location }}</span>
                  </div>
                  <div class="info-row">
                    <ClockCircleOutlined />
                    <span>最后活动: {{ formatRelativeTime(item.last_activity) }}</span>
                  </div>
                  <div class="info-row">
                    <CalendarOutlined />
                    <span>创建时间: {{ formatDateTime(item.created_at) }}</span>
                    <span class="expires">过期: {{ formatDateTime(item.expires_at) }}</span>
                  </div>
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-card>

    <!-- 设备详情弹窗 -->
    <a-modal
      v-model:open="deviceDetailModal"
      title="设备详情"
      :footer="null"
      width="600px"
    >
      <div v-if="selectedDevice" class="device-detail">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="设备ID">
            <a-typography-text copyable>{{ selectedDevice.session_id }}</a-typography-text>
          </a-descriptions-item>
          
          <a-descriptions-item label="设备类型">
            <a-tag :color="getDeviceTypeColor(selectedDevice)">
              <component :is="getDeviceTypeIcon(selectedDevice)" />
              {{ getDeviceTypeName(selectedDevice) }}
            </a-tag>
          </a-descriptions-item>
          
          <a-descriptions-item label="IP地址">
            {{ selectedDevice.ip_address }}
          </a-descriptions-item>
          
          <a-descriptions-item label="地理位置" v-if="selectedDevice.location">
            {{ selectedDevice.location }}
          </a-descriptions-item>
          
          <a-descriptions-item label="设备指纹">
            <div class="device-fingerprint">
              {{ selectedDevice.device_fingerprint || '无' }}
            </div>
          </a-descriptions-item>
          
          <a-descriptions-item label="状态">
            <a-space>
              <a-tag v-if="selectedDevice.is_current" color="green">当前设备</a-tag>
              <a-tag v-if="selectedDevice.is_trusted" color="orange">信任设备</a-tag>
              <a-tag :color="isOnline(selectedDevice) ? 'processing' : 'default'">
                {{ isOnline(selectedDevice) ? '在线' : '离线' }}
              </a-tag>
            </a-space>
          </a-descriptions-item>
          
          <a-descriptions-item label="创建时间">
            {{ formatDateTime(selectedDevice.created_at) }}
          </a-descriptions-item>
          
          <a-descriptions-item label="最后活动">
            {{ formatDateTime(selectedDevice.last_activity) }}
          </a-descriptions-item>
          
          <a-descriptions-item label="过期时间">
            {{ formatDateTime(selectedDevice.expires_at) }}
          </a-descriptions-item>
        </a-descriptions>
        
        <div class="device-actions" style="margin-top: 24px; text-align: center;">
          <a-space>
            <a-button 
              v-if="!selectedDevice.is_trusted"
              type="primary"
              @click="toggleTrustDevice(selectedDevice)"
              :loading="trustingIds.includes(selectedDevice.session_id)"
            >
              <HeartOutlined />
              设为信任设备
            </a-button>
            <a-button 
              v-else
              @click="toggleTrustDevice(selectedDevice)"
              :loading="trustingIds.includes(selectedDevice.session_id)"
            >
              <HeartFilled />
              取消信任
            </a-button>
            
            <a-button 
              v-if="!selectedDevice.is_current"
              danger
              @click="terminateDevice(selectedDevice)"
              :loading="terminatingIds.includes(selectedDevice.session_id)"
            >
              <PoweroffOutlined />
              注销设备
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  ReloadOutlined,
  LogoutOutlined,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  PoweroffOutlined,
  CheckCircleOutlined,
  DesktopOutlined,
  MobileOutlined,
  TabletOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons-vue'
import {
  getActiveSessions,
  logoutOtherSessions,
  terminateSession,
  type ActiveSession
} from '@/api/user-center'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 扩展设备接口
interface ExtendedSession extends ActiveSession {
  is_trusted?: boolean
  location?: string
  browser?: string
  os?: string
}

const loading = ref(false)
const loggingOutOthers = ref(false)
const deviceDetailModal = ref(false)
const activeSessions = ref<ExtendedSession[]>([])
const selectedDevice = ref<ExtendedSession>()
const terminatingIds = ref<string[]>([])
const trustingIds = ref<string[]>([])

// 筛选条件
const filterStatus = ref('')
const filterDeviceType = ref('')
const filterTrusted = ref('')

// 计算属性
const onlineDevices = computed(() => 
  activeSessions.value.filter(session => 
    dayjs().diff(dayjs(session.last_activity), 'minute') < 30
  )
)

const trustedDevices = computed(() => 
  activeSessions.value.filter(session => session.is_trusted)
)

const deviceStats = computed(() => ({
  desktop: activeSessions.value.filter(s => getDeviceType(s) === 'desktop').length,
  mobile: activeSessions.value.filter(s => getDeviceType(s) === 'mobile').length,
  tablet: activeSessions.value.filter(s => getDeviceType(s) === 'tablet').length
}))

const filteredDevices = computed(() => {
  let devices = activeSessions.value

  if (filterStatus.value) {
    if (filterStatus.value === 'online') {
      devices = devices.filter(device => isOnline(device))
    } else if (filterStatus.value === 'offline') {
      devices = devices.filter(device => !isOnline(device))
    }
  }

  if (filterDeviceType.value) {
    devices = devices.filter(device => getDeviceType(device) === filterDeviceType.value)
  }

  if (filterTrusted.value) {
    if (filterTrusted.value === 'trusted') {
      devices = devices.filter(device => device.is_trusted)
    } else if (filterTrusted.value === 'untrusted') {
      devices = devices.filter(device => !device.is_trusted)
    }
  }

  return devices
})

// 工具函数
const isOnline = (session: ExtendedSession) => {
  return dayjs().diff(dayjs(session.last_activity), 'minute') < 30
}

const getDeviceType = (session: ExtendedSession) => {
  const fingerprint = session.device_fingerprint?.toLowerCase() || ''
  if (fingerprint.includes('mobile') || fingerprint.includes('phone')) {
    return 'mobile'
  } else if (fingerprint.includes('tablet') || fingerprint.includes('ipad')) {
    return 'tablet'
  }
  return 'desktop'
}

const getDeviceName = (session: ExtendedSession) => {
  const type = getDeviceType(session)
  const names = {
    desktop: '桌面设备',
    mobile: '移动设备',
    tablet: '平板设备'
  }
  return names[type as keyof typeof names] || '未知设备'
}

const getDeviceTypeName = (session: ExtendedSession) => {
  const type = getDeviceType(session)
  const names = {
    desktop: '桌面电脑',
    mobile: '手机',
    tablet: '平板电脑'
  }
  return names[type as keyof typeof names] || '未知'
}

const getDeviceTypeColor = (session: ExtendedSession) => {
  const type = getDeviceType(session)
  const colors = {
    desktop: 'blue',
    mobile: 'purple',
    tablet: 'orange'
  }
  return colors[type as keyof typeof colors] || 'default'
}

const getDeviceTypeIcon = (session: ExtendedSession) => {
  const type = getDeviceType(session)
  const icons = {
    desktop: DesktopOutlined,
    mobile: MobileOutlined,
    tablet: TabletOutlined
  }
  return icons[type as keyof typeof icons] || DesktopOutlined
}

const formatDateTime = (datetime?: string) => {
  return datetime ? dayjs(datetime).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const formatRelativeTime = (datetime: string) => {
  return dayjs(datetime).fromNow()
}

// 业务逻辑
const refreshDevices = async () => {
  await fetchActiveSessions()
}

const fetchActiveSessions = async () => {
  try {
    loading.value = true
    const response = await getActiveSessions()
    if (response.code === 0) {
      // 扩展会话数据，添加模拟的信任状态等
      activeSessions.value = response.data.sessions.map(session => ({
        ...session,
        is_trusted: Math.random() > 0.7, // 模拟信任状态
        location: '北京市 朝阳区', // 模拟地理位置
        browser: 'Chrome 120',
        os: 'Windows 11'
      }))
    }
  } catch (error) {
    console.error('获取设备列表失败:', error)
    message.error('获取设备列表失败')
  } finally {
    loading.value = false
  }
}

const logoutAllOthers = async () => {
  try {
    loggingOutOthers.value = true
    const response = await logoutOtherSessions()
    if (response.code === 0) {
      message.success(`已注销 ${response.data.logged_out_sessions} 个其他设备`)
      await refreshDevices()
    }
  } catch (error) {
    console.error('注销其他设备失败:', error)
    message.error('注销其他设备失败')
  } finally {
    loggingOutOthers.value = false
  }
}

const terminateDevice = async (session: ExtendedSession) => {
  try {
    terminatingIds.value.push(session.session_id)
    const response = await terminateSession(session.session_id)
    if (response.code === 0) {
      message.success('设备已注销')
      await refreshDevices()
      if (deviceDetailModal.value) {
        deviceDetailModal.value = false
      }
    }
  } catch (error) {
    console.error('注销设备失败:', error)
    message.error('注销设备失败')
  } finally {
    terminatingIds.value = terminatingIds.value.filter(id => id !== session.session_id)
  }
}

const toggleTrustDevice = async (session: ExtendedSession) => {
  try {
    trustingIds.value.push(session.session_id)
    
    // 这里应该调用实际的API
    // await toggleDeviceTrust(session.session_id, !session.is_trusted)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 更新本地状态
    const index = activeSessions.value.findIndex(s => s.session_id === session.session_id)
    if (index !== -1) {
      activeSessions.value[index].is_trusted = !activeSessions.value[index].is_trusted
    }
    
    message.success(session.is_trusted ? '已取消信任' : '已设为信任设备')
  } catch (error) {
    console.error('切换设备信任状态失败:', error)
    message.error('操作失败')
  } finally {
    trustingIds.value = trustingIds.value.filter(id => id !== session.session_id)
  }
}

const showDeviceDetail = (session: ExtendedSession) => {
  selectedDevice.value = session
  deviceDetailModal.value = true
}

const handleFilterChange = () => {
  // 筛选逻辑已在计算属性中处理
}

onMounted(() => {
  fetchActiveSessions()
})
</script>

<style scoped>
.devices-page {
  padding: 24px;
}

.devices-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.device-stats {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.device-filters {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
}

.device-title {
  display: flex;
  align-items: center;
}

.device-name {
  font-weight: 500;
  font-size: 16px;
}

.device-info {
  margin-top: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #666;
}

.location {
  color: #1890ff;
  margin-left: 8px;
}

.expires {
  color: #999;
  margin-left: 16px;
}

.device-detail {
  padding: 8px 0;
}

.device-fingerprint {
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  max-height: 80px;
  overflow-y: auto;
}

.device-actions {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}
</style>