<template>
  <span class="platform" :title="raw">
    <svg v-if="kind === 'windows'" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2.4l6.4-.9v6.3H0V2.4zm7.2-1l8.8-1.2V8H7.2V1.4zM0 8.6h6.4v6.3L0 14V8.6zm7.2 0H16v7.2L7.2 14.6V8.6z"/></svg>
    <svg v-else-if="kind === 'mac'" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.18 8.43c-.01-1.7.76-2.99 2.32-3.94-.87-1.25-2.19-1.94-3.93-2.07-1.65-.13-3.45.96-4.11.96-.69 0-2.29-.92-3.55-.9-1.85.03-3.57 1.06-4.51 2.7C-1 8.94.21 13.13 1.91 15.42c.86 1.16 1.86 2.46 3.18 2.4 1.27-.05 1.75-.82 3.28-.82 1.52 0 1.95.82 3.28.79 1.36-.02 2.22-1.16 3.04-2.34a10.4 10.4 0 0 0 1.39-2.83c-3.04-1.16-3.6-4.21-3.9-4.19zM8.84 1.4c.71-.83.94-1.84.85-2.4-.74.04-1.65.5-2.21 1.16-.5.59-.97 1.59-.85 2.43.84.07 1.5-.42 2.21-1.19z"/></svg>
    <svg v-else-if="kind === 'linux'" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C4.13 0 1 3.13 1 7c0 1.34.38 2.6 1.04 3.66L1 16l5.34-1.04C7.4 15.62 8.66 16 10 16c3.87 0 7-3.13 7-7s-3.13-7-7-7zm0 12.5c-2.49 0-4.5-2.01-4.5-4.5S5.51 3.5 8 3.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/></svg>
    <svg v-else-if="kind === 'android'" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3.74 4.24a.5.5 0 0 0-.74.43v6.66c0 .28.22.5.5.5h.5a.5.5 0 0 0 .5-.5V4.67a.5.5 0 0 0-.76-.43zm8.52 0a.5.5 0 0 0-.74.43v6.66c0 .28.22.5.5.5h.5a.5.5 0 0 0 .5-.5V4.67a.5.5 0 0 0-.76-.43zM5 5v7.5a.5.5 0 0 0 .5.5h1v2.5a.5.5 0 0 0 1 0V13h2v2.5a.5.5 0 0 0 1 0V13h1a.5.5 0 0 0 .5-.5V5H5zm6.05-1H4.95C5 2.66 6 1.5 7.5 1.16l-.4-.7a.2.2 0 0 1 .35-.2l.45.78a4 4 0 0 1 1.7 0l.45-.78a.2.2 0 0 1 .35.2l-.4.7c1.5.34 2.5 1.5 2.55 2.84zM7 3a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm3 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/></svg>
    <svg v-else-if="kind === 'ios'" width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.18 8.43c-.01-1.7.76-2.99 2.32-3.94-.87-1.25-2.19-1.94-3.93-2.07-1.65-.13-3.45.96-4.11.96-.69 0-2.29-.92-3.55-.9-1.85.03-3.57 1.06-4.51 2.7-.7 1.21-.32 4.05.66 5.6.49.78 1.07 1.66 1.83 1.62.74-.03 1.02-.48 1.92-.48s1.13.48 1.91.46c.79-.01 1.29-.78 1.78-1.56.4-.6.58-1.18.86-1.79-1.78-.68-2.18-2.4-2.18-2.6z"/></svg>
    <el-icon v-else><Monitor /></el-icon>
    <span class="name">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  raw: { type: String, default: '' },
})

const kind = computed(() => {
  const s = (props.raw || '').toLowerCase()
  if (/win/.test(s)) return 'windows'
  if (/mac|darwin|osx/.test(s)) return 'mac'
  if (/android/.test(s)) return 'android'
  if (/ios|iphone|ipad/.test(s)) return 'ios'
  if (/linux|ubuntu|debian|fedora|arch/.test(s)) return 'linux'
  return 'unknown'
})

const label = computed(() => {
  switch (kind.value) {
    case 'windows': return 'Windows'
    case 'mac': return 'macOS'
    case 'android': return 'Android'
    case 'ios': return 'iOS'
    case 'linux': return 'Linux'
    default: return props.raw || '—'
  }
})
</script>

<style scoped lang="scss">
.platform {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--rd-text-soft);
  svg { color: var(--rd-muted); }
  .name { font-weight: 500; }
}
</style>
