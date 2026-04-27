import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GuanyinSticksProps {
  mode: string
  isShaking?: boolean
  isWaving?: boolean
  waveDirection?: number
  waveComplete?: boolean
  handPosition?: { x: number; y: number } | null
  handIsUp?: boolean
  selectedStickIndex?: number | null
  onStickFlyComplete?: () => void
}

interface SingleStickProps {
  index: number
  angle: number
  heightOffset: number
  swingPhase: number
  swingFreq: number
  mode: string
  isShaking?: boolean
  isWaving?: boolean
  isSelected?: boolean
  onFlyComplete?: () => void
}

const SingleStick = ({
  index,
  angle,
  heightOffset,
  swingPhase,
  swingFreq,
  mode,
  isShaking = false,
  isWaving = false,
  isSelected = false,
  onFlyComplete,
}: SingleStickProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const flyStateRef = useRef({ isFlying: false, startTime: 0, startY: 0 })

  const [stickData] = useState(() => {
    const potHeight = 3.5
    const potTop = potHeight / 2 // 1.75
    const potBottom = -potHeight / 2 // -1.75

    // 签条底部位置：三分之一处
    const stickBottom = potBottom + potHeight * (1 / 3)

    // 顶部随机高出签筒5%-8%
    const extraHeight = potTop * (0.05 + Math.random() * 0.03)
    const stickTop = potTop + extraHeight

    // 签条长度 = 顶部位置 - 底部位置
    const stickLength = stickTop - stickBottom

    return { stickBottom, stickTop, stickLength }
  })

  const [particles] = useState(() => {
    const positions: number[] = []
    const colors: number[] = []

    const { stickBottom, stickTop, stickLength } = stickData
    const stickWidth = 0.12

    // 签条主体 - 从底部到顶部
    const particleCount = 120
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount
      const w = (Math.random() - 0.5) * stickWidth

      positions.push(
        w,
        stickBottom + t * stickLength,
        0
      )

      // 金色
      colors.push(1.0, 0.84, 0.0)
    }

    // 顶部尖三角
    for (let i = 0; i < 25; i++) {
      const t = i / 25
      const w = (1 - t) * stickWidth * 0.5
      positions.push(
        (Math.random() - 0.5) * w,
        stickTop + t * 0.25,
        0
      )
      // 金色
      colors.push(1.0, 0.84, 0.0)
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  })

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()

    const radius = 0.7
    const baseX = Math.cos(angle) * radius
    const baseZ = Math.sin(angle) * radius

    if (isSelected && !flyStateRef.current.isFlying) {
      flyStateRef.current.isFlying = true
      flyStateRef.current.startTime = time
      flyStateRef.current.startY = heightOffset
    }

    if (flyStateRef.current.isFlying) {
      const flyTime = time - flyStateRef.current.startTime

      if (flyTime < 2.0) {
        const progress = Math.min(flyTime / 1.5, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)

        groupRef.current.position.x = baseX
        groupRef.current.position.y = flyStateRef.current.startY + easeOut * 6
        groupRef.current.position.z = baseZ
        groupRef.current.rotation.y = angle + Math.PI / 2
        groupRef.current.scale.setScalar(1 + easeOut)
      } else {
        onFlyComplete?.()
      }
    } else {
      const swing = Math.sin(time * swingFreq + swingPhase) * 0.05

      let shakeX = 0
      let shakeY = 0
      if (isShaking || mode === 'gesture' || mode === 'mouse' || isWaving) {
        shakeX = Math.sin(time * 8 + index) * 0.08
        shakeY = Math.cos(time * 6 + index * 0.5) * 0.05
      }

      groupRef.current.position.x = baseX + swing + shakeX
      groupRef.current.position.y = heightOffset + shakeY
      groupRef.current.position.z = baseZ
      groupRef.current.rotation.y = angle + Math.PI / 2
      groupRef.current.scale.setScalar(1)
    }
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.count}
            array={particles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particles.count}
            array={particles.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          vertexColors
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

export const GuanyinSticks = ({
  mode,
  isShaking = false,
  isWaving = false,
  waveDirection = 0,
  waveComplete = false,
  handPosition,
  handIsUp = false,
  selectedStickIndex = null,
  onStickFlyComplete,
}: GuanyinSticksProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const targetRotationRef = useRef(0) // 目标旋转角度
  const currentRotationRef = useRef(0) // 当前显示的旋转角度
  const swayOffsetRef = useRef(0)
  const prevModeRef = useRef(mode)

  const sticks = useMemo(() => {
    const stickCount = 14
    return Array.from({ length: stickCount }).map((_, index) => ({
      id: index,
      index,
      angle: (index / stickCount) * Math.PI * 2,
      heightOffset: 0,
      swingPhase: Math.random() * Math.PI * 2,
      swingFreq: 0.5 + Math.random() * 0.5,
    }))
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()

    // 检测模式变化，切换阶段时重置状态
    if (prevModeRef.current !== mode) {
      if (mode !== 'idle' && mode !== 'mouse') {
        // 进入非idle阶段，重置所有状态
        targetRotationRef.current = 0
        currentRotationRef.current = 0
        swayOffsetRef.current = 0
        groupRef.current.rotation.y = 0
        groupRef.current.position.x = 0
      }
      prevModeRef.current = mode
    }

    if (mode === 'idle' || mode === 'mouse') {
      // 【1】第一阶段（idle）
      if (handPosition) {
        // 【有手在屏幕中】：基于手的位置控制
        const handX = handPosition.x
        if (handX > 0.1) {
          // 手在右侧：向右转
          targetRotationRef.current += 0.035
        } else if (handX < -0.1) {
          // 手在左侧：向左转
          targetRotationRef.current -= 0.035
        }
        // 手在中间：目标角度保持不变
      }
      // 【无手或有手】：平滑过渡
      const lerpFactor = 0.15 // 平滑系数，越大越快
      currentRotationRef.current = currentRotationRef.current + (targetRotationRef.current - currentRotationRef.current) * lerpFactor
      groupRef.current.rotation.y = currentRotationRef.current
      groupRef.current.position.x = 0
    } else if (mode === 'gesture' || mode === 'drawing' || mode === 'result') {
      // 【2】第二阶段 - 手抬起时自动晃动
      groupRef.current.rotation.y = 0 // 禁止旋转

      if (handIsUp) {
        // 手抬起时：自动左右晃动，不用手移动
        swayOffsetRef.current = Math.sin(time * 6) * 0.5
      } else {
        // 手放下时：回正
        swayOffsetRef.current = 0
      }

      groupRef.current.position.x = swayOffsetRef.current
    }
  })

  return (
    <group ref={groupRef}>
      {sticks.map((stick) => (
        <SingleStick
          key={stick.id}
          {...stick}
          mode={mode}
          isShaking={isShaking}
          isWaving={isWaving}
          isSelected={selectedStickIndex === stick.id}
          onFlyComplete={selectedStickIndex === stick.id ? onStickFlyComplete : undefined}
        />
      ))}
    </group>
  )
}
