import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'

export type GestureType = 'shake' | 'throw_up' | null

interface UseGestureControlOptions {
  enabled: boolean
  onGestureDetected: (gesture: GestureType) => void
  targetGesture?: 'shake' | 'throw_up'
}

// 日志控制：开发模式显示详细日志
const DEBUG = true

const log = (...args: any[]) => {
  if (DEBUG) console.log('[Gesture]', ...args)
}

const logError = (...args: any[]) => {
  console.error('[Gesture]', ...args)
}

export const useGestureControl = ({
  enabled,
  onGestureDetected,
  targetGesture,
}: UseGestureControlOptions) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handsRef = useRef<Hands | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)

  const isDetectingRef = useRef(false)
  const targetGestureRef = useRef<'shake' | 'throw_up'>(targetGesture || 'shake')
  const onGestureDetectedRef = useRef(onGestureDetected)
  const frameLoopRunningRef = useRef(false)
  const frameSkipRef = useRef(0)

  // 摇动手势检测状态 - 使用更灵敏的算法
  const shakeDetectRef = useRef({
    lastY: 0,
    direction: 0, // 1 = up, -1 = down
    shakeCount: 0,
    lastShakeTime: 0,
    initialized: false,
  })

  // 抛掷手势检测状态
  const throwUpDetectRef = useRef({
    isRising: false,
    startY: 0,
    startTime: 0,
    initialized: false,
  })

  useEffect(() => {
    onGestureDetectedRef.current = onGestureDetected
  }, [onGestureDetected])

  useEffect(() => {
    if (targetGesture) {
      targetGestureRef.current = targetGesture
      // 重置检测状态
      shakeDetectRef.current = { lastY: 0, direction: 0, shakeCount: 0, lastShakeTime: 0, initialized: false }
      throwUpDetectRef.current = { isRising: false, startY: 0, startTime: 0, initialized: false }
    }
  }, [targetGesture])

  // 初始化MediaPipe Hands
  useEffect(() => {
    if (!enabled) {
      log('Not enabled, skipping initialization')
      return
    }

    log('Initializing MediaPipe Hands...')

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      },
    })

    // 优化检测参数以提高速度和灵敏度
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0, // 使用轻量级模型以提高速度
      minDetectionConfidence: 0.3, // 降低检测置信度阈值
      minTrackingConfidence: 0.3, // 降低跟踪置信度阈值
    })

    hands.onResults((results: any) => {
      if (!isDetectingRef.current) return

      const handCount = results.multiHandLandmarks?.length || 0
      if (handCount === 0) {
        return
      }

      const landmarks = results.multiHandLandmarks[0]
      const currentTargetGesture = targetGestureRef.current
      const currentCallback = onGestureDetectedRef.current

      // 使用手腕(0)和中指根部(9)的平均位置，更稳定
      const wrist = landmarks[0]
      const middleBase = landmarks[9]
      const handY = (wrist.y + middleBase.y) / 2
      const handX = (wrist.x + middleBase.x) / 2
      const now = Date.now()

      // 每隔30帧记录一次日志，避免日志刷屏
      frameSkipRef.current++
      if (frameSkipRef.current % 30 === 0) {
        log('Hand detected! Target:', currentTargetGesture, 'Y:', handY.toFixed(3), 'X:', handX.toFixed(3))
      }

      if (currentTargetGesture === 'shake') {
        const state = shakeDetectRef.current

        if (!state.initialized) {
          state.lastY = handY
          state.initialized = true
          return
        }

        const deltaY = handY - state.lastY
        const absDeltaY = Math.abs(deltaY)

        // 极低的阈值：只需要轻微移动
        const MOVE_THRESHOLD = 0.008 // 大幅降低阈值

        if (absDeltaY > MOVE_THRESHOLD) {
          const newDirection = deltaY > 0 ? 1 : -1

          // 方向改变 = 一次摇晃
          if (state.direction !== 0 && state.direction !== newDirection) {
            state.shakeCount++
            log('Shake detected! Count:', state.shakeCount, 'delta:', absDeltaY.toFixed(4))

            // 只需要2次摇晃就触发（降低门槛）
            if (state.shakeCount >= 2 && now - state.lastShakeTime > 200) {
              log('===== SHAKE GESTURE TRIGGERED! =====')
              state.shakeCount = 0
              state.lastShakeTime = now
              currentCallback('shake')
            }
          }

          state.direction = newDirection
          state.lastY = handY
        }
      } else if (currentTargetGesture === 'throw_up') {
        const state = throwUpDetectRef.current

        if (!state.initialized) {
          state.startY = handY
          state.initialized = true
          return
        }

        // 状态机：检测向下准备然后向上抛的动作
        if (!state.isRising) {
          // 检测手向下准备（y值增加）
          if (handY > 0.6) { // 手在较低位置
            state.isRising = true
            state.startY = handY
            state.startTime = now
            log('Throw up: hand lowered, waiting for up movement')
          }
        } else {
          // 检测手向上挥动（y值减少）
          const upwardDelta = state.startY - handY
          const timeDelta = now - state.startTime

          // 极低的阈值：只需要轻微向上移动
          if (upwardDelta > 0.05 && timeDelta < 800) { // 在800ms内向上移动0.05
            log('===== THROW UP GESTURE TRIGGERED! =====', 'delta:', upwardDelta.toFixed(4))
            state.isRising = false
            state.startY = 0
            currentCallback('throw_up')
          } else if (timeDelta > 1000) {
            // 超时重置
            state.isRising = false
            state.startY = handY
          }
        }
      }
    })

    handsRef.current = hands
    setModelLoaded(true)
    log('MediaPipe Hands initialized successfully')

    return () => {
      log('Cleaning up MediaPipe Hands')
      frameLoopRunningRef.current = false
      hands.close()
    }
  }, [enabled])

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
          frameRate: { ideal: 30, max: 60 }, // 请求高帧率
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

      // 等待视频真正可以播放（readyState === 4）
      log('Waiting for video to be fully ready (readyState === 4)...')
      await new Promise<void>((resolve, reject) => {
        const checkReady = () => {
          if (video.readyState === 4) {
            log('Video fully ready! readyState:', video.readyState)
            resolve()
          } else {
            log('Video not ready yet, readyState:', video.readyState)
            setTimeout(checkReady, 50)
          }
        }

        const timeoutId = setTimeout(() => {
          logError('Video ready timeout, readyState:', video.readyState)
          reject(new Error('Video ready timeout'))
        }, 10000) // 10秒超时

        checkReady()

        // 清理超时
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
      stream.getTracks().forEach(track => {
        track.stop()
      })
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
    frameLoopRunningRef.current = false
  }, [])

  const startFrameLoop = useCallback(() => {
    log('Starting frame loop...')

    if (!handsRef.current) {
      logError('No hands instance available')
      return
    }

    if (!videoRef.current) {
      logError('No video element available')
      return
    }

    if (videoRef.current.readyState < 4) {
      logError('Video not ready, readyState:', videoRef.current.readyState)
      // 等待视频准备好再启动
      const checkAndStart = () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          log('Video now ready, starting frame loop')
          startFrameLoop()
        } else {
          setTimeout(checkAndStart, 100)
        }
      }
      setTimeout(checkAndStart, 100)
      return
    }

    if (frameLoopRunningRef.current) {
      log('Frame loop already running')
      return
    }

    frameLoopRunningRef.current = true
    let frameCount = 0
    let lastTime = performance.now()

    const renderFrame = async () => {
      if (!frameLoopRunningRef.current) {
        return
      }

      if (!videoRef.current || !handsRef.current) {
        frameLoopRunningRef.current = false
        return
      }

      // 检查视频是否仍然准备好
      if (videoRef.current.readyState < 4) {
        log('Video no longer ready, pausing frame loop')
        frameLoopRunningRef.current = false
        return
      }

      try {
        frameCount++
        const now = performance.now()

        // 每60帧记录一次FPS
        if (frameCount % 60 === 0) {
          const fps = Math.round(60000 / (now - lastTime))
          log('Frame loop running, FPS:', fps)
          lastTime = now
        }

        await handsRef.current.send({ image: videoRef.current })
      } catch (err) {
        logError('Error in frame loop:', err)
      }

      // 使用 requestAnimationFrame 保持高帧率
      if (frameLoopRunningRef.current) {
        requestAnimationFrame(renderFrame)
      }
    }

    renderFrame()
    log('Frame loop started')
  }, [])

  const startDetection = useCallback(async () => {
    log('startDetection called, modelLoaded:', modelLoaded, 'cameraReady:', cameraReady)

    if (!modelLoaded || !cameraReady) {
      logError('Model or camera not ready')
      return
    }

    if (!handsRef.current || !videoRef.current) {
      logError('Missing hands or video ref')
      return
    }

    // 确保视频完全准备好
    if (videoRef.current.readyState < 4) {
      log('Video not fully ready, waiting...')
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            resolve()
          } else {
            setTimeout(checkReady, 50)
          }
        }
        checkReady()
      })
    }

    log('Setting isDetecting = true')
    setIsDetecting(true)
    isDetectingRef.current = true

    // 重置检测状态
    shakeDetectRef.current = { lastY: 0, direction: 0, shakeCount: 0, lastShakeTime: 0, initialized: false }
    throwUpDetectRef.current = { isRising: false, startY: 0, startTime: 0, initialized: false }

    startFrameLoop()
    log('Detection started successfully')
  }, [modelLoaded, cameraReady, startFrameLoop])

  const stopDetection = useCallback(() => {
    log('stopDetection called')
    setIsDetecting(false)
    isDetectingRef.current = false
    frameLoopRunningRef.current = false
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
    canvasRef,
    cameraReady,
    isDetecting,
    modelLoaded,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  }
}
