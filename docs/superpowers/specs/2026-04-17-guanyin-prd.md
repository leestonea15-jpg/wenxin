---
name: 观音灵签功能PRD与技术设计
description: 观音灵签功能的完整产品需求文档与技术实现设计
type: prd+spec
---

# 观音灵签 - PRD与技术设计

**产品名称**：问心 - 观音灵签  
**版本**：v1.4  
**日期**：2026-04-17  
**文档状态**：可交付

---

## 目录

1. [产品需求 (PRD)](#1-产品需求-prd)
2. [技术设计 (Spec)](#2-技术设计-spec)

---

## 1. 产品需求 (PRD)

### 1.1 功能概述

观音灵签是问心运势测算网站的核心功能之一，用户可以通过手势控制或鼠标点击的方式进行抽签，获得签文后由AI结合用户的具体问题提供个性化解读，并支持多轮对话追问。

### 1.2 设计理念

- **沉浸式体验**：全屏粒子特效背景，营造神秘氛围感
- **手势交互**：通过MediaPipe Hands识别用户手势，控制粒子效果和抽签流程
- **AI个性化**：结合固定签文和用户具体问题，提供个性化解读
- **仪式感**：从进入页面到出签的完整流程，注重用户心理体验

### 1.3 用户故事

| ID | 用户故事 | 优先级 |
|----|---------|--------|
| US-1 | 作为用户，我想进入观音灵签页面后看到美丽的粒子特效，以便获得沉浸式体验 | P0 |
| US-2 | 作为用户，我想在未选择模式时用手势控制粒子流动，以便体验互动乐趣 | P1 |
| US-3 | 作为用户，我想输入自己想求问的问题，以便获得针对性的签文解读 | P0 |
| US-4 | 作为用户，我想选择手势控制方式，通过挥手来摇签筒，以便获得仪式感 | P0 |
| US-5 | 作为用户，我想选择鼠标点击方式，通过长按签筒来摇签，以便在摄像头不可用时也能使用 | P0 |
| US-6 | 作为用户，我想看到签文的详细内容（编号、等级、签诗、典故），以便了解签文含义 | P0 |
| US-7 | 作为用户，我想获得AI结合我的问题给出的个性化解读，以便得到针对性指引 | P0 |
| US-8 | 作为用户，我想与AI进行多轮对话追问，以便深入了解签文启示 | P1 |

### 1.4 用户交互流程

```
进入观音灵签页面
    ↓
自动获取摄像头权限
    ↓
[状态1] 未选择模式：
  - 粒子响应手势（散开/移动/聚合）
  - 但不触发出签
    ↓
用户输入问题
    ↓
[状态2] 聚焦输入框：
  - 粒子固定模式
    ↓
用户点击"手势控制"或"鼠标控制"
    ↓
[状态3] 选择模式后：
  - 输入框和按钮淡出消失
  - 手势控制：左右挥手 → 签筒晃动 → 停止 → 签子飞出
  - 鼠标控制：长按签筒 → 签筒晃动 → 松开 → 签子飞出
    ↓
[状态4] 出签后：
  - 粒子颜色随签文变化
  - 显示签文（编号、等级、签诗、典故）
  - AI初次解读
  - 聊天区域支持多轮追问
```

### 1.5 页面布局设计

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│                                                           │
│                    全屏粒子背景                          │
│                                                           │
│              [粒子签筒 + 粒子签条]                       │
│                                                           │
│                                                           │
│                                                           │
│                                                           │
│                                                           │
│                                                           │
│                                                           │
│                    [问题输入框] [手势] [鼠标]            │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**布局说明**：
- 全屏：Three.js粒子场景
- 中央：粒子组成的签筒和签条
- 中下底部：问题输入框 + 两个按钮（不遮挡主视觉）
- 选择模式后：输入框和按钮淡出消失

### 1.6 粒子交互状态

#### 状态1：页面刚进入（未选择模式）
- 自动获取摄像头权限
- 粒子响应手势但不触发出签：
  - 手掌推开 → 粒子散开
  - 左右挥手 → 粒子跟着移动
  - 手往身侧前拉 → 粒子往中央聚合

#### 状态2：聚焦输入框
- 背景粒子 + 签筒签条固定模式，不再晃动

#### 状态3：选择控制模式后
- 输入框和按钮淡出消失
- **手势控制模式**：左右挥手 → 签筒粒子晃动、旋转、飞溅 → 停止挥手 → 签子飞出
- **鼠标控制模式**：长按签筒粒子 → 签筒晃动 → 松开 → 签子飞出

#### 状态4：出签后
- 粒子颜色根据签文吉凶变化（吉签金色、凶签灰色等）

### 1.7 签文数据结构

观音灵签共100签，每签包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 签编号 1-100 |
| level | string | 等级：上上签、上签、中签、下签、下下签 |
| title | string | 签文标题 |
| poem | string | 签诗 |
| story | string | 典故 |
| meaning | string | 含义解释 |

---

## 2. 技术设计 (Spec)

### 2.1 技术栈

**前端**：
- React 18
- TypeScript
- Three.js（粒子特效）
- MediaPipe Hands（手势识别）
- Framer Motion（动画）
- Tailwind CSS（样式）

**后端**：
- FastAPI (Python)
- SQLAlchemy 2.0
- OpenAI/Anthropic SDK（AI解读）

**数据库**：
- Supabase PostgreSQL

### 2.2 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Guanyin.tsx (主页面)                         │  │
│  │  ┌──────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ ParticleScene    │  │  问题输入框 + 按钮        │  │  │
│  │  │ (Three.js粒子)   │  │                          │  │  │
│  │  └──────────────────┘  └──────────────────────────┘  │  │
│  │  ┌──────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ StickDisplay     │  │      ChatArea            │  │  │
│  │  │ (签文展示)       │  │   (AI对话区域)           │  │  │
│  │  └──────────────────┘  └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Hooks 层                                  │  │
│  │  - useGuanyin.ts (业务逻辑)                           │  │
│  │  - useGuanyinGesture.ts (手势识别)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Utils 层                                  │  │
│  │  - guanyin.ts (签文数据-精简版)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            │
┌─────────────────────────────────────────────────────────────┐
│                      后端 (FastAPI)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  api/guanyin.py  │  │ services/        │                │
│  │   (API路由)       │  │  - guanyin.py    │                │
│  └──────────────────┘  │  - ai_agent.py   │                │
│                         └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                    数据库 (Supabase)                          │
│  - divination_records (测算记录表)                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 前端文件结构

```
frontend/src/
├── pages/
│   ├── Guanyin.tsx                    # 观音灵签主页面
│   └── Guanyin/
│       ├── ParticleScene.tsx          # Three.js粒子场景组件
│       ├── StickDisplay.tsx           # 签文展示组件
│       └── ChatArea.tsx               # AI对话聊天区域
├── hooks/
│   ├── useGuanyin.ts                  # 观音灵签业务逻辑Hook
│   └── useGuanyinGesture.ts           # 观音灵签手势识别Hook
├── utils/
│   ├── guanyin.ts                     # 100签文数据（前端精简版）
│   └── constants.ts                   # 常量定义
└── components/
    └── icons/
        └── GuanyinStick.tsx           # 备用静态签图标（非粒子）
```

### 2.4 后端文件结构

```
backend/app/
├── api/
│   └── guanyin.py                     # 观音灵签API路由
├── services/
│   ├── guanyin.py                     # 签文数据服务
│   └── ai_agent.py                    # AI Agent解读服务
└── models/
    └── schemas.py                     # Pydantic数据模型
```

### 2.5 前端核心组件设计

#### 2.5.1 Guanyin.tsx（主页面）

**状态管理**：
```typescript
type PageState = 
  | 'idle'              // 初始状态，未选择模式
  | 'input_focused'     // 聚焦输入框
  | 'gesture_mode'      // 手势控制模式
  | 'mouse_mode'        // 鼠标控制模式
  | 'drawing'           // 抽签动画中
  | 'result'            // 显示结果

interface GuanyinState {
  pageState: PageState
  question: string
  selectedStick: GuanyinStick | null
  conversation: Message[]
}
```

**主要功能**：
- 页面布局管理
- 状态流转控制
- 子组件协调

#### 2.5.2 ParticleScene.tsx（Three.js粒子场景）

**粒子系统组成**：
- 背景粒子系统（数千个粒子）
- 签筒粒子系统（特定形状排列）
- 签条粒子系统（多根签条）

**Props接口**：
```typescript
interface ParticleSceneProps {
  mode: 'idle' | 'gesture' | 'mouse' | 'drawing' | 'result'
  handPosition: { x: number; y: number } | null
  stickLevel: string | null  // 用于出签后粒子颜色变化
  onMouseLongPress?: () => void
  onMouseRelease?: () => void
}
```

#### 2.5.3 useGuanyinGesture.ts（手势识别Hook）

**功能**：
- 封装MediaPipe Hands
- 检测三种手势状态：
  - 手掌推开（粒子散开）
  - 左右挥手（粒子移动 / 签筒晃动）
  - 手往前拉（粒子聚合）
- 区分"未选择模式"和"已选择手势模式"的手势响应

**返回值**：
```typescript
interface UseGuanyinGestureReturn {
  handPosition: { x: number; y: number } | null
  gestureType: 'push_open' | 'wave' | 'pull_in' | 'draw' | null
  startCamera: () => Promise<void>
  stopCamera: () => void
}
```

### 2.6 后端API设计

#### 2.6.1 获取随机签文

```
POST /api/guanyin/draw
```

**Request Body**:
```json
{}
```

**Response**:
```json
{
  "stick": {
    "id": 1,
    "level": "上上签",
    "title": "天门一挂",
    "poem": "天门一挂挂金牌，有志功名必自来...",
    "story": "姜太公钓鱼...",
    "meaning": "此签求官得官，求财得财..."
  }
}
```

#### 2.6.2 AI初次解读

```
POST /api/guanyin/interpret
```

**Request Body**:
```json
{
  "question": "我今年能找到理想的工作吗？",
  "stick": {
    "id": 1,
    "level": "上上签",
    "title": "天门一挂",
    "poem": "天门一挂挂金牌...",
    "story": "姜太公钓鱼...",
    "meaning": "此签求官得官..."
  }
}
```

**Response**:
```json
{
  "interpretation": "根据这支上上签，你今年找工作的运势非常好..."
}
```

#### 2.6.3 AI追问

```
POST /api/guanyin/followup
```

**Request Body**:
```json
{
  "question": "我应该往哪个方向发展？",
  "stick": { ... },
  "history": [
    {"role": "user", "content": "我今年能找到理想的工作吗？"},
    {"role": "assistant", "content": "根据这支上上签..."}
  ]
}
```

**Response**:
```json
{
  "reply": "结合签文典故姜太公钓鱼，建议你耐心等待..."
}
```

#### 2.6.4 保存记录

```
POST /api/guanyin/save-record
```

**Request Body**:
```json
{
  "user_id": "uuid",
  "question": "我今年能找到理想的工作吗？",
  "stick": { ... },
  "conversation": [ ... ]
}
```

**Response**:
```json
{
  "id": "record-uuid",
  "created_at": "2026-04-17T10:30:00Z"
}
```

### 2.7 数据模型

#### 2.7.1 前端TypeScript接口

```typescript
// 签文数据
interface GuanyinStick {
  id: number
  level: string
  title: string
  poem: string
  story: string
  meaning: string
}

// 对话消息
interface Message {
  role: 'user' | 'assistant'
  content: string
}

// 测算记录
interface DivinationRecord {
  id: string
  user_id: string
  type: 'guanyin'
  question: string
  stick: GuanyinStick
  conversation: Message[]
  created_at: Date
}
```

#### 2.7.2 后端Pydantic模型

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class GuanyinStick(BaseModel):
    id: int
    level: str
    title: str
    poem: str
    story: str
    meaning: str

class Message(BaseModel):
    role: str
    content: str

class DrawRequest(BaseModel):
    pass

class DrawResponse(BaseModel):
    stick: GuanyinStick

class InterpretRequest(BaseModel):
    question: str
    stick: GuanyinStick

class InterpretResponse(BaseModel):
    interpretation: str

class FollowupRequest(BaseModel):
    question: str
    stick: GuanyinStick
    history: List[Message]

class FollowupResponse(BaseModel):
    reply: str

class SaveRecordRequest(BaseModel):
    user_id: str
    question: str
    stick: GuanyinStick
    conversation: List[Message]

class SaveRecordResponse(BaseModel):
    id: str
    created_at: datetime
```

### 2.8 数据库表结构

**测算记录表 (divination_records)**
```sql
CREATE TABLE divination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'guanyin'
    question TEXT,
    stick JSONB NOT NULL,
    conversation JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at DESC)
);
```

### 2.9 路由更新

在 `App.tsx` 中更新路由：
```typescript
{/* 观音灵签 - 独立页面 */}
<Route path="/guanyin" element={<Guanyin />} />
```

在 `NavigationDrawer.tsx` 和 `Home.tsx` 中启用观音灵签入口（移除 `disabled` 和 `comingSoon`）。

---

**文档结束**

**版本**：v1.4  
**最后更新**：2026-04-17
