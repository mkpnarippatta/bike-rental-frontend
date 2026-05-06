import axios, { AxiosError } from 'axios'

const API_BASE = import.meta.env.VITE_FRAPPE_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api/method`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const csrf = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
    ?.split('=')[1]

  if (csrf && config.method !== 'get') {
    config.headers['X-Frappe-CSRF-Token'] = csrf
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      const authPaths = ['/api/method/login', '/api/method/bike_rental.api.auth.']
      const url = error.config?.url || ''
      const isAuthCall = authPaths.some((p) => url.startsWith(p))
      if (!isAuthCall) {
        const currentUser = document.cookie.includes('user_id=')
        if (!currentUser) {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
          window.location.href = `/login?redirect_to=${returnUrl}`
        }
      }
    }
    return Promise.reject(error)
  },
)

export async function call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.post(`/bike_rental.api.${method}`, params)
  return data.message as T
}

export async function callGet<T = unknown>(method: string, params?: Record<string, string>): Promise<T> {
  const { data } = await api.get(`/bike_rental.api.${method}`, { params })
  return data.message as T
}

export async function frappeCall<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.post(`/${method}`, params)
  return data.message as T
}

export async function uploadFile(file: File, doctype: string, docname?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('doctype', doctype)
  formData.append('is_private', '1')
  if (docname) formData.append('docname', docname)

  // Build URL with CSRF token appended as query param to avoid content-type issues
  const csrf = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
    ?.split('=')[1]

  const url = `${API_BASE}/api/method/upload_file${csrf ? `?csrf_token=${csrf}` : ''}`
  const res = await fetch(url, { method: 'POST', credentials: 'include', body: formData })
  const data = await res.json()
  if (!data.message?.file_url) throw new Error(data.message || 'File upload failed')
  return data.message.file_url as string
}

export default api
