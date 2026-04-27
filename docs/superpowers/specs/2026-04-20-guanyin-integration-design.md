---
name: 观音灵签功能完善设计
description: 观音灵签功能完善的完整技术设计文档，包括API集成、Kimi AI、100签文数据、数据库保存
type: spec
---

# 观音灵签功能完善 - 技术设计

**版本**：v1.0  
**日期**：2026-04-20  
**状态**：待实施

---

## 目录

1. [概述](#1-概述)
2. [架构设计](#2-架构设计)
3. [详细设计](#3-详细设计)
4. [实施计划](#4-实施计划)

---

## 1. 概述

### 1.1 目标

完善观音灵签功能，实现以下4个核心功能：

1. **前端API集成** - 前端从模拟数据切换到调用后端真实API
2. **Kimi 2.5 AI集成** - 后端接入真实的Kimi API提供智能解读
3. **100签文数据** - 从JSON文件加载完整的100签文数据
4. **数据库记录保存** - 实现测算记录自动保存和增量更新

### 1.2 现状

- **前端**：使用本地模拟数据（10签），AI回复为前端模拟
- **后端**：有API接口框架，但AI服务为占位实现，签文数据硬编码10签
- **数据库**：表结构已存在，但未实际使用

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ useGuanyin.ts - 集成API调用                          │  │
│  │  • POST /api/guanyin/draw (抽签)                    │  │
│  │  • POST /api/guanyin/interpret (初次解读)           │  │
│  │  • POST /api/guanyin/followup (追问)                │  │
│  │  • POST /api/guanyin/save-record (保存记录)         │  │
│  │  • PUT  /api/guanyin/update-record/{id} (更新记录)   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 (FastAPI)                          │
│  ┌──────────────────┐  ┌─────────────────────────────────┐ │
│  │  api/guanyin.py  │  │  services/                      │ │
│  │  (API路由)        │  │   • guanyin.py (签文服务)      │ │
│  │                  │  │   • ai_agent.py (Kimi AI)      │ │
│  └──────────────────┘  │   • database.py (数据库服务)    │ │
│                         └─────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  data/guanyin_sticks.json (100签文数据)              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Supabase PostgreSQL
                            ▼
                  ┌─────────────────┐
                  │  divination_    │
                  │  records 表     │
                  └─────────────────┘
```

### 2.2 数据流程

#### 抽签流程

```
用户输入问题 → 选择抽签方式 → 调用 /api/guanyin/draw 
    ↓
后端从JSON加载100签 → 随机抽取 → 返回签文
    ↓
前端显示签文 → 调用 /api/guanyin/save-record 保存基础记录
    ↓
调用 /api/guanyin/interpret → 后端调用Kimi API → 返回解读
    ↓
调用 /api/guanyin/update-record 更新对话
```

#### 追问流程

```
用户输入追问 → 调用 /api/guanyin/followup
    ↓
后端调用Kimi API（带历史上下文）→ 返回回复
    ↓
调用 /api/guanyin/update-record 更新对话
```

---

## 3. 详细设计

### 3.1 100签文数据

#### 3.1.1 文件位置

```
backend/
└── data/
    └── guanyin_sticks.json
```

#### 3.1.2 JSON格式

```json
[
  {
    "id": 1,
    "level": "上上签",
    "title": "天门一挂",
    "poem": "天门一挂挂金牌，有志功名必自来。东西南北皆通达，福禄双称心开怀。",
    "story": "姜太公钓鱼，文王访贤。太公年八十，垂钓渭水，文王出猎相遇，载与俱归，立为师。后助武王伐纣，建立周朝。",
    "meaning": "此签求官得官，求财得财，婚姻美满，诸事吉祥。宜积极进取，自有贵人相助。"
  }
]
```

**字段说明**（以用户实际数据为准）：
- `id`: 签编号（1-100）
- `level`: 签文等级（上上签、上签、中签、下签、下下签）
- `title`: 签文标题
- `poem`: 签诗
- `story`: 典故
- `meaning`: 含义解释

#### 3.1.3 后端加载代码

修改 `backend/app/services/guanyin.py`：

```python
import json
import random
from pathlib import Path
from typing import List
from app.models.schemas import GuanyinStick

# JSON文件路径
DATA_DIR = Path(__file__).parent.parent.parent / "data"
GUANYIN_STICKS_PATH = DATA_DIR / "guanyin_sticks.json"

# 全局缓存
GUANYIN_STICKS: List[GuanyinStick] = []


def load_guanyin_sticks() -> None:
    """从JSON文件加载签文数据"""
    global GUANYIN_STICKS
    
    if not GUANYIN_STICKS_PATH.exists():
        raise FileNotFoundError(f"签文数据文件不存在: {GUANYIN_STICKS_PATH}")
    
    with open(GUANYIN_STICKS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    GUANYIN_STICKS = [GuanyinStick(**item) for item in data]


def draw_stick() -> GuanyinStick:
    """随机抽取一支签"""
    if not GUANYIN_STICKS:
        load_guanyin_sticks()
    return random.choice(GUANYIN_STICKS)


def get_stick_by_id(stick_id: int) -> GuanyinStick | None:
    """根据ID获取签文"""
    if not GUANYIN_STICKS:
        load_guanyin_sticks()
    for stick in GUANYIN_STICKS:
        if stick.id == stick_id:
            return stick
    return None


# 启动时尝试加载
try:
    load_guanyin_sticks()
except Exception as e:
    print(f"警告：加载签文数据失败: {e}")
```

### 3.2 Kimi 2.5 AI集成

#### 3.2.1 配置

修改 `backend/app/core/config.py`：

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    
    # Kimi API配置
    KIMI_API_KEY: str
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    KIMI_MODEL: str = "kimi-k2.5"
    KIMI_TIMEOUT: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
```

修改 `backend/.env.example`：

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Kimi API
KIMI_API_KEY=your_kimi_api_key
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2.5
```

#### 3.2.2 AI服务实现

重写 `backend/app/services/ai_agent.py`：

```python
from typing import List
import httpx
from app.core.config import settings
from app.models.schemas import GuanyinStick, Message


class GuanyinAIAgent:
    def __init__(self):
        self.api_key = settings.KIMI_API_KEY
        self.base_url = settings.KIMI_BASE_URL
        self.model = settings.KIMI_MODEL
        self.timeout = settings.KIMI_TIMEOUT
        
        # 系统提示词
        self.system_prompt = """你是一位精通周易命理的观音灵签解签大师。你的任务是根据用户抽到的签文和用户的具体问题，提供详细、有深度且富有启发性的解读。

解读要求：
1. 签文底本锁死原则：严禁修改、编造、删减 100 签 JSON 库内的签号、签名、吉凶等级、签诗、典故、传统解曰、核心标签（coreTags），所有解读严格贴合当前抽签固定内容，绝不反转吉凶、篡改签文本义、偏离核心寓意。
2. 个性化专属解读原则：禁止使用通用套话、万能话术，每一次回答完全匹配用户本次具体问题；同一签文对应不同问题、不同签文对应同一问题，解读角度、措辞、侧重点必须完全不同，不可让用户察觉模板痕迹。
3. 知识库调用规则：仅调用内置观音灵签 1-100 签固定 JSON 知识库，不引用任何其他灵签内容、不联网检索、不生成额外典故、不延伸无关民俗知识。
4. 首先引用签诗，然后结合用户问题进行解读
5. 解释典故与用户问题的关联
6. 给出具体的建议和指引
7. 语气要温和、智慧、有启发性
8. 回答使用中文，语言优美，富有哲理
9. 每次解读200字左右

请记住，你是在为用户解答人生疑惑，要认真、用心地对待每一个问题。"""

    async def _call_kimi_api(self, messages: List[dict]) -> str:
        """调用Kimi API"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000,
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def interpret_stick(
        self,
        question: str,
        stick: GuanyinStick
    ) -> str:
        """初次解读签文"""
        user_content = f"""用户抽到的签文：
第{stick.id}签 - {stick.level}
【标题】{stick.title}
【签诗】{stick.poem}
【典故】{stick.story}
【释义】{stick.meaning}

用户的问题：{question}

请为用户解读这支签。"""

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_content},
        ]
        
        return await self._call_kimi_api(messages)

    async def followup_question(
        self,
        question: str,
        stick: GuanyinStick,
        history: List[Message]
    ) -> str:
        """追问回复"""
        # 构建对话历史
        messages = [{"role": "system", "content": self.system_prompt}]
        
        # 添加签文上下文作为第一条用户消息
        context = f"""背景信息：
用户之前抽到的签文：
第{stick.id}签 - {stick.level}
【标题】{stick.title}
【签诗】{stick.poem}
【典故】{stick.story}
【释义】{stick.meaning}

请结合这支签文继续回答用户的后续问题。"""
        
        messages.append({"role": "user", "content": context})
        
        # 添加历史对话
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        
        # 添加当前问题
        messages.append({"role": "user", "content": question})
        
        return await self._call_kimi_api(messages)


# 单例
ai_agent = GuanyinAIAgent()
```

### 3.3 数据库记录保存

#### 3.3.1 数据库服务

新建 `backend/app/services/database.py`：

```python
from typing import List, Optional
from datetime import datetime
import uuid
from supabase import create_client, Client
from app.core.config import settings
from app.models.schemas import GuanyinStick, Message


supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)


class DivinationRecord:
    def __init__(
        self,
        id: str,
        user_id: Optional[str],
        type: str,
        question: str,
        stick: GuanyinStick,
        conversation: List[Message],
        created_at: datetime,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id
        self.user_id = user_id
        self.type = type
        self.question = question
        self.stick = stick
        self.conversation = conversation
        self.created_at = created_at
        self.updated_at = updated_at


async def create_divination_record(
    user_id: Optional[str],
    question: str,
    stick: GuanyinStick,
) -> str:
    """创建测算记录（出签后立即调用）"""
    record_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    data = {
        "id": record_id,
        "user_id": user_id,
        "type": "guanyin",
        "question": question,
        "stick": stick.model_dump(),
        "conversation": [],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    
    result = supabase.table("divination_records").insert(data).execute()
    return record_id


async def update_divination_record(
    record_id: str,
    conversation: List[Message],
) -> bool:
    """更新测算记录（每次AI回复后调用）"""
    now = datetime.utcnow()
    
    conversation_dicts = [msg.model_dump() for msg in conversation]
    
    result = supabase.table("divination_records") \
        .update({
            "conversation": conversation_dicts,
            "updated_at": now.isoformat(),
        }) \
        .eq("id", record_id) \
        .execute()
    
    return len(result.data) > 0


async def get_divination_record(
    record_id: str,
) -> Optional[DivinationRecord]:
    """获取测算记录"""
    result = supabase.table("divination_records") \
        .select("*") \
        .eq("id", record_id) \
        .execute()
    
    if not result.data:
        return None
    
    data = result.data[0]
    return DivinationRecord(
        id=data["id"],
        user_id=data.get("user_id"),
        type=data["type"],
        question=data["question"],
        stick=GuanyinStick(**data["stick"]),
        conversation=[Message(**msg) for msg in data["conversation"]],
        created_at=datetime.fromisoformat(data["created_at"]),
        updated_at=datetime.fromisoformat(data["updated_at"]) if data.get("updated_at") else None,
    )
```

#### 3.3.2 API路由更新

修改 `backend/app/api/guanyin.py`：

```python
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Optional

from app.models.schemas import (
    DrawRequest, DrawResponse,
    InterpretRequest, InterpretResponse,
    FollowupRequest, FollowupResponse,
    SaveRecordRequest, SaveRecordResponse,
    UpdateRecordRequest, UpdateRecordResponse,
)
from app.services.guanyin import draw_stick
from app.services.ai_agent import ai_agent
from app.services.database import (
    create_divination_record,
    update_divination_record,
)

router = APIRouter(prefix="/api/guanyin", tags=["guanyin"])


@router.post("/draw", response_model=DrawResponse)
async def draw_endpoint(request: DrawRequest):
    """抽取一支签"""
    stick = draw_stick()
    return DrawResponse(stick=stick)


@router.post("/interpret", response_model=InterpretResponse)
async def interpret_endpoint(request: InterpretRequest):
    """AI初次解读签文"""
    try:
        interpretation = await ai_agent.interpret_stick(request.question, request.stick)
        return InterpretResponse(interpretation=interpretation)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/followup", response_model=FollowupResponse)
async def followup_endpoint(request: FollowupRequest):
    """AI追问"""
    try:
        reply = await ai_agent.followup_question(
            request.question, 
            request.stick, 
            request.history
        )
        return FollowupResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-record", response_model=SaveRecordResponse)
async def save_record_endpoint(request: SaveRecordRequest):
    """保存测算记录（出签后立即调用）"""
    try:
        record_id = await create_divination_record(
            user_id=request.user_id,
            question=request.question,
            stick=request.stick,
        )
        created_at = datetime.utcnow()
        return SaveRecordResponse(id=record_id, created_at=created_at)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-record/{record_id}", response_model=UpdateRecordResponse)
async def update_record_endpoint(record_id: str, request: UpdateRecordRequest):
    """更新测算记录（每次AI回复后调用）"""
    try:
        success = await update_divination_record(
            record_id=record_id,
            conversation=request.conversation,
        )
        if not success:
            raise HTTPException(status_code=404, detail="Record not found")
        updated_at = datetime.utcnow()
        return UpdateRecordResponse(success=True, updated_at=updated_at)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 3.3.3 Schema更新

修改 `backend/app/models/schemas.py`，添加：

```python
class UpdateRecordRequest(BaseModel):
    conversation: List[Message]


class UpdateRecordResponse(BaseModel):
    success: bool
    updated_at: datetime
```

### 3.4 前端API集成

#### 3.4.1 环境变量

修改 `frontend/.env.local`，添加：

```env
# API配置
VITE_API_BASE_URL=http://localhost:8000
```

#### 3.4.2 API服务

新建 `frontend/src/services/api.ts`：

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  
  return response.json()
}

// 观音灵签API
export const guanyinApi = {
  draw: () => request<{ stick: any }>('/api/guanyin/draw', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  
  interpret: (question: string, stick: any) => request<{ interpretation: string }>('/api/guanyin/interpret', {
    method: 'POST',
    body: JSON.stringify({ question, stick }),
  }),
  
  followup: (question: string, stick: any, history: any[]) => request<{ reply: string }>('/api/guanyin/followup', {
    method: 'POST',
    body: JSON.stringify({ question, stick, history }),
  }),
  
  saveRecord: (userId: string | null, question: string, stick: any) => request<{ id: string; created_at: string }>('/api/guanyin/save-record', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, question, stick }),
  }),
  
  updateRecord: (recordId: string, conversation: any[]) => request<{ success: boolean; updated_at: string }>(`/api/guanyin/update-record/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify({ conversation }),
  }),
}
```

#### 3.4.3 useGuanyin.ts更新

修改 `frontend/src/hooks/useGuanyin.ts`，集成API调用（将模拟数据替换为API调用，添加记录保存逻辑）。

---

## 4. 实施计划

### 4.1 文件清单

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 修改 | `backend/.env.example` | 添加Kimi配置 |
| 修改 | `backend/.env` | 添加Kimi API Key |
| 修改 | `backend/app/core/config.py` | 添加Kimi配置 |
| 新建 | `backend/data/` | 数据目录 |
| 新建 | `backend/data/guanyin_sticks.json` | 100签文数据（用户提供） |
| 修改 | `backend/app/services/guanyin.py` | 从JSON加载签文 |
| 重写 | `backend/app/services/ai_agent.py` | Kimi API集成 |
| 新建 | `backend/app/services/database.py` | 数据库服务 |
| 修改 | `backend/app/models/schemas.py` | 添加UpdateRecord schema |
| 修改 | `backend/app/api/guanyin.py` | 添加更新记录接口 |
| 修改 | `frontend/.env.local` | 添加API_BASE_URL |
| 新建 | `frontend/src/services/api.ts` | API服务 |
| 修改 | `frontend/src/hooks/useGuanyin.ts` | 集成后端API |

### 4.2 实施步骤

1. **配置后端环境**
   - 添加Kimi API配置到.env和config.py
   - 创建data目录

2. **实现签文数据加载**
   - 修改guanyin.py从JSON加载

3. **实现Kimi AI服务**
   - 重写ai_agent.py

4. **实现数据库服务**
   - 创建database.py
   - 更新schemas.py
   - 更新API路由

5. **前端API集成**
   - 创建api.ts
   - 修改useGuanyin.ts

6. **测试验证**
   - 后端启动测试
   - 端到端流程测试

---

**文档结束**
