# 问心 - 阶段一：MVP核心功能 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现问心运势测算网站的MVP核心功能，包括项目初始化、首页、每日速测页面、用户认证、测算记录存储与查看。

**Architecture:** 前后端分离架构，React前端通过FastAPI后端与Supabase交互。先实现核心功能，不包含手势控制，后续迭代添加。

**Tech Stack:** React + Vite + Tailwind CSS, FastAPI + SQLAlchemy, Supabase PostgreSQL + Auth

---

## 目录结构

```
yunshicesuan/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── NavigationDrawer.tsx
│   │   │   └── Section.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── DailySpeed.tsx
│   │   │   ├── History.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSupabase.ts
│   │   │   ├── useMoneyGua.ts
│   │   │   └── useShengbei.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── supabase.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   └── moneyGua.ts
│   │   │   └── shengbei.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── records.py
│   │   │   └── daily_speed.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── money_gua.py
│   │   │   └── shengbei.py
│   │   └── core/
│   │       ├── __init__.py
│   │       ├── config.py
│   │       └── database.py
│   ├── main.py
│   └── requirements.txt
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

---

## Task 1: 项目初始化 - 创建根目录配置文件

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\README.md`
- Create: `D:\claudeCodeProjects\yunshicesuan\.gitignore`

- [ ] **Step 1: 创建 README.md**

```markdown
# 问心 - 运势测算网站

每一次对命运的探索和好奇，都源自于内心对自我了解的渴望。

## 技术栈

- 前端: React + Vite + Tailwind CSS
- 后端: FastAPI + SQLAlchemy
- 数据库: Supabase PostgreSQL
- 认证: Supabase Auth

## 开发

### 前端

```bash
cd frontend
npm install
npm run dev
```

### 后端

```bash
cd backend
pip install -r requirements.txt
python main.py
```
```

- [ ] **Step 2: 创建 .gitignore**

```gitignore
# Node
node_modules/
dist/
.env.local
.env.*.local

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
ENV/
.pytest_cache/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Supabase
.supabase/

# Build
build/

# Logs
*.log
npm-debug.log*
```

- [ ] **Step 3: 提交初始化配置**

```bash
cd "D:\claudeCodeProjects\yunshicesuan"
git init 2>/dev/null || true
git add README.md .gitignore
git commit -m "chore: initialize project with README and gitignore" || echo "No git repository, skipping commit"
```

---

## Task 2: 初始化 Supabase 项目

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\.env.example`

**注意:** 此步骤需要手动在 Supabase 控制台创建项目。

- [ ] **Step 1: 创建 Supabase 项目**
  - 访问 https://supabase.com
  - 登录并创建新项目，项目名称: "问心"
  - 等待项目初始化完成

- [ ] **Step 2: 配置 Supabase Auth**
  - 在 Supabase 控制台进入 Authentication → Providers
  - 启用 Email  provider
  - 启用 Phone provider (需要配置 SMS 服务)
  - 在 Authentication → URL Configuration 中设置 Site URL

- [ ] **Step 3: 创建数据库表**
  - 在 Supabase 控制台进入 SQL Editor
  - 执行以下 SQL:

```sql
-- 创建测算记录表
CREATE TABLE divination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL,
    question TEXT,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_divination_records_user_id ON divination_records(user_id);
CREATE INDEX idx_divination_records_type ON divination_records(type);
CREATE INDEX idx_divination_records_created_at ON divination_records(created_at DESC);

-- 启用行级安全策略
ALTER TABLE divination_records ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的记录
CREATE POLICY "Users can view their own records"
    ON divination_records FOR SELECT
    USING (auth.uid() = user_id);

-- 创建策略：用户只能创建自己的记录
CREATE POLICY "Users can create their own records"
    ON divination_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户只能删除自己的记录
CREATE POLICY "Users can delete their own records"
    ON divination_records FOR DELETE
    USING (auth.uid() = user_id);
```

- [ ] **Step 4: 创建 .env.example**

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

- [ ] **Step 5: 保存 Supabase 凭据**
  - 在 Supabase 控制台进入 Settings → API
  - 复制 Project URL, anon public key, service_role key, JWT secret
  - 创建 `.env` 文件并填入这些值（不要提交到 git）

---

## Task 3: 初始化前端项目

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\package.json`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\vite.config.ts`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\tsconfig.json`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\tailwind.config.js`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\postcss.config.js`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\index.html`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\main.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\App.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\styles\globals.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "wenxin-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "canvas-confetti": "^1.9.0",
    "framer-motion": "^10.16.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-query": "^3.39.3",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "jsdom": "^23.0.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        gold: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#fce588',
          300: '#fadb5f',
          400: '#f7c948',
          500: '#f0b429',
          600: '#de911d',
          700: '#cb6e17',
          800: '#b44d12',
          900: '#8d2b0b',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: 创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>问心 - 运势测算</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 8: 创建 src/App.tsx**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import DailySpeed from './pages/DailySpeed'
import History from './pages/History'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/daily-speed" element={<DailySpeed />} />
        <Route path="/history" element={<History />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/guanyin" element={<Navigate to="/" replace />} />
        <Route path="/tarot" element={<Navigate to="/" replace />} />
        <Route path="/bazi" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
```

- [ ] **Step 9: 创建 src/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased;
  }
}

@layer components {
  .container-max {
    @apply max-w-6xl mx-auto px-4 sm:px-6 lg:px-8;
  }
}
```

- [ ] **Step 10: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 11: 创建 .env.local** (复制 .env.example 并填入值)

```bash
cd "D:\claudeCodeProjects\yunshicesuan\frontend"
cp ../.env.example .env.local
# 然后手动编辑 .env.local 填入 Supabase 凭据
```

- [ ] **Step 12: 安装依赖并验证项目**

```bash
cd "D:\claudeCodeProjects\yunshicesuan\frontend"
npm install
npm run dev
# 按 Ctrl+C 停止开发服务器
```

---

## Task 4: 创建前端通用组件

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\components\Button.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\components\Input.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\components\Modal.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\components\Card.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\components\Section.tsx`

- [ ] **Step 1: 创建 Button.tsx**

