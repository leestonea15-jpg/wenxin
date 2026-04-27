import { motion } from 'framer-motion'
import Button from '../../components/Button'

interface GuanyinControlsProps {
  question: string
  onQuestionChange: (value: string) => void
  onQuestionFocus: () => void
  onQuestionBlur: () => void
  onGestureMode: () => void
  onMouseMode: () => void
  cameraReady: boolean
  pageState: string
  highlightInput?: boolean
}

export const GuanyinControls = ({
  question,
  onQuestionChange,
  onQuestionFocus,
  onQuestionBlur,
  onGestureMode,
  onMouseMode,
  cameraReady,
  pageState,
  highlightInput = false,
}: GuanyinControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-0 left-0 right-0 z-30"
    >
      <div
        className="backdrop-blur-xl border-t border-white/10 px-8 py-6"
        style={{
          background: 'linear-gradient(to top, rgba(20, 10, 30, 0.95) 0%, rgba(20, 10, 30, 0.75) 50%, rgba(20, 10, 30, 0.4) 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-6">
            {/* 标题 */}
            <div className="flex-shrink-0">
              <h2 className="text-white text-xl font-bold tracking-wide">
                观音灵签
              </h2>
            </div>

            {/* 问题输入框 */}
            <div className="flex-1">
              <input
                type="text"
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                onFocus={onQuestionFocus}
                onBlur={onQuestionBlur}
                placeholder="请输入你所问之事"
                className={`w-full bg-white/5 border rounded-xl px-5 py-3.5 text-white placeholder-white/50 focus:outline-none text-base transition-all ${
                  highlightInput
                    ? 'border-red-500 ring-2 ring-red-500/50'
                    : 'border-white/20 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-500/30'
                }`}
              />
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3 flex-shrink-0">
              <Button
                onClick={onGestureMode}
                className="gap-2 py-3 px-6 text-base font-semibold relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #9932cc 100%)',
                }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-all duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
                  }}
                />
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 003 0v-6a1.5 1.5 0 00-3 0m0 6h3m-3 0H4m13 0h3" />
                </svg>
                <span className="relative z-10">手势控制</span>
              </Button>

              <Button
                onClick={onMouseMode}
                variant="secondary"
                className="gap-2 py-3 px-6 text-base font-semibold relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #00CED1 0%, #B0E0E6 100%)',
                }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-all duration-300" />
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span className="relative z-10">鼠标控制</span>
              </Button>
            </div>
          </div>

          {/* 提示文字 */}
          <p className="text-white/50 text-xs mt-3 text-center">
            {pageState === 'input_focused'
              ? '输入你的问题，然后选择抽签方式'
              : cameraReady
                ? '摄像头已就绪，挥手可以与粒子互动'
                : '请允许摄像头权限以体验手势控制'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
