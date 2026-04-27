"""
工具协调器 - 管理工具调用

零影响原则：
- 完全独立，不修改现有代码
"""
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from app.tools.base_tool import ToolRegistry, BaseTool, ToolResult
from .observability import get_observability
from .permissions import get_access_control


@dataclass
class ToolCall:
    """工具调用记录"""
    tool_name: str
    params: Dict[str, Any]
    result: Optional[ToolResult] = None
    success: bool = False
    error: Optional[str] = None
    duration_ms: float = 0.0


class ToolOrchestrator:
    """
    工具协调器 - 负责任务调度、执行、监控

    零影响原则：
    - 完全独立模块
    - 不修改现有代码
    - 可选使用
    """

    def __init__(self):
        self.observability = get_observability()
        self._call_history: List[ToolCall] = []

    async def call_tool(
        self,
        tool_name: str,
        params: Dict[str, Any],
        trace_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> ToolResult:
        """
        调用工具

        Args:
            tool_name: 工具名称
            params: 工具参数
            trace_id: 追踪ID（可选）
            user_id: 用户ID（可选，用于权限检查）

        Returns:
            ToolResult: 工具执行结果
        """
        import time
        start_time = time.time()

        tool_call = ToolCall(
            tool_name=tool_name,
            params=params
        )

        try:
            self.observability.log(
                "INFO",
                f"Calling tool: {tool_name}",
                trace_id=trace_id,
                params=params,
                user_id=user_id
            )

            # 权限检查
            access_control = get_access_control()
            is_allowed, reason = access_control.check_tool_access(
                tool_name=tool_name,
                user_id=user_id,
                tool_params=params
            )

            if not is_allowed:
                error_msg = f"Permission denied: {reason}"
                self.observability.log(
                    "WARNING",
                    error_msg,
                    trace_id=trace_id
                )
                tool_call.error = error_msg
                tool_call.success = False
                return ToolResult(
                    success=False,
                    content=error_msg,
                    error="permission_denied"
                )

            # 获取工具实例
            tool = ToolRegistry.get_tool(tool_name)
            if not tool:
                error_msg = f"Tool not found: {tool_name}"
                tool_call.error = error_msg
                tool_call.success = False
                return ToolResult(
                    success=False,
                    content=error_msg,
                    error="tool_not_found"
                )

            # 验证参数
            if not tool.validate_params(params):
                error_msg = f"Invalid params for tool: {tool_name}"
                tool_call.error = error_msg
                tool_call.success = False
                return ToolResult(
                    success=False,
                    content=error_msg,
                    error="invalid_params"
                )

            # 执行工具
            result = await tool.execute(params)

            tool_call.result = result
            tool_call.success = result.success

            self.observability.log(
                "INFO" if result.success else "ERROR",
                f"Tool {tool_name} called, success: {result.success}",
                trace_id=trace_id
            )

            return result

        except Exception as e:
            error_msg = f"Tool call error: {str(e)}"
            tool_call.error = error_msg
            tool_call.success = False

            self.observability.log(
                "ERROR",
                error_msg,
                trace_id=trace_id,
                error=str(e)
            )

            return ToolResult(
                success=False,
                content=error_msg,
                error=str(e)
            )

        finally:
            tool_call.duration_ms = (time.time() - start_time) * 1000
            self._call_history.append(tool_call)

            # 限制历史记录数量
            if len(self._call_history) > 100:
                self._call_history = self._call_history[-100:]

    def list_available_tools(self) -> Dict[str, Dict[str, Any]]:
        """列出所有可用工具"""
        return ToolRegistry.list_tools()

    def get_call_history(self, limit: int = 50) -> List[ToolCall]:
        """获取工具调用历史"""
        return self._call_history[-limit:]

    def clear_history(self):
        """清空调用历史"""
        self._call_history.clear()
