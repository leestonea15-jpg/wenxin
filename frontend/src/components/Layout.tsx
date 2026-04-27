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
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
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
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/mall" className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors hidden sm:block">
              商城
            </Link>
            <Link to="/vip" className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors hidden sm:block">
              开通会员
            </Link>
            <button className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors hidden sm:block">
              使用指南
            </button>
            <button className="text-sm text-neutral-600 hover:text-neutral-800 transition-colors hidden sm:block">
              关于
            </button>
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform"
              >
                {user.nickname?.[0] || '用'}
              </button>
            ) : (
              <Button size="sm" onClick={() => setLoginModalOpen(true)}>
                登录
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <NavigationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  )
}

export default Layout
