
# 观音灵签Agent产品需求文档 (PRD)

## 1. 产品概述

### 1.1 产品定位
观音灵签Agent是一款基于AI的传统周易命理解读应用，提供真实的抽签体验（手势/鼠标两种模式）和专业的签文解读服务。产品采用先进的Agent架构设计，结合记忆系统、反思引擎、ReAct循环等前沿技术，提供个性化、有温度的解签服务。

### 1.2 目标用户
- 对传统命理文化感兴趣的普通用户
- 有具体问题（工作/感情/学业/财运/健康）需要指引的用户
- 喜欢交互式体验的年轻用户

### 1.3 核心价值
- **真实体验**：提供手势抽签、鼠标长按抽签两种拟真方式
- **专业解读**：基于100签固定知识库，不篡改、不编造
- **个性化**：记忆用户历史，结合上下文进行多轮对话
- **有温度**：温和通透的语气，适度安抚与鼓励

---

## 2. 功能模块

### 2.1 抽签功能
- **两种模式**：
  - 手势模式：通过MediaPipe识别用户手势动作
  - 鼠标模式：长按鼠标模拟抽签动作
- **签文知识库**：内置固定100签，包含签号、签名、吉凶、签诗、典故、释义
- **动画效果**：2秒模拟抽签动画，提升仪式感

### 2.2 AI初次解读
- **签文引用**：完整引用签号+签名+吉凶+签诗原文
- **个性化解读**：完全贴合用户具体问题，避免通用模板
- **结构清晰**：点明核心运势→结合典故→解析当前处境→给出建议
- **字数控制**：100-400字，灵活不刻板
- **格式要求**：重要内容自然加粗
- **零容忍铁律**：全程使用中文，禁止出现任何英文

### 2.3 多轮对话追问
- **上下文记忆**：保持对话历史，理解用户追问意图
- **禁止重复**：追问模式绝对不重复引用签诗原文
- **连续追问**：支持多轮深入对话
- **ReAct推理**：必要时调用工具检索记忆或签文知识

### 2.4 历史记录展示
- **记录保存**：每次测算自动保存到数据库
- **记忆关联**：记录与用户记忆系统关联，支持历史回溯
- **展示信息**：问题、签文、对话历史、时间

### 2.5 前端交互优化
- **打字机效果**：AI回复逐字显示，提升体验
- **快捷问题**：提供预设快捷问题，降低使用门槛
- **Loading状态**：初次解读和追问都有恰当的loading提示
- **高亮输入框**：未输入问题时提示用户

---

## 3. Agent设计与实现

### 3.1 Agent整体架构

#### 分层架构设计
```
┌─────────────────────────────────────────────────────────┐
│                    API 层 (FastAPI)                      │
│  /draw /interpret /followup /save-record /update-record │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                 Harness 层 (核心协调)                    │
│  GuanyinAgentHarness - 整合所有组件                       │
└─────────┬───────────────┬───────────────┬───────────────┘
          │               │               │
┌─────────▼───────┐ ┌───▼───────┐ ┌─────▼──────────┐
│  状态机         │ │ Context   │ │   记忆系统      │
│  StateMachine  │ │  Manager  │ │ AgentMemory    │
└─────────────────┘ └───────────┘ └────────────────┘
┌─────────┬───────────────┬───────────────┐
│  工具编排│   规划引擎    │   反思引擎    │
│Orchestr │ PlanningEng  │ ReflectionEng │
└─────────┘ └─────────────┘ └─────────────┘
┌─────────┬───────────────┬───────────────┐
│ 安全护栏│  可观测性     │   错误处理    │
│Guardrail│Observability │ ErrorHandler  │
└─────────┘ └─────────────┘ └─────────────┘
          │               │
┌─────────▼───────────────▼───────────────┐
│         LLM 层 (Kimi API)               │
│                                         │
└─────────────────────────────────────────┘
```

#### 组件职责
| 组件 | 职责 |
|------|------|
| **API层** | 提供REST接口，保持向后兼容 |
| **Harness层** | 核心协调器，整合所有组件，执行流程 |
| **状态机** | 管理Agent生命周期状态转换 |
| **Context管理器** | 分层组织Prompt，动态调整内容 |
| **记忆系统** | 工作记忆/短期记忆/长期记忆管理 |
| **工具编排器** | 注册和调用工具（签文知识/记忆检索） |
| **规划引擎** | 制定执行计划（初次解读/追问） |
| **反思引擎** | 自我检查，AI自动修正 |
| **安全护栏** | 输出内容验证和修正 |
| **可观测性** | 日志/追踪/指标三位一体 |
| **错误处理** | 重试/降级策略 |

#### 前端架构
```
useGuanyinAgent (React Hook)
    ↓
GuanyinAgent (单例，状态管理)
    ↓
guanyinApi (API调用)
```

### 3.2 完整请求协作示例

#### 初次解读完整流程（快速路径）

```
用户输入问题 → 抽签 → 调用 /interpret
                      ↓
┌─────────────────────────────────────────────────────┐
│ 1. Harness初始化会话                                 │
│    - 设置session_id                                  │
│    - 设置user_id                                     │
│    - 存储签文到工作记忆                               │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. ContextManager构建Prompt                          │
│    - 系统层：基础指令+铁律                           │
│    - 知识层：完整签文（签诗+典故+释义）               │
│    - 任务层：初次解读指令                            │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. 调用Kimi API生成解读                             │
│    - 单次LLM调用，不走ReAct循环                     │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. Guardrails验证输出                               │
│    ✓ 中文检查 (&gt;50%)                                │
│    ✓ 长度检查 (100-400字)                           │
│    ✓ 违规内容过滤                                    │
│    ✓ 必要时AI自动修正                                │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 5. 后台保存记忆（非阻塞）                            │
│    - 保存到agent_memory表（7天过期）                 │
│    - 提取话题标签                                    │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 6. 返回解读结果                                     │
│    - interpretation: 最终解读                        │
│    - used_new_engine: true                          │
│    - used_react: false                              │
└─────────────────────────────────────────────────────┘
                      ↓
前端打字机效果显示
```

#### 追问完整流程（完整ReAct循环，最多3步）

