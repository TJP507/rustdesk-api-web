<template>
  <PageHeader title="My Devices" subtitle="Devices linked to your account">
    <el-button @click="getList">
      <el-icon><Refresh /></el-icon> Refresh
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
      <el-input v-model="query.id" placeholder="ID" clearable style="width:160px" @change="search" @clear="search" />
      <el-input v-model="query.hostname" placeholder="Hostname" clearable style="width:180px" @change="search" @clear="search" />
      <el-input v-model="query.username" placeholder="Username" clearable style="width:180px" @change="search" @clear="search" />
      <el-button @click="search"><el-icon><Search /></el-icon> Filter</el-button>
      <el-button @click="reset">Reset</el-button>
    </template>

    <el-table-column label="ID" min-width="180">
      <template #default="{ row }">
        <div class="flex items-center gap-2">
          <PlatformIcon :raw="row.os || row.platform" />
          <span class="copyable font-medium" @click="copyText(row.id)">{{ row.id }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="hostname" label="Hostname" min-width="140" />
    <el-table-column prop="username" label="Username" min-width="120" />
    <el-table-column label="Last seen" width="200">
      <template #default="{ row }">
        <div class="flex items-center gap-2">
          <span class="status-dot" :class="isOnline(row) ? 'online' : 'offline'"></span>
          <span>{{ row.last_online_time ? timeAgo(row.last_online_time * 1000) : '—' }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="IP" width="140">
      <template #default="{ row }">
        <span v-if="row.last_online_ip">{{ row.last_online_ip }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>
    <el-table-column prop="version" label="Version" width="110" />

    <el-table-column label="Actions" width="140" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" size="small" @click="connect(row)">Connect</el-button>
      </template>
    </el-table-column>
  </DataTable>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { useResource } from '@/composables/useResource'
import * as myPeerApi from '@/api/my/peer'
import { connectByClient } from '@/utils/peer'
import { timeAgo, secondsSince } from '@/utils/time'
import { copyText } from '@/utils/clipboard'

const { state, query, getList, search, reset } = useResource(myPeerApi, {
  id: '',
  hostname: '',
  username: '',
})

function isOnline (row) {
  return secondsSince(row.last_online_time) < 60
}

function connect (row) {
  connectByClient(row.id)
}
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
