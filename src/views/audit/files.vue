<template>
  <PageHeader title="File Transfer Log" subtitle="File transfers between peers" />

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

    <el-table-column type="expand">
      <template #default="{ row }">
        <div class="expand-panel">
          <div v-if="parseFiles(row).length">
            <div class="text-sm text-muted mb-2">{{ parseFiles(row).length }} file(s)</div>
            <el-table :data="parseFiles(row)" size="small" :border="true">
              <el-table-column prop="name" label="Name" min-width="260" />
              <el-table-column label="Size" width="140">
                <template #default="{ row: f }">
                  <span>{{ f.size != null ? sizeFormat(Number(f.size)) : '—' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <pre v-else class="raw-info">{{ rawInfo(row) }}</pre>
        </div>
      </template>
    </el-table-column>

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
    <el-table-column label="Type" width="130">
      <template #default="{ row }">
        <StatusBadge v-if="row.type === 'to_remote'" kind="info" label="Upload" />
        <StatusBadge v-else-if="row.type === 'to_local'" kind="success" label="Download" />
        <StatusBadge v-else kind="neutral" :label="row.type || 'Unknown'" />
      </template>
    </el-table-column>
    <el-table-column label="Started" width="180">
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { fileList, fileRemove, fileBatchDelete } from '@/api/audit'
import { copyText } from '@/utils/clipboard'
import { jsonToCsv, downBlob, sizeFormat } from '@/utils/file'

const { state, query, getList, search, reset, del, batchDelete: bulkRemove } = useResource(
  { list: fileList, remove: fileRemove, batchRemove: fileBatchDelete },
  { peer: '', from_peer: '' },
)

const tableRef = ref(null)

function bulkDelete (selected, clear) {
  bulkRemove(selected).then(() => clear?.())
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

function parseFiles (row) {
  if (Array.isArray(row.files) && row.files.length) return row.files
  if (row.info) {
    if (typeof row.info === 'string') {
      try {
        const parsed = JSON.parse(row.info)
        if (Array.isArray(parsed)) return parsed
        if (Array.isArray(parsed?.files)) return parsed.files
      } catch (_) { /* fallthrough */ }
    } else if (Array.isArray(row.info)) {
      return row.info
    } else if (Array.isArray(row.info?.files)) {
      return row.info.files
    }
  }
  return []
}

function rawInfo (row) {
  if (row.info == null) return ''
  if (typeof row.info === 'string') {
    try { return JSON.stringify(JSON.parse(row.info), null, 2) } catch (_) { return row.info }
  }
  return JSON.stringify(row.info, null, 2)
}

const exporting = ref(false)
async function exportCsv () {
  exporting.value = true
  const res = await fileList({ ...query, page: 1, page_size: 10000 }).catch(() => false)
  exporting.value = false
  if (!res) return
  const rows = (res.data?.list || []).map(r => {
    const { user, ...rest } = r
    return {
      ...rest,
      created_at: formatRowTime(r.created_at),
    }
  })
  if (!rows.length) return ElMessage.warning('No data to export')
  downBlob(jsonToCsv(rows), 'file_transfers.csv')
}
</script>

<style scoped lang="scss">
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
.expand-panel {
  padding: 12px 24px;
}
.raw-info {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
