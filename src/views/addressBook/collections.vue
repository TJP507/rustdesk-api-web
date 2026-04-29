<template>
  <PageHeader title="Collections" subtitle="Named groups of address-book entries">
    <el-button type="primary" @click="openCreate">
      <el-icon><Plus /></el-icon> New collection
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
        @change="search"
        @clear="search"
      >
        <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id" />
      </el-select>
      <el-input
        v-model="query.name"
        placeholder="Search name"
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
    <el-table-column prop="name" label="Name" min-width="200" />

    <el-table-column label="Owner" min-width="160">
      <template #default="{ row }">
        <el-tag v-if="ownerName(row.user_id)" type="info" effect="plain" size="small">
          {{ ownerName(row.user_id) }}
        </el-tag>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>

    <el-table-column label="Created" width="170">
      <template #default="{ row }">
        <span class="text-sm">{{ row.created_at ? formatTime(row.created_at) : '—' }}</span>
      </template>
    </el-table-column>

    <el-table-column label="Updated" width="170">
      <template #default="{ row }">
        <span class="text-sm">{{ row.updated_at ? formatTime(row.updated_at) : '—' }}</span>
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
    :title="editing ? 'Edit collection' : 'New collection'"
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
      <el-form-item label="Name" prop="name">
        <el-input v-model="form.name" placeholder="Collection name" />
      </el-form-item>
    </el-form>
  </FormDrawer>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import { useResource } from '@/composables/useResource'
import { useUserLookup } from '@/composables/useLookups'
import { formatTime } from '@/utils/time'
import * as collectionApi from '@/api/address_book_collection'

const { state, query, getList, search, reset, del } = useResource(collectionApi, {
  user_id: null,
  name: '',
})

const { users, load: loadUsers } = useUserLookup()
loadUsers()

function ownerName (id) {
  if (!id) return ''
  return users.value.find(u => u.id === id)?.username || ''
}

const formOpen = ref(false)
const editing = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({ id: null, user_id: null, name: '' })

const rules = {
  user_id: [{ required: true, message: 'Owner is required', trigger: 'change' }],
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
}

function resetForm () {
  form.id = null
  form.user_id = null
  form.name = ''
}

function openCreate () {
  editing.value = false
  resetForm()
  formOpen.value = true
}

function openEdit (row) {
  editing.value = true
  form.id = row.id
  form.user_id = row.user_id
  form.name = row.name
  formOpen.value = true
}

async function submit () {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const fn = editing.value
    ? collectionApi.update({ id: form.id, user_id: form.user_id, name: form.name })
    : collectionApi.create({ user_id: form.user_id, name: form.name })
  const res = await fn.catch(() => false)
  submitting.value = false
  if (res) {
    ElMessage.success(editing.value ? 'Updated' : 'Created')
    formOpen.value = false
    getList()
  }
}
</script>
