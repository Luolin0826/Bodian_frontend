import request from '@/api/request'

// 跟进记录数据类型
export interface FollowUpRecord {
  id?: number
  customer_id: number
  follow_up_type: 'phone' | 'wechat' | 'meeting' | 'email' | 'other'
  follow_up_content: string
  next_follow_date?: string
  result?: 'interested' | 'not_interested' | 'no_answer' | 'deal' | 'reschedule' | 'other'
  status_before?: '潜在' | '跟进中' | '已成交' | '已流失'
  status_after?: '潜在' | '跟进中' | '已成交' | '已流失'
  created_by?: number
  created_at?: string
  updated_at?: string
  creator_name?: string
  customer_name?: string
}

// 跟进提醒数据类型
export interface FollowUpReminder {
  id?: number
  customer_id: number
  remind_date: string
  remind_content: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_completed: boolean
  completed_at?: string
  completed_by?: number
  follow_up_record_id?: number
  created_by?: number
  created_at?: string
  updated_at?: string
  creator_name?: string
  completer_name?: string
  customer_name?: string
  customer_phone?: string
  customer_status?: string
}

// 客户详情（包含跟进信息）
export interface CustomerDetail {
  customer: {
    id: number
    wechat_name?: string
    phone?: string
    status?: string
    channel?: string
    add_date?: string
    created_at?: string
  }
  recent_follow_ups: FollowUpRecord[]
  pending_reminders: FollowUpReminder[]
  follow_up_stats: {
    total_count: number
    last_follow_date?: string
    next_follow_date?: string
  }
}

// 时间线项目
export interface TimelineItem {
  type: 'follow_up' | 'reminder'
  id: number
  date: string
  title: string
  content: string
  result?: string
  status_change?: {
    before: string
    after: string
  }
  next_follow_date?: string
  creator_name?: string
  remind_date?: string
  is_completed?: boolean
  completed_at?: string
}

// 跟进统计数据
export interface FollowUpStatistics {
  today_count: number
  week_count: number
  month_count: number
  conversion_rate: number
  total_customers: number
  deal_customers: number
  type_statistics: Array<{ type: string; count: number }>
  result_statistics: Array<{ result: string; count: number }>
}

// 提醒统计数据
export interface ReminderStatistics {
  today_count: number
  overdue_count: number
  total_pending: number
  completed_this_month: number
  priority_statistics: Array<{ priority: string; count: number }>
}

// 查询参数类型
export interface FollowUpQuery {
  page?: number
  per_page?: number
  follow_up_type?: string
  date_from?: string
  date_to?: string
  result?: string
  customer_name?: string
  created_by?: number
}

export interface ReminderQuery {
  page?: number
  per_page?: number
  date?: string
  is_completed?: boolean
  customer_id?: number
  priority?: string
  customer_name?: string
}

export interface NeedFollowUpQuery {
  page?: number
  per_page?: number
  urgency_level?: 'urgent' | 'high' | 'medium' | 'low'
  days_since_last_contact?: number
  status?: '潜在' | '跟进中'
}

// 批量跟进数据
export interface BatchFollowUpData {
  customer_ids: number[]
  follow_up_data: {
    follow_up_type: string
    follow_up_content: string
    result?: string
    next_follow_date?: string
    status_after?: string
  }
}

// 响应数据类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface ListResponse<T> {
  records?: T[]
  reminders?: T[]
  customers?: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// =========================== 跟进记录相关API ===========================

// 获取客户跟进记录列表
export const getCustomerFollowUps = (customerId: number, params?: FollowUpQuery) => {
  return request.get<ApiResponse<ListResponse<FollowUpRecord> & { customer: any }>>(
    `/api/v1/customers/${customerId}/follow-ups`,
    { params }
  )
}

// 创建跟进记录
export const createFollowUpRecord = (customerId: number, data: Omit<FollowUpRecord, 'id' | 'customer_id'>) => {
  return request.post<ApiResponse<FollowUpRecord>>(
    `/api/v1/customers/${customerId}/follow-ups`,
    data
  )
}

// 更新跟进记录
export const updateFollowUpRecord = (id: number, data: Partial<FollowUpRecord>) => {
  return request.put<ApiResponse<FollowUpRecord>>(`/api/v1/follow-ups/${id}`, data)
}

// 删除跟进记录
export const deleteFollowUpRecord = (id: number) => {
  return request.delete<ApiResponse<void>>(`/api/v1/follow-ups/${id}`)
}

// 获取跟进统计数据
export const getFollowUpStatistics = () => {
  return request.get<ApiResponse<FollowUpStatistics>>('/api/v1/follow-ups/statistics')
}

