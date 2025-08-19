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
              <!-- 通知 - PC端显示 -->
              <a-badge :count="0" v-if="!isMobile" class="notification-badge">
                <button class="header-icon-btn" aria-label="查看通知">
                  <bell-outlined />
                </button>
              </a-badge>
              
              <!-- 用户下拉菜单 -->
              <a-dropdown placement="bottomRight">
                <button class="user-info" aria-label="用户菜单">
                  <a-avatar :size="isMobile ? 28 : 32" class="user-avatar">
                    <template #icon><user-outlined /></template>
                  </a-avatar>
                  <span v-if="!isMobile" class="user-name">
                    {{ userStore.realName || userStore.username }}
                  </span>
                  <down-outlined v-if="!isMobile" class="dropdown-icon" />
                </button>
                <template #overlay>
                  <a-menu class="user-menu" @click="handleMenuClick">
                    <a-menu-item key="profile">
                      <user-outlined />
                      <span>个人中心</span>
                    </a-menu-item>
                    <a-menu-item key="settings">
                      <setting-outlined />
                      <span>系统设置</span>
                    </a-menu-item>
                    <a-menu-divider />
                    <a-menu-item key="logout" @click="handleLogout" class="logout-item">
                      <logout-outlined />
                      <span>退出登录</span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
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
        
        <!-- 个人中心弹窗 -->
        <a-modal
          v-model:open="showProfileModal"
          title="个人中心"
          width="600px"
          :footer="null"
        >
          <div class="profile-content">
            <div class="profile-header">
              <a-avatar :size="80" class="profile-avatar">
                <template #icon><user-outlined /></template>
              </a-avatar>
              <div class="profile-info">
                <h3>{{ userStore.realName || userStore.username }}</h3>
                <p>{{ userStore.role }} | {{ userStore.username }}</p>
                <a-tag color="green" v-if="userStore.isLogin">在线</a-tag>
              </div>
            </div>
            
            <a-divider />
            
            <div class="profile-details">
              <a-row :gutter="[16, 16]">
                <a-col :span="12">
                  <div class="detail-item">
                    <label>用户名</label>
                    <span>{{ userStore.username }}</span>
                  </div>
                </a-col>
                <a-col :span="12">
                  <div class="detail-item">
                    <label>真实姓名</label>
                    <span>{{ userStore.realName || '未设置' }}</span>
                  </div>
                </a-col>
                <a-col :span="12">
                  <div class="detail-item">
                    <label>角色</label>
                    <a-tag :color="getRoleColor(userStore.role)">{{ getRoleDisplayName(userStore.role) }}</a-tag>
                  </div>
                </a-col>
                <a-col :span="12">
                  <div class="detail-item">
                    <label>登录状态</label>
                    <a-tag color="green" v-if="userStore.isLogin">已登录</a-tag>
                  </div>
                </a-col>
              </a-row>
            </div>
            
            <a-divider />
            
            <div class="profile-actions">
              <a-space>
                <a-button type="primary">
                  <setting-outlined />
                  修改资料
                </a-button>
                <a-button>
                  <lock-outlined />
                  修改密码
                </a-button>
              </a-space>
            </div>
          </div>
        </a-modal>
        
        <!-- 系统设置弹窗 -->
        <a-modal
          v-model:open="showSettingsModal"
          title="系统设置"
          width="700px"
          :footer="null"
        >
          <div class="settings-content">
            <a-tabs default-active-key="appearance" type="card">
              <a-tab-pane key="appearance" tab="界面设置">
                <div class="settings-section">
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>主题模式</h4>
                      <p>选择系统的主题外观</p>
                    </div>
                    <a-radio-group v-model:value="themeMode">
                      <a-radio-button value="light">浅色</a-radio-button>
                      <a-radio-button value="dark">深色</a-radio-button>
                      <a-radio-button value="auto">跟随系统</a-radio-button>
                    </a-radio-group>
                  </div>
                  
                  <a-divider />
                  
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>侧边栏设置</h4>
                      <p>侧边栏的显示方式</p>
                    </div>
                    <a-switch v-model:checked="sidebarCollapsed" checked-children="折叠" un-checked-children="展开" />
                  </div>
                  
                  <a-divider />
                  
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>面包屑导航</h4>
                      <p>是否显示面包屑导航</p>
                    </div>
                    <a-switch v-model:checked="showBreadcrumb" checked-children="显示" un-checked-children="隐藏" />
                  </div>
                </div>
              </a-tab-pane>
              
              <a-tab-pane key="notification" tab="通知设置">
                <div class="settings-section">
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>系统通知</h4>
                      <p>接收系统重要通知</p>
                    </div>
                    <a-switch v-model:checked="systemNotification" checked-children="开启" un-checked-children="关闭" />
                  </div>
                  
                  <a-divider />
                  
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>邮件通知</h4>
                      <p>通过邮件接收通知</p>
                    </div>
                    <a-switch v-model:checked="emailNotification" checked-children="开启" un-checked-children="关闭" />
                  </div>
                  
                  <a-divider />
                  
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>声音提醒</h4>
                      <p>新消息声音提醒</p>
                    </div>
                    <a-switch v-model:checked="soundNotification" checked-children="开启" un-checked-children="关闭" />
                  </div>
                </div>
              </a-tab-pane>
              
              <a-tab-pane key="security" tab="安全设置">
                <div class="settings-section">
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>自动登出</h4>
                      <p>无操作自动登出时间</p>
                    </div>
                    <a-select v-model:value="autoLogoutTime" style="width: 150px">
                      <a-select-option :value="15">15分钟</a-select-option>
                      <a-select-option :value="30">30分钟</a-select-option>
                      <a-select-option :value="60">1小时</a-select-option>
                      <a-select-option :value="120">2小时</a-select-option>
                      <a-select-option :value="0">永不</a-select-option>
                    </a-select>
                  </div>
                  
                  <a-divider />
                  
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>密码安全</h4>
                      <p>修改登录密码</p>
                    </div>
                    <a-button type="primary" size="small">
                      <lock-outlined />
                      修改密码
                    </a-button>
                  </div>
                  
                  <a-divider />
                  
                  <div class="setting-item">
                    <div class="setting-label">
                      <h4>登录日志</h4>
                      <p>查看最近登录记录</p>
                    </div>
                    <a-button size="small">
                      <history-outlined />
                      查看日志
                    </a-button>
                  </div>
                </div>
              </a-tab-pane>
            </a-tabs>
          </div>
        </a-modal>
      </a-layout>
    </template>
    
    <script setup lang="ts">
    import { ref, computed } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { Modal } from 'ant-design-vue'
    import {
      MenuFoldOutlined,
      MenuUnfoldOutlined,
      MenuOutlined,
      BellOutlined,
      UserOutlined,
      SettingOutlined,
      LogoutOutlined,
      DownOutlined,
      CloseOutlined,
      LockOutlined,
      HistoryOutlined
    } from '@ant-design/icons-vue'
    import { useUserStore } from '@/stores/user'
    import { useResponsive } from '@/composables/useResponsive'
    import SideMenu from './components/SideMenu.vue'
    import Breadcrumb from './components/Breadcrumb.vue'
    
    const route = useRoute()
    const router = useRouter()
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
        '/system/user': '用户管理',
        '/system/role': '角色管理',
        '/system/log': '操作日志'
      }
      return routeMap[route.path] || '电网招生系统'
    })
    
    const handleLogout = () => {
      Modal.confirm({
        title: '确认退出',
        content: '确定要退出登录吗？',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          await userStore.logout()
          router.push('/login')
        }
      })
    }
    
    const handleMenuClick = ({ key }: { key: string }) => {
      switch (key) {
        case 'profile':
          showProfileModal.value = true
          break
        case 'settings':
          showSettingsModal.value = true
          break
      }
    }
    
    const handleMobileMenuSelect = () => {
      showDrawer.value = false
    }
    
    // 个人中心和系统设置的弹窗状态
    const showProfileModal = ref(false)
    const showSettingsModal = ref(false)
    
    // 系统设置相关的状态
    const themeMode = ref('light')
    const sidebarCollapsed = ref(false)
    const showBreadcrumb = ref(true)
    const systemNotification = ref(true)
    const emailNotification = ref(false)
    const soundNotification = ref(true)
    const autoLogoutTime = ref(60)
    
    // 获取角色颜色
    const getRoleColor = (role: string) => {
      const colors = {
        super_admin: '#f5222d',
        admin: '#fa541c', 
        manager: '#faad14',
        sales: '#52c41a',
        teacher: '#1890ff',
        viewer: '#722ed1'
      }
      return colors[role as keyof typeof colors] || '#666666'
    }
    
    // 获取角色显示名称
    const getRoleDisplayName = (role: string) => {
      const names = {
        super_admin: '超级管理员',
        admin: '管理员',
        manager: '经理',
        sales: '销售',
        teacher: '教师',
        viewer: '观察员'
      }
      return names[role as keyof typeof names] || role
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    
    .notification-badge {
      :deep(.ant-badge-count) {
        box-shadow: 0 0 0 1px #fff;
      }
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border: none;
      background: transparent;
      border-radius: var(--border-radius-base);
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        background: #f5f5f5;
      }
      
      @media (max-width: 768px) {
        padding: 8px;
      }
    }
    
    .user-name {
      font-size: 14px;
      color: #2c3e50;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .dropdown-icon {
      font-size: 12px;
      color: #999;
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
    
    // 个人中心弹窗样式
    .profile-content {
      .profile-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
        
        .profile-avatar {
          flex-shrink: 0;
        }
        
        .profile-info {
          h3 {
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
            color: #262626;
          }
          
          p {
            margin: 0 0 8px 0;
            color: #8c8c8c;
            font-size: 14px;
          }
        }
      }
      
      .profile-details {
        .detail-item {
          label {
            display: block;
            font-weight: 500;
            color: #262626;
            margin-bottom: 4px;
            font-size: 13px;
          }
          
          span {
            color: #595959;
            font-size: 14px;
          }
        }
      }
      
      .profile-actions {
        text-align: center;
      }
    }
    
    // 系统设置弹窗样式
    .settings-content {
      .settings-section {
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          
          .setting-label {
            flex: 1;
            
            h4 {
              margin: 0 0 4px 0;
              font-size: 14px;
              font-weight: 500;
              color: #262626;
            }
            
            p {
              margin: 0;
              font-size: 12px;
              color: #8c8c8c;
            }
          }
        }
      }
    }
    </style>