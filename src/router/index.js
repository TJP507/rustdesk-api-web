import { createRouter, createWebHashHistory } from 'vue-router'

// Public routes — no auth required
const publicRoutes = [
  { path: '/login', name: 'Login', meta: { title: 'Sign in', hidden: true }, component: () => import('@/views/auth/Login.vue') },
  { path: '/register', name: 'Register', meta: { title: 'Create account', hidden: true }, component: () => import('@/views/auth/Register.vue') },
  { path: '/oauth/:code', name: 'OauthLogin', meta: { title: 'Signing in', hidden: true }, component: () => import('@/views/auth/OauthLogin.vue') },
  { path: '/oauth/bind/:code', name: 'OauthBind', meta: { title: 'Linking account', hidden: true }, component: () => import('@/views/auth/OauthBind.vue') },
  { path: '/404', name: 'NotFound', meta: { title: 'Not found', hidden: true }, component: () => import('@/views/error/NotFound.vue') },
]

// Authenticated app — every page lives inside the shell layout.
// meta.section drives sidebar grouping; meta.route maps to server-side permission name.
const appRoute = {
  path: '/',
  component: () => import('@/layout/AppShell.vue'),
  redirect: '/dashboard',
  children: [
    { path: 'dashboard', name: 'Dashboard', meta: { title: 'Dashboard', icon: 'Odometer', section: 'Overview' }, component: () => import('@/views/dashboard/index.vue') },

    { path: 'devices', name: 'Peer', meta: { title: 'Devices', icon: 'Monitor', section: 'Manage', route: 'Peer' }, component: () => import('@/views/peers/index.vue') },

    { path: 'users', name: 'UserList', meta: { title: 'Users', icon: 'User', section: 'Access', route: 'UserList' }, component: () => import('@/views/users/index.vue') },
    { path: 'users/new', name: 'UserAdd', meta: { title: 'New user', section: 'Access', hidden: true, route: 'UserAdd' }, component: () => import('@/views/users/edit.vue') },
    { path: 'users/:id/edit', name: 'UserEdit', meta: { title: 'Edit user', section: 'Access', hidden: true, route: 'UserEdit' }, component: () => import('@/views/users/edit.vue') },
    { path: 'user-groups', name: 'UserGroup', meta: { title: 'User Groups', icon: 'UserFilled', section: 'Access', route: 'UserGroup' }, component: () => import('@/views/users/userGroups.vue') },
    { path: 'device-groups', name: 'DeviceGroup', meta: { title: 'Device Groups', icon: 'Files', section: 'Access', route: 'DeviceGroup' }, component: () => import('@/views/users/deviceGroups.vue') },
    { path: 'sessions', name: 'UserToken', meta: { title: 'Sessions', icon: 'Ticket', section: 'Access', route: 'UserToken' }, component: () => import('@/views/users/sessions.vue') },

    { path: 'address-book', name: 'UserAddressBook', meta: { title: 'Entries', icon: 'Notebook', section: 'Address book', route: 'UserAddressBook' }, component: () => import('@/views/addressBook/entries.vue') },
    { path: 'collections', name: 'UserAddressBookName', meta: { title: 'Collections', icon: 'Collection', section: 'Address book', route: 'UserAddressBookName' }, component: () => import('@/views/addressBook/collections.vue') },
    { path: 'tags', name: 'UserTag', meta: { title: 'Tags', icon: 'CollectionTag', section: 'Address book', route: 'UserTag' }, component: () => import('@/views/addressBook/tags.vue') },

    { path: 'audit/connections', name: 'AuditConn', meta: { title: 'Connections', icon: 'Tickets', section: 'Audit', route: 'AuditConn' }, component: () => import('@/views/audit/connections.vue') },
    { path: 'audit/files', name: 'AuditFile', meta: { title: 'File transfers', icon: 'Files', section: 'Audit', route: 'AuditFile' }, component: () => import('@/views/audit/files.vue') },
    { path: 'audit/logins', name: 'LoginLog', meta: { title: 'Logins', icon: 'List', section: 'Audit', route: 'LoginLog' }, component: () => import('@/views/audit/logins.vue') },
    { path: 'audit/shares', name: 'ShareRecord', meta: { title: 'Share records', icon: 'Share', section: 'Audit', route: 'ShareRecord' }, component: () => import('@/views/audit/shares.vue') },

    { path: 'server', name: 'ServerCmd', meta: { title: 'Server Control', icon: 'Tools', section: 'System', route: 'ServerCmd' }, component: () => import('@/views/server/index.vue') },
    { path: 'oauth-providers', name: 'Oauth', meta: { title: 'OAuth Providers', icon: 'Link', section: 'System', route: 'Oauth' }, component: () => import('@/views/oauth/providers.vue') },

    // My Account — everyone has access
    { path: 'me', name: 'MyInfo', meta: { title: 'Profile', icon: 'UserFilled', section: 'My account' }, component: () => import('@/views/me/profile.vue') },
    { path: 'me/peers', name: 'MyPeer', meta: { title: 'My devices', icon: 'Monitor', section: 'My account' }, component: () => import('@/views/me/peers.vue') },
    { path: 'me/address-book', name: 'MyAddressBookList', meta: { title: 'My address book', icon: 'Notebook', section: 'My account' }, component: () => import('@/views/me/addressBook.vue') },
    { path: 'me/collections', name: 'MyAddressBookCollection', meta: { title: 'My collections', icon: 'Collection', section: 'My account' }, component: () => import('@/views/me/collections.vue') },
    { path: 'me/tags', name: 'MyTagList', meta: { title: 'My tags', icon: 'CollectionTag', section: 'My account' }, component: () => import('@/views/me/tags.vue') },
    { path: 'me/shares', name: 'MyShareRecordList', meta: { title: 'My shares', icon: 'Share', section: 'My account' }, component: () => import('@/views/me/shares.vue') },
    { path: 'me/logins', name: 'MyLoginLog', meta: { title: 'My logins', icon: 'List', section: 'My account' }, component: () => import('@/views/me/logins.vue') },
  ],
}

const routes = [
  ...publicRoutes,
  appRoute,
  { path: '/:catchAll(.*)', redirect: '/404', meta: { hidden: true } },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Build sidebar nav grouped by section, filtered by user permissions.
export function navSections (canAccess) {
  const groups = {}
  for (const r of appRoute.children) {
    if (r.meta?.hidden) continue
    if (r.meta?.route && !canAccess(r.meta.route)) continue
    const section = r.meta.section || 'Other'
    if (!groups[section]) groups[section] = []
    groups[section].push({
      name: r.name,
      path: '/' + r.path,
      title: r.meta.title,
      icon: r.meta.icon,
    })
  }
  const order = ['Overview', 'Manage', 'Access', 'Address book', 'Audit', 'System', 'My account']
  return order
    .filter(s => groups[s] && groups[s].length)
    .map(s => ({ section: s, items: groups[s] }))
}
