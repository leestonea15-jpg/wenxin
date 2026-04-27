---
name: 问心 - 运势测算网站设计文档
description: 问心 - 运势测算网站的完整设计文档，包含架构、组件、数据模型、流程等
type: project
---

# 运势测算网站设计文档

**项目名称**：问心  
**版本**：v1.0  
**日期**：2026-04-07  
**状态**：待实现

## 1. 项目概述

### 1.1 产品定位
问心 - 一个现代简约风格的运势测算网站，提供多种测算玩法，支持手势控制交互。

### 1.2 Slogan
每一次对命运的探索和好奇，都源自于内心对自我了解的渴望。

### 1.3 产品特色
命理探索，手势互动——探索命运的新方式。

### 1.4 核心玩法
1. **每日速测** - 一分钟速测问吉凶（金钱卦 + 掷圣杯）
2. **观音灵签** - 预留
3. **塔罗牌** - 预留
4. **八字排盘** - 预留

## 2. 技术栈

### 2.1 前端
- 框架：React
- 构建工具：Vite
- 样式：Tailwind CSS
- 状态管理：React Query + Zustand
- 路由：React Router v6
- 动画：Framer Motion + canvas-confetti
- 手势识别：MediaPipe Hands + fingerpose
- Supabase客户端：@supabase/supabase-js

### 2.2 后端
- 框架：FastAPI（Python）
- ORM：SQLAlchemy 2.0

### 2.3 数据库与认证
- 数据库：Supabase PostgreSQL
- 认证：Supabase Auth（邮箱+密码、手机号+验证码）

## 3. 整体架构

### 3.1 目录结构
```
yunshicesuan/
├── frontend/                # React前端
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义hooks
│   │   ├── services/       # API调用
│   │   ├── utils/          # 工具函数
│   │   └── styles/         # 样式
│   └── package.json
├── backend/                 # Python后端
│   ├── app/
│   │   ├── api/            # 路由
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── core/           # 核心配置
│   └── requirements.txt
└── docs/                    # 文档
```

### 3.2 页面路由
- `/` - 首页（Landing Page）
- `/daily-speed` - 每日速测（金钱卦 + 掷圣杯）
- `/guanyin` - 观音灵签（预留）
- `/tarot` - 塔罗牌（预留）
- `/bazi` - 八字排盘（预留）
- `/history` - 历史记录页
- `/auth/login` - 登录页
- `/auth/signup` - 注册页

## 4. 前端组件设计

### 4.1 通用组件 (`components/`)
- `Button.tsx` - 按钮组件（主按钮、次要按钮、幽灵按钮）
- `Input.tsx` - 输入框组件
- `Modal.tsx` - 模态弹窗组件
- `Card.tsx` - 卡片组件
- `Layout.tsx` - 通用布局模板（带左下角导航按钮）
- `NavigationDrawer.tsx` - 左侧导航抽屉（玩法切换）
- `Section.tsx` - 页面区块组件

### 4.2 页面组件 (`pages/`)
- `Home.tsx` - 首页
  - `HeroSection` - Slogan和特色介绍区域
  - `GameCard` - 单个玩法卡片组件（4个复用）
- `DailySpeed.tsx` - 每日速测页面
  - `MoneyGuaSection` - 金钱卦模块
  - `ShengbeiSection` - 掷圣杯模块
  - `MoneyGuaModal` - 金钱卦测算弹窗
  - `ShengbeiModal` - 掷圣杯测算弹窗
- `History.tsx` - 历史记录页
  - `HistoryList` - 历史记录列表
  - `HistoryItem` - 单条历史记录
- `Login.tsx` - 登录页
- `Signup.tsx` - 注册页

### 4.3 自定义Hooks (`hooks/`)
- `useAuth.ts` - 认证相关
- `useSupabase.ts` - Supabase客户端
- `useGesture.ts` - 手势识别
- `useAnimation.ts` - 动画控制
- `useMoneyGua.ts` - 金钱卦业务逻辑
- `useShengbei.ts` - 掷圣杯业务逻辑

### 4.4 样式配置
- **视觉风格**：现代简约风格，中性色系
- **配色**：白色/米灰底色，黑色/深灰文字，金色点缀
- **暗色模式**：不支持
- **字体**：标题用衬线字体，正文用无衬线字体

