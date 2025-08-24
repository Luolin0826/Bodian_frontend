import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    define: {
      // 在开发模式下强制清除 API base URL，使用代理
       'import.meta.env.VITE_API_BASE_URL': process.env.NODE_ENV === 'development' ? '""' : `"${process.env.VITE_API_BASE_URL || ''}"`
    },
    plugins: [
    vue(),
    vueJsx(),
    // 自动导入组件
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false
        })
      ],
      dts: 'src/types/components.d.ts'
    }),
    // 自动导入API
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/types/auto-imports.d.ts',
      dirs: ['src/composables', 'src/stores'],
      vueTemplate: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          'primary-color': '#1890ff',
          'link-color': '#1890ff',
          'border-radius-base': '4px'
        },
        javascriptEnabled: true
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://dev_backend:5000',
        changeOrigin: true,
        rewrite: (path) => path,
      }
    }
    }
  }
})