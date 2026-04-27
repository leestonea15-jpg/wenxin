---
name: 问心 - 运势测算网站完整PRD
description: 针对技术团队的完整产品需求文档，包含当前进度、技术实现、数据流转和后续规划
type: prd
---

# 问心 - 运势测算网站 PRD

**产品名称**：问心  
**版本**：v1.3  
**日期**：2026-04-17  
**文档状态**：可交付

---

## 1. 文档修订记录

| 版本 | 日期 | 修订人 | 修订内容 |
|------|------|--------|----------|
| v1.3 | 2026-04-17 | 开发团队 | 完整PRD文档，包含v1.3所有功能 |

---

## 2. 产品概述

### 2.1 产品定位
问心是一个现代简约风格的运势测算网站，提供多种传统命理测算玩法，创新性地支持手势控制交互，让用户体验更具仪式感。

### 2.2 Slogan
每一次对命运的探索和好奇，都源自于内心对自我了解的渴望。

### 2.3 产品愿景
打造一个融合传统文化与现代科技的命理探索平台，让用户在快节奏的生活中，获得片刻的内心宁静与指引。

### 2.4 目标用户
- 对传统文化、命理测算感兴趣的年轻用户
- 喜欢新鲜事物、愿意尝试手势交互的科技爱好者
- 寻求内心指引、希望获得心理慰藉的用户

---

## 3. 产品功能架构

### 3.1 整体功能模块图

```
┌─────────────────────────────────────────────────────────────────┐
│                          问心 - 产品功能架构                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │   用户认证模块   │    │    首页模块      │                  │
│  │  - 手机号登录    │    │  - Hero展示      │                  │
│  │  - 首次注册      │    │  - 2×2玩法卡片   │                  │
│  │  - 个人中心      │    │  - 导航栏        │                  │
│  └──────────────────┘    └──────────────────┘                  │
│           │                           │                           │
│           └──────────────┬────────────┘                           │
│                          │                                        │
│                  ┌───────┴────────┐                               │
│                  │  每日速测模块   │                               │
│                  │   (核心功能)    │                               │
│                  └───────┬────────┘                               │
│                          │                                        │
│          ┌───────────────┴───────────────┐                       │
│          │                               │                       │
│  ┌───────▼────────┐            ┌────────▼───────┐               │
│  │   金钱卦测算   │            │   掷圣杯测算   │               │
│  │  - 手势测算    │            │  - 手势测算    │               │
│  │  - 点击测算    │            │  - 点击测算    │               │
│  │  - 结果展示    │            │  - 阴阳杯区分  │               │
│  └────────────────┘            │  - 结果展示    │               │
│                                  └────────────────┘               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   手势控制系统（技术亮点）                 │  │
│  │  - MediaPipe Hands 手部检测                               │  │
│  │  - shake（摇）手势 → 触发金钱卦                           │  │
│  │  - throw_up（抛）手势 → 触发掷圣杯                        │  │
│  │  - 摄像头隐私保护（不显示人像）                            │  │
│  │  - 降级方案（手势失败可点击跳过）                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  历史记录模块    │    │   后续规划模块    │                  │
│  │  (待完善)        │    │  - 观音灵签       │                  │
│  │                  │    │  - 塔罗牌         │                  │
│  └──────────────────┘    │  - 八字排盘       │                  │
│                            └──────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 核心功能设计

#### 3.2.1 用户认证系统
**设计目标**：简化注册流程，降低使用门槛
- **登录方式**：手机号+验证码，无需设置密码
- **自动注册**：首次登录自动创建账号
- **状态持久化**：登录状态保存到localStorage
- **个人中心**：提供个人资料、历史记录、反馈建议等入口

#### 3.2.2 首页设计
**设计目标**：简洁大气，快速引导用户
- **Hero区域**：展示Slogan和产品特色
- **2×2玩法卡片**：4个玩法入口（每日速测、观音灵签、塔罗牌、八字排盘）
- **导航栏**：左侧Logo，右侧登录/注册按钮（或用户头像）
- **紧凑化布局**：确保玩法卡片一屏可见

#### 3.2.3 每日速测（核心体验）
**设计目标**：简单易用，仪式感强

**金钱卦测算**：
- **两种触发方式**：手势测算（摇）或点击测算
- **视觉元素**：三枚乾隆通宝，金色渐变
- **结果展示**：卦象判定（少阳/少阴/老阳/老阴）+ 卦辞解读
- **操作流程**：输入问题 → 选择测算方式 → 完成测算 → 查看结果

**掷圣杯测算**：
- **两种触发方式**：手势测算（抛）或点击测算
- **视觉元素**：朱红色圣杯，竖版月牙尖相对样式
- **阴阳杯区分**：红色=阳杯，棕色=阴杯
- **结果展示**：圣杯判定（圣卦/阴卦/阳卦）+ 结果解读 + 阴阳杯说明
- **操作流程**：输入问题 → 选择测算方式 → 完成测算 → 查看结果

#### 3.2.4 手势控制（创新体验）
**设计目标**：科技感强，隐私保护
- **摄像头静默开启**：不显示人像画面，仅UI界面
- **全屏沉浸式体验**：深色背景，大尺寸中央道具
- **两种手势**：
  - shake（摇）：握拳上下/左右晃动 → 触发金钱卦
  - throw_up（抛）：手向下再向上快速挥动 → 触发掷圣杯
- **完整降级方案**：30秒超时，超时可点击"跳过"直接开始
- **状态提示**：waiting/detecting/success/failed 四种状态

### 3.3 用户交互流程设计

#### 3.3.1 核心使用路径
```
新用户访问首页
    ↓
