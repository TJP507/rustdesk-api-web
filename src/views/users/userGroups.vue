<template>
  <PageHeader title="User Groups" subtitle="Group user accounts for shared access">
    <el-button type="primary" @click="openCreate">
      <el-icon><Plus /></el-icon> New group
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

    <el-table-column label="Type" width="140">
      <template #default="{ row }">
        <StatusBadge v-if="row.type === 2" kind="success" label="Shared" />
        <StatusBadge v-else kind="info" label="Common" />
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

    <el-table-column label="Actions" width="200" fixed="right">
      <template #default="{ row }">
        <el-button text @click="openEdit(row)">
          <el-icon><Edit /></el-icon> Edit
        </el-button>
        <el-button text type="danger" @click="del(row)">
          <el-icon><Delete /></el-icon> Delete
        </el-button>
      </template>
    </el-table-column>
  </DataTable>

  <FormDrawer v-model="formOpen" :title="form.id ? 'Edit group' : 'New group'" :submitting="saving" @submit="submit">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Name" prop="name">
        <el-input v-model="form.name" placeholder="Group name" />
      </el-form-item>
      <el-form-item label="Type" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio :value="1">Common</el-radio>
          <el-radio :value="2">Shared</el-radio>
        </el-radio-group>
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
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { formatTime } from '@/utils/time'
import * as groupApi from '@/api/group'

const { state, query, getList, search, reset, del } = useResource(groupApi, { name: '' })

const formOpen = ref(false)
const formRef = ref(null)
const saving = ref(false)
const form = reactive({ id: null, name: '', type: 1 })

const rules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
}

function resetForm () {
  form.id = null
  form.name = ''
  form.type = 1
}

function openCreate () {
  resetForm()
  formOpen.value = true
}

function openEdit (row) {
  form.id = row.id
  form.name = row.name
  form.type = row.type ?? 1
  formOpen.value = true
}

async function submit () {
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  const fn = form.id ? groupApi.update : groupApi.create
  const res = await fn({ ...form }).catch(() => false)
  saving.value = false
  if (res) {
    ElMessage.success(form.id ? 'Group updated' : 'Group created')
    formOpen.value = false
    getList()
  }
}
</script>
