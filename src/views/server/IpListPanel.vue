<template>
  <div class="surface-card">
    <div class="text-sm text-muted mb-2">{{ description }}</div>

    <div class="flex items-center justify-between mb-2">
      <div class="text-sm">
        <span class="text-muted">Entries: </span>
        <span class="font-medium">{{ ips.length }}</span>
      </div>
      <el-button size="small" @click="load" :loading="loading">
        <el-icon><Refresh /></el-icon> Refresh
      </el-button>
    </div>

    <div class="ip-tags" v-if="ips.length">
      <el-tag
        v-for="(ip, i) in ips"
        :key="ip + i"
        closable
        type="info"
        effect="plain"
        @close="remove(ip)"
      >
        {{ ip }}
      </el-tag>
    </div>
    <div v-else class="text-muted text-sm mb-2">No entries.</div>

    <el-divider />

    <div class="font-medium mb-2">Add entry</div>
    <div class="flex gap-2 add-row">
      <el-input
        v-model="newValue"
        placeholder="Pipe-separated IPs, e.g. 1.2.3.4|5.6.7.8 or 'all'"
        @keyup.enter="add"
      />
      <el-button type="primary" :loading="adding" @click="add">
        <el-icon><Plus /></el-icon> Add
      </el-button>
    </div>

    <div v-if="rawValue" class="mt-4">
      <div class="text-xs text-muted mb-2">Raw server response</div>
      <pre class="cmd-output">{{ rawValue }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as rustdeskApi from '@/api/rustdesk'

const props = defineProps({
  title: { type: String, default: 'List' },
  description: { type: String, default: '' },
  cmd: { type: String, required: true },
})

const rawValue = ref('')
const newValue = ref('')
const loading = ref(false)
const adding = ref(false)

const ips = computed(() => {
  const text = (rawValue.value || '').trim()
  if (!text) return []
  // Strip leading prefix like "blocklist: " if present
  const cleaned = text.replace(/^[\w\s]*:\s*/, '').trim()
  if (!cleaned) return []
  return cleaned.split('|').map(s => s.trim()).filter(Boolean)
})

function extractOutput (res) {
  const d = res?.data
  if (typeof d === 'string') return d
  if (d?.output != null) return String(d.output)
  if (d?.result != null) return String(d.result)
  return ''
}

async function load () {
  loading.value = true
  const res = await rustdeskApi.sendCmd({ cmd: props.cmd, target: 'id' }).catch(() => false)
  loading.value = false
  if (res) rawValue.value = extractOutput(res).trim()
}

async function add () {
  const value = newValue.value.trim().replace(/\s+/g, '')
  if (!value) return ElMessage.warning('Enter at least one IP')
  adding.value = true
  const res = await rustdeskApi.sendCmd({ cmd: `${props.cmd} ${value}`, target: 'id' }).catch(() => false)
  adding.value = false
  if (res) {
    ElMessage.success('Added')
    newValue.value = ''
    load()
  }
}

async function remove (ip) {
  const ok = await ElMessageBox.confirm(`Remove ${ip} from ${props.title.toLowerCase()}?`, 'Remove', {
    confirmButtonText: 'Remove',
    cancelButtonText: 'Cancel',
    type: 'warning',
  }).catch(() => false)
  if (!ok) return
  const res = await rustdeskApi.sendCmd({ cmd: `${props.cmd} ${ip} remove`, target: 'id' }).catch(() => false)
  if (res) {
    ElMessage.success('Removed')
    load()
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.ip-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.add-row .el-input { flex: 1; }

.cmd-output {
  margin: 0;
  padding: 10px 12px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow: auto;
}
</style>
