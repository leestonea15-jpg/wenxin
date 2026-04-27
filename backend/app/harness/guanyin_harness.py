"""
观音灵签Agent Harness

完整的Agent执行框架，整合所有核心组件：
- 状态机驱动
- Context管理（分层/动态调整）
- 记忆系统（工作记忆/短期记忆/检索）
- 规划引擎（多步执行）
- 反思引擎（质量检查）
- 工具编排
- 错误处理（重试/降级）
- 可观测性（日志/追踪/指标）
- 检查点机制

提供完整的Agent功能，同时保持向下兼容。
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from app.models.schemas import GuanyinStick, Message
from app.services.ai_agent import ai_agent as existing_ai_agent
from app.services.database import (
    save_agent_memory,
    create_divination_record,
    update_divination_record
)

from .state_machine import AgentStateMachine, AgentState, AgentEvent
from .context_manager import ContextManager
from .observability import AgentObservability, get_observability
from .error_handler import ErrorHandler, RetryConfig
from .tool_orchestrator import ToolOrchestrator
from .checkpoint import CheckpointManager
from .guardrails import OutputGuardrails, FormatValidator
from app.agents.memory_system import GuanyinAgentMemory
from app.agents.planning_engine import PlanningEngine
from app.agents.reflection_engine import ReflectionEngine

# 导入工具（确保它们被注册）
import app.tools.stick_knowledge
import app.tools.memory_retrieval


class GuanyinAgentHarness:
    """
    观音灵签Agent Harness - 完整实现（第三阶段）

    整合所有组件，提供完整的Agent功能：
    1. 多步规划
    2. 记忆检索
    3. Context工程
    4. 工具调用
    5. 反思检查
    6. 错误处理
    7. 可观测性
    """

    def __init__(self, use_new_implementation: bool = True):
        """
        初始化Harness

        Args:
            use_new_implementation: 是否使用新实现（默认=True，完整功能）
        """
        self.use_new_implementation = use_new_implementation

        # 初始化核心组件
        self.state_machine = AgentStateMachine()
        self.context_manager = ContextManager()
        self.observability = get_observability()
        self.error_handler = ErrorHandler(RetryConfig())
        self.tool_orchestrator = ToolOrchestrator()
        self.checkpoint_manager = CheckpointManager()
        self.memory = GuanyinAgentMemory()
        self.planning_engine = PlanningEngine()
        self.reflection_engine = ReflectionEngine()
        self.guardrails = OutputGuardrails(FormatValidator(min_length=100, max_length=400))

        # 给记忆检索工具设置记忆实例（关键！）
        from app.tools.memory_retrieval import MemoryRetrievalTool
        MemoryRetrievalTool.set_memory_instance(self.memory)

        # 保留现有AI Agent引用（仅用于直接LLM调用，不用于降级）
        self.existing_agent = existing_ai_agent

        # 当前会话数据
        self._current_session_id: Optional[str] = None
        self._current_user_id: Optional[str] = None
        self._current_stick: Optional[GuanyinStick] = None

        self.observability.log(
            "INFO",
            "GuanyinAgentHarness初始化完成",
            use_new_implementation=use_new_implementation
        )

    # ==================== 快速路径 - 极简版解读 ====================

    async def fast_interpret(
        self,
        question: str,
        stick: GuanyinStick,
        user_id: Optional[str] = None
    ) -> str:
        """
        快速初次解读 - 方案 A（极简版）
        - 1次 LLM 调用
        - 不查记忆
        - 规则检查，跳过 LLM 修正
        - 后台保存记忆
        """
        import uuid
        import asyncio
        trace_id = self.observability.start_trace("fast_interpret")

        try:
            self.observability.log("INFO", "开始快速解读", trace_id=trace_id, question=question[:100])

            # 1. 设置会话
            self._current_session_id = str(uuid.uuid4())
            self._current_user_id = user_id
            self._current_stick = stick

            if user_id:
                self.memory.set_user_id(user_id)
                self.memory.store_working_memory(stick=stick, question=question)

            # 2. 快速构建 Context（1次 LLM 调用）
            messages = self.context_manager.build_interpret_context(question, stick)
            final_response = await self.existing_agent.interpret_stick(question, stick)

            # 3. 检查+护栏，需要时才修正
            validation_results = self.guardrails.validate_all(final_response, is_followup=False)
            if self.guardrails.has_failure(validation_results):
                self.observability.log("WARNING", "验证发现问题，尝试修正",
                                     trace_id=trace_id,
                                     issues=self.guardrails.get_failure_summary(validation_results))
                # 按需调用 LLM 修正
                async def llm_call_wrapper(prompt: str) -> str:
                    messages = [
                        {"role": "system", "content": "你是一个专业的解签内容编辑"},
                        {"role": "user", "content": prompt}
                    ]
                    return await self.existing_agent._call_kimi_api(messages)
                corrected = await self.guardrails.try_auto_correct(
                    final_response, validation_results, is_followup=False, llm_call_wrapper=llm_call_wrapper
                )
                if corrected:
                    final_response = corrected

            # 4. 后台保存记忆（不阻塞）
            if user_id:
                asyncio.create_task(self._save_memory_background(user_id, question, stick))

            self.observability.end_trace(trace_id, success=True)
            return final_response

        except Exception as e:
            self.observability.end_trace(trace_id, success=False, error=str(e))
            self.observability.log("ERROR", "快速解读失败，降级", trace_id=trace_id, error=str(e))
            # 降级到旧实现
            return await self.existing_agent.interpret_stick(question, stick)

    async def _save_memory_background(self, user_id: str, question: str, stick: GuanyinStick):
        """后台保存记忆"""
        try:
            tags = self.memory.extract_topic_tags(question)
            summary = f"关于「{question}」的{stick.title}({stick.level})"

            await save_agent_memory(
                user_id=user_id,
                memory_layer="short_term",
                memory_type="divination",
                content={"question": question, "stick": stick.model_dump()},
                summary=summary,
                topic_tags=tags,
                stick_id=stick.id,
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            self.observability.log("INFO", "后台记忆保存成功")
        except Exception as e:
            self.observability.log("WARNING", f"后台记忆保存失败: {e}")

    # ==================== ReAct 循环核心方法 ====================

    async def _react_loop(
        self,
        question: str,
        stick: GuanyinStick,
        is_followup: bool = False,
        history: Optional[List[Message]] = None,
        trace_id: Optional[str] = None,
        max_steps: int = 3
    ) -> str:
        """
        真正的 ReAct 循环：观察 → 思考 → 行动 → 观察 → ... → 结束

        Args:
            question: 用户问题
            stick: 签文对象
            is_followup: 是否是追问
            history: 对话历史（仅追问时需要）
            trace_id: 追踪ID
            max_steps: 最大循环步数

        Returns:
            最终回答
        """
        print(f"[ReAct] 开始 ReAct 循环，最大步数: {max_steps}")

        # 初始化循环变量
        scratchpad = ""  # 思考过程草稿
        current_step = 0
        final_answer = None

        # 循环直到获得最终答案或达到最大步数
        while current_step < max_steps and final_answer is None:
            current_step += 1
            print(f"[ReAct] === Step {current_step}/{max_steps} ===")

            # ==================== 1. 观察 (Observe) ====================
            self.state_machine.transition(AgentEvent.START_INTERPRET)
            print(f"[ReAct] 观察状态...")

            # 检索记忆
            memory_context = None
            if self._current_user_id:
                memory_context = self.memory.build_context_for_prompt(question)

            # ==================== 2. 思考 & 规划 (Think & Plan) ====================
            print(f"[ReAct] 思考中...")

            # 构建 ReAct 提示
            react_messages = self._build_react_prompt(
                question=question,
                stick=stick,
                is_followup=is_followup,
                history=history,
                memory_context=memory_context,
                scratchpad=scratchpad,
                step=current_step
            )

            # 调用 LLM 进行思考
            thought_response = await self.existing_agent._call_kimi_api(react_messages)
            print(f"[ReAct] LLM 思考回应: {thought_response[:80]}...")

            # 解析回应，判断是调用工具还是给出最终答案
            action_type, action_content = self._parse_react_response(thought_response)

            # ==================== 3. 行动 (Act) ====================
            # 不需要单独的 GENERATING 状态，继续使用之前的状态
            # self.state_machine.transition(AgentEvent.GENERATING)

            if action_type == "final_answer":
                # 直接给出最终答案
                print(f"[ReAct] LLM 选择直接给出最终答案")
                final_answer = action_content
                scratchpad += f"\nStep {current_step}: [Final Answer]\n{final_answer}\n"

            elif action_type == "tool_call":
                # 调用工具
                print(f"[ReAct] LLM 选择调用工具: {action_content.get('tool')}")
                scratchpad += f"\nStep {current_step}: [Thought]\n{thought_response}\n"

                try:
                    # 执行工具调用 - 这里不用转状态，因为不是正式的解读阶段
                    # self.state_machine.transition(AgentEvent.GENERATING)

                    tool_result = await self.tool_orchestrator.call_tool(
                        tool_name=action_content.get("tool"),
                        params=action_content.get("params"),
                        trace_id=trace_id,
                        user_id=self._current_user_id
                    )

                    # 记录工具结果
                    scratchpad += f"Step {current_step}: [Action] Called {action_content.get('tool')}\n"
                    scratchpad += f"Step {current_step}: [Observation]\n{tool_result.content}\n"

                    print(f"[ReAct] 工具调用完成，成功: {tool_result.success}")
                except Exception as e:
                    # 工具调用失败，记录错误但继续循环，不要让整个流程崩溃
                    error_msg = f"工具调用出错：{str(e)}"
                    print(f"[ReAct] {error_msg}")
                    scratchpad += f"Step {current_step}: [Action] Called {action_content.get('tool')}\n"
                    scratchpad += f"Step {current_step}: [Observation] {error_msg}\n"

            else:
                # 无法解析，默认直接生成答案
                print(f"[ReAct] 无法解析行动类型，直接生成答案")
                final_answer = thought_response

        # ==================== 4. 反思 (Reflect) ====================
        if final_answer:
            self.state_machine.transition(AgentEvent.START_REFLECT)
            print(f"[ReAct] 进行最终反思检查...")

            # 准备签文信息用于幻觉检测
            stick_info = {
                "id": stick.id,
                "level": stick.level,
                "title": stick.title,
                "poem": stick.poem,
                "story": stick.story,
                "meaning": stick.meaning
            }

            reflection_result = await self.reflection_engine.reflect(
                final_answer, question, stick.id, is_followup, stick_info
            )

            if reflection_result.needs_correction and reflection_result.corrected_response:
                print(f"[ReAct] 反思引擎建议修正，使用修正后的答案")
                thinking_steps.append({
                    "step": current_step + 1,
                    "type": "reflection",
                    "thought": "反思引擎发现问题并进行了修正",
                    "original": final_answer,
                    "corrected": reflection_result.corrected_response
                })
                final_answer = reflection_result.corrected_response

        # ==================== 5. 输出安全护栏 (Guardrails) ====================
        if final_answer:
            print(f"[ReAct] 运行输出安全护栏检查...")

            # 运行所有验证
            validation_results = self.guardrails.validate_all(final_answer, is_followup)

            # 检查是否有失败
            if self.guardrails.has_failure(validation_results):
                failure_summary = self.guardrails.get_failure_summary(validation_results)
                print(f"[ReAct] 发现问题: {failure_summary}")
                self.observability.record_guardrail_triggered()

                # 尝试自动修正
                async def llm_call_wrapper(prompt: str) -> str:
                    messages = [
                        {"role": "system", "content": "你是一位专业的解签内容编辑"},
                        {"role": "user", "content": prompt}
                    ]
                    return await self.existing_agent._call_kimi_api(messages)

                corrected = await self.guardrails.try_auto_correct(
                    final_answer, validation_results, is_followup, llm_call_wrapper
                )

                if corrected:
                    print(f"[ReAct] 自动修正完成，使用修正后的答案")
                    final_answer = corrected
                else:
                    print(f"[ReAct] 自动修正失败，使用原始答案")
            else:
                print(f"[ReAct] 安全护栏检查通过")

        # 如果循环结束还没有答案，兜底生成
        if final_answer is None:
            print(f"[ReAct] 达到最大步数，兜底生成答案")
            # 正常的Agent降级：直接构建一个简单回答，不调用旧系统
            if is_followup:
                final_answer = "让我基于当前签文来回答你的问题..."
            else:
                final_answer = f"让我为你解读这支{stick.level}：{stick.title}..."

            # 再调用一次LLM完善这个兜底回答
            fallback_messages = self.context_manager.build_interpret_context(question, stick)
            final_answer = await self.existing_agent._call_kimi_api(fallback_messages)

        print(f"[ReAct] ReAct 循环结束")
        return final_answer

    def _build_react_prompt(
        self,
        question: str,
        stick: GuanyinStick,
        is_followup: bool,
        history: Optional[List[Message]],
        memory_context: Optional[str],
        scratchpad: str,
        step: int
    ) -> List[dict]:
        """构建 ReAct 提示词"""

        system_prompt = """你是一位专业的观音灵签解签大师，同时也是一个会思考、会行动的智能Agent。

