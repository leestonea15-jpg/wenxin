# 圣杯图标和手势测算页面重新设计 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重新设计圣杯图标为传统竖版月牙样式，隐藏摄像头画面，增大手势测算页面圣杯尺寸，并添加阴阳杯区分和说明

**Architecture:** 分三个主要任务：1) 重写 Shengbei 组件支持新样式和阴阳杯变体 2) 修改 GestureCamera 隐藏摄像头并调整尺寸 3) 更新 ShengbeiModal 结果展示

**Tech Stack:** React + TypeScript + SVG + Tailwind CSS + Framer Motion

---

## 文件结构

- `frontend/src/components/icons/Shengbei.tsx` - 重写，支持竖版月牙、阴阳杯变体
- `frontend/src/components/GestureCamera.tsx` - 修改，隐藏摄像头，增大圣杯尺寸
- `frontend/src/pages/DailySpeed/ShengbeiModal.tsx` - 修改，结果展示添加文字说明和阴阳杯区分

---

### Task 1: 重写 Shengbei 组件 - 竖版月牙和阴阳杯

**Files:**
- Modify: `frontend/src/components/icons/Shengbei.tsx`

- [ ] **Step 1: 读取当前文件内容**

```typescript
// 先读取当前文件内容，确认结构
```

- [ ] **Step 2: 重写组件，支持竖版月牙和阴阳杯**

```typescript
interface ShengbeiProps {
  size?: number
  className?: string
  type?: 'default' | 'yang' | 'yin'  // 新增：支持阴阳杯变体
}

const Shengbei = ({ size = 64, className = '', type = 'default' }: ShengbeiProps) => {
  // 阳杯：红色渐变
  // 阴杯：棕色渐变
  const yangGradient = `
    <linearGradient id="yangCupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#dc2626" />
      <stop offset="100%" stopColor="#7f1d1d" />
    </linearGradient>
  `;
  
  const yinGradient = `
    <linearGradient id="yinCupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#78350f" />
      <stop offset="100%" stopColor="#422006" />
    </linearGradient>
  `;

  const getGradient = (cupType: 'yang' | 'yin') => {
    if (type === 'yin') {
      return {
        fill: "url(#yinCupGradient)",
        stroke: "#1c0a00"
      };
    }
    return {
      fill: "url(#yangCupGradient)",
      stroke: "#450a0a"
    };
  };

  const leftStyle = getGradient(type === 'yin' ? 'yin' : 'yang');
  const rightStyle = type === 'default' ? getGradient('yang') : getGradient(type);

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
    >
      <defs>
        <linearGradient id="yangCupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="yinCupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#422006" />
        </linearGradient>
      </defs>

      {/* 左杯 - 竖版，月牙尖朝右，弧度向内收 */}
      <g transform="translate(15, 10)">
        <path
          d="M 30 0 Q 5 30 30 60 Q 35 30 30 0"
          fill={type === 'yin' ? "url(#yinCupGradient)" : "url(#yangCupGradient)"}
          stroke={type === 'yin' ? "#1c0a00" : "#450a0a"}
          strokeWidth="1.5"
        />
      </g>

      {/* 右杯 - 竖版，月牙尖朝左，弧度向内收 */}
      <g transform="translate(55, 10)">
        <path
          d="M 0 0 Q 25 30 0 60 Q -5 30 0 0"
          fill={type === 'yin' || type === 'default' ? "url(#yangCupGradient)" : "url(#yinCupGradient)"}
          stroke={type === 'yin' || type === 'default' ? "#450a0a" : "#1c0a0a"}
          strokeWidth="1.5"
        />
      </g>
    </svg>
  )
}

export default Shengbei
```

- [ ] **Step 3: 提交更改**

```bash
cd frontend
git add src/components/icons/Shengbei.tsx
git commit -m "feat: 重写圣杯图标为竖版月牙样式，支持阴阳杯变体"
```

---

### Task 2: 修改 GestureCamera - 隐藏摄像头，增大圣杯尺寸

**Files:**
- Modify: `frontend/src/components/GestureCamera.tsx`

- [ ] **Step 1: 读取当前文件内容**

- [ ] **Step 2: 修改视频元素为隐藏，调整背景**

修改第64-72行：
```typescript
{/* 摄像头元素（隐藏，仅用于MediaPipe手势识别） */}
<video
  ref={videoRef}
  className="hidden"
  playsInline
  muted
/>
```

修改第65行外层容器背景：
```typescript
<div ref={containerRef} className="relative w-full h-screen bg-gradient-to-b from-neutral-900 to-black">
```

- [ ] **Step 3: 增大圣杯尺寸到300px**

修改第128行：
```typescript
<Shengbei size={300} />
```

铜钱尺寸保持不变（180px）。

- [ ] **Step 4: 提交更改**

```bash
git add src/components/GestureCamera.tsx
git commit -m "feat: 隐藏摄像头画面，增大圣杯尺寸到300px"
```

---

### Task 3: 更新 ShengbeiModal - 结果展示增强

**Files:**
- Modify: `frontend/src/pages/DailySpeed/ShengbeiModal.tsx`

- [ ] **Step 1: 读取当前文件内容**

- [ ] **Step 2: 修改 ResultDisplay 组件，添加阴阳杯区分和文字说明**

修改第43-93行：
```typescript
const ResultDisplay = ({ result }: { result: ShengbeiDivinationResult }) => {
  const getCupStyle = (side: 'yang' | 'yin') => ({
    gradient: side === 'yang' 
      ? 'from-red-600 to-red-800' 
      : 'from-amber-800 to-amber-950',
    stroke: side === 'yang' ? '#450a0a' : '#1c0a00'
  });

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
            {result.times === 3 && (
              <span className="text-neutral-500 w-16 text-right">
                第{index + 1}次：
              </span>
            )}
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
```

- [ ] **Step 3: 提交更改**

```bash
git add src/pages/DailySpeed/ShengbeiModal.tsx
git commit -m "feat: 圣杯结果展示添加阴阳杯区分和文字说明"
```

---

### Task 4: 测试验证

**Files:**
- 测试: 本地运行验证所有改动

- [ ] **Step 1: 启动开发服务器**

```bash
cd frontend
npm run dev
```

- [ ] **Step 2: 手动验证**

检查项：
- [ ] 首页圣杯卡片显示为竖版月牙
- [ ] 手势测算页面不显示摄像头画面
- [ ] 手势测算页面圣杯尺寸约300px
- [ ] 圣杯结果展示有红色/棕色阴阳杯区分
- [ ] 结果展示有"红色为阳杯，棕色为阴杯"文字说明
- [ ] 金钱卦手势测算也正常工作（摄像头同样隐藏）

---

## 验收清单

- [ ] Shengbei 组件支持竖版月牙尖相对样式
- [ ] 阳杯全红色，阴杯全棕色
- [ ] 手势测算页面摄像头隐藏，背景为深色渐变
- [ ] 手势测算页面圣杯尺寸为300px
- [ ] 结果展示有阴阳杯颜色区分和文字说明
- [ ] 所有功能正常工作
