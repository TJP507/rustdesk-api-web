import { ref } from 'vue'
import { list as userList } from '@/api/user'
import { list as deviceGroupList } from '@/api/device_group'
import { list as userGroupList } from '@/api/group'

export function useUserLookup () {
  const users = ref([])
  async function load () {
    const res = await userList({ page: 1, page_size: 9999 }).catch(() => false)
    if (res) users.value = res.data?.list || []
  }
  return { users, load }
}

export function useDeviceGroupLookup () {
  const groups = ref([])
  async function load () {
    const res = await deviceGroupList({ page: 1, page_size: 9999 }).catch(() => false)
    if (res) groups.value = res.data?.list || []
  }
  return { groups, load }
}

export function useUserGroupLookup () {
  const groups = ref([])
  async function load () {
    const res = await userGroupList({ page: 1, page_size: 9999 }).catch(() => false)
    if (res) groups.value = res.data?.list || []
  }
  return { groups, load }
}
