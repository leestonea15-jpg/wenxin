# Supabase 配置详细指南

## 概述

本指南将带你完成 Supabase 项目配置的剩余步骤，使项目可以正常运行。

---

## 第三步：获取 Supabase 凭据

### 3.1 登录 Supabase 控制台

1. 访问 https://supabase.com
2. 点击右上角的 "Sign In" 登录你的账号
3. 登录后进入 Dashboard，找到项目 **"问心"** 并点击进入

### 3.2 获取 Project URL 和 Anon Key

1. 在项目左侧菜单中，点击 **Settings**（齿轮图标）
2. 在 Settings 页面中，点击左侧的 **API**
3. 在 "Project URL" 部分，复制 `URL`（格式类似：`https://xxxxxx.supabase.co`）
4. 在 "Project API keys" 部分，找到 `anon public` 开头的 Key，复制它
5. **把这两个值先保存到记事本里，后面会用到**

### 3.3 获取 Service Role Key 和 JWT Secret

在同一个 Settings → API 页面：

1. 在 "Project API keys" 部分，找到 `service_role` 开头的 Key，复制它
2. 在 "JWT Settings" 部分，找到 `JWT Secret`，点击 "Reveal" 显示后复制它
3. **把这两个值也保存到记事本里**

### 3.4 配置数据库表（如果还没配置）

如果还没有执行过数据库表的 SQL：

1. 在左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 复制下面的 SQL 并粘贴到编辑器中：

```sql
-- 创建测算记录表
CREATE TABLE divination_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL,
    question TEXT,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_divination_records_user_id ON divination_records(user_id);
CREATE INDEX idx_divination_records_type ON divination_records(type);
CREATE INDEX idx_divination_records_created_at ON divination_records(created_at DESC);

-- 启用行级安全策略
ALTER TABLE divination_records ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己的记录
CREATE POLICY "Users can view their own records"
    ON divination_records FOR SELECT
    USING (auth.uid() = user_id);

-- 创建策略：用户只能创建自己的记录
CREATE POLICY "Users can create their own records"
    ON divination_records FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 创建策略：用户只能删除自己的记录
CREATE POLICY "Users can delete their own records"
    ON divination_records FOR DELETE
    USING (auth.uid() = user_id);
```

4. 点击 **Run** 执行 SQL
5. 看到 "Success. No rows returned" 表示表创建成功

---

## 第四步：配置 .env 文件

### 4.1 配置根目录 .env 文件

1. 在项目根目录 `D:\claudeCodeProjects\yunshicesuan` 下，复制 `.env.example` 并重命名为 `.env`
2. 用记事本或 VS Code 打开 `.env` 文件
3. 填入刚才获取的 Supabase 凭据：

```env
# Supabase
VITE_SUPABASE_URL=你的Project_URL
VITE_SUPABASE_ANON_KEY=你的anon_public_key

# Backend
SUPABASE_URL=你的Project_URL
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
SUPABASE_JWT_SECRET=你的JWT_Secret
```

**示例**（请用你自己的真实值替换）：
```env
# Supabase
VITE_SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend
SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-here
```

4. 保存文件

### 4.2 配置前端 .env.local 文件

1. 进入 `frontend` 目录
2. 复制根目录的 `.env.example` 到 `frontend` 目录，并重命名为 `.env.local`
3. 或者直接在 `frontend` 目录下创建 `.env.local` 文件，填入：

```env
VITE_SUPABASE_URL=你的Project_URL
VITE_SUPABASE_ANON_KEY=你的anon_public_key
```

---

## 第五步：安装前端依赖并运行

### 5.1 安装 Node.js（如果还没安装）

1. 访问 https://nodejs.org/
2. 下载 LTS 版本（推荐 18.x 或 20.x）
3. 安装后，打开终端验证：
   ```bash
   node --version
   npm --version
   ```

### 5.2 安装前端依赖

打开终端（命令提示符或 PowerShell），执行：

```bash
cd D:\claudeCodeProjects\yunshicesuan\frontend
npm install
```

如果安装速度慢，可以使用淘宝镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

### 5.3 启动前端开发服务器

```bash
npm run dev
```

看到类似下面的输出表示启动成功：
```
  VITE v5.0.0  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 5.4 验证前端

1. 打开浏览器访问 http://localhost:3000
2. 应该能看到"问心"首页
3. 点击"每日速测"，进入每日速测页面
4. 测试金钱卦和掷圣杯功能

---

## 第六步：安装后端依赖并运行（可选）

前端已经可以独立运行（测算逻辑在前端实现），后端主要用于记录存储。

### 6.1 安装 Python（如果还没安装）

1. 访问 https://www.python.org/downloads/
2. 下载 Python 3.10 或更高版本
3. 安装时勾选 "Add Python to PATH"
4. 验证安装：
   ```bash
   python --version
   ```

### 6.2 创建虚拟环境并安装依赖

打开新的终端窗口（保持前端运行，另开一个终端）：

```bash
cd D:\claudeCodeProjects\yunshicesuan\backend
python -m venv venv
```

激活虚拟环境：

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

安装依赖：
```bash
pip install -r requirements.txt
```

如果慢，使用清华镜像：
```bash
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 6.3 配置后端 .env 文件

在 `backend` 目录下创建 `.env` 文件：

```env
SUPABASE_URL=你的Project_URL
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
SUPABASE_JWT_SECRET=你的JWT_Secret
```

### 6.4 启动后端服务器

```bash
python main.py
```

看到类似输出表示启动成功：
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 6.5 测试后端 API

打开浏览器访问：http://localhost:8000/health

应该返回：`{"status": "healthy"}`

---

## 常见问题

### Q: npm install 报错？
A: 尝试删除 `node_modules` 文件夹和 `package-lock.json`，重新运行 `npm install`

### Q: 前端启动后页面空白？
A: 按 F12 打开开发者工具，查看 Console 是否有错误，确认 `.env.local` 配置正确

### Q: Supabase 连接失败？
A: 确认 Project URL 和 Anon Key 没有多余空格，且项目已完全初始化（Supabase 项目创建后需要等待 2-3 分钟）

---

## 下一步

配置完成后，你就可以：
1. 在 http://localhost:3000 使用每日速测功能
2. 测试金钱卦和掷圣杯的动画效果
3. 后续可以继续开发历史记录、用户认证等功能