浏览玩法卡片
    ↓
点击"每日速测"
    ↓
弹出登录框
    ↓
手机号+验证码登录
    ↓
进入每日速测页面
    ↓
选择"金钱卦"或"掷圣杯"
    ↓
输入问题（可选）
    ↓
选择"手势测算"或"点击测算"
    ↓
完成测算
    ↓
查看结果
    ↓
关闭 → 返回每日速测页面
或
再测一次 → 重新开始
```

#### 3.3.2 手势测算路径
```
选择"手势测算"
    ↓
进入全屏手势界面
    ↓
等待摄像头启动
    ↓
按照提示做手势
    ↓
检测到手势 → 播放动画 → 显示结果
    ↓
或
30秒未检测到 → 显示"跳过"按钮 → 点击跳过 → 回到每日速测页面
```

---

## 4. 技术架构

### 4.1 技术栈

**前端**
- 框架：React 18
- 构建工具：Vite
- 样式：Tailwind CSS
- 状态管理：Zustand
- 路由：React Router v6
- 动画：Framer Motion
- 手势识别：MediaPipe Hands
- 语言：TypeScript

**后端**
- 框架：FastAPI (Python)
- ORM：SQLAlchemy 2.0

**数据库与认证**
- 数据库：Supabase PostgreSQL
- 认证：Supabase Auth（预留，当前使用本地模拟）

### 4.2 整体技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   页面层     │  │  组件层      │  │  Hooks层     │   │
│  │  (Pages)     │  │ (Components) │  │   (Hooks)    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              状态管理 (Zustand)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            │
┌─────────────────────────────────────────────────────────────┐
│                      后端 (FastAPI)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  API路由层   │  │  业务逻辑层   │  │  数据模型层   │   │
│  │   (Routes)   │  │  (Services)   │  │  (Schemas)   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────────┐
│                    数据库 (Supabase)                          │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 目录结构

```
yunshicesuan/
├── frontend/                           # React前端
│   ├── src/
│   │   ├── components/                 # 通用组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Layout.tsx
│   │   │   ├── GestureCamera.tsx      # 手势摄像头组件
│   │   │   └── icons/                 # SVG图标
│   │   │       ├── Shengbei.tsx       # 圣杯图标（支持阴阳杯）
│   │   │       └── QianlongTongbao.tsx # 乾隆通宝图标
│   │   ├── pages/                     # 页面组件
│   │   │   ├── Home.tsx               # 首页
│   │   │   ├── DailySpeed.tsx         # 每日速测页
│   │   │   ├── Login.tsx              # 登录页（占位）
│   │   │   ├── Signup.tsx             # 注册页（占位）
│   │   │   ├── History.tsx            # 历史记录页（占位）
│   │   │   └── Profile.tsx            # 个人中心页
│   │   ├── hooks/                     # 自定义Hooks
│   │   │   ├── useAuth.ts             # 认证状态管理
│   │   │   ├── useGestureControl.ts   # 手势识别控制
│   │   │   ├── useMoneyGua.ts         # 金钱卦业务逻辑
│   │   │   └── useShengbei.ts         # 掷圣杯业务逻辑
│   │   ├── store/                     # Zustand状态
│   │   │   └── authStore.ts
│   │   ├── utils/                     # 工具函数
│   │   │   ├── constants.ts
│   │   │   ├── moneyGua.ts
│   │   │   └── shengbei.ts
│   │   └── services/                  # API调用
│   └── package.json
├── backend/                            # Python后端
│   ├── app/
│   │   ├── api/                       # API路由
│   │   │   └── daily_speed.py
│   │   ├── services/                  # 业务逻辑
│   │   │   ├── money_gua.py
│   │   │   └── shengbei.py
│   │   ├── models/                    # 数据模型
│   │   │   └── schemas.py
│   │   └── core/                      # 核心配置
│   ├── main.py
│   └── requirements.txt
└── docs/                               # 文档
    └── superpowers/
        ├── specs/                      # 设计文档
        └── plans/                      # 实施计划
