# 观音灵签功能完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善观音灵签功能，包括前端API集成、Kimi 2.5 AI集成、100签文数据加载、数据库记录保存

**Architecture:** 前端React集成后端FastAPI API，后端集成Kimi 2.5 API，从JSON加载100签文，Supabase保存测算记录

**Tech Stack:** React 18, TypeScript, FastAPI, Supabase, Kimi API (moonshot), Python 3.11+

---

## 任务分解

### Task 1: 配置后端环境 - Kimi API和数据库配置

**Files:**
- Modify: `backend/app/core/config.py
- Modify: `backend/.env.example`
- Modify: `backend/.env`

- [ ] **Step 1: 修改config.py添加Kimi配置

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

- [ ] **Step 2: 修改.env.example添加Kimi配置示例

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Kimi API
KIMI_API_KEY=your_kimi_api_key
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2.5
```

- [ ] **Step 3: 修改.env添加实际Kimi API Key

在文件末尾添加：
```env
# Kimi API
KIMI_API_KEY=sk-KVT3uwRPrcx12pWOqbIupm5ptgAxaJ3N0Zzha0hZkJhIcS2r
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2.5
```

- [ ] **Step 4: 运行后端检查

Run: `cd backend && python -c "from app.core.config import settings; print('Config loaded successfully, Kimi model:', settings.KIMI_MODEL"`
Expected: Config loaded successfully, Kimi model: kimi-k2.5

- [ ] **Step 5: Commit

```bash
git add backend/app/core/config.py backend/.env.example
git commit -m "feat: add Kimi API config"
```

---

### Task 2: 实现100签文数据从JSON加载

**Files:**
- Modify: `backend/app/services/guanyin.py`

- [ ] **Step 1: 重写guanyin.py从JSON加载数据

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

- [ ] **Step 2: 修复代码中的小错误（括号不匹配）

将 `[GuanyinStick(**item) for item in data]` 改为 `[GuanyinStick(**item) for item in data]`

- [ ] **Step 3: 运行Python检查验证

Run: `cd backend && python -c "from app.services.guanyin import load_guanyin_sticks, draw_stick; load_guanyin_sticks(); stick = draw_stick(); print('Loaded stick:', stick.title)"`
Expected: Loaded stick: 钟离成道 (或其他随机签文标题)

- [ ] **Step 4: Commit

```bash
git add backend/app/services/guanyin.py
git commit -m "feat: load guanyin sticks from JSON"
```

---

### Task 3: 实现Kimi 2.5 AI服务

**Files:**
- Modify: `backend/requirements.txt`
- Rewrite: `backend/app/services/ai_agent.py`

- [ ] **Step 1: 检查并添加httpx依赖

首先检查requirements.txt是否已有httpx，如果没有添加：
```txt
httpx>=0.24.0
```

- [ ] **Step 2: 重写ai_agent.py

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

- [ ] **Step 3: 安装依赖（如需要）

如果添加了httpx，运行：`cd backend && pip install httpx`

- [ ] **Step 4: Commit

```bash
git add backend/requirements.txt backend/app/services/ai_agent.py
git commit -m "feat: integrate Kimi 2.5 AI service"
```

---

### Task 4: 实现数据库服务

**Files:**
- Create: `backend/app/services/database.py`
- Modify: `backend/app/models/schemas.py`

- [ ] **Step 1: 创建database.py

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
```

- [ ] **Step 2: 修改schemas.py添加UpdateRecord schema

在文件末尾添加：
```python
class UpdateRecordRequest(BaseModel):
    conversation: List[Message]


class UpdateRecordResponse(BaseModel):
    success: bool
    updated_at: datetime
```

- [ ] **Step 3: 运行Python检查验证

Run: `cd backend && python -c "from app.services.database import create_divination_record; from app.services.guanyin import draw_stick; print('Database service imported successfully')"`
Expected: Database service imported successfully

- [ ] **Step 4: Commit

```bash
git add backend/app/services/database.py backend/app/models/schemas.py
git commit -m "feat: add database service for divination records"
```

---

### Task 5: 更新API路由

**Files:**
- Modify: `backend/app/api/guanyin.py`

- [ ] **Step 1: 更新guanyin.py添加更新记录接口

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

- [ ] **Step 2: 运行后端启动测试

Run: `cd backend && python -m uvicorn main:app --reload` (in separate terminal)
Then test: `curl -X POST http://localhost:8000/api/guanyin/draw -H "Content-Type: application/json" -d "{}"`
Expected: Returns a random stick JSON

