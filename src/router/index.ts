import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores/user'
import { getPermissionKeyByPath, DEFAULT_ROLE_PERMISSIONS } from '@/utils/menuPermissions'

NProgress.configure({ showSpinner: false })

// 公开路由
const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限', noAuth: true }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', noAuth: true }
  },
  {
    path: '/error/account-disabled',
    name: 'AccountDisabled',
    component: () => import('@/views/error/account-disabled.vue'),
    meta: { title: '账号已被禁用', noAuth: true }
  }
]

// 需要认证的路由
const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/default/index.vue'),
    redirect: (to) => {
      // 动态重定向：根据用户权限和角色重定向到合适的首页
      const userStore = useUserStore()
      
      console.log('🏠 首页重定向逻辑:', {
        userRole: userStore.userInfo?.role,
        hasUserInfo: !!userStore.userInfo,
        menuPermissions: userStore.permissions?.menu || [],
        permissionCount: userStore.permissions?.menu?.length || 0
      })
      
      // 检查是否有权限数据
      const hasPermissionData = userStore.permissions?.menu && userStore.permissions.menu.length > 0
      
      if (!hasPermissionData) {
        console.log('⚠️ 权限数据为空，延迟到路由守卫中处理权限获取和重定向')
        // 先跳转到用户中心，让路由守卫处理权限获取
        return '/user-center'
      }
      
      // 优先级1：如果有dashboard权限，重定向到工作台
      if (userStore.hasMenuPermission('/dashboard')) {
        console.log('✅ 重定向到工作台 (有权限)')
        return '/dashboard'
      }
      
      // 优先级2：根据角色选择合适的首页
      const userRole = userStore.userInfo?.role
      if (userRole) {
        const roleHomePage = {
          'super_admin': '/dashboard',
          'admin': '/dashboard', 
          'manager': '/dashboard',
          'sales': '/customer/list',
          'teacher': '/script', // 知识库（仅教师角色）
          'viewer': '/user-center'
        }[userRole]
        
        if (roleHomePage) {
          console.log(`✅ 根据角色 ${userRole} 重定向到: ${roleHomePage}`)
          return roleHomePage
        }
      }
      
      // 优先级3：默认重定向到用户中心（所有用户都能访问的安全页面）
      console.log('✅ 默认重定向到用户中心')
      return '/user-center'
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'DashboardOutlined' }
      },
      {
        path: 'customer',
        name: 'Customer',
        meta: { title: '客户管理', icon: 'TeamOutlined' },
        children: [
          {
            path: 'list',
            name: 'CustomerList',
            component: () => import('@/views/customer/list.vue'),
            meta: { title: '客户列表' }
          },
          {
            path: 'follow',
            name: 'CustomerFollow',
            component: () => import('@/views/customer/follow.vue'),
            meta: { title: '跟进管理' }
          },
          {
            path: 'reminders',
            name: 'CustomerReminders',
            component: () => import('@/views/customer/reminders.vue'),
            meta: { title: '跟进提醒' }
          },
          {
            path: 'analytics',
            name: 'CustomerAnalytics',
            component: () => import('@/views/customer/analytics.vue'),
            meta: { title: '跟进分析' }
          }
        ]
      },
      {
        path: 'sales',
        name: 'Sales',
        meta: { title: '销售管理', icon: 'ShoppingOutlined' },
        children: [
          {
            path: 'record',
            name: 'SalesRecord',
            component: () => import('@/views/sales/record.vue'),
            meta: { title: '销售记录' }
          },
          {
            path: 'stats',
            name: 'SalesStats',
            component: () => import('@/views/sales/stats.vue'),
            meta: { title: '销售统计' }
          }
        ]
      },
      {
        path: 'script',
        name: 'Script',
        component: () => import('@/views/script/index.vue'),
        meta: { title: '知识库', icon: 'FileTextOutlined' }
      },
      // {
      //   path: 'knowledge',
      //   name: 'Knowledge',
      //   component: () => import('@/views/knowledge/index.vue'),
      //   meta: { title: '知识库', icon: 'BookOutlined' }
      // },
      {
        path: 'data-query',
        name: 'DataQuery',
        component: () => import('@/views/data-query/index.vue'),
        meta: { title: '数查一点通', icon: 'SearchOutlined' }
      },
      {
        path: 'policy-management',
        name: 'PolicyManagement',
        component: () => import('@/views/data-query/policy-management.vue'),
        meta: { 
          title: '三级政策管理', 
          icon: 'SettingOutlined',
          hideInMenu: true,
          parent: 'DataQuery'
        }
      },
      {
        path: 'advance-batch',
        name: 'AdvanceBatch',
        component: () => import('@/views/advance-batch/index.vue'),
        meta: { title: '提前批信息', icon: 'ScheduleOutlined' }
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: () => import('@/views/user-center/index.vue'),
        meta: { title: '用户中心', icon: 'ProfileOutlined' }
      },
      {
        path: 'user-center/profile',
        name: 'UserProfile',
        component: () => import('@/views/user-center/profile.vue'),
        meta: { title: '个人信息', parent: 'UserCenter' }
      },
      {
        path: 'user-center/preferences',
        name: 'UserPreferences',
        component: () => import('@/views/user-center/preferences.vue'),
        meta: { title: '偏好设置', parent: 'UserCenter' }
      },
      {
        path: 'user-center/notifications',
        name: 'UserNotifications',
        component: () => import('@/views/user-center/notifications.vue'),
        meta: { title: '消息通知', parent: 'UserCenter' }
      },
      {
        path: 'user-center/security',
        name: 'UserSecurity',
        component: () => import('@/views/user-center/security.vue'),
        meta: { title: '安全设置', parent: 'UserCenter' }
      },
      {
        path: 'user-center/login-logs',
        name: 'UserLoginLogs',
        component: () => import('@/views/user-center/login-logs.vue'),
        meta: { title: '登录日志', parent: 'UserCenter' }
      },
      {
        path: 'user-center/devices',
        name: 'UserDevices',
        component: () => import('@/views/user-center/devices.vue'),
        meta: { title: '设备管理', parent: 'UserCenter' }
      },
      {
        path: 'system',
        name: 'System',
        meta: { title: '系统设置', icon: 'SettingOutlined' },
        children: [
          {
            path: 'user',
            name: 'SystemUser',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: 'department',
            name: 'SystemDepartment',
            component: () => import('@/views/system/department/index.vue'),
            meta: { title: '部门管理' }
          },
          {
            path: 'role',
            name: 'SystemRole',
            component: () => import('@/views/system/role/index.vue'),
            meta: { title: '角色权限' }
          },
          {
            path: 'region',
            name: 'SystemRegion',
            component: () => import('@/views/system/region/index.vue'),
            meta: { title: '区域管理' }
          },
          {
            path: 'log',
            name: 'SystemLog',
            component: () => import('@/views/system/log/index.vue'),
            meta: { title: '操作日志' }
          },
        ]
      }
    ]
  }
]