```typescript
import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-neutral-800 text-white hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2',
      secondary: 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2',
      ghost: 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className || ''}`}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
```

- [ ] **Step 2: 创建 Input.tsx**

```typescript
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500' : ''} ${className || ''}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
```

- [ ] **Step 3: 创建 Modal.tsx**

```typescript
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  hideCloseButton?: boolean
}

const Modal = ({ isOpen, onClose, title, children, hideCloseButton = false }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (typeof window === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                {title && (
                  <h2 className="text-xl font-semibold text-neutral-800 font-serif">
                    {title}
                  </h2>
                )}
                {!hideCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="absolute right-4 top-4"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
              <div className="p-6">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default Modal
```

- [ ] **Step 4: 创建 Card.tsx**

```typescript
import { forwardRef } from 'react'
import { motion, MotionProps } from 'framer-motion'

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, Omit<MotionProps, 'style'> {
  children: React.ReactNode
  hoverable?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, className, ...props }, ref) => {
    const baseClasses = 'rounded-xl bg-white border border-neutral-200 shadow-sm'
    const hoverClasses = hoverable
      ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer'
      : ''

    const Component = hoverable ? motion.div : 'div'

    return (
      <Component
        ref={ref}
        className={`${baseClasses} ${hoverClasses} ${className || ''}`}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

export default Card
```

- [ ] **Step 5: 创建 Section.tsx**

```typescript
interface SectionProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

const Section = ({ title, subtitle, children, className }: SectionProps) => {
  return (
    <section className={`py-12 ${className || ''}`}>
      {(title || subtitle) && (
        <div className="mb-8 text-center">
          {title && (
            <h2 className="text-3xl font-bold text-neutral-800 font-serif mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-neutral-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

export default Section
```

---

## Task 5: 创建 Supabase 服务和认证 Hook

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\services\supabase.ts`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\hooks\useSupabase.ts`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\hooks\useAuth.ts`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\utils\constants.ts`

- [ ] **Step 1: 创建 utils/constants.ts**

```typescript
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const GAME_TYPES = {
  MONEY_GUA: 'money_gua',
  SHENGBEI: 'shengbei',
  GUANYIN: 'guanyin',
  TAROT: 'tarot',
  BAZI: 'bazi',
} as const

export type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES]

export const MONEY_GUA_COMBINATIONS = {
  LAO_YANG: 'lao_yang',
  LAO_YIN: 'lao_yin',
  SHAO_YANG: 'shao_yang',
  SHAO_YIN: 'shao_yin',
} as const

export type MoneyGuaCombination = typeof MONEY_GUA_COMBINATIONS[keyof typeof MONEY_GUA_COMBINATIONS]

export const SHENGBEI_RESULTS = {
  SHENGBEI: 'shengbei',
  YANG_BEI: 'yang_bei',
  YIN_BEI: 'yin_bei',
} as const

export type ShengbeiResult = typeof SHENGBEI_RESULTS[keyof typeof SHENGBEI_RESULTS]
```

- [ ] **Step 2: 创建 services/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type User = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']
export type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
```

- [ ] **Step 3: 创建 hooks/useSupabase.ts**

```typescript
import { useMemo } from 'react'
import { supabase } from '../services/supabase'

export const useSupabase = () => {
  return useMemo(() => ({ supabase }), [])
}
```

- [ ] **Step 4: 创建 hooks/useAuth.ts**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from './useSupabase'
import type { User, Session } from '../services/supabase'

interface UseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithPhone: (phone: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const { supabase } = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [supabase])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [supabase])

  const signInWithPhone = useCallback(async (phone: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ phone, password })
    if (error) throw error
  }, [supabase])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [supabase])

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithPhone,
    signOut,
  }
}
```

---

## Task 6: 创建首页

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\Home.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\Home\HeroSection.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\Home\GameCard.tsx`

- [ ] **Step 1: 创建 pages/Home/HeroSection.tsx**

```typescript
const HeroSection = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container-max text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-neutral-800 font-serif mb-6">
          问心
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-4 leading-relaxed">
          每一次对命运的探索和好奇，都源自于内心对自我了解的渴望。
        </p>
        <p className="text-neutral-500 mb-12">
          命理探索，手势互动——探索命运的新方式。
        </p>
      </div>
    </section>
  )
}

export default HeroSection
```

- [ ] **Step 2: 创建 pages/Home/GameCard.tsx**

```typescript
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../../components/Card'

interface GameCardProps {
  title: string
  description: string
  path: string
  icon: string
  comingSoon?: boolean
}

const GameCard = ({ title, description, path, icon, comingSoon = false }: GameCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!comingSoon) {
      navigate(path)
    }
  }

  return (
    <motion.div whileHover={{ y: -4 }}>
      <Card
        hoverable={!comingSoon}
        onClick={handleClick}
        className="p-6 h-full relative overflow-hidden"
      >
        {comingSoon && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium text-neutral-500 bg-neutral-100 rounded-full">
              即将上线
            </span>
          </div>
        )}
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-neutral-800 font-serif mb-2">
          {title}
        </h3>
        <p className="text-neutral-600 text-sm">
          {description}
        </p>
      </Card>
    </motion.div>
  )
}

export default GameCard
```

- [ ] **Step 3: 创建 pages/Home.tsx**

```typescript
import HeroSection from './Home/HeroSection'
import GameCard from './Home/GameCard'
import Section from '../components/Section'

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
  return (
    <div className="min-h-screen">
      <HeroSection />
      <Section title="选择玩法" subtitle="多种测算方式，满足你不同的需求">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game, index) => (
            <GameCard key={index} {...game} />
          ))}
        </div>
      </Section>
    </div>
  )
}

export default Home
```

---

## Task 7: 创建 Layout 和 NavigationDrawer 组件

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\components\Layout.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\components\NavigationDrawer.tsx`

- [ ] **Step 1: 创建 NavigationDrawer.tsx**

```typescript
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const games = [
  { title: '每日速测', path: '/daily-speed', icon: '⚡' },
  { title: '观音灵签', path: '/guanyin', icon: '🏮', disabled: true },
  { title: '塔罗牌', path: '/tarot', icon: '✨', disabled: true },
  { title: '八字排盘', path: '/bazi', icon: '📜', disabled: true },
  { title: '历史记录', path: '/history', icon: '📋' },
]

const NavigationDrawer = ({ isOpen, onClose }: NavigationDrawerProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleGameClick = (path: string, disabled: boolean) => {
    if (!disabled) {
      navigate(path)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-xl z-50"
          >
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-800 font-serif">
                问心
              </h2>
            </div>
            <nav className="p-4 space-y-2">
              {games.map((game) => (
                <button
                  key={game.path}
                  onClick={() => handleGameClick(game.path, !!game.disabled)}
                  disabled={game.disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === game.path
                      ? 'bg-neutral-100 text-neutral-800'
                      : game.disabled
                      ? 'text-neutral-400 cursor-not-allowed'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                  }`}
                >
                  <span className="text-xl">{game.icon}</span>
                  <span className="font-medium">{game.title}</span>
                  {game.disabled && (
                    <span className="ml-auto text-xs text-neutral-400">
                      即将上线
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
              <Button variant="ghost" className="w-full" onClick={onClose}>
                返回首页
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NavigationDrawer
```

- [ ] **Step 2: 创建 Layout.tsx**

```typescript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'
import NavigationDrawer from './NavigationDrawer'

interface LayoutProps {
  children: React.ReactNode
  showBackButton?: boolean
}

const Layout = ({ children, showBackButton = false }: LayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false)

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
              <Link to="/" className="text-lg font-semibold text-neutral-800 font-serif hover:text-neutral-600">
                ← 返回
              </Link>
            ) : (
              <Link to="/" className="text-lg font-semibold text-neutral-800 font-serif hover:text-neutral-600">
                问心
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">注册</Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

export default Layout
```

---

## Task 8: 创建金钱卦和掷圣杯的工具函数

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\utils\moneyGua.ts`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\utils\shengbei.ts`

- [ ] **Step 1: 创建 utils/moneyGua.ts**

```typescript
import { MONEY_GUA_COMBINATIONS, type MoneyGuaCombination } from './constants'

export interface Coin {
  side: 'yang' | 'yin'
  image: 'qianlong_front' | 'qianlong_back'
}

export interface MoneyGuaResult {
  coins: Coin[]
  combination: MoneyGuaCombination
  verdict: string
  interpretation: string
}

const interpretations: Record<MoneyGuaCombination, { verdict: string; interpretation: string }> = {
  [MONEY_GUA_COMBINATIONS.LAO_YANG]: {
    verdict: '大吉',
    interpretation: '三枚皆正，老阳之象，纯阳乾健，所求之事大吉大利，宜积极进取。',
  },
  [MONEY_GUA_COMBINATIONS.LAO_YIN]: {
    verdict: '大凶',
    interpretation: '三枚皆反，老阴之象，纯阴坤柔，所求之事阻滞难行，宜静守待时。',
  },
  [MONEY_GUA_COMBINATIONS.SHAO_YANG]: {
    verdict: '吉',
    interpretation: '两正一反，少阳之象，阳气渐生，所求之事可成，但需稳步前行。',
  },
  [MONEY_GUA_COMBINATIONS.SHAO_YIN]: {
    verdict: '平',
    interpretation: '两反一正，少阴之象，阴气渐长，所求之事平顺，但需谨慎行事。',
  },
}

const tossCoin = (): Coin => {
  const isYang = Math.random() > 0.5
  return {
    side: isYang ? 'yang' : 'yin',
    image: isYang ? 'qianlong_front' : 'qianlong_back',
  }
}

export const tossMoneyGua = (): MoneyGuaResult => {
  const coins = [tossCoin(), tossCoin(), tossCoin()]
  const yangCount = coins.filter(c => c.side === 'yang').length

  let combination: MoneyGuaCombination
  if (yangCount === 3) {
    combination = MONEY_GUA_COMBINATIONS.LAO_YANG
  } else if (yangCount === 0) {
    combination = MONEY_GUA_COMBINATIONS.LAO_YIN
  } else if (yangCount === 2) {
    combination = MONEY_GUA_COMBINATIONS.SHAO_YANG
  } else {
    combination = MONEY_GUA_COMBINATIONS.SHAO_YIN
  }

  const { verdict, interpretation } = interpretations[combination]

  return {
    coins,
    combination,
    verdict,
    interpretation,
  }
}
```

- [ ] **Step 2: 创建 utils/shengbei.ts**

```typescript
import { SHENGBEI_RESULTS, type ShengbeiResult as ShengbeiResultType } from './constants'

export interface ShengbeiThrow {
  left: 'yang' | 'yin'
  right: 'yang' | 'yin'
  result: ShengbeiResultType
}

export interface ShengbeiDivinationResult {
  times: 1 | 3
  throws: ShengbeiThrow[]
  final_verdict: string
  interpretation: string
}

const singleThrow = (): ShengbeiThrow => {
  const left = Math.random() > 0.5 ? 'yang' : 'yin'
  const right = Math.random() > 0.5 ? 'yang' : 'yin'

  let result: ShengbeiResultType
  if (left !== right) {
    result = SHENGBEI_RESULTS.SHENGBEI
  } else if (left === 'yang') {
    result = SHENGBEI_RESULTS.YANG_BEI
  } else {
    result = SHENGBEI_RESULTS.YIN_BEI
  }

  return { left, right, result }
}

const interpretSingle = (throwResult: ShengbeiThrow): { verdict: string; interpretation: string } => {
  switch (throwResult.result) {
    case SHENGBEI_RESULTS.SHENGBEI:
      return {
        verdict: '吉',
        interpretation: '圣杯一掷即中，所求之事顺遂。',
      }
    case SHENGBEI_RESULTS.YANG_BEI:
      return {
        verdict: '平',
        interpretation: '阳杯，神明已知，需再诚心祈求。',
      }
    case SHENGBEI_RESULTS.YIN_BEI:
      return {
        verdict: '凶',
        interpretation: '阴杯，所求之事时机未到，宜暂缓。',
      }
  }
}

const interpretThree = (throws: ShengbeiThrow[]): { verdict: string; interpretation: string } => {
  const shengbeiCount = throws.filter(t => t.result === SHENGBEI_RESULTS.SHENGBEI).length

  if (shengbeiCount >= 2) {
    return {
      verdict: '大吉',
      interpretation: `三次掷出 ${shengbeiCount} 次圣杯，所求之事大吉。`,
    }
  } else if (shengbeiCount === 1) {
    return {
      verdict: '吉',
      interpretation: '三次中有一次圣杯，所求之事可成，但需努力。',
    }
  } else {
    return {
      verdict: '平',
      interpretation: '三次皆无圣杯，建议重新祈求，或改日再问。',
    }
  }
}

export const tossShengbei = (times: 1 | 3): ShengbeiDivinationResult => {
  const throws: ShengbeiThrow[] = []

  for (let i = 0; i < times; i++) {
    throws.push(singleThrow())
  }

  const { verdict, interpretation } = times === 1
    ? interpretSingle(throws[0])
    : interpretThree(throws)

  return {
    times,
    throws,
    final_verdict: verdict,
    interpretation,
  }
}
```

---

## Task 9: 创建每日速测页面

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\DailySpeed.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\DailySpeed\MoneyGuaSection.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\DailySpeed\ShengbeiSection.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\DailySpeed\MoneyGuaModal.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\DailySpeed\ShengbeiModal.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\hooks\useMoneyGua.ts`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\hooks\useShengbei.ts`

- [ ] **Step 1: 创建 hooks/useMoneyGua.ts**

```typescript
import { useState, useCallback } from 'react'
import { tossMoneyGua, type MoneyGuaResult } from '../utils/moneyGua'
import confetti from 'canvas-confetti'

export const useMoneyGua = () => {
  const [result, setResult] = useState<MoneyGuaResult | null>(null)
  const [isTossing, setIsTossing] = useState(false)

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f0b429', '#737373', '#e5e5e5'],
    })
  }, [])

  const toss = useCallback(async () => {
    setIsTossing(true)
    setResult(null)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const newResult = tossMoneyGua()
    setResult(newResult)
    setIsTossing(false)

    if (newResult.verdict.includes('吉')) {
      triggerConfetti()
    }
  }, [triggerConfetti])

  const reset = useCallback(() => {
    setResult(null)
    setIsTossing(false)
  }, [])

  return {
    result,
    isTossing,
    toss,
    reset,
  }
}
```

- [ ] **Step 2: 创建 hooks/useShengbei.ts**

```typescript
import { useState, useCallback } from 'react'
import { tossShengbei, type ShengbeiDivinationResult } from '../utils/shengbei'
import confetti from 'canvas-confetti'

export const useShengbei = () => {
  const [result, setResult] = useState<ShengbeiDivinationResult | null>(null)
  const [isTossing, setIsTossing] = useState(false)

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#de911d', '#737373', '#e5e5e5'],
    })
  }, [])

  const toss = useCallback(async (times: 1 | 3) => {
    setIsTossing(true)
    setResult(null)

    const delay = times === 1 ? 1500 : 2500
    await new Promise(resolve => setTimeout(resolve, delay))

    const newResult = tossShengbei(times)
    setResult(newResult)
    setIsTossing(false)

    if (newResult.final_verdict.includes('吉')) {
      triggerConfetti()
    }
  }, [triggerConfetti])

  const reset = useCallback(() => {
    setResult(null)
    setIsTossing(false)
  }, [])

  return {
    result,
    isTossing,
    toss,
    reset,
  }
}
```

- [ ] **Step 3: 创建 pages/DailySpeed/MoneyGuaSection.tsx**

```typescript
import { motion } from 'framer-motion'
import Button from '../../components/Button'

interface MoneyGuaSectionProps {
  onStart: () => void
}

const MoneyGuaSection = ({ onStart }: MoneyGuaSectionProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex-1"
    >
      <div className="h-full bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🪙</div>
        <h3 className="text-2xl font-semibold text-neutral-800 font-serif mb-2">
          金钱卦
        </h3>
        <p className="text-neutral-600 mb-6 max-w-xs">
          三枚乾隆通宝，一掷定吉凶。
        </p>
        <Button onClick={onStart} size="lg">
          开始测算
        </Button>
      </div>
    </motion.div>
  )
}

export default MoneyGuaSection
```

- [ ] **Step 4: 创建 pages/DailySpeed/ShengbeiSection.tsx**

```typescript
import { motion } from 'framer-motion'
import Button from '../../components/Button'

interface ShengbeiSectionProps {
  onStart: () => void
}

const ShengbeiSection = ({ onStart }: ShengbeiSectionProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex-1"
    >
      <div className="h-full bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">🏺</div>
        <h3 className="text-2xl font-semibold text-neutral-800 font-serif mb-2">
          掷圣杯
        </h3>
        <p className="text-neutral-600 mb-6 max-w-xs">
          朱红圣杯，诚心祈求。小事一次，大事三次。
        </p>
        <Button onClick={onStart} size="lg">
          开始测算
        </Button>
      </div>
    </motion.div>
  )
}

export default ShengbeiSection
```

- [ ] **Step 5: 创建 pages/DailySpeed/MoneyGuaModal.tsx**

```typescript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useMoneyGua } from '../../hooks/useMoneyGua'
import type { MoneyGuaResult } from '../../utils/moneyGua'

interface MoneyGuaModalProps {
  isOpen: boolean
  onClose: () => void
}

const CoinAnimation = () => {
  return (
    <div className="flex gap-4 justify-center py-8">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0, -20, 0],
            rotate: [0, 180, 360, 540, 720],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-yellow-900 font-bold shadow-lg"
        >
          乾隆
        </motion.div>
      ))}
    </div>
  )
}

const ResultDisplay = ({ result }: { result: MoneyGuaResult }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="flex gap-4 justify-center mb-6">
        {result.coins.map((coin, index) => (
          <div
            key={index}
            className={`w-16 h-16 rounded-full flex items-center justify-center font-bold shadow-lg ${
              coin.side === 'yang'
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900'
                : 'bg-gradient-to-br from-neutral-600 to-neutral-800 text-white'
            }`}
          >
            {coin.side === 'yang' ? '乾隆' : '通宝'}
          </div>
        ))}
      </div>
      <div className="mb-4">
        <span className={`inline-block px-6 py-2 rounded-full text-lg font-semibold ${
          result.verdict.includes('大')
            ? result.verdict.includes('吉')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            : result.verdict === '吉'
            ? 'bg-green-50 text-green-700'
            : 'bg-neutral-100 text-neutral-700'
        }`}>
          {result.verdict}
        </span>
      </div>
      <p className="text-neutral-600 leading-relaxed">
        {result.interpretation}
      </p>
    </motion.div>
  )
}

const MoneyGuaModal = ({ isOpen, onClose }: MoneyGuaModalProps) => {
  const [question, setQuestion] = useState('')
  const [step, setStep] = useState<'input' | 'tossing' | 'result'>('input')
  const { result, isTossing, toss, reset } = useMoneyGua()

  const handleStart = async () => {
    setStep('tossing')
    await toss()
    setStep('result')
  }

  const handleReset = () => {
    reset()
    setQuestion('')
    setStep('input')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="金钱卦">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-neutral-600 mb-6">
              请默念心中所想之事，然后点击开始测算。
            </p>
            <Input
              label="所求之事（可选）"
              placeholder="请输入你想测算的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mb-6"
            />
            {question && (
              <p className="text-sm text-neutral-500 mb-6">
                输入问题后，本次测算将被记录，方便后续查看。
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={handleClose}>
                取消
              </Button>
              <Button onClick={handleStart}>
                开始测算
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'tossing' && (
          <motion.div
            key="tossing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <CoinAnimation />
            <p className="text-neutral-600">正在掷铜钱...</p>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultDisplay result={result} />
            <div className="flex gap-3 justify-center mt-8">
              <Button variant="secondary" onClick={handleReset}>
                再测一次
              </Button>
              <Button onClick={handleClose}>
                完成
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

export default MoneyGuaModal
```

- [ ] **Step 6: 创建 pages/DailySpeed/ShengbeiModal.tsx**

```typescript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useShengbei } from '../../hooks/useShengbei'
import type { ShengbeiDivinationResult, ShengbeiThrow } from '../../utils/shengbei'

interface ShengbeiModalProps {
  isOpen: boolean
  onClose: () => void
}

const CupAnimation = ({ times }: { times: 1 | 3 }) => {
  return (
    <div className="flex gap-4 justify-center py-8">
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -40, 0],
            rotate: [0, i === 0 ? -30 : 30, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: times === 1 ? 1 : 3,
            delay: i * 0.1,
          }}
          className="w-12 h-16 rounded-t-full bg-gradient-to-b from-red-600 to-red-800 shadow-lg flex items-end justify-center pb-1"
        >
          <div className="w-6 h-2 bg-red-900 rounded-full" />
        </motion.div>
      ))}
    </div>
  )
}

const ResultDisplay = ({ result }: { result: ShengbeiDivinationResult }) => {
  const getCupColor = (side: 'yang' | 'yin') =>
    side === 'yang' ? 'from-red-600 to-red-800' : 'from-neutral-600 to-neutral-800'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="space-y-4 mb-6">
        {result.throws.map((throwResult, index) => (
          <div key={index} className="flex items-center justify-center gap-4">
            {result.times === 3 && (
              <span className="text-neutral-500 w-16 text-right">
                第{index + 1}次：
              </span>
            )}
            <div className="flex gap-2">
              <div className={`w-10 h-14 rounded-t-full bg-gradient-to-b ${getCupColor(throwResult.left)} shadow flex items-end justify-center pb-1`}>
                <div className="w-5 h-1.5 bg-black/20 rounded-full" />
              </div>
              <div className={`w-10 h-14 rounded-t-full bg-gradient-to-b ${getCupColor(throwResult.right)} shadow flex items-end justify-center pb-1`}>
                <div className="w-5 h-1.5 bg-black/20 rounded-full" />
              </div>
            </div>
            <span className="text-neutral-600 w-16 text-left">
              {throwResult.result === 'shengbei' ? '圣杯' : throwResult.result === 'yang_bei' ? '阳杯' : '阴杯'}
            </span>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <span className={`inline-block px-6 py-2 rounded-full text-lg font-semibold ${
          result.final_verdict.includes('大')
            ? result.final_verdict.includes('吉')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            : result.final_verdict === '吉'
            ? 'bg-green-50 text-green-700'
            : 'bg-neutral-100 text-neutral-700'
        }`}>
          {result.final_verdict}
        </span>
      </div>
      <p className="text-neutral-600 leading-relaxed">
        {result.interpretation}
      </p>
    </motion.div>
  )
}

const ShengbeiModal = ({ isOpen, onClose }: ShengbeiModalProps) => {
  const [question, setQuestion] = useState('')
  const [times, setTimes] = useState<1 | 3>(1)
  const [step, setStep] = useState<'select' | 'input' | 'tossing' | 'result'>('select')
  const { result, isTossing, toss, reset } = useShengbei()

  const handleSelectTimes = (selectedTimes: 1 | 3) => {
    setTimes(selectedTimes)
    setStep('input')
  }

  const handleStart = async () => {
    setStep('tossing')
    await toss(times)
    setStep('result')
  }

  const handleReset = () => {
    reset()
    setQuestion('')
    setTimes(1)
    setStep('select')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="掷圣杯">
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-neutral-600 mb-6 text-center">
              请选择掷圣杯的次数
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleSelectTimes(1)}
                className="p-6 rounded-xl border-2 border-neutral-200 hover:border-neutral-800 transition-colors text-center"
              >
                <div className="text-3xl mb-2">1️⃣</div>
                <div className="font-semibold text-neutral-800">掷一次</div>
                <div className="text-sm text-neutral-500">小事速问</div>
              </button>
              <button
                onClick={() => handleSelectTimes(3)}
                className="p-6 rounded-xl border-2 border-neutral-200 hover:border-neutral-800 transition-colors text-center"
              >
                <div className="text-3xl mb-2">3️⃣</div>
                <div className="font-semibold text-neutral-800">掷三次</div>
                <div className="text-sm text-neutral-500">大事慎重</div>
              </button>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={handleClose}>
                取消
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-neutral-600 mb-6">
              请默念心中所想之事，然后点击开始测算。
            </p>
            <Input
              label="所求之事（可选）"
              placeholder="请输入你想测算的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mb-6"
            />
            {question && (
              <p className="text-sm text-neutral-500 mb-6">
                输入问题后，本次测算将被记录，方便后续查看。
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setStep('select')}>
                上一步
              </Button>
              <Button onClick={handleStart}>
                开始测算
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'tossing' && (
          <motion.div
            key="tossing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-4"
          >
            <CupAnimation times={times} />
            <p className="text-neutral-600">正在掷圣杯...</p>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultDisplay result={result} />
            <div className="flex gap-3 justify-center mt-8">
              <Button variant="secondary" onClick={handleReset}>
                再测一次
              </Button>
              <Button onClick={handleClose}>
                完成
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

export default ShengbeiModal
```

- [ ] **Step 7: 创建 pages/DailySpeed.tsx**

```typescript
import { useState } from 'react'
import Layout from '../components/Layout'
import Section from '../components/Section'
import MoneyGuaSection from './DailySpeed/MoneyGuaSection'
import ShengbeiSection from './DailySpeed/ShengbeiSection'
import MoneyGuaModal from './DailySpeed/MoneyGuaModal'
import ShengbeiModal from './DailySpeed/ShengbeiModal'

const DailySpeed = () => {
  const [moneyGuaOpen, setMoneyGuaOpen] = useState(false)
  const [shengbeiOpen, setShengbeiOpen] = useState(false)

  return (
    <Layout showBackButton>
      <div className="container-max py-12">
        <Section title="每日速测" subtitle="一分钟速测问吉凶">
          <div className="flex flex-col md:flex-row gap-6 min-h-[400px]">
            <MoneyGuaSection onStart={() => setMoneyGuaOpen(true)} />
            <ShengbeiSection onStart={() => setShengbeiOpen(true)} />
          </div>
        </Section>
      </div>
      <MoneyGuaModal isOpen={moneyGuaOpen} onClose={() => setMoneyGuaOpen(false)} />
      <ShengbeiModal isOpen={shengbeiOpen} onClose={() => setShengbeiOpen(false)} />
    </Layout>
  )
}

export default DailySpeed
```

---

## Task 10: 创建登录、注册、历史记录页面（占位版本）

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\Login.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\Signup.tsx`
- Create: `D:\claudeCodeProjects\yunshicesuan\frontend\src\pages\History.tsx`

- [ ] **Step 1: 创建 pages/Login.tsx**

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

type LoginMethod = 'email' | 'phone'

const Login = () => {
  const [method, setMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithPhone } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (method === 'email') {
        await signIn(email, password)
      } else {
        await signInWithPhone(phone, password)
      }
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container-max py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-neutral-800 font-serif mb-2">
                登录
              </h1>
              <p className="text-neutral-600">
                欢迎回到问心
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  method === 'email'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                邮箱登录
              </button>
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  method === 'phone'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                手机登录
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {method === 'email' ? (
                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              ) : (
                <Input
                  label="手机号"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              )}
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-600">
              还没有账号？{' '}
              <Link to="/auth/signup" className="text-neutral-800 font-medium hover:underline">
                立即注册
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Login
```

- [ ] **Step 2: 创建 pages/Signup.tsx**

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

type SignupMethod = 'email' | 'phone'

const Signup = () => {
  const [method, setMethod] = useState<SignupMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)

    try {
      await signUp(method === 'email' ? email : phone, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container-max py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-neutral-800 font-serif mb-2">
                注册
              </h1>
              <p className="text-neutral-600">
                开始你的问心之旅
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  method === 'email'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                邮箱注册
              </button>
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  method === 'phone'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                手机注册
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {method === 'email' ? (
                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              ) : (
                <Input
                  label="手机号"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              )}
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="确认密码"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={error}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-600">
              已有账号？{' '}
              <Link to="/auth/login" className="text-neutral-800 font-medium hover:underline">
                立即登录
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Signup
```

- [ ] **Step 3: 创建 pages/History.tsx**

```typescript
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import Section from '../components/Section'
import Card from '../components/Card'

const History = () => {
  return (
    <Layout showBackButton>
      <div className="container-max py-12">
        <Section title="历史记录" subtitle="查看你之前的测算记录">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-neutral-800 font-serif mb-2">
              敬请期待
            </h3>
            <p className="text-neutral-600">
              历史记录功能即将上线，登录后即可查看你的测算记录。
            </p>
          </motion.div>
        </Section>
      </div>
    </Layout>
  )
}

export default History
```

---

## Task 11: 初始化后端项目

**Files:**
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\requirements.txt`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\main.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\.env.example`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\__init__.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\core\__init__.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\core\config.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\models\__init__.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\models\schemas.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\services\__init__.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\services\money_gua.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\services\shengbei.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\api\__init__.py`
- Create: `D:\claudeCodeProjects\yunshicesuan\backend\app\api\daily_speed.py`

- [ ] **Step 1: 创建 backend/requirements.txt**

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
pydantic==2.5.2
supabase==2.0.0
python-multipart==0.0.6
```

- [ ] **Step 2: 创建 backend/.env.example**

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

- [ ] **Step 3: 创建 backend/app/core/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 4: 创建 backend/app/core/__init__.py**

```python
from .config import settings

__all__ = ["settings"]
```

- [ ] **Step 5: 创建 backend/app/models/schemas.py**

```python
from typing import List, Optional, Literal
from pydantic import BaseModel
from datetime import datetime


# Money Gua Types
class Coin(BaseModel):
    side: Literal["yang", "yin"]
    image: Literal["qianlong_front", "qianlong_back"]


class MoneyGuaResult(BaseModel):
    coins: List[Coin]
    combination: Literal["lao_yang", "lao_yin", "shao_yang", "shao_yin"]
    verdict: str
    interpretation: str


class MoneyGuaRequest(BaseModel):
    question: Optional[str] = None


# Shengbei Types
class ShengbeiThrow(BaseModel):
    left: Literal["yang", "yin"]
    right: Literal["yang", "yin"]
    result: Literal["shengbei", "yang_bei", "yin_bei"]


class ShengbeiResult(BaseModel):
    times: Literal[1, 3]
    throws: List[ShengbeiThrow]
    final_verdict: str
    interpretation: str


class ShengbeiRequest(BaseModel):
    times: Literal[1, 3]
    question: Optional[str] = None


# Record Types
class DivinationRecordCreate(BaseModel):
    type: Literal["money_gua", "shengbei", "guanyin", "tarot", "bazi"]
    question: Optional[str] = None
    result: dict


class DivinationRecord(BaseModel):
    id: str
    user_id: str
    type: str
    question: Optional[str] = None
    result: dict
    created_at: datetime

    class Config:
        from_attributes = True
```

- [ ] **Step 6: 创建 backend/app/models/__init__.py**

```python
from .schemas import (
    Coin,
    MoneyGuaResult,
    MoneyGuaRequest,
    ShengbeiThrow,
    ShengbeiResult,
    ShengbeiRequest,
    DivinationRecordCreate,
    DivinationRecord,
)

__all__ = [
    "Coin",
    "MoneyGuaResult",
    "MoneyGuaRequest",
    "ShengbeiThrow",
    "ShengbeiResult",
    "ShengbeiRequest",
    "DivinationRecordCreate",
    "DivinationRecord",
]
```

- [ ] **Step 7: 创建 backend/app/services/money_gua.py**

```python
import random
from typing import List, Literal
from app.models import Coin, MoneyGuaResult


MONEY_GUA_COMBINATIONS = {
    "LAO_YANG": "lao_yang",
    "LAO_YIN": "lao_yin",
    "SHAO_YANG": "shao_yang",
    "SHAO_YIN": "shao_yin",
}


INTERPRETATIONS = {
    "lao_yang": {
        "verdict": "大吉",
        "interpretation": "三枚皆正，老阳之象，纯阳乾健，所求之事大吉大利，宜积极进取。",
    },
    "lao_yin": {
        "verdict": "大凶",
        "interpretation": "三枚皆反，老阴之象，纯阴坤柔，所求之事阻滞难行，宜静守待时。",
    },
    "shao_yang": {
        "verdict": "吉",
        "interpretation": "两正一反，少阳之象，阳气渐生，所求之事可成，但需稳步前行。",
    },
    "shao_yin": {
        "verdict": "平",
        "interpretation": "两反一正，少阴之象，阴气渐长，所求之事平顺，但需谨慎行事。",
    },
}


def _toss_coin() -> Coin:
    is_yang = random.random() > 0.5
    return Coin(
        side="yang" if is_yang else "yin",
        image="qianlong_front" if is_yang else "qianlong_back",
    )


def toss_money_gua() -> MoneyGuaResult:
    coins: List[Coin] = [_toss_coin(), _toss_coin(), _toss_coin()]
    yang_count = sum(1 for coin in coins if coin.side == "yang")

    combination: Literal["lao_yang", "lao_yin", "shao_yang", "shao_yin"]
    if yang_count == 3:
        combination = MONEY_GUA_COMBINATIONS["LAO_YANG"]
    elif yang_count == 0:
        combination = MONEY_GUA_COMBINATIONS["LAO_YIN"]
    elif yang_count == 2:
        combination = MONEY_GUA_COMBINATIONS["SHAO_YANG"]
    else:
        combination = MONEY_GUA_COMBINATIONS["SHAO_YIN"]

    verdict = INTERPRETATIONS[combination]["verdict"]
    interpretation = INTERPRETATIONS[combination]["interpretation"]

    return MoneyGuaResult(
        coins=coins,
        combination=combination,
        verdict=verdict,
        interpretation=interpretation,
    )
```

- [ ] **Step 8: 创建 backend/app/services/shengbei.py**

```python
import random
from typing import List, Literal
from app.models import ShengbeiThrow, ShengbeiResult


SHENGBEI_RESULTS = {
    "SHENGBEI": "shengbei",
    "YANG_BEI": "yang_bei",
    "YIN_BEI": "yin_bei",
}


def _single_throw() -> ShengbeiThrow:
    left = "yang" if random.random() > 0.5 else "yin"
    right = "yang" if random.random() > 0.5 else "yin"

    result: Literal["shengbei", "yang_bei", "yin_bei"]
    if left != right:
        result = SHENGBEI_RESULTS["SHENGBEI"]
    elif left == "yang":
        result = SHENGBEI_RESULTS["YANG_BEI"]
    else:
        result = SHENGBEI_RESULTS["YIN_BEI"]

    return ShengbeiThrow(left=left, right=right, result=result)


def _interpret_single(throw_result: ShengbeiThrow) -> dict:
    if throw_result.result == SHENGBEI_RESULTS["SHENGBEI"]:
        return {
            "verdict": "吉",
            "interpretation": "圣杯一掷即中，所求之事顺遂。",
        }
    elif throw_result.result == SHENGBEI_RESULTS["YANG_BEI"]:
        return {
            "verdict": "平",
            "interpretation": "阳杯，神明已知，需再诚心祈求。",
        }
    else:
        return {
            "verdict": "凶",
            "interpretation": "阴杯，所求之事时机未到，宜暂缓。",
        }


def _interpret_three(throws: List[ShengbeiThrow]) -> dict:
    shengbei_count = sum(1 for t in throws if t.result == SHENGBEI_RESULTS["SHENGBEI"])

    if shengbei_count >= 2:
        return {
            "verdict": "大吉",
            "interpretation": f"三次掷出 {shengbei_count} 次圣杯，所求之事大吉。",
        }
    elif shengbei_count == 1:
        return {
            "verdict": "吉",
            "interpretation": "三次中有一次圣杯，所求之事可成，但需努力。",
        }
    else:
        return {
            "verdict": "平",
            "interpretation": "三次皆无圣杯，建议重新祈求，或改日再问。",
        }


def toss_shengbei(times: Literal[1, 3]) -> ShengbeiResult:
    throws: List[ShengbeiThrow] = []

    for _ in range(times):
        throws.append(_single_throw())

    if times == 1:
        interpretation = _interpret_single(throws[0])
    else:
        interpretation = _interpret_three(throws)

    return ShengbeiResult(
        times=times,
        throws=throws,
        final_verdict=interpretation["verdict"],
        interpretation=interpretation["interpretation"],
    )
```

- [ ] **Step 9: 创建 backend/app/services/__init__.py**

```python
from .money_gua import toss_money_gua
from .shengbei import toss_shengbei

__all__ = ["toss_money_gua", "toss_shengbei"]
```

- [ ] **Step 10: 创建 backend/app/api/daily_speed.py**

```python
from fastapi import APIRouter, HTTPException
from app.models import (
    MoneyGuaResult,
    MoneyGuaRequest,
    ShengbeiResult,
    ShengbeiRequest,
)
from app.services import toss_money_gua, toss_shengbei

router = APIRouter(prefix="/daily-speed", tags=["daily-speed"])


@router.post("/money-gua", response_model=MoneyGuaResult)
async def money_gua_divination(request: MoneyGuaRequest) -> MoneyGuaResult:
    """
    Perform a money gua divination.
    """
    try:
        result = toss_money_gua()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to perform divination")


@router.post("/shengbei", response_model=ShengbeiResult)
async def shengbei_divination(request: ShengbeiRequest) -> ShengbeiResult:
    """
    Perform a shengbei divination.
    """
    try:
        result = toss_shengbei(request.times)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to perform divination")
```

- [ ] **Step 11: 创建 backend/app/api/__init__.py**

```python
from fastapi import APIRouter
from .daily_speed import router as daily_speed_router

api_router = APIRouter(prefix="/api")

api_router.include_router(daily_speed_router)

__all__ = ["api_router"]
```

- [ ] **Step 12: 创建 backend/app/__init__.py**

```python
# This file intentionally left blank to mark the directory as a Python package.
```

- [ ] **Step 13: 创建 backend/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router

app = FastAPI(title="问心 - 运势测算 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "问心 - 运势测算 API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

## Task 12: 测试前端项目

**Files:** （无新文件，运行已有代码）

- [ ] **Step 1: 安装前端依赖**

```bash
cd "D:\claudeCodeProjects\yunshicesuan\frontend"
npm install
```

- [ ] **Step 2: 配置 Supabase 环境变量**
  - 编辑 `frontend/.env.local`，填入正确的 Supabase URL 和 Anon Key

- [ ] **Step 3: 启动前端开发服务器**

```bash
cd "D:\claudeCodeProjects\yunshicesuan\frontend"
npm run dev
```

预期：开发服务器在 http://localhost:3000 启动，无编译错误

- [ ] **Step 4: 验证首页**
  - 访问 http://localhost:3000
  - 确认显示Slogan和4个玩法卡片
  - 点击"每日速测"卡片，跳转到每日速测页面

- [ ] **Step 5: 验证每日速测页面**
  - 确认显示金钱卦和掷圣杯两个模块
  - 鼠标悬停模块，确认有放大浮动效果
  - 点击"开始测算"，确认弹窗打开
  - 在弹窗内测试完整流程

- [ ] **Step 6: 停止开发服务器**
  - 按 Ctrl+C 停止

---

## Task 13: 测试后端项目

**Files:** （无新文件，运行已有代码）

- [ ] **Step 1: 创建 Python 虚拟环境**

```bash
cd "D:\claudeCodeProjects\yunshicesuan\backend"
python -m venv venv
```

- [ ] **Step 2: 激活虚拟环境并安装依赖**

Windows:
```bash
cd "D:\claudeCodeProjects\yunshicesuan\backend"
venv\Scripts\activate
pip install -r requirements.txt
```

Mac/Linux:
```bash
cd "D:\claudeCodeProjects\yunshicesuan\backend"
source venv/bin/activate
pip install -r requirements.txt
```

- [ ] **Step 3: 配置环境变量**
  - 复制 `backend/.env.example` 为 `backend/.env`
  - 填入正确的 Supabase 凭据

- [ ] **Step 4: 启动后端服务器**

```bash
cd "D:\claudeCodeProjects\yunshicesuan\backend"
python main.py
```

预期：服务器在 http://localhost:8000 启动

- [ ] **Step 5: 测试健康检查端点**

```bash
curl http://localhost:8000/health
```

预期：返回 `{"status": "healthy"}`

- [ ] **Step 6: 测试金钱卦 API**

```bash
curl -X POST http://localhost:8000/api/daily-speed/money-gua \
  -H "Content-Type: application/json" \
  -d '{"question": "测试"}'
```

预期：返回金钱卦结果 JSON

- [ ] **Step 7: 测试掷圣杯 API**

```bash
curl -X POST http://localhost:8000/api/daily-speed/shengbei \
  -H "Content-Type: application/json" \
  -d '{"times": 1, "question": "测试"}'
```

预期：返回掷圣杯结果 JSON

- [ ] **Step 8: 停止后端服务器**
  - 按 Ctrl+C 停止

---

## 阶段一完成检查清单

- [ ] Supabase 项目已创建并配置
- [ ] 数据库表已创建
- [ ] 前端项目初始化完成
- [ ] 所有通用组件已创建
- [ ] 首页已创建并可正常访问
- [ ] 每日速测页面已创建，金钱卦和掷圣杯可正常使用
- [ ] 登录、注册页面（占位版）已创建
- [ ] 历史记录页面（占位版）已创建
- [ ] 后端项目初始化完成
- [ ] 金钱卦和掷圣杯的测算逻辑已实现
- [ ] 前端和后端 API 联调成功
- [ ] 动画效果正常工作
- [ ] 页面响应式布局测试通过

---

## 后续阶段（预留）

### 阶段二：手势控制
- 集成 MediaPipe Hands
- 实现手势识别（摇、抛、左挥、右挥、上挥）
- 手势触发测算
- 摄像头权限处理和降级方案

### 阶段三：玩法二、三、四
- 观音灵签
- 塔罗牌
- 八字排盘
- 历史记录功能完善
- 测算记录的增删查改

