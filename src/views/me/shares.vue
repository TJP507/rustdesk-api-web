<template>
  <PageHeader title="My Share Records" subtitle="Address book entries you've shared with others" />

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
    <template #bulk="{ selected, clear }">
      <el-button type="danger" size="small" @click="bulkDelete(selected, clear)">Delete selected</el-button>
    </template>

    <el-table-column prop="id" label="ID" width="100" />
    <el-table-column label="Peer" min-width="200">
      <template #default="{ row }">
        <span v-if="row.peer_id || row.id_peer || row.peer" class="copyable" @click="copyText(peerOf(row))">
          {{ peerOf(row) }}
        </span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column label="Created" width="180">
      <template #default="{ row }">
        <span>{{ row.created_at ? formatTime(row.created_at) : '—' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Expires" width="200">
      <template #default="{ row }">
        <template v-if="!expiresAt(row)">
          <span class="text-muted">Never</span>
        </template>
        <template v-else-if="isExpired(row)">
          <StatusBadge kind="danger" label="Expired" />
        </template>
        <template v-else>
          <span>{{ formatTime(expiresAt(row)) }}</span>
        </template>
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="120" fixed="right">
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
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { formatTime } from '@/utils/time'
import { copyText } from '@/utils/clipboard'
import * as shareApi from '@/api/my/share_record'

const apiAdapter = {
  list: shareApi.list,
  remove: shareApi.remove,
  batchRemove: shareApi.batchDelete,
}

const { state, query, getList, search, reset, del, batchDelete: bulkRemove } = useResource(apiAdapter, {})
const tableRef = ref(null)

function peerOf (row) {
  return row.peer_id || row.id_peer || row.peer || ''
}

function expiresAt (row) {
  return row.expire_at || row.expires_at || row.expire_time || null
}

function isExpired (row) {
  const t = expiresAt(row)
  if (!t) return false
  const ms = typeof t === 'number' && t < 1e12 ? t * 1000 : new Date(t).getTime()
  return ms && ms < Date.now()
}

function bulkDelete (selected, clear) {
  bulkRemove(selected).then(() => clear?.())
}
</script>

<style scoped lang="scss">
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
</style>
