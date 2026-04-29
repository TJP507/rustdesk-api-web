<template>
  <PageHeader title="Devices" subtitle="RustDesk peers connected to this server">
    <el-button type="primary" @click="openCreate">
      <el-icon><Plus /></el-icon> Add device
    </el-button>
    <el-popover v-model:visible="importOpen" :width="320" trigger="click" placement="bottom-end">
      <template #reference>
        <el-button>
          <el-icon><Upload /></el-icon> Import CSV
        </el-button>
      </template>
      <div class="flex flex-col gap-2">
        <div class="text-sm text-muted">
          Columns: id, cpu, hostname, memory, os, username, uuid, version, group_id
        </div>
        <el-upload
          accept=".csv"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleImportFile"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon> Choose CSV
          </el-button>
        </el-upload>
        <div v-if="importing" class="text-sm text-soft">Importing {{ importDone }} / {{ importTotal }}…</div>
      </div>
    </el-popover>
    <el-button @click="exportCsv" :loading="exporting">
      <el-icon><Download /></el-icon> Export CSV
    </el-button>
  </PageHeader>

  <DataTable
    ref="tableRef"
    v-model="query"
    :data="state.list"
    :total="state.total"
    :loading="state.loading"
    :selectable="true"
    row-key="row_id"
    @change="getList"
  >
    <template #filters>
      <el-input v-model="query.id" placeholder="ID" clearable style="width:140px" @change="search" />
      <el-input v-model="query.hostname" placeholder="Hostname" clearable style="width:160px" @change="search" />
      <el-input v-model="query.username" placeholder="Username" clearable style="width:160px" @change="search" />
      <el-input v-model="query.ip" placeholder="IP" clearable style="width:140px" @change="search" />
      <el-select
        v-model="query.time_ago"
        placeholder="Last seen"
        clearable
        style="width:200px"
        @change="search"
      >
        <el-option label="Online (last 1 min)" :value="-60" />
        <el-option label="Last hour" :value="-3600" />
        <el-option label="Last 24h" :value="-86400" />
        <el-option label="──────────" :value="0" disabled />
        <el-option label="Inactive >1 min" :value="60" />
        <el-option label="Inactive >1 hour" :value="3600" />
        <el-option label="Inactive >1 day" :value="86400" />
        <el-option label="Inactive >30 days" :value="2592000" />
      </el-select>
      <el-button @click="search"><el-icon><Search /></el-icon> Filter</el-button>
      <el-button @click="reset"><el-icon><Refresh /></el-icon> Reset</el-button>
    </template>

    <template #actions>
      <el-tooltip content="Columns">
        <el-button @click="columnsDialogOpen = true">
          <el-icon><Setting /></el-icon>
        </el-button>
      </el-tooltip>
    </template>

    <template #bulk="{ selected, clear }">
      <el-button type="primary" size="small" @click="openBatchAddToAB(selected)">
        Add to address book
      </el-button>
      <el-button type="danger" size="small" @click="bulkDelete(selected, clear)">
        Delete selected
      </el-button>
    </template>

    <el-table-column v-if="visible('id')" prop="id" label="ID" width="160">
      <template #default="{ row }">
        <span class="copyable" @click="copyText(row.id)">{{ row.id }}</span>
      </template>
    </el-table-column>
    <el-table-column v-if="visible('hostname')" prop="hostname" label="Hostname" min-width="140" />
    <el-table-column v-if="visible('os')" label="OS" width="110">
      <template #default="{ row }">
        <PlatformIcon :raw="row.os" />
      </template>
    </el-table-column>
    <el-table-column v-if="visible('username')" prop="username" label="Username" min-width="120" />
    <el-table-column v-if="visible('group')" label="Group" width="140">
      <template #default="{ row }">
        <el-tag v-if="groupName(row.group_id)" size="small" type="info">{{ groupName(row.group_id) }}</el-tag>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column v-if="visible('cpu')" prop="cpu" label="CPU" min-width="140" show-overflow-tooltip />
    <el-table-column v-if="visible('memory')" prop="memory" label="Memory" width="110" />
    <el-table-column v-if="visible('last_seen')" label="Last seen" width="200">
      <template #default="{ row }">
        <div class="flex items-center gap-2">
          <span class="status-dot" :class="isOnline(row) ? 'online' : 'offline'"></span>
          <span>{{ row.last_online_time ? timeAgo(row.last_online_time * 1000) : '—' }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column v-if="visible('ip')" label="IP" width="140">
      <template #default="{ row }">
        <span v-if="row.last_online_ip">{{ row.last_online_ip }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column v-if="visible('version')" prop="version" label="Version" width="110" />
    <el-table-column v-if="visible('alias')" prop="alias" label="Alias" min-width="120" />

    <el-table-column label="Actions" width="220" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" size="small" @click="connect(row)">Connect</el-button>
        <el-button size="small" @click="openAddToAB(row)">Add to AB</el-button>
        <el-tooltip content="Edit">
          <el-button text @click="openEdit(row)"><el-icon><Edit /></el-icon></el-button>
        </el-tooltip>
        <el-tooltip content="Delete">
          <el-button text type="danger" @click="del(row, 'row_id')"><el-icon><Delete /></el-icon></el-button>
        </el-tooltip>
      </template>
    </el-table-column>
  </DataTable>

  <FormDrawer v-model="formOpen" :title="form.row_id ? 'Edit device' : 'Add device'" :submitting="submitting" @submit="submit">
    <el-form :model="form" label-position="top">
      <el-form-item label="ID" required>
        <el-input v-model="form.id" :disabled="!!form.row_id" placeholder="Peer ID" />
      </el-form-item>
      <el-form-item label="Group">
        <el-select v-model="form.group_id" clearable placeholder="Select group" class="w-full">
          <el-option v-for="g in deviceGroups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Username">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="Hostname">
        <el-input v-model="form.hostname" />
      </el-form-item>
      <el-form-item label="CPU">
        <el-input v-model="form.cpu" />
      </el-form-item>
      <el-form-item label="Memory">
        <el-input v-model="form.memory" />
      </el-form-item>
      <el-form-item label="OS">
        <el-input v-model="form.os" />
      </el-form-item>
      <el-form-item label="UUID">
        <el-input v-model="form.uuid" />
      </el-form-item>
      <el-form-item label="Version">
        <el-input v-model="form.version" />
      </el-form-item>
      <el-form-item label="Alias">
        <el-input v-model="form.alias" />
      </el-form-item>
    </el-form>
  </FormDrawer>

  <el-dialog v-model="abDialogOpen" :title="abForm.peer_ids.length > 1 ? `Add ${abForm.peer_ids.length} peers to address book` : 'Add to address book'" width="480px">
    <el-form :model="abForm" label-position="top">
      <el-form-item label="Owner" required>
        <el-select v-model="abForm.user_id" placeholder="Select user" filterable class="w-full" @change="onAbUserChange">
          <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Collection">
        <el-select v-model="abForm.collection_id" placeholder="Select collection" class="w-full" :disabled="!abForm.user_id">
          <el-option label="My address book" :value="0" />
          <el-option v-for="c in abCollections" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Tags">
        <el-select
          v-model="abForm.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="Type to add tags"
          class="w-full"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="abDialogOpen = false">Cancel</el-button>
      <el-button type="primary" :loading="abSubmitting" @click="submitAb">Add</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="columnsDialogOpen" title="Columns" width="360px">
    <div class="flex flex-col gap-2">
      <div v-for="(col, idx) in columnOrder" :key="col.key" class="flex items-center justify-between">
        <el-checkbox v-model="visibleCols[col.key]">{{ col.label }}</el-checkbox>
        <div class="flex gap-1">
          <el-button text :disabled="idx === 0" @click="moveCol(idx, -1)"><el-icon><ArrowUp /></el-icon></el-button>
          <el-button text :disabled="idx === columnOrder.length - 1" @click="moveCol(idx, 1)"><el-icon><ArrowDown /></el-icon></el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="resetColumns">Reset</el-button>
      <el-button type="primary" @click="saveColumns">Done</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { useResource } from '@/composables/useResource'
import { useDeviceGroupLookup, useUserLookup } from '@/composables/useLookups'
import * as peerApi from '@/api/peer'
import * as addressBookApi from '@/api/address_book'
import * as abCollectionApi from '@/api/address_book_collection'
import { connectByClient } from '@/utils/peer'
import { timeAgo, secondsSince } from '@/utils/time'
import { copyText } from '@/utils/clipboard'
import { jsonToCsv, downBlob } from '@/utils/file'

const { state, query, getList, search, reset, del, batchDelete } = useResource(peerApi, {
  id: '',
  hostname: '',
  username: '',
  ip: '',
  time_ago: null,
})

const { groups: deviceGroups, load: loadDeviceGroups } = useDeviceGroupLookup()
const { users, load: loadUsers } = useUserLookup()

const tableRef = ref(null)

const DEFAULT_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'hostname', label: 'Hostname' },
  { key: 'os', label: 'OS' },
  { key: 'username', label: 'Username' },
  { key: 'group', label: 'Group' },
  { key: 'cpu', label: 'CPU' },
  { key: 'memory', label: 'Memory' },
  { key: 'last_seen', label: 'Last seen' },
  { key: 'ip', label: 'IP' },
  { key: 'version', label: 'Version' },
  { key: 'alias', label: 'Alias' },
]