```

### 4.4 核心技术说明

**手势识别系统**
- 使用 MediaPipe Hands 进行手部关键点检测
- 自定义手势识别算法：
  - shake（摇）：检测手部上下/左右晃动，用于触发金钱卦
  - throw_up（抛）：检测手部向下再向上快速挥动，用于触发掷圣杯
- 完整的降级方案：手势不可用时回退到点击模式

**圣杯图标系统**
- SVG矢量图标，支持三种变体：
  - default：默认样式
  - yang：阳杯（红色渐变）
  - yin：阴杯（棕色渐变）
- 支持 gap 属性控制两个月牙间距
- 竖版月牙尖相对的传统样式

---

## 5. 当前已实现功能

### 5.1 用户认证系统

**功能描述**
- 手机号+验证码登录/注册一体化
- 首次登录自动创建账号
- 登录状态持久化到 localStorage
- 个人中心页面框架

**核心文件**
- `frontend/src/store/authStore.ts` - Zustand 认证状态管理
- `frontend/src/components/LoginModal.tsx` - 登录弹窗
- `frontend/src/pages/Profile.tsx` - 个人中心主页面
- `frontend/src/pages/Profile/PersonalInfo.tsx` - 个人资料
- `frontend/src/pages/Profile/History.tsx` - 历史记录
- `frontend/src/pages/Profile/Feedback.tsx` - 反馈建议
- `frontend/src/pages/Profile/About.tsx` - 关于我们
- `frontend/src/pages/Profile/Help.tsx` - 帮助中心
- `frontend/src/pages/Profile/Privacy.tsx` - 隐私设置

**交互逻辑**
1. 用户点击首页玩法卡片或顶部"登录/注册"按钮
2. 未登录状态弹出登录弹窗
3. 输入手机号，点击"获取验证码"（60秒倒计时）
4. 输入验证码，点击"登录"
5. 登录成功后关闭弹窗，导航栏显示用户头像
6. 点击头像进入个人中心

### 5.2 首页

**功能描述**
- Hero区域展示 Slogan 和产品特色
- 2×2 网格布局展示4个玩法卡片
- 顶部导航栏包含 Logo 和登录/注册按钮（或用户头像）
- 紧凑化设计，确保玩法卡片一屏可见

**核心文件**
- `frontend/src/pages/Home.tsx` - 首页主组件
- `frontend/src/pages/Home/HeroSection.tsx` - Hero区域
- `frontend/src/pages/Home/GameCard.tsx` - 玩法卡片组件
- `frontend/src/components/Layout.tsx` - 通用布局（导航栏）

### 5.3 每日速测（核心功能）

#### 5.3.1 金钱卦测算

**功能描述**
- 支持手势测算和点击测算双模式
- 三枚乾隆通宝模拟抛掷
- 自动判定卦象结果（少阳、少阴、老阳、老阴）
- 提供卦辞解读
- 跳过按钮直接返回首页

**核心文件**
- `frontend/src/pages/DailySpeed/MoneyGuaSection.tsx` - 金钱卦卡片
- `frontend/src/pages/DailySpeed/MoneyGuaModal.tsx` - 金钱卦弹窗
- `frontend/src/hooks/useMoneyGua.ts` - 金钱卦业务逻辑
- `frontend/src/utils/moneyGua.ts` - 金钱卦算法
- `backend/app/services/money_gua.py` - 后端金钱卦服务

#### 5.3.2 掷圣杯测算

**功能描述**
- 支持手势测算和点击测算双模式
- 朱红色圣杯模拟抛掷
- 阴阳杯区分（红色=阳杯，棕色=阴杯）
- 结果展示时告知阴阳杯区分方式
- 默认掷一次（移除了掷一次/掷三次选择）
- 跳过按钮直接返回首页

**核心文件**
- `frontend/src/pages/DailySpeed/ShengbeiSection.tsx` - 圣杯卡片
- `frontend/src/pages/DailySpeed/ShengbeiModal.tsx` - 圣杯弹窗
- `frontend/src/hooks/useShengbei.ts` - 圣杯业务逻辑
- `frontend/src/utils/shengbei.ts` - 圣杯算法
- `frontend/src/components/icons/Shengbei.tsx` - 圣杯图标
- `backend/app/services/shengbei.py` - 后端圣杯服务

**圣杯结果判定**
- 圣卦（圣杯）：一阳一阴 → 吉
- 阴卦（笑杯）：两阴 → 平
- 阳卦（怒杯）：两阳 → 凶

### 5.4 手势控制系统（技术亮点）

**功能描述**
- 摄像头静默打开，不显示人像（隐私保护）
- MediaPipe Hands 实时检测手部关键点
- 支持两种手势：
  - shake（摇）：握拳上下/左右晃动 → 触发金钱卦
  - throw_up（抛）：手向下再向上快速挥动 → 触发掷圣杯
- 全屏手势测算界面
- 大尺寸中央道具（圣杯700px，间距6px）
- 4种状态管理：waiting/detecting/success/failed
- 30秒超时机制，超时自动转 failed 状态
- 降级方案：手势失败或超时可点击"跳过"直接开始

**核心文件**
- `frontend/src/hooks/useGestureControl.ts` - 手势识别控制Hook
- `frontend/src/components/GestureCamera.tsx` - 手势摄像头组件
- `frontend/src/pages/DailySpeed/MoneyGuaModal.tsx` - 集成手势
- `frontend/src/pages/DailySpeed/ShengbeiModal.tsx` - 集成手势

**手势检测阈值**
- shake：deltaY > 0.02，2次晃动触发
- throw_up：deltaY > 0.08，800ms内完成

---

## 6. 用户旅程与数据流转

### 6.1 用户旅程地图

#### 6.1.1 新用户首次访问旅程

```
1. 访问首页
   ↓
