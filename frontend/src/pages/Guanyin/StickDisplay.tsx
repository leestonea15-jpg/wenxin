import { motion, AnimatePresence } from 'framer-motion'
import { GUANYIN_LEVELS, type GuanyinLevel } from '../../utils/constants'
import type { GuanyinStick } from '../../utils/guanyin'

interface StickDisplayProps {
  stick: GuanyinStick
  onClose?: () => void
  onRetry?: () => void
  onInterpret?: () => void
}

const getLevelColor = (level: GuanyinLevel) => {
  switch (level) {
    case GUANYIN_LEVELS.TOP_TOP:
      return { bg: 'from-yellow-500 to-yellow-600', text: 'text-yellow-500', border: 'border-yellow-500' }
    case GUANYIN_LEVELS.TOP:
      return { bg: 'from-orange-500 to-orange-600', text: 'text-orange-500', border: 'border-orange-500' }
    case GUANYIN_LEVELS.MIDDLE:
      return { bg: 'from-gray-400 to-gray-500', text: 'text-gray-400', border: 'border-gray-400' }
    case GUANYIN_LEVELS.BOTTOM:
      return { bg: 'from-gray-500 to-gray-600', text: 'text-gray-500', border: 'border-gray-500' }
    case GUANYIN_LEVELS.BOTTOM_BOTTOM:
      return { bg: 'from-gray-600 to-gray-700', text: 'text-gray-600', border: 'border-gray-600' }
    default:
      return { bg: 'from-gray-400 to-gray-500', text: 'text-gray-400', border: 'border-gray-400' }
  }
}

export const StickDisplay = ({ stick, onClose, onRetry, onInterpret }: StickDisplayProps) => {
  const colors = getLevelColor(stick.level)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* 背景遮罩 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black"
        />

        {/* 签文卡片 */}
        <motion.div
          className="relative max-w-lg w-full bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* 顶部等级标签 */}
          <div className={`bg-gradient-to-r ${colors.bg} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <span className="text-white text-xl font-bold">第{stick.id}签</span>
              <span className="text-white text-lg font-semibold bg-white/20 px-3 py-1 rounded-full">
                {stick.level}
              </span>
            </div>
            <h2 className="text-white text-2xl font-bold mt-2">{stick.title}</h2>
          </div>

          {/* 内容区域 */}
          <div className="p-6 space-y-6">
            {/* 签诗 */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${colors.text}`}>签诗</h3>
              <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                {stick.poem}
              </p>
            </div>

            {/* 典故 */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${colors.text}`}>典故</h3>
              <p className="text-gray-400 leading-relaxed">
                {stick.story}
              </p>
            </div>

            {/* 释义 */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${colors.text}`}>释义</h3>
              <p className="text-gray-300 leading-relaxed">
                {stick.meaning}
              </p>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="px-6 pb-6 flex flex-col gap-4">
            {/* 专业解读按钮（更显眼） */}
            {onInterpret && (
              <button
                onClick={onInterpret}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 text-white rounded-xl font-medium shadow-lg transition-opacity flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                专业解读
              </button>
            )}
            {/* 其他按钮 */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                关闭
              </button>
              <button
                onClick={onRetry}
                className={`flex-1 py-3 px-4 bg-gradient-to-r ${colors.bg} hover:opacity-90 text-white rounded-xl font-medium transition-opacity`}
              >
                再测一次
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
