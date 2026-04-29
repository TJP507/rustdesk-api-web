import { router } from '@/router'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { getToken } from '@/utils/auth'
import { pinia } from '@/store'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/register']
const oauthPathPrefix = '/oauth/'

const appStore = useAppStore(pinia)
appStore.getAdminConfig()

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const title = to.meta?.title
  document.title = title ? `${title} · ${appStore.setting.title}` : appStore.setting.title

  // OAuth callback paths are public — they exchange a code into a token.
  if (to.path.startsWith(oauthPathPrefix)) return next()

  const token = getToken()
  if (!token) {
    if (whiteList.includes(to.path)) return next()
    return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  const userStore = useUserStore(pinia)
  if (!userStore.loaded) {
    const info = await userStore.info()
    if (!info) {
      userStore.logout()
      return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  }

  // Block route if it requires a permission name the user doesn't have.
  if (to.meta?.route && !userStore.canAccess(to.meta.route)) {
    return next('/me')
  }

  next()
})

router.afterEach(() => NProgress.done())
