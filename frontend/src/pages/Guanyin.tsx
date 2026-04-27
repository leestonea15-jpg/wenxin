import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GUANYIN_PAGE_STATES } from '../utils/constants'
//import { useGuanyin } from '../hooks/useGuanyin'
import { useGuanyinAgent } from '../hooks/useGuanyinAgent'
import { useGuanyinGesture, type GuanyinGestureType } from '../hooks/useGuanyinGesture'
import { ParticleScene } from './Guanyin/ParticleScene'
import { StickDisplay } from './Guanyin/StickDisplay'
import { ChatArea } from './Guanyin/ChatArea'
import { GuanyinControls } from './Guanyin/GuanyinControls'
import { GuanyinNoise } from './Guanyin/GuanyinNoise'
import { useAuthStore } from '../store/auth'

export const Guanyin = () => {
  const navigate = useNavigate()
  const [showChat, setShowChat] = useState(false)
  const [showStick, setShowStick] = useState(true)
  const { user } = useAuthStore()

  const {
    pageState,
    question,
    setQuestion,
    selectedStick,
    conversation,
    isLoading,
    error,
    highlightInput,
    focusInput,
    blurInput,
    selectGestureMode,
    selectMouseMode,
    gestureDraw,
    onMouseLongPress,
    onMouseRelease,
    sendFollowup,
    retry,
    reset,
    ensureInterpretation,
  } = useGuanyinAgent({ userId: user?.id, useLegacy: true })

  // 页面刚进入时启用摄像头
  const gestureMode = pageState === GUANYIN_PAGE_STATES.GESTURE_MODE ? 'drawing' : 'idle'
  console.log('Guanyin.tsx - pageState:', pageState, 'gestureMode:', gestureMode)

  const {
    handPosition,
    cameraReady,
    startCamera,
    stopCamera,
    videoRef,
    isWaving,
    handIsUp,
  } = useGuanyinGesture({
    enabled: pageState === GUANYIN_PAGE_STATES.IDLE ||
             pageState === GUANYIN_PAGE_STATES.GESTURE_MODE,
    mode: gestureMode,
    onGestureDetected: (gesture: GuanyinGestureType) => {
      console.log('Guanyin.tsx - onGestureDetected:', gesture)
      if (pageState === GUANYIN_PAGE_STATES.GESTURE_MODE && gesture === 'draw') {
        gestureDraw()
      }
    },
  })

  // 页面加载时自动启动摄像头
  useEffect(() => {
    startCamera().catch(err => {
      console.warn('Camera start failed:', err)
    })
    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  // 出签后显示签文（不自动弹聊天）
  useEffect(() => {
    if (pageState === GUANYIN_PAGE_STATES.RESULT && selectedStick) {
      setShowStick(true)
      setShowChat(false)  // 不自动弹解读！
    }
  }, [pageState, selectedStick])

  // 映射状态到ParticleScene
  const getParticleMode = () => {
    switch (pageState) {
      case GUANYIN_PAGE_STATES.IDLE:
      case GUANYIN_PAGE_STATES.INPUT_FOCUSED:
        return 'idle'
      case GUANYIN_PAGE_STATES.GESTURE_MODE:
        return 'gesture'
      case GUANYIN_PAGE_STATES.MOUSE_MODE:
        return 'mouse'
      case GUANYIN_PAGE_STATES.DRAWING:
        return 'drawing'
      case GUANYIN_PAGE_STATES.RESULT:
        return 'result'
      default:
        return 'idle'
    }
  }

  return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden">
      {/* 隐藏的video元素，用于MediaPipe */}
      <video
        ref={videoRef}
        className="hidden"
      />

      {/* 返回按钮 */}
      <button
        onClick={() => {
          stopCamera()
          navigate('/')
        }}
        className="absolute top-4 left-4 z-40 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-lg flex items-center gap-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      {/* Three.js粒子场景 */}
      <div className="absolute inset-0">
        <ParticleScene
          mode={getParticleMode()}
          handPosition={handPosition}
          isWaving={isWaving}
          handIsUp={handIsUp}
          stickLevel={selectedStick?.level || null}
          onMouseLongPress={onMouseLongPress}
          onMouseRelease={onMouseRelease}
        />
      </div>

      {/* CCD复古噪点滤镜 */}
      <GuanyinNoise />

      {/* 输入框和按钮（仅在idle和input_focused状态显示） */}
      <AnimatePresence>
        {(pageState === GUANYIN_PAGE_STATES.IDLE || pageState === GUANYIN_PAGE_STATES.INPUT_FOCUSED) && (
          <GuanyinControls
            question={question}
            onQuestionChange={setQuestion}
            onQuestionFocus={focusInput}
            onQuestionBlur={blurInput}
            onGestureMode={selectGestureMode}
            onMouseMode={selectMouseMode}
            cameraReady={cameraReady}
            pageState={pageState}
            highlightInput={highlightInput}
          />
        )}
      </AnimatePresence>


      {/* 抽签中提示 */}
      <AnimatePresence>
        {pageState === GUANYIN_PAGE_STATES.DRAWING && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/50"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-xl font-semibold">抽签中...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 签文展示弹窗 */}
      <AnimatePresence>
        {pageState === GUANYIN_PAGE_STATES.RESULT && selectedStick && showStick && (
          <StickDisplay
            stick={selectedStick}
            onClose={() => {
              setShowStick(false)
            }}
            onRetry={() => {
              setShowChat(false)
              setShowStick(true)
              retry()
            }}
            onInterpret={async () => {
              setShowChat(true)
              await ensureInterpretation()
            }}
          />
        )}
      </AnimatePresence>

      {/* 聊天区域（右侧边栏） */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute right-0 top-0 h-full w-[500px] z-50"
          >
            <ChatArea
              conversation={conversation}
              isLoading={isLoading}
              onSendMessage={sendFollowup}
              onClose={() => setShowChat(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 浮动按钮组 - 仅在结果状态显示 */}
      <AnimatePresence>
        {pageState === GUANYIN_PAGE_STATES.RESULT && selectedStick && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-8 z-[60] flex flex-col gap-3"
          >
            <button
              onClick={() => {
                reset()
                setShowChat(false)
                setShowStick(true)
              }}
              className="px-5 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:opacity-90 text-white rounded-xl font-medium shadow-lg transition-opacity flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新抽签
            </button>
            {!showChat && (
              <button
                onClick={async () => {
                  setShowChat(true)
                  await ensureInterpretation()
                }}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 text-white rounded-xl font-medium shadow-lg transition-opacity flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                专业解读
              </button>
            )}
            {!showStick && (
              <button
                onClick={() => setShowStick(true)}
                className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium shadow-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                查看签文
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-red-900/90 border border-red-600 rounded-xl px-6 py-4 text-white">
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