const STORAGE_KEY = 'peer_visible_columns'
const columnsDialogOpen = ref(false)
const columnOrder = ref([...DEFAULT_COLUMNS])
const visibleCols = reactive(
  Object.fromEntries(DEFAULT_COLUMNS.map(c => [c.key, true]))
)

function loadColumns () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.order)) {
      const known = Object.fromEntries(DEFAULT_COLUMNS.map(c => [c.key, c]))
      const ordered = parsed.order.map(k => known[k]).filter(Boolean)
      const remaining = DEFAULT_COLUMNS.filter(c => !parsed.order.includes(c.key))
      columnOrder.value = [...ordered, ...remaining]
    }
    if (parsed?.visible) {
      DEFAULT_COLUMNS.forEach(c => {
        visibleCols[c.key] = parsed.visible[c.key] !== false
      })
    }
  } catch (_) { /* ignore */ }
}

function saveColumns () {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    order: columnOrder.value.map(c => c.key),
    visible: { ...visibleCols },
  }))
  columnsDialogOpen.value = false
}

function resetColumns () {
  columnOrder.value = [...DEFAULT_COLUMNS]
  DEFAULT_COLUMNS.forEach(c => { visibleCols[c.key] = true })
  localStorage.removeItem(STORAGE_KEY)
}

