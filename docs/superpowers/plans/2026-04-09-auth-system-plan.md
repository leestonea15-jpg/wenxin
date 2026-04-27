# 用户认证系统 - v1.3 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现手机号+验证码登录，首次登录即为注册，完整的个人中心页面

**Architecture:** 使用zustand管理auth状态，弹窗登录，独立的个人中心页面

**Tech Stack:** React + TypeScript + Zustand + React Router + Tailwind CSS

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/store/auth.ts` | Create | Auth状态管理store |
| `frontend/src/components/LoginModal.tsx` | Create | 登录弹窗组件 |
| `frontend/src/pages/Profile.tsx` | Create | 个人中心主页面 |
| `frontend/src/pages/Profile/PersonalInfo.tsx` | Create | 个人资料模块 |
| `frontend/src/pages/Profile/History.tsx` | Create | 历史记录模块 |
| `frontend/src/pages/Profile/Feedback.tsx` | Create | 反馈建议模块 |
| `frontend/src/pages/Profile/About.tsx` | Create | 关于我们模块 |
| `frontend/src/pages/Profile/Help.tsx` | Create | 帮助中心模块 |
| `frontend/src/pages/Profile/Privacy.tsx` | Create | 隐私设置模块 |
| `frontend/src/components/Layout.tsx` | Modify | 集成登录判断和弹窗 |
| `frontend/src/pages/Home.tsx` | Modify | 点击卡片时判断登录状态 |
| `frontend/src/App.tsx` | Modify | 添加Profile路由 |

---

### Task 1: 创建 Auth Store (zustand)

**Files:**
- Create: `frontend/src/store/auth.ts`

- [ ] **Step 1: 创建auth store**

```typescript
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