```
用户发送追问 → 调用 /followup
                    ↓
┌───────────────────────────────────────────────────────┐
│ 1. 检查是否需要记忆检索                               │
│    - 关键词检测：上次/之前/同样/类似/记得              │
│    - 如果需要，从数据库加载最近30天记忆               │
└─────────────────────┬─────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│ 2. 规划引擎生成计划                                   │
│    - 计划ID                                           │
│    - 执行步骤                                         │
└─────────────────────┬─────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│ 3. ReAct循环开始（最多3步）                          │
│                                                      │
│   ┌───────────────────────────────────────────┐     │
│   │ 观察 (Observe)                            │     │
│   │ - 当前签文标识（不给完整签诗）            │     │
│   │ - 对话历史（最近5条，滑动窗口）            │     │
│   │ - 相关记忆（如果有）                      │     │
│   └─────────────────┬─────────────────────────┘     │
│                     ↓                               │
│   ┌───────────────────────────────────────────┐     │
│   │ 思考 (Think)                              │     │
│   │ - LLM决定：调用工具 OR 直接回答           │     │
│   │ - 输出格式：Thought + Action + Params    │     │
│   │           或 Thought + Final Answer      │     │
│   └─────────────────┬─────────────────────────┘     │
│                     ↓                               │
│   ┌───────────────────────────────────────────┐     │
│   │ 行动 (Act)                                │     │
│   │ ├─ 最终答案 → 退出循环                    │     │
│   │ └─ 工具调用 → 执行工具 → 记录结果         │     │
│   │   ┌─ stick_knowledge: 查询签文           │     │
│   │   └─ memory_retrieval: 检索记忆          │     │
│   └─────────────────┬─────────────────────────┘     │
│                     ↓                               │
│   ┌───────────────────────────────────────────┐     │
│   │ 记录到Scratchpad                          │     │
│   │ - 思考过程                                │     │
│   │ - 工具结果                                │
│   │ - 进入下一步循环                          │     │
│   └───────────────────────────────────────────┘     │
│                                                      │
│   循环直到：得到最终答案 OR 达到最大步数(3)          │
└─────────────────────┬─────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│ 4. 反思引擎检查                                       │
│    - 准确性检查                                       │
│    - 完整性检查                                       │
│    - 合规性检查                                       │
│    - 安全性检查                                       │
│    - 幻觉检测（对比签文原文）                         │
│    - 需要时AI自动修正                                 │
└─────────────────────┬─────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│ 5. Guardrails最终验证                                │
│    ✓ 中文检查                                          │
│    ✓ 长度检查                                          │
│    ✓ 追问模式：确认无签诗引用                         │
└─────────────────────┬─────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│ 6. 更新工作记忆                                       │
│    - 添加对话历史                                     │
└─────────────────────┬─────────────────────────────────┘
                      ↓
┌───────────────────────────────────────────────────────┐
│ 7. 返回结果                                          │
│    - reply: 最终回复                                  │
│    - used_new_engine: true                           │
│    - used_react: true                                │
└───────────────────────────────────────────────────────┘
```

### 3.3 Harness层设计与应用

#### GuanyinAgentHarness职责
Harness是整个Agent系统的"指挥中心"，负责：
- 初始化和协调所有组件
- 执行初次解读和追问流程
- 管理会话状态（session_id, user_id, current_stick）
- 提供兼容旧接口的方法

#### 单例模式实现
```python
# 全局单例
_harness_instance: Optional[GuanyinAgentHarness] = None

def get_harness(use_new_implementation: bool = True) -&gt; GuanyinAgentHarness:
    global _harness_instance
    if _harness_instance is None:
        _harness_instance = GuanyinAgentHarness(
            use_new_implementation=use_new_implementation
        )
    return _harness_instance
```

#### 快速路径与完整路径策略
| 场景 | 路径 | ReAct | 说明 |
|------|------|-------|------|
| 初次解读 | 快速路径 | ❌ | 1次LLM调用，不查记忆，后台保存 |
| 追问 | 完整路径 | ✅ | 最多3步ReAct，按需检索记忆 |

#### 组件初始化顺序
```python
def __init__(self, use_new_implementation: bool = True):
    self.state_machine = AgentStateMachine()        # 1. 状态机
    self.context_manager = ContextManager()          # 2. Context管理
    self.observability = get_observability()         # 3. 可观测性
    self.error_handler = ErrorHandler(RetryConfig()) # 4. 错误处理
    self.tool_orchestrator = ToolOrchestrator()      # 5. 工具编排
    self.memory = GuanyinAgentMemory()               # 6. 记忆系统
    self.planning_engine = PlanningEngine()          # 7. 规划引擎
    self.reflection_engine = ReflectionEngine()      # 8. 反思引擎
    self.guardrails = OutputGuardrails(...)          # 9. 安全护栏

    # 关键：给记忆检索工具设置记忆实例
    MemoryRetrievalTool.set_memory_instance(self.memory)
```

#### 兼容旧接口方法
为了保持向后兼容，Harness提供了与旧AI Agent相同签名的方法：
```python
async def interpret_stick(self, question: str, stick: GuanyinStick,
                          user_id: Optional[str] = None) -&gt; str:
    """兼容旧接口：只返回解读字符串"""
    result = await self.interpret_with_planning(question, stick, user_id)
    return result["interpretation"]

async def followup_question(self, question: str, stick: GuanyinStick,
                            history: List[Message]) -&gt; str:
    """兼容旧接口：只返回回复字符串"""
    result = await self.followup_with_planning(
        question, stick, history, self._current_user_id
    )
    return result["reply"]
```

### 3.4 状态机管理

#### AgentState状态枚举
```python
class AgentState(Enum):
    IDLE = auto()              # 空闲状态
    INPUT_COLLECTING = auto()  # 收集用户输入
    DRAWING = auto()           # 抽签中
    INTERPRETING = auto()      # 初次解读中
    FOLLOWUP = auto()          # 追问处理中
    REFLECTING = auto()        # 反思中
    COMPLETED = auto()         # 完成
    ERROR = auto()             # 错误状态
```

#### AgentEvent事件枚举
```python
class AgentEvent(Enum):
    START_INPUT = auto()      # 开始收集输入
    START_DRAW = auto()       # 开始抽签
    START_INTERPRET = auto()  # 开始解读
    START_FOLLOWUP = auto()   # 开始追问
    START_REFLECT = auto()    # 开始反思
    COMPLETE = auto()         # 完成
    ERROR_OCCUR = auto()      # 发生错误
    RESET = auto()            # 重置
```

