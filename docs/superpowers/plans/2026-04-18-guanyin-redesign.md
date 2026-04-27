# 观音灵签页面重新设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完全重新实现观音灵签页面，包括三层粒子签筒、立体感签条、弱对比星空背景、底部毛玻璃控件布局

**Architecture:** 基于现有Three.js粒子系统，重写各个组件（GuanyinPot、GuanyinSticks、GuanyinBackground、GuanyinControls），保持相同的React状态管理接口

**Tech Stack:** React + TypeScript + @react-three/fiber + @react-three/drei + Three.js + Tailwind CSS + Framer Motion

---

## 文件结构

**需要修改的文件：**
- `frontend/src/pages/Guanyin.tsx` - 调整布局，返回按钮位置微调
- `frontend/src/pages/Guanyin/ParticleScene.tsx` - 背景色改为纯黑
- `frontend/src/pages/Guanyin/GuanyinPot.tsx` - 完全重写为三层粒子签筒+烫金"签"字
- `frontend/src/pages/Guanyin/GuanyinSticks.tsx` - 完全重写为立体感签条+烫金签号
- `frontend/src/pages/Guanyin/GuanyinBackground.tsx` - 完全重写为弱对比星空
- `frontend/src/pages/Guanyin/GuanyinControls.tsx` - 完全重写为底部毛玻璃通栏布局

**需要新增的文件：**
- `frontend/src/pages/Guanyin/GuanyinNoise.tsx` - CCD复古噪点滤镜组件

---

## Task 1: 准备工作 - 创建Git分支和检查当前状态

**Files:**
- Check: 所有现有文件

- [ ] **Step 1: 创建新的git分支**

```bash
cd /d/claudeCodeProjects/yunshicesuan
git checkout -b feature/guanyin-redesign
```

- [ ] **Step 2: 验证当前代码可以正常构建**

```bash
cd frontend
npm run build
```

Expected: 构建成功，无TypeScript错误

- [ ] **Step 3: 提交当前状态作为起点**

```bash
cd /d/claudeCodeProjects/yunshicesuan
git add .
git commit -m "chore: start guanyin redesign"
```

---

## Task 2: 修改ParticleScene - 背景色改为纯黑

**Files:**
- Modify: `frontend/src/pages/Guanyin/ParticleScene.tsx:58`

- [ ] **Step 1: 修改背景色**

将第58行：
```tsx
<color attach="background" args={['#0a0a2a']} />
```

改为：
```tsx
<color attach="background" args={['#000000']} />
```

- [ ] **Step 2: 验证TypeScript检查通过**

```bash
cd frontend
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交修改**

```bash
git add frontend/src/pages/Guanyin/ParticleScene.tsx
git commit -m "feat: change particle scene background to pure black"
```

---

## Task 3: 重写GuanyinBackground - 弱对比星空效果

**Files:**
- Modify: `frontend/src/pages/Guanyin/GuanyinBackground.tsx`

- [ ] **Step 1: 完全重写GuanyinBackground组件**

替换整个文件内容为：

```tsx
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GuanyinBackgroundProps {
  handPosition: { x: number; y: number } | null
}

