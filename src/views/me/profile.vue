<template>
  <PageHeader title="Profile" subtitle="Your account details" />

  <div class="surface-card">
    <div class="profile-head">
      <div class="avatar-circle">{{ initials }}</div>
      <div class="profile-info">
        <div class="text-xl font-semibold">{{ user.nickname || user.username || '—' }}</div>
        <div class="text-muted text-sm">{{ user.email || 'No email on file' }}</div>
      </div>
      <div class="profile-actions">
        <el-button @click="pwdOpen = true">
          <el-icon><Lock /></el-icon> Change password
        </el-button>
        <el-button type="primary" @click="openEdit">
          <el-icon><Edit /></el-icon> Edit profile
        </el-button>
      </div>
    </div>

    <el-divider />

    <div class="detail-grid">
      <div class="detail-row">
        <div class="detail-label">Username</div>
        <div class="detail-value">{{ user.username || '—' }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Email</div>
        <div class="detail-value">{{ user.email || '—' }}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Nickname</div>
        <div class="detail-value">{{ user.nickname || '—' }}</div>
      </div>
      <div class="detail-row" v-if="groupName">
        <div class="detail-label">Group</div>
        <div class="detail-value">
          <el-tag size="small" type="info" effect="plain">{{ groupName }}</el-tag>
        </div>
      </div>
      <div class="detail-row" v-if="user.role">
        <div class="detail-label">Role</div>
        <div class="detail-value">{{ user.role }}</div>
      </div>
    </div>
  </div>

  <div class="surface-card mt-4" v-if="appStore.setting.hello">
    <div class="card-title">Welcome message</div>
    <div class="markdown-body" v-html="renderedHello"></div>
  </div>

  <div class="surface-card mt-4">
    <div class="card-title">Linked accounts</div>
    <el-table :data="oauthList" v-loading="oauthLoading" class="rd-table" stripe>
      <el-table-column label="Provider" min-width="200">
        <template #default="{ row }">
          <span class="font-medium">{{ row.name || row.op }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="160">
        <template #default="{ row }">
          <StatusBadge :kind="isLinked(row) ? 'success' : 'neutral'"
                       :label="isLinked(row) ? 'Linked' : 'Not linked'" />
        </template>
      </el-table-column>
      <el-table-column label="Action" width="160">
        <template #default="{ row }">
          <el-button v-if="isLinked(row)" type="danger" size="small" text @click="unlink(row)">
            Unlink
          </el-button>
          <el-button v-else type="primary" size="small" @click="link(row)">
            Link
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <span class="text-muted">No OIDC providers configured</span>
      </template>
    </el-table>
  </div>

  <FormDrawer v-model="editOpen" title="Edit profile" :submitting="editSubmitting" @submit="submitEdit">
    <el-form :model="editForm" label-position="top">
      <el-form-item label="Nickname">
        <el-input v-model="editForm.nickname" placeholder="Display name" />
      </el-form-item>
    </el-form>
  </FormDrawer>

  <ChangePwdDialog v-model="pwdOpen" />
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import PageHeader from '@/components/PageHeader.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ChangePwdDialog from '@/components/ChangePwdDialog.vue'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { myOauth, update as updateUser } from '@/api/user'
import * as oauth from '@/api/oauth'
import { setCode } from '@/utils/auth'

const user = useUserStore()
const appStore = useAppStore()

const initials = computed(() => {
  const src = (user.nickname || user.username || 'U').trim()
  const parts = src.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
})

const groupName = computed(() => user.group_name || user.group?.name || '')

const renderedHello = computed(() => marked(appStore.setting.hello || ''))

const pwdOpen = ref(false)

const editOpen = ref(false)
const editSubmitting = ref(false)
const editForm = reactive({ nickname: '' })

function openEdit () {
  editForm.nickname = user.nickname || ''
  editOpen.value = true
}

async function submitEdit () {
  editSubmitting.value = true
  const res = await updateUser({ id: user.id, nickname: editForm.nickname }).catch(() => false)
  editSubmitting.value = false
  if (res) {
    ElMessage.success('Profile updated')
    user.$patch({ nickname: editForm.nickname })
    editOpen.value = false
  }
}

const oauthList = ref([])
const oauthLoading = ref(false)

async function loadOauth () {
  oauthLoading.value = true
  const res = await myOauth().catch(() => false)
  oauthLoading.value = false
  if (res) {
    const data = res.data
    oauthList.value = Array.isArray(data) ? data : (data?.list || [])
  }
}

function isLinked (row) {
  return row.status === 1 || row.bound === true || row.linked === true || !!row.user_id
}

async function link (row) {
  const op = row.op || row.name
  const res = await oauth.bind({ op }).catch(() => false)
  if (!res) return
  const { url, code } = res.data || {}
  if (code) setCode(code)
  if (url) window.location.href = url
}

async function unlink (row) {
  const op = row.op || row.name
  const ok = await ElMessageBox.confirm(`Unlink ${op}?`, 'Unlink provider', {
    confirmButtonText: 'Unlink',
    cancelButtonText: 'Cancel',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  }).catch(() => false)
  if (!ok) return
  const res = await oauth.unbind({ op }).catch(() => false)
  if (res) {
    ElMessage.success('Unlinked')
    loadOauth()
  }
}

onMounted(loadOauth)
</script>

<style scoped lang="scss">
.profile-head {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.profile-info { flex: 1; min-width: 0; }
.profile-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px 24px;
}
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.detail-label {
  font-size: 12px;
  color: var(--rd-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.detail-value { font-size: 14px; color: var(--rd-text); }

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--rd-text);
  margin-bottom: 12px;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  color: var(--rd-text);
  :deep(h1), :deep(h2), :deep(h3) { margin: 0.6em 0 0.3em; font-weight: 600; }
  :deep(p) { margin: 0.4em 0; }
  :deep(a) { color: var(--rd-accent, #6366f1); }
  :deep(code) {
    background: var(--rd-bg);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }
}
</style>