【零容忍铁律 - 第一条必须遵守】：全程使用中文，禁止出现任何英文！

【你的工作流程 - ReAct 框架】
你需要按照以下步骤工作：

1. **思考 (Thought)**：分析用户问题，决定下一步做什么
2. **行动 (Action)**：选择调用工具或直接给出答案
3. **观察 (Observation)**：查看工具调用结果
4. **循环**：继续思考，直到你有足够信息给出最终答案

【可用工具】
- `stick_knowledge`: 查询签文详细信息（签诗/典故/释义）
  参数: stick_id (签文ID), info_type (可选: full/poem/story/meaning)
- `memory_retrieval`: 检索用户历史记忆
  参数: query (查询内容), limit (可选, 默认3)

【你的回应格式】
你必须严格使用以下格式之一回应：

1. **如果要调用工具**：
```
Thought: 你思考的内容...
Action: tool_name
Params: {"param1": "value1", "param2": "value2"}
```

2. **如果要给出最终答案**：
```
Thought: 你思考的内容...
Final Answer: 你的最终答案...
```

【重要提示】
- 不是每次都需要调用工具，如果你已经有足够信息，可以直接给出答案
- 初次解读一般需要调用 `stick_knowledge` 查看完整签文信息
- 追问时不要重复引用签诗原文"""

        # 构建基础消息
        messages = [{"role": "system", "content": system_prompt}]

        # 添加签文信息
        stick_context = f"""【当前签文】
