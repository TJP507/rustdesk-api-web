<template>
  <PageHeader title="Share Records" subtitle="Address book entries shared between users" />

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
        placeholder="Owner"
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

    <template #bulk="{ selected, clear }">
      <el-button type="danger" size="small" @click="bulkDelete(selected, clear)">Delete selected</el-button>
    </template>

    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column label="Owner" min-width="140">
      <template #default="{ row }">
        <span>{{ userName(row.user_id) || '—' }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Peer" min-width="160">
      <template #default="{ row }">
        <span class="copyable" @click="copyText(row.peer_id)">{{ row.peer_id }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Created" width="180">
      <template #default="{ row }">
        <span>{{ formatRowTime(row.created_at) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="Expires" width="200">
      <template #default="{ row }">
        <template v-if="!expireValue(row)">
          <span class="text-muted">Never</span>
        </template>
        <template v-else-if="isExpired(row)">
          <StatusBadge kind="danger" label="Expired" />
        </template>
        <template v-else>
          <span>{{ formatRowTime(expireValue(row)) }}</span>
        </template>
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
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { useUserLookup } from '@/composables/useLookups'
import * as shareRecordApi from '@/api/share_record'
import { copyText } from '@/utils/clipboard'

const apiAdapter = {
  list: shareRecordApi.list,
  remove: shareRecordApi.remove,
  batchRemove: shareRecordApi.batchDelete,
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

function expireValue (row) {
  return row.expire || row.share_token_expire || 0
}

function isExpired (row) {
  const v = expireValue(row)
  if (!v) return false
  const ms = toMs(v)
  return ms > 0 && ms < Date.now()
}

onMounted(loadUsers)
</script>

<style scoped lang="scss">
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
</style>
