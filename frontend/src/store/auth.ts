import { create } from 'zustand'

interface User {
  id: string
  phone: string
  nickname?: string
  avatar?: string
  createdAt: string
}

interface AuthStore {
  user: User | null
  isLoading: boolean
  login: (phone: string, code: string) => Promise<void>
  logout: () => void
  sendCode: (phone: string) => Promise<void>
  setUser: (user: User | null) => void
}

// Mock用户数据（暂时本地存储）
const MOCK_USERS_KEY = 'wenxin_users'
const CURRENT_USER_KEY = 'wenxin_current_user'

export const useAuthStore = create<AuthStore>((set) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })(),
  isLoading: false,

  sendCode: async (phone: string) => {
    // Mock：模拟发送验证码
    console.log('Sending code to:', phone)
    // 实际项目中这里调用API
    await new Promise(resolve => setTimeout(resolve, 1000))
  },

  login: async (phone: string, code: string) => {
    set({ isLoading: true })
    try {
      // Mock：验证验证码（暂时接受任何6位数字）
      if (!/^\d{6}$/.test(code)) {
        throw new Error('验证码错误')
      }

      // 检查是否已注册
      let users = []
      try {
        const saved = localStorage.getItem(MOCK_USERS_KEY)
        users = saved ? JSON.parse(saved) : []
      } catch {
        users = []
      }

      let user = users.find((u: any) => u.phone === phone)

      if (!user) {
        // 新用户，自动注册
        user = {
          id: crypto.randomUUID(),
          phone,
          nickname: `用户${phone.slice(-4)}`,
          createdAt: new Date().toISOString(),
        }
        users.push(user)
        localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
      }

      // 登录成功
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
      set({ user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY)
    set({ user: null })
  },

  setUser: (user) => set({ user }),
}))
