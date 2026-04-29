<template>
  <div class="auth-page">
    <div class="brand-pane">
      <div class="brand-inner">
        <div class="logo">
          <el-icon :size="32"><Monitor /></el-icon>
          <span>RustDesk Console</span>
        </div>
        <h1 class="tagline">Secure self-hosted remote desktop</h1>
        <p class="brand-sub">
          Manage devices, users, and access from a single console.
        </p>
      </div>
    </div>

    <div class="form-pane">
      <div class="form-card">
        <div class="form-head">
          <h2>Sign in</h2>
          <p class="text-muted">Welcome back. Please enter your details.</p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="submit">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="Username" size="large" autocomplete="username">
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="Password" size="large" show-password autocomplete="current-password" @keyup.enter="submit">
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="captchaImg" prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="Captcha" size="large" />
              <img :src="captchaImg" class="captcha-img" alt="captcha" @click="loadCaptcha" />
            </div>
          </el-form-item>

          <el-button type="primary" size="large" class="w-full" :loading="loading" @click="submit">
            Sign in
          </el-button>
        </el-form>

        <div v-if="canRegister" class="form-foot">
          <span class="text-muted">No account?</span>
          <router-link to="/register" class="link">Register</router-link>
        </div>

        <div v-if="providers.length" class="oidc-section">
          <div class="divider"><span>or continue with</span></div>
          <div class="oidc-row">
            <el-button v-for="p in providers" :key="p.op" size="large" class="oidc-btn" @click="handleOidc(p)">
              <el-icon><component :is="resolveIcon(p)" /></el-icon>
              <span>{{ p.name || p.op }}</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { loginOptions, captcha } from '@/api/login'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const formRef = ref(null)
const loading = ref(false)
const providers = ref([])
const captchaImg = ref('')
const captchaId = ref('')

const form = reactive({
  username: '',
  password: '',
  captcha: '',
})

const rules = {
  username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
  password: [{ required: true, message: 'Password is required', trigger: 'blur' }],
}

const canRegister = computed(() => !!appStore.setting.appConfig?.register_status)

function resolveIcon (p) {
  return p.icon ? p.icon : 'Link'
}

async function loadCaptcha () {
  const res = await captcha().catch(() => null)
  if (res && res.data && res.data.img) {
    captchaImg.value = res.data.img
    captchaId.value = res.data.captchaId
  } else {
    captchaImg.value = ''
    captchaId.value = ''
  }
}

async function loadProviders () {
  const res = await loginOptions().catch(() => null)
  if (Array.isArray(res)) {
    providers.value = res.filter(p => p && p.op)
  } else if (res && Array.isArray(res.data)) {
    providers.value = res.data.filter(p => p && p.op)
  }
}

function detectPlatform () {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('linux')) return 'linux'
  return 'web'
}

function detectBrowser () {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'edge'
  if (/Chrome\//.test(ua)) return 'chrome'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Safari\//.test(ua)) return 'safari'
  return 'web'
}

async function handleOidc (p) {
  try {
    await userStore.oidc(p.op, detectPlatform(), detectBrowser())
  } catch (e) {
    ElMessage.error(e?.message || 'Sign-in failed')
  }
}

async function submit () {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const payload = {
        username: form.username,
        password: form.password,
      }
      if (captchaImg.value) {
        payload.captcha = form.captcha
        payload.captchaId = captchaId.value
      }
      await userStore.login(payload)
      ElMessage.success('Signed in')
      const target = route.query.redirect || '/'
      router.push(target)
    } catch (e) {
      ElMessage.error(e?.message || 'Sign in failed')
      loadCaptcha()
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  appStore.getAppConfig()
  loadProviders()
  loadCaptcha()
})
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.brand-pane {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;
}
.brand-pane::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 40%),
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12), transparent 40%);
  pointer-events: none;
}
.brand-inner {
  position: relative;
  max-width: 440px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 56px;
}
.tagline {
  font-size: 36px;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}
.brand-sub {
  font-size: 15px;
  opacity: 0.85;
  line-height: 1.55;
  margin: 0;
}
.form-pane {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}
.form-card {
  width: 100%;
  max-width: 400px;
}
.form-head {
  margin-bottom: 28px;
  h2 {
    font-size: 26px;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
    font-weight: 700;
  }
  p { margin: 0; font-size: 14px; }
}
.captcha-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.captcha-img {
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
}
.form-foot {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  font-size: 14px;
}
.link {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  &:hover { text-decoration: underline; }
}
.oidc-section { margin-top: 28px; }
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--rd-muted, #94a3b8);
  font-size: 12.5px;
  margin-bottom: 16px;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--el-border-color);
  }
}
.oidc-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.oidc-btn {
  flex: 1 1 calc(50% - 8px);
  min-width: 130px;
}
@media (max-width: 860px) {
  .auth-page { grid-template-columns: 1fr; }
  .brand-pane { display: none; }
}
</style>