#### 状态转换规则
```
IDLE → INPUT_COLLECTING → DRAWING → INTERPRETING → REFLECTING → COMPLETED
       ↓                    ↓           ↓             ↓
       ERROR ←--------------┴-----------┴-------------┘

COMPLETED → FOLLOWUP → REFLECTING → COMPLETED (循环追问)

任何状态 →(RESET)→ IDLE
```

#### 状态转换记录
状态机记录每次转换的详情：
- from_state: 源状态
- to_state: 目标状态
- event: 触发事件
- timestamp: 时间戳
- metadata: 附加元数据

历史记录保留最近100条。

### 3.5 Context上下文管理

#### 分层组织设计
Context采用5层架构，每层有明确的职责和token预算：

| 层级 | 内容 | Token预算 | 说明 |
|------|------|-----------|------|
| **系统层** | 角色设定、铁律、格式要求 | 500 | 固定不变 |
| **知识层** | 签文信息 | 300 | 初次解读给完整签诗，追问只给标识 |
| **记忆层** | 相关历史记忆 | 200 | 可选，按需添加 |
| **对话层** | 最近对话历史 | 400 | 滑动窗口，保留最近5条 |
| **任务层** | 当前任务、用户问题 | 100 | 动态变化 |

#### XML标签清晰分隔
所有Context用XML标签包裹，帮助LLM理解结构：
```xml
&lt;系统提示&gt;
你是一位深耕周易命理...
&lt;/系统提示&gt;

&lt;context&gt;
【当前签文】
第1签 - 上上签
【标题】姜太公遇文王
【签诗】时来时去自如通...
【典故】姜太公钓鱼...
【释义】时来运转...
&lt;/context&gt;

&lt;memory&gt;
【相关记忆】
1. 关于「工作」的第23签...
&lt;/memory&gt;

&lt;conversation&gt;
【最近对话】
用户：我想换工作...
AI：这支签表明...
&lt;/conversation&gt;

&lt;task&gt;
【当前任务】初次解读
【用户问题】我最近想换工作...
&lt;/task&gt;
```

#### 动态调整策略

**初次解读模式：**
- 知识层：完整签文（签诗+典故+释义）
- 对话层：无
- 任务层：明确要求引用签诗

**追问模式：**
- 知识层：只给签文标识（第X签 - 吉凶《标题》）
- 对话层：最近5条对话
- 任务层：强调"绝对不重复引用签诗原文"
- 系统层：追加追问模式特别提示

#### 滑动窗口实现
对话历史采用滑动窗口，只保留最近5条：
```python
recent_history = history[-self.conversation_window_size:] \
    if len(history) &gt; self.conversation_window_size \
    else history
```

### 3.6 记忆系统设计与应用

#### 三层记忆架构

```
┌─────────────────────────────────────────────────────┐
│  工作记忆 (Working Memory) - 当前会话                │
│  - current_stick: 当前签文                          │
│  - user_question: 用户问题                          │
│  - conversation: 对话历史 (最多10条)                │
│  - divination_record_id: 测算记录ID                │
│  - topic_tags: 话题标签                             │
│  会话结束后清空                                      │
└─────────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────────┐
│  短期记忆 (Short-term Memory) - 最近7天             │
│  - 保存到数据库: agent_memory表                     │
│  - 过期时间: 7天                                    │
│  - 用于: 近期记忆检索                               │
└─────────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────────┐
│  长期记忆 (Long-term Memory) - 所有历史             │
│  - 保留所有记录摘要                                │
│  - 永不过期                                         │
│  - 用于: 长期回溯                                   │
└─────────────────────────────────────────────────────┘
```

#### 记忆数据结构
```python
@dataclass
class MemoryItem:
    id: str                    # 记忆ID
    user_id: Optional[str]     # 用户ID
    layer: MemoryLayer         # 层级 (WORKING/SHORT_TERM/LONG_TERM)
    memory_type: str           # 类型 (divination/conversation)
    content: Dict[str, Any]    # 内容 (question+stick)
    summary: Optional[str]     # 摘要
    topic_tags: List[str]      # 话题标签
    relevance_score: float     # 相关度分数 (检索时计算)
    stick_id: Optional[int]    # 签文ID
    created_at: datetime       # 创建时间
    expires_at: Optional[datetime]  # 过期时间
```

#### 话题标签提取
自动从用户问题中提取话题标签：

| 话题 | 触发关键词 |
|------|------------|
| 工作 | 工作、事业、职业、升职、加薪、跳槽、创业 |
| 感情 | 感情、恋爱、婚姻、结婚、分手、复合、桃花 |
| 学业 | 学业、学习、考试、升学、考研、留学 |
| 财运 | 财运、钱财、投资、理财、赚钱、破财 |
| 健康 | 健康、身体、疾病、医疗、平安 |

代码实现：
```python
def extract_topic_tags(self, question: str) -&gt; List[str]:
    tags = []
    keywords = {
        "工作": ["工作", "事业", "职业", "升职", "加薪", "跳槽", "创业"],
        "感情": ["感情", "恋爱", "婚姻", "结婚", "分手", "复合", "桃花"],
        "学业": ["学业", "学习", "考试", "升学", "考研", "留学"],
        "财运": ["财运", "钱财", "投资", "理财", "赚钱", "破财"],
        "健康": ["健康", "身体", "疾病", "医疗", "平安"],
    }
    for category, words in keywords.items():
        for word in words:
            if word in question:
                tags.append(category)
                break
    return list(set(tags))
```

#### 混合检索策略

记忆检索采用三层打分机制：

1. **标签匹配得分** (权重最高)
   ```
   匹配标签数 × 2.0
   ```

2. **时间衰减加权**
   ```
   基础分 × max(0.1, 1.0 - (days_old × 0.05))
   ```
   - 越新的记忆权重越高
   - 最低保留0.1权重，不会完全过期

3. **关键词简单匹配**
   - 查询词出现在摘要或问题中，+0.5分

最终得分 = (标签匹配分 + 关键词分) × 时间衰减系数

**检索示例：**
```
用户问题："我上次问的那个工作的事情，后来怎么样了？"

提取标签：["工作"]

记忆库：
- M1: 3天前，工作话题，标签匹配 → 得分: 2.0 × 0.85 = 1.7
- M2: 10天前，工作话题，标签匹配 → 得分: 2.0 × 0.5 = 1.0
- M3: 2天前，感情话题，不匹配 → 得分: 0 × 0.9 = 0

返回：M1, M2 (Top 3)
```

