"""
反思与自我检查引擎 - 用于验证和修正AI输出

零影响原则：
- 完全独立模块
- 可选使用
- 不修改现有代码
"""
from typing import Dict, Any, Optional, List, Tuple
from enum import Enum, auto
from dataclasses import dataclass
from datetime import datetime
import httpx
import json
from app.core.config import settings
from .hallucination_detector import get_hallucination_detector


class CheckType(Enum):
    """检查类型"""
    ACCURACY = auto()        # 准确性检查
    COMPLETENESS = auto()    # 完整性检查
    COMPLIANCE = auto()      # 合规性检查
    SAFETY = auto()          # 安全性检查


class CheckStatus(Enum):
    """检查状态"""
    PASSED = auto()          # 通过
    WARNING = auto()         # 警告
    FAILED = auto()          # 失败
    NEEDS_CORRECTION = auto()  # 需要修正


@dataclass
class CheckResult:
    """检查结果"""
    check_type: CheckType
    status: CheckStatus
    message: str
    details: Optional[Dict[str, Any]] = None
    suggestion: Optional[str] = None
    checked_at: datetime = None

    def __post_init__(self):
        if self.checked_at is None:
            self.checked_at = datetime.now()


@dataclass
class ReflectionResult:
    """反思结果"""
    needs_correction: bool
    original_response: str
    corrected_response: Optional[str] = None
    checks: List[CheckResult] = None
    reflection_notes: Optional[str] = None
    reflected_at: datetime = None

    def __post_init__(self):
        if self.checks is None:
            self.checks = []
        if self.reflected_at is None:
            self.reflected_at = datetime.now()


