"""
多步规划引擎 - 用于生成执行计划

零影响原则：
- 完全独立模块
- 可选使用
- 不修改现有代码
"""
from typing import List, Dict, Any, Optional
from enum import Enum, auto
from dataclasses import dataclass
from datetime import datetime


class StepType(Enum):
    """步骤类型"""
    RETRIEVE_MEMORY = auto()      # 检索记忆
    RETRIEVE_KNOWLEDGE = auto()   # 检索知识库
    GENERATE_RESPONSE = auto()    # 生成响应
    REFLECT = auto()              # 反思检查


@dataclass
class PlanStep:
    """规划步骤"""
    step_id: str
    step_type: StepType
    description: str
    params: Dict[str, Any] = None
    is_completed: bool = False
    result: Optional[Any] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.params is None:
            self.params = {}


@dataclass
class ExecutionPlan:
    """执行计划"""
    plan_id: str
    goal: str
    steps: List[PlanStep]
    created_at: datetime = None
    is_completed: bool = False

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    def get_pending_steps(self) -> List[PlanStep]:
        """获取待执行步骤"""
        return [s for s in self.steps if not s.is_completed]

    def get_next_step(self) -> Optional[PlanStep]:
        """获取下一步"""
        pending = self.get_pending_steps()
        return pending[0] if pending else None


class PlanningEngine:
    """
    多步规划引擎

    零影响原则：
    - 完全独立
    - 可选使用
    - 不修改现有代码
    """

    def __init__(self):
        self._plans: Dict[str, ExecutionPlan] = {}

    def create_interpretation_plan(
        self,
        question: str,
        stick_id: int,
        user_id: Optional[str] = None
    ) -> ExecutionPlan:
        """
        创建初次解读的执行计划

        Args:
            question: 用户问题
            stick_id: 签文ID
            user_id: 用户ID（可选）

        Returns:
            ExecutionPlan: 执行计划
        """
        import uuid

        steps = []

        # 步骤1：检索相关记忆
        if user_id:
            steps.append(PlanStep(
                step_id=str(uuid.uuid4()),
                step_type=StepType.RETRIEVE_MEMORY,
                description="检索用户相关历史记忆",
                params={"query": question, "limit": 3}
            ))

        # 步骤2：获取签文知识
        steps.append(PlanStep(
            step_id=str(uuid.uuid4()),
            step_type=StepType.RETRIEVE_KNOWLEDGE,
            description="获取签文详细知识",
            params={"stick_id": stick_id, "info_type": "full"}
        ))

        # 步骤3：生成解读
        steps.append(PlanStep(
            step_id=str(uuid.uuid4()),
            step_type=StepType.GENERATE_RESPONSE,
            description="结合上下文生成签文解读",
            params={"question": question}
        ))

        # 步骤4：反思检查
        steps.append(PlanStep(
            step_id=str(uuid.uuid4()),
            step_type=StepType.REFLECT,
            description="检查解读质量，必要时修正",
            params={}
        ))

        plan = ExecutionPlan(
            plan_id=str(uuid.uuid4()),
            goal=f"解读签文: {question[:50]}...",
            steps=steps
        )

        self._plans[plan.plan_id] = plan
        return plan

    def create_followup_plan(
        self,
        question: str,
        stick_id: int,
        history_length: int,
        user_id: Optional[str] = None
    ) -> ExecutionPlan:
        """
        创建追问的执行计划

        Args:
            question: 用户问题
            stick_id: 签文ID
            history_length: 对话历史长度
            user_id: 用户ID（可选）

        Returns:
            ExecutionPlan: 执行计划
        """
        import uuid

        steps = []

        # 步骤1：检索相关记忆（如果有用户）
        if user_id:
            steps.append(PlanStep(
                step_id=str(uuid.uuid4()),
                step_type=StepType.RETRIEVE_MEMORY,
                description="检索相关历史记录",
                params={"query": question, "limit": 2}
            ))

        # 步骤2：生成回复
        steps.append(PlanStep(
            step_id=str(uuid.uuid4()),
            step_type=StepType.GENERATE_RESPONSE,
            description="根据对话历史生成回复",
            params={"question": question}
        ))

        # 步骤3：反思检查
        steps.append(PlanStep(
            step_id=str(uuid.uuid4()),
            step_type=StepType.REFLECT,
            description="检查回复质量",
            params={}
        ))

        plan = ExecutionPlan(
            plan_id=str(uuid.uuid4()),
            goal=f"回答追问: {question[:50]}...",
            steps=steps
        )

        self._plans[plan.plan_id] = plan
        return plan

    def mark_step_completed(
        self,
        plan_id: str,
        step_id: str,
        result: Any,
        error: Optional[str] = None
    ) -> bool:
        """
        标记步骤完成

        Args:
            plan_id: 计划ID
            step_id: 步骤ID
            result: 步骤结果
            error: 错误信息（如果有）

        Returns:
            是否成功
        """
        plan = self._plans.get(plan_id)
        if not plan:
            return False

        for step in plan.steps:
            if step.step_id == step_id:
                step.is_completed = True
                step.result = result
                step.error = error
                step.completed_at = datetime.now()

                # 检查是否全部完成
                plan.is_completed = all(s.is_completed for s in plan.steps)
                return True

        return False

    def get_plan(self, plan_id: str) -> Optional[ExecutionPlan]:
        """获取计划"""
        return self._plans.get(plan_id)

    def get_plan_summary(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """获取计划摘要"""
        plan = self._plans.get(plan_id)
        if not plan:
            return None

        return {
            "plan_id": plan.plan_id,
            "goal": plan.goal,
            "total_steps": len(plan.steps),
            "completed_steps": sum(1 for s in plan.steps if s.is_completed),
            "is_completed": plan.is_completed,
            "created_at": plan.created_at.isoformat(),
        }

    def list_plans(self, limit: int = 50) -> List[Dict[str, Any]]:
        """列出所有计划"""
        plans = list(self._plans.values())
        plans.sort(key=lambda x: x.created_at, reverse=True)
        return [self.get_plan_summary(p.plan_id) for p in plans[:limit]]

    def clear(self):
        """清空所有计划"""
        self._plans.clear()
