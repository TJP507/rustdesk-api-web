<template>
  <div class="shell" :class="{ collapsed }">
    <Sidebar :collapsed="collapsed" @toggle="toggleSidebar" />
    <div class="main">
      <Topbar :collapsed="collapsed" @toggle="toggleSidebar" />
      <div class="content">
        <router-view v-slot="{ Component, route }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/app'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

const appStore = useAppStore()
const collapsed = computed(() => appStore.setting.sideIsCollapse)
const toggleSidebar = () => appStore.sideCollapse()
</script>

<style scoped lang="scss">
.shell {
  display: flex;
  height: 100%;
  width: 100%;
  background: var(--rd-bg);
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.content {
  flex: 1;
  overflow: auto;
  padding: 24px 28px 32px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(4px); }
.fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