// 弱对比星空粒子
const StarfieldParticles = () => {
  const pointsRef = useRef<THREE.Points>(null)
  const [baseColors] = useState<Float32Array>(() => {
    const count = 400
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // 分布在一个大球体空间内
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 15 + Math.random() * 10
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // 纯白色，低亮度
      const brightness = 0.15 + Math.random() * 0.1
      const centerDist = Math.sqrt(
        positions[i * 3] * positions[i * 3] +
        positions[i * 3 + 1] * positions[i * 3 + 1]
      )
      // 签筒中心区域更暗
      const centerFactor = centerDist < 8 ? 0.5 : 1.0
      colors[i * 3] = brightness * centerFactor
      colors[i * 3 + 1] = brightness * centerFactor
      colors[i * 3 + 2] = brightness * centerFactor
    }
    return colors
  })

  const [particles] = useState(() => {
    const count = 400
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 15 + Math.random() * 10
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    return { count, positions }
  })

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const time = clock.getElapsedTime()
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array

    for (let i = 0; i < particles.count; i++) {
      const i3 = i * 3
      // 呼吸动画：透明度在0.2-0.5之间循环
      const breath = 0.4 + Math.sin(time * 1.5 + i * 0.1) * 0.3
      colors[i3] = baseColors[i3] * breath
      colors[i3 + 1] = baseColors[i3 + 1] * breath
      colors[i3 + 2] = baseColors[i3 + 2] * breath
    }
    pointsRef.current.geometry.attributes.color.needsUpdate = true
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
          array={baseColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export const GuanyinBackground = ({ handPosition }: GuanyinBackgroundProps) => {
  return (
    <group>
      <StarfieldParticles />
    </group>
  )
}
```

- [ ] **Step 2: 验证TypeScript检查通过**

```bash
cd frontend
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交修改**

```bash
git add frontend/src/pages/Guanyin/GuanyinBackground.tsx
git commit -m "feat: rewrite GuanyinBackground with low-contrast starfield"
```

---

## Task 4: 新增GuanyinNoise - CCD复古噪点滤镜

**Files:**
- Create: `frontend/src/pages/Guanyin/GuanyinNoise.tsx`

- [ ] **Step 1: 创建GuanyinNoise组件**

```tsx
import { useEffect, useRef } from 'react'

export const GuanyinNoise = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置canvas大小
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // 生成噪点
    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255
        data[i] = noise     // R
        data[i + 1] = noise // G
        data[i + 2] = noise // B
        data[i + 3] = Math.random() * 50 + 15 // Alpha: 0.15-0.2
      }

      ctx.putImageData(imageData, 0, 0)
    }

    // 初始生成
    generateNoise()

    // 定期更新噪点（每200ms）
    const interval = setInterval(generateNoise, 200)

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(interval)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'overlay' }}
    />
  )
}
```

- [ ] **Step 2: 在Guanyin.tsx中集成GuanyinNoise**

修改`frontend/src/pages/Guanyin.tsx`，在导入部分添加：
```tsx
import { GuanyinNoise } from './Guanyin/GuanyinNoise'
```

然后在返回的JSX中，Three.js粒子场景之后添加：
```tsx
{/* CCD复古噪点滤镜 */}
<GuanyinNoise />
```

- [ ] **Step 3: 验证TypeScript检查通过**

```bash
cd frontend
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 4: 提交修改**

```bash
git add frontend/src/pages/Guanyin/GuanyinNoise.tsx
git add frontend/src/pages/Guanyin.tsx
git commit -m "feat: add GuanyinNoise CCD film grain effect"
```

---

## Task 5: 重写GuanyinPot - 三层粒子签筒+烫金"签"字

**Files:**
- Modify: `frontend/src/pages/Guanyin/GuanyinPot.tsx`

- [ ] **Step 1: 完全重写GuanyinPot组件**

替换整个文件内容为：

```tsx
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GuanyinPotProps {
  mode: string
  isShaking?: boolean
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
    const particleCount = 1200

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
    const particleCount = 800

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
    const particleCount = 200

    // 顶部高光
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = topRadius * (0.8 + Math.random() * 0.2)
      positions.push(
        Math.cos(angle) * r,
        height / 2 - 0.05,
        Math.sin(angle) * r
      )
      const isWhite = Math.random() > 0.5
      colors.push(
        isWhite ? 1.0 : 1.0,
        isWhite ? 1.0 : 0.3,
        isWhite ? 1.0 : 0.3,
      )
    }

    // 正面高光
    for (let i = 0; i < 100; i++) {
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

// 烫金"签"字
const GoldCharacter = () => {
  const pointsRef = useRef<THREE.Points>(null)

  const [particles] = useState(() => {
    const positions: number[] = []
    const colors: number[] = []

    // 简化的"签"字笔画 - 用点模拟
    const strokes = [
      // 竹字头左边
      [[-0.3, 1.2], [-0.35, 1.0], [-0.25, 0.9]],
      // 竹字头右边
      [[0.3, 1.2], [0.35, 1.0], [0.25, 0.9]],
      // 中间一横
      [[-0.4, 0.7], [0, 0.72], [0.4, 0.7]],
      // 左边一竖
      [[-0.25, 0.7], [-0.25, 0.3], [-0.25, -0.1]],
      // 右边部分
      [[0.1, 0.6], [0.3, 0.5], [0.2, 0.3]],
      [[0.15, 0.2], [0.2, 0.0], [0.1, -0.3]],
      [[0.0, 0.0], [0.3, -0.1], [0.2, -0.4]],
    ]

    strokes.forEach((stroke) => {
      for (let i = 0; i < stroke.length - 1; i++) {
        const [x1, y1] = stroke[i]
        const [x2, y2] = stroke[i + 1]
        const steps = 15
        for (let t = 0; t < steps; t++) {
          const p = t / steps
          positions.push(
            x1 + (x2 - x1) * p,
            y1 + (y2 - y1) * p,
            0.01 + Math.random() * 0.02
          )
          colors.push(1.0, 0.84, 0.0) // #ffd700
        }
      }
    })

    // 加一些随机点让字更丰满
    for (let i = 0; i < 100; i++) {
      positions.push(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.2) * 1.6,
        0.01
      )
      colors.push(1.0, 0.84, 0.0)
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  })

  return (
    <points ref={pointsRef} position={[0, 0, 1.55]}>
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
        opacity={0.95}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export const GuanyinPot = ({ mode, isShaking = false }: GuanyinPotProps) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()

    // 签筒呼吸动画
    groupRef.current.position.y = Math.sin(time * 1.5) * 0.08

    // 摇签模式下的晃动效果
    if (isShaking || mode === 'gesture' || mode === 'mouse') {
      groupRef.current.position.y += Math.sin(time * 5) * 0.12
      groupRef.current.rotation.z = Math.sin(time * 4) * 0.06
    }
  })

  return (
    <group ref={groupRef}>
      <PotFillLayer />
      <PotOutlineLayer />
      <PotHighlightLayer />
      <GoldCharacter />
    </group>
  )
}
```

- [ ] **Step 2: 验证TypeScript检查通过**

```bash
cd frontend
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交修改**

```bash
git add frontend/src/pages/Guanyin/GuanyinPot.tsx
git commit -m "feat: rewrite GuanyinPot with three-layer particles and gold character"
```

---

## Task 6: 重写GuanyinSticks - 立体感签条+烫金签号

**Files:**
- Modify: `frontend/src/pages/Guanyin/GuanyinSticks.tsx`

- [ ] **Step 1: 完全重写GuanyinSticks组件**

替换整个文件内容为：

```tsx
import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GuanyinSticksProps {
  mode: string
  isShaking?: boolean
  selectedStickIndex?: number | null
  onStickFlyComplete?: () => void
}

interface SingleStickProps {
  index: number
  angle: number
  heightOffset: number
  swingPhase: number
  swingFreq: number
  zDepth: number
  isFront: boolean
  hasLabel: boolean
  labelNumber: number
  mode: string
  isShaking?: boolean
  isSelected?: boolean
  onFlyComplete?: () => void
}

const SingleStick = ({
  index,
  angle,
  heightOffset,
  swingPhase,
  swingFreq,
  zDepth,
  isFront,
  hasLabel,
  labelNumber,
  mode,
  isShaking = false,
  isSelected = false,
  onFlyComplete,
}: SingleStickProps) => {
  const pointsRef = useRef<THREE.Points>(null)
  const labelRef = useRef<THREE.Points>(null)
  const flyStateRef = useRef({ isFlying: false, startTime: 0, startY: 0 })

  const [particles] = useState(() => {
    const positions: number[] = []
    const colors: number[] = []

    const length = 2.4
    const width = 0.16
    const particleCount = 70

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount
      // 细长矩形，稍微有些随机宽度变化
      const w = width * (0.8 + Math.random() * 0.4)
      positions.push(
        (Math.random() - 0.5) * w,
        t * length - length / 2,
        0
      )

      // 靠前偏白亮，靠后偏红暗
      if (isFront) {
        const brightness = 0.9 + Math.random() * 0.1
        colors.push(brightness, brightness * 0.98, brightness * 0.95)
      } else {
        const brightness = 0.8 + Math.random() * 0.1
        colors.push(brightness * 0.9, brightness * 0.8, brightness * 0.78)
      }
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  })

  // 烫金签号粒子
  const [labelParticles] = useState(() => {
    if (!hasLabel) return { count: 0, positions: new Float32Array(0), colors: new Float32Array(0) }

    const positions: number[] = []
    const colors: number[] = []

    // 简化的数字绘制
    const numbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    const num = labelNumber % 100
    const digits: string[] = []

    if (num >= 10) {
      const tens = Math.floor(num / 10)
      if (tens > 1) digits.push(numbers[tens - 1])
      digits.push('十')
    }
    const ones = num % 10
    if (ones > 0) digits.push(numbers[ones - 1])

    // 用点模拟文字
    digits.forEach((char, charIndex) => {
      const offsetX = (charIndex - digits.length / 2 + 0.5) * 0.12
      for (let i = 0; i < 25; i++) {
        positions.push(
          offsetX + (Math.random() - 0.5) * 0.08,
          0.5 + (Math.random() - 0.5) * 0.3,
          0.01
        )
        colors.push(1.0, 0.84, 0.0) // #ffd700
      }
    })

    // "第"和"签"
    for (let i = 0; i < 20; i++) {
      positions.push(-0.25 + (Math.random() - 0.5) * 0.06, 0.5, 0.01)
      colors.push(1.0, 0.84, 0.0)
    }
    for (let i = 0; i < 20; i++) {
      positions.push(0.25 + (Math.random() - 0.5) * 0.06, 0.5, 0.01)
      colors.push(1.0, 0.84, 0.0)
    }

    return {
      count: positions.length / 3,
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
    }
  })

  useFrame((state) => {
    if (!pointsRef.current) return
    const time = state.clock.getElapsedTime()

    const radius = 0.75
    const baseX = Math.cos(angle) * radius
    const baseZ = Math.sin(angle) * radius + zDepth

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

        pointsRef.current.position.x = baseX
        pointsRef.current.position.y = flyStateRef.current.startY + easeOut * 6
        pointsRef.current.position.z = baseZ
        pointsRef.current.rotation.y = angle + Math.PI / 2
        const tilt = (Math.random() - 0.5) * 0.1
        pointsRef.current.rotation.z = tilt
        const mat = pointsRef.current.material as THREE.PointsMaterial
        mat.size = 0.05 + easeOut * 0.05

        if (labelRef.current) {
          labelRef.current.position.copy(pointsRef.current.position)
          labelRef.current.rotation.copy(pointsRef.current.rotation)
        }
      } else {
        onFlyComplete?.()
      }
    } else {
      const swing = Math.sin(time * swingFreq + swingPhase) * 0.05
      const tilt = Math.sin(time * swingFreq * 0.7 + swingPhase * 1.3) * 0.08

      let shakeX = 0
      let shakeY = 0
      if (isShaking || mode === 'gesture' || mode === 'mouse') {
        shakeX = Math.sin(time * 8 + index) * 0.1
        shakeY = Math.cos(time * 6 + index * 0.5) * 0.06
      }

      pointsRef.current.position.x = baseX + swing + shakeX
      pointsRef.current.position.y = heightOffset + shakeY
      pointsRef.current.position.z = baseZ
      pointsRef.current.rotation.y = angle + Math.PI / 2
      pointsRef.current.rotation.z = tilt
      const mat = pointsRef.current.material as THREE.PointsMaterial
      mat.size = 0.05

      if (labelRef.current) {
        labelRef.current.position.copy(pointsRef.current.position)
        labelRef.current.rotation.copy(pointsRef.current.rotation)
      }
    }
  })

  return (
    <group>
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
          opacity={isFront ? 0.98 : 0.88}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {hasLabel && labelParticles.count > 0 && (
        <points ref={labelRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={labelParticles.count}
              array={labelParticles.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={labelParticles.count}
              array={labelParticles.colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.07}
            vertexColors
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  )
}

export const GuanyinSticks = ({
  mode,
  isShaking = false,
  selectedStickIndex = null,
  onStickFlyComplete,
}: GuanyinSticksProps) => {
  const sticks = useMemo(() => {
    const stickCount = 15
    const labelIndices = [0, 3, 7, 11, 13] // 靠前的几根有标签

    return Array.from({ length: stickCount }).map((_, index) => {
      const angle = (index / stickCount) * Math.PI * 2
      const isFront = Math.cos(angle) > 0 // 正面的签条靠前
      const zDepth = Math.sin(angle) * 0.3 // Z轴深度

      return {
        id: index,
        index,
        angle,
        heightOffset: -0.2 + Math.random() * 0.5, // 高出5%-15%
        swingPhase: Math.random() * Math.PI * 2,
        swingFreq: 0.4 + Math.random() * 0.4,
        zDepth,
        isFront,
        hasLabel: labelIndices.includes(index),
        labelNumber: index + 1,
      }
    }).sort((a, b) => a.zDepth - b.zDepth) // 按Z轴排序，靠后的先渲染
  }, [])

  return (
    <group>
      {sticks.map((stick) => (
        <SingleStick
          key={stick.id}
          {...stick}
          mode={mode}
          isShaking={isShaking}
          isSelected={selectedStickIndex === stick.index}
          onFlyComplete={selectedStickIndex === stick.index ? onStickFlyComplete : undefined}
        />
      ))}
    </group>
  )
}
```

- [ ] **Step 2: 验证TypeScript检查通过**

```bash
cd frontend
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交修改**

```bash
git add frontend/src/pages/Guanyin/GuanyinSticks.tsx
git commit -m "feat: rewrite GuanyinSticks with 3D depth and gold labels"
```

---

## Task 7: 重写GuanyinControls - 底部毛玻璃通栏布局

**Files:**
- Modify: `frontend/src/pages/Guanyin/GuanyinControls.tsx`

- [ ] **Step 1: 完全重写GuanyinControls组件**

替换整个文件内容为：

```tsx
import { motion } from 'framer-motion'

interface GuanyinControlsProps {
  question: string
  onQuestionChange: (value: string) => void
  onQuestionFocus: () => void
  onQuestionBlur: () => void
  onGestureMode: () => void
  onMouseMode: () => void
  cameraReady: boolean
  pageState: string
}

export const GuanyinControls = ({
  question,
  onQuestionChange,
  onQuestionFocus,
  onQuestionBlur,
  onGestureMode,
  onMouseMode,
  cameraReady,
  pageState,
}: GuanyinControlsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute bottom-0 left-0 right-0 z-30"
    >
      <div
        className="mx-auto max-w-4xl px-4 pb-6 pt-4"
        style={{
          background: 'rgba(15, 15, 30, 0.65)',
          backdropFilter: 'blur(16px) saturate(130%)',
          WebkitBackdropFilter: 'blur(16px) saturate(130%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-end gap-4">
          {/* 输入框 */}
          <div className="flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onFocus={onQuestionFocus}
              onBlur={onQuestionBlur}
              placeholder="请输入你想求问的问题..."
              className="w-full bg-white/5 border border-white/15 rounded-xl px-5 py-3.5 text-white placeholder-white/45 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/10 text-base transition-all"
            />
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              onClick={onGestureMode}
              className="group relative px-5 py-3.5 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
              <div className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 003 0v-6a1.5 1.5 0 00-3 0m0 6h3m-3 0H4m13 0h3" />
                </svg>
                <span className="text-white/85 text-sm font-medium">手势控制</span>
              </div>
            </button>

            <button
              onClick={onMouseMode}
              className="group relative px-5 py-3.5 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/5"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
              <div className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span className="text-white/85 text-sm font-medium">鼠标控制</span>
              </div>
            </button>
          </div>
        </div>

        {/* 提示文字 */}
        <p className="text-white/40 text-xs mt-3 text-center">
          {pageState === 'input_focused'
            ? '输入你的问题，然后选择抽签方式'
            : cameraReady
              ? '摄像头已就绪'
              : '请允许摄像头权限以体验手势控制'}
        </p>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: 调整Guanyin.tsx中的提示位置**

修改`frontend/src/pages/Guanyin.tsx`，因为现在控件在底部，原有的提示可能会重叠。可以调整或者移除第137-154行的模式提示。

- [ ] **Step 3: 验证TypeScript检查通过**

```bash
cd frontend
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 4: 提交修改**

```bash
git add frontend/src/pages/Guanyin/GuanyinControls.tsx
git add frontend/src/pages/Guanyin.tsx
git commit -m "feat: rewrite GuanyinControls with bottom frosted glass layout"
```

---

## Task 8: 最终验证和测试

**Files:**
- Test: 所有修改的文件

- [ ] **Step 1: 运行TypeScript检查**

```bash
cd frontend
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 2: 运行生产构建**

```bash
cd frontend
npm run build
```

Expected: 构建成功

- [ ] **Step 3: 启动开发服务器测试**

```bash
cd frontend
npm run dev
```

手动测试：
- 签筒三层粒子效果是否明显
- 签条是否有前后层次感
- 背景星空是否柔和不抢戏
- 底部控件布局是否合理
- 手势控制和鼠标控制功能是否正常
- 抽签流程是否完整

- [ ] **Step 4: 提交最终状态**

```bash
cd /d/claudeCodeProjects/yunshicesuan
git add .
git commit -m "feat: complete guanyin redesign"
```

---

## 验收检查

对照设计文档检查所有要求：

- [ ] 签筒三层粒子结构（轮廓、填充、高光）
- [ ] 签筒烫金"签"字
- [ ] 签条细长矩形，比例15:1
- [ ] 签条顶部随机高出5%-15%
- [ ] 签条随机倾斜±5°
- [ ] 签条前后分层（亮色/暗色）
- [ ] 3-5根签条有烫金"第X签"文字
- [ ] 纯黑背景
- [ ] 弱对比星空粒子（圆形、羽化、亮度15%-25%）
- [ ] 中心区域背景更暗，边缘稍亮
- [ ] 300-500个背景粒子，直径1-2px
- [ ] 背景粒子呼吸动画（透明度0.2→0.5）
- [ ] CCD复古噪点滤镜（透明度0.15-0.2）
- [ ] 底部居中通栏毛玻璃控件
- [ ] 输入框半透明融合背景
- [ ] 两个按钮颜色融合不突兀
- [ ] backdrop-filter: blur(16px) saturate(130%)
- [ ] 背景rgba(15,15,30,0.65)
- [ ] 按钮hover上浮和阴影效果
- [ ] 签筒缓慢上下呼吸动画
- [ ] 签条微小随机晃动
