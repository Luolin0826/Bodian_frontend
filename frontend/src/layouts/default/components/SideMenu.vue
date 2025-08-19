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
    import { ref, computed, watch } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import {
      DashboardOutlined,
      UserOutlined,
      ShoppingOutlined,
      FileTextOutlined,
      BookOutlined,
      SettingOutlined
    } from '@ant-design/icons-vue'
    
    const route = useRoute()
    const router = useRouter()
    const emit = defineEmits(['select'])
    
    const menuItems = [
      {
        key: '/dashboard',
        title: '工作台',
        icon: DashboardOutlined
      },
      {
        key: '/customer',
        title: '客户管理',
        icon: UserOutlined,
        children: [
          { key: '/customer/list', title: '客户列表' },
          { key: '/customer/follow', title: '跟进管理' }
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
        key: '/system',
        title: '系统设置',
        icon: SettingOutlined,
        children: [
          { key: '/system/user', title: '用户管理' },
          { key: '/system/department', title: '部门管理' },
          { key: '/system/role', title: '角色权限' },
          { key: '/system/log', title: '操作日志' }
        ]
      }
    ]
    
    const selectedKeys = ref<string[]>([route.path])
    const openKeys = ref<string[]>([])
    
    // 根据当前路由设置选中和展开的菜单
    watch(() => route.path, (path) => {
      selectedKeys.value = [path]
      // 找到父菜单并展开
      const parent = menuItems.find(item => 
        item.children?.some(child => child.key === path)
      )
      if (parent) {
        openKeys.value = [parent.key]
      }
    }, { immediate: true })
    
    const handleSelect = ({ key }: { key: string }) => {
      router.push(key)
      emit('select')
    }
    </script>