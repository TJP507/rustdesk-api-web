<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="brand" @click="$router.push('/')">
      <div class="logo">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
          <circle cx="12" cy="10.5" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <span class="brand-name" v-if="!collapsed">RustDesk</span>
    </div>

    <nav class="nav">
      <template v-for="group in sections" :key="group.section">
        <div class="section-label" v-if="!collapsed">{{ group.section }}</div>
        <div class="section-divider" v-else></div>
        <router-link
          v-for="item in group.items"
          :key="item.name"
          :to="item.path"
          class="nav-item"
          active-class="active"
        >
          <el-icon class="icon"><component :is="item.icon || 'Menu'" /></el-icon>
          <span class="label" v-if="!collapsed">{{ item.title }}</span>
          <el-tooltip v-else :content="item.title" placement="right">
            <span class="tooltip-anchor"></span>
          </el-tooltip>
        </router-link>
      </template>
    </nav>

    <div class="foot">
      <button class="collapse-btn" @click="$emit('toggle')" :title="collapsed ? 'Expand' : 'Collapse'">
        <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { navSections } from '@/router'
import { useUserStore } from '@/store/user'

defineProps({ collapsed: Boolean })
defineEmits(['toggle'])

const user = useUserStore()
const sections = computed(() => navSections((name) => user.canAccess(name)))
</script>

<style scoped lang="scss">
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--rd-sidebar-bg);
  color: var(--rd-sidebar-fg);
  display: flex;
  flex-direction: column;
  transition: width 0.18s ease;
  border-right: 1px solid rgba(255, 255, 255, 0.04);

  &.collapsed { width: 68px; }
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  .logo {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .brand-name {
    font-size: 17px;
    font-weight: 700;
    color: white;
    letter-spacing: -0.01em;
  }
}

.nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 4px; }
}

.section-label {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--rd-sidebar-section);
  padding: 14px 12px 6px;
  font-weight: 600;
}
.section-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 10px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  margin: 1px 0;
  color: var(--rd-sidebar-fg);
  text-decoration: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  position: relative;
  transition: background 0.12s, color 0.12s;

  .icon { font-size: 17px; flex-shrink: 0; }
  .label { flex: 1; white-space: nowrap; overflow: hidden; }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--rd-sidebar-fg-hover);
  }
  &.active {
    background: var(--rd-sidebar-active-bg);
    color: white;
    box-shadow: inset 2px 0 0 var(--rd-accent);
  }
}

.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
  .tooltip-anchor {
    position: absolute; inset: 0;
  }
}

.foot {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);

  .collapse-btn {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--rd-sidebar-fg);
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s;
    &:hover { background: rgba(255, 255, 255, 0.06); color: white; }
  }
}
</style>