function moveCol (idx, dir) {
  const next = idx + dir
  if (next < 0 || next >= columnOrder.value.length) return
  const arr = columnOrder.value.slice()
  const [item] = arr.splice(idx, 1)
  arr.splice(next, 0, item)
  columnOrder.value = arr
}

function visible (key) {
  return visibleCols[key] !== false
}

function groupName (id) {
  if (!id) return ''
  const g = deviceGroups.value.find(x => x.id === id)
  return g ? g.name : ''
}

function isOnline (row) {
  return secondsSince(row.last_online_time) < 60
}

function connect (row) {
  connectByClient(row.id)
}

function bulkDelete (selected, clear) {
  batchDelete(selected, 'row_id', 'row_ids').then(() => clear?.())
}

const formOpen = ref(false)
const submitting = ref(false)
const emptyForm = () => ({
  row_id: 0,
  group_id: null,
  cpu: '',
  hostname: '',
  id: '',
  memory: '',
  os: '',
  username: '',
  uuid: '',
  version: '',
  alias: '',
})
const form = reactive(emptyForm())

function openCreate () {
  Object.assign(form, emptyForm())
  formOpen.value = true
}

function openEdit (row) {
  Object.assign(form, emptyForm(), {
    row_id: row.row_id,
    group_id: row.group_id || null,
    cpu: row.cpu || '',
    hostname: row.hostname || '',
    id: row.id || '',
    memory: row.memory || '',
    os: row.os || '',
    username: row.username || '',
    uuid: row.uuid || '',
    version: row.version || '',
    alias: row.alias || '',
  })
  formOpen.value = true
}

