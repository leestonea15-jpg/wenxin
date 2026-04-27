import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'

export type GuanyinGestureType = 'push_open' | 'wave' | 'pull_in' | 'draw' | null

interface UseGuanyinGestureOptions {
  enabled: boolean
  onGestureDetected?: (gesture: GuanyinGestureType) => void
  mode: 'idle' | 'drawing' // idle=仅粒子交互, drawing=可以抽签
}

const DEBUG = true

const log = (...args: any[]) => {
  if (DEBUG) console.log('[GuanyinGesture]', ...args)
}

const logError = (...args: any[]) => {
  console.error('[GuanyinGesture]', ...args)
}

export const useGuanyinGesture = ({
  enabled,
  onGestureDetected,
  mode,
}: UseGuanyinGestureOptions) => {
  console.log('useGuanyinGesture - mode:', mode, 'enabled:', enabled)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const handsRef = useRef<Hands | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [handPosition, setHandPosition] = useState<{ x: number; y: number } | null>(null)
  const [waveDirection, setWaveDirection] = useState<number>(0) // -1=左, 0=无, 1=右
  const [isWaving, setIsWaving] = useState(false)
  const [waveComplete, setWaveComplete] = useState(false) // 挥手完成信号
  const [handIsUp, setHandIsUp] = useState(false) // 手是否抬起（Y轴）

  const isDetectingRef = useRef(false)
  const onGestureDetectedRef = useRef(onGestureDetected)
  const prevModeRef = useRef<string | null>(null)
  const mediaPipeInitializedRef = useRef(false) // 标记 MediaPipe 是否已初始化
  const modeRef = useRef(mode) // 用 ref 存储最新的 mode，避免闭包陷阱 // 记录上一个模式

  // 手势检测状态
  const gestureStateRef = useRef<any>({
    // 手掌推开检测
    lastHandSize: 0,
    pushOpenInitialized: false,
    // 左右挥手检测
    lastX: 0,
    waveDirection: 0,
    waveCount: 0,
    lastWaveTime: 0,
    waveInitialized: false,
    // 手往前拉检测
    lastZ: 0,
    pullInInitialized: false,
  })

  useEffect(() => {
    onGestureDetectedRef.current = onGestureDetected
  }, [onGestureDetected])

  // 更新 modeRef，避免闭包陷阱
  useEffect(() => {
    modeRef.current = mode
    log('modeRef updated to:', mode)
  }, [mode])

  // 专门监听 mode 变化，完整重置所有状态
  useEffect(() => {
    if (prevModeRef.current !== null && prevModeRef.current !== mode) {
      log('Mode changed from', prevModeRef.current, 'to', mode, '— FULL RESET')

      // 完整重置 gestureStateRef
      gestureStateRef.current = {
        lastHandSize: 0,
        pushOpenInitialized: false,
        lastX: 0,
        waveDirection: 0,
        waveCount: 0,
        lastWaveTime: 0,
        waveInitialized: false,
        lastZ: 0,
        pullInInitialized: false,
        lastDirectionChangeTime: 0,
        lastActiveTime: 0,
        isWavingInternal: false,
        hasWavedOnce: false,
        isCurrentlyMoving: false,
        consecutiveStillFrames: 0,
        // drawing 模式专用字段，独立于第一阶段
        drawingInitialized: false,
        drawingLastX: 0,
        drawingWaveCount: 0,
        drawingLastActiveTime: 0,
        drawingIsWaving: false,
        drawingHasWaved: false,
        drawingStillFrames: 0,
        drawingWaveDirection: 0,
        drawingHandInCenter: false,
        drawingHandWasInCenter: false,
      }

      // 完整重置 React state
      setHandPosition(null)
      setWaveDirection(0)
      setIsWaving(false)
      setWaveComplete(false)
    }
    prevModeRef.current = mode
  }, [mode])

  // 初始化MediaPipe Hands - 只初始化一次
  useEffect(() => {
    if (!enabled) {
      log('Not enabled, skipping initialization')
      return
    }

    if (mediaPipeInitializedRef.current) {
      log('MediaPipe already initialized, skipping')
      return
    }

    log('Initializing MediaPipe Hands for Guanyin...')

    const hands = new Hands({
      locateFile: (file) => {
        log('Loading MediaPipe file:', file)
        // 换用 unpkg CDN，可能更稳定
        return `https://unpkg.com/@mediapipe/hands/${file}`
      },
    })

    // 先设置选项
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.2,
      minTrackingConfidence: 0.2,
    })

    // 设置结果回调
    hands.onResults((results: any) => {
      // 移除所有短路判断，确保日志能打印

      const handCount = results.multiHandLandmarks?.length || 0

      if (handCount === 0) {
        setHandPosition(null)
        return
      }

      const landmarks = results.multiHandLandmarks[0]

      // 手腕和中指根部的平均位置
      const wrist = landmarks[0]
      const middleBase = landmarks[9]
      const handX = (wrist.x + middleBase.x) / 2
      const handY = (wrist.y + middleBase.y) / 2

      // 手的大小（用于检测推开）
      const thumbTip = landmarks[4]
      const pinkyTip = landmarks[20]
      const handSize = Math.sqrt(
        Math.pow(thumbTip.x - pinkyTip.x, 2) +
        Math.pow(thumbTip.y - pinkyTip.y, 2)
      )

      setHandPosition({ x: handX - 0.5, y: -handY + 0.5 }) // 调整坐标系

      const now = Date.now()
      const state = gestureStateRef.current
      const callback = onGestureDetectedRef.current
      const currentMode = modeRef.current // 使用 ref 避免闭包陷阱

      // 调试日志：看一下当前模式
      log('onResults - mode:', currentMode, 'handCount:', handCount)

      // 根据模式处理手势
      if (currentMode === 'idle') {
        // 空闲模式：检测推开、挥手、拉近，用于控制粒子
        detectIdleGestures(landmarks, handSize, now, state, callback)
      } else if (currentMode === 'drawing') {
        // 抽签模式：检测手抬起/放下
        log('onResults - calling detectDrawingGesture, handY:', handY)
        detectDrawingGesture(handX, handY, now, state, callback)
      }
    })

    // 保存引用并直接标记已加载（简单方式）
    handsRef.current = hands
    mediaPipeInitializedRef.current = true // 标记已初始化
    setModelLoaded(true)
    log('MediaPipe Hands for Guanyin initialized successfully')

    return () => {
      log('Cleaning up MediaPipe Hands')
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current)
      }
      if (handsRef.current) {
        try {
          handsRef.current.close()
        } catch (e) {
          logError('Error closing hands:', e)
        }
      }
    }
  }, [enabled, mode])

  // 检测空闲模式手势
  const detectIdleGestures = (
    landmarks: any[],
    handSize: number,
    now: number,
    state: any,
    callback?: (gesture: GuanyinGestureType) => void
  ) => {
    const wrist = landmarks[0]
    const middleBase = landmarks[9]
    const handX = (wrist.x + middleBase.x) / 2

    // 1. 手掌推开检测（手变大）
    if (!state.pushOpenInitialized) {
      state.lastHandSize = handSize
      state.pushOpenInitialized = true
      return
    }

    const sizeDelta = handSize - state.lastHandSize
    if (sizeDelta > 0.05) {
      log('Push open gesture detected')
      callback?.('push_open')
    }
    state.lastHandSize = handSize

    // 2. 左右挥手检测 - idle 阶段只更新内部 state，不修改 waveDirection/isWaving
    if (!state.waveInitialized) {
      state.lastX = handX
      state.waveInitialized = true
      return
    }

    const deltaX = handX - state.lastX
    const absDeltaX = Math.abs(deltaX)

    if (absDeltaX > 0.015) {
      const newDirection = deltaX > 0 ? 1 : -1
      // 只要有移动就更新方向
      if (state.waveDirection !== newDirection) {
        state.waveCount++
        log('Wave detected (idle mode), count:', state.waveCount, 'direction:', newDirection)
        callback?.('wave')
        state.lastWaveTime = now
      }
      state.waveDirection = newDirection
      // idle 阶段：正常更新手势状态（仅用于驱动第一阶段UI）
      setWaveDirection(newDirection)
      setIsWaving(true)
    } else {
      // 没有检测到挥手动作，检查是否停止挥手
      if (now - state.lastWaveTime > 200) {
        setIsWaving(false)
        setWaveDirection(0)
      }
    }
    state.lastX = handX

    // 3. 手往前拉检测（可以用手的Y轴变化模拟）
    const handY = (wrist.y + middleBase.y) / 2
    if (!state.pullInInitialized) {
      state.lastZ = handY
      state.pullInInitialized = true
      return
    }

    const zDelta = state.lastZ - handY // 手向上移动视为拉近
    if (zDelta > 0.08) {
      log('Pull in gesture detected')
      callback?.('pull_in')
    }
    state.lastZ = handY
  }

  // 检测抽签手势 - 简化版：只有抬起/放下
  const detectDrawingGesture = (
    _handX: number,
    handY: number,
    _now: number,
    state: any,
    callback?: (gesture: GuanyinGestureType) => void
  ) => {
    // 为 drawing 模式单独初始化
    if (!state.drawingInitialized) {
      log('drawing mode initialized, fresh start')
      state.drawingPrevHandIsUp = false // 记录上一帧手是否抬起
      state.drawingInitialized = true
      return
    }

    // 调试日志：看一下 handY 的实际值
    log('drawing mode - handY:', handY)

    // 判断手是否抬起（MediaPipe Y轴向下为正，所以 handY < 0.6 是抬起）
    const currentHandIsUp = handY < 0.6

    // 更新 handIsUp 状态
    if (currentHandIsUp !== handIsUp) {
      log('handIsUp changed:', currentHandIsUp)
      setHandIsUp(currentHandIsUp)
      setIsWaving(currentHandIsUp)
    }

    // 检测下降沿：手从抬起变为放下 → 出签
    if (state.drawingPrevHandIsUp && !currentHandIsUp) {
      log('hand put down, triggering draw!')
      setIsWaving(false)
      setWaveDirection(0)
      setWaveComplete(true)
      callback?.('draw')
    }

    // 保存当前状态
    state.drawingPrevHandIsUp = currentHandIsUp
  }

  const startCamera = useCallback(async () => {
    log('startCamera called')

    if (!videoRef.current) {
      const err = new Error('video element not found')
      logError('videoRef is null! Cannot start camera.', err)
      throw err
    }

    try {
      log('Requesting user media...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 60 },
        },
      })
      log('Camera stream obtained:', stream.id)

      const video = videoRef.current
      video.srcObject = stream

      // 等待视频元数据加载
      log('Waiting for video metadata...')
      await new Promise<void>((resolve, reject) => {
        const onLoadedMetadata = () => {
          log('Video metadata loaded, readyState:', video.readyState)
          resolve()
        }
        const onError = () => {
          logError('Video error occurred')
          reject(new Error('Video error'))
        }

        video.onloadedmetadata = onLoadedMetadata
        video.onerror = onError

        // 如果已经加载完成，直接resolve
        if (video.readyState >= 1) {
          resolve()
        }
      })

      // 等待视频可以播放（放宽要求，readyState >= 2 即可）
      log('Waiting for video to be ready...')
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (video.readyState >= 2) {
            log('Video ready! readyState:', video.readyState)
            resolve()
          } else {
            log('Video not ready yet, readyState:', video.readyState)
            setTimeout(checkReady, 50)
          }
        }

        // 即使超时也继续，不阻塞
        const timeoutId = setTimeout(() => {
          log('Video ready timeout but continuing anyway, readyState:', video.readyState)
          resolve()
        }, 5000)

        checkReady()

        return () => clearTimeout(timeoutId)
      })

      log('Starting video playback...')
      await video.play()
      log('Camera ready, video playing')
      setCameraReady(true)
    } catch (error) {
      logError('Camera error:', error)
      throw error
    }
  }, [])

  const stopCamera = useCallback(() => {
    log('Stopping camera...')
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }, [])

  const startDetection = useCallback(() => {
    log('startDetection called, modelLoaded:', modelLoaded, 'cameraReady:', cameraReady)

    if (!handsRef.current || !videoRef.current) {
      logError('Missing hands or video ref')
      return
    }

    // 创建隐藏的 canvas 用于绘制视频帧
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      canvas.style.display = 'none'
      document.body.appendChild(canvas)
      canvasRef.current = canvas
    }

    // 强制开启检测
    setIsDetecting(true)
    isDetectingRef.current = true

    // 重置状态
    gestureStateRef.current = {
      lastHandSize: 0,
      pushOpenInitialized: false,
      lastX: 0,
      waveDirection: 0,
      waveCount: 0,
      lastWaveTime: 0,
      waveInitialized: false,
      lastZ: 0,
      pullInInitialized: false,
      lastDirectionChangeTime: 0,
      lastActiveTime: 0,
      isWavingInternal: false,
      hasWavedOnce: false,
      isCurrentlyMoving: false,
      consecutiveStillFrames: 0,
      // drawing 模式专用字段，独立于第一阶段
      drawingInitialized: false,
      drawingLastX: 0,
      drawingWaveCount: 0,
      drawingLastActiveTime: 0,
      drawingIsWaving: false,
      drawingHasWaved: false,
      drawingStillFrames: 0,
      drawingWaveDirection: 0,
      drawingHandInCenter: false,
      drawingHandWasInCenter: false,
    }

    // 视频帧发送循环，使用 requestAnimationFrame
    const sendFrame = async () => {
      if (!isDetectingRef.current || !handsRef.current || !videoRef.current || !canvasRef.current) {
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        try {
          await handsRef.current.send({ image: canvas })
        } catch (e) {
          // 静默忽略错误，继续下一帧
        }
      }

      animationFrameRef.current = requestAnimationFrame(sendFrame)
    }

    sendFrame()
  }, [modelLoaded, cameraReady])

  const stopDetection = useCallback(() => {
    log('stopDetection called')
    setIsDetecting(false)
    isDetectingRef.current = false

    // 取消动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // 移除 canvas
    if (canvasRef.current && canvasRef.current.parentNode) {
      canvasRef.current.parentNode.removeChild(canvasRef.current)
      canvasRef.current = null
    }
  }, [])

  // 当摄像头和模型都准备好时，自动开始检测
  useEffect(() => {
    if (cameraReady && modelLoaded && enabled) {
      log('Camera and model ready, auto-starting detection')
      // 添加短暂延迟确保一切就绪
      const timer = setTimeout(() => {
        startDetection()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [cameraReady, modelLoaded, enabled, startDetection])

  return {
    videoRef,
    handPosition,
    cameraReady,
    isDetecting,
    modelLoaded,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
    waveDirection,
    isWaving,
    waveComplete,
    handIsUp,
  }
}
