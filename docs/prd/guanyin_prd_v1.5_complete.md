---
name: 观音灵签 - 完整产品需求文档 (PRD)
description: 观音灵签功能的完整产品需求文档，包含产品、技术、数据流转
type: prd
---

# 观音灵签 - 完整产品需求文档 (PRD)

**产品名称**：问心 - 观音灵签  
**版本**：v1.5  
**日期**：2026-04-21  
**文档状态**：已实现  

---

## 目录

1. [产品概述](#1-产品概述)
2. [目标用户与用户故事](#2-目标用户与用户故事)
3. [核心功能清单](#3-核心功能清单)
4. [完整用户业务流程](#4-完整用户业务流程)
5. [页面状态与业务流转](#5-页面状态与业务流转)
6. [功能详细需求说明](#6-功能详细需求说明)
7. [前端技术实现说明](#7-前端技术实现说明)
8. [后端技术实现说明](#8-后端技术实现说明)
9. [数据结构定义](#9-数据结构定义)
10. [API 接口说明](#10-api-接口说明)
11. [数据流转说明](#11-数据流转说明)
12. [非功能需求](#12-非功能需求)

---

## 1. 产品概述

### 1.1 产品定位

观音灵签是问心运势测算网站的核心功能之一，为用户提供完整的抽签、解签体验。通过登录验证后，用户可以输入求问问题，选择鼠标控制或手势控制方式进行抽签，获得100签中的随机一支签文后，由 AI（Kimi API）结合用户的具体问题提供个性化解读，并支持多轮对话追问。所有抽签记录自动保存到数据库，便于后续查看和管理。

### 1.2 设计理念

- **沉浸式体验**：全屏 Three.js 粒子特效背景，配合复古噪点滤镜，营造神秘、庄重的氛围感
- **双模式交互**：支持手势控制（MediaPipe Hands）和鼠标控制两种方式，满足不同场景需求
- **AI 个性化解读**：结合固定签文底本和用户具体问题，提供针对性、个性化的解读内容
- **仪式感设计**：从进入页面、输入问题、选择模式、抽签动画、结果展示的完整流程，注重用户心理体验
- **数据持久化**：完整的抽签记录、对话历史自动保存到数据库

---

## 2. 目标用户与用户故事

### 2.1 目标用户

| 用户类型 | 用户特征 | 核心需求 |
|---------|---------|---------|
| **普通用户** | 有明确的问题想要求签解答 | 简单易用的抽签流程，清晰的签文展示，可理解的解读 |
| **深度用户** | 对命理有兴趣，想深入了解 | 完整的签文信息（签诗、典故、释义），支持多轮追问深入探讨 |
| **所有用户** | 需要登录才能使用 | 便捷的登录流程，数据保存到个人账户 |

### 2.2 用户故事

| ID | 用户故事 | 优先级 |
|----|---------|--------|
| US-1 | 作为用户，我想在进入观音灵签页面前先登录，以便我的抽签记录能保存到我的账户 | P0 |
| US-2 | 作为用户，我想进入观音灵签页面后看到美丽的粒子特效，以便获得沉浸式体验 | P0 |
| US-3 | 作为用户，我想输入自己想求问的具体问题，以便获得针对性的签文解读 | P0 |
| US-4 | 作为用户，我想选择手势控制方式，通过挥手来摇签筒，以便获得仪式感 | P0 |
| US-5 | 作为用户，我想选择鼠标点击方式，通过长按签筒来摇签，以便在摄像头不可用时也能使用 | P0 |
| US-6 | 作为用户，我想看到签文的详细内容（编号、等级、标题、签诗、典故、释义），以便了解签文含义 | P0 |
| US-7 | 作为用户，我想获得 AI 结合我的问题给出的个性化解读，以便得到针对性指引 | P0 |
| US-8 | 作为用户，我想与 AI 进行多轮对话追问，以便深入了解签文启示 | P1 |
| US-9 | 作为用户，我想我的抽签记录自动保存，以便后续可以查看 | P0 |
| US-10 | 作为用户，我想可以重新抽签，以便再测一次 | P1 |
| US-11 | 作为用户，我想可以返回首页，以便选择其他功能 | P1 |

---

## 3. 核心功能清单

| 功能模块 | 功能点 | 优先级 | 实现状态 | 说明 |
|---------|---------|--------|---------|------|
| **前置验证** | 登录验证 | P0 | ✅ 已实现 | 首页点击入口时检查登录状态，未登录则弹出登录框 |
| **前置验证** | 登录成功后自动进入 | P0 | ✅ 已实现 | 登录成功后自动跳转进入观音灵签页面 |
| **前置验证** | 传递 userId 给业务逻辑 | P0 | ✅ 已实现 | 进入页面后传递 userId 用于数据保存 |
| **页面体验** | 全屏粒子特效背景 | P0 | ✅ 已实现 | Three.js 粒子系统 |
| **页面体验** | 复古噪点滤镜 | P1 | ✅ 已实现 | CCD 复古噪点滤镜 |
| **问题输入** | 问题输入框 | P0 | ✅ 已实现 | 中下底部，不遮挡主视觉 |
| **问题输入** | 输入框聚焦状态 | P0 | ✅ 已实现 | 聚焦时状态变化，粒子固定 |
| **问题输入** | 输入框失焦状态 | P0 | ✅ 已实现 | 失焦时回到 idle 状态 |
| **问题输入** | 未输入时高亮提示 | P1 | ✅ 已实现 | 未输入问题就点击按钮时，高亮输入框 2 秒 |
| **控制模式** | 手势控制按钮 | P0 | ✅ 已实现 | 点击进入手势控制模式 |
| **控制模式** | 鼠标控制按钮 | P0 | ✅ 已实现 | 点击进入鼠标控制模式 |
| **控制模式** | 摄像头自动启动 | P0 | ✅ 已实现 | 页面加载时自动启动摄像头 |
| **控制模式** | 手势识别（MediaPipe） | P0 | ✅ 已实现 | 识别挥手手势触发抽签 |
| **抽签流程** | 抽签动画 | P0 | ✅ 已实现 | 2 秒抽签动画 |
| **抽签流程** | 粒子颜色随签文变化 | P1 | ✅ 已实现 | 出签后粒子颜色根据签文等级变化 |
| **结果展示** | 签文卡片展示 | P0 | ✅ 已实现 | 弹出式签文卡片 |
| **结果展示** | 签文完整信息 | P0 | ✅ 已实现 | 编号、等级、标题、签诗、典故、释义 |
| **结果展示** | 签文卡片显隐切换 | P2 | ✅ 已实现 | 支持查看/隐藏签文 |
| **结果展示** | AI 聊天区域展示 | P0 | ✅ 已实现 | 右侧边栏，支持显隐切换 |
| **AI 解读** | 初次解读自动触发 | P0 | ✅ 已实现 | 出签后自动触发 AI 解读 |
| **AI 解读** | 初次解读内容 | P0 | ✅ 已实现 | 引用签诗、结合问题、解释典故、给出建议 |
| **AI 解读** | 多轮追问对话 | P1 | ✅ 已实现 | 支持输入追问问题 |
| **AI 解读** | 对话历史保存 | P0 | ✅ 已实现 | 完整对话历史保留 |
| **数据保存** | 抽签记录自动保存 | P0 | ✅ 已实现 | 出签后异步保存，不阻塞用户 |
| **数据保存** | 对话历史增量更新 | P0 | ✅ 已实现 | 每次 AI 回复后更新对话 |
| **其他功能** | 重新抽签 | P1 | ✅ 已实现 | 重置所有状态，回到初始 |
| **其他功能** | 返回首页 | P1 | ✅ 已实现 | 停止摄像头，返回首页 |

---

## 4. 完整用户业务流程

### 4.1 完整业务流程

```
用户访问首页
    ↓
点击观音灵签入口
    ↓
【业务逻辑1】登录验证
    ├─ 未登录 → 弹出登录框
    │   ├─ 用户输入手机号 → 发送验证码
    │   ├─ 用户输入验证码 → 验证登录
    │   └─ 登录成功 → 跳转进入观音灵签
    └─ 已登录 → 直接进入观音灵签
    ↓
进入观音灵签页面
    ↓
【业务逻辑2】页面初始化
    ├─ 启动摄像头（手势识别）
    ├─ 渲染全屏粒子背景
    ├─ 渲染噪点滤镜
    ├─ 渲染问题输入框
    └─ 渲染"手势控制"和"鼠标控制"按钮
    ↓
用户输入求问问题
    ↓
【业务逻辑3】选择控制模式
    ├─ 未输入问题 → 高亮提示 2 秒，不触发
    └─ 已输入问题 → 点击"手势控制"或"鼠标控制"
    ↓
【业务逻辑4】进入抽签状态
    ├─ 输入框和按钮淡出消失
    ├─ 粒子系统进入抽签模式
    └─ 等待用户触发抽签
    ↓
【业务逻辑5】触发抽签
    ├─ 手势控制：左右挥手 → 触发抽签
    └─ 鼠标控制：长按签筒 → 触发抽签
    ↓
【业务逻辑6】抽签动画（2秒）
    ├─ 粒子签筒晃动
    ├─ 粒子签条旋转
    └─ 签子飞出动画
    ↓
【业务逻辑7】出签结果
    ├─ 粒子颜色随签文等级变化
    ├─ 显示签文卡片
    ├─ 【异步】调用后端抽签 API（获取随机签文）
    ├─ 【异步】调用后端保存记录 API（保存到数据库）
    ├─ 显示 AI 聊天区域
    └─ 【异步】调用后端 AI 解读 API
    ↓
【业务逻辑8】AI 初次解读
    ├─ AI 返回解读内容
    ├─ 解读内容渲染（支持 Markdown 加粗）
    ├─ 【异步】调用后端更新记录 API（更新对话历史）
    └─ 用户可以输入追问问题
    ↓
【业务逻辑9】多轮对话（可选）
    ├─ 用户输入追问问题
    ├─ 【异步】调用后端 AI 追问 API
    ├─ AI 返回回复内容
    ├─ 【异步】调用后端更新记录 API（更新对话历史）
    └─ 支持多轮循环
    ↓
【业务逻辑10】其他操作（可选）
    ├─ 点击"查看签文"/"隐藏签文" → 切换签文卡片显隐
    ├─ 点击"AI 解读"/"隐藏解读" → 切换聊天区域显隐
    ├─ 点击"重新抽签" → 【重置】清空所有状态，回到初始
    └─ 点击"返回首页" → 停止摄像头，返回首页
```

---

## 5. 页面状态与业务流转

### 5.1 页面状态定义

| 状态 | 业务含义 |
|------|---------|
| `IDLE` | 初始状态，未选择模式，粒子响应手势但不抽签 |
| `INPUT_FOCUSED` | 聚焦输入框，粒子固定模式 |
| `GESTURE_MODE` | 选择手势控制模式 |
| `MOUSE_MODE` | 选择鼠标控制模式 |
| `DRAWING` | 抽签动画中 |
| `RESULT` | 显示结果和 AI 解读 |

### 5.2 状态业务流转图

```
IDLE ←→ INPUT_FOCUSED
  ↓
GESTURE_MODE / MOUSE_MODE
  ↓
DRAWING
  ↓
RESULT → (点击"重新抽签") → IDLE
```

### 5.3 状态触发条件

| 当前状态 | 触发事件 | 下一状态 |
|---------|---------|---------|
| `IDLE` | 点击输入框 | `INPUT_FOCUSED` |
| `IDLE` | 点击"手势控制"（问题为空） | 高亮提示，保持 `IDLE` |
| `IDLE` | 点击"手势控制"（问题非空） | `GESTURE_MODE` |
| `IDLE` | 点击"鼠标控制"（问题为空） | 高亮提示，保持 `IDLE` |
| `IDLE` | 点击"鼠标控制"（问题非空） | `MOUSE_MODE` |
| `INPUT_FOCUSED` | 输入框失焦 | `IDLE` |
| `GESTURE_MODE` | 挥手手势 | `DRAWING` |
| `MOUSE_MODE` | 长按后松开 | `DRAWING` |
| `DRAWING` | 2 秒动画结束 | `RESULT` |
| `RESULT` | 点击"重新抽签" | `IDLE` |

---

## 6. 功能详细需求说明

### 6.1 前置验证 - 登录验证

**功能说明**：用户必须登录才能使用观音灵签功能。

**业务逻辑**：
1. 用户在首页点击观音灵签入口
2. 检查 `useAuthStore` 中的 `user` 状态
3. 如果 `user === null`（未登录）：
   - 弹出 `LoginModal` 登录框
   - 等待用户登录成功
   - 登录成功后自动跳转进入观音灵签页面
4. 如果 `user !== null`（已登录）：
   - 直接进入观音灵签页面
5. 进入页面后，将 `user?.id` 传递给 `useGuanyin` Hook，用于后续数据保存

---

### 6.2 前置验证 - 页面初始化

**功能说明**：进入观音灵签页面时的初始化业务逻辑。

**业务逻辑**：
1. 启动摄像头（用于手势识别）
   - 调用 `useGuanyinGesture` 的 `startCamera()`
   - 失败时只打印 warning，不阻塞页面使用
2. 渲染全屏 Three.js 粒子场景
   - 背景粒子系统
   - 粒子签筒系统
   - 粒子签条系统
3. 渲染复古噪点滤镜（全屏 Canvas 覆盖）
4. 渲染问题输入框（中下底部位置）
5. 渲染"手势控制"和"鼠标控制"两个按钮
6. 页面状态初始化为 `IDLE`

---

### 6.3 问题输入 - 输入框聚焦/失焦

**功能说明**：输入框聚焦和失焦的业务逻辑。

**业务逻辑** - 聚焦时：
1. 用户点击输入框
2. 调用 `focusInput()`
3. 页面状态变为 `INPUT_FOCUSED`
4. 粒子系统进入固定模式，不再响应手势

**业务逻辑** - 失焦时：
1. 用户点击输入框外区域
2. 调用 `blurInput()`
3. 如果当前状态是 `INPUT_FOCUSED`，状态回到 `IDLE`
4. 粒子系统恢复响应手势

---

### 6.4 问题输入 - 未输入时高亮提示

**功能说明**：用户未输入问题就点击控制模式按钮时，高亮提示输入。

**业务逻辑**：
1. 用户点击"手势控制"或"鼠标控制"按钮
2. 检查 `question.trim()` 是否为空
3. 如果为空：
   - 设置 `highlightInput = true`
   - 2 秒后自动设置 `highlightInput = false`
   - **不触发**模式选择
4. 如果不为空：
   - 正常触发模式选择

---

### 6.5 控制模式 - 手势控制

**功能说明**：用户选择手势控制模式，通过挥手触发抽签。

**业务逻辑**：
1. 用户点击"手势控制"按钮（问题非空）
2. 调用 `selectGestureMode()`
3. 页面状态变为 `GESTURE_MODE`
4. 输入框和按钮淡出消失
5. `useGuanyinGesture` 进入 `drawing` 模式
6. 等待用户挥手手势
7. 检测到"挥手"手势时：
   - 调用 `gestureDraw()`
   - 触发抽签流程

---

### 6.6 控制模式 - 鼠标控制

**功能说明**：用户选择鼠标控制模式，通过长按签筒触发抽签。

**业务逻辑**：
1. 用户点击"鼠标控制"按钮（问题非空）
2. 调用 `selectMouseMode()`
3. 页面状态变为 `MOUSE_MODE`
4. 输入框和按钮淡出消失
5. 等待用户长按签筒
6. 用户按下鼠标时：
   - 调用 `onMouseLongPress()`
   - 设置 `isMousePressingRef.current = true`
7. 用户松开鼠标时：
   - 调用 `onMouseRelease()`
   - 如果 `isMousePressingRef.current === true`：
     - 触发抽签流程
   - 重置 `isMousePressingRef.current = false`

---

### 6.7 抽签流程 - 抽签动画

**功能说明**：2 秒抽签动画，营造仪式感。

**业务逻辑**：
1. 触发抽签（手势或鼠标）
2. 调用 `startDraw()`
3. 页面状态变为 `DRAWING`
4. 粒子系统进入抽签模式
5. 2 秒抽签动画：
   - 粒子签筒晃动
   - 粒子签条旋转
   - 签子飞出动画
6. 2 秒后：
   - 【业务逻辑】调用后端抽签 API（`/api/guanyin/draw`）
   - 获取随机签文数据
   - 设置 `selectedStick`
   - 页面状态变为 `RESULT`
   - 继续【出签结果】流程

---

### 6.8 出签结果 - 签文卡片展示

**功能说明**：展示完整签文信息。

**业务逻辑**：
1. 页面状态变为 `RESULT`
2. 粒子颜色根据签文等级变化
3. 显示签文卡片（弹出动画）
4. 签文卡片显示内容：
   - 签编号（1-100）
   - 签等级（上上签、上签、中签、下签、下下签）
   - 签标题
   - 签诗
   - 典故
   - 释义
5. 支持"查看签文"/"隐藏签文"切换
6. 支持关闭签文卡片

---

### 6.9 出签结果 - AI 聊天区域展示

**功能说明**：右侧边栏显示 AI 解读和对话。

**业务逻辑**：
1. 页面状态变为 `RESULT`
2. 显示 AI 聊天区域（右侧滑入动画）
3. 聊天区域功能：
   - 显示对话历史
   - 显示 AI 加载状态（三个跳动的点）
   - 输入追问问题的输入框
   - 发送按钮
4. 支持"AI 解读"/"隐藏解读"切换
5. 【异步】自动触发 AI 初次解读流程

---

### 6.10 AI 解读 - 初次解读

**功能说明**：抽签后，AI 结合签文和用户问题进行初次解读。

**业务逻辑**：
1. 页面状态变为 `RESULT` 且 `selectedStick` 有值
2. 如果 `question.trim()` 不为空：
   - 调用 `interpretStick(stick, question)`
   - 设置 `isLoading = true`
   - 【业务逻辑】调用后端 AI 解读 API（`/api/guanyin/interpret`）
     - Request：`{ question, stick }`
     - Response：`{ interpretation }`
   - 收到解读内容：
     - 创建 AI Message：`{ role: 'assistant', content: interpretation }`
     - 设置 `conversation = [aiMessage]`
     - 渲染解读内容（支持 Markdown 加粗：`**文字**` → `<strong>文字</strong>`）
   - 【异步】调用后端保存记录 API（如果还没保存）
   - 【异步】调用后端更新记录 API（`/api/guanyin/update-record/{recordId}`）
     - 更新对话历史
   - 设置 `isLoading = false`
3. 如果出错：
   - 设置 `error = '解读失败，请稍后重试'`
   - 打印错误日志
   - 设置 `isLoading = false`

---

### 6.11 AI 解读 - 多轮追问

**功能说明**：用户可以继续提问，深入了解签文启示。

**业务逻辑**：
1. 用户输入追问问题
2. 点击"发送"按钮
3. 调用 `sendFollowup(followupQuestion)`
4. 设置 `isLoading = true`
5. 创建用户 Message：`{ role: 'user', content: followupQuestion }`
6. 设置 `conversation = [...conversation, userMessage]`
7. 清空输入框
8. 【业务逻辑】调用后端 AI 追问 API（`/api/guanyin/followup`）
   - Request：`{ question, stick, history }`
   - Response：`{ reply }`
9. 收到回复内容：
   - 创建 AI Message：`{ role: 'assistant', content: reply }`
   - 设置 `conversation = [...newConversation, aiMessage]`
   - 【异步】调用后端更新记录 API（`/api/guanyin/update-record/{recordId}`）
     - 更新对话历史
   - 设置 `isLoading = false`
10. 如果出错：
    - 设置 `error = '发送失败，请稍后重试'`
    - 打印错误日志
    - 回滚 `conversation`（移除刚才添加的用户消息）
    - 设置 `isLoading = false`

---

### 6.12 数据保存 - 抽签记录自动保存

**功能说明**：出签后，异步保存抽签记录到数据库，不阻塞用户体验。

**业务逻辑**：
1. 出签后立即调用（从 `startDraw` 中）
2. 调用 `saveRecordSilently(stick)`
3. 【业务逻辑】调用后端保存记录 API（`/api/guanyin/save-record`）
   - Request：`{ user_id, question, stick, conversation: [] }`
   - Response：`{ id, created_at }`
4. 保存成功：
   - 设置 `recordId = result.id`
5. 保存失败：
   - 只打印 warning 日志
   - **不影响**用户体验
   - **不设置** error 状态

---

### 6.13 数据保存 - 对话历史增量更新

**功能说明**：每次 AI 回复后，更新对话历史到数据库。

**业务逻辑**：
1. 每次 AI 回复后调用
2. 如果 `recordId === null`，直接返回（不更新）
3. 调用 `updateRecordSilently(conv)`
4. 【业务逻辑】调用后端更新记录 API（`/api/guanyin/update-record/{recordId}`）
   - Request：`{ conversation }`
   - Response：`{ success, updated_at }`
5. 更新成功：
   - 无特殊操作
6. 更新失败：
   - 只打印 warning 日志
   - **不影响**用户体验

---

### 6.14 其他功能 - 重新抽签

**功能说明**：重置所有状态，回到初始页面，可以重新抽签。

**业务逻辑**：
1. 用户点击"重新抽签"按钮
2. 调用 `reset()`
3. 重置所有状态：
   - `pageState = IDLE`
   - `question = ''`
   - `selectedStick = null`
   - `conversation = []`
   - `error = null`
   - `isLoading = false`
   - `recordId = null`
4. 重置 UI：
   - `showStick = true`
   - `showChat = false`

---

### 6.15 其他功能 - 返回首页

**功能说明**：离开观音灵签页面，返回首页。

**业务逻辑**：
1. 用户点击"返回首页"按钮
2. 调用 `stopCamera()`（停止摄像头）
3. 调用 `navigate('/')`（返回首页）

---

## 7. 前端技术实现说明

### 7.1 技术栈

| 技术 | 说明 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型系统 |
| Three.js | 粒子特效 |
| MediaPipe Hands | 手势识别 |
| Framer Motion | 动画库 |
| Tailwind CSS | 样式框架 |
| React Router | 路由管理 |
| Zustand | 状态管理（auth store） |

### 7.2 前端文件结构

```
frontend/src/
├── pages/
│   ├── Guanyin.tsx                    # 观音灵签主页面
│   └── Guanyin/
│       ├── ParticleScene.tsx          # Three.js 粒子场景
│       ├── StickDisplay.tsx           # 签文展示组件
│       ├── ChatArea.tsx               # AI 对话聊天区域
│       ├── GuanyinControls.tsx         # 输入框和控制按钮
│       └── GuanyinNoise.tsx           # 复古噪点滤镜
├── hooks/
│   ├── useGuanyin.ts                  # 观音灵签业务逻辑 Hook
│   └── useGuanyinGesture.ts           # 观音灵签手势识别 Hook
├── services/
│   └── api.ts                         # API 调用封装
├── store/
│   └── auth.ts                        # 认证状态管理
└── utils/
    └── constants.ts                   # 常量定义（页面状态等）
```

### 7.3 核心组件说明

#### 7.3.1 Guanyin.tsx（主页面）

**职责**：
- 页面布局管理
- 组件协调
- 状态流转控制

**Props**：无

**主要 State**：
- `showChat` - 是否显示聊天区域
- `showStick` - 是否显示签文卡片

**主要逻辑**：
- 从 `useAuthStore` 获取 `user`
- 调用 `useGuanyin({ userId: user?.id })`
- 调用 `useGuanyinGesture()`
- 协调子组件显隐

#### 7.3.2 useGuanyin.ts（业务逻辑 Hook）

**职责**：
- 封装所有观音灵签业务逻辑
- API 调用封装
- 状态管理

**Input Props**：
- `userId?: string | null` - 当前登录用户 ID

**Return Values**：
```typescript
{
  pageState,
  question, setQuestion,
  selectedStick,
  conversation,
  isLoading,
  error,
  highlightInput,
  focusInput, blurInput,
  selectGestureMode, selectMouseMode,
  gestureDraw,
  onMouseLongPress, onMouseRelease,
  sendFollowup,
  retry, reset,
}
```

**核心业务逻辑方法**：
- `focusInput()` / `blurInput()` - 输入框聚焦/失焦
- `selectGestureMode()` / `selectMouseMode()` - 选择控制模式
- `startDraw()` - 开始抽签（内部方法）
- `interpretStick()` - AI 初次解读
- `sendFollowup()` - 发送追问
- `saveRecordSilently()` - 保存记录（异步，静默）
- `updateRecordSilently()` - 更新记录（异步，静默）
- `reset()` - 重置所有状态

#### 7.3.3 useGuanyinGesture.ts（手势识别 Hook）

**职责**：
- 封装 MediaPipe Hands
- 手势识别
- 手势状态管理

**Input Props**：
- `enabled` - 是否启用手势识别
- `mode` - 手势模式（'idle' | 'drawing'）
- `onGestureDetected` - 手势检测回调

**Return Values**：
```typescript
{
  handPosition,
  cameraReady,
  startCamera, stopCamera,
  videoRef,
  waveDirection, isWaving, waveComplete,
  handIsUp,
}
```

---

## 8. 后端技术实现说明

### 8.1 技术栈

| 技术 | 说明 |
|------|------|
| FastAPI (Python) | Web 框架 |
| Pydantic | 数据验证 |
| httpx | HTTP 客户端（调用 Supabase REST API、Kimi API） |
| Supabase PostgreSQL | 数据库 |
| Kimi API (Moonshot) | AI 解读服务 |

### 8.2 后端文件结构

```
backend/app/
├── api/
│   └── guanyin.py                     # 观音灵签 API 路由
├── services/
│   ├── guanyin.py                     # 签文数据服务（从 JSON 加载 100 签）
│   ├── ai_agent.py                    # AI Agent 解读服务（调用 Kimi API）
│   └── database.py                    # 数据库服务（调用 Supabase REST API）
├── models/
│   └── schemas.py                     # Pydantic 数据模型
└── core/
    └── config.py                      # 配置管理（环境变量）
```

### 8.3 核心服务说明

#### 8.3.1 guanyin.py（签文数据服务）

**职责**：
- 从 `data/guanyin_sticks.json` 加载 100 签文数据
- 提供随机抽签功能

**核心方法**：
- `load_guanyin_sticks()` - 加载签文数据（单例模式）
- `draw_stick()` - 随机抽取一支签

#### 8.3.2 ai_agent.py（AI Agent 解读服务）

**职责**：
- 封装 Kimi API 调用
- 提供签文解读和追问功能
- 系统提示词管理

**核心方法**：
- `_call_kimi_api(messages)` - 内部方法，调用 Kimi API
- `interpret_stick(question, stick)` - 初次解读
- `followup_question(question, stick, history)` - 追问回复

**系统提示词规则**：
- 签文底本锁死：不修改、编造、删减签文内容
- 个性化解读：完全匹配用户具体问题，不使用通用套话
- 知识库边界：仅使用内置 100 签知识库
- 纯中文原则：使用中文标点，禁止出现任何英文
- 字数灵活：问题简单精简，问题复杂深入，不超过 400 字
- 初次解读：引用签诗，结合问题解读，解释典故，给出建议
- 追问规则：不重复引用签诗，直接围绕核心含义回复

#### 8.3.3 database.py（数据库服务）

**职责**：
- 封装 Supabase REST API 调用
- 提供记录创建和更新功能
- 代理配置支持

**核心方法**：
- `get_supabase_headers()` - 获取 Supabase 请求头
- `get_proxy_config()` - 获取代理配置（从环境变量）
- `create_divination_record(user_id, question, stick, conversation)` - 创建测算记录
- `update_divination_record(record_id, conversation)` - 更新测算记录

**数据流转**：
- 不使用 supabase Python 库（避免 pyiceberg 编译问题）
- 直接用 httpx 调用 Supabase REST API
- 支持代理配置（解决 DNS 解析问题）

---

## 9. 数据结构定义

### 9.1 签文数据（100 签）

**来源**：`backend/data/guanyin_sticks.json`

**数据结构**：
```typescript
interface GuanyinStick {
  id: number;           // 签编号，1-100
  level: string;        // 签等级：上上签、上签、中签、下签、下下签
  title: string;        // 签文标题
  poem: string;         // 签诗
  story: string;        // 典故
  meaning: string;      // 含义解释
}
```

### 9.2 对话消息

**数据结构**：
```typescript
interface Message {
  role: 'user' | 'assistant';  // 角色
  content: string;                // 消息内容
}
```

### 9.3 测算记录（数据库表）

**表名**：`divination_records`

**数据结构**：
```sql
CREATE TABLE divination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                     -- 用户 ID
    type VARCHAR(50) NOT NULL,       -- 测算类型：'guanyin'
    question TEXT,                    -- 用户问题（可空）
    result JSONB NOT NULL,            -- 签文数据（JSONB）
    conversation JSONB,                -- 对话历史（JSONB，可空）
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
```

**说明**：
- `user_id` 外键约束已移除（避免关联 auth.users 表问题）
- `result` 字段存储完整签文数据（对应 `GuanyinStick`）
- `conversation` 字段存储完整对话历史（对应 `Message[]`）

---

## 10. API 接口说明

### 10.1 抽签 API

**接口**：`POST /api/guanyin/draw`

**Request Body**：
```json
{}
```

**Response**：
```json
{
  "stick": {
    "id": 1,
    "level": "上上签",
    "title": "钟离成道",
    "poem": "开天辟地作良缘...",
    "story": "钟离权潜心修道...",
    "meaning": "此签大吉，诸事亨通..."
  }
}
```

**业务逻辑**：
1. 调用 `draw_stick()` 获取随机签文
2. 返回签文数据

---

### 10.2 AI 初次解读 API

**接口**：`POST /api/guanyin/interpret`

**Request Body**：
```json
{
  "question": "我今年能找到理想的工作吗？",
  "stick": {
    "id": 1,
    "level": "上上签",
    "title": "钟离成道",
    "poem": "开天辟地作良缘...",
    "story": "钟离权潜心修道...",
    "meaning": "此签大吉，诸事亨通..."
  }
}
```

**Response**：
```json
{
  "interpretation": "根据这支上上签，你今年找工作的运势非常好..."
}
```

**业务逻辑**：
1. 调用 `ai_agent.interpret_stick(question, stick)`
2. 调用 Kimi API 获取解读
3. 返回解读内容

---

### 10.3 AI 追问 API

**接口**：`POST /api/guanyin/followup`

**Request Body**：
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

**Response**：
```json
{
  "reply": "结合签文典故姜太公钓鱼，建议你耐心等待..."
}
```

**业务逻辑**：
1. 调用 `ai_agent.followup_question(question, stick, history)`
2. 调用 Kimi API 获取回复
3. 返回回复内容

---

### 10.4 保存记录 API

**接口**：`POST /api/guanyin/save-record`

**Request Body**：
```json
{
  "user_id": "uuid",
  "question": "我今年能找到理想的工作吗？",
  "stick": { ... },
  "conversation": []
}
```

**Response**：
```json
{
  "id": "record-uuid",
  "created_at": "2026-04-21T10:30:00Z"
}
```

**业务逻辑**：
1. 调用 `database.create_divination_record(user_id, question, stick, conversation)`
2. 调用 Supabase REST API 插入记录
3. 返回记录 ID 和创建时间

---

### 10.5 更新记录 API

**接口**：`PUT /api/guanyin/update-record/{recordId}`

**Request Body**：
```json
{
  "conversation": [
    {"role": "user", "content": "我今年能找到理想的工作吗？"},
    {"role": "assistant", "content": "根据这支上上签..."}
  ]
}
```

**Response**：
```json
{
  "success": true,
  "updated_at": "2026-04-21T10:31:00Z"
}
```

**业务逻辑**：
1. 调用 `database.update_divination_record(record_id, conversation)`
2. 调用 Supabase REST API 更新记录
3. 返回成功状态和更新时间

---

## 11. 数据流转说明

### 11.1 完整数据流转图

```
┌─────────────┐
│   前端      │
│  (React)    │
└──────┬──────┘
       │
       │ 1. 用户操作（输入、抽签、对话）
       │
       ↓
┌───────────────────────────────────────┐
│    useGuanyin.ts (业务逻辑 Hook)       │
│  - 状态管理                           │
│  - 调用 API                          │
└──────┬────────────────────────────────┘
       │
       │ 2. 调用 API（api.ts）
       │
       ↓
┌───────────────────────────────────────┐
│         api.ts (API 封装)              │
│  - HTTP 请求                          │
│  - 错误处理                          │
└──────┬────────────────────────────────┘
       │
       │ 3. HTTP/JSON 请求
       │
       ↓
┌───────────────────────────────────────┐
│      后端 (FastAPI)                   │
│  ┌─────────────────────────────────┐  │
│  │  api/guanyin.py (API 路由)      │  │
│  └──────────┬──────────────────────┘  │
│             │ 4. 路由分发              │
│             ↓                         │
│  ┌─────────────────────────────────┐  │
│  │ services/                       │  │
│  │  - guanyin.py (签文服务)       │  │
│  │  - ai_agent.py (AI 服务)       │  │
│  │  - database.py (数据库服务)     │  │
│  └──────────┬──────────────────────┘  │
└─────────────┼───────────────────────────┘
              │
              │ 5. 外部服务调用
              │
        ┌─────┴─────┐
        ↓           ↓
┌──────────────┐  ┌──────────────────┐
│  Kimi API    │  │  Supabase        │
│  (Moonshot)  │  │  (PostgreSQL)    │
└──────┬───────┘  └────────┬─────────┘
       │                     │
       │ 6. 返回数据         │
       ↓                     ↓
┌───────────────────────────────────────┐
│         后端 (FastAPI)                   │
└─────────────┬───────────────────────────┘
              │
              │ 7. 返回 Response
              │
              ↓
┌───────────────────────────────────────┐
│      前端 (React)                        │
│  - 更新状态                           │
│  - 渲染 UI                            │
└───────────────────────────────────────┘
```

### 11.2 抽签数据流转

**流程**：
1. 前端触发抽签
2. 调用 `POST /api/guanyin/draw`
3. 后端 `guanyin.py` 从 JSON 加载 100 签
4. 随机抽取一支签
5. 返回签文数据
6. 前端显示签文卡片

### 11.3 AI 解读数据流转

**流程**：
1. 前端触发初次解读
2. 调用 `POST /api/guanyin/interpret`
3. 后端 `ai_agent.py` 构建 prompt
4. 调用 Kimi API (`https://api.moonshot.cn/v1/chat/completions`)
5. Kimi API 返回解读内容
6. 后端返回解读
7. 前端显示解读内容

### 11.4 数据保存数据流转

**流程**：
1. 出签后前端调用 `POST /api/guanyin/save-record`
2. 后端 `database.py` 构建请求
3. 调用 Supabase REST API (`https://xxx.supabase.co/rest/v1/divination_records`)
4. Supabase 插入记录
5. 返回记录 ID
6. 前端保存 `recordId`

### 11.5 对话更新数据流转

**流程**：
1. 每次 AI 回复后，前端调用 `PUT /api/guanyin/update-record/{recordId}`
2. 后端 `database.py` 构建请求
3. 调用 Supabase REST API 更新记录
4. Supabase 更新 `conversation` 字段
5. 返回成功状态

---

## 12. 非功能需求

### 12.1 性能需求

| 指标 | 要求 |
|------|------|
| 页面加载 | 首次加载 ≤ 3 秒 |
| 抽签响应 | 手势/鼠标触发后 ≤ 2 秒动画 |
| AI 初次解读 | ≤ 10 秒（网络依赖） |
| AI 追问回复 | ≤ 8 秒（网络依赖） |
| 数据保存 | 异步不阻塞，用户无感知 |

### 12.2 兼容性需求

| 项 | 要求 |
|----|------|
| 浏览器 | 支持主流现代浏览器（Chrome、Firefox、Safari、Edge） |
| 手势控制 | 需要摄像头支持 |
| 鼠标控制 | 无特殊要求，备用方案 |

### 12.3 安全性需求

| 项 | 要求 |
|----|------|
| 登录验证 | 必须登录才能使用观音灵签 |
| API 鉴权 | 后端 API 验证用户身份（通过 userId） |
| 数据隔离 | 用户只能看到自己的记录 |
| 敏感信息 | API Key 等敏感信息不提交到 Git（通过 .gitignore 忽略） |

---

**文档结束**

**版本**：v1.5  
**最后更新**：2026-04-21