async function submit () {
  if (!form.id) return ElMessage.warning('ID is required')
  submitting.value = true
  const fn = form.row_id ? peerApi.update : peerApi.create
  const res = await fn({ ...form }).catch(() => false)
  submitting.value = false
  if (res) {
    ElMessage.success('Saved')
    formOpen.value = false
    getList()
  }
}

const abDialogOpen = ref(false)
const abSubmitting = ref(false)
const abCollections = ref([])
const abForm = reactive({
  user_id: null,
  collection_id: 0,
  tags: [],
  peer_ids: [],
})

function resetAbForm () {
  abForm.user_id = null
  abForm.collection_id = 0
  abForm.tags = []
  abForm.peer_ids = []
  abCollections.value = []
}

async function onAbUserChange (uid) {
  abForm.collection_id = 0
  abCollections.value = []
  if (!uid) return
  const res = await abCollectionApi.list({ user_id: uid, page: 1, page_size: 9999 }).catch(() => false)
  if (res) abCollections.value = res.data?.list || []
}

function openAddToAB (row) {
  resetAbForm()
  abForm.peer_ids = [row.row_id]
  abDialogOpen.value = true
}

function openBatchAddToAB (selected) {
  if (!selected?.length) return ElMessage.warning('Select rows first')
  resetAbForm()
  abForm.peer_ids = selected.map(r => r.row_id)
  abDialogOpen.value = true
}

async function submitAb () {
  if (!abForm.user_id) return ElMessage.warning('Select an owner')
  if (!abForm.peer_ids.length) return ElMessage.warning('No peers selected')
  abSubmitting.value = true
  const res = await addressBookApi.batchCreateFromPeers({
    user_id: abForm.user_id,
    collection_id: abForm.collection_id || 0,
    peer_ids: abForm.peer_ids,
    tags: abForm.tags,
  }).catch(() => false)
  abSubmitting.value = false
  if (res) {
    ElMessage.success('Added to address book')
    abDialogOpen.value = false
    tableRef.value?.clearSelection?.()
  }
}

const exporting = ref(false)
async function exportCsv () {
  exporting.value = true
  const res = await peerApi.list({ ...query, page: 1, page_size: 10000 }).catch(() => false)
  exporting.value = false
  if (!res) return
  const rows = (res.data?.list || []).map(r => {
    const { user_id, user, ...rest } = r
    return {
      ...rest,
      last_online_time: r.last_online_time ? new Date(r.last_online_time * 1000).toLocaleString() : '',
    }
  })
  if (!rows.length) return ElMessage.warning('No data to export')
  downBlob(jsonToCsv(rows), 'peers.csv')
}

const importOpen = ref(false)
const importing = ref(false)
const importDone = ref(0)
const importTotal = ref(0)

function parseCsv (text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length)
  if (!lines.length) return []
  const split = line => {
    const out = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (c === '"') inQ = false
        else cur += c
      } else {
        if (c === '"') inQ = true
        else if (c === ',') { out.push(cur); cur = '' }
        else cur += c
      }
    }
    out.push(cur)
    return out
  }
  const header = split(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const cols = split(line)
    const obj = {}
    header.forEach((h, i) => { obj[h] = cols[i] ?? '' })
    return obj
  })
}

async function handleImportFile (file) {
  const raw = file.raw || file
  const text = await raw.text()
  const rows = parseCsv(text)
  if (!rows.length) return ElMessage.warning('Empty CSV')
  importing.value = true
  importTotal.value = rows.length
  importDone.value = 0
  try {
    await Promise.all(rows.map(async (r) => {
      await peerApi.create({
        id: r.id || '',
        cpu: r.cpu || '',
        hostname: r.hostname || '',
        memory: r.memory || '',
        os: r.os || '',
        username: r.username || '',
        uuid: r.uuid || '',
        version: r.version || '',
        group_id: r.group_id ? Number(r.group_id) : null,
      }).catch(() => false)
      importDone.value++
    }))
    ElMessage.success(`Imported ${importDone.value} rows`)
    importOpen.value = false
    getList()
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  loadColumns()
  loadDeviceGroups()
  loadUsers()
})
</script>

<style scoped lang="scss">
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  &.online { background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18); }
  &.offline { background: #cbd5e1; }
}
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
</style>