#### 记忆数据库持久化

**表结构：**
- user_id: 用户ID
- memory_layer: "short_term" 或 "long_term"
- memory_type: "divination"
- content: JSON (question + stick)
- summary: 摘要文本
- topic_tags: TEXT[] (话题标签数组)
- stick_id: 签文ID
- created_at: TIMESTAMP
- expires_at: TIMESTAMP (短期记忆7天后过期)

**保存时机：**
- 初次解读完成后，后台非阻塞保存
- 追问结束后，更新工作记忆

#### 记忆检索工具实现
MemoryRetrievalTool是一个可被ReAct循环调用的工具：

**参数Schema：**
```json
{
    "query": {
        "type": "string",
        "description": "查询关键词或问题",
        "required": true
    },
    "limit": {
        "type": "integer",
        "description": "返回结果数量上限，默认3",
        "required": false,
        "default": 3
    }
}
```

**关键设计：**
```python
class MemoryRetrievalTool(BaseTool):
    # 注意：这个工具需要外部传入memory实例
    _memory_instance: Optional[GuanyinAgentMemory] = None

    @classmethod
    def set_memory_instance(cls, memory: GuanyinAgentMemory):
        """设置记忆系统实例（Harness初始化时调用）"""
        cls._memory_instance = memory
```

这样设计避免了循环依赖，Harness可以在初始化时把自己的memory实例注入给工具。

### 3.7 工具系统设计

#### BaseTool基础抽象
所有工具继承自BaseTool，提供统一接口：

```python
class BaseTool:
    name: str                    # 工具名称
    description: str             # 工具描述
    param_schema: Dict[str, Any] # 参数JSON Schema

    async def execute(self, params: Dict[str, Any]) -&gt; ToolResult:
        """执行工具，返回结果"""
        raise NotImplementedError()
```

#### ToolResult统一返回格式
```python
@dataclass
class ToolResult:
    success: bool              # 是否成功
    content: str               # 给LLM看的内容文本
    data: Optional[Dict] = None # 结构化数据
    error: Optional[str] = None # 错误信息
```

#### ToolRegistry注册机制
装饰器模式自动注册工具：

```python
@ToolRegistry.register
class StickKnowledgeTool(BaseTool):
    name = "stick_knowledge"
    ...

@ToolRegistry.register
class MemoryRetrievalTool(BaseTool):
    name = "memory_retrieval"
    ...
```

#### 已实现工具列表

| 工具名称 | 描述 | 参数 |
|---------|------|------|
| **stick_knowledge** | 查询签文详细信息 | stick_id (必选), info_type (可选: full/poem/story/meaning) |
| **memory_retrieval** | 检索用户历史记忆 | query (必选), limit (可选) |

#### StickKnowledgeTool签文知识库工具
从内置100签知识库查询信息：

```python
async def execute(self, params: Dict[str, Any]) -&gt; ToolResult:
    stick_id = int(params.get("stick_id"))
    info_type = params.get("info_type", "full")

    stick = get_stick_by_id(stick_id)

    if info_type == "poem":
        content = f"第{stick.id}签 - {stick.level}\n【签诗】{stick.poem}"
    elif info_type == "story":
        content = f"第{stick.id}签 - {stick.level}\n【典故】{stick.story}"
    elif info_type == "meaning":
        content = f"第{stick.id}签 - {stick.level}\n【释义】{stick.meaning}"
    else:
        content = f"第{stick.id}签 - {stick.level}\n【标题】{stick.title}\n【签诗】{stick.poem}\n【典故】{stick.story}\n【释义】{stick.meaning}"

    return ToolResult(success=True, content=content, data={"stick": stick.model_dump()})
```

#### ToolOrchestrator编排器
负责工具的查找和执行：

```python
class ToolOrchestrator:
    def get_tool(self, name: str) -&gt; Optional[BaseTool]:
        """根据名称获取工具"""

    async def call_tool(self, name: str, params: Dict[str, Any],
                       trace_id: Optional[str] = None,
                       user_id: Optional[str] = None) -&gt; ToolResult:
        """调用工具，记录日志"""
```

### 3.8 规划引擎

#### 初次解读规划
```python
def create_interpretation_plan(self, question: str,
                               stick_id: int) -&gt; Plan:
    return Plan(
        plan_id=str(uuid.uuid4()),
        steps=[
            PlanStep(
                step_id="step_1",
                action="build_context",
                description="构建初次解读Context"
            ),
            PlanStep(
                step_id="step_2",
                action="call_llm",
                description="调用LLM生成解读"
            ),
            PlanStep(
                step_id="step_3",
                action="validate_output",
                description="验证输出质量"
            )
        ]
    )
```

#### 追问规划
```python
def create_followup_plan(self, question: str, stick_id: int,
                         history_length: int, user_id: Optional[str]) -&gt; Plan:
    needs_memory = self._needs_memory_retrieval(question)

    steps = []
    if needs_memory:
        steps.append(PlanStep(
            step_id="step_memory",
            action="retrieve_memory",
            description="检索相关历史记忆"
        ))

    steps.extend([
        PlanStep(
            step_id="step_react",
            action="react_loop",
            description="执行ReAct循环（最多3步）"
        ),
        PlanStep(
            step_id="step_reflect",
            action="reflect",
            description="反思检查"
        )
    ])

    return Plan(plan_id=str(uuid.uuid4()), steps=steps)
```

#### 记忆检索判断
检测问题中的关键词决定是否需要检索记忆：
```python
def _needs_memory_retrieval(self, question: str) -&gt; bool:
    keywords = ["上次", "之前", "同样", "类似", "记得", "刚才", "之前问的"]
    return any(keyword in question for keyword in keywords)
```

### 3.9 ReAct循环设计与应用

#### ReAct框架原理
ReAct = **Re**asoning (推理) + **Act**ing (行动)

LLM不是直接给出答案，而是：
1. 先思考需要做什么
2. 决定是调用工具还是直接回答
3. 如果调用工具，观察工具结果
4. 继续思考，直到有足够信息

#### 循环流程

