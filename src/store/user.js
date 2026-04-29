import { defineStore, acceptHMRUpdate } from 'pinia'
import { current, login } from '@/api/user'
import { setToken, removeToken, setCode, removeCode } from '@/utils/auth'
import { useAppStore } from '@/store/app'
import { oidcAuth, oidcQuery } from '@/api/login'

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    nickname: '',
    username: '',
    email: '',
    token: '',
    role: '',
    avatar: '',
    route_names: [],
    loaded: false,
  }),

  getters: {
    isAdmin: (s) => Array.isArray(s.route_names) && s.route_names.includes('*'),
    canAccess: (s) => (name) => {
      if (!s.route_names) return false
      if (s.route_names.includes('*')) return true
      return s.route_names.includes(name)
    },
  },

  actions: {
    logout () {
      removeToken()
      removeCode()
      this.$reset()
      this.loaded = false
    },

    saveUserData (userData) {
      setToken(userData.token)
      localStorage.setItem('user_info', JSON.stringify({ name: userData.username }))
      this.$patch({ ...userData, loaded: true })
    },

    async login (form) {
      const res = await login(form).catch(e => e)
      if (!res.code) {
        useAppStore().loadConfig()
        this.saveUserData(res.data)
        return res.data
      }
      return Promise.reject(res)
    },

    async info () {
      const res = await current().catch(() => false)
      if (res) {
        useAppStore().loadConfig()
        const userData = res.data
        setToken(userData.token)
        this.$patch({ ...userData, loaded: true })
        return userData
      }
      return false
    },

    async oidc (provider, platform, browser) {
      const data = {
        deviceInfo: {
          name: navigator.userAgent,
          os: platform,
          type: 'webadmin',
        },
        id: `${platform}-${browser}`,
        op: provider,
        uuid: '',
      }
      const res = await oidcAuth(data).catch(() => false)
      if (res) {
        const { code, url } = res.data
        setCode(code)
        if (provider === 'webauth') window.open(url)
        else window.location.href = url
      }
    },

    async query (code) {
      const res = await oidcQuery({ code, uuid: '' }).catch(() => false)
      if (res) {
        removeCode()
        useAppStore().loadConfig()
        this.saveUserData(res.data)
        return res.data
      }
      return false
    },
  },
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
