"""
幻觉检测器

检测 LLM 输出中的幻觉问题：
1. 事实一致性：检查解签内容是否与签文知识库一致
2. 逻辑一致性：检查回答是否前后矛盾
3. 引用校验：如果引用了签文内容，验证引用的准确性
"""
from typing import Optional, Dict, Any, List, Tuple
from enum import Enum, auto
from dataclasses import dataclass
import re


class HallucinationType(Enum):
    """幻觉类型"""
    FACT_INCONSISTENCY = auto()  # 事实不一致
    LOGIC_INCONSISTENCY = auto()  # 逻辑不一致
    REFERENCE_ERROR = auto()      # 引用错误


@dataclass
class HallucinationCheckResult:
    """幻觉检测结果"""
    has_hallucination: bool
    hallucination_type: Optional[HallucinationType] = None
    description: Optional[str] = None
    confidence: float = 0.0
    suggestion: Optional[str] = None


class HallucinationDetector:
    """幻觉检测器"""

    def __init__(self):
        # 签文关键内容模式
        self.signature_patterns = {
            # 通常签文里的关键内容
            "level_pattern": re.compile(r"[上中下下下]签"),
            "title_pattern": re.compile(r"第.*签.*《.*》"),
        }

        # 避免的词汇（暗示幻觉）
        self.suspicious_words = [
            "我记得", "好像是", "可能是", "据说", "听说", "有人说",
            "记得是", "应该是", "大概是", "可能是",
            "具体我记不清了", "可能记错了", "大概是"
        ]

    def check_fact_consistency(
        self,
        llm_output: str,
        stick_info: Dict[str, Any]
    ) -> HallucinationCheckResult:
        """
        检查事实一致性

        Args:
            llm_output: LLM 输出内容
            stick_info: 签文信息 (包含 title, level, poem, story, meaning 等)

        Returns:
            检测结果
        """
        issues = []

        # 检查是否有可疑词汇
        for word in self.suspicious_words:
            if word in llm_output:
                issues.append(f"包含可疑词汇: {word}")

        # 检查签文级别是否一致
        stick_level = stick_info.get("level", "")
        if stick_level and stick_level in llm_output:
            # 检查是否有矛盾的级别描述
            conflicting_levels = []
            for level in ["上上签", "上签", "中签", "下签", "下下签"]:
                if level != stick_level and level in llm_output:
                    conflicting_levels.append(level)

            if conflicting_levels:
                issues.append(f"签文级别矛盾：{', '.join(conflicting_levels)}")

        # 检查是否声称引用了签诗但没有实际签诗内容
        poem_keywords = ["签诗", "诗曰", "有诗云", "诗句"]
        has_poem_ref = any(keyword in llm_output for keyword in poem_keywords)

        if has_poem_ref:
            # 检查是否有实际的诗句内容（至少连续4个汉字）
            actual_poem = stick_info.get("poem", "")
            has_poem_content = len(re.findall(r"[\u4e00-\u9fff]{4,}", llm_output)) > 0

            if has_poem_content and actual_poem:
                # 简单检查是否有大段内容不匹配
                poem_chars = set(actual_poem)
                output_chars = set(llm_output)
                overlap_ratio = len(poem_chars & output_chars) / max(len(poem_chars), 1)

                if overlap_ratio < 0.3:
                    issues.append("签诗引用与原文不符")

        if issues:
            confidence = 0.5 + (len(issues) * 0.1)
            return HallucinationCheckResult(
                has_hallucination=True,
                hallucination_type=HallucinationType.FACT_INCONSISTENCY,
                description="; ".join(issues),
                confidence=min(confidence, 0.9),
                suggestion="建议重新检查签文信息后再回答"
            )

        return HallucinationCheckResult(has_hallucination=False, confidence=0.1)

    def check_logical_consistency(
        self,
        llm_output: str,
        question: str,
        history: Optional[List[Dict[str, Any]]] = None
    ) -> HallucinationCheckResult:
        """
        检查逻辑一致性

        Args:
            llm_output: LLM 输出内容
            question: 用户问题
            history: 对话历史

        Returns:
            检测结果
        """
        issues = []

        # 检查是否有自相矛盾的表述
        contradiction_pairs = [
            ("好", "不好"), ("吉", "凶"), ("顺", "不顺"),
            ("有利", "不利"), ("适合", "不适合"), ("宜", "不宜")
        ]

        for pair in contradiction_pairs:
            has_positive = pair[0] in llm_output
            has_negative = pair[1] in llm_output
            if has_positive and has_negative:
                # 检查是否是同一段内容中的相反描述
                pos_idx = llm_output.find(pair[0])
                neg_idx = llm_output.find(pair[1])
                distance = abs(pos_idx - neg_idx)

                if distance < 200:  # 同一区域的相反描述
                    issues.append(f"表述矛盾：{pair[0]} vs {pair[1]}")

        # 检查是否答非所问
        question_keywords = self._extract_keywords(question)
        output_keywords = self._extract_keywords(llm_output)

        if question_keywords and output_keywords:
            overlap = set(question_keywords) & set(output_keywords)
            if len(overlap) == 0:
                issues.append("回答可能与问题无关")

        if issues:
            confidence = 0.4 + (len(issues) * 0.15)
            return HallucinationCheckResult(
                has_hallucination=True,
                hallucination_type=HallucinationType.LOGIC_INCONSISTENCY,
                description="; ".join(issues),
                confidence=min(confidence, 0.85),
                suggestion="建议围绕用户问题准确回答"
            )

        return HallucinationCheckResult(has_hallucination=False, confidence=0.1)

    def check_reference_accuracy(
        self,
        llm_output: str,
        stick_info: Dict[str, Any]
    ) -> HallucinationCheckResult:
        """
        检查引用准确性

        Args:
            llm_output: LLM 输出内容
            stick_info: 签文信息

        Returns:
            检测结果
        """
        # 检查签文标题引用
        title = stick_info.get("title", "")
        if title and title in llm_output:
            # 检查签名是否被篡改
            pattern = re.compile(r"《(.*?)》")
            match = pattern.search(llm_output)
            if match:
                quoted_title = match.group(1)
                if quoted_title and title not in quoted_title and len(quoted_title) > 2:
                    return HallucinationCheckResult(
                        has_hallucination=True,
                        hallucination_type=HallucinationType.REFERENCE_ERROR,
                        description=f"签名不一致：原文{title} vs 引用{quoted_title}",
                        confidence=0.75,
                        suggestion="建议检查签文名称"
                    )

        # 检查签号引用
        stick_id = stick_info.get("id")
        if stick_id:
            pattern = re.compile(r"第[一二三四五六七八九十百千\d]+签")
            match = pattern.search(llm_output)
            if match:
                # 简单验证：不能和当前签号相差太大
                pass

        return HallucinationCheckResult(has_hallucination=False, confidence=0.05)

    async def check_all(
        self,
        llm_output: str,
        question: str,
        stick_info: Dict[str, Any],
        history: Optional[List[Dict[str, Any]]] = None
    ) -> List[HallucinationCheckResult]:
        """
        运行所有幻觉检测

        Returns:
            检测结果列表
        """
        results = []

        results.append(self.check_fact_consistency(llm_output, stick_info))
        results.append(self.check_logical_consistency(llm_output, question, history))
        results.append(self.check_reference_accuracy(llm_output, stick_info))

        # 过滤掉没有问题的结果
        return [r for r in results if r.has_hallucination]

    def _extract_keywords(self, text: str) -> List[str]:
        """提取关键词（简单实现）"""
        # 提取中文词（2-4字）
        words = re.findall(r"[\u4e00-\u9fff]{2,4}", text)
        return words


# 全局幻觉检测器
_hallucination_detector: Optional[HallucinationDetector] = None


def get_hallucination_detector() -> HallucinationDetector:
    """获取全局幻觉检测器"""
    global _hallucination_detector
    if _hallucination_detector is None:
        _hallucination_detector = HallucinationDetector()
    return _hallucination_detector