```
┌─────────────────────────────────────────────────────────┐
│  循环开始 (最多3步)                                     │
└─────────────────────┬───────────────────────────────────┘
                      ↓
        ┌─────────────────────────────┐
        │   观察 (Observe)            │
        │   - 当前签文标识            │
        │   - 对话历史                │
        │   - 相关记忆 (如有)        │
        │   - Scratchpad草稿         │
        └─────────────┬───────────────┘
                      ↓
        ┌─────────────────────────────┐
        │   思考 (Think)              │
        │   LLM输出格式:              │
        │   Thought: ...              │
        │   Action: tool_name OR Final Answer│
        │   Params: {...} (如果是工具)│
        └─────────────┬───────────────┘
                      ↓
         ┌────────────┴────────────┐
         ↓                         ↓
   ┌───────────┐           ┌───────────────┐
   │ 工具调用  │           │  最终答案     │
   └─────┬─────┘           └───────┬───────┘
         ↓                         ↓
   ┌───────────┐           ┌───────────────┐
   │ 记录结果  │           │  退出循环     │
   │ 到草稿    │           └───────────────┘
   └─────┬─────┘
         ↓
   ┌───────────┐
   │ 下一步循环│
   └───────────┘
```

#### ReAct Prompt设计

给LLM的系统提示明确要求输出格式：

```
你是一位专业的观音灵签解签大师，同时也是一个会思考、会行动的智能Agent。

【你的工作流程 - ReAct 框架】
你需要按照以下步骤工作：
1. 思考 (Thought)：分析用户问题，决定下一步做什么
2. 行动 (Action)：选择调用工具或直接给出答案
3. 观察 (Observation)：查看工具调用结果
4. 循环：继续思考，直到你有足够信息给出最终答案

【可用工具】
- stick_knowledge: 查询签文详细信息
  参数: stick_id (签文ID), info_type (可选: full/poem/story/meaning)
- memory_retrieval: 检索用户历史记忆
  参数: query (查询内容), limit (可选, 默认3)

【你的回应格式】
你必须严格使用以下格式之一回应：

1. 如果要调用工具：
```
Thought: 你思考的内容...
Action: tool_name
Params: {"param1": "value1", "param2": "value2"}
```

2. 如果要给出最终答案：
```
Thought: 你思考的内容...
Final Answer: 你的最终答案...
```

【重要提示】
- 不是每次都需要调用工具，如果你已经有足够信息，可以直接给出答案
- 初次解读一般需要调用 stick_knowledge 查看完整签文信息
- 追问时不要重复引用签诗原文
```

#### Scratchpad草稿记录
Scratchpad记录循环过程中的所有思考和工具结果：

```
Step 1: [Thought]
用户问的是感情问题，我需要先看看这支签的典故...
Step 1: [Action] Called stick_knowledge
Step 1: [Observation]
第23签 - 中签
【典故】韩文公遇雪...

Step 2: [Thought]
好的，现在我理解签文含义了，可以直接回答...
Step 2: [Final Answer]
这支签表明你现在的感情...
```

#### LLM回应解析
解析器从LLM输出中提取action和content：

```python
def _parse_react_response(self, response: str) -&gt; tuple:
    response = response.strip()

    # 检查是否是最终答案
    if "Final Answer:" in response:
        parts = response.split("Final Answer:", 1)
        return ("final_answer", parts[1].strip())

    # 检查是否是工具调用
    if "Action:" in response and "Params:" in response:
        action_part = response.split("Action:", 1)[1].split("Params:", 1)[0].strip()
        params_part = response.split("Params:", 1)[1].strip()

        # 解析JSON参数
        start_idx = params_part.find("{")
        end_idx = params_part.rfind("}") + 1
        params = json.loads(params_part[start_idx:end_idx])

        return ("tool_call", {"tool": action_part, "params": params})

    # 格式不匹配，把整个回应当作最终答案
    return ("final_answer", response)
```

#### 最大步数限制
为避免无限循环，设置最多3步：
```python
max_steps = 3

while current_step &lt; max_steps and final_answer is None:
    # ... 执行循环 ...
    current_step += 1

# 达到最大步数仍无答案，兜底调用LLM
if final_answer is None:
    fallback_messages = self.context_manager.build_interpret_context(...)
    final_answer = await self.existing_agent._call_kimi_api(fallback_messages)
```

### 3.10 反思引擎与自我检查

#### 四项检查

| 检查类型 | 检查内容 |
|---------|---------|
| **准确性** | 回复不为空、长度合适、追问时不重复签诗 |
| **完整性** | 回复包含问题相关关键词 |
| **合规性** | 无违规内容（违法/暴力/迷信等） |
| **安全性** | 避免过于绝对的表述（绝对/一定/必然） |

#### 幻觉检测

幻觉检测器对比LLM输出和签文原文，检测编造内容：

```python
async def check_all(self, llm_output: str, question: str,
                   stick_info: Dict) -&gt; List[HallucinationCheckResult]:
    results = []

    # 检查是否编造签诗
    poem_hallucination = await self._check_poem_hallucination(
        llm_output, stick_info
    )
    if poem_hallucination:
        results.append(poem_hallucination)

    # 检查是否编造典故
    story_hallucination = await self._check_story_hallucination(
        llm_output, stick_info
    )
    if story_hallucination:
        results.append(story_hallucination)

    # 检查是否反转吉凶
    level_hallucination = await self._check_level_hallucination(
        llm_output, stick_info
    )
    if level_hallucination:
        results.append(level_hallucination)

    return results
```

#### AI自动修正

如果检查发现问题，反思引擎会调用LLM自动修正：

```python
# 构建修正提示
correction_prompt = f"""请重新整理以下解签内容，解决这些问题：

问题：{check_summary}

要求：
- 使用中文
- 长度在 100-400 字
- 追问时绝对不要引用签诗原文
- 保持原意不变
- 保持自然流畅的语气

原内容：
{original_output}

请直接输出修正后的内容，不要说其他话："""

# 调用LLM修正
corrected = await self._call_llm_for_reflection([
    {"role": "system", "content": "你是一个专业的解签内容编辑"},
    {"role": "user", "content": correction_prompt}
])
```

#### ReflectionResult反思结果
```python
@dataclass
class ReflectionResult:
    needs_correction: bool              # 是否需要修正
    original_response: str              # 原始回复
    corrected_response: Optional[str]   # 修正后的回复
    checks: List[CheckResult]           # 各项检查结果
    reflection_notes: Optional[str]     # 反思备注
    reflected_at: datetime              # 反思时间
```

### 3.11 安全护栏（Guardrails）

#### 验证器设计
FormatValidator提供多项验证：

