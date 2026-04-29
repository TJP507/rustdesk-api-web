<template>
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size"
    :close-on-click-modal="false"
    direction="rtl"
    class="rd-drawer"
  >
    <div class="drawer-body">
      <slot />
    </div>
    <template #footer>
      <div class="drawer-footer">
        <slot name="footer">
          <el-button @click="visible = false">Cancel</el-button>
          <el-button type="primary" :loading="submitting" @click="$emit('submit')">{{ submitLabel }}</el-button>
        </slot>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Edit' },
  size: { type: [String, Number], default: 480 },
  submitting: Boolean,
  submitLabel: { type: String, default: 'Save' },
})
const emit = defineEmits(['update:modelValue', 'submit'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})
</script>

<style scoped lang="scss">
.drawer-body {
  padding: 20px 24px 24px;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--rd-border);
  background: #fafbfc;
}
</style>

<style lang="scss">
.rd-drawer .el-drawer__header {
  margin: 0;
  padding: 16px 24px;
  border-bottom: 1px solid var(--rd-border);
  font-weight: 600;
  font-size: 16px;
  color: var(--rd-text);
}
.rd-drawer .el-drawer__body { padding: 0; }
.rd-drawer .el-drawer__footer { padding: 0; }
</style>