第{stick.id}签 - {stick.level}
【标题】{stick.title}"""

        messages.append({"role": "user", "content": stick_context})

        # 添加记忆（如果有）
        if memory_context:
            messages.append({"role": "user", "content": memory_context})

        # 添加对话历史（如果是追问）
        if is_followup and history:
            history_text = "\n".join([f"{m.role}: {m.content}" for m in history])
            messages.append({"role": "user", "content": f"【对话历史】\n{history_text}"})

        # 添加草稿（之前的思考过程）
        if scratchpad:
            messages.append({"role": "user", "content": f"【之前的思考过程】\n{scratchpad}"})

        # 添加当前问题
        messages.append({"role": "user", "content": f"【当前问题】\n{question}"})

        return messages

    def _parse_react_response(self, response: str) -> tuple:
        """
        解析 ReAct 回应

        Returns:
            (action_type, action_content)
            - action_type: "final_answer" 或 "tool_call"
            - action_content: 答案字符串或工具参数字典
        """
        try:
            response = response.strip()

            # 检查是否是最终答案
            if "Final Answer:" in response:
                parts = response.split("Final Answer:", 1)
                final_answer = parts[1].strip()
                return ("final_answer", final_answer)

            # 检查是否是工具调用
            if "Action:" in response and "Params:" in response:
                import json

                # 提取工具名
                action_part = response.split("Action:", 1)[1].split("Params:", 1)[0].strip()
                tool_name = action_part

                # 提取参数
                params_part = response.split("Params:", 1)[1].strip()

                # 尝试解析JSON
                try:
                    # 找到第一个 { 和最后一个 }
                    start_idx = params_part.find("{")
                    end_idx = params_part.rfind("}") + 1
                    if start_idx >= 0 and end_idx > start_idx:
                        params_json = params_part[start_idx:end_idx]
                        params = json.loads(params_json)
                        return ("tool_call", {"tool": tool_name, "params": params})
                except Exception:
                    pass

                # 如果解析失败，返回简化版
                return ("tool_call", {"tool": tool_name, "params": {}})

            # 如果格式不匹配，把整个回应当作最终答案
            return ("final_answer", response)

        except Exception as e:
            print(f"[ReAct] 解析回应出错: {e}")
            return ("final_answer", response)

    async def interpret_with_planning(
        self,
        question: str,
        stick: GuanyinStick,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        初次解读流程（使用快速路径，不用 ReAct）
        """
        import uuid
        trace_id = self.observability.start_trace("interpret_with_planning")

        try:
            # 直接使用快速路径
            final_response = await self.fast_interpret(question, stick, user_id)

            return {
                "interpretation": final_response,
                "used_new_engine": True,
                "used_react": False,
                "plan_id": "fast_path",
                "trace_id": trace_id
            }

        except Exception as e:
            self.state_machine.transition(AgentEvent.ERROR_OCCUR)
            self.observability.end_trace(trace_id, success=False, error=str(e))
            self.observability.log("ERROR", "解读失败", trace_id=trace_id, error=str(e))
            self.observability.increment_counter("failed_requests")

            # 正常的Agent降级：直接生成一个简单回答
            fallback_response = "抱歉，解签时遇到一些问题，请稍后再试。"

            return {
                "interpretation": fallback_response,
                "used_new_engine": True,
                "used_react": False,
                "fallback": True,
                "error": str(e)
            }

    async def followup_with_planning(
        self,
        question: str,
        stick: GuanyinStick,
        history: List[Message],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        完整追问流程（折中方案：完整 ReAct，最多 3 步）
        - 按需记忆检索
        - 完整 ReAct 循环
        - 反思检查+安全护栏
        """
        import uuid
        trace_id = self.observability.start_trace("followup_with_planning")

        try:
            # 记录指标
            self.observability.increment_counter("total_requests")

            # 记录开始
            self.observability.log(
                "INFO",
                "开始追问会话（完整 ReAct）",
                trace_id=trace_id,
                user_id=user_id,
                question=question[:100]
            )

            # 1. 确保用户ID一致
            if user_id and user_id != self._current_user_id:
                self.memory.set_user_id(user_id)
                self._current_user_id = user_id

            # 2. 按需记忆检索（检测关键词才查）
            memory_context = None
            if user_id and self._needs_memory_retrieval(question):
                await self.memory.load_user_memories(days=30, acting_user_id=user_id)
                memory_context = self.memory.build_context_for_prompt(question)

            # 3. 创建执行计划
            plan = self.planning_engine.create_followup_plan(
                question,
                stick.id,
                len(history),
                user_id
            )

            # 4. 使用完整 ReAct 循环生成答案（最多 3 步）
            final_response = await self._react_loop(
                question=question,
                stick=stick,
                is_followup=True,
                history=history,
                trace_id=trace_id,
                max_steps=3
            )

            # 5. 更新工作记忆
            for msg in history:
                self.memory.store_working_memory(message=msg)

            # 6. 完成
            self.state_machine.transition(AgentEvent.COMPLETE)
            self.observability.end_trace(trace_id, success=True)
            self.observability.increment_counter("successful_requests")

            return {
                "reply": final_response,
                "used_new_engine": True,
                "used_react": True,
                "plan_id": plan.plan_id,
                "trace_id": trace_id
            }

        except Exception as e:
            self.state_machine.transition(AgentEvent.ERROR_OCCUR)
            self.observability.end_trace(trace_id, success=False, error=str(e))
            print(f"[ERROR] 追问流程出错: {e}")
            import traceback
            traceback.print_exc()

            # 正常的Agent降级：直接生成一个简单回答，而不是切到旧系统
            fallback_response = "抱歉，暂时遇到一些问题，请稍后再试。"

            return {
                "reply": fallback_response,
                "used_new_engine": True,
                "used_react": True,
                "fallback": True,
                "error": str(e)
            }

    def _needs_memory_retrieval(self, question: str) -> bool:
        """判断是否需要记忆检索（关键词检测）"""
        keywords = ["上次", "之前", "同样", "类似", "记得", "刚才", "之前问的"]
        return any(keyword in question for keyword in keywords)

    # ==================== 兼容旧接口（零影响关键） ====================

    async def interpret_stick(
        self,
        question: str,
        stick: GuanyinStick,
        user_id: Optional[str] = None
    ) -> str:
        """
        兼容旧接口：只返回解读字符串

        Args:
            question: 用户问题
            stick: 签文对象
            user_id: 用户ID（可选）

        Returns:
            解读字符串
        """
        if self.use_new_implementation:
            result = await self.interpret_with_planning(question, stick, user_id)
            return result["interpretation"]
        else:
            return await self.existing_agent.interpret_stick(question, stick)

    async def followup_question(
        self,
        question: str,
        stick: GuanyinStick,
        history: List[Message]
    ) -> str:
        """
        兼容旧接口：只返回回复字符串

        Args:
            question: 用户问题
            stick: 签文对象
            history: 对话历史

        Returns:
            回复字符串
        """
        if self.use_new_implementation:
            result = await self.followup_with_planning(
                question, stick, history, self._current_user_id
            )
            return result["reply"]
        else:
            return await self.existing_agent.followup_question(question, stick, history)

    # ==================== 辅助方法 ====================

    def set_record_id(self, record_id: str):
        """设置测算记录ID"""
        self.memory.store_working_memory(record_id=record_id)

    def get_harness_status(self) -> Dict[str, Any]:
        """获取Harness状态（用于调试）"""
        return {
            "use_new_implementation": self.use_new_implementation,
            "current_state": self.state_machine.current_state.name,
            "working_memory": self.memory.working_memory.to_dict(),
            "planning_engine": {
                "total_plans": len(getattr(self.planning_engine, '_plans', {}))
            }
        }

    def get_harness_full_status(self) -> Dict[str, Any]:
        """获取完整的Harness状态（第三阶段新增）"""
        return {
            **self.get_harness_status(),
            "current_session_id": self._current_session_id,
            "current_user_id": self._current_user_id,
            "planning_engine": {
                "total_plans": len(getattr(self.planning_engine, '_plans', {}))
            },
            "reflection_engine": self.reflection_engine.get_statistics(),
            "memory": self.memory.get_memory_statistics(),
            "observability": self.observability.get_full_statistics()
        }


# ==================== 全局单例 ====================

_harness_instance: Optional[GuanyinAgentHarness] = None


def get_harness(use_new_implementation: bool = True) -> GuanyinAgentHarness:
    """
    获取Harness实例（单例）

    Args:
        use_new_implementation: 是否使用新实现（默认=True）

    Returns:
        GuanyinAgentHarness实例
    """
    global _harness_instance
    if _harness_instance is None:
        _harness_instance = GuanyinAgentHarness(use_new_implementation=use_new_implementation)
    return _harness_instance
