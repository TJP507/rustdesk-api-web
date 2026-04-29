<template>
  <PageHeader title="Address Book" subtitle="All saved peers across users">
    <el-button type="primary" @click="openCreate">
      <el-icon><Plus /></el-icon> Add entry
    </el-button>
  </PageHeader>

  <DataTable
    v-model="query"
    :data="state.list"
    :total="state.total"
    :loading="state.loading"
    row-key="row_id"
    @change="getList"
  >
    <template #filters>
      <el-select
        v-model="query.user_id"
        placeholder="Owner"
        clearable
        filterable
        style="width:180px"
        @change="onOwnerFilterChange"
        @clear="onOwnerFilterChange"
      >
        <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
      </el-select>

      <el-select
        v-model="query.collection_id"
        placeholder="Collection"
        clearable
        filterable
        style="width:200px"
        @change="search"
        @clear="search"
      >
        <el-option label="All / My address book" :value="0" />
        <el-option
          v-for="c in filterCollections"
          :key="c.id"
          :label="c.name"
          :value="c.id"
        />
      </el-select>

      <el-input
        v-model="query.id"
        placeholder="ID"
        clearable
        style="width:140px"
        @change="search"
        @clear="search"
      />
      <el-input
        v-model="query.username"
        placeholder="Username"
        clearable
        style="width:160px"
        @change="search"
        @clear="search"
      />
      <el-input
        v-model="query.hostname"
        placeholder="Hostname"
        clearable
        style="width:160px"
        @change="search"
        @clear="search"
      />
      <el-button @click="search">
        <el-icon><Search /></el-icon> Filter
      </el-button>
      <el-button @click="onReset">Reset</el-button>
    </template>

    <el-table-column label="ID" min-width="180">
      <template #default="{ row }">
        <PlatformIcon :raw="row.platform || row.os" />
        <div class="font-medium copyable" @click="copyText(row.id)">{{ row.id }}</div>
      </template>
    </el-table-column>

    <el-table-column label="Owner" width="160">
      <template #default="{ row }">
        <el-tag v-if="ownerName(row.user_id)" type="info" effect="plain" size="small">
          {{ ownerName(row.user_id) }}
        </el-tag>
        <span v-else class="text-muted">—</span>
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

    <el-table-column label="Tags" min-width="200">
      <template #default="{ row }">
        <template v-if="row.tags && row.tags.length">
          <el-tag
            v-for="t in row.tags"
            :key="t"
            size="small"
            effect="plain"
            class="mr-1"
            style="margin-right:4px"
          >{{ t }}</el-tag>
        </template>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>

    <el-table-column prop="alias" label="Alias" min-width="140" />
    <el-table-column prop="version" label="Version" width="110" />

    <el-table-column label="Actions" width="160" fixed="right">
      <template #default="{ row }">
        <el-button text @click="openEdit(row)">
          <el-icon><Edit /></el-icon> Edit
        </el-button>
        <el-button text type="danger" @click="del(row, 'row_id')">
          <el-icon><Delete /></el-icon>
        </el-button>
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
      <el-form-item label="Owner" prop="user_id">
        <el-select
          v-model="form.user_id"
          placeholder="Select owner"
          filterable
          :disabled="editing"
          style="width:100%"
        >
          <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Collection">
        <el-select
          v-model="form.collection_id"
          placeholder="My address book"
          clearable
          filterable
          style="width:100%"
        >
          <el-option label="My address book" :value="0" />
          <el-option
            v-for="c in formCollections"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
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

      <el-form-item label="Platform">
        <el-input v-model="form.platform" placeholder="windows / mac / linux / android / ios" />
      </el-form-item>
      <el-form-item label="OS">
        <el-input v-model="form.os" />
      </el-form-item>
      <el-form-item label="Version">
        <el-input v-model="form.version" />
      </el-form-item>
    </el-form>
  </FormDrawer>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import PlatformIcon from '@/components/PlatformIcon.vue'
import { useResource } from '@/composables/useResource'
import { useUserLookup } from '@/composables/useLookups'
import { copyText } from '@/utils/clipboard'
import * as addressBookApi from '@/api/address_book'
import * as collectionApi from '@/api/address_book_collection'

const { state, query, getList, search, reset, del } = useResource(addressBookApi, {
  user_id: null,
  collection_id: null,
  id: '',
  username: '',
  hostname: '',
})

const { users, load: loadUsers } = useUserLookup()
loadUsers()

const filterCollections = ref([])
async function loadFilterCollections (userId) {
  if (!userId) { filterCollections.value = []; return }
  const res = await collectionApi.list({ user_id: userId, page: 1, page_size: 9999 }).catch(() => false)
  filterCollections.value = res ? (res.data?.list || []) : []
}

function onOwnerFilterChange () {
  query.collection_id = null
  loadFilterCollections(query.user_id)
  search()
}

function onReset () {
  filterCollections.value = []
  reset()
}

function ownerName (id) {
  if (!id) return ''
  return users.value.find(u => u.id === id)?.username || ''
}
function collectionName (id) {
  const all = [...filterCollections.value, ...formCollections.value]
  return all.find(c => c.id === id)?.name || ''
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
  user_id: null,
  collection_id: 0,
  id: '',
  username: '',
  hostname: '',
  alias: '',
  tags: [],
  platform: '',
  os: '',
  version: '',
})

const formCollections = ref([])
async function loadFormCollections (userId) {
  if (!userId) { formCollections.value = []; return }
  const res = await collectionApi.list({ user_id: userId, page: 1, page_size: 9999 }).catch(() => false)
  formCollections.value = res ? (res.data?.list || []) : []
}

watch(() => form.user_id, (uid, prev) => {
  if (uid !== prev) {
    if (!editing.value) form.collection_id = 0
    loadFormCollections(uid)
  }
})

const rules = {
  user_id: [{ required: true, message: 'Owner is required', trigger: 'change' }],
  id: [{ required: true, message: 'Peer ID is required', trigger: 'blur' }],
}

function resetForm () {
  form.row_id = null
  form.user_id = null
  form.collection_id = 0
  form.id = ''
  form.username = ''
  form.hostname = ''
  form.alias = ''
  form.tags = []
  form.platform = ''
  form.os = ''
  form.version = ''
}

function openCreate () {
  editing.value = false
  resetForm()
  formCollections.value = []
  formOpen.value = true
}

function openEdit (row) {
  editing.value = true
  form.row_id = row.row_id
  form.user_id = row.user_id
  form.collection_id = row.collection_id || 0
  form.id = row.id
  form.username = row.username || ''
  form.hostname = row.hostname || ''
  form.alias = row.alias || ''
  form.tags = Array.isArray(row.tags) ? [...row.tags] : []
  form.platform = row.platform || ''
  form.os = row.os || ''
  form.version = row.version || ''
  formOpen.value = true
}

async function submit () {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const payload = {
    user_id: form.user_id,
    collection_id: form.collection_id || 0,
    id: form.id,
    username: form.username,
    hostname: form.hostname,
    alias: form.alias,
    tags: form.tags,
    platform: form.platform,
    os: form.os,
    version: form.version,
  }
  const fn = editing.value
    ? addressBookApi.update({ row_id: form.row_id, ...payload })
    : addressBookApi.create(payload)
  const res = await fn.catch(() => false)
  submitting.value = false
  if (res) {
    ElMessage.success(editing.value ? 'Updated' : 'Created')
    formOpen.value = false
    getList()
  }
}
</script>
