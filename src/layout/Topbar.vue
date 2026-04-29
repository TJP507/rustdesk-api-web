<template>
  <header class="topbar">
    <div class="left">
      <h1 class="title">{{ title }}</h1>
      <div class="crumb" v-if="parent">{{ parent }} / {{ title }}</div>
    </div>
    <div class="right">
      <el-tooltip content="Refresh">
        <button class="icon-btn" @click="reload"><el-icon><Refresh /></el-icon></button>
      </el-tooltip>
      <el-dropdown trigger="click" @command="onUserCmd">
        <button class="user-pill">
          <span class="avatar">{{ initial }}</span>
          <span class="user-name">{{ user.username || 'User' }}</span>
          <el-icon class="caret"><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile"><el-icon><User /></el-icon>Profile</el-dropdown-item>
            <el-dropdown-item command="password"><el-icon><Lock /></el-icon>Change password</el-dropdown-item>
            <el-dropdown-item divided command="logout"><el-icon><SwitchButton /></el-icon>Sign out</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <ChangePwdDialog v-model="pwdVisible" />
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import ChangePwdDialog from '@/components/ChangePwdDialog.vue'

const route = useRoute()
const router = useRouter()
const user = useUserStore()

defineProps({ collapsed: Boolean })
defineEmits(['toggle'])

const title = computed(() => route.meta?.title || 'RustDesk Console')
const parent = computed(() => route.meta?.section)
const initial = computed(() => (user.username || 'U').charAt(0).toUpperCase())

const pwdVisible = ref(false)

function onUserCmd (cmd) {
  if (cmd === 'profile') router.push('/me')
  else if (cmd === 'password') pwdVisible.value = true
  else if (cmd === 'logout') {
    user.logout()
    router.push('/login')
  }
}

function reload () {
  window.location.reload()
}
</script>

<style scoped lang="scss">
.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: var(--rd-surface);
  border-bottom: 1px solid var(--rd-border);
  flex-shrink: 0;
}

.left { display: flex; flex-direction: column; gap: 2px; }
.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--rd-text);
  letter-spacing: -0.01em;
}
.crumb {
  font-size: 12px;
  color: var(--rd-muted);
  font-weight: 500;
}

.right { display: flex; align-items: center; gap: 8px; }

.icon-btn {
  width: 36px; height: 36px;
  background: transparent;
  border: 1px solid var(--rd-border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--rd-text-soft);
  display: grid;
  place-items: center;
  font-size: 16px;
  transition: all 0.12s;
  &:hover { background: var(--rd-bg); color: var(--rd-accent); border-color: var(--rd-accent); }
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--rd-bg);
  border: 1px solid var(--rd-border);
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--rd-text);
  transition: all 0.12s;
  &:hover { border-color: var(--rd-accent); }

  .avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    display: grid;
    place-items: center;
    font-weight: 600;
    font-size: 12px;
  }
  .user-name { line-height: 28px; }
  .caret { font-size: 12px; color: var(--rd-muted); }
}
</style>
