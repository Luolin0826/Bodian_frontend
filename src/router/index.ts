import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useUserStore } from '@/stores/user'

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
  }
]

// 需要认证的路由
const authRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/default/index.vue'),
    redirect: '/dashboard',
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
        meta: { title: '话术库', icon: 'FileTextOutlined' }
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('@/views/knowledge/index.vue'),
        meta: { title: '知识库', icon: 'BookOutlined' }
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
            path: 'log',
            name: 'SystemLog',
            component: () => import('@/views/system/log/index.vue'),
            meta: { title: '操作日志' }
          },
          {
            path: 'test-api',
            name: 'TestAPI',
            component: () => import('@/views/test-api.vue'),
            meta: { title: 'API测试' }
          }
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
router.beforeEach((to, _from, next) => {
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
  
  // TODO: 这里可以添加权限校验逻辑
  
  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router