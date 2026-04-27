"""
Context管理器 - 实现Context Engineering最佳实践
分层组织、动态调整、窗口管理、清晰标记
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

from app.models.schemas import GuanyinStick, Message


class ContextLayer(Enum):
    """Context层级"""
    SYSTEM = "system"        # 系统指令层
    KNOWLEDGE = "knowledge"  # 知识层（签文）
    MEMORY = "memory"        # 记忆层
    CONVERSATION = "conversation"  # 对话历史层
    TASK = "task"            # 任务指令层


@dataclass
class ContextItem:
    """Context项"""
    layer: ContextLayer
    content: str
    priority: int = 0
    token_estimate: int = 0


class ContextManager:
    """
    Context管理器 - 实现Context Engineering最佳实践

    设计要点：
    1. 分层组织：系统→知识→记忆→对话→任务
    2. 动态调整：初次解读给完整签文，追问只给标识
    3. 窗口管理：对话历史只保留最近3-5轮
    4. 清晰标记：用XML标签分隔不同类型
    5. Token优化：不浪费token在无关信息上
    """

    def __init__(self):
        # 基础系统提示词（从现有ai_agent.py复制，确保一致性）
        self.base_system_prompt = """你是一位深耕周易命理、精通观音灵签正统释义的专属解签大师，严谨守正、温和通透，你的任务是根据用户抽到的签文和用户的具体问题为用户精准解读签文、解答人生疑惑，不妄言、不篡改、不敷衍。

【零容忍铁律 - 第一条必须遵守】：全程使用中文，禁止出现任何英文！任何英文单词、字母都绝对不允许出现！

## 核心铁律（绝对不可违反）
1. 原文锁死原则
严格沿用内置1-100签固定JSON知识库，严禁修改、编造、删减签号、签名、吉凶、签诗、典故、释义，绝不反转吉凶、篡改本义、偏离核心寓意。
2. 专属定制原则
禁止通用套话、万能模板，完全贴合用户具体问题作答；同签不同问题、同问题不同签文，解读角度、侧重点、措辞必须完全差异化。
3. 知识边界原则
仅调用内置观音灵签知识库，不联网、不编造典故、不延伸无关民俗风水内容。
4. 输出格式原则
回答全程自然呈现加粗效果，直接用加粗格式展示重点内容，不要用多余的引号、符号做标记，干净整洁。

## 解读结构与篇幅规则
1. 首次解读：引用签号+签名+吉凶+签诗原文，再展开解读。
2. 用户追问后：【绝对禁止重复引用签诗原文】，直接围绕签文核心含义回复问题，绝对不要再提任何签诗原文内容。
3. 字数灵活不刻板：问题简单就精简作答，问题复杂就深入解读，长短随心，杜绝固定字数、模板化、机械化感，但一次回复不超过400字。
4. 语气自然流畅、温和有温度，文笔雅致、富有哲理与启发性。

## 标准解读流程
1. 点明签文核心气运与吉凶基调
2. 结合典故精准对应用户问题
3. 针对性解析用户当下处境、趋势、关键点
4. 给出可落地、正向、贴合签文的现实指引
5. 结尾适度安抚与鼓励，不喊空口号

请记住，你是在为用户解答人生疑惑，要认真、用心地对待每一个问题。"""

        # 追问模式的额外提示
        self.followup_system_suffix = """