2. 浏览Hero区域和玩法卡片
   ↓
3. 点击某个玩法卡片（如"每日速测"）
   ↓
4. 弹出登录弹窗
   ↓
5. 输入手机号 → 获取验证码 → 输入验证码 → 点击登录
   ↓
6. 登录成功，关闭弹窗，进入每日速测页面
   ↓
7. 选择"金钱卦"或"掷圣杯"
   ↓
8. 输入问题（可选）
   ↓
9. 选择测算方式："手势测算"或"点击测算"
   ↓
10. 完成测算，查看结果
    ↓
11. 关闭弹窗，返回每日速测页面
```

#### 6.1.2 登录用户使用旅程

```
1. 访问首页（已登录状态）
   ↓
2. 点击玩法卡片
   ↓
3. 直接进入每日速测页面（无需登录）
   ↓
4. 选择测算方式 → 完成测算 → 查看结果
   ↓
5. （可选）点击顶部头像进入个人中心
```

### 6.2 核心数据流转

#### 6.2.1 首页加载流程

```
App.tsx 初始化
    ↓
检查 localStorage 中的 auth token
    ↓
初始化 authStore（用户登录状态）
    ↓
渲染 Layout 组件（导航栏）
    ↓
根据路由渲染 Home.tsx
    ↓
