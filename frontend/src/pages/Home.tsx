import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import HeroSection from './Home/HeroSection'
import GameCard from './Home/GameCard'
import DailyFortune from './Home/DailyFortune'
import Section from '../components/Section'
import LoginModal from '../components/LoginModal'
import { useAuthStore } from '../store/auth'

const games = [
  {
    title: '每日速测',
    description: '一分钟速测问吉凶，金钱卦、掷圣杯两种玩法。',
    path: '/daily-speed',
    icon: '⚡',
    isCore: true,
  },
  {
    title: '观音灵签',
    description: '虔诚祈求，观音赐签。',
    path: '/guanyin',
    icon: '🏮',
    isCore: true,
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

const trustFeatures = [
  {
    icon: '🌿',
    title: '心诚则灵',
    description: '每一次叩问，都有回响',
  },
  {
    icon: '🔐',
    title: '隐私保护',
    description: '所有测算仅本地处理，数据永不泄露',
  },
  {
    icon: '🎯',
    title: '专注体验',
    description: '无弹窗、无强制分享，专注你的每一次探索',
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
    <Layout>
      <div className="bg-gradient-to-b from-[#fffaf5] to-white">
        <HeroSection />
        <Section title="选择模式" subtitle="命理探索，手势互动——探索命运的新方式">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {games.map((game, index) => (
              <GameCard
                key={index}
                {...game}
                onClick={() => handleGameClick(game.path, game.comingSoon)}
              />
            ))}
          </div>
        </Section>

        {/* 今日运势 */}
        <DailyFortune />

        {/* 信任模块 */}
        <div className="py-8 bg-white">
          <div className="container-max px-4">
            <div className="text-center mb-6">
              <p className="text-base md:text-lg font-medium text-gray-800">
                「问心」—— 不止是测算，更是与自我对话的方式
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {trustFeatures.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl md:text-2xl mb-2">{feature.icon}</div>
                  <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-1">{feature.title}</h3>
                  <p className="text-xs md:text-sm font-light text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="py-8">
        <div className="container-max px-4 text-center">
          <div className="flex items-center justify-center gap-4 text-xs font-light text-gray-400">
            <span>© 2026 问心</span>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-gray-600 transition-colors">隐私政策</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-gray-600 transition-colors">用户协议</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-gray-600 transition-colors">联系我们</a>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false)
          setPendingPath(null)
        }}
        onSuccess={handleLoginSuccess}
      />
    </Layout>
  )
}

export default Home
