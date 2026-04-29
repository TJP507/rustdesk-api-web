<template>
  <div class="auth-page">
    <div class="form-card surface-card">
      <div class="head">
        <h2>Create account</h2>
        <p class="text-muted">Set up your RustDesk Console access.</p>
      </div>

      <template v-if="!canRegister && configLoaded">
        <el-alert type="info" :closable="false" show-icon
                  title="Registration is disabled"
                  description="Public registration is currently turned off. Please contact your administrator." />
        <div class="foot">
          <router-link to="/login" class="link">Back to sign in</router-link>
        </div>
      </template>

      <template v-else>
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="submit">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="Username" size="large">
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="email">
            <el-input v-model="form.email" placeholder="Email" size="large">
              <template #prefix><el-icon><Message /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="Password" size="large" show-password>
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="confirm">
            <el-input v-model="form.confirm" type="password" placeholder="Confirm password" size="large" show-password @keyup.enter="submit">
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-button type="primary" size="large" class="w-full" :loading="loading" @click="submit">
            Create account
          </el-button>
        </el-form>

        <div class="foot">
          <span class="text-muted">Already have an account?</span>
          <router-link to="/login" class="link">Sign in</router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/user'
import { loginOptions } from '@/api/login'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)
const configLoaded = ref(false)
const canRegister = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirm: '',
})


const rules = {
  username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { type: 'email', message: 'Enter a valid email address', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' },
    { min: 6, message: 'At least 6 characters', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    {
      validator: (_, v, cb) => {
        if (v !== form.password) cb(new Error('Passwords do not match'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

async function submit () {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      ElMessage.success('Account created. Please sign in.')
      router.push('/login')
    } catch (e) {
      ElMessage.error(e?.message || 'Registration failed')
    } finally {
      loading.value = false
    }
  })
}

onMounted(async () => {
  const res = await loginOptions().catch(() => null)
  const payload = Array.isArray(res) ? null : res?.data
  canRegister.value = !!payload?.register
  configLoaded.value = true
})
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
}
.form-card {
  width: 100%;
  max-width: 440px;
  padding: 32px;
}
.head {
  margin-bottom: 24px;
  h2 {
    font-size: 24px;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
    font-weight: 700;
  }
  p { margin: 0; font-size: 14px; }
}
.foot {
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
</style>
