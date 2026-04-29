import { defineStore, acceptHMRUpdate } from 'pinia'
import { admin, app, server } from '@/api/config'

export const useAppStore = defineStore({
  id: 'App',
  state: () => ({
    setting: {
      title: 'RustDesk Console',
      hello: '',
      sideIsCollapse: localStorage.getItem('sideIsCollapse') === '1',
      appConfig: {
        web_client: 0,
      },
      rustdeskConfig: {
        id_server: '',
        key: '',
        relay_server: '',
        api_server: '',
      },
    },
  }),

  actions: {
    sideCollapse () {
      this.setting.sideIsCollapse = !this.setting.sideIsCollapse
      localStorage.setItem('sideIsCollapse', this.setting.sideIsCollapse ? '1' : '0')
    },
    loadConfig () {
      return Promise.all([this.getAppConfig(), this.getAdminConfig(), this.loadRustdeskConfig()])
    },
    getAppConfig () {
      return app().then(res => { this.setting.appConfig = res.data })
    },
    getAdminConfig () {
      return admin().then(res => {
        this.replaceAdminTitle(res.data.title)
        this.setting.hello = res.data.hello
      }).catch(() => {})
    },
    replaceAdminTitle (newTitle) {
      if (!newTitle) return
      this.setting.title = newTitle
      document.title = newTitle
    },
    async loadRustdeskConfig () {
      const res = await server().catch(() => false)
      if (res) {
        this.setting.rustdeskConfig = res.data
        const prefix = 'wc-'
        localStorage.setItem(`${prefix}custom-rendezvous-server`, res.data.id_server || '')
        localStorage.setItem(`${prefix}key`, res.data.key || '')
        localStorage.setItem(`${prefix}api-server`, res.data.api_server || '')
      }
    },
  },
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
