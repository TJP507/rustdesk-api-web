<template>
  <PageHeader title="OAuth Providers" subtitle="Configure SSO via external identity providers">
    <el-button type="primary" @click="openCreate">
      <el-icon><Plus /></el-icon> New provider
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
    <el-table-column prop="id" label="ID" width="80" />

    <el-table-column label="Display name" min-width="160">
      <template #default="{ row }">
        <div class="font-medium">{{ row.name || '—' }}</div>
      </template>
    </el-table-column>

    <el-table-column label="Type" width="130">
      <template #default="{ row }">
        <StatusBadge kind="info" :label="row.op || '—'" />
      </template>
    </el-table-column>

    <el-table-column label="Issuer" min-width="240">
      <template #default="{ row }">
        <span
          v-if="row.issuer"
          class="copyable truncate"
          :title="row.issuer"
          @click="copyText(row.issuer)"
        >{{ row.issuer }}</span>
        <span v-else class="text-muted">—</span>
      </template>
    </el-table-column>

    <el-table-column label="Auto-register" width="130">
      <template #default="{ row }">
        <StatusBadge :kind="row.auto_register ? 'success' : 'neutral'" :label="row.auto_register ? 'Yes' : 'No'" />
      </template>
    </el-table-column>

    <el-table-column label="PKCE" width="100">
      <template #default="{ row }">
        <StatusBadge :kind="row.pkce_enable ? 'success' : 'neutral'" :label="row.pkce_enable ? 'Yes' : 'No'" />
      </template>
    </el-table-column>

    <el-table-column label="Created" width="170">
      <template #default="{ row }">
        <span class="text-sm">{{ row.created_at ? formatTime(row.created_at) : '—' }}</span>
      </template>
    </el-table-column>

    <el-table-column label="Actions" width="180" fixed="right">
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

  <FormDrawer
    v-model="formOpen"
    :title="form.id ? 'Edit provider' : 'New provider'"
    :submitting="saving"
    :size="560"
    @submit="submit"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Display name" prop="name">
        <el-input v-model="form.name" placeholder="Shown on the sign-in page" />
      </el-form-item>

      <el-form-item label="Type" prop="op">
        <el-select v-model="form.op" placeholder="Select provider type" class="w-full">
          <el-option v-for="t in providerTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>

      <el-form-item label="Issuer URL" prop="issuer">
        <el-input v-model="form.issuer" placeholder="https://accounts.example.com" />
      </el-form-item>

      <el-form-item label="Client ID" prop="client_id">
        <el-input v-model="form.client_id" />
      </el-form-item>

      <el-form-item label="Client secret" prop="client_secret">
        <el-input v-model="form.client_secret" type="password" show-password />
      </el-form-item>

      <el-form-item label="Scopes" prop="scopes">
        <el-input v-model="form.scopes" placeholder="openid email profile" />
        <div class="text-xs text-muted mt-2">Comma- or space-separated.</div>
      </el-form-item>

      <el-form-item label="Redirect URL">
        <div class="flex gap-2 w-full">
          <el-input :model-value="redirectUrl" readonly />
          <el-button @click="copyText(redirectUrl)">
            <el-icon><CopyDocument /></el-icon> Copy
          </el-button>
        </div>
        <div class="text-xs text-muted mt-2">Register this callback URL with your identity provider.</div>
      </el-form-item>

      <div class="grid-2">
        <el-form-item label="Auto-register">
          <el-switch v-model="form.auto_register" />
          <div class="text-xs text-muted mt-2">Create a local account on first sign-in.</div>
        </el-form-item>

        <el-form-item label="PKCE enabled">
          <el-switch v-model="form.pkce_enable" />
          <div class="text-xs text-muted mt-2">Recommended for public clients.</div>
        </el-form-item>
      </div>

      <el-form-item label="PKCE method" prop="pkce_method">
        <el-select v-model="form.pkce_method" :disabled="!form.pkce_enable" class="w-full">
          <el-option label="S256" value="S256" />
          <el-option label="plain" value="plain" />
        </el-select>
      </el-form-item>
    </el-form>
  </FormDrawer>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import { copyText } from '@/utils/clipboard'
import { formatTime } from '@/utils/time'
import * as oauthApi from '@/api/oauth'

const { state, query, getList, search, reset, del } = useResource(oauthApi, {})

const providerTypes = ['oidc', 'google', 'github', 'gitlab', 'microsoft', 'okta', 'webauth']

const formOpen = ref(false)
const formRef = ref(null)
const saving = ref(false)
const form = reactive({
  id: null,
  name: '',
  op: 'oidc',
  issuer: '',
  client_id: '',
  client_secret: '',
  scopes: 'openid email profile',
  auto_register: false,
  pkce_enable: false,
  pkce_method: 'S256',
})

const rules = {
  name: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
  op: [{ required: true, message: 'Provider type is required', trigger: 'change' }],
  client_id: [{ required: true, message: 'Client ID is required', trigger: 'blur' }],
  client_secret: [{ required: true, message: 'Client secret is required', trigger: 'blur' }],
  issuer: [{
    validator: (_rule, value, cb) => {
      if (form.op === 'oidc' && !value) return cb(new Error('Issuer URL is required for OIDC'))
      cb()
    },
    trigger: 'blur',
  }],
}

const redirectUrl = computed(() => {
  const origin = window.location.origin
  return `${origin}/api/oidc/callback`
})

function resetForm () {
  form.id = null
  form.name = ''
  form.op = 'oidc'
  form.issuer = ''
  form.client_id = ''
  form.client_secret = ''
  form.scopes = 'openid email profile'
  form.auto_register = false
  form.pkce_enable = false
  form.pkce_method = 'S256'
}

function openCreate () {
  resetForm()
  formOpen.value = true
}

function openEdit (row) {
  form.id = row.id
  form.name = row.name || ''
  form.op = row.op || 'oidc'
  form.issuer = row.issuer || ''
  form.client_id = row.client_id || ''
  form.client_secret = row.client_secret || ''
  form.scopes = row.scopes || 'openid email profile'
  form.auto_register = !!row.auto_register
  form.pkce_enable = !!row.pkce_enable
  form.pkce_method = row.pkce_method || 'S256'
  formOpen.value = true
}

async function submit () {
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  const fn = form.id ? oauthApi.update : oauthApi.create
  const res = await fn({ ...form }).catch(() => false)
  saving.value = false
  if (res) {
    ElMessage.success(form.id ? 'Provider updated' : 'Provider created')
    formOpen.value = false
    getList()
  }
}
</script>

<style scoped lang="scss">
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.copyable {
  cursor: pointer;
  color: var(--rd-text);
  display: inline-block;
  max-width: 100%;
  &:hover { color: var(--rd-accent-hover, #4338ca); }
}
</style>
