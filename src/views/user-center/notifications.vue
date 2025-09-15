<template>
  <div class="notifications-page">
    <a-card>
      <template #title>
        <div class="header-title">
          <BellOutlined />
          消息通知
          <a-badge :count="unreadCount" :offset="[8, -2]" />
        </div>
      </template>
      
      <template #extra>
        <a-space>
          <a-button @click="handleMarkAllRead" :disabled="unreadCount === 0" :loading="markingAllRead">
            <CheckOutlined />
            全部已读
          </a-button>
          <a-button @click="() => fetchNotifications()">
            <ReloadOutlined />
            刷新
          </a-button>
        </a-space>
      </template>

      <div class="filters-section">
        <a-row :gutter="[12, 16]" align="middle">
          <a-col :xs="24" :sm="8" :md="6">
            <a-select 
              v-model:value="filters.type" 
              placeholder="通知类型"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option value="all">全部类型</a-select-option>
              <a-select-option value="system">系统通知</a-select-option>
              <a-select-option value="email">邮件通知</a-select-option>
              <a-select-option value="push">推送通知</a-select-option>
            </a-select>
          </a-col>
          
          <a-col :xs="24" :sm="8" :md="6">
            <a-select 
              v-model:value="filters.status" 
              placeholder="阅读状态"
              style="width: 100%"
              @change="handleFilterChange"
            >
              <a-select-option value="all">全部状态</a-select-option>
              <a-select-option value="unread">未读</a-select-option>
              <a-select-option value="read">已读</a-select-option>
            </a-select>
          </a-col>
          
          <a-col :xs="24" :sm="8" :md="12">
            <a-range-picker 
              v-model:value="dateRange" 
              style="width: 100%"
              @change="handleDateChange"
            />
          </a-col>
        </a-row>
      </div>

      <a-list
        :loading="loading"
        :data-source="notifications"
        :pagination="paginationConfig"
        item-layout="vertical"
        class="notifications-list"
      >
        <template #renderItem="{ item }">
          <a-list-item 
            :class="['notification-item', { 'unread': !item.is_read }]"
            @click="handleNotificationClick(item)"
          >
            <template #actions>
              <a-space>
                <span class="notification-time">{{ formatTime(item.created_at) }}</span>
                <a-button 
                  v-if="!item.is_read" 
                  type="link" 
                  size="small"
                  @click.stop="handleMarkAsRead(item.id)"
                  :loading="markingIds.includes(item.id)"
                >
                  标为已读
                </a-button>
                <a-popconfirm
                  title="确定要删除这条通知吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(item.id)"
                >
                  <a-button 
                    type="link" 
                    size="small" 
                    danger
                    @click.stop
                    :loading="deletingIds.includes(item.id)"
                  >
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>

            <div class="notification-content">
              <div class="notification-header">
                <div class="notification-title">
                  <a-tag :color="getTypeColor(item.type)" size="small">
                    {{ getTypeLabel(item.type) }}
                  </a-tag>
                  <a-tag :color="getPriorityColor(item.priority)" size="small">
                    {{ getPriorityLabel(item.priority) }}
                  </a-tag>
                  <span class="title-text">{{ item.title }}</span>
                </div>
                <div class="notification-sender" v-if="item.sender">
                  发送人：{{ item.sender }}
                </div>
              </div>
              
              <div class="notification-body" v-if="item.content">
                {{ item.content }}
              </div>
            </div>
          </a-list-item>
        </template>

        <template #loadMore>
          <div class="load-more" v-if="hasMore && !loading">
            <a-button @click="loadMore">加载更多</a-button>
          </div>
        </template>
      </a-list>
    </a-card>

    <!-- 通知详情模态框 -->
    <a-modal 
      v-model:open="detailModal"
      :title="selectedNotification?.title"
      :footer="null"
      width="600px"
    >
      <div v-if="selectedNotification" class="notification-detail">
        <div class="detail-header">
          <a-space>
            <a-tag :color="getTypeColor(selectedNotification.type)">
              {{ getTypeLabel(selectedNotification.type) }}
            </a-tag>
            <a-tag :color="getPriorityColor(selectedNotification.priority)">
              {{ getPriorityLabel(selectedNotification.priority) }}
            </a-tag>
          </a-space>
          <div class="detail-meta">
            <div>发送人：{{ selectedNotification.sender }}</div>
            <div>发送时间：{{ formatDateTime(selectedNotification.created_at) }}</div>
          </div>
        </div>
        
        <a-divider />
        
        <div class="detail-content">
          {{ selectedNotification.content }}
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { 
  BellOutlined, 
  CheckOutlined, 
  ReloadOutlined 
} from '@ant-design/icons-vue'
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
  type NotificationQueryParams
} from '@/api/user-center'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const loading = ref(false)
const markingAllRead = ref(false)
const markingIds = ref<number[]>([])
const deletingIds = ref<number[]>([])
const detailModal = ref(false)
const selectedNotification = ref<Notification>()