class ReflectionEngine:
    """
    反思与自我检查引擎

    零影响原则：
    - 完全独立
    - 可选使用
    - 不修改现有代码
    """

    def __init__(self):
        self._reflection_history: List[ReflectionResult] = []
        # LLM 配置
        self.api_key = settings.KIMI_API_KEY
        self.base_url = settings.KIMI_BASE_URL
        self.model = settings.KIMI_MODEL
        self.timeout = settings.KIMI_TIMEOUT
        self.proxies = {}
        if settings.HTTP_PROXY:
            self.proxies["http://"] = settings.HTTP_PROXY
        if settings.HTTPS_PROXY:
            self.proxies["https://"] = settings.HTTPS_PROXY
        self.proxies = self.proxies if self.proxies else None

    async def _call_llm_for_reflection(self, messages: List[dict]) -> str:
        """调用LLM进行反思"""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 800,
        }

        async with httpx.AsyncClient(timeout=self.timeout, proxies=self.proxies) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[Reflection] LLM call error: {e}")
                return ""

    def check_accuracy(
        self,
        response: str,
        stick_id: Optional[int] = None,
        question: Optional[str] = None
    ) -> CheckResult:
        """
        准确性检查

        Args:
            response: AI回复
            stick_id: 签文ID
            question: 用户问题

        Returns:
            CheckResult: 检查结果
        """
        # 简单检查：确保回复不为空
        if not response or not response.strip():
            return CheckResult(
                check_type=CheckType.ACCURACY,
                status=CheckStatus.FAILED,
                message="回复内容为空",
                suggestion="请重新生成回复"
            )

        # 检查回复长度（防止太短或太长）
        length = len(response.strip())
        if length < 10:
            return CheckResult(
                check_type=CheckType.ACCURACY,
                status=CheckStatus.WARNING,
                message="回复内容过短",
                details={"length": length},
                suggestion="建议提供更详细的解读"
            )

        if length > 2000:
            return CheckResult(
                check_type=CheckType.ACCURACY,
                status=CheckStatus.WARNING,
                message="回复内容过长",
                details={"length": length},
                suggestion="建议精简回复内容"
            )

        # 检查是否重复引用签诗（追问场景）
        forbidden_patterns = ["签诗", "诗文", "原文"]
        found_patterns = [p for p in forbidden_patterns if p in response]

        if found_patterns:
            return CheckResult(
                check_type=CheckType.ACCURACY,
                status=CheckStatus.NEEDS_CORRECTION,
                message="回复中可能重复引用了签诗原文",
                details={"found_patterns": found_patterns},
                suggestion="在追问场景中，避免重复引用签诗原文"
            )

        return CheckResult(
            check_type=CheckType.ACCURACY,
            status=CheckStatus.PASSED,
            message="准确性检查通过"
        )

    def check_completeness(
        self,
        response: str,
        question: str,
    ) -> CheckResult:
        """
        完整性检查

        Args:
            response: AI回复
            question: 用户问题

        Returns:
            CheckResult: 检查结果
        """
        # 检查是否包含问题中的关键词
        question_keywords = [w for w in question if len(w) > 1]
        found_keywords = [w for w in question_keywords if w in response]

        # 简单启发式：至少应该有一些关键词重叠
        if len(found_keywords) < 1 and len(question) > 5:
            return CheckResult(
                check_type=CheckType.COMPLETENESS,
                status=CheckStatus.WARNING,
                message="回复可能没有完全回答问题",
                details={
                    "question_length": len(question),
                    "found_keywords_count": len(found_keywords)
                },
                suggestion="建议更直接地回答用户问题"
            )

        return CheckResult(
            check_type=CheckType.COMPLETENESS,
            status=CheckStatus.PASSED,
            message="完整性检查通过"
        )

    def check_compliance(self, response: str) -> CheckResult:
        """
        合规性检查

        Args:
            response: AI回复

        Returns:
            CheckResult: 检查结果
        """
        # 检查是否有不合适的内容
        forbidden_content = ["违法", "赌博", "迷信"]
        found_content = [c for c in forbidden_content if c in response]

        if found_content:
            return CheckResult(
                check_type=CheckType.COMPLIANCE,
                status=CheckStatus.FAILED,
                message="回复中包含不合适的内容",
                details={"found_content": found_content},
                suggestion="请移除不合适的内容"
            )

        return CheckResult(
            check_type=CheckType.COMPLIANCE,
            status=CheckStatus.PASSED,
            message="合规性检查通过"
        )

    def check_safety(self, response: str) -> CheckResult:
        """
        安全性检查

        Args:
            response: AI回复

        Returns:
            CheckResult: 检查结果
        """
        # 检查是否有极端表述
        extreme_patterns = ["绝对", "一定", "必然"]
        extreme_count = sum(1 for p in extreme_patterns if p in response)

        if extreme_count >= 3:
            return CheckResult(
                check_type=CheckType.SAFETY,
                status=CheckStatus.WARNING,
                message="回复中可能有过于绝对的表述",
                details={"extreme_count": extreme_count},
                suggestion="建议使用更温和、客观的表述"
            )

        return CheckResult(
            check_type=CheckType.SAFETY,
            status=CheckStatus.PASSED,
            message="安全性检查通过"
        )

    async def reflect(
        self,
        response: str,
        question: Optional[str] = None,
        stick_id: Optional[int] = None,
        is_followup: bool = False,
        stick_info: Optional[Dict[str, Any]] = None
    ) -> ReflectionResult:
        """
        执行完整反思流程

        Args:
            response: AI原始回复
            question: 用户问题
            stick_id: 签文ID
            is_followup: 是否是追问
            stick_info: 签文详细信息（用于幻觉检测）

        Returns:
            ReflectionResult: 反思结果
        """
        checks = []
        reflection_notes = []

        # 执行各项检查
        checks.append(self.check_accuracy(response, stick_id, question))
        if question:
            checks.append(self.check_completeness(response, question))
        checks.append(self.check_compliance(response))
        checks.append(self.check_safety(response))

        # 幻觉检测
        if stick_info and question:
            hallucination_detector = get_hallucination_detector()
            hallucination_results = await hallucination_detector.check_all(
                llm_output=response,
                question=question,
                stick_info=stick_info
            )

            for result in hallucination_results:
                # 将幻觉检测结果转换为 CheckResult
                status = CheckStatus.FAILED if result.confidence > 0.6 else CheckStatus.WARNING
                check_result = CheckResult(
                    check_type=CheckType.ACCURACY,
                    status=status,
                    message=result.description or "潜在幻觉问题",
                    suggestion=result.suggestion
                )
                checks.append(check_result)
                reflection_notes.append(f"幻觉检测: {result.description} (置信度: {result.confidence:.2f})")

        # 统计结果
        any_failed = any(c.status == CheckStatus.FAILED for c in checks)
        any_needs_correction = any(c.status == CheckStatus.NEEDS_CORRECTION for c in checks)
        any_hallucination = any("幻觉" in (note or "") for note in reflection_notes)

        # 判断是否需要修正
        needs_correction = any_failed or any_needs_correction or any_hallucination

        # 如果需要修正，调用 LLM 来生成修正后的回复！
        corrected_response = None
        if needs_correction and question:
            try:
                print(f"[Reflection] Attempting AI correction for: {question[:30]}...")
                corrected_response = await self._generate_corrected_response(
                    response, question, stick_id, is_followup, checks
                )
                print(f"[Reflection] AI correction generated!")
            except Exception as e:
                print(f"[Reflection] AI correction failed: {e}")
                # 如果修正失败，仍然返回原始结果

        result = ReflectionResult(
            needs_correction=needs_correction,
            original_response=response,
            corrected_response=corrected_response,
            checks=checks,
            reflection_notes=f"完成{len(checks)}项检查，{sum(1 for c in checks if c.status == CheckStatus.PASSED)}项通过"
        )

        # 保存历史
        self._reflection_history.append(result)

        return result

    async def _generate_corrected_response(
        self,
        original_response: str,
        question: str,
        stick_id: Optional[int],
        is_followup: bool,
        checks: List[CheckResult]
    ) -> Optional[str]:
        """
        调用 LLM 生成修正后的回复

        Args:
            original_response: 原始回复
            question: 用户问题
            stick_id: 签文ID
            is_followup: 是否是追问
            checks: 检查结果列表

        Returns:
            修正后的回复，或 None
        """
        # 构建检查摘要
        check_summary = "\n".join([
            f"- {c.check_type.name}: {c.status.name}: {c.message}"
            for c in checks
            if c.status != CheckStatus.PASSED
        ])

        system_prompt = """你是一个专业的内容审核和修正助手。
你的任务是根据审核结果，修正原回复，解决指出的问题。

【零容忍铁律 - 第一条必须遵守】：全程使用中文，禁止出现任何英文！

修正原则：
1. 保留原回复的核心内容和寓意
2. 只修正指出的问题
3. 保持语气风格一致
4. 如果是追问模式，绝对不要重复引用签诗原文"""

        user_prompt = f"""【原始回复】
{original_response}

【用户问题】
{question}

【发现的问题】
{check_summary}

【是否是追问模式】
{"是" if is_followup else "否"}

请根据以上信息，生成修正后的回复。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        return await self._call_llm_for_reflection(messages)

    def get_reflection_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """获取反思历史"""
        history = self._reflection_history[-limit:]
        return [
            {
                "needs_correction": r.needs_correction,
                "checks_count": len(r.checks),
                "passed_checks": sum(1 for c in r.checks if c.status == CheckStatus.PASSED),
                "reflected_at": r.reflected_at.isoformat(),
            }
            for r in history
        ]

    def get_statistics(self) -> Dict[str, Any]:
        """获取统计数据"""
        if not self._reflection_history:
            return {"total_reflections": 0}

        total = len(self._reflection_history)
        corrections = sum(1 for r in self._reflection_history if r.needs_correction)

        return {
            "total_reflections": total,
            "corrections_made": corrections,
            "correction_rate": corrections / total if total > 0 else 0,
        }

    def clear(self):
        """清空历史"""
        self._reflection_history.clear()