```python
class FormatValidator:
    def validate_chinese_only(self, output: str) -&gt; ValidationResult:
        """验证必须使用中文（&gt;50%）"""

    def validate_length(self, output: str) -&gt; ValidationResult:
        """验证长度范围（100-400字）"""

    def validate_no_poem_in_followup(self, output: str,
                                    is_followup: bool) -&gt; ValidationResult:
        """验证追问模式不包含签诗原文"""

    def validate_no_forbidden_content(self, output: str) -&gt; ValidationResult:
        """验证不包含违规内容"""

    def validate_markdown_format(self, output: str) -&gt; ValidationResult:
        """验证Markdown格式（加粗标签配对）"""
```

#### 违规内容检测
```python
FORBIDDEN_PATTERNS = [
    r'(?i)违法|犯罪|暴力|恐怖|色情|赌博',
    r'(?i)自杀|自伤|自残',
    r'(?i)敏感政治|反动言论'
]
```

#### 追问模式签诗引用限制
检测以下关键词，防止追问时重复签诗：
```python
POEM_KEYWORDS = ["签诗", "诗文", "原文", "签文诗句", "签文原文"]
```

#### 验证结果状态
```python
class ValidationStatus(Enum):
    PASS = auto()      # 通过
    WARNING = auto()   # 警告（但可以接受）
    FAIL = auto()      # 失败（需要修正）
```

#### 自动修正流程
```
┌──────────────────────────────────────────┐
│  所有验证完成                            │
└─────────────┬────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│  是否有FAIL？                           │
└─────┬───────────────┬───────────────────┘
      ↓ 是            ↓ 否
┌──────────────────┐    ┌───────────────┐
│ 构建修正Prompt  │    │ 返回原始输出  │
│ 调用LLM修正     │    └───────────────┘
│ 返回修正结果    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ 修正失败？      │
└─────┬────────────┬───┘
      ↓ 是        ↓ 否
┌────────────┐  ┌───────────┐
│返回原始输出│  │返回修正后 │
└────────────┘  │的输出     │
                └───────────┘
```

### 3.12 可观测性设计

#### 三位一体架构

```
┌──────────────────────────────────────────────────────┐
│                    可观测性层                         │
├─────────────────┬─────────────────┬──────────────────┤
│   结构化日志    │   分布式追踪    │     指标收集     │
│  (Logging)     │   (Tracing)     │   (Metrics)     │
└─────────────────┴─────────────────┴──────────────────┘
```

#### 结构化日志

日志级别：
- DEBUG: 调试信息
- INFO: 一般信息（开始/完成任务）
- WARNING: 警告（非致命问题）
- ERROR: 错误（异常）

日志格式（JSON）：
```json
{
    "timestamp": "2024-04-24T10:30:00Z",
    "level": "INFO",
    "message": "开始解读",
    "trace_id": "abc123",
    "user_id": "user456",
    "question": "我最近想换工作..."
}
```

#### 分布式追踪（Trace/Span）

追踪模型：
- Trace: 一次完整的请求（如一次解读）
- Span: 追踪中的一个步骤（如调用LLM）

```python
@dataclass
class TraceSpan:
    trace_id: str                    # 追踪ID
    span_id: str                     # 跨度ID
    parent_span_id: Optional[str]    # 父跨度ID
    operation_name: str              # 操作名称
    start_time: datetime             # 开始时间
    end_time: Optional[datetime]     # 结束时间
    status: TraceStatus              # 状态 (STARTED/IN_PROGRESS/COMPLETED/FAILED)
    duration_ms: Optional[float]     # 耗时（毫秒）
    metadata: Dict[str, Any]         # 附加元数据
    error: Optional[str]             # 错误信息
```

使用方式：
```python
trace_id = observability.start_trace("interpret_with_planning")
try:
    # ... 执行逻辑 ...
    observability.end_trace(trace_id, success=True)
except Exception as e:
    observability.end_trace(trace_id, success=False, error=str(e))
```

#### 指标收集

**计数器：**
- total_requests: 总请求数
- interpretation_requests: 初次解读请求数
- followup_requests: 追问请求数
- successful_requests: 成功请求数
- failed_requests: 失败请求数
- guardrails_triggered: 安全护栏触发次数
- hallucinations_detected: 幻觉检测次数

**指标记录：**
```python
def record_metric(self, name: str, value: float,
                 tags: Optional[Dict[str, str]] = None):
    """记录指标"""
    metric = MetricRecord(
        name=name,
        value=value,
        timestamp=datetime.now(),
        tags=tags or {}
    )
    self._metrics_buffer.append(metric)
```

#### 统计API

可观测性层提供完整统计：
```python
def get_full_statistics(self) -&gt; Dict[str, Any]:
    return {
        "timestamp": datetime.now().isoformat(),
        "counters": dict(self._counters),
        "metrics": self.get_metrics_statistics(),
        "traces": self.get_trace_statistics(),
        "interpretation": self.get_trace_statistics("interpret_with_planning"),
        "followup": self.get_trace_statistics("followup_with_planning"),
    }
```

### 3.13 自动评测框架

#### 测试用例管理

测试用例采用YAML格式配置：

```yaml
name: 基础功能测试
description: 测试基本解读功能

test_cases:
  - id: basic_1
    name: 简单问题解读
    question: 我最近想换工作，想看看运势如何
    stick:
      id: 1
      level: 上上签
      title: 姜太公遇文王
      poem: 时来时去自如通，万水千山总是通...
      story: 姜太公钓鱼等待周文王...
      meaning: 时来运转，贵人相助...

  - id: basic_2
    name: 感情问题
    question: 我和对象最近闹矛盾，想看看我们的缘分
    stick:
      id: 23
      level: 中签
      title: 韩文公遇雪
      ...
```

已有的测试用例文件：
- basic_tests.yaml: 基础功能
- memory_tests.yaml: 记忆检索
- edge_cases.yaml: 边界情况

#### AgentEvaluator评测器

核心类：
```python
class AgentEvaluator:
    def __init__(self, test_cases_dir: str = "tests/test_cases"):
        self.test_cases_dir = Path(test_cases_dir)
        self.harness = get_harness(use_new_implementation=True)
        self.results: List[EvaluationResult] = []
```

#### 评测维度

