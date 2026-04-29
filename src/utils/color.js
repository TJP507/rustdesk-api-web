// Flutter encodes ARGB as a 32-bit int. Convert back and forth for color picker UI.
export function flutterToRgba (color) {
  if (color === null || color === undefined || color === '') return ''
  let hex = Number(color).toString(16)
  if (hex.length < 8) hex = '0'.repeat(8 - hex.length) + hex
  const a = parseInt(hex.slice(0, 2), 16) / 255
  const r = parseInt(hex.slice(2, 4), 16)
  const g = parseInt(hex.slice(4, 6), 16)
  const b = parseInt(hex.slice(6, 8), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function rgbaToFlutter (color) {
  if (!color) return 0
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/)
  if (!m) return 0
  const a = m[4] !== undefined ? Math.round(parseFloat(m[4]) * 255) : 255
  const r = parseInt(m[1])
  const g = parseInt(m[2])
  const b = parseInt(m[3])
  const pad = n => n.toString(16).padStart(2, '0')
  return parseInt(pad(a) + pad(r) + pad(g) + pad(b), 16)
}
