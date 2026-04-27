import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const games = [
  { title: '每日速测', path: '/daily-speed', icon: '⚡' },
  { title: '观音灵签', path: '/guanyin', icon: '🏮' },
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
