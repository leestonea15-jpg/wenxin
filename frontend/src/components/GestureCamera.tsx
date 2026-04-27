import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import QianlongTongbao from './icons/QianlongTongbao'
import Shengbei from './icons/Shengbei'

type GestureState = 'waiting' | 'detecting' | 'success' | 'failed'

interface GestureCameraProps {
  videoRef: React.RefObject<HTMLVideoElement>
  type: 'money_gua' | 'shengbei'
  state: GestureState
  gestureInstruction: string
  onAnimationComplete?: () => void
  onDirectStart?: () => void
  onVideoReady?: () => void // 新增：video元素准备好的回调
}

const GestureCamera = ({
  videoRef,
  type,
  state,
  gestureInstruction,
  onAnimationComplete,
  onDirectStart,
  onVideoReady,
}: GestureCameraProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 当video元素挂载后通知父组件
  useEffect(() => {
    if (videoRef.current && onVideoReady) {
      console.log('[GestureCamera] Video element mounted, calling onVideoReady')
      onVideoReady()
    }
  }, [videoRef.current, onVideoReady])

  // 道具动画完成回调
  useEffect(() => {
    if (state === 'success' && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state, onAnimationComplete])

  // 10秒超时转failed（在父组件处理）

  const getStatusText = () => {
    switch (state) {
      case 'waiting':
        return gestureInstruction
      case 'detecting':
        return '🎯 识别中...'
      case 'success':
        return '✅ 识别成功！'
      case 'failed':
        return '⚠️ 未检测到手势，请再试一次，或点击下方跳过'
      default:
        return ''
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-gradient-to-b from-neutral-900 to-black">
      {/* 摄像头元素（隐藏，仅用于MediaPipe手势识别） */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />

      {/* 半透明叠加层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40">
        {/* 顶部半透明栏 */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-black/30 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="text-white">
            {/* 返回按钮在父组件Modal中 */}
          </div>
          <div className="text-white/70 text-sm">
            {type === 'money_gua' ? '金钱卦' : '掷圣杯'}
          </div>
        </div>

        {/* 中央道具 - 大尺寸 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {type === 'money_gua' ? (
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={
                    state === 'success'
                      ? {
                          y: [0, -60, 0, -40, 0],
                          rotate: [0, 360, 720, 1080, 1440],
                          scale: [1, 1.2, 1],
                        }
                      : state === 'detecting'
                      ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: state === 'detecting' ? Infinity : 0,
                    delay: i * 0.1,
                  }}
                >
                  <QianlongTongbao size={180} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              animate={
                state === 'success'
                  ? { y: [0, -100, 0], rotate: [0, 15, -15, 0] }
                  : state === 'detecting'
                  ? { y: [0, -15, 0] }
                  : {}
              }
              transition={{
                duration: 1,
                repeat: state === 'detecting' ? Infinity : 0,
              }}
            >
              <Shengbei size={700} gap={6} />
            </motion.div>
          )}

          {/* 识别中状态的加载动画 */}
          {state === 'detecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* 识别成功状态的星星动画 */}
          {state === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-8 -right-8 text-4xl"
            >
              ✨
            </motion.div>
          )}
        </div>

        {/* 左下角手势示意图 */}
        <div className="absolute bottom-28 left-6 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-white/80 mb-1">手势示意：</div>
          <div className="text-3xl text-white">
            {type === 'money_gua' ? '✊ ↕️' : '🖐️⬆️'}
          </div>
        </div>
      </div>

      {/* 底部提示框 - 低调样式 */}
      <div className="absolute bottom-6 left-6 right-6">
        <div
          className={`rounded-xl p-4 text-center ${
            state === 'success'
              ? 'bg-green-500/80 text-white'
              : state === 'failed'
              ? 'bg-red-500/80 text-white'
              : 'bg-white/40 text-white backdrop-blur-sm'
          }`}
        >
          <p className="text-sm md:text-base whitespace-pre-line">
            {getStatusText()}
          </p>
        </div>

        {/* 失败状态的直接开始按钮 */}
        {state === 'failed' && onDirectStart && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onDirectStart}
              className="px-6 py-2 bg-white text-neutral-800 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              跳过
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GestureCamera