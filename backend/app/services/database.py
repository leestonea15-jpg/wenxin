from typing import List, Optional
from datetime import datetime
import uuid
import httpx
from app.core.config import settings
from app.models.schemas import GuanyinStick, Message


def get_supabase_headers():
    """获取Supabase REST API请求头"""
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def get_proxy_config():
    """获取代理配置"""
    proxies = {}
    if settings.HTTP_PROXY:
        proxies["http://"] = settings.HTTP_PROXY
    if settings.HTTPS_PROXY:
        proxies["https://"] = settings.HTTPS_PROXY
    return proxies if proxies else None


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
    user_id: str,
    question: str,
    stick: GuanyinStick,
    conversation: Optional[List[Message]] = None,
) -> str:
    """创建测算记录（出签后立即调用）"""
    now = datetime.utcnow()

    data = {
        "user_id": user_id,
        "type": "guanyin",
        "question": question,
        "result": stick.model_dump(),
        "conversation": [msg.model_dump() for msg in conversation] if conversation else [],
    }

    print(f"[Supabase] Creating record with data: {data}")
    print(f"[Supabase] URL: {settings.SUPABASE_URL}/rest/v1/divination_records")
    print(f"[Supabase] Proxy config: {get_proxy_config()}")

    async with httpx.AsyncClient(proxies=get_proxy_config()) as client:
        try:
            response = await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/divination_records",
                headers=get_supabase_headers(),
                json=data,
            )
            print(f"[Supabase] Response status: {response.status_code}")
            print(f"[Supabase] Response text: {response.text}")
            response.raise_for_status()
            result_data = response.json()
            return result_data[0]["id"]
        except Exception as e:
            print(f"[Supabase] Error: {e}")
            raise


async def update_divination_record(
    record_id: str,
    conversation: List[Message],
) -> bool:
    """更新测算记录（每次AI回复后调用）"""
    now = datetime.utcnow()

    conversation_dicts = [msg.model_dump() for msg in conversation]

    print(f"[Supabase] Updating record {record_id} with conversation: {conversation_dicts}")

    async with httpx.AsyncClient(proxies=get_proxy_config()) as client:
        try:
            response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/divination_records",
                headers=get_supabase_headers(),
                params={"id": f"eq.{record_id}"},
                json={
                    "conversation": conversation_dicts,
                },
            )
            print(f"[Supabase] Update response status: {response.status_code}")
            print(f"[Supabase] Update response text: {response.text}")
            response.raise_for_status()
            return len(response.json()) > 0
        except Exception as e:
            print(f"[Supabase] Update error: {e}")
            raise


# ==================== 新增：记忆系统相关数据库操作（第二阶段） ====================

async def get_user_divination_records(
    user_id: str,
    limit: int = 20,
    days: int = 30
) -> List[DivinationRecord]:
    """
    获取用户的历史测算记录（用于记忆系统）

    零影响：新增函数，不影响现有功能
    """
    from datetime import timedelta

    since_date = datetime.utcnow() - timedelta(days=days)

    async with httpx.AsyncClient(proxies=get_proxy_config()) as client:
        try:
            response = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/divination_records",
                headers=get_supabase_headers(),
                params={
                    "user_id": f"eq.{user_id}",
                    "created_at": f"gte.{since_date.isoformat()}",
                    "order": "created_at.desc",
                    "limit": str(limit),
                },
            )
            print(f"[Supabase] Get records response: {response.status_code}")

            if response.status_code != 200:
                return []

            result_data = response.json()

            records = []
            for item in result_data:
                try:
                    # 解析 datetime 并移除时区信息，统一使用 offset-naive UTC
                    created_at = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
                    created_at = created_at.replace(tzinfo=None)

                    updated_at = None
                    if item.get("updated_at"):
                        updated_at = datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00"))
                        updated_at = updated_at.replace(tzinfo=None)

                    records.append(DivinationRecord(
                        id=item["id"],
                        user_id=item.get("user_id"),
                        type=item.get("type", "guanyin"),
                        question=item.get("question", ""),
                        stick=GuanyinStick(**item["result"]) if item.get("result") else None,
                        conversation=[Message(**msg) for msg in item.get("conversation", [])],
                        created_at=created_at,
                        updated_at=updated_at,
                    ))
                except Exception as e:
                    print(f"[Supabase] Parse record error: {e}")
                    continue

            return records

        except Exception as e:
            print(f"[Supabase] Get records error: {e}")
            return []


async def update_record_memory_tags(
    record_id: str,
    memory_tags: List[str],
    memory_summary: Optional[str] = None
) -> bool:
    """
    更新记录的记忆标签和摘要（零影响：新增函数）
    """
    data = {"memory_tags": memory_tags}
    if memory_summary is not None:
        data["memory_summary"] = memory_summary

    async with httpx.AsyncClient(proxies=get_proxy_config()) as client:
        try:
            response = await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/divination_records",
                headers=get_supabase_headers(),
                params={"id": f"eq.{record_id}"},
                json=data,
            )
            print(f"[Supabase] Update memory tags response: {response.status_code}")
            return response.status_code == 200 or response.status_code == 204
        except Exception as e:
            print(f"[Supabase] Update memory tags error: {e}")
            return False

# ============================================
# 新增：Agent记忆系统数据库操作（第三阶段完整）
# ============================================

async def save_agent_memory(
    user_id: str,
    memory_layer: str,
    memory_type: str,
    content: dict,
    summary: Optional[str] = None,
    topic_tags: Optional[List[str]] = None,
    stick_id: Optional[int] = None,
    expires_at: Optional[datetime] = None
) -> Optional[str]:
    """
    保存Agent记忆到数据库
    返回：成功返回 memory_id，失败返回 None
    """
    data = {
        "user_id": user_id,
        "memory_layer": memory_layer,
        "memory_type": memory_type,
        "content": content,
        "summary": summary,
        "topic_tags": topic_tags or [],
        "stick_id": stick_id,
        "relevance_score": 0.0,
    }
    if expires_at:
        data["expires_at"] = expires_at.isoformat()

    print(f"[Supabase] Saving agent memory: {data}")

    async with httpx.AsyncClient(proxies=get_proxy_config()) as client:
        try:
            response = await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/agent_memory",
                headers=get_supabase_headers(),
                json=data,
            )
            print(f"[Supabase] Save agent memory response: {response.status_code}")
            print(f"[Supabase] Response: {response.text}")

            # 检查HTTP状态码
            if response.status_code >= 400:
                print(f"[Supabase] Error: HTTP {response.status_code}")
                # 尝试更详细的错误信息
                try:
                    error_detail = response.json()
                    print(f"[Supabase] Error detail: {error_detail}")
                except:
                    pass
                return None

            result_data = response.json()
            if result_data and len(result_data) > 0:
                return result_data[0].get("id")
            return None
        except Exception as e:
            print(f"[Supabase] Save agent memory error: {e}")
            import traceback
            traceback.print_exc()
            return None
