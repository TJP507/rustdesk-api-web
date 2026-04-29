<template>
  <PageHeader title="Server Control" subtitle="Manage hbbs (ID) and hbbr (Relay)" />

  <el-tabs v-model="active" @tab-change="onTabChange" class="server-tabs">
    <el-tab-pane label="Overview" name="overview">
      <div class="grid-2">
        <ServerStatusCard
          name="hbbs"
          subtitle="ID server (port 21115)"
          :endpoint="appStore.setting.rustdeskConfig.id_server"
          :status="status.hbbs"
          @refresh="probe('hbbs')"
        />
        <ServerStatusCard
          name="hbbr"
          subtitle="Relay server (port 21117)"
          :endpoint="appStore.setting.rustdeskConfig.relay_server"
          :status="status.hbbr"
          @refresh="probe('hbbr')"
        />
      </div>

      <div class="surface-card mt-6">
        <div class="card-head">
          <h3>Relay usage</h3>
          <el-button size="small" @click="loadUsage" :loading="usage.loading">
            <el-icon><Refresh /></el-icon> Refresh
          </el-button>
        </div>
        <pre class="output">{{ usage.text || '—' }}</pre>
      </div>
    </el-tab-pane>

    <el-tab-pane label="Toggles" name="toggles">
      <div class="surface-card setting-row">
        <div class="setting-info">
          <h4>Always use relay</h4>
          <p class="text-muted text-sm">When enabled, hbbs forces every connection through hbbr instead of attempting peer-to-peer first.</p>
        </div>
        <el-switch
          v-model="alwaysRelay.value"
          :loading="alwaysRelay.loading"
          @change="setAlwaysRelay"
          inline-prompt
          active-text="On"
          inactive-text="Off"
        />
      </div>
    </el-tab-pane>

    <el-tab-pane label="Relay servers" name="relay">
      <div class="surface-card">
        <div class="card-head">
          <h3>Configured relay servers</h3>
          <el-button size="small" @click="loadRelayServers" :loading="relay.loading">
            <el-icon><Refresh /></el-icon> Refresh
          </el-button>
        </div>
        <p class="text-muted text-sm mb-2">Comma-separated list of <code>host:port</code> entries. hbbs forwards to these when relaying.</p>
        <el-input v-model="relay.value" type="textarea" :rows="3" placeholder="host1:21117, host2:21117" />
        <div class="actions-row">
          <el-button type="primary" :loading="relay.saving" @click="saveRelayServers">Save</el-button>
        </div>
      </div>
    </el-tab-pane>

    <el-tab-pane label="ID Blocker" name="blocker">
      <IpListPanel
        title="hbbs IP Blocker"
        description="Auto-managed list of IPs blocked by hbbs. Block by IP, unblock with the trailing dash flag."
        :target="TARGET_ID"
        cmd="ip-blocker"
        :parser="parseBlockerOutput"
        unblock-suffix="-"
      />
    </el-tab-pane>

    <el-tab-pane label="Relay lists" name="relay-lists">
      <div class="grid-2">
        <RelayList
          title="hbbr Blocklist"
          description="IPs blocked from initiating relay sessions (capital B)."
          read-cmd="blocklist"
          add-cmd="blocklist-add"
          remove-cmd="blocklist-remove"
        />
        <RelayList
          title="hbbr Blacklist"
          description="IPs blacklisted entirely on the relay server (lowercase b)."
          read-cmd="blacklist"
          add-cmd="blacklist-add"
          remove-cmd="blacklist-remove"
        />
      </div>
    </el-tab-pane>

    <el-tab-pane label="Install scripts" name="install">
      <InstallScriptSettings />
    </el-tab-pane>

    <el-tab-pane label="Saved commands" name="cmds">
      <ServerCmdList />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import ServerStatusCard from './ServerStatusCard.vue'
import IpListPanel from './IpListPanel.vue'
import RelayList from './RelayList.vue'
import ServerCmdList from './ServerCmdList.vue'
import InstallScriptSettings from './InstallScriptSettings.vue'
import { sendCmd } from '@/api/rustdesk'
import { useAppStore } from '@/store/app'

const TARGET_ID = '21115'
const TARGET_RELAY = '21117'

const appStore = useAppStore()