| 维度 | 检查内容 |
|------|---------|
| **功能正确性** | 是否使用新引擎、是否成功返回 |
| **输出质量** | 中文占比(&gt;50%)、长度(100-400字)、关键词匹配 |
| **性能** | 单次请求耗时 |

#### 输出质量验证

```python
def _validate_output(self, output: str) -&gt; Dict[str, List[str]]:
    passed = []
    failed = []

    # 检查长度
    if 100 &lt;= len(output) &lt;= 400:
        passed.append("长度合适 (100-400字)")
    else:
        failed.append(f"长度不合适 ({len(output)}字)")

    # 检查是否是中文
    chinese_count = sum(1 for c in output if '\u4e00' &lt;= c &lt;= '\u9fff')
    if chinese_count &gt; len(output) * 0.5:
        passed.append("主要内容是中文")
    else:
        failed.append("中文内容不足")

    # 检查基本格式
    if any(k in output for k in ["运势", "签文", "建议"]):
        passed.append("包含相关关键词")
    else:
        failed.append("可能缺少相关关键词")

    return {"passed": passed, "failed": failed}
```

#### 评测报告生成

评测完成后生成JSON报告：

```json
{
    "summary": {
        "total_test_cases": 10,
        "successful": 9,
        "failure": 1,
        "success_rate": 0.9,
        "average_latency_seconds": 2.5
    },
    "quality_checks": {
        "total_passed": 27,
        "total_failed": 3,
        "pass_rate": 0.9
    },
    "details": [
        {
            "id": "basic_1",
            "name": "简单问题解读",
            "success": true,
            "latency": 2.3,
            "check_passed": [
                "长度合适 (100-400字)",
                "主要内容是中文",
                "包含相关关键词"
            ],
            "check_failed": [],
            "output_length": 256
        },
        ...
    ],
    "generated_at": "2024-04-24T10:30:00Z"
}
```

#### 运行评测

```bash
cd backend
python -m tests.agent_evaluator
```

控制台输出：
```
[Evaluator] 从 basic_tests.yaml 加载 3 个测试用例
[Evaluator] 从 memory_tests.yaml 加载 3 个测试用例
[Evaluator] 从 edge_cases.yaml 加载 4 个测试用例
[Evaluator] 共 10 个测试用例
[Evaluator] 运行测试用例: basic_1 - 简单问题解读
[Evaluator] 测试用例完成: basic_1 - 通过 (耗时: 2.30秒)
...

================================================================================
评测报告
================================================================================
总测试用例: 10
成功: 9
失败: 1
成功率: 90.0%
平均耗时: 2.50秒

质量检查:
通过检查: 27
失败检查: 3
通过率: 90.0%
================================================================================
[Evaluator] 评测报告已保存到: evaluation_report.json
```

### 3.14 错误处理与降级

#### 重试机制

RetryConfig配置：
```python
@dataclass
class RetryConfig:
    max_retries: int = 3           # 最多重试3次
    initial_delay: float = 1.0     # 初始延迟1秒
    max_delay: float = 10.0        # 最大延迟10秒
    exponential_base: float = 2.0  # 指数退避基数
```

指数退避策略：
```
第1次重试: 1秒后
第2次重试: 2秒后
第3次重试: 4秒后
```

#### 降级策略

**重要设计：不再降级到旧系统**

旧的降级策略：
```python
# ❌ 不再使用
return await self.old_ai_agent.interpret_stick(question, stick)
```

新的降级策略：
```python
# ✅ 新系统内部降级
fallback_response = "抱歉，解签时遇到一些问题，请稍后再试。"
# 或者尝试用简单Prompt再次调用LLM
fallback_messages = self.context_manager.build_interpret_context(question, stick)
fallback_response = await self.existing_agent._call_kimi_api(fallback_messages)
```

这样保持了系统的一致性，避免维护两套代码。

#### 非阻塞设计

- **记忆保存**：后台异步保存，不阻塞主流程
  ```python
  asyncio.create_task(self._save_memory_background(user_id, question, stick))
  ```

- **观测性记录**：记录日志、追踪、指标都是非阻塞的
- **错误处理**：单个组件失败不影响整体流程（如记忆保存失败仍返回解读）

---

## 4. Agent设计最佳实践

### 4.1 零影响原则的应用与演进

#### 初期应用（降低重构风险）

**原则定义：**
- 完全独立于现有代码
- 两个Hook可以共存（useGuanyin / useGuanyinAgent）
- 默认继续使用旧实现
- API接口保持完全不变

**实现方式：**
- 前端Hook有 `useLegacy` 参数，默认 `true`
- 后端Harness有 `use_new_implementation` 参数
- 提供兼容旧接口的方法

**代码示例：**
```javascript
// 前端
const { pageState, question, setQuestion, ... } = useGuanyinAgent({
  useLegacy: true  // 默认用旧实现
});
```

```python
# 后端
def get_harness(use_new_implementation: bool = True) -&gt; GuanyinAgentHarness:
    # 可配置是否使用新系统
```

#### 演进过程（验证后简化）

随着新系统验证稳定，逐步简化：

**阶段1：** 新旧系统并行，默认用旧
**阶段2：** 新旧系统并行，默认用新
**阶段3：** 移除旧系统调用，仅保留接口兼容
**阶段4：** 完全移除旧代码（当前状态）

**当前状态：**
- `useLegacy` 参数仍存在，但已无实际作用
- 降级策略不再切到旧系统
- 记忆系统直接保存到新表

#### 经验教训

1. **接口兼容比代码兼容更重要**
   - API层保持不变，UI层无需修改
   - 内部实现可以大胆重构

2. **零影响原则是临时策略**
   - 用于降低重构初期风险
   - 验证通过后应及时清理旧代码
   - 避免技术债务积累

3. **单例模式很关键**
   - Harness、Observability等都是单例
   - 避免重复初始化，保持状态一致

### 4.2 代理配置分离

**问题背景：**
- Kimi API是国内服务，不需要代理
- Supabase是国外服务，需要代理
- 最初所有请求都走代理，导致Kimi API延迟很高（30+秒）

**解决方案：**
```python
# backend/app/services/ai_agent.py
class GuanyinAIAgent:
    def __init__(self):
        self.api_key = settings.KIMI_API_KEY
        self.base_url = settings.KIMI_BASE_URL
        self.model = settings.KIMI_MODEL
        self.timeout = settings.KIMI_TIMEOUT
        # Kimi API是国内的，不需要代理
        self.proxies = None  # ✅ 关键修改
```

