"""
检查点机制 - 支持中断恢复

零影响原则：
- 完全独立，不修改现有代码
- 可选使用
"""
from typing import Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
import json
import uuid


@dataclass
class AgentCheckpoint:
    """Agent检查点"""
    checkpoint_id: str
    agent_id: str
    session_id: str
    user_id: Optional[str]
    agent_state: Dict[str, Any]
    context_data: Optional[Dict[str, Any]] = None
    memory_snapshot: Optional[Dict[str, Any]] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "checkpoint_id": self.checkpoint_id,
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "agent_state": self.agent_state,
            "context_data": self.context_data,
            "memory_snapshot": self.memory_snapshot,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AgentCheckpoint":
        """从字典创建"""
        return cls(
            checkpoint_id=data["checkpoint_id"],
            agent_id=data["agent_id"],
            session_id=data["session_id"],
            user_id=data.get("user_id"),
            agent_state=data["agent_state"],
            context_data=data.get("context_data"),
            memory_snapshot=data.get("memory_snapshot"),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
        )


class CheckpointManager:
    """
    检查点管理器

    零影响原则：
    - 完全独立
    - 可选使用
    - 不修改现有数据库表（或用第三阶段的新表）
    """

    def __init__(self):
        # 第二阶段：简单的内存存储
        # 第三阶段：可以使用数据库持久化
        self._checkpoints: Dict[str, AgentCheckpoint] = {}

    def save_checkpoint(
        self,
        session_id: str,
        agent_state: Dict[str, Any],
        context_data: Optional[Dict[str, Any]] = None,
        memory_snapshot: Optional[Dict[str, Any]] = None,
        agent_id: str = "guanyin_agent",
        user_id: Optional[str] = None,
    ) -> str:
        """
        保存检查点

        Args:
            session_id: 会话ID
            agent_state: Agent状态
            context_data: 上下文数据（可选）
            memory_snapshot: 记忆快照（可选）
            agent_id: Agent标识
            user_id: 用户ID（可选）

        Returns:
            checkpoint_id: 检查点ID
        """
        checkpoint_id = str(uuid.uuid4())

        checkpoint = AgentCheckpoint(
            checkpoint_id=checkpoint_id,
            agent_id=agent_id,
            session_id=session_id,
            user_id=user_id,
            agent_state=agent_state,
            context_data=context_data,
            memory_snapshot=memory_snapshot,
        )

        self._checkpoints[checkpoint_id] = checkpoint

        # 也保存一个按session_id的索引，方便查找
        # （简单实现：用session_id作为key的另一个字典）
        if not hasattr(self, '_checkpoints_by_session'):
            self._checkpoints_by_session: Dict[str, AgentCheckpoint] = {}
        self._checkpoints_by_session[session_id] = checkpoint

        print(f"[Checkpoint] Saved checkpoint: {checkpoint_id} for session: {session_id}")
        return checkpoint_id

    def load_checkpoint(self, checkpoint_id: str) -> Optional[AgentCheckpoint]:
        """
        加载检查点

        Args:
            checkpoint_id: 检查点ID

        Returns:
            AgentCheckpoint: 检查点，不存在返回None
        """
        return self._checkpoints.get(checkpoint_id)

    def load_latest_checkpoint(self, session_id: str) -> Optional[AgentCheckpoint]:
        """
        加载某会话的最新检查点

        Args:
            session_id: 会话ID

        Returns:
            AgentCheckpoint: 检查点，不存在返回None
        """
        if hasattr(self, '_checkpoints_by_session'):
            return self._checkpoints_by_session.get(session_id)
        return None

    def delete_checkpoint(self, checkpoint_id: str) -> bool:
        """
        删除检查点

        Args:
            checkpoint_id: 检查点ID

        Returns:
            是否删除成功
        """
        if checkpoint_id in self._checkpoints:
            del self._checkpoints[checkpoint_id]
            return True
        return False

    def list_checkpoints(self, session_id: Optional[str] = None, limit: int = 50) -> list:
        """
        列出检查点

        Args:
            session_id: 会话ID（可选，过滤用）
            limit: 返回数量限制

        Returns:
            检查点列表
        """
        checkpoints = list(self._checkpoints.values())

        if session_id:
            checkpoints = [cp for cp in checkpoints if cp.session_id == session_id]

        # 按时间倒序
        checkpoints.sort(key=lambda x: x.created_at, reverse=True)

        return checkpoints[:limit]

    def clear(self):
        """清空所有检查点"""
        self._checkpoints.clear()
        if hasattr(self, '_checkpoints_by_session'):
            self._checkpoints_by_session.clear()
