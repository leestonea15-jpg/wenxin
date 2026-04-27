"""
输出安全护栏（Guardrails）

强制约束 Agent 输出格式和内容，确保输出质量和安全。
"""
import re
import json
from typing import Optional, Dict, Any, List, Callable
from enum import Enum, auto
from dataclasses import dataclass


class ValidationStatus(Enum):
    """验证状态"""
    PASS = auto()
    WARNING = auto()
    FAIL = auto()


@dataclass
class ValidationResult:
    """验证结果"""
    status: ValidationStatus
    message: str
    details: Optional[Dict[str, Any]] = None
    corrected_output: Optional[str] = None


class FormatValidator:
    """格式验证器"""

    # 中文正则
    CHINESE_PATTERN = re.compile(r'[\u4e00-\u9fff]')
    # 英文正则（检测是否包含英文）
    ENGLISH_PATTERN = re.compile(r'[a-zA-Z]{3,}')
    # 签诗相关关键词（追问模式下禁止）
    POEM_KEYWORDS = ['签诗', '诗文', '原文', '签文诗句', '签文原文']
    # 违规内容关键词
    FORBIDDEN_PATTERNS = [
        r'(?i)违法|犯罪|暴力|恐怖|色情|赌博',
        r'(?i)自杀|自伤|自残',
        r'(?i)敏感政治|反动言论'
    ]

    def __init__(self, min_length: int = 100, max_length: int = 400):
        self.min_length = min_length
        self.max_length = max_length

    def validate_chinese_only(self, output: str) -> ValidationResult:
        """验证必须使用中文"""
        # 检查是否有足够的中文
        chinese_chars = len(self.CHINESE_PATTERN.findall(output))
        if chinese_chars < len(output) * 0.3:
            return ValidationResult(
                status=ValidationStatus.FAIL,
                message="输出需要以中文为主"
            )

        # 检查是否有过多英文（超过3个字母的英文单词）
        english_words = self.ENGLISH_PATTERN.findall(output)
        if len(english_words) > 2:
            return ValidationResult(
                status=ValidationStatus.WARNING,
                message="输出包含较多英文，建议尽量使用中文",
                details={"english_words": english_words}
            )

        return ValidationResult(status=ValidationStatus.PASS, message="OK")

    def validate_length(self, output: str) -> ValidationResult:
        """验证长度范围"""
        length = len(output.strip())
        if length < self.min_length:
            return ValidationResult(
                status=ValidationStatus.FAIL,
                message=f"输出过短（{length}字），需要至少{self.min_length}字",
                details={"actual_length": length, "min_required": self.min_length}
            )
        if length > self.max_length:
            return ValidationResult(
                status=ValidationStatus.WARNING,
                message=f"输出过长（{length}字），建议精简到{self.max_length}字以内",
                details={"actual_length": length, "max_recommended": self.max_length}
            )
        return ValidationResult(status=ValidationStatus.PASS, message="OK")

    def validate_no_poem_in_followup(self, output: str, is_followup: bool) -> ValidationResult:
        """验证追问模式下不包含签诗原文"""
        if not is_followup:
            return ValidationResult(status=ValidationStatus.PASS, message="OK")

        found_keywords = [k for k in self.POEM_KEYWORDS if k in output]
        if found_keywords:
            return ValidationResult(
                status=ValidationStatus.FAIL,
                message="追问模式下不应重复引用签诗原文",
                details={"found_keywords": found_keywords}
            )
        return ValidationResult(status=ValidationStatus.PASS, message="OK")

    def validate_no_forbidden_content(self, output: str) -> ValidationResult:
        """验证不包含违规内容"""
        for pattern in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, output):
                return ValidationResult(
                    status=ValidationStatus.FAIL,
                    message="输出包含违规内容",
                    details={"pattern": pattern}
                )
        return ValidationResult(status=ValidationStatus.PASS, message="OK")

    def validate_markdown_format(self, output: str) -> ValidationResult:
        """验证符合基本的 Markdown 格式"""
        # 检查是否有明显的格式问题（可选，不需要太严格）
        # 比如：未闭合的加粗、混乱的换行等

        # 检查加粗标签是否配对
        asterisk_bold = output.count('**')
        if asterisk_bold % 2 != 0:
            return ValidationResult(
                status=ValidationStatus.WARNING,
                message="加粗标记可能不匹配",
                details={"asterisk_count": asterisk_bold}
            )

        return ValidationResult(status=ValidationStatus.PASS, message="OK")


