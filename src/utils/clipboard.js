import { ElMessage } from 'element-plus'

export async function copyText (text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    ElMessage.success('Copied')
  } catch (e) {
    ElMessage.error('Copy failed')
  }
}

export function handleClipboard (text) {
  return copyText(text)
}
