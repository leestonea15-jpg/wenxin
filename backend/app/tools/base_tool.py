"""
工具抽象基类 - Agent工具调用框架

零影响原则：
- 完全独立，不修改现有代码
"""
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ToolResult:
    """工具执行结果"""
    success: bool
    content: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class BaseTool(ABC):
    """工具抽象基类"""

    # 工具名称（唯一标识）
    name: str = ""

    # 工具描述
    description: str = ""

    # 工具参数说明
    param_schema: Dict[str, Any] = None

    def __init__(self):
        if self.param_schema is None:
            self.param_schema = {}

    @abstractmethod
    async def execute(self, params: Dict[str, Any]) -> ToolResult:
        """
        执行工具

        Args:
            params: 工具参数

        Returns:
            ToolResult: 执行结果
        """
        pass

    def validate_params(self, params: Dict[str, Any]) -> bool:
        """
        验证参数（可选重写）

        Args:
            params: 工具参数

        Returns:
            bool: 是否验证通过
        """
        return True


class ToolRegistry:
    """工具注册器 - 管理所有可用工具"""

    _tools: Dict[str, BaseTool] = {}

    @classmethod
    def register(cls, tool_class):
        """
        注册工具类

        用法:
            @ToolRegistry.register
            class MyTool(BaseTool):
                ...
        """
        tool_instance = tool_class()
        cls._tools[tool_instance.name] = tool_instance
        return tool_class

    @classmethod
    def get_tool(cls, name: str) -> Optional[BaseTool]:
        """获取工具实例"""
        return cls._tools.get(name)

    @classmethod
    def list_tools(cls) -> Dict[str, Dict[str, Any]]:
        """列出所有可用工具"""
        return {
            name: {
                "name": tool.name,
                "description": tool.description,
                "param_schema": tool.param_schema,
            }
            for name, tool in cls._tools.items()
        }

    @classmethod
    def clear(cls):
        """清空所有工具（测试用）"""
        cls._tools.clear()
