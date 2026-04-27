# 首页优化 - v1.3 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化首页布局，确保"选择模式"卡片一屏可见，简化顶部按钮

**Architecture:** 修改现有组件，紧凑化Hero区域，移除大Logo，合并登录/注册按钮

**Tech Stack:** React + TypeScript + Tailwind CSS

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/src/pages/Home/HeroSection.tsx` | 修改 | 紧凑化，移除大Logo |
| `frontend/src/components/Layout.tsx` | 修改 | 合并登录/注册按钮为一个 |
| `frontend/src/pages/Home.tsx` | 验证 | 确保布局正确 |

---

### Task 1: 修改 HeroSection 组件 - 移除大Logo并紧凑化

**Files:**
- Modify: `frontend/src/pages/Home/HeroSection.tsx`

- [ ] **Step 1: 移除Logo导入和组件**

修改文件，移除Logo导入和使用：

```typescript
const HeroSection = () => {
  return (
    <section className="py-10 md:py-12">
      <div className="container-max text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 font-serif mb-4">
          问心
        </h1>
        <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto mb-2 leading-relaxed">
          每一次对命运的探索和好奇，都源自于内心对自我了解的渴望。
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 验证文件修改**

确认完整的文件内容为：

```typescript
const HeroSection = () => {
  return (
    <section className="py-10 md:py-12">
      <div className="container-max text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-800 font-serif mb-4">
          问心
        </h1>
        <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto mb-2 leading-relaxed">
          每一次对命运的探索和好奇，都源自于内心对自我了解的渴望。
        </p>
      </div>
    </section>
  )
}

export default HeroSection
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/pages/Home/HeroSection.tsx
git commit -m "feat: compact HeroSection, remove large logo"
```

---

### Task 2: 修改 Layout 组件 - 合并登录/注册按钮

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: 修改导航栏按钮**

找到登录/注册按钮部分，修改为：

```typescript
<div className="flex items-center gap-2">
  <button onClick={() => setLoginModalOpen(true)}>
    <Button size="sm">登录/注册</Button>
  </button>
</div>
```

- [ ] **Step 2: 添加登录弹窗状态**

在组件顶部添加状态管理（先添加占位，完整功能在用户认证子项目中实现）：

```typescript
const Layout = ({ children, showBackButton = false }: LayoutProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
```

- [ ] **Step 3: 验证完整文件**

确保Layout.tsx中：
- Logo只在导航栏保留小尺寸
- 按钮合并为一个"登录/注册"
- 添加了loginModalOpen状态（暂时不做弹窗，留到用户认证子项目）

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/components/Layout.tsx
git commit -m "feat: combine login/register buttons into one"
```

---

### Task 3: 验证首页布局

**Files:**
- Verify: `frontend/src/pages/Home.tsx`

- [ ] **Step 1: 检查Home.tsx布局**

确认Home.tsx使用2x2网格布局，Section组件适当紧凑。

- [ ] **Step 2: 运行TypeScript检查**

```bash
cd frontend
npx tsc --noEmit
```

预期：无TypeScript错误

- [ ] **Step 3: 运行构建验证**

```bash
cd frontend
npm run build
```

预期：构建成功

---

## 验收检查

- [ ] Hero区域已紧凑化，py-10 md:py-12
- [ ] 大Logo已移除
- [ ] 导航栏只有一个"登录/注册"按钮
- [ ] TypeScript检查通过
- [ ] 构建成功
