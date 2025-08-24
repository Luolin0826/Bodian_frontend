import type { App, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

// v-permission 指令 - 用于控制操作权限
export const permissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const userStore = useUserStore()

    if (value && typeof value === 'object') {
      const { module, operation } = value
      
      if (module && operation) {
        const hasPermission = userStore.hasOperationPermission(module, operation)
        
        if (!hasPermission) {
          // 没有权限时隐藏元素
          el.style.display = 'none'
          // 或者移除元素
          // el.remove()
        }
      }
    } else if (typeof value === 'string') {
      // 兼容字符串格式: "module.operation"
      const [module, operation] = value.split('.')
      
      if (module && operation) {
        const hasPermission = userStore.hasOperationPermission(module, operation)
        
        if (!hasPermission) {
          el.style.display = 'none'
        }
      }
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    // 权限更新时重新检查
    const { value } = binding
    const userStore = useUserStore()

    if (value && typeof value === 'object') {
      const { module, operation } = value
      
      if (module && operation) {
        const hasPermission = userStore.hasOperationPermission(module, operation)
        
        if (hasPermission) {
          el.style.display = ''
        } else {
          el.style.display = 'none'
        }
      }
    } else if (typeof value === 'string') {
      const [module, operation] = value.split('.')
      
      if (module && operation) {
        const hasPermission = userStore.hasOperationPermission(module, operation)
        
        if (hasPermission) {
          el.style.display = ''
        } else {
          el.style.display = 'none'
        }
      }
    }
  }
}

// 权限检查函数 - 用于组件内的权限判断
export function hasPermission(module: string, operation: string): boolean {
  const userStore = useUserStore()
  // 确保权限检查逻辑与store中一致
  return userStore.hasOperationPermission(module, operation)
}

// 菜单权限检查函数
export function hasMenuPermission(menuPath: string): boolean {
  const userStore = useUserStore()
  return userStore.hasMenuPermission(menuPath)
}

// 安装指令到 Vue 应用
export function setupPermissionDirective(app: App) {
  app.directive('permission', permissionDirective)
}