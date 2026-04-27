const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// 观音灵签API
export const guanyinApi = {
  draw: () => request<{ stick: any }>('/api/guanyin/draw', {
    method: 'POST',
    body: JSON.stringify({}),
  }),

  interpret: (question: string, stick: any, userId?: string | null) => request<{ interpretation: string }>('/api/guanyin/interpret', {
    method: 'POST',
    body: JSON.stringify({ question, stick, user_id: userId }),
  }),

  followup: (question: string, stick: any, history: any[], userId?: string | null) => request<{ reply: string }>('/api/guanyin/followup', {
    method: 'POST',
    body: JSON.stringify({ question, stick, history, user_id: userId }),
  }),

  saveRecord: (userId: string | null, question: string, stick: any) => request<{ id: string; created_at: string }>('/api/guanyin/save-record', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, question, stick, conversation: [] }),
  }),

  updateRecord: (recordId: string, conversation: any[]) => request<{ success: boolean; updated_at: string }>(`/api/guanyin/update-record/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify({ conversation }),
  }),
}
