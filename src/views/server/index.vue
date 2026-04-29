<template>
  <PageHeader title="Server Control" subtitle="Inspect and manage the RustDesk hbbs/hbbr servers" />

  <el-tabs v-model="active" type="border-card" class="server-tabs">
    <!-- ============ Overview ============ -->
    <el-tab-pane label="Overview" name="overview">
      <div class="status-grid">
        <div class="surface-card">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-muted">ID Server (hbbs)</div>
              <div class="text-lg font-semibold">{{ idEndpoint || '—' }}</div>
            </div>
            <el-button text @click="probe('id')" :loading="probing.id">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="status-dot" :class="status.id"></span>
            <span class="text-sm font-medium">{{ statusLabel(status.id) }}</span>
          </div>
        </div>

        <div class="surface-card">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-muted">Relay Server (hbbr)</div>
              <div class="text-lg font-semibold">{{ relayEndpoint || '—' }}</div>
            </div>
            <el-button text @click="probe('relay')" :loading="probing.relay">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span class="status-dot" :class="status.relay"></span>
            <span class="text-sm font-medium">{{ statusLabel(status.relay) }}</span>
          </div>
        </div>
      </div>

      <div class="surface-card mt-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-lg font-semibold">Server usage</div>
          <el-button @click="loadUsage" :loading="usageLoading" size="small">
            <el-icon><Refresh /></el-icon> Refresh
          </el-button>
        </div>
        <pre v-if="usageOutput" class="cmd-output">{{ usageOutput }}</pre>
        <div v-else class="text-muted text-sm">No data yet.</div>
      </div>
    </el-tab-pane>

    <!-- ============ Settings ============ -->
    <el-tab-pane label="Settings" name="settings">
      <div class="surface-card">
        <div v-if="settingsHint" class="el-alert-soft mb-4">
          <el-alert type="info" :closable="false" show-icon>
            Could not parse the current value from the server. Toggle to apply a new state.
          </el-alert>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="font-semibold">Require login</div>
            <div class="text-sm text-muted">Force every device to authenticate before connecting through this server.</div>
          </div>
          <el-switch v-model="mustLogin" :loading="saving.mustLogin" @change="toggleMustLogin" />
        </div>

        <el-divider />

        <div class="setting-row">
          <div class="setting-info">
            <div class="font-semibold">Always use relay</div>
            <div class="text-sm text-muted">Force all sessions to be tunneled through the relay server (no direct connections).</div>
          </div>
          <el-switch v-model="alwaysRelay" :loading="saving.alwaysRelay" @change="toggleAlwaysRelay" />
        </div>

        <el-divider />

        <el-button @click="loadSettings" :loading="settingsLoading">
          <el-icon><Refresh /></el-icon> Reload from server
        </el-button>
      </div>
    </el-tab-pane>

    <!-- ============ Relay servers ============ -->
    <el-tab-pane label="Relay Servers" name="rs">
      <div class="surface-card">
        <div class="text-sm text-muted mb-2">
          Comma-separated list of relay server addresses the ID server hands out to clients.
        </div>
        <div class="mb-2">
          <span class="text-sm text-muted">Current: </span>
          <span class="font-medium">{{ rsCurrent || '—' }}</span>
        </div>
        <el-input
          v-model="rsValue"
          type="textarea"
          :rows="3"
          placeholder="relay1.example.com:21117,relay2.example.com:21117"
        />
        <div class="mt-4 flex gap-2">
          <el-button type="primary" :loading="rsSaving" @click="saveRs">Save</el-button>
          <el-button @click="loadRs" :loading="rsLoading">
            <el-icon><Refresh /></el-icon> Reload
          </el-button>
        </div>
      </div>
    </el-tab-pane>

    <!-- ============ Blocklist ============ -->
    <el-tab-pane label="Blocklist" name="blocklist">
      <IpListPanel
        title="Blocklist"
        description="RustDesk's automatic ban list of abusive IPs. Pipe-separated. Use 'all' to match everything."
        cmd="blocklist"
      />
    </el-tab-pane>

    <!-- ============ Blacklist ============ -->
    <el-tab-pane label="Blacklist" name="blacklist">
      <IpListPanel
        title="Blacklist"
        description="Manually maintained blacklist. Pipe-separated. Use 'all' to match everything."
        cmd="blacklist"
      />
    </el-tab-pane>

    <!-- ============ Saved commands ============ -->
    <el-tab-pane label="Commands" name="cmds">
      <div class="flex justify-between items-center mb-4">
        <div class="text-sm text-muted">Saved commands you can run on demand against the ID or relay server.</div>
        <el-button type="primary" @click="openCreateCmd">
          <el-icon><Plus /></el-icon> New command
        </el-button>
      </div>

      <DataTable
        v-model="query"
        :data="state.list"
        :total="state.total"
        :loading="state.loading"
        :selectable="true"
        row-key="id"
        @change="getList"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="Command" min-width="180">
          <template #default="{ row }">
            <code class="cmd-code">{{ row.cmd }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="alias" label="Alias" min-width="140" />
        <el-table-column label="Target" width="120">
          <template #default="{ row }">
            <StatusBadge :kind="row.target === 'relay' ? 'warning' : 'info'" :label="row.target || 'id'" />
          </template>
        </el-table-column>
        <el-table-column label="Description" min-width="220">
          <template #default="{ row }">
            <span class="text-sm">{{ row.explain || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="280" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="runCmd(row)">
              <el-icon><VideoPlay /></el-icon> Run
            </el-button>
            <el-button text @click="openEditCmd(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button text type="danger" @click="del(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </DataTable>

      <FormDrawer v-model="cmdFormOpen" :title="cmdForm.id ? 'Edit command' : 'New command'" :submitting="cmdSaving" @submit="submitCmd">
        <el-form ref="cmdFormRef" :model="cmdForm" :rules="cmdRules" label-position="top">
          <el-form-item label="Command" prop="cmd">
            <el-input v-model="cmdForm.cmd" placeholder="e.g. blocklist" />
          </el-form-item>
          <el-form-item label="Alias" prop="alias">
            <el-input v-model="cmdForm.alias" placeholder="Friendly name" />
          </el-form-item>
          <el-form-item label="Option" prop="option">
            <el-input v-model="cmdForm.option" placeholder='Optional argument hint, e.g. "y", "n", "ip"' />
          </el-form-item>
          <el-form-item label="Description" prop="explain">
            <el-input v-model="cmdForm.explain" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="Target" prop="target">
            <el-radio-group v-model="cmdForm.target">
              <el-radio value="id">ID server</el-radio>
              <el-radio value="relay">Relay server</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </FormDrawer>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { useAppStore } from '@/store/app'
import * as rustdeskApi from '@/api/rustdesk'
import IpListPanel from './IpListPanel.vue'

const active = ref('overview')
const appStore = useAppStore()

const idEndpoint = computed(() => appStore.setting.rustdeskConfig?.id_server || '')
const relayEndpoint = computed(() => appStore.setting.rustdeskConfig?.relay_server || '')

// ---------- Overview ----------
const status = reactive({ id: 'unknown', relay: 'unknown' })
const probing = reactive({ id: false, relay: false })
const usageOutput = ref('')
const usageLoading = ref(false)

async function probe (target) {
  probing[target] = true
  status[target] = 'unknown'
  const res = await rustdeskApi.sendCmd({ cmd: 'usage', target }).catch(() => false)
  probing[target] = false
  status[target] = res ? 'online' : 'offline'
}

function statusLabel (s) {
  if (s === 'online') return 'Online'
  if (s === 'offline') return 'Offline'
  return 'Checking...'
}

async function loadUsage () {
  usageLoading.value = true
  const res = await rustdeskApi.sendCmd({ cmd: 'usage', target: 'id' }).catch(() => false)
  usageLoading.value = false
  usageOutput.value = res ? extractOutput(res) : ''
}

function extractOutput (res) {
  const d = res?.data
  if (typeof d === 'string') return d
  if (d?.output != null) return String(d.output)
  if (d?.result != null) return String(d.result)
  return JSON.stringify(d, null, 2)
}

// ---------- Settings ----------
const mustLogin = ref(false)
const alwaysRelay = ref(false)
const settingsLoading = ref(false)
const settingsHint = ref(false)
const saving = reactive({ mustLogin: false, alwaysRelay: false })

function parseBool (text) {
  if (!text) return null
  const s = String(text).toLowerCase()
  if (/\b(y|yes|true|on|enabled|1)\b/.test(s)) return true
  if (/\b(n|no|false|off|disabled|0)\b/.test(s)) return false
  return null
}

async function loadSettings () {
  settingsLoading.value = true
  settingsHint.value = false
  const [a, b] = await Promise.all([
    rustdeskApi.sendCmd({ cmd: 'must_login', target: 'id' }).catch(() => false),
    rustdeskApi.sendCmd({ cmd: 'always_use_relay', target: 'id' }).catch(() => false),
  ])
  settingsLoading.value = false
  const ml = a ? parseBool(extractOutput(a)) : null
  const ar = b ? parseBool(extractOutput(b)) : null
  if (ml === null || ar === null) settingsHint.value = true
  mustLogin.value = ml ?? false
  alwaysRelay.value = ar ?? false
}

async function toggleMustLogin (v) {
  saving.mustLogin = true
  const res = await rustdeskApi.sendCmd({ cmd: `must_login ${v ? 'y' : 'n'}`, target: 'id' }).catch(() => false)
  saving.mustLogin = false
  if (res) ElMessage.success('Updated must_login')
  else { ElMessage.error('Failed to update'); mustLogin.value = !v }
}

async function toggleAlwaysRelay (v) {
  saving.alwaysRelay = true
  const res = await rustdeskApi.sendCmd({ cmd: `always_use_relay ${v ? 'y' : 'n'}`, target: 'id' }).catch(() => false)
  saving.alwaysRelay = false
  if (res) ElMessage.success('Updated always_use_relay')
  else { ElMessage.error('Failed to update'); alwaysRelay.value = !v }
}

// ---------- Relay servers ----------
const rsCurrent = ref('')
const rsValue = ref('')
const rsLoading = ref(false)
const rsSaving = ref(false)

async function loadRs () {
  rsLoading.value = true
  const res = await rustdeskApi.sendCmd({ cmd: 'rs', target: 'id' }).catch(() => false)
  rsLoading.value = false
  if (res) {
    rsCurrent.value = extractOutput(res).trim()
    rsValue.value = rsCurrent.value
  }
}

async function saveRs () {
  rsSaving.value = true
  const value = rsValue.value.trim().replace(/\s+/g, '')
  const res = await rustdeskApi.sendCmd({ cmd: `rs ${value}`, target: 'id' }).catch(() => false)
  rsSaving.value = false
  if (res) {
    ElMessage.success('Relay servers updated')
    loadRs()
  }
}

// ---------- Saved commands ----------
const { state, query, getList, search, reset, del } = useResource(rustdeskApi, {})

const cmdFormOpen = ref(false)
const cmdFormRef = ref(null)
const cmdSaving = ref(false)
const cmdForm = reactive({ id: null, cmd: '', alias: '', option: '', explain: '', target: 'id' })
const cmdRules = {
  cmd: [{ required: true, message: 'Command is required', trigger: 'blur' }],
  target: [{ required: true, message: 'Target is required', trigger: 'change' }],
}

function resetCmdForm () {
  cmdForm.id = null
  cmdForm.cmd = ''
  cmdForm.alias = ''
  cmdForm.option = ''
  cmdForm.explain = ''
  cmdForm.target = 'id'
}

function openCreateCmd () {
  resetCmdForm()
  cmdFormOpen.value = true
}

function openEditCmd (row) {
  cmdForm.id = row.id
  cmdForm.cmd = row.cmd || ''
  cmdForm.alias = row.alias || ''
  cmdForm.option = row.option || ''
  cmdForm.explain = row.explain || ''
  cmdForm.target = row.target || 'id'
  cmdFormOpen.value = true
}

async function submitCmd () {
  const ok = await cmdFormRef.value.validate().catch(() => false)
  if (!ok) return
  cmdSaving.value = true
  const fn = cmdForm.id ? rustdeskApi.update : rustdeskApi.create
  const res = await fn({ ...cmdForm }).catch(() => false)
  cmdSaving.value = false
  if (res) {
    ElMessage.success(cmdForm.id ? 'Command updated' : 'Command created')
    cmdFormOpen.value = false
    getList()
  }
}

async function runCmd (row) {
  const res = await rustdeskApi.sendCmd({ cmd: row.cmd, target: row.target || 'id' }).catch(() => false)
  if (!res) return
  const output = extractOutput(res) || '(no output)'
  ElMessageBox.alert(
    h('pre', { class: 'cmd-output' }, output),
    `Output: ${row.alias || row.cmd}`,
    { confirmButtonText: 'Close', customClass: 'cmd-output-dialog' },
  )
}

onMounted(() => {
  probe('id')
  probe('relay')
  loadUsage()
  loadSettings()
  loadRs()
})
</script>

<style scoped lang="scss">
.server-tabs {
  background: transparent;
  border: none;
  box-shadow: none;
}
.server-tabs :deep(.el-tabs__content) {
  padding: 16px 0 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: #9ca3af;
  &.online { background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18); }
  &.offline { background: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18); }
  &.unknown { background: #9ca3af; }
}

.cmd-output {
  margin: 0;
  padding: 12px 14px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 360px;
  overflow: auto;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  .setting-info { flex: 1; min-width: 0; }
}

.cmd-code {
  background: #f3f4f6;
  border: 1px solid var(--rd-border);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 12.5px;
  color: var(--rd-text);
}
</style>

<style lang="scss">
.cmd-output-dialog {
  max-width: 720px;
  .el-message-box__message pre { margin: 0; }
}
</style>
