import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GuanyinPotProps {
  mode: string
  isShaking?: boolean
  isWaving?: boolean
  waveDirection?: number
  waveComplete?: boolean
  handPosition?: { x: number; y: number } | null
  handIsUp?: boolean
}

// 签筒轮廓层
const PotOutlineLayer = () => {
  const pointsRef = useRef<THREE.Points>(null)

  const [particles] = useState(() => {
    const positions: number[] = []
    const colors: number[] = []

    const topRadius = 1.5
    const bottomRadius = 1.2
    const height = 3.5
    const particleCount = 2000

    for (let i = 0; i < particleCount; i++) {
      const h = (Math.random() - 0.5) * height
      const t = (h + height / 2) / height
      const radius = bottomRadius + (topRadius - bottomRadius) * t

      const angle = Math.random() * Math.PI * 2
      const r = radius * (0.98 + Math.random() * 0.04)

      positions.push(
        Math.cos(angle) * r,
        h,
        Math.sin(angle) * r
      )

      const rVal = 0.6 + Math.random() * 0.4
      colors.push(
        0.6 + rVal * 0.3, // #991a1a ~ #cc2222
        0.1 + rVal * 0.05,
        0.1 + rVal * 0.05,
      )
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  })

  return (
    <points ref={pointsRef}>
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
        size={0.05}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// 签筒内填充层
const PotFillLayer = () => {
  const pointsRef = useRef<THREE.Points>(null)

  const [particles] = useState(() => {
    const positions: number[] = []
    const colors: number[] = []

    const topRadius = 1.4
    const bottomRadius = 1.1
    const height = 3.3
    const particleCount = 1500

    for (let i = 0; i < particleCount; i++) {
      const h = (Math.random() - 0.5) * height
      const t = (h + height / 2) / height
      const radius = bottomRadius + (topRadius - bottomRadius) * t

      const angle = Math.random() * Math.PI * 2
      const r = radius * Math.random()

      positions.push(
        Math.cos(angle) * r,
        h,
        Math.sin(angle) * r
      )

      const brightness = 0.4 + Math.random() * 0.3
      colors.push(
        brightness * 0.5,
        brightness * 0.1,
        brightness * 0.1,
      )
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  })

  return (
    <points ref={pointsRef}>
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
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// 签筒高光层
const PotHighlightLayer = () => {
  const pointsRef = useRef<THREE.Points>(null)

  const [particles] = useState(() => {
    const positions: number[] = []
    const colors: number[] = []

    const topRadius = 1.5
    const height = 3.5

    // 顶部高光
    for (let i = 0; i < 500; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = topRadius * (0.85 + Math.random() * 0.15)
      positions.push(
        Math.cos(angle) * r,
        height / 2 - 0.05,
        Math.sin(angle) * r
      )
      const isWhite = Math.random() > 0.3
      colors.push(
        isWhite ? 1.0 : 1.0,
        isWhite ? 1.0 : 0.3,
        isWhite ? 1.0 : 0.3,
      )
    }

    // 正面高光
    for (let i = 0; i < 200; i++) {
      const h = (Math.random() - 0.5) * height
      const t = (h + height / 2) / height
      const radius = 1.2 + (1.5 - 1.2) * t

      const angle = (Math.random() - 0.5) * 0.8 // 只在正面
      positions.push(
        Math.cos(angle) * radius,
        h,
        Math.sin(angle) * radius * 0.3
      )
      const isWhite = Math.random() > 0.6
      colors.push(
        isWhite ? 1.0 : 0.9,
        isWhite ? 1.0 : 0.4,
        isWhite ? 1.0 : 0.4,
      )
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  })

  return (
    <points ref={pointsRef}>
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
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export const GuanyinPot = ({ mode, isShaking = false, isWaving = false, waveDirection = 0, waveComplete = false, handPosition, handIsUp = false }: GuanyinPotProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const targetRotationRef = useRef(0) // 目标旋转角度
  const currentRotationRef = useRef(0) // 当前显示的旋转角度
  const swayOffsetRef = useRef(0)
  const prevModeRef = useRef(mode)

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()

    // 签筒呼吸动画
    groupRef.current.position.y = Math.sin(time * 1.5) * 0.08

    // 检测模式变化，切换阶段时重置状态
    if (prevModeRef.current !== mode) {
      if (mode !== 'idle' && mode !== 'mouse') {
        // 进入非idle阶段，重置旋转角度为0
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
          // 手势进行中的晃动效果
          groupRef.current.position.y += Math.sin(time * 5) * 0.12
          groupRef.current.rotation.z = Math.sin(time * 4) * 0.06
        } else if (handX < -0.1) {
          // 手在左侧：向左转
          targetRotationRef.current -= 0.035
          // 手势进行中的晃动效果
          groupRef.current.position.y += Math.sin(time * 5) * 0.12
          groupRef.current.rotation.z = Math.sin(time * 4) * 0.06
        }
        // 手在中间：目标角度保持不变
      }
      // 【无手或有手】：平滑过渡
      const lerpFactor = 0.15 // 平滑系数，越大越快
      currentRotationRef.current = currentRotationRef.current + (targetRotationRef.current - currentRotationRef.current) * lerpFactor
      groupRef.current.rotation.y = currentRotationRef.current
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

      // 手抬起时的上下和旋转晃动效果
      if (handIsUp) {
        groupRef.current.position.y += Math.sin(time * 5) * 0.12
        groupRef.current.rotation.z = Math.sin(time * 4) * 0.06
      }
    }
  })

  return (
    <group ref={groupRef}>
      <PotFillLayer />
      <PotOutlineLayer />
      <PotHighlightLayer />
    </group>
  )
}
