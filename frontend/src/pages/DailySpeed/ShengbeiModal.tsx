import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import Input from '../../components/Input'
import GestureCamera from '../../components/GestureCamera'
import { useShengbei } from '../../hooks/useShengbei'
import { useGestureControl } from '../../hooks/useGestureControl'
import type { ShengbeiDivinationResult } from '../../utils/shengbei'

interface ShengbeiModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

type ModalMode = 'input' | 'permission' | 'gesture_waiting' | 'gesture_detecting' | 'gesture_success' | 'gesture_failed' | 'animating' | 'result' | 'click_tossing'

const CupAnimation = () => {
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
            repeat: 1,
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
  const getCupStyle = (side: 'yang' | 'yin') => ({
    gradient: side === 'yang' ? 'from-red-600 to-red-800' : 'from-amber-800 to-amber-950'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      {/* 新增：阴阳杯说明 */}
      <div className="mb-6 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
        <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-b from-red-600 to-red-800 mr-1 align-middle"></span>
        <span className="mr-4">红色为阳杯</span>
        <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-b from-amber-800 to-amber-950 mr-1 align-middle"></span>
        <span>棕色为阴杯</span>
      </div>

      <div className="space-y-4 mb-6">
        {result.throws.map((throwResult, index) => (
          <div key={index} className="flex items-center justify-center gap-4">
            <div className="flex gap-2">
              <div className={`w-10 h-14 rounded-t-full bg-gradient-to-b ${getCupStyle(throwResult.left).gradient} shadow flex items-end justify-center pb-1`}>
                <div className="w-5 h-1.5 bg-black/20 rounded-full" />
              </div>
              <div className={`w-10 h-14 rounded-t-full bg-gradient-to-b ${getCupStyle(throwResult.right).gradient} shadow flex items-end justify-center pb-1`}>
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
            ? 'bg-green-50 text-green-70'
            : 'bg-neutral-100 text-neutral-70'
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

const ShengbeiModal = ({ isOpen, onClose, onComplete }: ShengbeiModalProps) => {
  const [question, setQuestion] = useState('')
  const [mode, setMode] = useState<ModalMode>('input')
  const [cameraError, setCameraError] = useState('')
  const { result, toss, reset } = useShengbei()

  // console.log('[ShengbeiModal] Current mode:', mode)

  const {
    videoRef,
    startCamera,
    stopCamera,
    stopDetection,
  } = useGestureControl({
    enabled: isOpen,
    targetGesture: 'throw_up',
    onGestureDetected: async (gesture) => {
      console.log('[ShengbeiModal] ===== Gesture detected! =====', gesture)
      if (gesture === 'throw_up' && (mode === 'gesture_waiting' || mode === 'gesture_detecting')) {
        console.log('[ShengbeiModal] Starting toss...')
        setMode('gesture_detecting')
        await toss(1)
        setMode('gesture_success')
        console.log('[ShengbeiModal] Toss complete, showing success')
      }
    },
  })

  // 当video元素就绪时，启动摄像头
  const handleVideoReady = useCallback(() => {
    console.log('[ShengbeiModal] handleVideoReady called')
    startCamera().catch(err => {
      console.error('[ShengbeiModal] Error starting camera:', err)
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
    console.log('[ShengbeiModal] Animation complete, showing result')
    if (result) {
      setMode('result')
    }
  }

  // 启动摄像头 - 先切换模式（让GestureCamera挂载）
  const handleStartCamera = () => {
    console.log('[ShengbeiModal] handleStartCamera called')
    setCameraError('')
    console.log('[ShengbeiModal] Setting mode to gesture_waiting...')
    setMode('gesture_waiting')
    // 摄像头会在GestureCamera的onVideoReady回调中启动
  }

  // 手势模式的测算
  const handleGestureToss = async () => {
    console.log('[ShengbeiModal] Manual gesture toss')
    setMode('gesture_detecting')
    await toss(1)
    setMode('animating')
  }

  // 直接开始函数
  const handleDirectStart = async () => {
    console.log('[ShengbeiModal] Direct start')
    setMode('click_tossing')
    await toss(1)
    setMode('result')
  }

  // 点击模式的测算
  const handleClickStart = async () => {
    console.log('[ShengbeiModal] Click start')
    setMode('click_tossing')
    await toss(1)
    setMode('result')
  }

  const handleReset = () => {
    console.log('[ShengbeiModal] Resetting...')
    reset()
    setQuestion('')
    setMode('input')
    setCameraError('')
    stopCamera()
    stopDetection()
  }

  const handleClose = () => {
    console.log('[ShengbeiModal] Closing...')
    handleReset()
    onClose()
  }

  const gestureInstruction = `请做「抛圣杯」手势：

手抬起，然后快速向下再向上挥动
（就像手里捧着圣杯向上抛一样）`

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="掷圣杯" hideCloseButton={mode === 'gesture_detecting' || mode === 'animating' || mode === 'gesture_success'}>
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
                <div className="text-sm text-neutral-500">抛圣杯触发</div>
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
              type="shengbei"
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
            <CupAnimation />
            <p className="text-neutral-600">正在掷圣杯...</p>
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

export default ShengbeiModal