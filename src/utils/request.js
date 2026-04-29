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

service.interceptors.response.use(
  response => {
    const res = response.data
    if (Array.isArray(res)) return res
    if (res.code !== 0) {
      ElMessage({ message: res.message || 'Error', type: 'error', duration: 5000 })
      if (res.code === 403) {
        removeToken()
        window.location.reload()
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
