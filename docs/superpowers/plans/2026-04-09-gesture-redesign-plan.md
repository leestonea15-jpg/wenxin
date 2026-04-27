# 手势测算重设计 - v1.3 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全屏手势测算，大尺寸中央道具，清晰的状态反馈，修复手势识别问题

**Architecture:** 重写GestureCamera和Modal组件，全屏布局，4种状态管理

**Tech Stack:** React + TypeScript + Framer Motion + MediaPipe Hands

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/hooks/useGestureControl.ts` | Modify | 降低阈值，添加超时，自动开始检测 |
| `frontend/src/components/GestureCamera.tsx` | Rewrite | 全屏布局，4种状态，大尺寸道具 |
| `frontend/src/pages/DailySpeed/MoneyGuaModal.tsx` | Modify | 集成新状态，简化逻辑 |
| `frontend/src/pages/DailySpeed/ShengbeiModal.tsx` | Modify | 集成新状态，简化逻辑 |

---

### Task 1: 修改 useGestureControl hook

**Files:**
- Modify: `frontend/src/hooks/useGestureControl.ts`

- [ ] **Step 1: 降低检测阈值，添加超时机制**

修改相关部分：

```typescript
// 检测摇铜钱手势
const detectShakeGesture = useCallback((landmarks: any[]) => {
  const wrist = landmarks[0]
  const now = Date.now()
  const state = shakeDetectRef.current

  // 检测手腕的上下/左右移动 - 降低阈值
  if (state.lastY !== 0) {
    const deltaY = Math.abs(wrist.y - state.lastY)

    if (deltaY > 0.05 && now - state.lastShakeTime > 200) {
      state.shakeCount++
      state.lastShakeTime = now

      // 连续摇晃2次以上触发
      if (state.shakeCount >= 2) {
        shakeDetectRef.current = {
          lastY: 0,
          shakeCount: 0,
          lastShakeTime: 0,
        }
        return true
      }
    }
  }

  state.lastY = wrist.y

  // 重置计数（如果超过1秒没动作）
  if (now - state.lastShakeTime > 1000) {
    state.shakeCount = 0
  }

  return false
}, [])

// 检测抛圣杯手势 - 降低阈值
const detectThrowUpGesture = useCallback((landmarks: any[]) => {
  const wrist = landmarks[0]
  const now = Date.now()
  const state = throwUpDetectRef.current

  if (!state.isRising) {
    // 等待手腕向下到低位
    if (wrist.y > 0.7) {
      state.isRising = true
      state.startY = wrist.y
      state.startTime = now
    }
  } else {
    // 检测快速向上移动 - 降低阈值
    const deltaY = state.startY - wrist.y
    const deltaTime = now - state.startTime

    if (deltaY > 0.15 && deltaTime < 500) {
      // 成功检测到上抛手势
      throwUpDetectRef.current = {
        isRising: false,
        startY: 0,
        startTime: 0,
      }
      return true
    }

    // 超时重置
    if (deltaTime > 1000) {
      state.isRising = false
    }
  }

  return false
}, [])
```

- [ ] **Step 2: 添加cameraReady时自动开始检测**

在useGestureControl的返回中添加useEffect：

```typescript
// 在cameraReady时自动开始检测
useEffect(() => {
  if (cameraReady && enabled) {
    startDetection()
  }
}, [cameraReady, enabled, startDetection])
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/hooks/useGestureControl.ts
git commit -m "feat: lower gesture detection thresholds, add auto-start"
```

---

### Task 2: 重写 GestureCamera 组件 - 全屏布局

**Files:**
- Rewrite: `frontend/src/components/GestureCamera.tsx`

- [ ] **Step 1: 重写完整的GestureCamera组件**

```typescript
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import QianlongTongbao from './icons/QianlongTongbao'
import Shengbei from './icons/Shengbei'

type GestureState = 'waiting' | 'detecting' | 'success' | 'failed'

interface GestureCameraProps {
  videoRef: React.RefObject<HTMLVideoElement>
  type: 'money_gua' | 'shengbei'
  state: GestureState
  gestureInstruction: string
  onAnimationComplete?: () => void
  onDirectStart?: () => void
}