const active = ref('overview')

const status = reactive({
  hbbs: { state: 'unknown' },
  hbbr: { state: 'unknown' },
})
const usage = reactive({ text: '', loading: false })
const alwaysRelay = reactive({ value: false, loading: false, loaded: false })
const relay = reactive({ value: '', loading: false, saving: false, loaded: false })

async function quiet (cmd, target, option = '') {
  try {
    const res = await sendCmd({ cmd, target, option })
    return { ok: true, data: res?.data ?? '' }
  } catch (e) {
    return { ok: false, error: e?.message || 'Request failed' }
  }
}

async function probe (which) {
  status[which] = { state: 'checking' }
  const target = which === 'hbbs' ? TARGET_ID : TARGET_RELAY
  const res = await quiet('usage', target)
  status[which] = res.ok ? { state: 'online' } : { state: 'offline', error: res.error }
}

async function loadUsage () {
  usage.loading = true
  const res = await quiet('usage', TARGET_RELAY)
  usage.loading = false
  usage.text = res.ok ? (res.data || '(no data)') : `Error: ${res.error}`
}

async function loadAlwaysRelay () {
  alwaysRelay.loading = true
  const res = await quiet('always-use-relay', TARGET_ID)
  alwaysRelay.loading = false
  alwaysRelay.loaded = true
  if (res.ok) {
    const m = String(res.data).match(/ALWAYS_USE_RELAY:\s*(true|false|y|n|on|off)/i)
    if (m) alwaysRelay.value = /^(true|y|on)$/i.test(m[1])
  }
}

async function setAlwaysRelay (val) {
  alwaysRelay.loading = true
  const res = await quiet('always-use-relay', TARGET_ID, val ? 'y' : 'n')
  alwaysRelay.loading = false
  if (res.ok) ElMessage.success(`Always-use-relay turned ${val ? 'on' : 'off'}`)
  else {
    ElMessage.error(res.error)
    alwaysRelay.value = !val
  }
}

async function loadRelayServers () {
  relay.loading = true
  const res = await quiet('relay-servers', TARGET_ID)
  relay.loading = false
  relay.loaded = true
  if (res.ok) {
    const text = String(res.data || '').trim()
    const m = text.match(/RELAY_SERVERS:\s*(.*)/i)
    relay.value = m ? m[1].trim() : text
  }
}

async function saveRelayServers () {
  relay.saving = true
  const res = await quiet('relay-servers', TARGET_ID, relay.value.trim())
  relay.saving = false
  if (res.ok) ElMessage.success('Relay servers updated')
  else ElMessage.error(res.error)
}

function parseBlockerOutput (text) {
  if (!text) return []
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean)
  const items = []
  for (const line of lines) {
    if (/^\d+$/.test(line)) continue
    const m = line.match(/^(.+?):\s*(.*)$/)
    if (m) items.push({ ip: m[1], stats: m[2] })
    else items.push({ ip: line, stats: '' })
  }
  return items
}

function onTabChange (name) {
  if (name === 'overview') {
    if (status.hbbs.state === 'unknown') probe('hbbs')
    if (status.hbbr.state === 'unknown') probe('hbbr')
    if (!usage.text) loadUsage()
  } else if (name === 'toggles' && !alwaysRelay.loaded) {
    loadAlwaysRelay()
  } else if (name === 'relay' && !relay.loaded) {
    loadRelayServers()
  }
}

onMounted(() => {
  appStore.loadRustdeskConfig()
  onTabChange(active.value)
})
</script>

<style scoped lang="scss">
.server-tabs :deep(.el-tabs__nav-wrap::after) { background: var(--rd-border); }
.server-tabs :deep(.el-tabs__item) { font-weight: 500; }

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  h3 { margin: 0; font-size: 15px; font-weight: 600; }
}

.output {
  margin: 0;
  background: #f9fafb;
  border: 1px solid var(--rd-border);
  border-radius: var(--rd-radius-sm);
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  white-space: pre-wrap;
  max-height: 320px;
  overflow: auto;
  color: var(--rd-text-soft);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  .setting-info {
    flex: 1;
    h4 { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
    p { margin: 0; }
  }
}

.actions-row {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

code {
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12.5px;
}
</style>