Home.tsx 渲染 HeroSection 和 GameCard 列表
    ↓
页面加载完成
```

#### 6.2.2 登录/注册数据流转

```
用户点击"登录/注册"或玩法卡片
    ↓
LoginModal 打开
    ↓
用户输入手机号，点击"获取验证码"
    ↓
前端模拟发送验证码（当前版本），启动60秒倒计时
    ↓
用户输入验证码，点击"登录"
    ↓
authStore.login() 被调用
    ↓
创建 User 对象，设置 isLoggedIn = true
    ↓
持久化到 localStorage
    ↓
关闭 LoginModal
    ↓
Layout 组件重新渲染，显示用户头像
    ↓
（如果是点击玩法卡片触发的）跳转到对应页面
```

**Auth Store 数据结构**
```typescript
interface User {
  id: string
  phone: string
  nickname?: string
  avatar?: string
}

interface AuthStore {
  user: User | null
  isLoggedIn: boolean
  login: (phone: string, code: string) => void
  logout: () => void
}
```

#### 6.2.3 金钱卦测算完整数据流转

**点击测算模式：**

```
用户点击"金钱卦"卡片
    ↓
MoneyGuaModal 打开，状态：input
    ↓
用户输入问题（可选），点击"点击测算"
    ↓
状态切换到：animating
    ↓
播放铜钱动画（1.5秒）
    ↓
状态切换到：loading
    ↓
前端调用后端 API：POST /api/daily-speed/money-gua
    ↓
后端执行 money_gua.toss()：
    - 随机生成三枚铜钱的正反面
    - 判定卦象（少阳/少阴/老阳/老阴）
    - 生成卦辞解读
    ↓
后端返回结果 JSON
    ↓
前端接收结果，状态切换到：result
    ↓
展示结果页面（卦象、卦辞、解读）
    ↓
用户点击"关闭" → 关闭 Modal
或点击"再测一次" → 回到 input 状态
```

**手势测算模式：**

```
用户点击"手势测算"
    ↓
状态切换到：gesture_waiting
    ↓
GestureCamera 组件挂载
    ↓
onVideoReady 回调触发
    ↓
启动摄像头，请求权限
    ↓
MediaPipe Hands 初始化
    ↓
状态切换到：gesture_detecting
    ↓
用户做 shake 手势
    ↓
useGestureControl 检测到手势
    ↓
触发 onGestureDetected 回调
    ↓
状态切换到：gesture_success（短暂显示）
    ↓
状态切换到：animating
    ↓
（后续流程同点击测算模式）
```

**手势失败/超时降级：**

```
30秒内未检测到手势 → 状态切换到：gesture_failed
    ↓
用户点击"跳过"按钮
    ↓
状态切换到：animating
    ↓
（后续流程同点击测算模式）
```

#### 6.2.4 掷圣杯测算完整数据流转

与金钱卦流程基本一致，区别在于：
- 手势使用 throw_up 而非 shake
- 图标显示圣杯而非铜钱
- 结果展示包含阴阳杯说明

#### 6.2.5 手势识别数据流转

```
GestureCamera 组件挂载
    ↓
video 元素创建（className="hidden"，不显示）
    ↓
onVideoReady 回调 → 启动摄像头
    ↓
摄像头权限获取成功 → video 元素播放
    ↓
useGestureControl.startDetection() 被调用
    ↓
