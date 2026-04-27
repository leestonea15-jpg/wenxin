"""
状态机管理 - Agent Harness核心组件
管理Agent执行过程中的所有状态转换
"""
from enum import Enum, auto
from typing import Set, Dict, Optional
from dataclasses import dataclass
from datetime import datetime


class AgentState(Enum):
    """Agent状态枚举"""
    IDLE = auto()              # 空闲状态
    INPUT_COLLECTING = auto()  # 收集用户输入
    DRAWING = auto()           # 抽签中
    INTERPRETING = auto()      # 初次解读中
    FOLLOWUP = auto()          # 追问处理中
    REFLECTING = auto()        # 反思中
    COMPLETED = auto()         # 完成
    ERROR = auto()             # 错误状态


class AgentEvent(Enum):
    """触发状态转换的事件"""
    START_INPUT = auto()
    START_DRAW = auto()
    START_INTERPRET = auto()
    START_FOLLOWUP = auto()
    START_REFLECT = auto()
    COMPLETE = auto()
    ERROR_OCCUR = auto()
    RESET = auto()


@dataclass
class StateTransition:
    """状态转换记录"""
    from_state: AgentState
    to_state: AgentState
    event: AgentEvent
    timestamp: datetime
    metadata: Optional[Dict] = None


class AgentStateMachine:
    """
    Agent状态机 - 管理所有状态转换

    状态转换图：
    IDLE → INPUT_COLLECTING → DRAWING → INTERPRETING → REFLECTING → COMPLETED
           ↓                    ↓           ↓             ↓
           ERROR ←--------------┴-----------┴-------------┘

    任何状态都可以通过RESET回到IDLE
    """

    # 允许的状态转换
    _ALLOWED_TRANSITIONS: Dict[AgentState, Set[AgentState]] = {
        AgentState.IDLE: {
            AgentState.INPUT_COLLECTING,
            AgentState.ERROR,
        },
        AgentState.INPUT_COLLECTING: {
            AgentState.DRAWING,
            AgentState.IDLE,
            AgentState.ERROR,
        },
        AgentState.DRAWING: {
            AgentState.INTERPRETING,
            AgentState.COMPLETED,
            AgentState.ERROR,
        },
        AgentState.INTERPRETING: {
            AgentState.REFLECTING,
            AgentState.COMPLETED,
            AgentState.FOLLOWUP,
            AgentState.ERROR,
        },
        AgentState.FOLLOWUP: {
            AgentState.REFLECTING,
            AgentState.COMPLETED,
            AgentState.FOLLOWUP,
            AgentState.ERROR,
        },
        AgentState.REFLECTING: {
            AgentState.COMPLETED,
            AgentState.INTERPRETING,
            AgentState.FOLLOWUP,
            AgentState.ERROR,
        },
        AgentState.COMPLETED: {
            AgentState.FOLLOWUP,
            AgentState.IDLE,
            AgentState.ERROR,
        },
        AgentState.ERROR: {
            AgentState.IDLE,
            AgentState.INTERPRETING,
            AgentState.FOLLOWUP,
        },
    }

    def __init__(self):
        self._current_state: AgentState = AgentState.IDLE
        self._history: list[StateTransition] = []
        self._state_entry_time: datetime = datetime.now()

    @property
    def current_state(self) -> AgentState:
        """获取当前状态"""
        return self._current_state

    @property
    def state_duration_seconds(self) -> float:
        """获取当前状态持续时间（秒）"""
        return (datetime.now() - self._state_entry_time).total_seconds()

    @property
    def history(self) -> list[StateTransition]:
        """获取状态转换历史"""
        return self._history.copy()

    def can_transition_to(self, target_state: AgentState) -> bool:
        """检查是否可以转换到目标状态"""
        return target_state in self._ALLOWED_TRANSITIONS.get(self._current_state, set())

    def can_handle_event(self, event: AgentEvent) -> bool:
        """检查是否可以处理指定事件"""
        # 简化版：事件到状态的映射
        event_to_state = {
            AgentEvent.START_INPUT: AgentState.INPUT_COLLECTING,
            AgentEvent.START_DRAW: AgentState.DRAWING,
            AgentEvent.START_INTERPRET: AgentState.INTERPRETING,
            AgentEvent.START_FOLLOWUP: AgentState.FOLLOWUP,
            AgentEvent.START_REFLECT: AgentState.REFLECTING,
            AgentEvent.COMPLETE: AgentState.COMPLETED,
            AgentEvent.ERROR_OCCUR: AgentState.ERROR,
            AgentEvent.RESET: AgentState.IDLE,
        }
        target_state = event_to_state.get(event)
        if target_state is None:
            return False
        if event == AgentEvent.RESET:
            return True  # RESET总是允许
        return self.can_transition_to(target_state)

    def transition(self, event: AgentEvent, metadata: Optional[Dict] = None) -> bool:
        """
        执行状态转换

        Args:
            event: 触发事件
            metadata: 附加元数据

        Returns:
            是否成功转换
        """
        # 事件到目标状态的映射
        event_to_state = {
            AgentEvent.START_INPUT: AgentState.INPUT_COLLECTING,
            AgentEvent.START_DRAW: AgentState.DRAWING,
            AgentEvent.START_INTERPRET: AgentState.INTERPRETING,
            AgentEvent.START_FOLLOWUP: AgentState.FOLLOWUP,
            AgentEvent.START_REFLECT: AgentState.REFLECTING,
            AgentEvent.COMPLETE: AgentState.COMPLETED,
            AgentEvent.ERROR_OCCUR: AgentState.ERROR,
            AgentEvent.RESET: AgentState.IDLE,
        }

        target_state = event_to_state.get(event)
        if target_state is None:
            return False

        # RESET特殊处理
        if event == AgentEvent.RESET:
            old_state = self._current_state
            self._current_state = target_state
            self._record_transition(old_state, target_state, event, metadata)
            return True

        # 检查转换是否允许
        if not self.can_transition_to(target_state):
            return False

        # 执行转换
        old_state = self._current_state
        self._current_state = target_state
        self._record_transition(old_state, target_state, event, metadata)
        return True

    def _record_transition(
        self,
        from_state: AgentState,
        to_state: AgentState,
        event: AgentEvent,
        metadata: Optional[Dict]
    ):
        """记录状态转换"""
        transition = StateTransition(
            from_state=from_state,
            to_state=to_state,
            event=event,
            timestamp=datetime.now(),
            metadata=metadata
        )
        self._history.append(transition)
        self._state_entry_time = datetime.now()

        # 保留最近100条历史
        if len(self._history) > 100:
            self._history = self._history[-100:]

    def reset(self):
        """重置状态机到初始状态"""
        self.transition(AgentEvent.RESET)

    def get_state(self) -> AgentState:
        """获取当前状态（兼容方法）"""
        return self._current_state
