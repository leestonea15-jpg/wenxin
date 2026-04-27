"""
记忆系统 - 观音灵签Agent核心组件

第一阶段实现：工作记忆（当前会话）
第二阶段完善：短期+长期记忆 + 混合检索
"""
from typing import List, Optional, Dict, Any
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import deque
import uuid

from app.models.schemas import GuanyinStick, Message
from app.services.database import (
    get_user_divination_records,
    save_agent_memory
)
from app.harness.permissions import get_access_control


class MemoryLayer(Enum):
    """记忆层级"""
    WORKING = "working"      # 工作记忆：当前会话
    SHORT_TERM = "short_term"  # 短期记忆：最近7天
    LONG_TERM = "long_term"    # 长期记忆：所有历史
    KNOWLEDGE = "knowledge"    # 知识库：固定知识


@dataclass
class MemoryItem:
    """记忆项"""
    id: str
    user_id: Optional[str]
    layer: MemoryLayer
    memory_type: str  # "divination", "conversation", "user_profile"
    content: Dict[str, Any]
    summary: Optional[str] = None
    topic_tags: Optional[List[str]] = None
    relevance_score: float = 0.0
    stick_id: Optional[int] = None
    created_at: datetime = None
    expires_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.topic_tags is None:
            self.topic_tags = []


