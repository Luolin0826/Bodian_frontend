import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import router from './router'
import App from './App.vue'

// 样式导入
import 'ant-design-vue/dist/reset.css'
import './styles/tailwind.css'
import './styles/global.less'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)

// 全局错误处理
app.config.errorHandler = (err, _vm, info) => {
  console.error('Global Error:', err, info)
}

app.mount('#app')