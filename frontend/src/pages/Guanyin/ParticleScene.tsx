import { useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { GuanyinBackground } from './GuanyinBackground'
import { GuanyinPot } from './GuanyinPot'
import { GuanyinSticks } from './GuanyinSticks'
import { StickBurstEffect } from './GuanyinEffects'

interface ParticleSceneProps {
  mode: 'idle' | 'gesture' | 'mouse' | 'drawing' | 'result'
  handPosition: { x: number; y: number } | null
  waveDirection?: number
  isWaving?: boolean
  waveComplete?: boolean
  handIsUp?: boolean
  stickLevel?: string | null
  onMouseLongPress?: () => void
  onMouseRelease?: () => void
}

export const ParticleScene = ({
  mode,
  handPosition,
  waveDirection = 0,
  isWaving = false,
  waveComplete = false,
  handIsUp = false,
  // @ts-ignore: stickLevel is kept for backward compatibility but not used
  stickLevel,
  onMouseLongPress,
  onMouseRelease,
}: ParticleSceneProps) => {
  console.log('ParticleScene - waveDirection:', waveDirection, 'isWaving:', isWaving, 'waveComplete:', waveComplete, 'mode:', mode, 'handIsUp:', handIsUp)
  const [isPressing, setIsPressing] = useState(false)
  const [burstActive, setBurstActive] = useState(false)
  const prevIsWavingRef = useRef(false)
  const pressTimerRef = useRef<NodeJS.Timeout>()
  const burstTimerRef = useRef<NodeJS.Timeout>()

  // 第二阶段时，只要 isWaving 就持续粒子爆炸
  useEffect(() => {
    if (isWaving && (mode === 'gesture' || mode === 'drawing')) {
      // 立即触发一次
      setBurstActive(true)
      const timer = setTimeout(() => setBurstActive(false), 1000)

      // 每 500ms 触发一次
      burstTimerRef.current = setInterval(() => {
        setBurstActive(true)
        setTimeout(() => setBurstActive(false), 1000)
      }, 500)

      return () => {
        clearTimeout(timer)
        if (burstTimerRef.current) {
          clearInterval(burstTimerRef.current)
        }
      }
    } else {
      // 停止时停止粒子爆炸
      if (burstTimerRef.current) {
        clearInterval(burstTimerRef.current)
      }
      setBurstActive(false)
    }
  }, [isWaving, mode])

  // 上升沿检测：isWaving 从 true 变 false 时触发粒子爆炸（保留原逻辑作为备用）
  useEffect(() => {
    if (prevIsWavingRef.current && !isWaving && (mode === 'gesture' || mode === 'drawing' || mode === 'result')) {
      setBurstActive(true)
      // 1秒后自动关闭粒子爆炸效果
      const timer = setTimeout(() => setBurstActive(false), 1000)
      return () => clearTimeout(timer)
    }
    prevIsWavingRef.current = isWaving
  }, [isWaving, mode])

  const handlePointerDown = () => {
    if (mode === 'mouse') {
      setIsPressing(true)
      pressTimerRef.current = setTimeout(() => {
        onMouseLongPress?.()
      }, 500)
    }
  }

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
    }
    if (isPressing) {
      setIsPressing(false)
      onMouseRelease?.()
    }
  }

  return (
    <div
      className="w-full h-full"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 3, 6]} fov={60} />
        <OrbitControls enableZoom={false} enablePan={false} target={[0, 0, -0.3]} />

        <color attach="background" args={['#000000']} />

        <GuanyinBackground
          handPosition={handPosition}
          waveDirection={waveDirection}
          isWaving={isWaving}
          waveComplete={waveComplete}
          mode={mode}
        />

        <group position={[0, 0, -0.3]}>
          <GuanyinPot mode={mode} isWaving={isWaving} waveDirection={waveDirection} waveComplete={waveComplete} handPosition={handPosition} handIsUp={handIsUp} />
          <GuanyinSticks mode={mode} isWaving={isWaving} waveDirection={waveDirection} waveComplete={waveComplete} handPosition={handPosition} handIsUp={handIsUp} />
        </group>

        <StickBurstEffect active={burstActive && (mode === 'gesture' || mode === 'drawing' || mode === 'result')} />
      </Canvas>
    </div>
  )
}
