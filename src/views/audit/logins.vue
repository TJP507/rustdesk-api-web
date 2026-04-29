<template>
  <PageHeader title="Login Log" subtitle="Authentication attempts" />

  <DataTable
    ref="tableRef"
    v-model="query"
    :data="state.list"
    :total="state.total"
    :loading="state.loading"
    :selectable="true"
    row-key="id"
    @change="getList"
  >
    <template #filters>
      <el-select
        v-model="query.user_id"
        placeholder="User"
        filterable
        clearable
        style="width:220px"
        @change="search"
      >
        <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
      </el-select>
      <el-button @click="search"><el-icon><Search /></el-icon> Filter</el-button>
      <el-button @click="reset"><el-icon><Refresh /></el-icon> Reset</el-button>
    </template>

    <template #actions>
      <el-button @click="exportCsv" :loading="exporting">
        <el-icon><Download /></el-icon> Export CSV
      </el-button>
    </template>

    <template #bulk="{ selected, clear }">
      <el-button type="danger" size="small" @click="bulkDelete(selected, clear)">Delete selected</el-button>
    </template>

    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column label="User" min-width="140">
      <template #default="{ row }">
        <span>{{ userName(row.user_id) || '—' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Type" width="120">
      <template #default="{ row }">
        <StatusBadge kind="neutral" :label="row.type || 'unknown'" />
      </template>
    </el-table-column>
    <el-table-column prop="client" label="Client" width="140" />
    <el-table-column label="Peer" min-width="140">
      <template #default="{ row }">
        <span v-if="row.client_id" class="copyable" @click="copyText(row.client_id)">{{ row.client_id }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column label="UUID" width="140">
      <template #default="{ row }">
        <span v-if="row.uuid" class="copyable text-sm" @click="copyText(row.uuid)">{{ truncate(row.uuid) }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column prop="ip" label="IP" width="140" />
    <el-table-column label="Platform" width="120">
      <template #default="{ row }">
        <PlatformIcon :raw="row.platform || row.os" />
      </template>
    </el-table-column>
    <el-table-column label="Time" width="180">
      <template #default="{ row }">
        <span>{{ formatRowTime(row.created_at) }}</span>
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="100" fixed="right">
      <template #default="{ row }">
        <el-tooltip content="Delete">
          <el-button text type="danger" @click="del(row)"><el-icon><Delete /></el-icon></el-button>
        </el-tooltip>
      </template>
    </el-table-column>
  </DataTable>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { useResource } from '@/composables/useResource'
import { useUserLookup } from '@/composables/useLookups'
import * as loginLogApi from '@/api/login_log'
import { copyText } from '@/utils/clipboard'
import { jsonToCsv, downBlob } from '@/utils/file'

const apiAdapter = {
  list: loginLogApi.list,
  remove: loginLogApi.remove,
  batchRemove: loginLogApi.batchDelete,
}

const { state, query, getList, search, reset, del, batchDelete: bulkRemove } = useResource(
  apiAdapter,
  { user_id: null },
)

const { users, load: loadUsers } = useUserLookup()
const tableRef = ref(null)

function userName (id) {
  if (!id) return ''
  const u = users.value.find(x => x.id === id)
  return u ? u.username : ''
}

function bulkDelete (selected, clear) {
  bulkRemove(selected).then(() => clear?.())
}

function truncate (s) {
  if (!s) return ''
  return s.length > 10 ? s.slice(0, 10) + '…' : s
}

function toMs (t) {
  if (!t) return 0
  if (typeof t === 'number') return t < 1e12 ? t * 1000 : t
  const d = new Date(t).getTime()
  return isNaN(d) ? 0 : d
}

function formatRowTime (t) {
  const ms = toMs(t)
  if (!ms) return '—'
  return new Date(ms).toLocaleString()
}

const exporting = ref(false)
async function exportCsv () {
  exporting.value = true
  const res = await loginLogApi.list({ ...query, page: 1, page_size: 10000 }).catch(() => false)
  exporting.value = false
  if (!res) return
  const rows = (res.data?.list || []).map(r => {
    const { user, ...rest } = r
    return {
      ...rest,
      username: userName(r.user_id),
      created_at: formatRowTime(r.created_at),
    }
  })
  if (!rows.length) return ElMessage.warning('No data to export')
  downBlob(jsonToCsv(rows), 'login_log.csv')
}

onMounted(loadUsers)
</script>

<style scoped lang="scss">
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
</style>
