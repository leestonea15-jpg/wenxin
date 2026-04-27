import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import Input from '../../components/Input'
import GestureCamera from '../../components/GestureCamera'
import { useMoneyGua } from '../../hooks/useMoneyGua'
import { useGestureControl } from '../../hooks/useGestureControl'
import type { MoneyGuaResult } from '../../utils/moneyGua'

interface MoneyGuaModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

type ModalMode = 'input' | 'permission' | 'gesture_waiting' | 'gesture_detecting' | 'gesture_success' | 'gesture_failed' | 'animating' | 'result' | 'click_tossing'

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
          className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-yellow-90 font-bold shadow-lg"
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
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-90'
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
              ? 'bg-green-100 text-green-80'
              : 'bg-red-100 text-red-80'
            : result.verdict === '吉'
            ? 'bg-green-50 text-green-70'
            : 'bg-neutral-100 text-neutral-70'
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

const MoneyGuaModal = ({ isOpen, onClose, onComplete }: MoneyGuaModalProps) => {
  const [question, setQuestion] = useState('')
  const [mode, setMode] = useState<ModalMode>('input')
  const [cameraError, setCameraError] = useState('')
  const { result, toss, reset } = useMoneyGua()

  // console.log('[MoneyGuaModal] Current mode:', mode)

  const {
    videoRef,
    startCamera,
    stopCamera,
    stopDetection,
  } = useGestureControl({
    enabled: isOpen,
    targetGesture: 'shake',
    onGestureDetected: async (gesture) => {
      console.log('[MoneyGuaModal] ===== Gesture detected! =====', gesture)
      if (gesture === 'shake' && (mode === 'gesture_waiting' || mode === 'gesture_detecting')) {
        console.log('[MoneyGuaModal] Starting toss...')
        setMode('gesture_detecting')
        await toss()
        setMode('gesture_success')
        console.log('[MoneyGuaModal] Toss complete, showing success')
      }
    },
  })

  // 当video元素就绪时，启动摄像头
  const handleVideoReady = useCallback(() => {
    console.log('[MoneyGuaModal] handleVideoReady called')
    startCamera().catch(err => {
      console.error('[MoneyGuaModal] Error starting camera:', err)
      setCameraError('无法访问摄像头，请检查权限设置')
    })
  }, [startCamera])

  // 超时检测已移除 - 永不超时

  // 调用onComplete
  useEffect(() => {
    if ((mode === 'result' || mode === 'animating') && onComplete) {
      onComplete()
    }
  }, [mode, onComplete])

  // 动画完成后显示结果
  const handleAnimationComplete = () => {
    console.log('[MoneyGuaModal] Animation complete, showing result')
    if (result) {
      setMode('result')
    }
  }

  // 启动摄像头 - 先切换模式（让GestureCamera挂载）
  const handleStartCamera = () => {
    console.log('[MoneyGuaModal] handleStartCamera called')
    setCameraError('')
    console.log('[MoneyGuaModal] Setting mode to gesture_waiting...')
    setMode('gesture_waiting')
    // 摄像头会在GestureCamera的onVideoReady回调中启动
  }


  // 直接开始函数
  const handleDirectStart = async () => {
    console.log('[MoneyGuaModal] Direct start')
    setMode('click_tossing')
    await toss()
    setMode('result')
  }

  // 点击模式的测算
  const handleClickStart = async () => {
    console.log('[MoneyGuaModal] Click start')
    setMode('click_tossing')
    await toss()
    setMode('result')
  }

  const handleReset = () => {
    console.log('[MoneyGuaModal] Resetting...')
    reset()
    setQuestion('')
    setMode('input')
    setCameraError('')
    stopCamera()
    stopDetection()
  }

  const handleClose = () => {
    console.log('[MoneyGuaModal] Closing...')
    handleReset()
    onClose()
  }

  const gestureInstruction = `请做「摇铜钱」手势：

手握拳，在胸前上下或左右摇晃
（就像手里握着铜钱在摇一样）`

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="金钱卦" hideCloseButton={mode === 'gesture_detecting' || mode === 'animating' || mode === 'gesture_success'}>
      <AnimatePresence mode="wait">
        {mode === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-neutral-600 mb-6">
              请默念心中所想之事，然后选择测算方式。
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleStartCamera}
                className="p-6 rounded-xl border-2 border-neutral-200 hover:border-neutral-800 transition-colors text-center"
              >
                <div className="text-3xl mb-2">📷</div>
                <div className="font-semibold text-neutral-800">手势测算</div>
                <div className="text-sm text-neutral-500">摇铜钱触发</div>
              </button>
              <button
                onClick={handleClickStart}
                className="p-6 rounded-xl border-2 border-neutral-200 hover:border-neutral-800 transition-colors text-center"
              >
                <div className="text-3xl mb-2">👆</div>
                <div className="font-semibold text-neutral-800">点击测算</div>
                <div className="text-sm text-neutral-500">直接开始</div>
              </button>
            </div>
            {cameraError && (
              <p className="text-red-600 text-sm mb-4">{cameraError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={handleClose}>
                取消
              </Button>
            </div>
          </motion.div>
        )}

        {(mode === 'gesture_waiting' || mode === 'gesture_detecting' || mode === 'gesture_success' || mode === 'gesture_failed') ? (
          <motion.div
            key="gesture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            <GestureCamera
              videoRef={videoRef}
              type="money_gua"
              state={
                mode === 'gesture_waiting' ? 'waiting' :
                mode === 'gesture_detecting' ? 'detecting' :
                mode === 'gesture_success' ? 'success' : 'failed'
              }
              gestureInstruction={gestureInstruction}
              onAnimationComplete={handleAnimationComplete}
              onDirectStart={handleDirectStart}
              onVideoReady={handleVideoReady}
            />
            {/* 返回按钮 */}
            <button
              onClick={handleReset}
              className="fixed top-6 left-6 z-50 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            >
              ←
            </button>
            {/* 跳过按钮 */}
            {(mode === 'gesture_waiting' || mode === 'gesture_detecting') && (
              <button
                onClick={handleClose}
                className="fixed top-6 right-6 z-50 px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg text-white text-sm"
              >
                跳过
              </button>
            )}
          </motion.div>
        ) : null}

        {mode === 'click_tossing' && (
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

        {mode === 'result' && result && (
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