export const useAuthStore = create<AuthStore>((set, get) => ({
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
          id: Date.now().toString(),
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
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/store/auth.ts
git commit -m "feat: create auth store with zustand"
```

---

### Task 2: 创建 LoginModal 组件

**Files:**
- Create: `frontend/src/components/LoginModal.tsx`

- [ ] **Step 1: 创建登录弹窗组件**

```typescript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { useAuthStore } from '../store/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const { login, sendCode, isLoading } = useAuthStore()

  const handleSendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setError('')
    try {
      await sendCode(phone)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch {
      setError('发送失败，请重试')
    }
  }

  const handleLogin = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    if (!/^\d{6}$/.test(code)) {
      setError('请输入6位验证码')
      return
    }
    setError('')
    try {
      await login(phone, code)
      onClose()
      onSuccess?.()
    } catch {
      setError('登录失败，请重试')
    }
  }

  const handleClose = () => {
    setPhone('')
    setCode('')
    setError('')
    setCountdown(0)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="登录/注册">
      <div className="space-y-4">
        <p className="text-neutral-600 text-sm">
          首次登录即为注册，请输入手机号获取验证码
        </p>
        <Input
          label="手机号"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={11}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="验证码"
              placeholder="请输入验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <div className="flex flex-col justify-end">
            <Button
              variant={countdown > 0 ? 'secondary' : 'default'}
              onClick={handleSendCode}
              disabled={countdown > 0 || isLoading}
              className="whitespace-nowrap"
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LoginModal
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/LoginModal.tsx
git commit -m "feat: create LoginModal component"
```

---

### Task 3: 创建个人中心页面组件

**Files:**
- Create: `frontend/src/pages/Profile.tsx`
- Create: `frontend/src/pages/Profile/PersonalInfo.tsx`
- Create: `frontend/src/pages/Profile/History.tsx`
- Create: `frontend/src/pages/Profile/Feedback.tsx`
- Create: `frontend/src/pages/Profile/About.tsx`
- Create: `frontend/src/pages/Profile/Help.tsx`
- Create: `frontend/src/pages/Profile/Privacy.tsx`

- [ ] **Step 1: 创建 Profile 主页面**

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { useAuthStore } from '../store/auth'
import PersonalInfo from './Profile/PersonalInfo'
import History from './Profile/History'
import Feedback from './Profile/Feedback'
import About from './Profile/About'
import Help from './Profile/Help'
import Privacy from './Profile/Privacy'

type ProfileTab = 'info' | 'history' | 'feedback' | 'about' | 'help' | 'privacy'

const Profile = () => {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<ProfileTab>('info')

  if (!user) {
    return (
      <Layout>
        <div className="container-max py-20 text-center">
          <p className="text-neutral-600 mb-4">请先登录</p>
          <Link to="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </Layout>
    )
  }

  const menuItems = [
    { key: 'info' as const, label: '个人资料', icon: '📝' },
    { key: 'history' as const, label: '历史记录', icon: '📜' },
    { key: 'feedback' as const, label: '反馈建议', icon: '⭐' },
    { key: 'about' as const, label: '关于我们', icon: 'ℹ️' },
    { key: 'help' as const, label: '帮助中心', icon: '❓' },
    { key: 'privacy' as const, label: '隐私设置', icon: '🔒' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'info': return <PersonalInfo />
      case 'history': return <History />
      case 'feedback': return <Feedback />
      case 'about': return <About />
      case 'help': return <Help />
      case 'privacy': return <Privacy />
      default: return <PersonalInfo />
    }
  }

  return (
    <Layout showBackButton>
      <div className="container-max py-8">
        {/* 顶部头像区域 */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-3xl text-white font-bold">
            {user.nickname?.[0] || '用'}
          </div>
          <h2 className="text-xl font-semibold mb-1">{user.nickname}</h2>
          <p className="text-neutral-500">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
        </div>

        {/* 菜单列表 */}
        <div className="space-y-2 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                activeTab === item.key
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-neutral-400">›</span>
            </button>
          ))}
        </div>

        {/* 退出登录 */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span>退出登录</span>
        </button>

        {/* 内容区域（点击菜单项后显示）*/}
        <div className="mt-8">
          {renderContent()}
        </div>
      </div>
    </Layout>
  )
}

export default Profile
```

- [ ] **Step 2: 创建子模块组件（占位版）**

创建各个子模块的简单版本，后续可完善：

**PersonalInfo.tsx:**
```typescript
const PersonalInfo = () => {
  return (
    <div className="bg-neutral-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">个人资料</h3>
      <p className="text-neutral-600">个人资料编辑功能开发中...</p>
    </div>
  )
}
export default PersonalInfo
```

**History.tsx:**
```typescript
const History = () => {
  return (
    <div className="bg-neutral-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">历史记录</h3>
      <p className="text-neutral-600">暂无测算记录</p>
    </div>
  )
}
export default History
```

**Feedback.tsx:**
```typescript
const Feedback = () => {
  return (
    <div className="bg-neutral-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">反馈建议</h3>
      <p className="text-neutral-600">反馈表单开发中...</p>
    </div>
  )
}
export default Feedback
```

**About.tsx:**
```typescript
const About = () => {
  return (
    <div className="bg-neutral-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">关于我们</h3>
      <p className="text-neutral-600">问心 v1.3</p>
      <p className="text-neutral-500 text-sm mt-2">命理探索，手势互动——探索命运的新方式。</p>
    </div>
  )
}
export default About
```

**Help.tsx:**
```typescript
const Help = () => {
  return (
    <div className="bg-neutral-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">帮助中心</h3>
      <p className="text-neutral-600">使用说明开发中...</p>
    </div>
  )
}
export default Help
```

**Privacy.tsx:**
```typescript
const Privacy = () => {
  return (
    <div className="bg-neutral-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">隐私设置</h3>
      <p className="text-neutral-600">隐私选项开发中...</p>
    </div>
  )
}
export default Privacy
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/Profile.tsx src/pages/Profile/
git commit -m "feat: create Profile page and sub-modules"
```

---

### Task 4: 集成登录到 Layout 和 Home

**Files:**
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/pages/Home.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 修改 Layout.tsx**

集成LoginModal，并在登录后显示用户头像：

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from './Button'
import NavigationDrawer from './NavigationDrawer'
import Logo from './Logo'
import LoginModal from './LoginModal'
import { useAuthStore } from '../store/auth'

interface LayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
}

const Layout = ({ children, showBackButton = false }: LayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-neutral-200">
        <div className="container-max h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            {showBackButton ? (
              <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-neutral-800 font-serif hover:text-neutral-600">
                ← 返回
              </Link>
            ) : (
              <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-neutral-800 font-serif hover:text-neutral-600">
                <Logo size="sm" />
                问心
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold"
              >
                {user.nickname?.[0] || '用'}
              </button>
            ) : (
              <Button size="sm" onClick={() => setLoginModalOpen(true)}>
                登录/注册
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  )
}

export default Layout
```

- [ ] **Step 2: 修改 Home.tsx - 点击卡片时判断登录**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from './Home/HeroSection'
import GameCard from './Home/GameCard'
import Section from '../components/Section'
import LoginModal from '../components/LoginModal'
import { useAuthStore } from '../store/auth'

const games = [
  {
    title: '每日速测',
    description: '一分钟速测问吉凶，金钱卦、掷圣杯两种玩法。',
    path: '/daily-speed',
    icon: '⚡',
  },
  {
    title: '观音灵签',
    description: '虔诚祈求，观音赐签。',
    path: '/guanyin',
    icon: '🏮',
    comingSoon: true,
  },
  {
    title: '塔罗牌',
    description: '探索内心，指引方向。',
    path: '/tarot',
    icon: '✨',
    comingSoon: true,
  },
  {
    title: '八字排盘',
    description: '天干地支，五行生克。',
    path: '/bazi',
    icon: '📜',
    comingSoon: true,
  },
]

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  const handleGameClick = (path: string, comingSoon?: boolean) => {
    if (comingSoon) return
    if (!user) {
      setPendingPath(path)
      setLoginModalOpen(true)
      return
    }
    navigate(path)
  }

  const handleLoginSuccess = () => {
    if (pendingPath) {
      navigate(pendingPath)
      setPendingPath(null)
    }
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <Section title="选择模式" subtitle="多种测算方式，满足你不同的需求">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((game, index) => (
            <GameCard
              key={index}
              {...game}
              onClick={() => handleGameClick(game.path, game.comingSoon)}
            />
          ))}
        </div>
      </Section>
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false)
          setPendingPath(null)
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default Home
```

- [ ] **Step 3: 修改 App.tsx - 添加Profile路由**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import DailySpeed from './pages/DailySpeed'
import Login from './pages/Login'
import Signup from './pages/Signup'
import History from './pages/History'
import Profile from './pages/Profile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/daily-speed" element={<DailySpeed />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 4: 修改 GameCard 组件支持 onClick**

确保GameCard接受onClick prop：

```typescript
// 在 GameCard.tsx 中添加
interface GameCardProps {
  title: string
  description: string
  icon: string
  path?: string
  comingSoon?: boolean
  onClick?: () => void
}

// 在按钮上使用
<button
  onClick={onClick}
  disabled={comingSoon}
  // ...
>
```

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/components/Layout.tsx src/pages/Home.tsx src/App.tsx src/pages/Home/GameCard.tsx
git commit -m "feat: integrate login flow to Layout and Home"
```

---

### Task 5: 测试验证

**Files:** （无新文件）

- [ ] **Step 1: 运行TypeScript检查**

```bash
cd frontend
npx tsc --noEmit
```

预期：无TypeScript错误

- [ ] **Step 2: 运行构建**

```bash
cd frontend
npm run build
```

预期：构建成功

---

## 验收检查

- [ ] Auth store创建完成
- [ ] LoginModal弹窗可用
- [ ] 手机号+验证码登录正常
- [ ] 首次登录自动注册
- [ ] 点击卡片时未登录弹出登录框
- [ ] 登录后显示用户头像
- [ ] Profile页面及子模块创建完成
- [ ] TypeScript检查通过
- [ ] 构建成功
