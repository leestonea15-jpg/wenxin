import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GuanyinEffectsProps {
  active: boolean
  position?: { x: number; y: number; z: number }
}

export const StickBurstEffect = ({ active, position = { x: 0, y: 0, z: 0 } }: GuanyinEffectsProps) => {
  const pointsRef = useRef<THREE.Points>(null)
  const [particles, setParticles] = useState<{
    count: number
    positions: Float32Array
    colors: Float32Array
    velocities: Float32Array
    lifetimes: Float32Array
  } | null>(null)
  const startTimeRef = useRef<number>(0)
  const isActiveRef = useRef(false)

  // 初始化爆发粒子
  useEffect(() => {
    if (active && !isActiveRef.current) {
      isActiveRef.current = true
      startTimeRef.current = 0

      const count = 600
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const velocities = new Float32Array(count * 3)
      const lifetimes = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        // 从中心位置开始
        positions[i * 3] = position.x
        positions[i * 3 + 1] = position.y
        positions[i * 3 + 2] = position.z

        // 随机方向的速度
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const speed = 0.05 + Math.random() * 0.08
        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
        velocities[i * 3 + 1] = Math.cos(phi) * speed
        velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed

        // 金色/暖金色
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.85 + Math.random() * 0.15
        colors[i * 3 + 2] = 0.1 + Math.random() * 0.1

        // 随机生命周期
        lifetimes[i] = 2.0 + Math.random() * 1.0
      }

      setParticles({ count, positions, colors, velocities, lifetimes })
    } else if (!active) {
      isActiveRef.current = false
      setParticles(null)
    }
  }, [active, position])

  useFrame(({ clock }) => {
    if (!pointsRef.current || !particles) return

    if (startTimeRef.current === 0) {
      startTimeRef.current = clock.getElapsedTime()
    }

    const elapsed = clock.getElapsedTime() - startTimeRef.current
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array

    for (let i = 0; i < particles.count; i++) {
      const i3 = i * 3

      // 更新位置
      positions[i3] += particles.velocities[i3]
      positions[i3 + 1] += particles.velocities[i3 + 1]
      positions[i3 + 2] += particles.velocities[i3 + 2]

      // 重力效果
      particles.velocities[i3 + 1] -= 0.001

      // 淡出效果
      const lifeRatio = Math.max(0, 1 - elapsed / particles.lifetimes[i])
      colors[i3] = particles.colors[i3] * lifeRatio
      colors[i3 + 1] = particles.colors[i3 + 1] * lifeRatio
      colors[i3 + 2] = particles.colors[i3 + 2] * lifeRatio
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.color.needsUpdate = true
  })

  if (!particles) return null

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
        size={0.08}
        vertexColors
        transparent
        opacity={1.0}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