## 5. 数据模型与API设计

### 5.1 数据库表结构

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

### 5.2 后端API设计

**认证相关（使用Supabase Auth）**
- POST /auth/login - 登录
- POST /auth/signup - 注册
- POST /auth/logout - 登出

**测算记录相关**
- GET /api/records - 获取当前用户的测算记录列表
- GET /api/records/:id - 获取单条测算记录详情
- POST /api/records - 创建测算记录
- DELETE /api/records/:id - 删除测算记录

**每日速测相关**
- POST /api/daily-speed/money-gua - 金钱卦测算（返回结果）
- POST /api/daily-speed/shengbei - 掷圣杯测算（返回结果）

### 5.3 金钱卦结果JSON结构
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

### 5.4 掷圣杯结果JSON结构
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

## 6. 数据流程与交互设计

### 6.1 首页流程
1. 用户访问 `/` → 展示Hero区域（Slogan + 特色介绍）
2. 展示4个玩法卡片
3. 用户点击某个玩法卡片 → 跳转到对应玩法页面

### 6.2 每日速测页面流程
1. 页面展示左右两个模块（金钱卦、掷圣杯）
2. 鼠标悬停模块 → 模块浮动放大动画
3. 用户点击"开始"按钮 → 打开对应Modal
4. Modal内流程：
   - 输入问题（可选，提示输入会记录）
   - （掷圣杯需要先选择：掷1次还是3次）
   - 点击"开始测算"按钮（或手势触发）
   - 显示动画效果
   - 展示结果
   - 用户可选择"再测一次"或"关闭"
5. 关闭Modal → 回到页面

### 6.3 手势控制流程
1. 页面加载 → 请求摄像头权限
2. 初始化MediaPipe Hands
3. 加载手势识别模型
4. 监测到"摇"手势 → 触发金钱卦测算
5. 监测到"抛"手势 → 触发掷圣杯测算
6. 监测到"左挥/右挥" → 切换玩法选择
7. 监测到"上挥" → 确认操作

### 6.4 数据存储流程
1. 用户完成测算 → 前端调用后端API
2. 后端生成结果 → 存入数据库（如果用户已登录且输入了问题）
3. 返回结果给前端 → 前端展示

### 6.5 左下角导航流程
1. 用户点击左下角按钮 → 导航抽屉从左侧滑出
2. 展示4个玩法选项
3. 用户点击某个玩法 → 关闭抽屉，跳转到对应页面

## 7. 视觉细节

### 7.1 玩法视觉元素
- **金钱卦**：乾隆通宝样式
- **掷圣杯**：朱红色

## 8. 错误处理与测试

### 8.1 错误处理

**前端错误处理**
- 摄像头权限被拒绝：提示用户"需要摄像头权限才能使用手势控制，您可以继续使用鼠标操作"
- 网络请求失败：显示重试按钮，友好提示
- Supabase认证失败：跳转登录页
- 手势识别失败：降级到纯鼠标操作，不影响功能使用

**后端错误处理**
- FastAPI全局异常处理器，返回统一错误格式
- 数据库操作失败：记录日志，返回友好错误
- 参数验证错误：返回详细的字段错误信息

### 8.2 测试策略

**单元测试**
- 前端：React组件测试（Vitest + React Testing Library）
- 后端：API路由测试（pytest）
- 测算逻辑测试：金钱卦、掷圣杯的结果判定逻辑

**端到端测试**
- 首页导航流程
- 每日速测完整流程（金钱卦、掷圣杯）
- 历史记录查看流程
- 用户登录/注册流程

**手动测试清单**
- 响应式布局测试（移动端、平板、桌面端）
- 浏览器兼容性（Chrome、Firefox、Safari）
- 手势控制测试（不同光线、不同距离）
- 动画性能测试

## 9. 开发计划

### 阶段一：MVP核心功能
- 项目初始化
- 首页 + 每日速测页面（无手势，鼠标操作）
- 用户认证（邮箱+密码、手机号+验证码）
- 测算记录存储与查看
- 基础动画效果

### 阶段二：手势控制
- 集成MediaPipe Hands
- 手势识别实现
- 手势触发测算

### 阶段三：玩法二、三、四
- 观音灵签
- 塔罗牌
- 八字排盘