初始化 MediaPipe Hands：
    - 配置模型参数
    - 设置 onResults 回调
    ↓
MediaPipe Hands 持续检测手部关键点
    ↓
每一帧 results 传入手势识别算法
    ↓
算法判断是否满足 shake 或 throw_up 条件
    ↓
满足条件 → 触发 onGestureDetected 回调
    ↓
停止检测，执行后续测算流程
```

### 6.3 状态管理

#### 6.3.1 Auth Store（Zustand）

**文件**：`frontend/src/store/authStore.ts`

**状态**：
- user: User | null - 当前用户信息
- isLoggedIn: boolean - 登录状态

**Actions**：
- login(phone, code) - 登录
- logout() - 登出

#### 6.3.2 Modal 状态流转（以 MoneyGuaModal 为例）

**状态枚举**：
```typescript
type ModalMode = 
  | 'input'              // 输入问题
  | 'gesture_waiting'    // 等待摄像头启动
  | 'gesture_detecting'  // 检测手势中
  | 'gesture_success'    // 手势检测成功
  | 'gesture_failed'     // 手势检测失败
  | 'animating'          // 动画播放中
  | 'loading'            // 等待API结果
  | 'result'             // 显示结果
```

**状态流转图**：

```
input
  ├─→ 点击"手势测算" → gesture_waiting
  │                         ↓
  │                  gesture_detecting
  │                         ├─→ 检测到手势 → gesture_success → animating
  │                         └─→ 超时/失败 → gesture_failed → 点击"跳过" → animating
  │
  └─→ 点击"点击测算" → animating
                           ↓
                        loading
                           ↓
                         result
                           ├─→ 点击"再测一次" → input
                           └─→ 点击"关闭" → 关闭Modal
