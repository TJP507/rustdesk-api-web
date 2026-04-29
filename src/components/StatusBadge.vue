<template>
  <span class="status-badge" :class="kind">
    <span class="dot"></span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
defineProps({
  kind: { type: String, default: 'neutral' }, // success | warning | danger | info | neutral
  label: String,
})
</script>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  border: 1px solid transparent;

  .dot { width: 6px; height: 6px; border-radius: 50%; }

  &.success { background: #ecfdf5; color: #047857; border-color: #a7f3d0;
    .dot { background: #10b981; } }
  &.warning { background: #fffbeb; color: #b45309; border-color: #fde68a;
    .dot { background: #f59e0b; } }
  &.danger { background: #fef2f2; color: #b91c1c; border-color: #fecaca;
    .dot { background: #ef4444; } }
  &.info { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;
    .dot { background: #3b82f6; } }
  &.neutral { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb;
    .dot { background: #9ca3af; } }
}
</style>
