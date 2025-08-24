<template>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        v-model:openKeys="openKeys"
        mode="inline"
        theme="dark"
        @select="handleSelect"
      >
        <template v-for="item in menuItems" :key="item.key">
          <!-- 有子菜单的项 -->
          <a-sub-menu v-if="item.children" :key="item.key">
            <template #icon>
              <component :is="item.icon" />
            </template>
            <template #title>{{ item.title }}</template>
            <a-menu-item
              v-for="child in item.children"
              :key="child.key"
            >
              {{ child.title }}
            </a-menu-item>
          </a-sub-menu>
          
          <!-- 无子菜单的项 -->
          <a-menu-item v-else :key="item.key">
            <template #icon>
              <component :is="item.icon" />
            </template>
            {{ item.title }}
          </a-menu-item>
        </template>
      </a-menu>
    </template>
    
    <script setup lang="ts">
    import { ref, watch, computed } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useUserStore } from '@/stores/user'
    import {
      DashboardOutlined,
      TeamOutlined,
      ShoppingOutlined,
      FileTextOutlined,
      BookOutlined,
      SearchOutlined,
      ProfileOutlined,
      SettingOutlined
    } from '@ant-design/icons-vue'
    
    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()
    const emit = defineEmits(['select'])
    
    // 全部菜单定义
    const allMenuItems = [
      {
        key: '/dashboard',
        title: '工作台',
        icon: DashboardOutlined
      },
      {
        key: '/customer',
        title: '客户管理',
        icon: TeamOutlined,
        children: [
          { key: '/customer/list', title: '客户列表' },
          { key: '/customer/follow', title: '跟进管理' },
          { key: '/customer/reminders', title: '跟进提醒' },
          { key: '/customer/analytics', title: '跟进分析' }
        ]
      },
      {
        key: '/sales',
        title: '销售管理',
        icon: ShoppingOutlined,
        children: [
          { key: '/sales/record', title: '销售记录' },
          { key: '/sales/stats', title: '销售统计' }
        ]
      },
      {
        key: '/script',
        title: '话术库',
        icon: FileTextOutlined
      },
      {
        key: '/knowledge',
        title: '知识库',
        icon: BookOutlined
      },
      {
        key: '/data-query',
        title: '数查一点通',
        icon: SearchOutlined
      },
      {
        key: '/user-center',
        title: '用户中心',
        icon: ProfileOutlined,
        children: [
          { key: '/user-center', title: '用户中心概览' },
          { key: '/user-center/profile', title: '个人信息' },
          { key: '/user-center/preferences', title: '偏好设置' },
          { key: '/user-center/notifications', title: '消息通知' },
          { key: '/user-center/security', title: '安全设置' },
          { key: '/user-center/login-logs', title: '登录日志' }
        ]
      },
      {
        key: '/system',
        title: '系统设置',
        icon: SettingOutlined,
        children: [
          { key: '/system/user', title: '用户管理' },
          { key: '/system/department', title: '部门管理' },
          { key: '/system/role', title: '角色权限' },
          { key: '/system/log', title: '操作日志' },
          { key: '/system/test-api', title: 'API测试' }
        ]
      }
    ]
    
    // 基于权限过滤菜单
    const menuItems = computed(() => {
      console.log('📝 SideMenu: computed 重新计算', {
        userInfo: userStore.userInfo,
        permissions: userStore.permissions,
        menuCount: userStore.permissions?.menu?.length || 0
      })
      
      // 如果用户信息或权限数据还没加载完成，返回空数组
      if (!userStore.userInfo || !userStore.permissions || !userStore.permissions.menu || userStore.permissions.menu.length === 0) {
        console.log('📝 SideMenu: 用户信息或权限数据未加载完成', {
          hasUserInfo: !!userStore.userInfo,
          hasPermissions: !!userStore.permissions,
          menuCount: userStore.permissions?.menu?.length || 0
        })
        return []
      }
      
      console.log('📝 SideMenu: 开始过滤菜单', {
        userRole: userStore.userInfo.role,
        menuPermissions: userStore.permissions.menu,
        menuCount: userStore.permissions.menu.length
      })
      
      const filterMenuItems = (items: typeof allMenuItems) => {
        return items.filter(item => {
          // 检查当前菜单项是否有权限
          const hasPermission = userStore.hasMenuPermission(item.key)
          
          if (!hasPermission) {
            return false
          }
          
          // 如果有子菜单，递归过滤子菜单
          if (item.children) {
            const filteredChildren = item.children.filter(child => 
              userStore.hasMenuPermission(child.key)
            )
            // 如果子菜单全部被过滤掉，则隐藏父菜单
            if (filteredChildren.length === 0) {
              return false
            }
            // 返回过滤后的子菜单
            return {
              ...item,
              children: filteredChildren
            }
          }
          
          return true
        }).map(item => {
          // 处理有子菜单的情况
          if (item.children) {
            return {
              ...item,
              children: item.children.filter(child => 
                userStore.hasMenuPermission(child.key)
              )
            }
          }
          return item
        })
      }
      
      const filteredItems = filterMenuItems(allMenuItems)
      console.log('📝 SideMenu: 菜单过滤完成', {
        原始菜单数量: allMenuItems.length,
        过滤后菜单数量: filteredItems.length,
        过滤结果: filteredItems.map(item => ({ key: item.key, title: item.title, hasChildren: !!item.children }))
      })
      
      return filteredItems
    })
    
    const selectedKeys = ref<string[]>([route.path])
    const openKeys = ref<string[]>([])
    
    // 根据当前路由设置选中和展开的菜单
    watch(() => route.path, (path) => {
      selectedKeys.value = [path]
      // 找到父菜单并展开 - 确保menuItems是数组
      const items = Array.isArray(menuItems.value) ? menuItems.value : []
      const parent = items.find(item => 
        item.children?.some(child => child.key === path)
      )
      if (parent) {
        openKeys.value = [parent.key]
      }
    }, { immediate: true })
    
    const handleSelect = (info: { key: string | number }) => {
      router.push(String(info.key))
      emit('select')
    }
    </script>