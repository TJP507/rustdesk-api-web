<template>
  <PageHeader title="Connection Log" subtitle="Remote desktop connection history" />

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
      <el-input v-model="query.peer" placeholder="Peer" clearable style="width:160px" @change="search" />
      <el-input v-model="query.from_peer" placeholder="From peer" clearable style="width:160px" @change="search" />
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
    <el-table-column label="Peer" min-width="140">
      <template #default="{ row }">
        <span class="copyable" @click="copyText(row.peer_id)">{{ row.peer_id }}</span>
      </template>
    </el-table-column>
    <el-table-column label="From peer" min-width="140">
      <template #default="{ row }">
        <span class="copyable" @click="copyText(row.from_peer)">{{ row.from_peer }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="from_name" label="From name" min-width="140" />
    <el-table-column prop="ip" label="IP" width="140" />
    <el-table-column label="Type" width="120">
      <template #default="{ row }">
        <StatusBadge v-if="row.type === 'file'" kind="info" label="File" />
        <StatusBadge v-else kind="neutral" label="Connection" />
      </template>
    </el-table-column>
    <el-table-column label="UUID" width="140">
      <template #default="{ row }">
        <span v-if="row.uuid" class="copyable text-sm" @click="copyText(row.uuid)">{{ truncate(row.uuid) }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column label="Started" width="180">
      <template #default="{ row }">
        <span>{{ formatRowTime(row.created_at) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Closed" width="180">
      <template #default="{ row }">
        <span v-if="row.close_time">{{ formatRowTime(row.close_time) }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column label="Duration" width="120">
      <template #default="{ row }">
        <span>{{ duration(row) }}</span>
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { list, remove, batchDelete } from '@/api/audit'
import { copyText } from '@/utils/clipboard'
import { jsonToCsv, downBlob } from '@/utils/file'

const { state, query, getList, search, reset, del, batchDelete: bulkRemove } = useResource(
  { list, remove, batchRemove: batchDelete },
  { peer: '', from_peer: '' },
)

const tableRef = ref(null)

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

function duration (row) {
  const start = toMs(row.created_at)
  const end = toMs(row.close_time)
  if (!start || !end || end <= start) return '—'
  let secs = Math.floor((end - start) / 1000)
  const h = Math.floor(secs / 3600); secs -= h * 3600
  const m = Math.floor(secs / 60); secs -= m * 60
  if (h) return `${h}h ${m}m ${secs}s`
  if (m) return `${m}m ${secs}s`
  return `${secs}s`
}

const exporting = ref(false)
async function exportCsv () {
  exporting.value = true
  const res = await list({ ...query, page: 1, page_size: 10000 }).catch(() => false)
  exporting.value = false
  if (!res) return
  const rows = (res.data?.list || []).map(r => {
    const { user, ...rest } = r
    return {
      ...rest,
      created_at: formatRowTime(r.created_at),
      close_time: r.close_time ? formatRowTime(r.close_time) : '',
      duration: duration(r),
    }
  })
  if (!rows.length) return ElMessage.warning('No data to export')
  downBlob(jsonToCsv(rows), 'connections.csv')
}
</script>

<style scoped lang="scss">
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
</style>
