<template>
  <PageHeader title="My Address Book" subtitle="Quick-launch peers you've saved">
    <el-button type="primary" @click="openCreate">
      <el-icon><Plus /></el-icon> Add entry
    </el-button>
  </PageHeader>

  <DataTable
    v-model="query"
    :data="state.list"
    :total="state.total"
    :loading="state.loading"
    :selectable="true"
    row-key="row_id"
    @change="getList"
  >
    <template #filters>
      <el-select
        v-model="query.collection_id"
        placeholder="Collection"
        clearable
        filterable
        style="width:200px"
        @change="search"
        @clear="search"
      >
        <el-option label="My address book" :value="0" />
        <el-option v-for="c in collections" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-input v-model="query.id" placeholder="ID" clearable style="width:140px" @change="search" @clear="search" />
      <el-input v-model="query.username" placeholder="Username" clearable style="width:160px" @change="search" @clear="search" />
      <el-input v-model="query.hostname" placeholder="Hostname" clearable style="width:160px" @change="search" @clear="search" />
      <el-button @click="search"><el-icon><Search /></el-icon> Filter</el-button>
      <el-button @click="reset">Reset</el-button>
    </template>

    <el-table-column label="ID" min-width="180">
      <template #default="{ row }">
        <div class="flex items-center gap-2">
          <PlatformIcon :raw="row.platform || row.os" />
          <span class="copyable font-medium" @click="copyText(row.id)">{{ row.id }}</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="Collection" width="160">
      <template #default="{ row }">
        <span v-if="row.collection_id">{{ collectionName(row.collection_id) || '—' }}</span>
        <span v-else class="text-muted">My address book</span>
      </template>
    </el-table-column>

    <el-table-column prop="username" label="Username" min-width="140" />
    <el-table-column prop="hostname" label="Hostname" min-width="140" />

    <el-table-column label="Tags" min-width="180">
      <template #default="{ row }">
        <template v-if="row.tags && row.tags.length">
          <el-tag v-for="t in row.tags" :key="t" size="small" effect="plain" style="margin-right:4px">{{ t }}</el-tag>
        </template>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>

    <el-table-column prop="alias" label="Alias" min-width="120" />

    <el-table-column label="Actions" width="220" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" size="small" @click="connect(row)">Connect</el-button>
        <el-tooltip content="Edit">
          <el-button text @click="openEdit(row)"><el-icon><Edit /></el-icon></el-button>
        </el-tooltip>
        <el-tooltip content="Delete">
          <el-button text type="danger" @click="del(row, 'row_id')"><el-icon><Delete /></el-icon></el-button>
        </el-tooltip>
      </template>
    </el-table-column>
  </DataTable>

  <FormDrawer
    v-model="formOpen"
    :title="editing ? 'Edit entry' : 'Add entry'"
    :submitting="submitting"
    @submit="submit"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Collection">
        <el-select v-model="form.collection_id" placeholder="My address book" clearable filterable style="width:100%">
          <el-option label="My address book" :value="0" />
          <el-option v-for="c in collections" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="ID" prop="id">
        <el-input v-model="form.id" placeholder="Peer ID" />
      </el-form-item>
      <el-form-item label="Username">
        <el-input v-model="form.username" />
      </el-form-item>
      <el-form-item label="Hostname">
        <el-input v-model="form.hostname" />
      </el-form-item>
      <el-form-item label="Alias">
        <el-input v-model="form.alias" />
      </el-form-item>
      <el-form-item label="Tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="Type and press enter"
          style="width:100%"
        >
          <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
    </el-form>
  </FormDrawer>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { useResource } from '@/composables/useResource'
import { copyText } from '@/utils/clipboard'
import { connectByClient } from '@/utils/peer'
import * as ab from '@/api/my/address_book'
import * as collectionApi from '@/api/my/address_book_collection'

const { state, query, getList, search, reset, del } = useResource(ab, {
  collection_id: null,
  id: '',
  username: '',
  hostname: '',
})

const collections = ref([])
async function loadCollections () {
  const res = await collectionApi.list({ page: 1, page_size: 9999 }).catch(() => false)
  collections.value = res ? (res.data?.list || []) : []
}

function collectionName (id) {
  return collections.value.find(c => c.id === id)?.name || ''
}

function connect (row) {
  connectByClient(row.id)
}

const tagOptions = computed(() => {
  const set = new Set()
  state.list.forEach(r => (r.tags || []).forEach(t => set.add(t)))
  return [...set]
})

const formOpen = ref(false)
const editing = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  row_id: null,
  collection_id: 0,
  id: '',
  username: '',
  hostname: '',
  alias: '',
  tags: [],
})

const rules = {
  id: [{ required: true, message: 'Peer ID is required', trigger: 'blur' }],
}

function resetForm () {
  form.row_id = null
  form.collection_id = 0
  form.id = ''
  form.username = ''
  form.hostname = ''
  form.alias = ''
  form.tags = []
}

function openCreate () {
  editing.value = false
  resetForm()
  formOpen.value = true
}

function openEdit (row) {
  editing.value = true
  form.row_id = row.row_id
  form.collection_id = row.collection_id || 0
  form.id = row.id
  form.username = row.username || ''
  form.hostname = row.hostname || ''
  form.alias = row.alias || ''
  form.tags = Array.isArray(row.tags) ? [...row.tags] : []
  formOpen.value = true
}

async function submit () {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const payload = {
    collection_id: form.collection_id || 0,
    id: form.id,
    username: form.username,
    hostname: form.hostname,
    alias: form.alias,
    tags: form.tags,
  }
  const fn = editing.value
    ? ab.update({ row_id: form.row_id, ...payload })
    : ab.create(payload)
  const res = await fn.catch(() => false)
  submitting.value = false
  if (res) {
    ElMessage.success(editing.value ? 'Updated' : 'Created')
    formOpen.value = false
    getList()
  }
}

onMounted(loadCollections)
</script>

<style scoped lang="scss">
.copyable {
  cursor: pointer;
  &:hover { color: var(--rd-accent-hover, #6366f1); }
}
</style>
