<template>
  <div class="surface-card status-card">
    <div class="head">
      <div class="title-block">
        <h3>{{ name }}</h3>
        <p class="text-muted text-sm">{{ subtitle }}</p>
      </div>
      <StatusBadge :kind="badgeKind" :label="badgeLabel" />
    </div>
    <div class="endpoint">
      <el-icon><Connection /></el-icon>
      <span class="ep-text">{{ endpoint || '—' }}</span>
    </div>
    <div class="error" v-if="status.state === 'offline' && status.error">
      {{ status.error }}
    </div>
    <div class="actions">
      <el-button size="small" plain :loading="status.state === 'checking'" @click="$emit('refresh')">
        <el-icon><Refresh /></el-icon> Recheck
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'

const props = defineProps({
  name: String,
  subtitle: String,
  endpoint: String,
  status: { type: Object, default: () => ({ state: 'unknown' }) },
})
defineEmits(['refresh'])

const badgeKind = computed(() => {
  switch (props.status.state) {
    case 'online': return 'success'
    case 'offline': return 'danger'
    case 'checking': return 'info'
    default: return 'neutral'
  }
})
const badgeLabel = computed(() => {
  switch (props.status.state) {
    case 'online': return 'Online'
    case 'offline': return 'Offline'
    case 'checking': return 'Checking…'
    default: return 'Unknown'
  }
})
</script>

<style scoped lang="scss">
.status-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  h3 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  p { margin: 4px 0 0; }
}
.endpoint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--rd-text-soft);
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: var(--rd-radius-sm);
  border: 1px solid var(--rd-border);
  .ep-text { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
}
.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  padding: 8px 12px;
  border-radius: var(--rd-radius-sm);
  font-size: 12.5px;
}
.actions { display: flex; justify-content: flex-end; }
</style>