class OutputGuardrails:
    """输出安全护栏"""

    def __init__(self, validator: Optional[FormatValidator] = None):
        self.validator = validator or FormatValidator()

    def validate_all(self, output: str, is_followup: bool = False) -> List[ValidationResult]:
        """运行所有验证"""
        results = []

        # 1. 中文验证
        results.append(self.validator.validate_chinese_only(output))

        # 2. 长度验证
        results.append(self.validator.validate_length(output))

        # 3. 追问模式验证
        results.append(self.validator.validate_no_poem_in_followup(output, is_followup))

        # 4. 违规内容验证
        results.append(self.validator.validate_no_forbidden_content(output))

        # 5. Markdown 格式验证
        results.append(self.validator.validate_markdown_format(output))

        return results

    def has_failure(self, results: List[ValidationResult]) -> bool:
        """检查是否有失败的验证"""
        return any(r.status == ValidationStatus.FAIL for r in results)

    def has_warning(self, results: List[ValidationResult]) -> bool:
        """检查是否有警告"""
        return any(r.status == ValidationStatus.WARNING for r in results)

    def get_failure_summary(self, results: List[ValidationResult]) -> str:
        """获取失败摘要"""
        failures = [r for r in results if r.status == ValidationStatus.FAIL]
        if not failures:
            return "OK"
        return "; ".join(f.message for f in failures)

    async def try_auto_correct(
        self,
        output: str,
        results: List[ValidationResult],
        is_followup: bool,
        llm_call_fn: Callable[[str], str]
    ) -> Optional[str]:
        """
        尝试自动修正输出

        Args:
            output: 原始输出
            results: 验证结果
            is_followup: 是否是追问模式
            llm_call_fn: 调用 LLM 的函数，接收 prompt 返回 output

        Returns:
            修正后的输出，或者 None（无法修正）
        """
        if not self.has_failure(results):
            return None

        # 构建修正提示词
        failure_summary = self.get_failure_summary(results)
        prompt = self._build_correction_prompt(output, failure_summary, is_followup)

        try:
            # 调用 LLM 进行修正
            corrected = llm_call_fn(prompt)
            return corrected
        except Exception as e:
            print(f"[Guardrails] Auto-correction failed: {e}")
            return None

    def _build_correction_prompt(self, original_output: str, issues: str, is_followup: bool) -> str:
        """构建修正提示词"""
        followup_note = "\n- 绝对不要引用签诗原文" if is_followup else ""

        return f"""请重新整理以下解签内容，解决这些问题：

问题：{issues}

要求：
- 使用中文
- 长度在 100-400 字{followup_note}
- 保持原意不变
- 保持自然流畅的语气
- 重要内容用加粗标记

原内容：
{original_output}

请直接输出修正后的内容，不要说其他话："""


class JsonSchemaValidator:
    """JSON Schema 验证器（预留，未来扩展用）"""

    @staticmethod
    def validate_json_schema(output: str, schema: Dict[str, Any]) -> ValidationResult:
        """验证符合 JSON Schema"""
        try:
            data = json.loads(output)
            # 简单验证（完整验证可以用 jsonschema 库）
            return ValidationResult(status=ValidationStatus.PASS, message="OK")
        except json.JSONDecodeError as e:
            return ValidationResult(
                status=ValidationStatus.FAIL,
                message=f"JSON 格式错误: {e}"
            )
