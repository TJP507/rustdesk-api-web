<template>
  <PageHeader title="My Login History" subtitle="Recent sign-ins to your account" />

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

    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column label="Type" width="140">
      <template #default="{ row }">
        <StatusBadge :kind="typeKind(row.type)" :label="row.type || 'unknown'" />
      </template>
    </el-table-column>
    <el-table-column prop="client" label="Client" width="140" />
    <el-table-column label="Peer" min-width="160">
      <template #default="{ row }">
        <span v-if="row.client_id" class="copyable" @click="copyText(row.client_id)">{{ row.client_id }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column prop="ip" label="IP" width="140" />
    <el-table-column label="Platform" width="140">
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
import { ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { useResource } from '@/composables/useResource'
import { copyText } from '@/utils/clipboard'
import * as loginLogApi from '@/api/my/login_log'

const apiAdapter = {
  list: loginLogApi.list,
  remove: loginLogApi.remove,
  batchRemove: loginLogApi.batchDelete,
}

const { state, query, getList, del, batchDelete: bulkRemove } = useResource(apiAdapter, {})
const tableRef = ref(null)

function typeKind (t) {
  const s = String(t || '').toLowerCase()
  if (s.includes('success') || s.includes('ok') || s === 'login') return 'success'
  if (s.includes('fail') || s.includes('error') || s.includes('deny')) return 'danger'
  if (s.includes('logout')) return 'neutral'
  return 'info'
}

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
</script>

<style scoped lang="scss">
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
</style>
