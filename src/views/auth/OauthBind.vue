<template>
  <div class="oauth-page">
    <div class="oauth-card surface-card">
      <template v-if="status === 'loading'">
        <el-icon class="spinner" :size="36"><Loading /></el-icon>
        <h3>Linking account&hellip;</h3>
        <p class="text-muted">Please wait while we link your provider.</p>
      </template>
      <template v-else-if="status === 'success'">
        <el-icon class="ok" :size="40"><CircleCheck /></el-icon>
        <h3>Account linked</h3>
        <p class="text-muted">Returning to your profile&hellip;</p>
      </template>
      <template v-else>
        <el-icon class="err" :size="40"><CircleClose /></el-icon>
        <h3>Link failed</h3>
        <p class="text-muted">{{ errorMsg || 'We could not link this account.' }}</p>
        <el-button type="primary" @click="goProfile">Back to profile</el-button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { bindConfirm } from '@/api/oauth'

const route = useRoute()
const router = useRouter()

const status = ref('loading')
const errorMsg = ref('')

function goProfile () {
  router.push('/me')
}

onMounted(async () => {
  const code = route.params.code
  if (!code) {
    status.value = 'error'
    errorMsg.value = 'Missing authorization code'
    return
  }
  try {
    await bindConfirm({ code })
    status.value = 'success'
    ElMessage.success('Account linked')
    setTimeout(() => router.push('/me'), 800)
  } catch (e) {
    status.value = 'error'
    errorMsg.value = e?.message || 'Link failed'
    ElMessage.error(errorMsg.value)
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