class WorkingMemory:
    """
    工作记忆 - 当前会话的记忆

    特点：
    - 会话结束后清空
    - 快速存取
    - 包含当前签文、对话历史等
    """

    def __init__(self, max_conversation_turns: int = 10):
        self._current_stick: Optional[GuanyinStick] = None
        self._conversation: deque[Message] = deque(maxlen=max_conversation_turns)
        self._user_question: Optional[str] = None
        self._divination_record_id: Optional[str] = None
        self._session_start_time: datetime = datetime.now()
        self._topic_tags: List[str] = []

    @property
    def current_stick(self) -> Optional[GuanyinStick]:
        return self._current_stick

    @current_stick.setter
    def current_stick(self, stick: GuanyinStick):
        self._current_stick = stick

    @property
    def user_question(self) -> Optional[str]:
        return self._user_question

    @user_question.setter
    def user_question(self, question: str):
        self._user_question = question

    @property
    def divination_record_id(self) -> Optional[str]:
        return self._divination_record_id

    @divination_record_id.setter
    def divination_record_id(self, record_id: str):
        self._divination_record_id = record_id

    @property
    def topic_tags(self) -> List[str]:
        return self._topic_tags

    def add_topic_tags(self, tags: List[str]):
        """添加话题标签"""
        self._topic_tags.extend(tags)
        self._topic_tags = list(set(self._topic_tags))  # 去重

    def add_message(self, message: Message):
        """添加对话消息"""
        self._conversation.append(message)

    def get_conversation(self) -> List[Message]:
        """获取完整对话历史"""
        return list(self._conversation)

    def get_recent_messages(self, limit: int = 5) -> List[Message]:
        """获取最近N条消息"""
        return list(self._conversation)[-limit:]

    def clear(self):
        """清空工作记忆"""
        self._current_stick = None
        self._conversation.clear()
        self._user_question = None
        self._divination_record_id = None
        self._topic_tags = []
        self._session_start_time = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典（用于调试）"""
        return {
            "has_stick": self._current_stick is not None,
            "stick_id": self._current_stick.id if self._current_stick else None,
            "conversation_turns": len(self._conversation),
            "user_question": self._user_question,
            "topic_tags": self._topic_tags,
            "session_duration_seconds": (datetime.now() - self._session_start_time).total_seconds()
        }


class GuanyinAgentMemory:
    """
    观音灵签Agent记忆系统

    第一阶段：工作记忆
    第二阶段：短期+长期记忆 + 混合检索
    第三阶段：智能检索、摘要生成
    """

    def __init__(self, user_id: Optional[str] = None):
        self.user_id = user_id
        self.working_memory = WorkingMemory()

        # 第二阶段：完整记忆系统
        self._short_term_memory: List[MemoryItem] = []  # 最近7天
        self._long_term_memory: List[MemoryItem] = []   # 所有历史（摘要）
        self._loaded_from_db = False

    def set_user_id(self, user_id: str):
        """设置用户ID"""
        self.user_id = user_id
        self._loaded_from_db = False  # 用户变更，需要重新加载

    async def load_user_memories(self, days: int = 30, acting_user_id: Optional[str] = None):
        """
        从数据库加载用户记忆（第二阶段新增）

        零影响：按需加载，不影响现有功能

        Args:
            days: 加载最近几天的记忆
            acting_user_id: 当前操作者的用户ID（用于权限检查）
        """
        if not self.user_id or self._loaded_from_db:
            return

        # 权限检查
        access_control = get_access_control()
        target_user_id = self.user_id
        current_user_id = acting_user_id or self.user_id

        is_allowed, reason = access_control.check_memory_access(
            access_type="read",
            target_user_id=target_user_id,
            current_user_id=current_user_id
        )

        if not is_allowed:
            print(f"[Memory] Permission denied: {reason}")
            return

        try:
            records = await get_user_divination_records(self.user_id, limit=50, days=days)

            self._short_term_memory = []
            self._long_term_memory = []

            seven_days_ago = datetime.utcnow() - timedelta(days=7)

            for record in records:
                if not record.stick:
                    continue

                # 生成记忆项
                memory_item = self._record_to_memory_item(record)

                # 统一时区处理：把 record.created_at 转为 offset-naive UTC
                record_created = record.created_at
                if record_created.tzinfo is not None:
                    record_created = record_created.replace(tzinfo=None)

                if record_created >= seven_days_ago:
                    self._short_term_memory.append(memory_item)
                else:
                    self._long_term_memory.append(memory_item)

            self._loaded_from_db = True
            print(f"[Memory] Loaded {len(self._short_term_memory)} short-term, {len(self._long_term_memory)} long-term memories")

        except Exception as e:
            print(f"[Memory] Load error: {e}")

    def _record_to_memory_item(self, record) -> MemoryItem:
        """将数据库记录转换为记忆项"""
        # 从记录中提取摘要
        summary = None
        if hasattr(record, 'memory_summary') and record.memory_summary:
            summary = record.memory_summary
        else:
            # 生成简单摘要
            summary = f"关于「{record.question}」的{record.stick.title}({record.stick.level})"

        # 提取话题标签
        topic_tags = []
        if hasattr(record, 'memory_tags') and record.memory_tags:
            topic_tags = record.memory_tags
        else:
            topic_tags = self.extract_topic_tags(record.question)

        return MemoryItem(
            id=str(uuid.uuid4()),
            user_id=record.user_id,
            layer=MemoryLayer.SHORT_TERM,
            memory_type="divination",
            content={
                "question": record.question,
                "stick": record.stick.model_dump() if record.stick else None,
            },
            summary=summary,
            topic_tags=topic_tags,
            relevance_score=0.0,
            stick_id=record.stick.id if record.stick else None,
            created_at=record.created_at,
        )

    def retrieve(
        self,
        query: str,
        limit: int = 3,
        max_tokens: int = 500
    ) -> List[MemoryItem]:
        """
        检索相关记忆（第二阶段：混合检索策略）

        策略：
        1. 标签匹配
        2. 时间衰减加权
        3. 相关度排序
        """
        candidates: List[MemoryItem] = []

        # 合并各层记忆
        candidates.extend(self._short_term_memory)
        candidates.extend(self._long_term_memory)

        if not candidates:
            return []

        # 提取查询标签
        query_tags = self.extract_topic_tags(query)

        # 计算相关度分数
        for item in candidates:
            score = 0.0

            # 1. 标签匹配得分
            if item.topic_tags and query_tags:
                match_count = len(set(item.topic_tags) & set(query_tags))
                score += match_count * 2.0

            # 2. 时间衰减加权
            days_old = (datetime.utcnow() - item.created_at).days
            time_decay = max(0.1, 1.0 - (days_old * 0.05))
            score *= time_decay

            # 3. 关键词简单匹配
            for word in query:
                if word in (item.summary or "") or word in (item.content.get("question", "")):
                    score += 0.5

            item.relevance_score = score

        # 排序
        candidates.sort(key=lambda x: x.relevance_score, reverse=True)

        # 取Top N
        return candidates[:limit]

    def build_context_for_prompt(self, query: str) -> Optional[str]:
        """
        构建记忆Context（用于LLM提示词）

        第二阶段：完整实现
        """
        relevant_memories = self.retrieve(query, limit=3)
        if not relevant_memories:
            return None

        content = "<memory>\n【相关记忆】\n"
        for i, mem in enumerate(relevant_memories, 1):
            content += f"{i}. {mem.summary}\n"
        content += "</memory>"
        return content

    def store_working_memory(
        self,
        stick: Optional[GuanyinStick] = None,
        question: Optional[str] = None,
        message: Optional[Message] = None,
        record_id: Optional[str] = None
    ):
        """存储到工作记忆"""
        if stick:
            self.working_memory.current_stick = stick
        if question:
            self.working_memory.user_question = question
        if message:
            self.working_memory.add_message(message)
        if record_id:
            self.working_memory.divination_record_id = record_id

    def clear_working_memory(self):
        """清空工作记忆"""
        self.working_memory.clear()

    def extract_topic_tags(self, question: str) -> List[str]:
        """从问题中提取话题标签"""
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

    def save_to_short_term(self, question: str, stick: GuanyinStick, summary: Optional[str] = None, acting_user_id: Optional[str] = None):
        """保存当前会话到短期记忆（第二阶段新增）"""
        # 权限检查
        if self.user_id:
            access_control = get_access_control()
            current_user_id = acting_user_id or self.user_id
            is_allowed, reason = access_control.check_memory_access(
                access_type="write",
                target_user_id=self.user_id,
                current_user_id=current_user_id
            )

            if not is_allowed:
                print(f"[Memory] Permission denied: {reason}")
                return

        tags = self.extract_topic_tags(question)
        memory_summary = summary or f"关于「{question}」的{stick.title}({stick.level})"

        item = MemoryItem(
            id=str(uuid.uuid4()),
            user_id=self.user_id,
            layer=MemoryLayer.SHORT_TERM,
            memory_type="divination",
            content={
                "question": question,
                "stick": stick.model_dump(),
            },
            summary=memory_summary,
            topic_tags=tags,
            relevance_score=0.0,
            stick_id=stick.id,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )

        self._short_term_memory.insert(0, item)

        # 限制短期记忆数量
        if len(self._short_term_memory) > 50:
            self._short_term_memory = self._short_term_memory[:50]

        # 新增：真正保存到数据库！
        if self.user_id:
            async def _save_to_db():
                try:
                    await save_agent_memory(
                        user_id=self.user_id,
                        memory_layer="short_term",
                        memory_type="divination",
                        content=item.content,
                        summary=memory_summary,
                        topic_tags=tags,
                        stick_id=stick.id,
                        expires_at=item.expires_at
                    )
                except Exception as e:
                    print(f"[Memory] Save to DB error (non-blocking): {e}")

            # 启动异步保存（不阻塞主流程）
            import asyncio
            try:
                asyncio.create_task(_save_to_db())
            except:
                pass  # 忽略错误，不影响主流程

    # ==================== 第三阶段新增：长期记忆和AI摘要 ====================

    def save_to_long_term(
        self,
        question: str,
        stick: GuanyinStick,
        conversation: List[Any],
        ai_summary: Optional[str] = None
    ):
        """
        保存到长期记忆（第三阶段新增）

        零影响：可选调用
        """
        tags = self.extract_topic_tags(question)

        # 如果没有AI生成的摘要，生成一个简单摘要
        if not ai_summary:
            ai_summary = self._generate_simple_summary(question, stick)

        item = MemoryItem(
            id=str(uuid.uuid4()),
            user_id=self.user_id,
            layer=MemoryLayer.LONG_TERM,
            memory_type="divination",
            content={
                "question": question,
                "stick": stick.model_dump(),
                "conversation_length": len(conversation)
            },
            summary=ai_summary,
            topic_tags=tags,
            relevance_score=0.0,
            stick_id=stick.id,
            expires_at=None,  # 长期记忆永不过期
        )

        self._long_term_memory.insert(0, item)

        # 限制长期记忆数量
        if len(self._long_term_memory) > 200:
            self._long_term_memory = self._long_term_memory[:200]

    def _generate_simple_summary(self, question: str, stick: GuanyinStick) -> str:
        """
        生成简单摘要（第三阶段新增）

        注意：完整的AI生成摘要需要调用LLM，这是一个简化版本
        """
        return f"{stick.level}「{stick.title}」: 用户询问「{question[:20]}...」"

    async def generate_ai_summary(
        self,
        question: str,
        stick: GuanyinStick,
        conversation: List[Any]
    ) -> Optional[str]:
        """
        调用AI生成摘要（第三阶段预留）

        零影响：可选调用，不影响现有功能

        注意：这是一个预留接口，实际实现需要调用LLM
        """
        # 第三阶段预留：实际实现需要调用LLM
        # 这里返回简化版本
        return self._generate_simple_summary(question, stick)

    def cleanup_expired_memories(self):
        """
        清理过期记忆（第三阶段新增）

        零影响：可选调用
        """
        now = datetime.utcnow()
        self._short_term_memory = [
            m for m in self._short_term_memory
            if m.expires_at is None or m.expires_at > now
        ]

    def get_memory_statistics(self) -> Dict[str, Any]:
        """
        获取记忆统计（第三阶段新增）

        零影响：可选调用
        """
        return {
            "working_memory": {
                "has_stick": self.working_memory.current_stick is not None,
                "conversation_turns": len(self.working_memory.get_conversation()),
            },
            "short_term_memory": {
                "count": len(self._short_term_memory),
                "expires_soon": sum(
                    1 for m in self._short_term_memory
                    if m.expires_at and (m.expires_at - datetime.utcnow()) < timedelta(days=1)
                )
            },
            "long_term_memory": {
                "count": len(self._long_term_memory),
                "topics": list(set(tag for m in self._long_term_memory for tag in (m.topic_tags or [])))
            },
        }