// 获取所有跟进记录（分页筛选）
export const getFollowUps = (params?: FollowUpQuery) => {
  return request.get<ApiResponse<ListResponse<FollowUpRecord>>>('/api/v1/follow-ups', { params })
}

// =========================== 跟进提醒相关API ===========================

// 获取跟进提醒列表
export const getFollowUpReminders = (params?: ReminderQuery) => {
  return request.get<ApiResponse<ListResponse<FollowUpReminder>>>('/api/v1/follow-up-reminders', { params })
}

// 创建跟进提醒
export const createFollowUpReminder = (data: Omit<FollowUpReminder, 'id'>) => {
  return request.post<ApiResponse<FollowUpReminder>>('/api/v1/follow-up-reminders', data)
}

// 更新跟进提醒
export const updateFollowUpReminder = (id: number, data: Partial<FollowUpReminder>) => {
  return request.put<ApiResponse<FollowUpReminder>>(`/api/v1/follow-up-reminders/${id}`, data)
}

// 标记提醒为已完成
export const completeFollowUpReminder = (id: number) => {
  return request.put<ApiResponse<FollowUpReminder>>(`/api/v1/follow-up-reminders/${id}/complete`)
}

// 重新打开已完成的提醒
export const reopenFollowUpReminder = (id: number) => {
  return request.put<ApiResponse<FollowUpReminder>>(`/api/v1/follow-up-reminders/${id}/reopen`)
}

// 删除跟进提醒
export const deleteFollowUpReminder = (id: number) => {
  return request.delete<ApiResponse<void>>(`/api/v1/follow-up-reminders/${id}`)
}

// 获取今日提醒
export const getTodayReminders = () => {
  return request.get<ApiResponse<{
    today_reminders: FollowUpReminder[]
    overdue_reminders: FollowUpReminder[]
    total_count: number
  }>>('/api/v1/follow-up-reminders/today')
}

// 获取提醒统计数据
export const getReminderStatistics = () => {
  return request.get<ApiResponse<ReminderStatistics>>('/api/v1/follow-up-reminders/statistics')
}

// =========================== 增强的客户相关API ===========================

// 获取客户详情（包含跟进记录）
export const getCustomerDetail = (id: number) => {
  return request.get<ApiResponse<CustomerDetail>>(`/api/v1/customers/${id}/detail`)
}

// 批量更新客户跟进状态
export const batchFollowUpCustomers = (data: BatchFollowUpData) => {
  return request.post<ApiResponse<{
    success_count: number
    total_count: number
  }>>('/api/v1/customers/batch-follow-up', data)
}

// 获取需要跟进的客户列表
export const getNeedFollowUpCustomers = (params?: NeedFollowUpQuery) => {
  return request.get<ApiResponse<ListResponse<{
    id: number
    wechat_name?: string
    phone?: string
    status?: string
    channel?: string
    last_follow_up_date?: string
    days_since_last_follow_up: number
    urgency: string
  }>>>('/api/v1/customers/need-follow-up', { params })
}

// 获取客户跟进时间线
export const getCustomerTimeline = (id: number) => {
  return request.get<ApiResponse<{
    customer: {
      id: number
      wechat_name?: string
      phone?: string
      status?: string
    }
    timeline: TimelineItem[]
    total_items: number
  }>>(`/api/v1/customers/${id}/timeline`)
}

// =========================== 工具函数 ===========================

// 获取跟进方式显示文本
export const getFollowUpTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    phone: '电话',
    wechat: '微信',
    meeting: '面谈',
    email: '邮件',
    other: '其他'
  }
  return typeMap[type] || type
}

// 获取跟进结果显示文本
export const getFollowUpResultText = (result: string) => {
  const resultMap: Record<string, string> = {
    interested: '有意向',
    not_interested: '无意向',
    no_answer: '未接听',
    deal: '成交',
    reschedule: '改期',
    other: '其他'
  }
  return resultMap[result] || result
}

// 获取优先级显示文本
export const getPriorityText = (priority: string) => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return priorityMap[priority] || priority
}

// 获取优先级颜色
export const getPriorityColor = (priority: string) => {
  const colorMap: Record<string, string> = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  }
  return colorMap[priority] || 'default'
}

// 获取跟进结果颜色
export const getFollowUpResultColor = (result: string) => {
  const colorMap: Record<string, string> = {
    interested: 'green',
    not_interested: 'red',
    no_answer: 'orange',
    deal: 'blue',
    reschedule: 'purple',
    other: 'default'
  }
  return colorMap[result] || 'default'
}