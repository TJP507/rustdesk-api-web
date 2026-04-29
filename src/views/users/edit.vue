<template>
  <PageHeader :title="isEdit ? 'Edit user' : 'New user'" :subtitle="isEdit ? form.username : 'Create a new user account'">
    <el-button @click="back">Cancel</el-button>
    <el-button type="primary" :loading="saving" @click="save">Save</el-button>
  </PageHeader>

  <div class="surface-card" style="max-width:600px">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" v-loading="loading">
      <el-form-item label="Username" prop="username">
        <el-input v-model="form.username" :disabled="isEdit" placeholder="Username" />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input v-model="form.email" placeholder="user@example.com" />
      </el-form-item>

      <el-form-item v-if="!isEdit" label="Password" prop="password">
        <el-input v-model="form.password" type="password" show-password placeholder="At least 6 characters" />
      </el-form-item>

      <el-form-item label="Nickname" prop="nickname">
        <el-input v-model="form.nickname" placeholder="Display name" />
      </el-form-item>

      <el-form-item label="Group" prop="group_id">
        <el-select v-model="form.group_id" placeholder="Select group" clearable style="width:100%">
          <el-option v-for="g in groups" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Status" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">Active</el-radio>
          <el-radio :value="2">Disabled</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="Remark" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="Optional notes" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { useUserGroupLookup } from '@/composables/useLookups'
import * as userApi from '@/api/user'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const formRef = ref(null)
const saving = ref(false)
const loading = ref(false)

const form = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  nickname: '',
  group_id: null,
  status: 1,
  remark: '',
})

const rules = {
  username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
  password: [
    { required: true, message: 'Password is required', trigger: 'blur' },
    { min: 6, message: 'At least 6 characters', trigger: 'blur' },
  ],
}

const { groups, load: loadGroups } = useUserGroupLookup()
loadGroups()

onMounted(async () => {
  if (!isEdit.value) return
  loading.value = true
  const res = await userApi.detail(route.params.id).catch(() => false)
  loading.value = false
  if (res) {
    const u = res.data || res
    form.id = u.id
    form.username = u.username || ''
    form.email = u.email || ''
    form.nickname = u.nickname || ''
    form.group_id = u.group_id || null
    form.status = u.status ?? 1
    form.remark = u.remark || ''
  }
})

function back () { router.back() }

async function save () {
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  const payload = { ...form }
  if (isEdit.value) delete payload.password
  const fn = isEdit.value ? userApi.update : userApi.create
  const res = await fn(payload).catch(() => false)
  saving.value = false
  if (res) {
    ElMessage.success(isEdit.value ? 'User updated' : 'User created')
    router.push('/users')
  }
}
</script>
