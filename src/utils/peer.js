export const connectByClient = (id) => {
  const a = document.createElement('a')
  a.href = `rustdesk://${id}`
  a.target = '_self'
  a.click()
}

const PLATFORMS = [
  { match: /windows|win32|win64|microsoft/i, name: 'Windows' },
  { match: /mac|darwin|osx/i, name: 'macOS' },
  { match: /linux/i, name: 'Linux' },
  { match: /android/i, name: 'Android' },
  { match: /ios|iphone|ipad/i, name: 'iOS' },
]

export function detectPlatform (raw = '') {
  const s = String(raw)
  for (const p of PLATFORMS) {
    if (p.match.test(s)) return p.name
  }
  return s || 'Unknown'
}

export const PLATFORM_COLORS = {
  Windows: '#3b82f6',
  macOS: '#64748b',
  Linux: '#f59e0b',
  Android: '#10b981',
  iOS: '#0ea5e9',
  Unknown: '#9ca3af',
}
