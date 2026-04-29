<template>
  <PageHeader title="Users" subtitle="Manage user accounts">
    <el-button type="primary" @click="goNew">
      <el-icon><Plus /></el-icon> New user
    </el-button>
  </PageHeader>

  <DataTable
    v-model="query"
    :data="state.list"
    :total="state.total"
    :loading="state.loading"
    row-key="id"
    @change="getList"
  >
    <template #filters>
      <el-input
        v-model="query.username"
        placeholder="Search username"
        clearable
        style="width:220px"
        @change="search"
        @clear="search"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button @click="search">Filter</el-button>
      <el-button @click="reset">Reset</el-button>
    </template>

    <el-table-column prop="id" label="ID" width="80" />

    <el-table-column label="Username" min-width="200">
      <template #default="{ row }">
        <div class="font-medium">{{ row.username }}</div>
        <div class="text-sm text-muted" v-if="row.email">{{ row.email }}</div>
      </template>
    </el-table-column>

    <el-table-column prop="nickname" label="Nickname" min-width="140" />

    <el-table-column label="Group" min-width="140">
      <template #default="{ row }">
        <el-tag v-if="groupName(row.group_id)" type="info" effect="plain">{{ groupName(row.group_id) }}</el-tag>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>

    <el-table-column label="Status" width="120">
      <template #default="{ row }">
        <span style="cursor:pointer" @click="toggleStatus(row)">
          <StatusBadge v-if="row.status === 1" kind="success" label="Active" />
          <StatusBadge v-else kind="danger" label="Disabled" />
        </span>
      </template>
    </el-table-column>

    <el-table-column label="Created" width="170">
      <template #default="{ row }">
        <span class="text-sm">{{ row.created_at ? formatTime(row.created_at) : '—' }}</span>
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="280" fixed="right">
      <template #default="{ row }">
        <el-button text @click="goEdit(row)">
          <el-icon><Edit /></el-icon> Edit
        </el-button>
        <el-button text @click="resetPwd(row)">
          <el-icon><Key /></el-icon> Reset password
        </el-button>
        <el-button text type="danger" @click="del(row)">
          <el-icon><Delete /></el-icon> Delete
        </el-button>
      </template>
    </el-table-column>
  </DataTable>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { useUserGroupLookup } from '@/composables/useLookups'
import { formatTime } from '@/utils/time'
import * as userApi from '@/api/user'

const router = useRouter()
const { state, query, getList, search, reset, del } = useResource(userApi, { username: '' })
const { groups, load: loadGroups } = useUserGroupLookup()
loadGroups()

function groupName (id) {
  if (!id) return ''
  return groups.value.find(g => g.id === id)?.name || ''
}

function goNew () { router.push('/users/new') }
function goEdit (row) { router.push(`/users/${row.id}/edit`) }

async function toggleStatus (row) {
  try {
    const next = row.status === 1 ? 2 : 1
    await userApi.update({ id: row.id, status: next })
    row.status = next
    ElMessage.success('Status updated')
  } catch (e) {
    ElMessage.error('Failed to update status')
  }
}

async function resetPwd (row) {
  const result = await ElMessageBox.prompt('Enter a new password', `Reset password for ${row.username}`, {
    confirmButtonText: 'Reset',
    cancelButtonText: 'Cancel',
    inputType: 'password',
    inputValidator: v => (v && v.length >= 6) || 'At least 6 characters',
  }).catch(() => false)
  if (!result) return
  const res = await userApi.changePwd({ id: row.id, password: result.value }).catch(() => false)
  if (res) ElMessage.success('Password reset')
}
</script>
