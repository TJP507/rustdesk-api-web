<template>
  <DataTable v-model="query" :data="state.list" :total="state.total" :loading="state.loading" row-key="id" @change="getList">
    <template #actions>
      <el-button type="primary" @click="openNew">
        <el-icon><Plus /></el-icon> New command
      </el-button>
    </template>

    <el-table-column prop="cmd" label="Command" min-width="160">
      <template #default="{ row }">
        <code class="cmd-pill">{{ row.cmd }}<span v-if="row.option" class="opt"> {{ row.option }}</span></code>
      </template>
    </el-table-column>
    <el-table-column prop="alias" label="Alias" width="100" />
    <el-table-column label="Target" width="120">
      <template #default="{ row }">
        <StatusBadge :kind="row.target === '21115' ? 'info' : 'success'">
          {{ row.target === '21115' ? 'hbbs' : row.target === '21117' ? 'hbbr' : row.target }}
        </StatusBadge>
      </template>
    </el-table-column>
    <el-table-column prop="explain" label="Description" min-width="220" show-overflow-tooltip />
    <el-table-column label="Actions" width="220" align="right">
      <template #default="{ row }">
        <el-button size="small" type="primary" @click="run(row)">
          <el-icon><VideoPlay /></el-icon> Run
        </el-button>
        <el-button size="small" text @click="openEdit(row)" v-if="row.id">
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button size="small" text type="danger" @click="del(row)" v-if="row.id">
          <el-icon><Delete /></el-icon>
        </el-button>
      </template>
    </el-table-column>
  </DataTable>

  <FormDrawer v-model="formOpen" :title="form.id ? 'Edit command' : 'New command'" @submit="submit">
    <el-form :model="form" label-position="top" ref="formRef">
      <el-form-item label="Command" prop="cmd" required>
        <el-input v-model="form.cmd" placeholder="e.g. relay-servers" />
      </el-form-item>
      <el-form-item label="Alias">
        <el-input v-model="form.alias" placeholder="e.g. rs" />
      </el-form-item>
      <el-form-item label="Default option">
        <el-input v-model="form.option" placeholder="e.g. y" />
      </el-form-item>
      <el-form-item label="Description">
        <el-input v-model="form.explain" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="Target" required>
        <el-radio-group v-model="form.target">
          <el-radio value="21115">hbbs (ID server)</el-radio>
          <el-radio value="21117">hbbr (Relay server)</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </FormDrawer>
</template>

<script setup>
import { reactive, ref, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DataTable from '@/components/DataTable.vue'
import FormDrawer from '@/components/FormDrawer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useResource } from '@/composables/useResource'
import * as api from '@/api/rustdesk'

const { state, query, getList, del } = useResource(api, {})

const formOpen = ref(false)
const form = reactive({ id: 0, cmd: '', alias: '', option: '', explain: '', target: '21115' })

function openNew () {
  Object.assign(form, { id: 0, cmd: '', alias: '', option: '', explain: '', target: '21115' })
  formOpen.value = true
}
function openEdit (row) {
  Object.assign(form, { id: row.id, cmd: row.cmd, alias: row.alias, option: row.option, explain: row.explain, target: row.target })
  formOpen.value = true
}

async function submit () {
  if (!form.cmd.trim()) return ElMessage.warning('Command is required')
  const res = (form.id ? api.update : api.create)(form).catch(() => false)
  const r = await res
  if (r) {
    ElMessage.success('Saved')
    formOpen.value = false
    getList()
  }
}

async function run (row) {
  try {
    const res = await api.sendCmd({ cmd: row.cmd, target: row.target, option: row.option || '' })
    const text = res?.data ?? ''
    ElMessageBox.alert(
      h('pre', { style: 'margin:0;white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;max-height:380px;overflow:auto;' }, String(text || '(no output)')),
      `Output: ${row.cmd}`,
      { confirmButtonText: 'Close', customClass: 'cmd-output-dialog' },
    )
  } catch (e) {
    // interceptor already toasted
  }
}
</script>

<style scoped lang="scss">
.cmd-pill {
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: var(--rd-accent-hover);
  .opt { color: var(--rd-text-soft); margin-left: 4px; font-weight: 400; }
}
</style>