const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...authRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  // 设置页面标题
  document.title = `${to.meta.title || '页面'} - ${import.meta.env.VITE_APP_TITLE}`
  
  const userStore = useUserStore()
  
  // 不需要认证的页面直接放行
  if (to.meta.noAuth) {
    next()
    return
  }
  
  // 需要认证的页面检查登录状态
  if (!userStore.isLogin) {
    next('/login')
    return
  }
  
  // 权限校验逻辑
  try {
    console.log('🔍 路由守卫权限检查:', {
      hasUserInfo: !!userStore.userInfo,
      userRole: userStore.userInfo?.role,
      menuCount: userStore.permissions.menu?.length || 0,
      targetPath: to.path
    })
    
    // 如果用户信息为空或权限数据为空，先获取用户信息和权限
    if (!userStore.userInfo || !userStore.permissions.menu || userStore.permissions.menu.length === 0) {
      console.log('🔄 获取用户信息和权限数据...')
      await userStore.getUserInfo()
      
      // 如果权限数据仍然为空，使用角色的最小权限集合作为兜底
      if (!userStore.permissions.menu || userStore.permissions.menu.length === 0) {
        console.log('⚠️ 权限数据为空，使用角色的最小权限集合')
        
        // 为不同角色提供最小权限集合
        const minimalPermissions: Record<string, string[]> = {
          'super_admin': ['dashboard', 'user-center', 'user-center.profile'],
          'admin': ['dashboard', 'user-center', 'user-center.profile'],
          'manager': ['dashboard', 'user-center', 'user-center.profile'],
          'sales': ['dashboard', 'user-center', 'user-center.profile'],
          'teacher': ['user-center', 'user-center.profile', 'script', 'data-query'],
          'viewer': ['user-center', 'user-center.profile']
        }
        
        const userRole = userStore.userInfo?.role || 'viewer'
        const permissions = minimalPermissions[userRole] || minimalPermissions.viewer
        
        userStore.setPermissions({
          menu: permissions,
          operation: {},
          data: {
            scope: 'own',
            regional_permissions: [],
            department_permissions: [],
            customer_permissions: [],
            data_types: [],
            sensitive: []
          }
        })
        
        console.log('✅ 已设置最小权限集合:', permissions)
      }
    }
    
    // 只有从根路径 '/' 重定向到用户中心的情况下，才进行进一步的角色重定向
    // 这避免了用户主动访问用户中心时被错误重定向
    if (to.path === '/user-center' && from.path === '/' && userStore.userInfo?.role) {
      const userRole = userStore.userInfo.role
      
      console.log('🔄 检测到从根路径重定向到用户中心，尝试根据角色进一步重定向:', {
        userRole,
        fromPath: from.path,
        toPath: to.path
      })
      
      // 对于管理员角色，如果有dashboard权限，重定向到工作台
      if ((userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager') && 
          userStore.hasMenuPermission('/dashboard')) {
        console.log(`🔄 权限获取完成，管理员用户重定向到工作台`)
        next('/dashboard')
        return
      }
      
      // 对于教师角色，如果有script权限，重定向到知识库
      if (userRole === 'teacher' && userStore.hasMenuPermission('/script')) {
        console.log(`🔄 权限获取完成，教师用户重定向到知识库`)
        next('/script')
        return
      }
      
      // 对于销售角色，如果有customer权限，重定向到客户列表
      if (userRole === 'sales' && userStore.hasMenuPermission('/customer/list')) {
        console.log(`🔄 权限获取完成，销售用户重定向到客户列表`)
        next('/customer/list')
        return
      }
    }
    
    // 检查菜单访问权限 - 只有用户中心是基础页面，其他都需要权限验证
    const publicPages = [
      '/user-center', '/user-center/profile', '/user-center/preferences', 
      '/user-center/notifications', '/user-center/security', '/user-center/login-logs', 
      '/user-center/devices'
    ]
    
    // 检查是否为公开页面（所有登录用户都能访问）
    const isPublicPage = publicPages.some(page => to.path === page || to.path.startsWith(page))
    
    // 除了公开页面，其他都需要权限验证
    const requiresPermissionCheck = !isPublicPage && to.path !== '/'
    
    if (requiresPermissionCheck) {
      let hasPermission = false
      
      // 获取权限key
      const permissionKey = getPermissionKeyByPath(to.path)
      
      if (permissionKey) {
        // 检查用户存储的菜单权限
        hasPermission = userStore.permissions.menu.includes(permissionKey)
        
        console.log('🔍 页面权限检查:', {
          path: to.path,
          permissionKey,
          userRole: userStore.userInfo?.role,
          userMenuPermissions: userStore.permissions.menu,
          hasPermission
        })
      } else {
        // 对于系统管理页面，如果无权限key则按角色判断
        if (to.path.startsWith('/system')) {
          hasPermission = userStore.userInfo?.role === 'super_admin' || userStore.userInfo?.role === 'admin'
          console.log('🔍 系统页面角色权限检查:', {
            path: to.path,
            userRole: userStore.userInfo?.role,
            hasPermission
          })
        } else {
          // 其他页面如果没有权限key，记录警告但不阻止访问
          console.log('⚠️ 页面无权限key，默认拒绝访问:', to.path)
          hasPermission = false
        }
      }
      
      if (!hasPermission) {
        console.log(`❌ 用户无权限访问页面: ${to.path}`, {
          userRole: userStore.userInfo?.role,
          permissionKey,
          userMenuPermissions: userStore.permissions.menu
        })
        
        // 重定向到用户中心而不是403页面，提供更好的用户体验
        next('/user-center')
        return
      }
    } else {
      // 公开页面（用户中心）直接允许访问
      console.log('✅ 公开页面，直接允许访问:', to.path)
    }
    
    console.log(`✅ 用户有权限访问页面: ${to.path}`, {
      userRole: userStore.userInfo?.role
    })
    next()
  } catch (error) {
    console.error('权限验证失败:', error)
    // 权限验证失败，重新登录
    next('/login')
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router