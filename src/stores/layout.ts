import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // 侧边栏状态
  const sidebarCollapsed = ref(false)
  const showMobileDrawer = ref(false)
  
  // 响应式相关状态
  const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)
  
  // 计算属性
  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
  const isDesktop = computed(() => windowWidth.value >= 1024)
  
  // 侧边栏宽度计算
  const sidebarWidth = computed(() => {
    if (isMobile.value) return 0
    return sidebarCollapsed.value ? 80 : 240
  })
  
  // 主内容区域的左边距
  const mainContentMarginLeft = computed(() => {
    if (isMobile.value) return 0
    return sidebarWidth.value
  })
  
  // 主内容区域的宽度
  const mainContentWidth = computed(() => {
    if (isMobile.value) return windowWidth.value
    return windowWidth.value - sidebarWidth.value
  })
  
  // 方法
  const toggleSidebar = () => {
    if (isMobile.value) {
      showMobileDrawer.value = !showMobileDrawer.value
    } else {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }
  }
  
  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
  }
  
  const setMobileDrawer = (show: boolean) => {
    showMobileDrawer.value = show
  }
  
  const updateWindowSize = (width: number, height: number) => {
    windowWidth.value = width
    windowHeight.value = height
  }
  
  // 获取布局类名
  const getLayoutClass = () => {
    const classes = []
    
    if (isMobile.value) {
      classes.push('layout-mobile')
    } else if (isTablet.value) {
      classes.push('layout-tablet')
    } else {
      classes.push('layout-desktop')
    }
    
    if (!isMobile.value) {
      classes.push(sidebarCollapsed.value ? 'sidebar-collapsed' : 'sidebar-expanded')
    }
    
    return classes.join(' ')
  }
  
  // 获取主内容区域的样式
  const getMainContentStyle = () => {
    return {
      marginLeft: `${mainContentMarginLeft.value}px`,
      width: `${mainContentWidth.value}px`,
      transition: 'margin-left 0.2s ease, width 0.2s ease'
    }
  }
  
  return {
    // 状态
    sidebarCollapsed,
    showMobileDrawer,
    windowWidth,
    windowHeight,
    
    // 计算属性
    isMobile,
    isTablet,
    isDesktop,
    sidebarWidth,
    mainContentMarginLeft,
    mainContentWidth,
    
    // 方法
    toggleSidebar,
    setSidebarCollapsed,
    setMobileDrawer,
    updateWindowSize,
    getLayoutClass,
    getMainContentStyle
  }
})