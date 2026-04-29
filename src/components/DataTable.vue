<template>
  <div class="data-table">
    <!-- Toolbar: filters on left, actions on right -->
    <div class="toolbar" v-if="$slots.filters || $slots.actions">
      <div class="filters">
        <slot name="filters" />
      </div>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Selection summary bar -->
    <div class="selection-bar" v-if="selectable && selected.length">
      <span><b>{{ selected.length }}</b> selected</span>
      <div class="bulk-actions">
        <slot name="bulk" :selected="selected" :clear="clearSelection" />
      </div>
    </div>

    <!-- Table -->
    <el-table
      :data="data"
      v-loading="loading"
      :border="border"
      :stripe="false"
      :size="size"
      :row-key="rowKey"
      @selection-change="onSelectionChange"
      ref="tableRef"
      class="rd-table"
    >
      <el-table-column v-if="selectable" type="selection" width="44" align="center" />
      <slot />
    </el-table>

    <!-- Pagination -->
    <div class="pager" v-if="total > 0 || showPager">
      <span class="total">{{ total }} {{ total === 1 ? 'result' : 'results' }}</span>
      <el-pagination
        background
        layout="prev, pager, next, sizes, jumper"
        :page-sizes="[10, 20, 50, 100]"
        v-model:page-size="pageSize"
        v-model:current-page="page"
        :total="total"
        @update:page-size="onSize"
        @update:current-page="onPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: Boolean,
  total: { type: Number, default: 0 },
  modelValue: { type: Object, default: () => ({ page: 1, page_size: 20 }) },
  selectable: Boolean,
  rowKey: { type: [String, Function], default: 'id' },
  size: { type: String, default: 'default' },
  border: { type: Boolean, default: false },
  showPager: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'change'])

const page = ref(props.modelValue.page || 1)
const pageSize = ref(props.modelValue.page_size || 20)

watch(() => props.modelValue, (v) => {
  page.value = v.page || 1
  pageSize.value = v.page_size || 20
})

function emitQuery () {
  emit('update:modelValue', { ...props.modelValue, page: page.value, page_size: pageSize.value })
  emit('change')
}
function onPage (v) { page.value = v; emitQuery() }
function onSize (v) { pageSize.value = v; page.value = 1; emitQuery() }

const selected = ref([])
const tableRef = ref(null)
function onSelectionChange (rows) { selected.value = rows }
function clearSelection () { tableRef.value?.clearSelection() }

defineExpose({ clearSelection, selected, tableRef })
</script>

<style scoped lang="scss">
.data-table {
  background: var(--rd-surface);
  border: 1px solid var(--rd-border);
  border-radius: var(--rd-radius);
  overflow: hidden;
  box-shadow: var(--rd-shadow-sm);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--rd-border);
  flex-wrap: wrap;

  .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; flex: 1; min-width: 0; }
  .actions { display: flex; gap: 8px; flex-shrink: 0; }
}

.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--rd-accent-soft);
  border-bottom: 1px solid var(--rd-border);
  font-size: 13px;
  color: var(--rd-text);
  b { color: var(--rd-accent-hover); }
  .bulk-actions { display: flex; gap: 8px; }
}

.rd-table {
  border-radius: 0;
  --el-table-border-color: var(--rd-border);
}
.rd-table :deep(.el-table__cell) {
  border-bottom-color: var(--rd-border) !important;
}

.pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--rd-border);
  background: #fafbfc;
  .total { font-size: 13px; color: var(--rd-muted); font-weight: 500; }
}
</style>
