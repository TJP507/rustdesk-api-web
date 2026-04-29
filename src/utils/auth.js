const TokenKey = 'access_token'
const OidcCode = 'oidc_code'
const OidcCodeExpiry = 'oidc_code_expiry'

export function getToken () {
  return localStorage.getItem(TokenKey)
}

export function setToken (token) {
  localStorage.setItem('wc-option:local:access_token', token)
  return localStorage.setItem(TokenKey, token)
}

export function removeToken () {
  return localStorage.removeItem(TokenKey)
}

export function setCode (code) {
  const expiry = Date.now() + 60 * 1000
  localStorage.setItem(OidcCode, code)
  localStorage.setItem(OidcCodeExpiry, expiry)
}

export function getCode () {
  const expiry = localStorage.getItem(OidcCodeExpiry)
  if (expiry && Date.now() > parseInt(expiry)) {
    removeCode()
    return null
  }
  return localStorage.getItem(OidcCode)
}

export function removeCode () {
  localStorage.removeItem(OidcCode)
  localStorage.removeItem(OidcCodeExpiry)
}
