<template>
  <div class="oauth-page">
    <div class="oauth-card surface-card">
      <template v-if="status === 'loading'">
        <el-icon class="spinner" :size="36"><Loading /></el-icon>
        <h3>Completing sign in&hellip;</h3>
        <p class="text-muted">Hang tight while we finish authenticating you.</p>
      </template>
      <template v-else-if="status === 'success'">
        <el-icon class="ok" :size="40"><CircleCheck /></el-icon>
        <h3>Signed in</h3>
        <p class="text-muted">Redirecting to your dashboard&hellip;</p>
      </template>
      <template v-else>
        <el-icon class="err" :size="40"><CircleClose /></el-icon>
        <h3>Sign-in failed</h3>
        <p class="text-muted">We couldn't complete the sign-in. Returning to login&hellip;</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const status = ref('loading')

onMounted(async () => {
  const code = route.params.code
  if (!code) {
    status.value = 'error'
    setTimeout(() => router.push('/login'), 1500)
    return
  }
  try {
    const res = await userStore.query(code)
    if (res) {
      status.value = 'success'
      ElMessage.success('Signed in')
      setTimeout(() => router.push('/'), 600)
    } else {
      throw new Error('Authentication failed')
    }
  } catch (e) {
    status.value = 'error'
    ElMessage.error(e?.message || 'Sign-in failed')
    setTimeout(() => router.push('/login'), 1800)
  }
})
</script>

<style scoped lang="scss">
.oauth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
}
.oauth-card {
  width: 100%;
  max-width: 380px;
  padding: 36px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  h3 {
    margin: 4px 0 0;
    font-size: 18px;
    font-weight: 600;
  }
  p { margin: 0; font-size: 14px; }
}
.spinner {
  color: #6366f1;
  animation: spin 1s linear infinite;
}
.ok { color: #10b981; }
.err { color: #ef4444; }
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
