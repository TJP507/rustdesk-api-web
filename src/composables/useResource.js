import { reactive, watch, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * Standard list+CRUD resource composable.
 * api: { list, create?, update?, remove?, batchRemove? }
 * defaultFilters: object — initial query
 */
export function useResource (api, defaultFilters = {}) {
  const state = reactive({
    list: [],
    total: 0,
    loading: false,
  })

  const query = reactive({
    page: 1,
    page_size: 20,
    ...defaultFilters,
  })

  async function getList () {
    state.loading = true
    const res = await api.list(query).catch(() => false)
    state.loading = false
    if (res) {
      state.list = res.data?.list || []
      state.total = res.data?.total || 0
    }
  }

  function search () {
    if (query.page === 1) getList()
    else query.page = 1
  }

  function reset () {
    Object.keys(defaultFilters).forEach(k => { query[k] = defaultFilters[k] })
    query.page = 1
    getList()
  }

  async function del (row, idKey = 'id') {
    const ok = await ElMessageBox.confirm('Delete this item? This cannot be undone.', 'Delete', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    }).catch(() => false)
    if (!ok) return
    const res = await api.remove({ [idKey]: row[idKey] }).catch(() => false)
    if (res) {
      ElMessage.success('Deleted')
      getList()
    }
  }

  async function batchDelete (rows, idKey = 'id', payloadKey = 'ids') {
    if (!rows.length) return ElMessage.warning('Select rows first')
    const ok = await ElMessageBox.confirm(`Delete ${rows.length} item${rows.length > 1 ? 's' : ''}?`, 'Bulk delete', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    }).catch(() => false)
    if (!ok) return
    const res = await api.batchRemove({ [payloadKey]: rows.map(r => r[idKey]) }).catch(() => false)
    if (res) {
      ElMessage.success('Deleted')
      getList()
    }
  }

  watch(() => query.page, getList)

  onMounted(getList)
  onActivated(getList)

  return { state, query, getList, search, reset, del, batchDelete }
}
