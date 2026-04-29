<template>
  <PageHeader title="Active Sessions" subtitle="Logged-in user sessions" />

  <DataTable
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
        placeholder="Filter by user"
        clearable
        filterable
        style="width:240px"
        @change="search"
        @clear="search"
      >
        <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
      </el-select>
      <el-button @click="search">Filter</el-button>
      <el-button @click="reset">Reset</el-button>
    </template>

    <template #bulk="{ selected, clear }">
      <el-button type="danger" size="small" @click="bulkRevoke(selected, clear)">
        <el-icon><Delete /></el-icon> Revoke selected
      </el-button>
    </template>

    <el-table-column prop="id" label="ID" width="80" />

    <el-table-column label="User" min-width="160">
      <template #default="{ row }">
        <span>{{ userName(row.user_id) || `#${row.user_id}` }}</span>
      </template>
    </el-table-column>

    <el-table-column label="Token" min-width="200">
      <template #default="{ row }">
        <code class="text-sm">{{ maskToken(row.token) }}</code>
      </template>
    </el-table-column>

    <el-table-column label="Created" width="170">
      <template #default="{ row }">
        <span class="text-sm">{{ row.created_at ? formatTime(row.created_at) : '—' }}</span>
      </template>
    </el-table-column>

    <el-table-column label="Expires" width="180">
      <template #default="{ row }">
        <StatusBadge v-if="isExpired(row.expired_at)" kind="danger" label="Expired" />
        <span v-else class="text-sm">{{ row.expired_at ? formatTime(row.expired_at) : '—' }}</span>
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="140" fixed="right">
      <template #default="{ row }">
        <el-button text type="danger" size="small" @click="del(row)">
          <el-icon><Delete /></el-icon> Revoke
        </el-button>
      </template>
    </el-table-column>
  </DataTable>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { useUserLookup } from '@/composables/useLookups'
import { formatTime } from '@/utils/time'
import * as userTokenApi from '@/api/user_token'

const { state, query, getList, search, reset, del, batchDelete } = useResource(userTokenApi, { user_id: null })
const { users, load: loadUsers } = useUserLookup()
loadUsers()

function userName (id) {
  return users.value.find(u => u.id === id)?.username || ''
}

function maskToken (t) {
  if (!t) return '—'
  if (t.length <= 14) return t
  return `${t.slice(0, 8)}...${t.slice(-4)}`
}

function isExpired (t) {
  if (!t) return false
  return new Date(t).getTime() < Date.now()
}

function bulkRevoke (selected, clear) {
  batchDelete(selected)
  clear()
}
</script>
