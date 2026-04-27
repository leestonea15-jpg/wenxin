---
name: 观音灵签功能完善 - 项目进度记录
description: 2026-04-21 观音灵签功能开发进度、问题解决和明日计划
type: project
---

# 观音灵签功能完善 - 项目进度记录

**日期**：2026-04-21  
**状态**：核心功能完成，细节优化中  
**Git Commit**：080f540

---

## 今日完成内容

### 一、问题解决清单

#### 后端启动与依赖问题
| 问题 | 状态 | 解决方式 |
|------|------|----------|
| pyiceberg 编译失败 | ✅ | 放弃 supabase Python 库，改用 httpx 直接调用 Supabase REST API |
| httpx 版本兼容性 | ✅ | 更新 httpx 到 0.27+ |
| 路由前缀重复 `/api/api/guanyin` | ✅ | 修改 `guanyin.py` 的路由前缀从 `/api/guanyin` 改为 `/guanyin` |

#### 数据库保存问题
| 问题 | 状态 | 解决方式 |
|------|------|----------|
| save-record 422 (schema 不匹配) | ✅ | 1. 前端传 `userId`；2. 补上 `conversation` 字段；3. 后端 schema 调整 |
| getaddrinfo failed (DNS 解析失败) | ✅ | 配置后端走代理（`http://127.0.0.1:7897`） |
| 409 Conflict (ID 冲突) | ✅ | 不传 `id` 字段，让 Supabase 自动生成 |
| 外键约束失败（关联 `auth.users`） | ✅ | 删除 Supabase 外键约束 |
| 字段不匹配（`stick` vs `result`） | ✅ | 1. 把 `stick` 放到 `result` 字段；2. 在 Supabase 添加 `conversation` 字段 |

#### 前端问题
| 问题 | 状态 | 解决方式 |
|------|------|----------|
| userId 为 null | ✅ | 前端从 `useAuthStore` 获取 `user?.id` 传给 `useGuanyin` |
| 用户 ID 格式不对（时间戳 vs UUID） | ✅ | 前端改用 `crypto.randomUUID()` 生成标准 UUID |
| Markdown 星标加粗原样显示 | ✅ | 前端用正则把 `**文字**` 替换成 `<strong>文字</strong>`，用 `dangerouslySetInnerHTML` 渲染 |

#### AI 解读问题
| 问题 | 状态 | 解决方式 |
|------|------|----------|
| Kimi API 400 (temperature 错误) | ✅ | 修改 `temperature` 从 0.7 改为 1.0（模型要求） |
| 追问后重复引用签诗 | 🔄 | 1. 简化 followup 的签文上下文；2. 提示词强化禁止重复引用；3. 追问时用特别强调的系统提示词前缀 |
| 出现英文单词 | 🔄 | 1. 提示词加"纯中文原则"；2. 移到最前面并用【零容忍铁律】强调 |
| 字数不灵活 | ✅ | 提示词加"字数灵活不刻板，不超过400字" |

---

### 二、修改文件清单

#### 后端文件
- `backend/.gitignore` - ✅ 新增 `.env` 到忽略列表
- `backend/app/api/guanyin.py` - ✅ 修改路由前缀，添加更新记录接口
- `backend/app/core/config.py` - ✅ 添加代理配置读取
- `backend/app/models/schemas.py` - ✅ 调整 SaveRecordRequest（user_id 必填，conversation 可选）
- `backend/app/services/ai_agent.py` - ✅ 强化提示词规则，添加代理支持，追问模式特别强调
- `backend/app/services/database.py` - ✅ 新建，用 httpx 直接调用 Supabase REST API
- `backend/app/services/guanyin.py` - ✅ 从 JSON 加载 100 签文
- `backend/requirements.txt` - ✅ 调整依赖版本

#### 前端文件
- `frontend/src/hooks/useGuanyin.ts` - ✅ 完整集成后端 API，自动保存和增量更新
- `frontend/src/pages/Guanyin.tsx` - ✅ 从 useAuthStore 获取 userId 并传递
- `frontend/src/pages/Guanyin/ChatArea.tsx` - ✅ 支持 Markdown 加粗渲染
- `frontend/src/services/api.ts` - ✅ 新建，封装 API 调用
- `frontend/src/store/auth.ts` - ✅ 用户 ID 改用 UUID 格式

#### 文档文件
- `docs/superpowers/plans/*.md` - ✅ 新增实施计划
- `docs/superpowers/specs/*.md` - ✅ 新增 PRD 和设计文档

---

### 三、当前服务器状态

| 服务 | 地址 | 状态 |
|------|------|------|
| 后端 | http://127.0.0.1:8000 | ✅ 运行中 |
| 前端 | http://localhost:3000 | ✅ 运行中 |

---

## 明日待办事项

### 高优先级
1. **彻底解决"追问后重复引用签诗"问题** - 当前提示词已强化，但可能还需要进一步调整
2. **彻底解决"AI 回复出现英文"问题** - 当前提示词已强化，但可能还需要进一步调整

### 中优先级
3. **完整端到端测试** - 测试所有功能流程
4. **检查数据库记录保存** - 验证数据正确写入 Supabase
5. **TypeScript 类型错误清理** - 前端有一些 TS 警告需要清理

### 低优先级
6. **代码优化和重构** - 优化结构，清理冗余
7. **补充单元测试** - 为核心功能添加测试

---

## 已知问题（待优化）

1. **AI 追问重复引用签诗** - 已多次强化提示词，但仍偶有发生
2. **AI 回复出现英文** - 已移到【零容忍铁律】第一条，但仍需观察
3. **前端 TypeScript 警告** - 有一些未使用变量的警告，不影响功能

---

## 快速启动指南（明日参考）

### 启动后端
```bash
cd backend
python -m uvicorn main:app --reload
```

### 启动前端
```bash
cd frontend
npm run dev
```

### 代理配置
确保代理软件运行在 `http://127.0.0.1:7897`

---

**记录结束**
