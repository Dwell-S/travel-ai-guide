import { createApp } from 'vue'
import './style.css'
// 引入顺序：先主题令牌（theme.css），再公共样式（common.css），保证变量可被引用
import './styles/theme.css'
import './styles/common.css'
import App from './App.vue'
import router from './router'

// 说明：Vant 组件由 vite.config.js 中的 VantResolver 按需自动引入
// （组件样式也会自动引入），因此这里不再全量注册 Vant。
// 注意：本项目禁止使用 showToast / showDialog 等函数式 API，
// 统一改用模板组件 <van-toast> / <van-dialog>（与 Vue 3.5 响应式兼容）。

createApp(App).use(router).mount('#app')
