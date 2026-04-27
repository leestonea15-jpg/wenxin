---
name: 观音灵签AI Agent重构设计方案
description: 基于完整讨论的观音灵签AI Agent重构设计方案，包含设计思路、架构规划、实施路径
type: plan
date: 2026-04-22
product_owner: AI Agent产品团队
architect: 系统架构团队
---

# 观音灵签AI Agent重构设计方案

**版本**：v1.0  
**日期**：2026-04-22  
**状态**：待评审  
**基于讨论**：`docs/discussion/ai_agent_architecture_discussion_20260422.md`

---

## 目录

1. [方案概述](#1-方案概述)
2. [设计思路](#2-设计思路)
3. [零影响原则 - 最重要！](#3-零影响原则---最重要)
4. [目标架构设计](#4-目标架构设计)
5. [核心模块详细设计](#5-核心模块详细设计)
6. [数据库设计](#6-数据库设计)
7. [实施路径规划](#7-实施路径规划)
8. [风险与应对](#8-风险与应对)
9. [成功指标](#9-成功指标)

---

## 1. 方案概述

### 1.1 现状评估

#### 当前状态
- **技术实现**：简化的LLM包装器，前后端分离
- **已具备能力**：
  - ✅ 清晰的系统提示词（知识库约束）
  - ✅ 前后端分离架构
  - ✅ 数据持久化（数据库保存）
  - ✅ 基础的对话历史传递

#### 主要差距
- ❌ 无Agent Harness框架
- ❌ 无真正的记忆系统
- ❌ 无工具调用能力
- ❌ 无多步规划能力
- ❌ 无反思自我检查机制
- ❌ 无完整的状态机管理
- ❌ 观测性不足

---

### 1.2 重构目标

#### 短期目标（MVP）
- 建立Agent Harness基础框架
- 实现工作记忆和短期记忆
- 实现基础工具调用框架
- 完善观测性（日志、追踪）

#### 中期目标
- 实现完整记忆系统（包括长期记忆）
- 实现多步规划能力
- 实现反思与自我检查
- 实现检查点机制

#### 长期目标
- 完整的Agent最佳实践落地
- 可扩展的工具生态
- 智能化的记忆检索
- 自适应的规划策略

---

## 2. 设计思路

### 2.1 核心设计原则

| 原则 | 说明 | 实践参考 |
|-----|------|---------|
| **渐进式演进** | 不追求一步到位，分阶段实施 | 三个阶段：MVP→完善→优化 |
| **分层解耦** | UI层、Agent层、Harness层清晰分离 | 前端分层、后端分层 |
| **最佳实践优先** | 优先落地讨论中明确的"最佳实践"内容 | Context Engineering、Harness设计 |
| **向下兼容** | 保持现有API兼容，平滑迁移 | 版本化API |
| **可观测性** | 从第一天就设计观测能力 | 日志、追踪、指标三位一体 |

---

### 2.2 关键决策

| 决策项 | 决策结果 | 理由 |
|-------|---------|------|
| **前端架构** | Agent逻辑从React Hook分离，独立Agent层 | 讨论中明确：Agent状态不应绑在React useState |
| **后端架构** | 引入Harness层，包裹业务Agent | Harness Engineering最佳实践 |
| **状态管理** | 引入状态机驱动 | 避免状态混乱，可追踪可审计 |
| **记忆系统** | 四层架构：工作→短期→长期→知识库 | 经典最佳实践，讨论中明确 |
| **Context策略** | 分层组织、动态调整、窗口管理、清晰标记 | Context Engineering最佳实践 |
| **工具调用** | 统一Tool抽象，注册机制 | 可扩展、可监控 |
| **错误处理** | 错误分类+指数退避重试+降级策略 | Harness最佳实践 |

---


---

## 4. 目标架构设计

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   UI组件     │  │ React桥接层  │  │  Agent状态   │  │
│  │ (ChatArea等) │  │(useGuanyinAgent)│  │  管理(独立)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                        后端层                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Agent Harness层                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ 状态机   │ │ 工具协调 │ │ 错误处理 │ │ 观测性   │ │  │
│  │  │ 管理     │ │ 器       │ │ 器       │ │ 层       │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐                            │  │
│  │  │ 检查点   │ │ Context  │                            │  │
│  │  │ 机制     │ │ 管理层   │                            │  │
│  │  └──────────┘ └──────────┘                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              业务Agent层                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ 记忆系统 │ │ 规划引擎 │ │ 反思引擎 │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                工具层                      │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ 签文知识 │ │ 记忆检索 │ │ 黄历API  │            │  │
│  │  │ 库工具   │ │ 工具     │ │ 工具     │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      基础设施层                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   LLM API    │  │  数据库      │  │  文件存储    │  │
│  │  (Kimi)      │  │  (Supabase)  │  │  (检查点)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.2 前端分层架构

#### 新的前端分层

```
frontend/src/
├── components/              # UI组件层（纯React）
│   └── Layout.tsx
├── pages/
│   └── Guanyin/
│       ├── ChatArea.tsx      # 纯UI组件
│       ├── StickDisplay.tsx   # 纯UI组件
│       └── ...
├── agents/                   # 新增：Agent层（独立）
│   ├── GuanyinAgent.ts       # Agent核心逻辑
│   ├── AgentState.ts         # Agent状态定义
│   └── AgentStore.ts        # Agent状态管理
├── hooks/
│   └── useGuanyinAgent.ts    # React桥接层
├── services/
│   └── api.ts
└── store/
    └── auth.ts
```

#### 关键改进点
- **新增** `agents/` 目录：Agent逻辑完全独立，不依赖React
- **改造** `useGuanyin.ts` → `useGuanyinAgent.ts`：只做React桥接
- **保留** UI组件：保持纯React，只负责渲染

---

### 3.3 后端分层架构

#### 新的后端分层

```
backend/app/
├── api/
│   └── guanyin.py            # API路由层（保持兼容）
├── harness/                  # 新增：Harness层
│   ├── __init__.py
│   ├── state_machine.py      # 状态机管理
│   ├── tool_orchestrator.py  # 工具协调器
│   ├── error_handler.py      # 错误处理器
│   ├── observability.py      # 观测性层
│   ├── checkpoint.py         # 检查点机制
│   └── context_manager.py    # Context管理层
├── agents/                   # 新增：业务Agent层
│   ├── __init__.py
│   ├── guanyin_agent.py      # 业务Agent
│   ├── memory_system.py      # 记忆系统
│   ├── planning_engine.py    # 规划引擎
│   └── reflection_engine.py  # 反思引擎
├── tools/                    # 新增：工具层
│   ├── __init__.py
│   ├── base_tool.py          # 基础Tool抽象
│   ├── stick_knowledge.py    # 签文知识库工具
│   ├── memory_retrieval.py   # 记忆检索工具
│   └── calendar_api.py       # 黄历API工具
├── services/                 # 保留：现有服务
│   ├── guanyin.py
│   ├── ai_agent.py           # 改造：移入Harness
│   └── database.py
├── models/
└── core/
```

---

## 5. 核心模块详细设计

### 5.1 Context Engineering模块

#### 设计要点（来自讨论中的"最佳实践"）

| 策略 | 具体实现 |
|-----|---------|
| **分层组织** | 系统指令→签文→对话→任务，每层用XML标记分开 |
| **动态调整** | 初次解读给完整签文，追问只给标识 |
| **窗口管理** | 对话历史只保留最近3-5轮 |
| **清晰标记** | 用XML标签分隔不同类型 |
| **指令明确** | 告诉LLM每部分怎么用 |
| **Token优化** | 不浪费token在无关信息上 |

#### Token预算分配

| 上下文类型 | 保留策略 | Token预算 |
|-----------|---------|----------|
| 系统指令 | 永远保留 | ~500 tokens |
| 当前签文 | 永远保留 | ~300 tokens |
| 对话历史 | 最近3-5轮 | ~800 tokens |
| **总计** | | **~1600 tokens** |

#### Context构建器实现

```python
# backend/app/harness/context_manager.py

class ContextManager:
    """Context管理器 - 实现Context Engineering最佳实践"""
    
    def build_interpret_context(self, question: str, stick: GuanyinStick) -> List[dict]:
        """构建初次解读Context"""
        return [
            self._build_system_prompt(),
            self._build_stick_context(stick, include_poem=True),
            self._build_task_context("初次解读", question),
        ]
    
    def build_followup_context(
        self, 
        question: str, 
        stick: GuanyinStick, 
        history: List[Message]
    ) -> List[dict]:
        """构建追问Context"""
        return [
            self._build_system_prompt(emphasize_no_poem=True),
            self._build_stick_context(stick, include_poem=False),  # 不重复签诗
            self._build_conversation_context(history, window_size=5),
            self._build_task_context("追问", question),
        ]
    
    def _build_system_prompt(self, emphasize_no_poem: bool = False) -> dict:
        """构建系统指令层"""
        content = self.base_system_prompt
        if emphasize_no_poem:
            content += "\n\n【重要！追问模式特别强调】：\n绝对不要重复引用签诗原文！"
        return {"role": "system", "content": content}
    
    def _build_stick_context(
        self, 
        stick: GuanyinStick, 
        include_poem: bool = True
    ) -> dict:
        """构建签文Context层"""
        if include_poem:
            content = f"""<context>
【当前签文】
第{stick.id}签 - {stick.level}
【标题】{stick.title}
【签诗】{stick.poem}
【典故】{stick.story}
【释义】{stick.meaning}
</context>"""
        else:
            content = f"""<context>
【当前签文标识】
第{stick.id}签 - {stick.level}《{stick.title}》
</context>"""
        return {"role": "user", "content": content}
    
    def _build_conversation_context(
        self, 
        history: List[Message], 
        window_size: int = 5
    ) -> List[dict]:
        """构建对话历史层（滑动窗口）"""
        # 只保留最近N轮
        recent_history = history[-window_size:] if len(history) > window_size else history
        
        messages = []
        if recent_history:
            content = "<conversation>\n【最近对话】\n"
            for msg in recent_history:
                role = "用户" if msg.role == "user" else "AI"
                content += f"{role}：{msg.content}\n"
            content += "</conversation>"
            messages.append({"role": "user", "content": content})
        
        return messages
    
    def _build_task_context(self, mode: str, question: str) -> dict:
        """构建任务指令层"""
        if mode == "初次解读":
            format_instruction = """
【输出格式】
请按这个结构：
1. 点明签号+吉凶
2. 引用签诗原文
3. 解释典故含义
4. 结合你的问题解读
5. 给出具体建议
"""
        else:
            format_instruction = """
【输出格式】
直接回答，不要重复签诗！
"""
        
        content = f"""<task>
【当前任务】{mode}
【用户问题】{question}

【使用说明】
1. 先看<system>里的铁律，绝对不能违反
2. 再看<context>里的签文，这是你的唯一知识库
3. 然后看<conversation>了解之前说过什么
4. 最后回答用户问题

{format_instruction}
</task>"""
        
        return {"role": "user", "content": content}
```

---

### 5.2 记忆系统模块

#### 设计要点（来自讨论中的"最佳实践"）

| 策略 | 具体实现 |
|-----|---------|
| **分层存储** | 工作→短期→长期→知识库，不同层不同策略 |
| **检索优先** | 不是把所有记忆都塞给LLM，只选相关的 |
| **摘要压缩** | 对话结束后生成摘要，不存完整对话 |
| **时间衰减** | 最近的记忆权重更高 |
| **Token控制** | 记忆部分不超过总token的30% |
| **索引优化** | 按签号、日期、话题建索引 |
| **遗忘机制** | 太旧的、不重要的自动删除 |

#### 记忆四层架构

```python
# backend/app/agents/memory_system.py

class MemoryLayer(Enum):
    WORKING = "working"      # 工作记忆：当前会话
    SHORT_TERM = "short_term" # 短期记忆：最近7天
    LONG_TERM = "long_term"   # 长期记忆：所有历史
    KNOWLEDGE = "knowledge"   # 知识库：固定知识

class GuanyinAgentMemory:
    """观音灵签Agent记忆系统"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.working_memory = WorkingMemory()
        self.short_term_memory = ShortTermMemory()
        self.long_term_memory = LongTermMemory()
        self.knowledge_base = KnowledgeBase()
    
    def retrieve(
        self, 
        query: str, 
        limit: int = 3, 
        max_tokens: int = 500
    ) -> List[MemoryItem]:
        """检索相关记忆 - 混合检索策略"""
        # 1. 从各层记忆找相关的
        candidates = []
        candidates.extend(self.working_memory.search(query))
        candidates.extend(self.short_term_memory.search(query))
        candidates.extend(self.long_term_memory.search(query))
        
        # 2. 时间衰减加权
        for item in candidates:
            item.score *= self._time_decay_factor(item.timestamp)
        
        # 3. 加权排序，只选Top N
        candidates.sort(key=lambda x: x.score, reverse=True)
        selected = candidates[:limit]
        
        # 4. Token控制
        return self._trim_to_token_limit(selected, max_tokens)
    
    def store(self, item: MemoryItem, layer: MemoryLayer):
        """存入记忆"""
        if layer == MemoryLayer.WORKING:
            self.working_memory.add(item)
        elif layer == MemoryLayer.SHORT_TERM:
            self.short_term_memory.add(item)
        elif layer == MemoryLayer.LONG_TERM:
            self.long_term_memory.add(item)
    
    def build_context_for_prompt(self, query: str) -> str:
        """构建记忆Context"""
        relevant_memories = self.retrieve(query, limit=3)
        if not relevant_memories:
            return ""
        
        content = "<memory>\n【相关记忆】\n"
        for i, mem in enumerate(relevant_memories, 1):
            content += f"{i}. {mem.summary}\n"
        content += "</memory>"
        return content
    
    def _time_decay_factor(self, timestamp: datetime) -> float:
        """时间衰减因子 - 最近的权重更高"""
        days_old = (datetime.now() - timestamp).days
        return max(0.1, 1.0 - (days_old * 0.1))
```

---

### 5.3 Harness框架模块

#### 设计要点（来自讨论中的"最佳实践"）

| 组件 | 关键能力 |
|-----|---------|
| **状态机管理** | 所有状态转换通过状态机管理，避免混乱 |
| **工具抽象** | 所有外部能力封装为Tool，统一管理 |
| **错误分层** | 临时性/永久性/可恢复错误分类处理 |
| **指数退避重试** | 避免立即重试造成雪崩 |
| **降级策略** | 关键路径有fallback方案 |
| **完整观测性** | 日志、追踪、指标三位一体 |
| **检查点机制** | 支持中断恢复，避免重复计算 |

#### Harness整合实现

```python
# backend/app/harness/guanyin_harness.py

class GuanyinAgentHarness:
    """观音灵签Agent Harness - 完整实现"""
    
    def __init__(self, config: HarnessConfig):
        self.config = config
        
        # 初始化核心组件
        self.state_machine = AgentStateMachine()
        self.tool_orchestrator = ToolOrchestrator()
        self.error_handler = ErrorHandler()
        self.observability = AgentObservability()
        self.checkpoint = AgentCheckpoint()
        self.context_manager = ContextManager()
        
        # 注册工具
        self._register_tools()
        
        # 业务Agent和记忆系统
        self.agent = GuanyinAgent()
        self.memory = GuanyinAgentMemory(user_id=None)  # 后续设置
        
        # 当前会话
        self._current_session = None
    
    async def interpret_stick(
        self,
        question: str,
        stick: GuanyinStick,
        user_id: str
    ) -> str:
        """初次解读签文（带完整Harness管理）"""
        trace_id = self.observability.start_trace('interpret_stick')
        
        try:
            # 1. 状态机检查
            if not self.state_machine.can_transition('INTERPRET_START'):
                raise InvalidStateError()
            
            self.state_machine.transition('INTERPRET_START')
            self.observability.log('INFO', 'Start interpreting', 
                                  question=question, stick_id=stick.id)
            
            # 2. 设置记忆系统
            self.memory.user_id = user_id
            
            # 3. 构建Context（含记忆）
            memory_context = self.memory.build_context_for_prompt(question)
            messages = self.context_manager.build_interpret_context(question, stick)
            if memory_context:
                messages.insert(2, {"role": "user", "content": memory_context})
            
            # 4. 带重试执行Agent
            result = await self.error_handler.execute_with_retry(
                self.agent.interpret_stick,
                messages
            )
            
            # 5. 反思检查
            reflection_result = await self._reflect_and_check(result, stick, question)
            if reflection_result.needs_correction:
                result = reflection_result.corrected_response
            
            # 6. 状态机完成
            self.state_machine.transition('INTERPRET_COMPLETE')
            
            # 7. 存入记忆
            self._store_to_memory(question, stick, result, user_id)
            
            # 8. 保存检查点
            self.checkpoint.save_checkpoint(
                self._current_session['session_id'],
                self.state_machine.get_state(),
                {'question': question, 'stick': stick},
                {}
            )
            
            # 9. 观测性记录
            self.observability.end_trace(trace_id, success=True)
            self.observability.record_metric('interpret_duration', 
                (datetime.now() - self._current_session['start_time']).total_seconds())
            
            return result
            
        except Exception as e:
            self.state_machine.transition('ERROR_OCCURRED')
            self.observability.end_trace(trace_id, success=False, error=str(e))
            self.observability.log('ERROR', 'Interpret failed', error=str(e))
            raise
    
    async def _reflect_and_check(
        self,
        response: str,
        stick: GuanyinStick,
        question: str
    ) -> ReflectionResult:
        """反思与自我检查"""
        reflection_engine = ReflectionEngine()
        
        checks = [
            reflection_engine.check_accuracy(response, stick),
            reflection_engine.check_completeness(response, question),
            reflection_engine.check_compliance(response),
            reflection_engine.check_no_poem_duplication(response, mode='interpret'),
        ]
        
        all_passed = all(check.passed for check in checks)
        
        if not all_passed:
            # 需要修正
            corrected = await reflection_engine.correct_response(
                response, checks, stick, question
            )
            return ReflectionResult(needs_correction=True, corrected_response=corrected)
        
        return ReflectionResult(needs_correction=False)
```

---

## 6. 数据库设计

### 6.1 数据表需求分析

#### 需要新建的数据表

| 表名 | 用途 | 必需性 | 阶段 |
|-----|------|--------|------|
| `agent_memory` | 记忆系统存储 | ✅ 必需 | 第二阶段 |
| `agent_checkpoints` | 检查点存储 | ⚪ 可选 | 第三阶段 |
| `agent_observability` | 观测性数据存储 | ⚪ 可选 | 第三阶段 |
| `agent_execution_history` | 执行历史记录 | ⚪ 可选 | 第三阶段 |
| `agent_tool_calls` | 工具调用历史 | ⚪ 可选 | 第三阶段 |

---

### 6.2 详细表结构设计

#### 6.2.1 `agent_memory` 表 - 记忆存储

```sql
CREATE TABLE agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    memory_layer VARCHAR(20) NOT NULL, -- 'working'|'short_term'|'long_term'
    memory_type VARCHAR(50) NOT NULL,  -- 'divination'|'conversation'|'user_profile'
    content JSONB NOT NULL,            -- 记忆内容
    summary TEXT,                      -- AI生成的摘要（可选）
    topic VARCHAR(100),                -- 话题标签（用于检索）
    relevance_score FLOAT,             -- 相关度分数
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,            -- 过期时间（短期记忆用）
    
    INDEX idx_memory_user_id (user_id),
    INDEX idx_memory_layer (memory_layer),
    INDEX idx_memory_topic (topic),
    INDEX idx_memory_created (created_at)
);
```

**说明**：
- `memory_layer`: 区分工作记忆、短期记忆、长期记忆
- `expires_at`: 短期记忆自动过期，长期记忆永不过期
- `topic`: 用于记忆检索的话题标签

---

#### 6.2.2 `agent_checkpoints` 表 - 检查点存储（可选）

```sql
CREATE TABLE agent_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkpoint_id VARCHAR(100) NOT NULL UNIQUE,
    agent_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL,
    agent_state JSONB NOT NULL,        -- Agent状态快照
    context_data JSONB,                -- Context数据
    memory_snapshot JSONB,             -- 记忆快照
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_checkpoint_agent (agent_id),
    INDEX idx_checkpoint_session (session_id),
    INDEX idx_checkpoint_created (created_at DESC)
);
```

**说明**：
- 用于中断恢复，避免重复计算
- 保存完整的Agent状态、Context、记忆快照

---

#### 6.2.3 `agent_observability` 表 - 观测性数据存储（可选）

```sql
CREATE TABLE agent_observability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL,         -- 'log'|'trace'|'metric'
    session_id VARCHAR(100),
    user_id UUID,
    operation VARCHAR(100),
    data JSONB NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_obs_type (type),
    INDEX idx_obs_session (session_id),
    INDEX idx_obs_timestamp (timestamp DESC)
);
```

**说明**：
- 统一存储日志、追踪、指标数据
- 用于调试、监控、性能分析

---

#### 6.2.4 `agent_execution_history` 表 - 执行历史记录（可选）

```sql
CREATE TABLE agent_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL,
    operation VARCHAR(50) NOT NULL,    -- 'interpret'|'followup'
    state_before VARCHAR(50),
    state_after VARCHAR(50),
    duration_ms FLOAT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    tool_calls JSONB,                 -- 调用的工具列表
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_exec_session (session_id),
    INDEX idx_exec_user (user_id),
    INDEX idx_exec_created (created_at DESC)
);
```

**说明**：
- 记录每次Agent执行的完整信息
- 用于审计、调试、性能优化

---

#### 6.2.5 `agent_tool_calls` 表 - 工具调用历史（可选）

```sql
CREATE TABLE agent_tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    tool_parameters JSONB,
    result JSONB,
    success BOOLEAN NOT NULL,
    duration_ms FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_tool_session (session_id),
    INDEX idx_tool_name (tool_name),
    INDEX idx_tool_created (created_at DESC)
);
```

**说明**：
- 记录每次工具调用的详细信息
- 用于工具性能分析、调试、优化

---

### 6.3 过渡方案：扩展现有表

**第一阶段（MVP）不新建表，先扩展现有表作为过渡**：

```sql
-- 扩展 divination_records 表，增加记忆相关字段
ALTER TABLE divination_records 
ADD COLUMN IF NOT EXISTS memory_tags VARCHAR(100)[],  -- 话题标签数组
ADD COLUMN IF NOT EXISTS memory_summary TEXT;         -- AI生成的摘要

-- 为新增字段创建索引（可选，提升检索性能）
CREATE INDEX IF NOT EXISTS idx_divination_memory_tags
ON divination_records USING GIN(memory_tags);
```

#### 6.3.1 新增字段详细说明

##### 6.3.1.1 `memory_tags VARCHAR(100)[]` - 话题标签数组

**存放内容**：话题标签数组，用于记忆检索

**例子**：
```sql
-- 用户问"我今年能找到理想的工作吗？"
memory_tags = ['工作', '求职', '事业', '2026年']

-- 用户问"我和女朋友能结婚吗？"
memory_tags = ['姻缘', '感情', '结婚', '爱情']

-- 用户问"我这次考试能过吗？"
memory_tags = ['考试', '学业', '学习', '升学']
```

**用途**：
- 当用户问"还记得我上次问工作的事吗？"，可以通过标签快速找到相关记录
- 记忆检索时，用标签匹配相关记忆
- 可以统计用户常问的话题类型

**设置时机**：抽签完成后
**设置者**：后端代码（关键词提取）或AI

---

##### 6.3.1.2 `memory_summary TEXT` - AI生成的摘要

**存放内容**：AI自动生成的简短摘要，不存完整对话（省token）

**例子**：
```sql
-- 完整对话可能很长
用户：我今年能找到工作吗？
AI：根据这支签，你今年运势很好...
用户：那应该去哪个方向？
AI：建议东南方向...

-- memory_summary 只存摘要（由AI生成）
memory_summary = '用户询问2026年工作运势，抽到第1签上上签，建议往东南方向发展。'
```

**用途**：
- 节省存储空间：不存完整对话，只存摘要
- 快速浏览：查看历史记录时，一眼就知道那次问了什么
- 记忆检索：摘要用于语义匹配，找相关记忆

**设置时机**：对话结束后
**设置者**：AI自动生成

---

#### 6.3.2 实际数据示例

```sql
INSERT INTO divination_records (
  user_id,
  type,
  question,
  result,
  conversation,
  memory_tags,      -- 新增字段
  memory_summary    -- 新增字段
) VALUES (
  'user-uuid-123',
  'guanyin',
  '我今年能找到理想的工作吗？',
  '{"id": 1, "level": "上上签", ...}',
  '[{"role": "user", "content": "我今年..."}, {"role": "assistant", "content": "..."}]',
  ARRAY['工作', '求职', '事业', '2026年'],  -- memory_tags
  '用户询问2026年工作运势，抽到第1签上上签，建议往东南方向发展。'  -- memory_summary
);
```

---

**是否需要在Supabase执行？**：
- 第一阶段：建议执行，作为过渡方案
- 第二阶段：根据需要决定是否建新表

---

### 6.4 分阶段建表策略

| 阶段 | 建表操作 | 说明 |
|-----|---------|------|
| **第一阶段（MVP）** | 扩展 `divination_records` 表 | 不新建表，先用现有表 |
| **第二阶段（完善）** | 新建 `agent_memory` 表 | 实现完整记忆系统需要 |
| **第三阶段（优化）** | 可选新建其他表 | 根据实际需要选择 |

---

## 7. 实施路径规划

### 7.1 阶段划分

#### 7.1.1 第一阶段：MVP（2周）
**目标**：建立Harness基础框架，实现工作记忆

**主要任务**：
- [ ] 后端：建立Harness层目录结构
- [ ] 后端：实现状态机管理（基础版本）
- [ ] 后端：实现Context管理器（分层、动态调整）
- [ ] 后端：实现观测性层（日志+追踪）
- [ ] 后端：实现错误处理器（分类+重试）
- [ ] 前端：分离Agent逻辑到独立层
- [ ] 前端：实现React桥接Hook
- [ ] 测试：端到端测试，确保功能正常

**验收标准**：
- 现有功能100%可用（向后兼容）
- Context分层正确工作
- 日志和追踪正常工作

---

#### 7.1.2 第二阶段：完善（3周）
**目标**：实现记忆系统和工具调用框架

**主要任务**：
- [ ] 后端：实现完整记忆系统（工作+短期+知识库）
- [ ] 后端：实现记忆检索（混合策略）
- [ ] 后端：建立Tool抽象和注册机制
- [ ] 后端：实现签文知识库工具
- [ ] 后端：实现记忆检索工具
- [ ] 后端：实现工具协调器
- [ ] 后端：实现检查点机制
- [ ] 前端：接入新的记忆相关功能
- [ ] 测试：记忆检索准确率测试

**验收标准**：
- 记忆系统正常工作
- 工具调用框架可扩展
- 检查点可正常保存和加载

---

#### 7.1.3 第三阶段：优化（2周）
**目标**：实现规划、反思，完善Harness

**主要任务**：
- [ ] 后端：实现多步规划引擎
- [ ] 后端：实现反思与自我检查
- [ ] 后端：实现长期记忆
- [ ] 后端：实现记忆摘要（AI生成）
- [ ] 后端：完善错误降级策略
- [ ] 后端：实现指标收集
- [ ] 前端：展示Agent状态（可选）
- [ ] 性能优化：Token优化、响应速度优化
- [ ] 文档：完整的技术文档和API文档

**验收标准**：
- 规划和反思功能正常工作
- 性能指标达标（响应时间<3秒）
- 完整的文档和测试

---

### 7.2 里程碑规划

| 里程碑 | 时间 | 交付物 |
|-------|------|-------|
| M1：Harness基础框架完成 | Week 2 | 可工作的Harness层，现有功能兼容 |
| M2：记忆系统完成 | Week 5 | 完整记忆系统，工具调用框架 |
| M3：全部功能完成 | Week 7 | 完整Agent，规划+反思能力 |
| M4：上线 | Week 8 | 生产环境部署 |

---

## 8. 风险与应对

| 风险 | 影响 | 概率 | 应对措施 |
|-----|------|------|---------|
| 重构范围失控 | 高 | 中 | 严格分阶段，每个阶段有明确验收标准 |
| 向后兼容问题 | 高 | 低 | API版本化，保留旧API作为兼容层 |
| 性能下降 | 中 | 中 | 每个阶段都做性能基准测试，及时优化 |
| 记忆检索不准确 | 中 | 中 | 先实现简单关键词匹配，后续迭代优化语义检索 |
| 团队学习曲线 | 中 | 中 | 分阶段培训，代码审查，结对编程 |

---

## 9. 成功指标

### 9.1 技术指标

| 指标 | 目标值 | 测量方式 |
|-----|-------|---------|
| API响应时间（初次解读） | < 5秒 | 监控数据 |
| API响应时间（追问） | < 3秒 | 监控数据 |
| 记忆检索准确率 | > 80% | 人工评估 |
| 反思修正率 | < 5% | 日志分析 |
| 错误重试成功率 | > 90% | 监控数据 |
| 系统可用性 | > 99.5% | 监控数据 |

### 9.2 产品指标

| 指标 | 目标值 | 测量方式 |
|-----|-------|---------|
| 用户对话轮次 | +20% | 数据分析 |
| 用户满意度 | > 4.5/5.0 | 用户反馈 |
| 功能使用率（记忆相关） | > 30% | 数据分析 |

---

## 附录

### A. 参考文档

- `docs/discussion/ai_agent_architecture_discussion_20260422.md` - 完整讨论记录
- `docs/prd/guanyin_prd_v1.5_complete.md` - 观音灵签PRD

### B. 术语表

| 术语 | 说明 |
|-----|------|
| Harness | Agent执行框架，管理Agent生命周期 |
| Context Engineering | 上下文工程，有策略地组织和管理LLM上下文 |
| 工作记忆 | 当前会话的记忆，关闭页面清空 |
| 短期记忆 | 最近7天的记忆 |
| 长期记忆 | 所有历史记忆 |
| 反思引擎 | Agent自我检查和修正的模块 |
| 规划引擎 | Agent制定执行计划的模块 |

---

**方案结束**

**版本历史**：
- v1.0 (2026-04-22) - 初始版本