```

---

## 7. 用户交互流程

### 7.1 登录弹窗交互

**交互细节**：
- 手机号输入框：自动格式化，11位数字
- 获取验证码按钮：点击后变为60秒倒计时，倒计时期间不可点击
- 验证码输入框：6位数字
- 登录按钮：手机号和验证码都输入后才可用
- 关闭按钮：点击关闭弹窗，不执行登录

### 7.2 每日速测页面交互

**交互细节**：
- 两个卡片左右并排（桌面端）或上下堆叠（移动端）
- 鼠标悬停卡片：卡片上浮放大（scale 1.03，y -8px）
- 点击卡片：打开对应测算弹窗

### 7.3 手势测算页面交互

**交互细节**：
- 全屏深色背景，隐藏摄像头画面
- 中央显示大尺寸道具（圣杯700px，铜钱180px）
- 底部显示低调提示框："请做出摇的手势"或"请做出抛的手势"
- 左上角显示"← 返回"按钮
- 右上角无按钮（已移除跳过按钮）
- gesture_failed 状态底部显示"跳过"按钮

---

## 8. 数据模型

### 8.1 数据库表结构

**测算记录表 (divination_records)**
```sql
CREATE TABLE divination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'money_gua', 'shengbei', 'guanyin', 'tarot', 'bazi'
    question TEXT,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at DESC)
);
```

### 8.2 API接口说明

**健康检查**
- `GET /health` → `{"status": "healthy"}`

**根路径**
- `GET /` → `{"message": "问心 - 运势测算 API", "version": "1.0.0"}`

**金钱卦测算**
- `POST /api/daily-speed/money-gua`
- Request Body: `{}`（当前无需参数）
- Response:
```json
{
  "coins": [
    {"side": "yang", "image": "qianlong_front"},
    {"side": "yang", "image": "qianlong_front"},
    {"side": "yin", "image": "qianlong_back"}
  ],
  "combination": "shao_yang",
  "verdict": "吉",
  "interpretation": "两正一反，少阳之象，所求之事可成，但需稳步前行。"
}
```

**掷圣杯测算**
- `POST /api/daily-speed/shengbei`
- Request Body: `{}`（当前无需参数，默认掷1次）
- Response:
```json
{
  "times": 1,
  "throws": [
    {"left": "yang", "right": "yin", "result": "shengbei"}
  ],
  "final_verdict": "吉",
  "interpretation": "圣杯一掷即中，所求之事顺遂。"
}
```

---

## 9. 当前项目进度

**分支**：master  
**TypeScript检查**：✅ 通过  
**生产构建**：✅ 成功  
**开发服务器**：http://localhost:3000/  
**局域网访问**：http://192.168.1.54:3000/  
**后端服务**：http://localhost:8000/  

**已完成功能清单**：
- ✅ 用户认证系统（手机号+验证码）
- ✅ 个人中心页面框架
- ✅ 首页（Hero + 2×2玩法卡片）
- ✅ 每日速测页面
- ✅ 金钱卦测算（手势+点击双模式）
- ✅ 掷圣杯测算（手势+点击双模式，阴阳杯区分）
- ✅ 手势控制系统（MediaPipe Hands）
- ✅ 摄像头隐私保护（不显示人像）
- ✅ 圣杯图标重设计（竖版月牙尖相对）

---

## 10. 后续规划（仅概念）

### 10.1 观音灵签
- 抽签功能
- 签文解读
- 历史签文记录

### 10.2 塔罗牌
- 78张塔罗牌展示
- 牌阵选择（圣三角、凯尔特十字等）
- 抽牌动画
- 牌意解读

### 10.3 八字排盘
- 出生日期时间输入
- 八字排盘（年柱、月柱、日柱、时柱）
- 五行分析
- 大运流年

### 10.4 历史记录功能完善
- 连接Supabase数据库
- 测算记录云端存储
- 历史记录列表展示
- 记录详情查看
- 记录删除

---

## 11. 技术亮点与难点回顾

### 11.1 手势识别实现

**亮点**：
- 集成MediaPipe Hands进行实时手部关键点检测
- 自定义手势识别算法，支持shake和throw_up两种手势
- 完整的降级方案，确保手势不可用时不影响功能
- 30秒超时机制，用户体验友好

**难点回顾**：
- 手势检测阈值调试：从v1.2到v1.3多次调整，最终shake阈值设为0.02，throw_up设为0.08
- 摄像头启动时序：修复videoRef is null问题，通过onVideoReady回调确保正确时序
- 日志优化：添加DEBUG开关，减少控制台噪音

### 11.2 圣杯图标设计迭代

**迭代历史**：
1. **初始设计**：横版月牙 → 用户反馈像胸罩
2. **第一次重设计**：竖版月牙，但内侧弧度向外 → 用户反馈像叶子
3. **第二次重设计**：竖版月牙尖相对，内侧弧度向内收 → 保持当前粗细风格
4. **阴阳杯区分**：添加type属性，红色阳杯，棕色阴杯

**最终方案**：
- 两个月牙竖立，尖部相对
- 两个杯形状完全相同（右杯是左杯镜像）
- 支持gap属性控制间距
- 支持三种变体：default/yang/yin

### 11.3 用户隐私保护

**方案**：
- 视频元素设置为className="hidden"
- MediaPipe仍可正常使用视频流
- 背景改为深色渐变
- 仅显示UI界面，不暴露用户人像

---

## 12. 开发环境与部署

### 12.1 本地开发环境配置

**前端**：
```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

**后端**：
```bash
cd backend
pip install -r requirements.txt
python main.py
# 访问 http://localhost:8000
```

**环境变量**：
- 根目录 `.env`（后端用）
- `frontend/.env.local`（前端用）

### 12.2 部署说明（概念）

**前端部署**：
- 可部署到 Vercel、Netlify、GitHub Pages 等
- 或使用 Nginx 静态文件服务

**后端部署**：
- 可部署到 Railway、Render、Fly.io 等
- 或使用 Docker 容器化部署

**移动端注意事项**：
- 手机浏览器访问需要HTTPS（限制摄像头权限）
- 真机测试可使用 ngrok 提供临时HTTPS地址
- 或打包成原生App（Capacitor/React Native）上架应用商店，无需HTTPS

---

**文档结束**

**PRD版本**：v1.3  
**最后更新**：2026-04-17
