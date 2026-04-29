// FQDN overrides for the generated install scripts.
// These are purely client-side — they let the admin point newly-installed
// clients at a public FQDN even when the API itself still uses LAN IPs.
const KEY = 'install_fqdn_overrides_v1'

const empty = { id_server: '', relay_server: '', api_server: '' }

export function loadOverrides () {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...empty }
    const parsed = JSON.parse(raw)
    return { ...empty, ...parsed }
  } catch {
    return { ...empty }
  }
}

export function saveOverrides (data) {
  const clean = {
    id_server: (data.id_server || '').trim(),
    relay_server: (data.relay_server || '').trim(),
    api_server: (data.api_server || '').trim(),
  }
  localStorage.setItem(KEY, JSON.stringify(clean))
  return clean
}

// Resolve effective values for the install script:
// per-field override → real server config → empty.
export function resolveInstallTargets (rustdeskConfig) {
  const o = loadOverrides()
  return {
    id_server: o.id_server || rustdeskConfig.id_server || '',
    relay_server: o.relay_server || rustdeskConfig.relay_server || '',
    api_server: o.api_server || rustdeskConfig.api_server || '',
    key: rustdeskConfig.key || '',
  }
}
