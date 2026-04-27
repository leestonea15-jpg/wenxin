"""
签文知识库工具 - 提供签文相关知识查询

零影响原则：
- 完全独立，不修改现有代码
"""
from typing import Dict, Any
from app.tools.base_tool import BaseTool, ToolResult, ToolRegistry
from app.services.guanyin import get_stick_by_id, load_guanyin_sticks


@ToolRegistry.register
class StickKnowledgeTool(BaseTool):
    """签文知识库工具"""

    name: str = "stick_knowledge"

    description: str = "查询观音灵签签文的详细信息，包括签诗、典故、释义等"

    param_schema: Dict[str, Any] = {
        "stick_id": {
            "type": "integer",
            "description": "签文ID（1-100）",
            "required": True,
        },
        "info_type": {
            "type": "string",
            "description": "要查询的信息类型：full(全部), poem(签诗), story(典故), meaning(释义)",
            "required": False,
            "default": "full",
        },
    }

    async def execute(self, params: Dict[str, Any]) -> ToolResult:
        """执行签文知识查询"""
        try:
            stick_id_raw = params.get("stick_id")
            if not stick_id_raw:
                return ToolResult(
                    success=False,
                    content="请提供签文ID",
                    error="missing_stick_id"
                )

            # 确保 stick_id 是整数
            try:
                stick_id = int(stick_id_raw)
            except (ValueError, TypeError):
                return ToolResult(
                    success=False,
                    content=f"签文ID格式不正确：{stick_id_raw}",
                    error="invalid_stick_id_format"
                )

            # 确保签文已加载
            try:
                load_guanyin_sticks()
            except Exception:
                pass

            stick = get_stick_by_id(stick_id)
            if not stick:
                return ToolResult(
                    success=False,
                    content=f"未找到ID为{stick_id}的签文",
                    error="stick_not_found"
                )

            info_type = params.get("info_type", "full")

            if info_type == "poem":
                content = f"第{stick.id}签 - {stick.level}\n【签诗】{stick.poem}"
            elif info_type == "story":
                content = f"第{stick.id}签 - {stick.level}\n【典故】{stick.story}"
            elif info_type == "meaning":
                content = f"第{stick.id}签 - {stick.level}\n【释义】{stick.meaning}"
            else:
                content = f"第{stick.id}签 - {stick.level}\n【标题】{stick.title}\n【签诗】{stick.poem}\n【典故】{stick.story}\n【释义】{stick.meaning}"

            return ToolResult(
                success=True,
                content=content,
                data={"stick": stick.model_dump()}
            )

        except Exception as e:
            return ToolResult(
                success=False,
                content=f"查询签文知识时出错：{str(e)}",
                error=str(e)
            )
