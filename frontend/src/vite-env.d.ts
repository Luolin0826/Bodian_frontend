/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 明确声明存在的组件模块
declare module '@/views/login/index.vue'
declare module '@/views/dashboard/index.vue'
declare module '@/layout/default/index.vue'
