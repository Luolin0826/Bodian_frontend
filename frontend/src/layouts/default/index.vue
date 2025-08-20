<template>
      <a-layout class="layout-container">
        <!-- 侧边栏 - PC端显示 -->
        <a-layout-sider
          v-if="!isMobile"
          v-model:collapsed="collapsed"
          :trigger="null"
          :width="240"
          :collapsed-width="80"
          collapsible
          class="layout-sider"
        >
          <div class="logo" :class="{ 'logo-collapsed': collapsed }">
            <transition name="fade" mode="out-in">
              <img 
                v-if="collapsed" 
                key="short"
                src="/src/assets/images/logo_all.png" 
                alt="EG"
                class="logo-image logo-image-collapsed"
              />
              <img 
                v-else 
                key="full"
                src="/src/assets/images/logo_all.png" 
                alt="电网招生系统"
                class="logo-image logo-image-full"
              />
            </transition>
          </div>
          <SideMenu :collapsed="collapsed" />
        </a-layout-sider>
    
        <a-layout class="layout-main">
          <!-- 顶部导航栏 -->
          <a-layout-header class="layout-header" :class="{ 'layout-header-mobile': isMobile }">
            <div class="header-left">
              <!-- 移动端菜单按钮 -->
              <button
                v-if="isMobile"
                class="header-menu-btn"
                @click="showDrawer = true"
                :aria-label="'打开菜单'"
              >
                <menu-outlined />
              </button>
              
              <!-- PC端折叠按钮 -->
              <button
                v-else
                class="header-collapse-btn"
                @click="collapsed = !collapsed"
                :aria-label="collapsed ? '展开侧边栏' : '收起侧边栏'"
              >
                <menu-fold-outlined v-if="!collapsed" />
                <menu-unfold-outlined v-else />
              </button>
              
              <!-- 面包屑 - PC端显示 -->
              <Breadcrumb v-if="!isMobile" class="breadcrumb" />
              
              <!-- 移动端标题 -->
              <h1 v-if="isMobile" class="mobile-title">{{ currentPageTitle }}</h1>
            </div>
    
            <!-- 用户信息 -->
            <div class="header-right">
              <UserMenu />
            </div>
          </a-layout-header>
    
          <!-- 主内容区 -->
          <a-layout-content class="layout-content">
            <div class="page-container mobile-scroll">
              <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
            </div>
          </a-layout-content>
        </a-layout>
    
        <!-- 移动端抽屉菜单 -->
        <a-drawer
          v-model:open="showDrawer"
          placement="left"
          :closable="false"
          :width="280"
          :body-style="{ padding: 0 }"
          class="mobile-drawer"
        >
          <div class="drawer-header">
            <div class="drawer-logo">
              <img 
                src="/src/assets/images/logo_all.png" 
                alt="电网招生系统"
                class="drawer-logo-image"
              />
            </div>
            <button class="drawer-close" @click="showDrawer = false" aria-label="关闭菜单">
              <close-outlined />
            </button>
          </div>
          <SideMenu @select="handleMobileMenuSelect" />
        </a-drawer>
      </a-layout>
    </template>
    
    <script setup lang="ts">
    import { ref, computed } from 'vue'
    import { useRoute } from 'vue-router'
    import {
      MenuFoldOutlined,
      MenuUnfoldOutlined,
      MenuOutlined,
      CloseOutlined
    } from '@ant-design/icons-vue'
    import { useUserStore } from '@/stores/user'
    import { useResponsive } from '@/composables/useResponsive'
    import SideMenu from './components/SideMenu.vue'
    import Breadcrumb from './components/Breadcrumb.vue'
    import UserMenu from '@/components/common/UserMenu.vue'
    
    const route = useRoute()
    const userStore = useUserStore()
    const { isMobile } = useResponsive()
    
    const collapsed = ref(false)
    const showDrawer = ref(false)
    
    // 当前页面标题（移动端显示）
    const currentPageTitle = computed(() => {
      const routeMap: Record<string, string> = {
        '/dashboard': '工作台',
        '/customer/list': '客户列表',
        '/customer/follow': '跟进管理',
        '/sales/record': '销售记录',
        '/sales/stats': '销售统计',
        '/script': '话术库',
        '/knowledge': '知识库',
        '/user-center': '用户中心',
        '/user-center/profile': '个人信息',
        '/user-center/preferences': '偏好设置',
        '/user-center/notifications': '消息通知',
        '/user-center/security': '安全设置',
        '/user-center/login-logs': '登录日志',
        '/system/user': '用户管理',
        '/system/role': '角色管理',
        '/system/log': '操作日志'
      }
      return routeMap[route.path] || '电网招生系统'
    })
    
    
    const handleMobileMenuSelect = () => {
      showDrawer.value = false
    }
    </script>
    
    <style scoped lang="less">
    .layout-container {
      height: 100vh;
      overflow: hidden;
    }
    
    .layout-sider {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 100;
      box-shadow: var(--box-shadow-base);
      
      :deep(.ant-layout-sider-children) {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    }
    
    .layout-main {
      margin-left: var(--sidebar-width);
      transition: var(--transition-base);
      
      .layout-sider:global(.ant-layout-sider-collapsed) + & {
        margin-left: var(--sidebar-width-collapsed);
      }
    }
    
    .logo {
      height: var(--header-height);
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      padding: 8px;
      transition: var(--transition-base);
      overflow: hidden;
    }
    
    .logo-image {
      transition: var(--transition-base);
      
      &.logo-image-full {
        width: 100%;
        height: 100%;
        object-fit: contain;
        max-width: none;
        max-height: none;
      }
      
      &.logo-image-collapsed {
        width: 100%;
        height: 100%;
        object-fit: contain;
        max-width: none;
        max-height: none;
      }
    }
    
    .layout-header {
      height: var(--header-height);
      line-height: var(--header-height);
      padding: 0 24px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
      
      &.layout-header-mobile {
        height: var(--header-height-mobile);
        line-height: var(--header-height-mobile);
        padding: 0 16px;
      }
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }
    
    .header-menu-btn,
    .header-collapse-btn,
    .header-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: var(--border-radius-base);
      cursor: pointer;
      transition: var(--transition-base);
      color: #666;
      
      &:hover {
        background: #f5f5f5;
        color: #1890ff;
      }
      
      @media (max-width: 768px) {
        width: 44px;
        height: 44px;
      }
    }
    
    .breadcrumb {
      flex: 1;
    }
    
    .mobile-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #2c3e50;
      flex: 1;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    
    .layout-content {
      height: calc(100vh - var(--header-height));
      overflow: hidden;
      
      @media (max-width: 768px) {
        height: calc(100vh - var(--header-height-mobile));
      }
    }
    
    // 移动端时调整主布局
    @media (max-width: 768px) {
      .layout-main {
        margin-left: 0;
      }
    }
    
    // 抽屉样式
    .mobile-drawer {
      :deep(.ant-drawer-content-wrapper) {
        width: 280px !important;
      }
    }
    
    .drawer-header {
      height: var(--header-height-mobile);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .drawer-logo {
      display: flex;
      align-items: center;
    }
    
    .drawer-logo-image {
      height: 32px;
      width: auto;
      object-fit: contain;
    }
    
    .drawer-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }
    
    // 用户菜单样式
    :deep(.user-menu) {
      min-width: 160px;
      
      .ant-menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        &.logout-item {
          color: #ff4d4f;
          
          &:hover {
            background: #fff2f0;
          }
        }
      }
    }
    
    // 侧边栏菜单样式
    :deep(.ant-menu) {
      border-right: none;
      flex: 1;
      overflow-y: auto;
      
      &.ant-menu-dark {
        background: #001529;
      }
    }
    
    </style>