```python
# backend/.env
# Supabase仍保留代理配置
SUPABASE_URL=...
HTTP_PROXY=http://...
HTTPS_PROXY=http://...
```

**效果：**
- Kimi API延迟从30+秒降至2-3秒
- Supabase仍正常工作

### 4.3 权限控制（记忆访问）

记忆系统集成权限检查：

```python
# 检查记忆访问权限
access_control = get_access_control()
is_allowed, reason = access_control.check_memory_access(
    access_type="read",  # 或 "write"
    target_user_id=target_user_id,
    current_user_id=current_user_id
)

if not is_allowed:
    print(f"[Memory] Permission denied: {reason}")
    return
```

### 4.4 前端状态管理

**useGuanyinAgent Hook设计：**

```javascript
export function useGuanyinAgent({
  onNeedAuth,
  userId,
  useLegacy = true,  // 向后兼容
}: UseGuanyinAgentOptions = {}) {
  // 获取Agent单例
  const agentRef = useRef&lt;GuanyinAgent | null&gt;(null);
  if (!agentRef.current) {
    agentRef.current = getGuanyinAgent(useLegacy);
  }
  const agent = agentRef.current;

  // 本地React状态（仅用于UI渲染）
  const [agentStatus, setAgentStatus] = useState&lt;AgentStatus&gt;(agent.status);

  // 订阅Agent状态变化
  useEffect(() =&gt; {
    return agent.subscribe((status) =&gt; {
      setAgentStatus(status);
    });
  }, [agent]);

  // ... 方法实现 ...

  // 返回与旧Hook完全相同的接口
  return {
    pageState,
    question,
    setQuestion,
    selectedStick,
    conversation,
    isLoading,
    error,
    highlightInput,

    focusInput,
    blurInput,
    selectGestureMode,
    selectMouseMode,
    gestureDraw,
    onMouseLongPress,
    onMouseRelease,
    sendFollowup,
    retry,
    reset,

    ensureInterpretation,  // 新方法

    agentStatus,  // 新状态
    agent,        // 新暴露
  };
}
```

**关键优化 - Loading状态管理：**

问题：初次解读时loading状态消失太快
```javascript
// ❌ 之前的做法 - 提前结束loading
try {
  // ... 抽签 ...
  agent.setLoading(true);
  await interpretStick(stick, question);
} finally {
  agent.setLoading(false);  // 提前结束！
}
```

```javascript
// ✅ 现在的做法 - 让interpretStick自己管理loading
try {
  // ... 抽签 ...
  // interpretStick内部会管理loading状态
  await interpretStick(stick, question);
} catch (err) {
  // ...
}
// 没有finally了！
```

---

## 5. 技术架构

### 5.1 前端技术栈

| 技术 | 版本/说明 |
|------|----------|
| React | UI框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| MediaPipe | 手势识别 |

### 5.2 后端技术栈

| 技术 | 版本/说明 |
|------|----------|
| Python | 编程语言 |
| FastAPI | Web框架 |
| Supabase | 数据库（PostgreSQL） |
| Kimi API | LLM服务 |
| httpx | HTTP客户端（支持异步） |

### 5.3 数据库设计

**主要表：**
1. **divination_records** - 测算记录（旧表，向后兼容）
2. **agent_memory** - 记忆系统（新表）

**agent_memory表结构：**
```sql
CREATE TABLE agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    memory_layer TEXT NOT NULL,  -- 'short_term' | 'long_term'
    memory_type TEXT NOT NULL,   -- 'divination'
    content JSONB NOT NULL,
    summary TEXT,
    topic_tags TEXT[],
    stick_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_agent_memory_user_id ON agent_memory(user_id);
CREATE INDEX idx_agent_memory_stick_id ON agent_memory(stick_id);
CREATE INDEX idx_agent_memory_topic_tags ON agent_memory USING GIN(topic_tags);
CREATE INDEX idx_agent_memory_expires_at ON agent_memory(expires_at);
```

### 5.4 第三方集成

#### Kimi API（月之暗面）

**配置：**
```env
KIMI_API_KEY=sk-...
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=moonshot-v1-8k
KIMI_TIMEOUT=60
```

**配置**

#### MediaPipe Hands（手势识别）

前端集成，用于手势抽签模式：
- 识别手部关键点
- 判断手势动作

#### Supabase

数据库和认证服务，**需要代理配置**。

---

## 6. 非功能性需求

### 6.1 性能要求

| 指标 | 目标 | 说明 |
|------|------|------|
| 初次解读延迟 | &lt; 3秒 | 快速路径，单次LLM调用 |
| 追问延迟 | &lt; 5秒 | ReAct循环，最多3步 |
| 前端响应 | &lt; 100ms | UI交互响应 |
| 并发支持 | 100+ QPS | 生产环境 |

### 6.2 可靠性

| 指标 | 目标 |
|------|------|
| 系统可用性 | 99.5%+ |
| 错误率 | &lt; 1% |
| 数据持久化 | 100% 不丢失 |
| 降级体验 | 优雅降级，不崩溃 |

### 6.3 可观测性

- **日志**：所有关键操作有结构化日志
- **追踪**：支持分布式追踪，trace_id贯穿全链路
- **指标**：核心指标可监控
- **评测**：自动评测框架验证质量

### 6.4 安全性

- **内容过滤**：违规内容检测和拦截
- **输出验证**：安全护栏确保输出质量
- **权限控制**：记忆访问权限检查
- **数据加密**：传输加密（HTTPS）

### 6.5 兼容性

- **API兼容**：接口保持不变，支持旧版前端
- **数据兼容**：旧表仍可读写，新表并行使用
- **渐进升级**：可以逐步迁移用户到新系统

---

## 7. 未来规划

### 7.1 功能扩展

- **更多工具**：黄历查询、吉日选择等
- **长期记忆摘要**：用LLM生成用户画像
- **多模态**：支持图片解读（手相等）
- **个性化配置**：用户可选择解签风格（严谨/温和/通俗）

### 7.2 技术迭代

- **流式输出**：Server-Sent Events实现实时打字机效果
- **缓存优化**：缓存常见问题的签文解读
- **A/B测试**：不同Prompt策略效果对比
- **向量检索**：用向量数据库优化记忆检索（当前用关键词匹配）

---

**文档版本：** v1.0
**最后更新：** 2024-04-24
**基于代码提交：** 186fcd6