const GestureCamera = ({
  videoRef,
  type,
  state,
  gestureInstruction,
  onAnimationComplete,
  onDirectStart,
}: GestureCameraProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // 道具动画完成回调
  useEffect(() => {
    if (state === 'success' && onAnimationComplete) {
      const timer = setTimeout(() => {
        onAnimationComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [state, onAnimationComplete])

  // 10秒超时转failed（在父组件处理）

  const getStatusText = () => {
    switch (state) {
      case 'waiting':
        return gestureInstruction
      case 'detecting':
        return '🎯 识别中...'
      case 'success':
        return '✅ 识别成功！'
      case 'failed':
        return '⚠️ 未检测到手势，请再试一次，或点击跳过'
      default:
        return ''
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-neutral-900">
      {/* 全屏摄像头画面 */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* 半透明叠加层 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40">
        {/* 顶部半透明栏 */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-black/30 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="text-white">
            {/* 返回按钮在父组件Modal中 */}
          </div>
          <div className="text-white/70 text-sm">
            {type === 'money_gua' ? '金钱卦' : '掷圣杯'}
          </div>
        </div>

        {/* 中央道具 - 大尺寸 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {type === 'money_gua' ? (
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={
                    state === 'success'
                      ? {
                          y: [0, -60, 0, -40, 0],
                          rotate: [0, 360, 720, 1080, 1440],
                          scale: [1, 1.2, 1],
                        }
                      : state === 'detecting'
                      ? { y: [0, -10, 0], rotate: [0, 5, -5, 0] }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: state === 'detecting' ? Infinity : 0,
                    delay: i * 0.1,
                  }}
                >
                  <QianlongTongbao size={180} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              animate={
                state === 'success'
                  ? { y: [0, -100, 0], rotate: [0, 15, -15, 0] }
                  : state === 'detecting'
                  ? { y: [0, -15, 0] }
                  : {}
              }
              transition={{
                duration: 1,
                repeat: state === 'detecting' ? Infinity : 0,
              }}
            >
              <Shengbei size={200} />
            </motion.div>
          )}

          {/* 识别中状态的加载动画 */}
          {state === 'detecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-white rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* 识别成功状态的星星动画 */}
          {state === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-8 -right-8 text-4xl"
            >
              ✨
            </motion.div>
          )}
        </div>

        {/* 左下角手势示意图 */}
        <div className="absolute bottom-28 left-6 bg-black/50 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-white/80 mb-1">手势示意：</div>
          <div className="text-3xl text-white">
            {type === 'money_gua' ? '✊ ↕️' : '🖐️⬆️'}
          </div>
        </div>
      </div>

      {/* 底部提示框 - 低调样式 */}
      <div className="absolute bottom-6 left-6 right-6">
        <div
          className={`rounded-xl p-4 text-center ${
            state === 'success'
              ? 'bg-green-500/80 text-white'
              : state === 'failed'
              ? 'bg-red-500/80 text-white'
              : 'bg-white/40 text-white backdrop-blur-sm'
          }`}
        >
          <p className="text-sm md:text-base whitespace-pre-line">
            {getStatusText()}
          </p>
        </div>

        {/* 失败状态的直接开始按钮 */}
        {state === 'failed' && onDirectStart && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onDirectStart}
              className="px-6 py-2 bg-white text-neutral-800 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              直接开始
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GestureCamera
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/components/GestureCamera.tsx
git commit -m "feat: rewrite GestureCamera for fullscreen layout"
```

---

### Task 3: 修改 MoneyGuaModal - 集成新状态

**Files:**
- Modify: `frontend/src/pages/DailySpeed/MoneyGuaModal.tsx`

- [ ] **Step 1: 添加超时和failed状态**

```typescript
type ModalMode = 'input' | 'permission' | 'gesture_waiting' | 'gesture_detecting' | 'gesture_success' | 'gesture_failed' | 'animating' | 'result' | 'click_tossing'
```

- [ ] **Step 2: 添加10秒超时逻辑**

```typescript
const [gestureStartTime, setGestureStartTime] = useState<number | null>(null)

// 10秒超时检测
useEffect(() => {
  if (mode === 'gesture_waiting' && gestureStartTime) {
    const timer = setTimeout(() => {
      if (mode === 'gesture_waiting') {
        setMode('gesture_failed')
      }
    }, 10000)
    return () => clearTimeout(timer)
  }
}, [mode, gestureStartTime])
```

- [ ] **Step 3: 修改onGestureDetected**

```typescript
onGestureDetected: async (gesture) => {
  if (gesture === 'shake' && mode === 'gesture_waiting') {
    setMode('gesture_detecting')
    await toss()
    setMode('gesture_success')
  }
},
```

- [ ] **Step 4: 进入gesture_waiting时记录开始时间**

```typescript
const handleStartCamera = async () => {
  try {
    setCameraError('')
    await startCamera()
    setMode('gesture_waiting')
    setGestureStartTime(Date.now())
    startDetection()
  } catch (err) {
    setCameraError('无法访问摄像头，请检查权限设置')
  }
}
```

- [ ] **Step 5: 添加直接开始函数**

```typescript
const handleDirectStart = async () => {
  await toss()
  setMode('animating')
}
```

- [ ] **Step 6: 修改JSX中的状态传递**

```typescript
{mode === 'gesture_waiting' || mode === 'gesture_detecting' || mode === 'gesture_success' || mode === 'gesture_failed' ? (
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
        onClick={handleGestureToss}
        className="fixed top-6 right-6 z-50 px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg text-white text-sm"
      >
        跳过
      </button>
    )}
  </motion.div>
) : (
  // 原有非全屏的内容
)}
```

- [ ] **Step 7: Commit**

```bash
cd frontend
git add src/pages/DailySpeed/MoneyGuaModal.tsx
git commit -m "feat: update MoneyGuaModal for new gesture states"
```

---

### Task 4: 修改 ShengbeiModal - 集成新状态

**Files:**
- Modify: `frontend/src/pages/DailySpeed/ShengbeiModal.tsx`

- [ ] **Step 1: 对ShengbeiModal做同样的修改**

重复Task 3的步骤，应用到ShengbeiModal：
- 添加gesture_failed状态
- 添加10秒超时
- 修改onGestureDetected使用throw_up手势
- 添加handleDirectStart
- 修改JSX使用全屏GestureCamera

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/pages/DailySpeed/ShengbeiModal.tsx
git commit -m "feat: update ShengbeiModal for new gesture states"
```

---

### Task 5: 测试验证

**Files:** （无新文件）

- [ ] **Step 1: 运行TypeScript检查**

```bash
cd frontend
npx tsc --noEmit
```

预期：无TypeScript错误

- [ ] **Step 2: 运行构建**

```bash
cd frontend
npm run build
```

预期：构建成功

---

## 验收检查

- [ ] 手势识别阈值降低
- [ ] cameraReady时自动开始检测
- [ ] GestureCamera全屏布局
- [ ] 中央道具大尺寸（180-200px）
- [ ] 4种状态：waiting/detecting/success/failed
- [ ] 10秒超时转failed
- [ ] failed状态显示"直接开始"按钮
- [ ] 底部提示框颜色低调
- [ ] TypeScript检查通过
- [ ] 构建成功
