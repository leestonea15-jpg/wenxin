-- ============================================
-- 观音灵签AI Agent重构 - 完整数据库脚本
-- 版本：v1.0
-- 日期：2026-04-22
-- 包含：第一阶段 + 第二阶段 + 第三阶段
-- ============================================

-- ============================================
-- 第一阶段（已执行）：扩展现有表
-- ============================================
-- 扩展 divination_records 表，增加记忆相关字段
ALTER TABLE divination_records
ADD COLUMN IF NOT EXISTS memory_tags VARCHAR(100)[],
ADD COLUMN IF NOT EXISTS memory_summary TEXT;

-- 为新增字段创建索引
CREATE INDEX IF NOT EXISTS idx_divination_memory_tags
ON divination_records USING GIN(memory_tags);

-- ============================================
-- 第二阶段：新建 agent_memory 表
-- ============================================
-- 创建 agent_memory 表 - 记忆系统核心表
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    memory_layer VARCHAR(20) NOT NULL,  -- 'working'|'short_term'|'long_term'
    memory_type VARCHAR(50) NOT NULL,   -- 'divination'|'conversation'|'user_profile'
    content JSONB NOT NULL,             -- 记忆内容
    summary TEXT,                       -- AI生成的摘要（可选）
    topic_tags VARCHAR(100)[],          -- 话题标签数组
    relevance_score FLOAT,              -- 相关度分数
    stick_id INTEGER,                   -- 关联的签文ID（如果是求签记忆）
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ              -- 过期时间（短期记忆用）
);

-- 为 agent_memory 表创建索引
CREATE INDEX IF NOT EXISTS idx_agent_memory_user_id
ON agent_memory(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_memory_layer
ON agent_memory(memory_layer);

CREATE INDEX IF NOT EXISTS idx_agent_memory_topic_tags
ON agent_memory USING GIN(topic_tags);

CREATE INDEX IF NOT EXISTS idx_agent_memory_created_at
ON agent_memory(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memory_expires_at
ON agent_memory(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 第三阶段：可选表（按需创建）
-- ============================================

-- 1. 创建 agent_checkpoints 表 - 检查点存储（可选）
CREATE TABLE IF NOT EXISTS agent_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkpoint_id VARCHAR(100) NOT NULL UNIQUE,
    agent_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    user_id UUID,
    agent_state JSONB NOT NULL,          -- Agent状态快照
    context_data JSONB,                  -- Context数据
    memory_snapshot JSONB,               -- 记忆快照
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 agent_checkpoints 表创建索引
CREATE INDEX IF NOT EXISTS idx_checkpoint_agent_id
ON agent_checkpoints(agent_id);

CREATE INDEX IF NOT EXISTS idx_checkpoint_session_id
ON agent_checkpoints(session_id);

CREATE INDEX IF NOT EXISTS idx_checkpoint_created_at
ON agent_checkpoints(created_at DESC);

-- 2. 创建 agent_observability 表 - 观测性数据存储（可选）
CREATE TABLE IF NOT EXISTS agent_observability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,            -- 'log'|'trace'|'metric'
    trace_id VARCHAR(100),
    session_id VARCHAR(100),
    user_id UUID,
    operation VARCHAR(100),
    data JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 为 agent_observability 表创建索引
CREATE INDEX IF NOT EXISTS idx_obs_type
ON agent_observability(type);

CREATE INDEX IF NOT EXISTS idx_obs_trace_id
ON agent_observability(trace_id);

CREATE INDEX IF NOT EXISTS idx_obs_session_id
ON agent_observability(session_id);

CREATE INDEX IF NOT EXISTS idx_obs_timestamp
ON agent_observability(timestamp DESC);

-- 3. 创建 agent_execution_history 表 - 执行历史记录（可选）
CREATE TABLE IF NOT EXISTS agent_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID,
    operation VARCHAR(50) NOT NULL,       -- 'interpret'|'followup'
    plan_id VARCHAR(100),                 -- 关联的规划ID
    state_before VARCHAR(50),
    state_after VARCHAR(50),
    duration_ms FLOAT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    tool_calls JSONB,                    -- 调用的工具列表
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 agent_execution_history 表创建索引
CREATE INDEX IF NOT EXISTS idx_exec_session_id
ON agent_execution_history(session_id);

CREATE INDEX IF NOT EXISTS idx_exec_user_id
ON agent_execution_history(user_id);

CREATE INDEX IF NOT EXISTS idx_exec_created_at
ON agent_execution_history(created_at DESC);

-- 4. 创建 agent_tool_calls 表 - 工具调用历史（可选）
CREATE TABLE IF NOT EXISTS agent_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID,
    tool_name VARCHAR(100) NOT NULL,
    tool_parameters JSONB,
    result JSONB,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    duration_ms FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 agent_tool_calls 表创建索引
CREATE INDEX IF NOT EXISTS idx_tool_session_id
ON agent_tool_calls(session_id);

CREATE INDEX IF NOT EXISTS idx_tool_tool_name
ON agent_tool_calls(tool_name);

CREATE INDEX IF NOT EXISTS idx_tool_created_at
ON agent_tool_calls(created_at DESC);

-- ============================================
-- 脚本执行完成！
-- ============================================
-- 第一阶段：扩展 divination_records 表 ✅
-- 第二阶段：创建 agent_memory 表 ✅
-- 第三阶段：创建 4个可选表 ✅
-- ============================================