- [ ] **Step 3: Commit

```bash
git add backend/app/api/guanyin.py
git commit -m "feat: update guanyin API with update-record endpoint"
```

---

### Task 6: 前端API服务

**Files:**
- Create: `frontend/src/services/api.ts`
- Modify: `frontend/.env.local`

- [ ] **Step 1: 修改.env.local添加API_BASE_URL

在文件末尾添加：
```env
# API配置
VITE_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 2: 创建api.ts

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

- [ ] **Step 3: 运行TypeScript检查验证

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit

```bash
git add frontend/.env.local frontend/src/services/api.ts
git commit -m "feat: add frontend API service"
```

---

### Task 7: 集成useGuanyin.ts

**Files:**
- Modify: `frontend/src/hooks/useGuanyin.ts`

- [ ] **Step 1: 替换useGuanyin.ts的关键部分（保持现有结构，集成API

```typescript
import { useState, useCallback, useRef } from 'react'
import { GUANYIN_PAGE_STATES, type GuanyinPageState } from '../utils/constants'
import type { GuanyinStick } from '../utils/guanyin'
import { guanyinApi } from '../services/api'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UseGuanyinOptions {
  onNeedAuth?: () => void
  userId?: string | null
}

export const useGuanyin = ({ onNeedAuth: _onNeedAuth, userId }: UseGuanyinOptions = {}) => {
  const [pageState, setPageState] = useState<GuanyinPageState>(GUANYIN_PAGE_STATES.IDLE)
  const [question, setQuestion] = useState('')
  const [selectedStick, setSelectedStick] = useState<GuanyinStick | null>(null)
  const [conversation, setConversation] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightInput, setHighlightInput] = useState(false)
  const [recordId, setRecordId] = useState<string | null>(null)

  // 用于鼠标长按检测
  const isMousePressingRef = useRef(false)

  // 重置状态
  const reset = useCallback(() => {
    setPageState(GUANYIN_PAGE_STATES.IDLE)
    setQuestion('')
    setSelectedStick(null)
    setConversation([])
    setError(null)
    setIsLoading(false)
    setRecordId(null)
  }, [])

  // 聚焦输入框
  const focusInput = useCallback(() => {
    setPageState(GUANYIN_PAGE_STATES.INPUT_FOCUSED)
  }, [])

  // 失去焦点
  const blurInput = useCallback(() => {
    if (pageState === GUANYIN_PAGE_STATES.INPUT_FOCUSED) {
      setPageState(GUANYIN_PAGE_STATES.IDLE)
    }
  }, [pageState])

  // 选择手势控制模式
  const selectGestureMode = useCallback(() => {
    if (!question.trim()) {
      setHighlightInput(true)
      setTimeout(() => setHighlightInput(false), 2000)
      return
    }
    setPageState(GUANYIN_PAGE_STATES.GESTURE_MODE)
  }, [question])

  // 选择鼠标控制模式
  const selectMouseMode = useCallback(() => {
    if (!question.trim()) {
      setHighlightInput(true)
      setTimeout(() => setHighlightInput(false), 2000)
      return
    }
    setPageState(GUANYIN_PAGE_STATES.MOUSE_MODE)
  }, [question])

  // 保存记录（忽略错误，不影响用户体验）
  const saveRecordSilently = useCallback(async (stick: GuanyinStick) => {
    try {
      const result = await guanyinApi.saveRecord(userId || null, question, stick)
      setRecordId(result.id)
    } catch (err) {
      console.warn('保存记录失败:', err)
    }
  }, [userId, question])

  // 更新记录（忽略错误）
  const updateRecordSilently = useCallback(async (conv: Message[]) => {
    if (!recordId) return
    try {
      await guanyinApi.updateRecord(recordId, conv)
    } catch (err) {
      console.warn('更新记录失败:', err)
    }
  }, [recordId])

  // 开始抽签（内部方法）
  const startDraw = useCallback(async () => {
    setPageState(GUANYIN_PAGE_STATES.DRAWING)
    setError(null)

    try {
      // 模拟抽签动画
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 调用后端API抽签
      const result = await guanyinApi.draw()
      const stick = result.stick as GuanyinStick
      setSelectedStick(stick)

      // 显示结果
      setPageState(GUANYIN_PAGE_STATES.RESULT)

      // 异步保存记录
      saveRecordSilently(stick)

      // 调用AI初次解读
      if (question.trim()) {
        await interpretStick(stick, question)
      }
    } catch (err) {
      setError('抽签失败，请稍后重试')
      console.error('Draw error:', err)
      setPageState(GUANYIN_PAGE_STATES.IDLE)
    }
  }, [question, saveRecordSilently])

  // 手势抽签
  const gestureDraw = useCallback(async () => {
    if (pageState !== GUANYIN_PAGE_STATES.GESTURE_MODE) return
    await startDraw()
  }, [pageState, startDraw])

  // 鼠标长按开始
  const onMouseLongPress = useCallback(() => {
    if (pageState !== GUANYIN_PAGE_STATES.MOUSE_MODE) return
    isMousePressingRef.current = true
  }, [pageState])

  // 鼠标松开
  const onMouseRelease = useCallback(async () => {
    if (!isMousePressingRef.current) return
    isMousePressingRef.current = false

    if (pageState === GUANYIN_PAGE_STATES.MOUSE_MODE) {
      await startDraw()
    }
  }, [pageState, startDraw])

  // AI解读签文
  const interpretStick = useCallback(async (stick: GuanyinStick, userQuestion: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await guanyinApi.interpret(userQuestion, stick)
      const aiMessage: Message = { role: 'assistant', content: result.interpretation }
      const newConversation = [aiMessage]
      setConversation(newConversation)
      
      // 异步更新记录
      updateRecordSilently(newConversation)
    } catch (err) {
      setError('解读失败，请稍后重试')
      console.error('Interpret error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [updateRecordSilently])

  // 发送追问
  const sendFollowup = useCallback(async (followupQuestion: string) => {
    if (!selectedStick) return

    setIsLoading(true)
    setError(null)

    const userMessage: Message = { role: 'user', content: followupQuestion }
    const newConversation = [...conversation, userMessage]
    setConversation(newConversation)

    try {
      const result = await guanyinApi.followup(followupQuestion, selectedStick, conversation)
      const aiMessage: Message = { role: 'assistant', content: result.reply }
      const finalConversation = [...newConversation, aiMessage]
      setConversation(finalConversation)
      
      // 异步更新记录
      updateRecordSilently(finalConversation)
    } catch (err) {
      setError('发送失败，请稍后重试')
      console.error('Followup error:', err)
      // 移除刚才添加的用户消息
      setConversation(conversation)
    } finally {
      setIsLoading(false)
    }
  }, [selectedStick, conversation, updateRecordSilently])

  // 再测一次
  const retry = useCallback(() => {
    reset()
  }, [reset])

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
  }
}
```

- [ ] **Step 2: 运行TypeScript检查验证

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit

```bash
git add frontend/src/hooks/useGuanyin.ts
git commit -m "feat: integrate backend API in useGuanyin"
```

---

### Task 8: 端到端测试

**Files:**
- Test: 完整流程测试

- [ ] **Step 1: 启动后端服务

Terminal 1: `cd backend && python -m uvicorn main:app --reload`
Expected: Backend starts on http://localhost:8000

- [ ] **Step 2: 启动前端服务

Terminal 2: `cd frontend && npm run dev`
Expected: Frontend starts on http://localhost:5173

- [ ] **Step 3: 测试抽签流程

1. 打开浏览器访问前端
2. 输入问题
3. 选择抽签方式
4. 抽签并验证获得100签文中的一支
5. 验证AI解读显示
6. 验证追问功能

- [ ] **Step 4: 验证数据库记录

检查Supabase数据库中divination_records表是否有新记录创建

---

## 计划完成

所有任务已分解完毕！