const notifications = ref<Notification[]>([])
const total = ref(0)
const unreadCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const hasMore = ref(false)

const dateRange = ref()

const filters = reactive<NotificationQueryParams>({
  type: 'all',
  status: 'all'
})

const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
  onChange: (page: number, size: number) => {
    currentPage.value = page
    pageSize.value = size
    fetchNotifications()
  }
}))

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    system: '系统',
    email: '邮件',
    push: '推送'
  }
  return labels[type] || type
}

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    system: 'blue',
    email: 'green',
    push: 'orange'
  }
  return colors[type] || 'default'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return labels[priority] || priority
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'default',
    medium: 'warning',
    high: 'error'
  }
  return colors[priority] || 'default'
}

const formatTime = (datetime: string) => {
  return dayjs(datetime).fromNow()
}

const formatDateTime = (datetime: string) => {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')
}

const fetchNotifications = async (append = false) => {
  try {
    loading.value = true
    
    const params: NotificationQueryParams = {
      page: append ? currentPage.value + 1 : currentPage.value,
      per_page: pageSize.value,
      ...filters
    }

    // 处理日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.end_date = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }

    const response = await getNotifications(params)
    if (response.code === 0) {
      const data = response.data
      
      if (append) {
        notifications.value = [...notifications.value, ...data.notifications]
        currentPage.value += 1
      } else {
        notifications.value = data.notifications
        currentPage.value = data.page
      }
      
      total.value = data.total
      unreadCount.value = data.unread_count
      hasMore.value = data.page < data.pages
    }
  } catch (error) {
    console.error('获取通知列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchUnreadCount = async () => {
  try {
    const response = await getUnreadCount()
    if (response.code === 0) {
      unreadCount.value = response.data.total_unread
    }
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchNotifications()
}

const handleDateChange = () => {
  currentPage.value = 1
  fetchNotifications()
}

const handleNotificationClick = async (notification: Notification) => {
  selectedNotification.value = notification
  detailModal.value = true
  
  // 如果是未读消息，标记为已读
  if (!notification.is_read) {
    await handleMarkAsRead(notification.id)
  }
}

const handleMarkAsRead = async (id: number) => {
  try {
    markingIds.value.push(id)
    const response = await markNotificationAsRead(id)
    if (response.code === 0) {
      // 更新本地状态
      const notification = notifications.value.find(n => n.id === id)
      if (notification) {
        notification.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      message.success('已标记为已读')
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  } finally {
    markingIds.value = markingIds.value.filter(nId => nId !== id)
  }
}

const handleMarkAllRead = async () => {
  try {
    markingAllRead.value = true
    const response = await markAllAsRead()
    if (response.code === 0) {
      // 更新本地状态
      notifications.value.forEach(notification => {
        notification.is_read = true
      })
      unreadCount.value = 0
      message.success('所有通知已标记为已读')
    }
  } catch (error) {
    console.error('批量标记已读失败:', error)
  } finally {
    markingAllRead.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    deletingIds.value.push(id)
    const response = await deleteNotification(id)
    if (response.code === 0) {
      // 更新本地状态
      const index = notifications.value.findIndex(n => n.id === id)
      if (index > -1) {
        const notification = notifications.value[index]
        if (!notification.is_read) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
        total.value -= 1
      }
      message.success('通知已删除')
    }
  } catch (error) {
    console.error('删除通知失败:', error)
  } finally {
    deletingIds.value = deletingIds.value.filter(nId => nId !== id)
  }
}

const loadMore = () => {
  fetchNotifications(true)
}

onMounted(() => {
  fetchNotifications()
  fetchUnreadCount()
})
</script>

<style scoped>
.notifications-page {
  padding: 24px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.filters-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.notifications-list {
  min-height: 400px;
}

.notification-item {
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.notification-item:hover {
  background: #f5f5f5;
}

.notification-item.unread {
  background: #f6ffed;
  border-left-color: #52c41a;
}

.notification-content {
  width: 100%;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.title-text {
  font-weight: 500;
  color: #262626;
}

.notification-sender {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
}

.notification-body {
  color: #595959;
  line-height: 1.6;
  margin-top: 8px;
}

.notification-time {
  color: #8c8c8c;
  font-size: 12px;
}

.load-more {
  text-align: center;
  margin-top: 16px;
}

.notification-detail {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.detail-meta {
  text-align: right;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
}

.detail-content {
  font-size: 14px;
  line-height: 1.6;
  color: #262626;
  white-space: pre-wrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .notifications-page {
    padding: 16px;
  }
  
  /* 筛选区域适配 */
  .filters-section {
    margin-bottom: 16px;
    padding: 12px;
  }
  
  /* 按钮组适配 */
  :deep(.ant-card-extra) {
    margin-top: 12px;
  }
  
  :deep(.ant-space) {
    width: 100%;
    justify-content: center;
    
    .ant-space-item {
      flex: 1;
      
      .ant-btn {
        width: 100%;
        min-height: 44px;
      }
    }
  }
  
  /* 列表项适配 */
  .notification-item {
    :deep(.ant-list-item-action) {
      margin-left: 0;
      margin-top: 8px;
      width: 100%;
      
      li {
        padding: 0;
      }
      
      .ant-space {
        width: 100%;
        justify-content: space-between;
      }
    }
  }
  
  /* 通知头部适配 */
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .notification-title {
    flex-wrap: wrap;
    gap: 4px;
    
    .title-text {
      font-size: 14px;
    }
  }
  
  .notification-sender {
    font-size: 11px;
  }
  
  /* 通知内容适配 */
  .notification-body {
    font-size: 13px;
    margin-top: 6px;
  }
  
  /* 时间显示适配 */
  .notification-time {
    font-size: 11px;
  }
  
  /* 标签适配 */
  :deep(.ant-tag) {
    margin: 2px;
    font-size: 11px;
    padding: 2px 6px;
  }
  
  /* 分页适配 */
  :deep(.ant-pagination) {
    text-align: center;
    
    .ant-pagination-options {
      display: none;
    }
  }
  
  /* 模态框适配 */
  :deep(.ant-modal) {
    margin: 0;
    max-width: calc(100vw - 32px);
    
    .ant-modal-content {
      border-radius: 8px;
    }
  }
  
  /* 详情头部适配 */
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .detail-meta {
    text-align: left;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .notifications-page {
    padding: 12px;
  }
  
  /* 头部标题适配 */
  .header-title {
    font-size: 15px;
  }
  
  /* 按钮触摸适配 */
  :deep(.ant-btn) {
    min-height: 48px;
    font-size: 14px;
  }
  
  /* 筛选区域紧凑布局 */
  .filters-section {
    padding: 8px;
  }
  
  /* 列表项紧凑布局 */
  :deep(.ant-list-item) {
    padding: 12px 8px;
  }
  
  /* 日期选择器适配 */
  :deep(.ant-picker) {
    width: 100% !important;
  }
  
  /* 选择框适配 */
  :deep(.ant-select) {
    width: 100% !important;
  }
  
  /* 通知内容适配 */
  .notification-body {
    font-size: 12px;
  }
  
  .detail-content {
    font-size: 13px;
  }
}
</style>