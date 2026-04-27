# 🚀 问心 - 部署指南

最简单的部署方案，全部用免费服务！

---

## 📋 部署前检查清单

- [ ] 代码已推送到 GitHub/GitLab
- [ ] 有 Supabase 账户和项目
- [ ] 有 Kimi API Key（或其他 LLM API）

---

## 1️⃣ 前端部署到 Vercel

### 步骤 1：准备前端配置

确保前端的 API 地址可以配置：

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

在 `frontend` 目录创建 `.env.production`：

```env
VITE_API_URL=https://your-backend.onrender.com  # 后面会得到这个地址
```

### 步骤 2：部署到 Vercel

**方法 A：用 Vercel 网站（推荐）**

1. 访问 [vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的仓库
5. 配置：
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
6. 点击 "Deploy"
7. ✅ 完成！你会得到一个类似 `https://your-app.vercel.app` 的链接

**方法 B：用命令行**

```bash
cd frontend
npm i -g vercel
vercel
```

---

## 2️⃣ 后端部署到 Render

### 步骤 1：准备环境变量

复制你的 `backend/.env` 内容，准备在 Render 后台配置。

### 步骤 2：部署到 Render

1. 访问 [render.com](https://render.com)
2. 用 GitHub 账号登录
3. 点击 "New +" → "Web Service"
4. 选择你的仓库
5. 配置：
   - **Name**: wenxin-backend（或你喜欢的名字）
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
   - **Plan**: Free
6. 点击 "Advanced" → 添加环境变量：
   - 把你 `backend/.env` 里的所有变量都添加进去
   - 额外添加：`FRONTEND_URL=https://your-app.vercel.app`（换成你前端的地址）
7. 点击 "Create Web Service"
8. ⏰ 等待 2-5 分钟部署完成
9. ✅ 完成！你会得到一个类似 `https://wenxin-backend.onrender.com` 的地址

### 步骤 3：更新前端配置

回到 Vercel，更新前端的环境变量：

1. 在 Vercel 项目页面 → Settings → Environment Variables
2. 添加：
   - `VITE_API_URL` = `https://wenxin-backend.onrender.com`（换成你后端的地址）
3. 重新部署前端

---

## 3️⃣ 测试一下！

1. 访问你的前端地址：`https://your-app.vercel.app`
2. 试试抽签、解读功能
3. 如果正常，分享给朋友吧！🥳

---

## 🎯 成本估算

| 服务 | 免费额度 | 超出后 |
|------|---------|-------|
| Vercel (前端) | 100GB/月流量 | 付费 |
| Render (后端) | 750小时/月 | 7美元/月起 |
| Supabase (数据库) | 500MB数据 | 付费 |
| Kimi API | 看你的用量 | 按量付费 |

**注意**：Render 免费版 15分钟不活动会休眠，首次访问可能需要几秒钟启动。

---

## 🔧 常见问题

**Q: 后端部署失败怎么办？**
A: 检查 Render 的日志，看是否缺少环境变量。

**Q: 前端无法调用后端？**
A: 检查 CORS 配置和环境变量 `FRONTEND_URL`。

**Q: 想要自己的域名？**
A: Vercel 和 Render 都支持绑定自定义域名。

---

## 📞 需要帮助？

参考各平台文档：
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Supabase: https://supabase.com/docs
