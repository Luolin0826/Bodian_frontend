import { ref, computed, onMounted, onUnmounted } from 'vue'

export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600
}

export function useResponsive() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

  let resizeTimer: number | null = null

  const updateSize = () => {
    // 防抖处理，提高性能
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = window.setTimeout(() => {
      width.value = window.innerWidth
      height.value = window.innerHeight
    }, 100)
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateSize, { passive: true })
      // 立即更新一次以确保准确性
      updateSize()
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateSize)
    }
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
  })

  // 基础屏幕判断
  const isMobile = computed(() => width.value < breakpoints.md)
  const isTablet = computed(() => width.value >= breakpoints.md && width.value < breakpoints.lg)
  const isDesktop = computed(() => width.value >= breakpoints.lg)
  const isWideScreen = computed(() => width.value >= breakpoints.xl)
  const isUltraWide = computed(() => width.value >= breakpoints.xxl)

  // 细分屏幕判断
  const screens = computed(() => ({
    xs: width.value < breakpoints.sm,
    sm: width.value >= breakpoints.sm && width.value < breakpoints.md,
    md: width.value >= breakpoints.md && width.value < breakpoints.lg,
    lg: width.value >= breakpoints.lg && width.value < breakpoints.xl,
    xl: width.value >= breakpoints.xl && width.value < breakpoints.xxl,
    xxl: width.value >= breakpoints.xxl
  }))

  // 屏幕方向
  const isLandscape = computed(() => width.value > height.value)
  const isPortrait = computed(() => height.value > width.value)

  // 设备类型推断
  const deviceType = computed(() => {
    if (width.value < breakpoints.md) {
      return 'mobile'
    } else if (width.value < breakpoints.lg) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  })

  // 屏幕密度
  const pixelRatio = computed(() => {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  })

  // 是否支持触摸
  const isTouchDevice = computed(() => {
    return typeof window !== 'undefined' && 'ontouchstart' in window
  })

  // 网格列数计算（用于响应式布局）
  const getGridCols = (options: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    xxl?: number
  }) => {
    const { xs = 1, sm = 2, md = 3, lg = 4, xl = 5, xxl = 6 } = options
    
    if (screens.value.xxl) return xxl
    if (screens.value.xl) return xl
    if (screens.value.lg) return lg
    if (screens.value.md) return md
    if (screens.value.sm) return sm
    return xs
  }

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWideScreen,
    isUltraWide,
    screens,
    isLandscape,
    isPortrait,
    deviceType,
    pixelRatio,
    isTouchDevice,
    getGridCols,
    breakpoints
  }
}