import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GuanyinBackgroundProps {
  handPosition: { x: number; y: number } | null
  mode?: string
}

// #87CEEB 天蓝色背景粒子 - 越近越亮
const DiffusionParticles = ({
  mode = 'idle',
  handPosition
}: {
  mode?: string
  handPosition?: { x: number; y: number } | null
}) => {
  const pointsRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)
  const targetRotationRef = useRef(0) // 目标旋转角度
  const currentRotationRef = useRef(0) // 当前显示的旋转角度
  const prevModeRef = useRef(mode)

  const [particles] = useState(() => {
    const count = 24000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    // #87CEEB 天蓝色
    const skyR = 0x87 / 255
    const skyG = 0xCE / 255
    const skyB = 0xEB / 255

    for (let i = 0; i < count; i++) {
      // 使用更强的幂函数分布，让大量粒子靠近中心
      const angle = Math.random() * Math.PI * 2
      const dist = Math.pow(Math.random(), 0.2) * 18 + 1.5  // 1.5-19.5范围

      const x = Math.cos(angle) * dist
      const y = (Math.random() - 0.5) * 8
      const z = Math.sin(angle) * dist - 0.3

      // 避开签筒核心区域
      const distFromCenter = Math.sqrt(x*x + y*y + (z+0.3)*(z+0.3))
      if (distFromCenter < 1.7) {
        continue
      }

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // 距离越近亮度越高，距离越远越淡
      const maxDist = 19.5
      const brightnessFactor = Math.max(0, 1 - (distFromCenter - 1.8) / (maxDist - 1.8))
      const brightness = 0.3 + brightnessFactor * 0.7  // 0.3-1.0，中心更亮

      colors[i * 3] = skyR * brightness
      colors[i * 3 + 1] = skyG * brightness
      colors[i * 3 + 2] = skyB * brightness
    }
    return { count, positions, colors }
  })

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const time = clock.getElapsedTime()

    // 检测模式变化，切换阶段时重置旋转
    if (prevModeRef.current !== mode) {
      if (mode !== 'idle' && mode !== 'mouse') {
        // 进入非idle阶段，重置旋转角度为0
        targetRotationRef.current = 0
        currentRotationRef.current = 0
        groupRef.current.rotation.y = 0
      }
      prevModeRef.current = mode
    }

    // 仅在 idle 或 mouse 模式下执行第一阶段逻辑
    if (mode === 'idle' || mode === 'mouse') {
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
      } else {
        // 【无手】：继续缓慢自转
        targetRotationRef.current += 0.004
      }
      // 平滑过渡：current 向 target 靠近
      const lerpFactor = 0.15 // 平滑系数，越大越快
      currentRotationRef.current = currentRotationRef.current + (targetRotationRef.current - currentRotationRef.current) * lerpFactor
      groupRef.current.rotation.y = currentRotationRef.current
    } else {
      // 第二阶段：禁用所有自动旋转，保持静止
      groupRef.current.rotation.y = 0
    }

    groupRef.current.rotation.x = Math.sin(time * 0.015) * 0.02
  })

  return (
    <group ref={groupRef}>
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
          size={0.042}
          vertexColors
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

export const GuanyinBackground = ({
  handPosition,
  mode = 'idle',
}: GuanyinBackgroundProps) => {
  return (
    <group>
      <DiffusionParticles
        mode={mode}
        handPosition={handPosition}
      />
    </group>
  )
}
