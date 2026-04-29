<template>
  <div class="surface-card">
    <div class="card-head">
      <div>
        <h3>{{ title }}</h3>
        <p class="text-muted text-sm">{{ description }}</p>
      </div>
      <el-button size="small" @click="load" :loading="loading">
        <el-icon><Refresh /></el-icon> Refresh
      </el-button>
    </div>

    <div class="add-row">
      <el-input v-model="newIp" placeholder="IP address" @keyup.enter="add" clearable />
      <el-button type="primary" :loading="adding" :disabled="!newIp.trim()" @click="add">
        <el-icon><Plus /></el-icon> Add
      </el-button>
    </div>

    <pre class="output" v-if="raw">{{ raw }}</pre>
    <div v-else-if="!loading" class="empty text-muted">No entries.</div>

    <div v-if="ips.length" class="ip-tags mt-2">
      <el-tag v-for="ip in ips" :key="ip" closable @close="remove(ip)">{{ ip }}</el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { sendCmd } from '@/api/rustdesk'

const TARGET = '21117'

const props = defineProps({
  title: { type: String, required: true },
  description: String,
  readCmd: { type: String, required: true },
  addCmd: { type: String, required: true },
  removeCmd: { type: String, required: true },
})

const raw = ref('')
const loading = ref(false)
const adding = ref(false)
const newIp = ref('')

const ips = computed(() => {
  if (!raw.value) return []
  return String(raw.value)
    .split(/[|\n]+/)
    .map(s => s.trim())
    .filter(s => s && /^[0-9a-fA-F:.]+$/.test(s))
})

async function quiet (cmd, option = '') {
  try {
    const res = await sendCmd({ cmd, target: TARGET, option })
    return { ok: true, data: res?.data ?? '' }
  } catch (e) {
    return { ok: false, error: e?.message || 'Request failed' }
  }
}

async function load () {
  loading.value = true
  const res = await quiet(props.readCmd)
  loading.value = false
  if (res.ok) raw.value = String(res.data || '').trim()
  else ElMessage.error(res.error)
}

async function add () {
  const ip = newIp.value.trim()
  if (!ip) return
  adding.value = true
  const res = await quiet(props.addCmd, ip)
  adding.value = false
  if (res.ok) {
    ElMessage.success(`Added ${ip}`)
    newIp.value = ''
    load()
  } else {
    ElMessage.error(res.error)
  }
}

async function remove (ip) {
  const ok = await ElMessageBox.confirm(`Remove ${ip}?`, 'Confirm', {
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel',
    type: 'warning',
  }).catch(() => false)
  if (!ok) return
  const res = await quiet(props.removeCmd, ip)
  if (res.ok) {
    ElMessage.success(`Removed ${ip}`)
    load()
  } else {
    ElMessage.error(res.error)
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  h3 { margin: 0; font-size: 15px; font-weight: 600; }
  p { margin: 4px 0 0; }
}
.add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.output {
  margin: 0;
  background: #f9fafb;
  border: 1px solid var(--rd-border);
  border-radius: var(--rd-radius-sm);
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  max-height: 180px;
  overflow: auto;
  color: var(--rd-text-soft);
}
.ip-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.empty {
  text-align: center;
  padding: 16px;
  font-size: 13px;
}
</style>