【重要！追问模式特别强调】：
这是用户的追问，请务必遵守：
1. 绝对、绝对、绝对不要重复引用签诗原文！
2. 不要提任何签诗中的句子！
3. 直接围绕签文核心含义回答用户问题！"""

        # Token预算配置
        self.token_budget = {
            ContextLayer.SYSTEM: 500,
            ContextLayer.KNOWLEDGE: 300,
            ContextLayer.MEMORY: 200,
            ContextLayer.CONVERSATION: 400,
            ContextLayer.TASK: 100,
        }

        # 对话历史窗口大小
        self.conversation_window_size = 5

    def build_interpret_context(
        self,
        question: str,
        stick: GuanyinStick,
        memory_context: Optional[str] = None
    ) -> List[Dict]:
        """
        构建初次解读Context

        Args:
            question: 用户问题
            stick: 签文对象
            memory_context: 可选的记忆Context

        Returns:
            构建好的messages列表
        """
        messages = []

        # 1. 系统指令层
        messages.append(self._build_system_prompt(emphasize_no_poem=False))

        # 2. 知识层（完整签文）
        messages.append(self._build_stick_context(stick, include_poem=True))

        # 3. 记忆层（如果有）
        if memory_context:
            messages.append({"role": "user", "content": memory_context})

        # 4. 任务指令层
        messages.append(self._build_task_context("初次解读", question))

        return messages

    def build_followup_context(
        self,
        question: str,
        stick: GuanyinStick,
        history: List[Message],
        memory_context: Optional[str] = None
    ) -> List[Dict]:
        """
        构建追问Context

        Args:
            question: 用户当前问题
            stick: 签文对象
            history: 对话历史
            memory_context: 可选的记忆Context

        Returns:
            构建好的messages列表
        """
        messages = []

        # 1. 系统指令层（追加追问模式提示）
        messages.append(self._build_system_prompt(emphasize_no_poem=True))

        # 2. 知识层（只给标识，不重复完整签文）
        messages.append(self._build_stick_context(stick, include_poem=False))

        # 3. 记忆层（如果有）
        if memory_context:
            messages.append({"role": "user", "content": memory_context})

        # 4. 对话历史层（滑动窗口）
        conversation_messages = self._build_conversation_context(history)
        messages.extend(conversation_messages)

        # 5. 任务指令层
        messages.append(self._build_task_context("追问", question))

        return messages

    def _build_system_prompt(self, emphasize_no_poem: bool = False) -> Dict:
        """构建系统指令层"""
        content = self.base_system_prompt
        if emphasize_no_poem:
            content += self.followup_system_suffix
        return {"role": "system", "content": content}

    def _build_stick_context(
        self,
        stick: GuanyinStick,
        include_poem: bool = True
    ) -> Dict:
        """
        构建签文知识层

        Args:
            stick: 签文对象
            include_poem: 是否包含完整签诗（初次解读=True，追问=False）
        """
        if include_poem:
            # 完整签文（初次解读）
            content = f"""<context>
【当前签文】
第{stick.id}签 - {stick.level}
【标题】{stick.title}
【签诗】{stick.poem}
【典故】{stick.story}
【释义】{stick.meaning}
</context>"""
        else:
            # 只给标识（追问）
            content = f"""<context>
【当前签文标识】
第{stick.id}签 - {stick.level}《{stick.title}》
</context>"""

        return {"role": "user", "content": content}

    def _build_conversation_context(
        self,
        history: List[Message]
    ) -> List[Dict]:
        """
        构建对话历史层（滑动窗口）

        只保留最近N轮对话，节省token
        """
        if not history:
            return []

        # 滑动窗口：只保留最近N轮
        recent_history = history[-self.conversation_window_size:] if len(history) > self.conversation_window_size else history

        # 用XML包装，清晰标识
        content = "<conversation>\n【最近对话】\n"
        for msg in recent_history:
            role = "用户" if msg.role == "user" else "AI"
            content += f"{role}：{msg.content}\n"
        content += "</conversation>"

        return [{"role": "user", "content": content}]

    def _build_task_context(self, mode: str, question: str) -> Dict:
        """
        构建任务指令层

        Args:
            mode: "初次解读" 或 "追问"
            question: 用户问题
        """
        if mode == "初次解读":
            format_instruction = """
【输出格式】
请按这个结构：
1. 点明签号+吉凶
2. 引用签诗原文
3. 解释典故含义
4. 结合你的问题解读
5. 给出具体建议
"""
        else:
            format_instruction = """
【输出格式】
直接回答，不要重复签诗！
"""

        content = f"""<task>
【当前任务】{mode}
【用户问题】{question}

【使用说明】
1. 先看<system>里的铁律，绝对不能违反
2. 再看<context>里的签文，这是你的唯一知识库
3. 然后看<conversation>了解之前说过什么
4. 最后回答用户问题

{format_instruction}
</task>"""

        return {"role": "user", "content": content}
