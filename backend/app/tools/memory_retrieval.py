"""
记忆检索工具 - 查询用户的历史记忆

零影响原则：
- 完全独立，不修改现有代码
"""
from typing import Dict, Any, Optional
from app.tools.base_tool import BaseTool, ToolResult, ToolRegistry
from app.agents.memory_system import GuanyinAgentMemory


@ToolRegistry.register
class MemoryRetrievalTool(BaseTool):
    """记忆检索工具"""

    name: str = "memory_retrieval"

    description: str = "查询用户的历史测算记录，提取相关记忆"

    param_schema: Dict[str, Any] = {
        "query": {
            "type": "string",
            "description": "查询关键词或问题",
            "required": True,
        },
        "limit": {
            "type": "integer",
            "description": "返回结果数量上限，默认3",
            "required": False,
            "default": 3,
        },
    }

    # 注意：这个工具需要外部传入memory实例
    _memory_instance: Optional[GuanyinAgentMemory] = None

    @classmethod
    def set_memory_instance(cls, memory: GuanyinAgentMemory):
        """设置记忆系统实例"""
        cls._memory_instance = memory

    async def execute(self, params: Dict[str, Any]) -> ToolResult:
        """执行记忆检索"""
        try:
            query = params.get("query", "")
            if not query:
                return ToolResult(
                    success=False,
                    content="请提供查询关键词",
                    error="missing_query"
                )

            if not self._memory_instance:
                return ToolResult(
                    success=False,
                    content="记忆系统未初始化",
                    error="memory_not_initialized"
                )

            limit = params.get("limit", 3)

            # 先确保已从数据库加载记忆
            if self._memory_instance.user_id:
                await self._memory_instance.load_user_memories(days=30)

            # 检索相关记忆
            memories = self._memory_instance.retrieve(query, limit=limit)

            if not memories:
                return ToolResult(
                    success=True,
                    content="暂未找到相关历史记录",
                    data={"count": 0}
                )

            # 构建返回内容
            content = "【相关历史记录】\n"
            for i, mem in enumerate(memories, 1):
                content += f"{i}. {mem.summary}\n"

            return ToolResult(
                success=True,
                content=content,
                data={
                    "count": len(memories),
                    "memories": [
                        {
                            "summary": mem.summary,
                            "topic_tags": mem.topic_tags,
                            "stick_id": mem.stick_id,
                            "relevance_score": mem.relevance_score,
                        }
                        for mem in memories
                    ]
                }
            )

        except Exception as e:
            return ToolResult(
                success=False,
                content=f"检索记忆时出错：{str(e)}",
                error=str(e)
            )
