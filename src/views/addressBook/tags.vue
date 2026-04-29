<template>
  <PageHeader title="Tags" subtitle="Colored labels assignable to address-book entries">
    <el-button type="primary" @click="openCreate">
      <el-icon><Plus /></el-icon> New tag
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
      <el-select
        v-model="query.user_id"
        placeholder="Owner"
        clearable
        filterable
        style="width:200px"
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
        <el-option label="My address book" :value="0" />
        <el-option
          v-for="c in filterCollections"
          :key="c.id"
          :label="c.name"
          :value="c.id"
        />
      </el-select>

      <el-input
        v-model="query.name"
        placeholder="Search name"
        clearable
        style="width:200px"
        @change="search"
        @clear="search"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button @click="search">Filter</el-button>
      <el-button @click="onReset">Reset</el-button>
    </template>

    <el-table-column prop="id" label="ID" width="80" />

    <el-table-column label="Owner" min-width="140">
      <template #default="{ row }">
        <el-tag v-if="ownerName(row.user_id)" type="info" effect="plain" size="small">
          {{ ownerName(row.user_id) }}
        </el-tag>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>

    <el-table-column label="Collection" min-width="160">
      <template #default="{ row }">
        <span v-if="row.collection_id">{{ collectionName(row.collection_id) || '—' }}</span>
        <span v-else class="text-muted">My address book</span>
      </template>
    </el-table-column>

    <el-table-column prop="name" label="Name" min-width="160" />

    <el-table-column label="Color" width="100">
      <template #default="{ row }">
        <span class="color-swatch" :style="{ background: flutterToRgba(row.color) }"></span>
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="160" fixed="right">
      <template #default="{ row }">
        <el-button text @click="openEdit(row)">
          <el-icon><Edit /></el-icon> Edit
        </el-button>
        <el-button text type="danger" @click="del(row)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </template>
    </el-table-column>
  </DataTable>

  <FormDrawer
    v-model="formOpen"
    :title="editing ? 'Edit tag' : 'New tag'"
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

      <el-form-item label="Name" prop="name">
        <el-input v-model="form.name" placeholder="Tag name" />
      </el-form-item>

      <el-form-item label="Color" prop="color">
        <el-color-picker v-model="form.color" show-alpha />
      </el-form-item>
    </el-form>
  </FormDrawer>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import { useResource } from '@/composables/useResource'
import { useUserLookup } from '@/composables/useLookups'
import { flutterToRgba, rgbaToFlutter } from '@/utils/color'
import * as tagApi from '@/api/tag'
import * as collectionApi from '@/api/address_book_collection'

const { state, query, getList, search, reset, del } = useResource(tagApi, {
  user_id: null,
  collection_id: null,
  name: '',
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

const formOpen = ref(false)
const editing = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  user_id: null,
  collection_id: 0,
  name: '',
  color: '',
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
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  color: [{ required: true, message: 'Color is required', trigger: 'change' }],
}

function resetForm () {
  form.id = null
  form.user_id = null
  form.collection_id = 0
  form.name = ''
  form.color = ''
}

function openCreate () {
  editing.value = false
  resetForm()
  formCollections.value = []
  formOpen.value = true
}

function openEdit (row) {
  editing.value = true
  form.id = row.id
  form.user_id = row.user_id
  form.collection_id = row.collection_id || 0
  form.name = row.name
  form.color = flutterToRgba(row.color)
  formOpen.value = true
}

async function submit () {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const payload = {
    user_id: form.user_id,
    collection_id: form.collection_id || 0,
    name: form.name,
    color: rgbaToFlutter(form.color),
  }
  const fn = editing.value
    ? tagApi.update({ id: form.id, ...payload })
    : tagApi.create(payload)
  const res = await fn.catch(() => false)
  submitting.value = false
  if (res) {
    ElMessage.success(editing.value ? 'Updated' : 'Created')
    formOpen.value = false
    getList()
  }
}
</script>

<style scoped lang="scss">
.color-swatch {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--rd-border);
  vertical-align: middle;
}
</style>
