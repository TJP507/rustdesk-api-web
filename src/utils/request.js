import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'

const service = axios.create({
  baseURL: import.meta.env.VITE_SERVER_API,
  withCredentials: true,
  timeout: 50000,
})

service.interceptors.request.use(
  config => {
    config.headers = config.headers || {}
    const token = getToken()
    if (token) config.headers['api-token'] = token
    config.headers['Accept-Language'] = 'en'
    return config
  },
  error => Promise.reject(error),
)

function isPublicRoute () {
  const hash = window.location.hash || ''
  return hash.startsWith('#/login') || hash.startsWith('#/register') || hash.startsWith('#/oauth')
}

service.interceptors.response.use(
  response => {
    const res = response.data
    if (Array.isArray(res)) return res
    if (res.code !== 0) {
      // Suppress noisy "must auth" errors when the caller is anonymous —
      // those are expected on public pages and the route guard handles redirects.
      const onPublic = isPublicRoute()
      const silent = res.code === 403 && onPublic
      if (!silent) {
        ElMessage({ message: res.message || 'Error', type: 'error', duration: 5000 })
      }
      if (res.code === 403 && !onPublic) {
        removeToken()
        if (!isPublicRoute()) window.location.hash = '#/login'
      }
      return Promise.reject(res)
    }
    return res
  },
  error => {
    if (error.code === 'ECONNABORTED' && error.message.indexOf('timeout') > -1) {
      error.message = 'Connection timed out'
    }
    ElMessage({ message: error.message, type: 'error', duration: 5000 })
    return Promise.reject(error)
  },
)

export default service
