import request from '@/api/request'

export interface Customer {
  id?: number
  customer_date?: string
  channel?: string
  wechat_name?: string
  phone?: string
  add_date?: string
  deal_date?: string
  status?: '潜在' | '跟进中' | '已成交' | '已流失'
  remark?: string
  created_at?: string
}

export interface CustomerFormData {
  id?: number
  customer_date?: string
  channel?: string
  wechat_name?: string
  phone?: string
  add_date?: string
  deal_date?: string
  status?: '潜在' | '跟进中' | '已成交' | '已流失'
  remark?: string
}

export interface CustomerQuery {
  page?: number
  per_page?: number
  status?: string
  channel?: string
  subject?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface CustomerListResponse {
  data: Customer[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface CustomerResponse {
  message: string
  data: Customer
}

// 获取客户列表
export const getCustomers = (params?: CustomerQuery): Promise<CustomerListResponse> => {
  return request.get('/api/v1/customers', { params })
}

// 获取客户详情
export const getCustomer = (id: number): Promise<Customer> => {
  return request.get(`/api/v1/customers/${id}`)
}

// 创建客户
export const createCustomer = (data: Customer | CustomerFormData): Promise<CustomerResponse> => {
  return request.post('/api/v1/customers', data)
}

// 更新客户
export const updateCustomer = (id: number, data: Customer | CustomerFormData): Promise<CustomerResponse> => {
  return request.put(`/api/v1/customers/${id}`, data)
}

// 删除客户
export const deleteCustomer = (id: number): Promise<{ message: string }> => {
  return request.delete(`/api/v1/customers/${id}`)
}