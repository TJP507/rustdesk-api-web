<template>
  <div class="surface-card">
    <div class="card-head">
      <div>
        <h3>Install script targets</h3>
        <p class="text-muted text-sm">
          Override the addresses used in generated install scripts.
          The API itself keeps using its real configuration —
          these only affect the <code>RustDesk2.toml</code> the script writes on the new client.
          Leave a field blank to use the API's value.
        </p>
      </div>
    </div>

    <el-form label-position="top" class="form">
      <div class="grid">
        <el-form-item>
          <template #label>
            <span class="lbl">ID server <span class="lbl-sub">hbbs · port 21116</span></span>
          </template>
          <el-input v-model="form.id_server" :placeholder="effective.id_server || 'rd.example.com:21116'" clearable>
            <template #prefix><el-icon><Connection /></el-icon></template>
          </el-input>
          <div class="hint" v-if="!form.id_server && effective.id_server">
            Using API value: <code>{{ effective.id_server }}</code>
          </div>
        </el-form-item>

        <el-form-item>
          <template #label>
            <span class="lbl">Relay server <span class="lbl-sub">hbbr · port 21117</span></span>
          </template>
          <el-input v-model="form.relay_server" :placeholder="effective.relay_server || 'rd.example.com:21117'" clearable>
            <template #prefix><el-icon><Share /></el-icon></template>
          </el-input>
          <div class="hint" v-if="!form.relay_server && effective.relay_server">
            Using API value: <code>{{ effective.relay_server }}</code>
          </div>
        </el-form-item>

        <el-form-item>
          <template #label>
            <span class="lbl">API server <span class="lbl-sub">scheme + host</span></span>
          </template>
          <el-input v-model="form.api_server" :placeholder="effective.api_server || 'https://rdm.example.com'" clearable>
            <template #prefix><el-icon><Link /></el-icon></template>
          </el-input>
          <div class="hint" v-if="!form.api_server && effective.api_server">
            Using API value: <code>{{ effective.api_server }}</code>
          </div>
        </el-form-item>

        <el-form-item label="Server key (read-only)">
          <el-input :model-value="key" readonly>
            <template #append>
              <el-button @click="copyKey"><el-icon><CopyDocument /></el-icon></el-button>
            </template>
          </el-input>
          <div class="hint">Pulled from the API. Newly-installed clients need this to authenticate.</div>
        </el-form-item>
      </div>

      <div class="actions">
        <el-button @click="resetForm" :disabled="!hasOverrides">Clear overrides</el-button>
        <el-button type="primary" @click="save">Save</el-button>
      </div>
    </el-form>

    <div class="surface-card preview" v-if="resolved.id_server">
      <div class="preview-head">
        <h4>Preview</h4>
        <p class="text-muted text-sm">What the generated script will write to the client.</p>
      </div>
      <pre class="output">[options]
custom-rendezvous-server = '{{ resolved.id_server }}'
relay-server = '{{ resolved.relay_server }}'
api-server = '{{ resolved.api_server }}'
key = '{{ resolved.key }}'</pre>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/store/app'
import { loadOverrides, saveOverrides, resolveInstallTargets } from '@/utils/installConfig'
import { copyText } from '@/utils/clipboard'

const appStore = useAppStore()
const form = reactive(loadOverrides())

const effective = computed(() => appStore.setting.rustdeskConfig || {})
const key = computed(() => effective.value.key || '')

const resolved = computed(() => {
  const merged = {
    id_server: form.id_server.trim() || effective.value.id_server || '',
    relay_server: form.relay_server.trim() || effective.value.relay_server || '',
    api_server: form.api_server.trim() || effective.value.api_server || '',
    key: effective.value.key || '',
  }
  return merged
})

const hasOverrides = computed(() =>
  Boolean(form.id_server || form.relay_server || form.api_server),
)

function save () {
  saveOverrides(form)
  ElMessage.success('Install targets saved')
}
function resetForm () {
  form.id_server = ''
  form.relay_server = ''
  form.api_server = ''
  saveOverrides(form)
  ElMessage.success('Overrides cleared — using API values')
}
async function copyKey () {
  if (key.value) await copyText(key.value)
}

onMounted(() => {
  if (!effective.value.id_server) appStore.loadRustdeskConfig()
})
</script>

<style scoped lang="scss">
.card-head {
  margin-bottom: 20px;
  h3 { margin: 0; font-size: 15px; font-weight: 600; }
  p { margin: 6px 0 0; max-width: 720px; }
  code {
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12.5px;
  }
}

.form {
  max-width: 760px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.lbl {
  font-weight: 500;
  font-size: 13px;
  color: var(--rd-text);
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}
.lbl-sub {
  font-weight: 400;
  font-size: 11.5px;
  color: var(--rd-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hint {
  font-size: 12px;
  color: var(--rd-muted);
  margin-top: 4px;
  code {
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
  }
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.preview {
  margin-top: 24px;
  background: #fafbfc;
}
.preview-head {
  margin-bottom: 12px;
  h4 { margin: 0; font-size: 13.5px; font-weight: 600; }
  p { margin: 4px 0 0; }
}
.output {
  margin: 0;
  background: #ffffff;
  border: 1px solid var(--rd-border);
  border-radius: var(--rd-radius-sm);
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  white-space: pre-wrap;
  color: var(--rd-text-soft);
}
</style>
