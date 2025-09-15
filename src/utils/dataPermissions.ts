/**
 * 数据权限工具函数
 * 用于在组件中检查数据权限和进行数据过滤
 */

import { useUserStore } from '@/stores/user'
import { isMaskedData, processMaskedObject, maskSensitiveData } from '@/utils/dataMasking'

export interface DataFilterOptions {
  /** 数据类型 */
  dataType?: string
  /** 区域字段名 */
  regionField?: string
  /** 部门字段名 */
  departmentField?: string
  /** 创建者字段名 */
  creatorField?: string
  /** 敏感字段列表 */
  sensitiveFields?: string[]
}

/**
 * 检查用户是否有数据权限
 */
export const checkDataPermission = (
  dataType: string,
  region?: string,
  department?: string,
  creator?: string
): boolean => {
  const userStore = useUserStore()
  
  // 检查数据类型权限
  if (!userStore.hasDataPermission(dataType)) {
    return false
  }
  
  // 检查区域权限
  if (region && !userStore.hasRegionalAccess(region)) {
    return false
  }
  
  // 检查部门权限
  if (department && !userStore.hasDepartmentAccess(department)) {
    return false
  }
  
  // 检查个人数据权限
  const { scope } = userStore.permissions.data
  if (scope === 'own' && creator && creator !== userStore.userInfo?.id?.toString()) {
    return false
  }
  
  return true
}

/**
 * 过滤数据列表，根据用户权限
 */
export const filterDataList = <T extends Record<string, any>>(
  dataList: T[],
  options: DataFilterOptions = {}
): T[] => {
  const userStore = useUserStore()
  const {
    dataType = 'default',
    regionField = 'region',
    departmentField = 'department_id',
    creatorField = 'creator_id'
  } = options
  
  return dataList.filter(item => {
    return checkDataPermission(
      dataType,
      item[regionField],
      item[departmentField],
      item[creatorField]
    )
  })
}

/**
 * 处理敏感数据脱敏
 */
export const processSensitiveData = <T extends Record<string, any>>(
  data: T,
  sensitiveFields: string[] = []
): T => {
  const userStore = useUserStore()
  const processedData = { ...data }
  
  sensitiveFields.forEach(field => {
    if (processedData[field] && !userStore.hasSensitiveAccess(field)) {
      // 对敏感字段进行脱敏处理
      processedData[field] = maskSensitiveData(processedData[field], field)
    }
  })
  
  return processedData
}

/**
 * 批量处理数据列表的敏感字段
 */
export const processSensitiveDataList = <T extends Record<string, any>>(
  dataList: T[],
  sensitiveFields: string[] = []
): T[] => {
  return dataList.map(item => processSensitiveData(item, sensitiveFields))
}

/**
 * 检查是否可以执行操作
 */
export const canPerformOperation = (
  module: string,
  operation: string,
  level?: 'low' | 'medium' | 'high'
): boolean => {
  const userStore = useUserStore()
  return userStore.hasOperationPermission(module, operation, level)
}

/**
 * 获取用户数据权限范围描述
 */
export const getDataScopeDescription = (): string => {
  const userStore = useUserStore()
  const { scope } = userStore.permissions.data
  
  const scopeMap = {
    all: '全部数据',
    department: '部门数据',
    own: '个人数据',
    custom: '自定义范围'
  }
  
  return scopeMap[scope] || '未知范围'
}

/**
 * 检查字段是否需要脱敏显示
 */
export const shouldMaskField = (field: string, value: any): boolean => {
  const userStore = useUserStore()
  
  // 如果用户有敏感数据访问权限，不脱敏
  if (userStore.hasSensitiveAccess(field)) {
    return false
  }
  
  // 检查是否为敏感数据
  return isMaskedData(value)
}

/**
 * 数据权限装饰器工厂
 * 用于组合式API中的权限检查
 */
export const useDataPermission = () => {
  const userStore = useUserStore()
  
  return {
    // 检查数据权限
    hasDataPermission: userStore.hasDataPermission,
    hasRegionalAccess: userStore.hasRegionalAccess,
    hasDepartmentAccess: userStore.hasDepartmentAccess,
    hasSensitiveAccess: userStore.hasSensitiveAccess,
    hasOperationPermission: userStore.hasOperationPermission,
    
    // 工具方法
    checkDataPermission,
    filterDataList,
    processSensitiveData,
    processSensitiveDataList,
    canPerformOperation,
    getDataScopeDescription,
    shouldMaskField,
    
    // 权限信息
    dataScope: userStore.permissions.data.scope,
    permissions: userStore.permissions
  }
}

/**
 * 权限验证中间件
 * 在路由或组件加载前进行权限验证
 */
export const validatePermissions = (
  requiredPermissions: {
    menu?: string[]
    operation?: Record<string, string[]>
    data?: string[]
    sensitive?: string[]
  }
): boolean => {
  const userStore = useUserStore()
  
  // 检查菜单权限
  if (requiredPermissions.menu) {
    const hasAllMenuPermissions = requiredPermissions.menu.every(menu =>
      userStore.permissions.menu.includes(menu)
    )
    if (!hasAllMenuPermissions) return false
  }
  
  // 检查操作权限
  if (requiredPermissions.operation) {
    for (const [module, operations] of Object.entries(requiredPermissions.operation)) {
      const hasAllOperations = operations.every(op =>
        userStore.hasOperationPermission(module, op)
      )
      if (!hasAllOperations) return false
    }
  }
  
  // 检查数据权限
  if (requiredPermissions.data) {
    const hasAllDataPermissions = requiredPermissions.data.every(dataType =>
      userStore.hasDataPermission(dataType)
    )
    if (!hasAllDataPermissions) return false
  }
  
  // 检查敏感数据权限
  if (requiredPermissions.sensitive) {
    const hasAllSensitivePermissions = requiredPermissions.sensitive.every(field =>
      userStore.hasSensitiveAccess(field)
    )
    if (!hasAllSensitivePermissions) return false
  }
  
  return true
}