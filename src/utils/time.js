export function timeAgo (time) {
  const now = Date.now()
  const after = new Date(time).getTime()
  const dis = now - after
  if (dis < 60 * 1000) return 'just now'
  if (dis < 60 * 60 * 1000) {
    const n = Math.floor(dis / (60 * 1000))
    return `${n} minute${n > 1 ? 's' : ''} ago`
  }
  if (dis < 24 * 60 * 60 * 1000) {
    const n = Math.floor(dis / (60 * 60 * 1000))
    return `${n} hour${n > 1 ? 's' : ''} ago`
  }
  if (dis < 30 * 24 * 60 * 60 * 1000) {
    const n = Math.floor(dis / (24 * 60 * 60 * 1000))
    return `${n} day${n > 1 ? 's' : ''} ago`
  }
  if (dis < 12 * 30 * 24 * 60 * 60 * 1000) {
    const n = Math.floor(dis / (30 * 24 * 60 * 60 * 1000))
    return `${n} month${n > 1 ? 's' : ''} ago`
  }
  const n = Math.floor(dis / (12 * 30 * 24 * 60 * 60 * 1000))
  return `${n} year${n > 1 ? 's' : ''} ago`
}

export function formatTime (unix, format = 'yyyy-MM-dd HH:mm:ss') {
  const d = new Date(unix)
  const pad = n => (n < 10 ? '0' + n : n)
  return format
    .replace('yyyy', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
}

export function fromUnix (sec) {
  if (!sec) return '-'
  return new Date(sec * 1000).toLocaleString()
}

export function secondsSince (unixSec) {
  if (!unixSec) return Infinity
  return (Date.now() - unixSec * 1000) / 1000
}
