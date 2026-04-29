<template>
  <PageHeader title="Dashboard" subtitle="Welcome back" />

  <div class="stat-grid">
    <div class="surface-card stat-card">
      <div class="stat-icon icon-indigo">
        <el-icon :size="22"><Monitor /></el-icon>
      </div>
      <div class="stat-body">
        <div class="stat-label">Total devices</div>
        <div class="stat-value">{{ format(stats.devices) }}</div>
      </div>
    </div>

    <div class="surface-card stat-card">
      <div class="stat-icon icon-violet">
        <el-icon :size="22"><User /></el-icon>
      </div>
      <div class="stat-body">
        <div class="stat-label">Total users</div>
        <div class="stat-value">{{ format(stats.users) }}</div>
      </div>
    </div>

    <div class="surface-card stat-card">
      <div class="stat-icon icon-emerald">
        <el-icon :size="22"><Ticket /></el-icon>
      </div>
      <div class="stat-body">
        <div class="stat-label">Active sessions</div>
        <div class="stat-value">{{ format(stats.sessions) }}</div>
      </div>
    </div>

    <div class="surface-card stat-card">
      <div class="stat-icon icon-amber">
        <el-icon :size="22"><DataLine /></el-icon>
      </div>
      <div class="stat-body">
        <div class="stat-label">Connections today</div>
        <div class="stat-value">{{ format(stats.connectionsToday) }}</div>
      </div>
    </div>
  </div>

  <div class="recent-grid">
    <div class="surface-card">
      <div class="section-head">
        <h3>Recent connections</h3>
        <router-link to="/audit/connections" class="more-link">View all</router-link>
      </div>
      <div v-if="recentConn.loading" class="empty">Loading&hellip;</div>
      <div v-else-if="recentConn.error" class="empty">&mdash;</div>
      <div v-else-if="!recentConn.list.length" class="empty">No recent activity</div>
      <ul v-else class="row-list">
        <li v-for="r in recentConn.list" :key="r.id" class="row">
          <div class="row-main">
            <div class="row-title">
              <span class="font-medium">{{ r.peer_id || r.id || '—' }}</span>
              <span v-if="r.conn_type" class="text-muted text-sm">&middot; {{ r.conn_type }}</span>
            </div>
            <div class="row-sub text-muted text-sm">
              <span v-if="r.from_name">{{ r.from_name }}</span>
              <span v-if="r.from_peer"> · {{ r.from_peer }}</span>
            </div>
          </div>
          <div class="row-time text-muted text-sm">{{ fmt(r.created_at) }}</div>
        </li>
      </ul>
    </div>

    <div class="surface-card">
      <div class="section-head">
        <h3>Recent logins</h3>
        <router-link to="/audit/logins" class="more-link">View all</router-link>
      </div>
      <div v-if="recentLogin.loading" class="empty">Loading&hellip;</div>
      <div v-else-if="recentLogin.error" class="empty">&mdash;</div>
      <div v-else-if="!recentLogin.list.length" class="empty">No recent logins</div>
      <ul v-else class="row-list">
        <li v-for="r in recentLogin.list" :key="r.id" class="row">
          <div class="row-main">
            <div class="row-title">
              <span class="font-medium">{{ r.username || r.user_name || '—' }}</span>
              <span v-if="r.client" class="text-muted text-sm">&middot; {{ r.client }}</span>
            </div>
            <div class="row-sub text-muted text-sm">
              <span v-if="r.ip">{{ r.ip }}</span>
              <span v-if="r.platform"> · {{ r.platform }}</span>
            </div>
          </div>
          <div class="row-time text-muted text-sm">{{ fmt(r.created_at) }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import * as peer from '@/api/peer'
import * as user from '@/api/user'
import * as userToken from '@/api/user_token'
import * as audit from '@/api/audit'
import * as loginLog from '@/api/login_log'
import { timeAgo, formatTime } from '@/utils/time'

const stats = reactive({
  devices: null,
  users: null,
  sessions: null,
  connectionsToday: null,
})

const recentConn = reactive({ list: [], loading: true, error: false })
const recentLogin = reactive({ list: [], loading: true, error: false })

function format (v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString()
}

function fmt (t) {
  if (!t) return '—'
  if (typeof t === 'number') {
    if (t < 1e12) return formatTime(t * 1000)
    return formatTime(t)
  }
  return timeAgo(t)
}

function startOfTodayUnix () {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / 1000)
}

async function loadDevices () {
  try {
    const res = await peer.list({ page: 1, page_size: 1 })
    stats.devices = res?.data?.total ?? 0
  } catch { stats.devices = null }
}

async function loadUsers () {
  try {
    const res = await user.list({ page: 1, page_size: 1 })
    stats.users = res?.data?.total ?? 0
  } catch { stats.users = null }
}

async function loadSessions () {
  try {
    const res = await userToken.list({ page: 1, page_size: 1 })
    stats.sessions = res?.data?.total ?? 0
  } catch { stats.sessions = null }
}

async function loadConnectionsToday () {
  try {
    const res = await audit.list({ page: 1, page_size: 1, time_ge: startOfTodayUnix() })
    stats.connectionsToday = res?.data?.total ?? 0
  } catch { stats.connectionsToday = null }
}

async function loadRecentConn () {
  recentConn.loading = true
  try {
    const res = await audit.list({ page: 1, page_size: 5 })
    recentConn.list = res?.data?.list || []
    recentConn.error = false
  } catch {
    recentConn.error = true
    recentConn.list = []
  } finally {
    recentConn.loading = false
  }
}

async function loadRecentLogin () {
  recentLogin.loading = true
  try {
    const res = await loginLog.list({ page: 1, page_size: 5 })
    recentLogin.list = res?.data?.list || []
    recentLogin.error = false
  } catch {
    recentLogin.error = true
    recentLogin.list = []
  } finally {
    recentLogin.loading = false
  }
}

onMounted(() => {
  loadDevices()
  loadUsers()
  loadSessions()
  loadConnectionsToday()
  loadRecentConn()
  loadRecentLogin()
})
</script>

<style scoped lang="scss">
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-indigo { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.icon-violet { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
.icon-emerald { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.icon-amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.stat-label {
  font-size: 13px;
  color: var(--rd-muted, #94a3b8);
  margin-bottom: 2px;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.recent-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 1000px) {
  .recent-grid { grid-template-columns: 1fr; }
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
}
.more-link {
  font-size: 13px;
  color: #6366f1;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.row-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter, #f1f5f9);
  &:last-child { border-bottom: none; }
}
.row-main { min-width: 0; flex: 1; }
.row-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 14px;
}
.row-sub { margin-top: 2px; }
.row-time { white-space: nowrap; }
.empty {
  padding: 24px 0;
  text-align: center;
  color: var(--rd-muted, #94a3b8);
  font-size: 14px;
}
</style>
