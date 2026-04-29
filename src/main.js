import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import { router } from '@/router'
import 'normalize.css/normalize.css'
import { pinia } from '@/store'
import '@/permission'
import '@/styles/style.scss'
import * as ElementIcons from '@element-plus/icons-vue'

const app = createApp(App)
app.use(ElementPlus, { locale: en })
app.use(pinia)
app.use(router)
for (const name in ElementIcons) {
  app.component(name, ElementIcons[name])
}
app.mount('#app')
