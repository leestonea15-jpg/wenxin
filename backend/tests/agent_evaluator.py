"""
Agent 评测框架 - 完整版

自动运行测试用例，验证 Agent 的基本功能，
提供多维度的质量评估指标（1-5分制）。
"""
import asyncio
import yaml
import json
import time
import uuid
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

# 设置路径
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.models.schemas import GuanyinStick
from app.harness.guanyin_harness import get_harness


# 签文核心关键词库（核心词 + 相关语义词）
STICK_KEYWORDS = {
    1: {
        'core': ['良缘', '吉日', '忠正', '帝王宣'],
        'related': ['姻缘', '好时机', '正直', '贵人', '机遇', '成功', '圆满']
    },
    2: {
        'core': ['鲸鱼', '守江河', '升腾', '一跃龙门', '身价'],
        'related': ['厚积薄发', '沉淀', '等待', '转机', '跃升', '腾飞', '成功']
    },
    23: {
        'core': ['时运未来', '莫强求', '尘心', '贵人', '相引上瀛洲'],
        'related': ['等待时机', '暂困境', '贵人', '转机', '时来运转', '沉心']
    },
    58: {
        'core': ['金榜题名', '文章得意', '天有意', '名利双全'],
        'related': ['学业有成', '功名', '金榜题名', '文章', '成功', '努力', '考试']
    },
    81: {
        'core': ['枯木逢春', '再发芽', '时来运转', '荣华', '贵人指引', '万事亨通'],
        'related': ['时来运转', '贵人', '机遇', '转机', '事业', '好转']
    }
}

# 为其他签号添加默认关键词
for i in range(1, 101):
    if i not in STICK_KEYWORDS:
        STICK_KEYWORDS[i] = {
            'core': [],
            'related': ['运势', '签文', '指引', '建议', '努力', '时机', '等待']
        }


# 问题领域关键词
QUESTION_TOPICS = {
    '事业': ['工作', '事业', '职业', '换工作', '求职', '晋升', '职场', '生意', '创业'],
    '感情': ['感情', '姻缘', '爱情', '恋爱', '婚姻', '对象', '复合', '分手', '桃花'],
    '学业': ['学业', '学习', '考试', '考研', '升学', '成绩', '读书', '考学'],
    '财运': ['财运', '钱财', '财富', '投资', '理财', '生意', '求财', '收入'],
    '健康': ['健康', '身体', '病', '医疗', '平安', '安康'],
    '综合': ['运势', '运气', '未来', '前程', '怎么样', '如何', '看看']
}


@dataclass
class QualityScores:
    """质量评分 - 1-5分制"""
    length_score: int = 3      # 长度适宜性 (1-5)
    chinese_score: int = 3     # 中文检查 (1-5)
    structure_score: int = 3   # 结构完整性 (1-5)
    relevance_score: int = 3   # 内容相关性 (1-5) - 简单检查

    @property
    def total_score(self) -> float:
        """总分：加权平均后转为50分制"""
        weights = {
            'length_score': 0.20,      # 20%
            'chinese_score': 0.15,     # 15%
            'structure_score': 0.25,   # 25%
            'relevance_score': 0.40    # 40%
        }
        weighted_avg = (
            self.length_score * weights['length_score'] +
            self.chinese_score * weights['chinese_score'] +
            self.structure_score * weights['structure_score'] +
            self.relevance_score * weights['relevance_score']
        )
        return weighted_avg * 10  # 转为50分制


@dataclass
class EvaluationResult:
    """评测结果"""
    test_case_id: str
    test_case_name: str
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    latency: float = 0.0
    quality_scores: QualityScores = field(default_factory=QualityScores)


class AgentEvaluator:
    """Agent 评测器"""

    def __init__(self, test_cases_dir: str = "tests/test_cases"):
        self.test_cases_dir = Path(test_cases_dir)
        # 使用新的UUID格式的user_id，避免Supabase错误
        self.user_id = str(uuid.uuid4())
        self.harness = get_harness(use_new_implementation=True)
        self.results: List[EvaluationResult] = []

    def load_test_cases(self) -> List[Dict[str, Any]]:
        """加载所有测试用例"""
        all_cases = []

        if not self.test_cases_dir.exists():
            print(f"[Evaluator] 测试用例目录不存在: {self.test_cases_dir}")
            return all_cases

        for yaml_file in self.test_cases_dir.glob("*.yaml"):
            with open(yaml_file, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                cases = data.get("test_cases", [])
                all_cases.extend(cases)
                print(f"[Evaluator] 从 {yaml_file.name} 加载 {len(cases)} 个测试用例")

        return all_cases

    def evaluate_quality(self, output: str, question: str, stick: GuanyinStick) -> QualityScores:
        """
        多维度质量评估

        评估维度：
        1. 长度适宜性 - 根据系统提示词"不超过400字"
        2. 中文检查 - 确保都是中文
        3. 结构完整性 - 检查是否有签号、签名、解读等结构
        4. 内容相关性 - 检查是否结合签文核心含义和用户问题作答
        """
        scores = QualityScores()
        length = len(output)

        # 1. 长度评估 (1-5分)
        if length <= 400:
            scores.length_score = 5
        elif 400 < length <= 500:
            scores.length_score = 4
        elif 500 < length <= 600:
            scores.length_score = 3
        elif 600 < length <= 800:
            scores.length_score = 2
        else:
            scores.length_score = 1

        # 2. 中文检查 (1-5分) - 检查是否全是中文
        if length == 0:
            scores.chinese_score = 1
        else:
            # 只计算真正的英文字母、数字等（允许标点、空格、加粗符号**）
            non_cjk_count = sum(1 for c in output if
                               ('a' <= c.lower() <= 'z') or
                               ('0' <= c <= '9'))
            if non_cjk_count == 0:
                scores.chinese_score = 5
            elif non_cjk_count <= 3:
                scores.chinese_score = 4
            elif non_cjk_count <= 10:
                scores.chinese_score = 3
            elif non_cjk_count <= 20:
                scores.chinese_score = 2
            else:
                scores.chinese_score = 1

        # 3. 结构完整性 (1-5分)
        structure_indicators = 0
        # 检查签号相关
        if re.search(r'第[一二三四五六七八九十百\d]+签', output):
            structure_indicators += 1
        # 检查签名相关
        if stick.title in output:
            structure_indicators += 1
        # 检查吉凶相关
        if any(word in output for word in ['上上', '上签', '中签', '下签']):
            structure_indicators += 1
        # 检查是否有解读/建议性质的内容
        if any(word in output for word in ['意味着', '表明', '建议', '需要', '应该', '宜', '忌']):
            structure_indicators += 1
        # 检查加粗格式（系统要求）
        if '**' in output:
            structure_indicators += 1

        scores.structure_score = structure_indicators

        # 4. 内容相关性 (1-5分) - 用核心关键词 + 相关语义词检查
        relevance_score = 0
        max_relevance_score = 5

        # 获取该签的关键词
        stick_keywords = STICK_KEYWORDS.get(stick.id, {'core': [], 'related': []})
        all_stick_keywords = stick_keywords['core'] + stick_keywords['related']

        # 4.1 检查签文核心关键词命中情况 (2分)
        stick_hits = sum(1 for keyword in all_stick_keywords if keyword in output)
        if stick_hits >= 2:
            relevance_score += 2
        elif stick_hits >= 1:
            relevance_score += 1

        # 4.2 检查问题领域关键词命中情况 (2分)
        # 先识别用户问题属于哪个领域
        question_topic = None
        topic_hits = {}
        for topic, keywords in QUESTION_TOPICS.items():
            hits = sum(1 for keyword in keywords if keyword in question)
            topic_hits[topic] = hits

        # 获取命中最多的领域
        if topic_hits:
            question_topic = max(topic_hits.items(), key=lambda x: x[1])[0]

            # 检查AI回答是否命中该领域的关键词
            if question_topic in QUESTION_TOPICS:
                answer_topic_hits = sum(1 for keyword in QUESTION_TOPICS[question_topic] if keyword in output)
                if answer_topic_hits >= 3:
                    relevance_score += 2
                elif answer_topic_hits >= 2:
                    relevance_score += 1.5
                elif answer_topic_hits >= 1:
                    relevance_score += 1

        # 4.3 检查释义核心含义 (1分)
        if stick.meaning:
            meaning_keywords = stick.meaning.replace('，', '').replace('。', '')
            meaning_hits = sum(1 for word in meaning_keywords[:15] if word in output)
            if meaning_hits >= 3:
                relevance_score += 1
            elif meaning_hits >= 1:
                relevance_score += 0.5

        # 限制最高5分
        scores.relevance_score = min(round(relevance_score * 2) / 2, max_relevance_score)

        return scores

    async def run_single_test(self, test_case: Dict[str, Any]) -> EvaluationResult:
        """运行单个测试用例"""
        case_id = test_case.get("id", "unknown")
        case_name = test_case.get("name", "未命名")
        question = test_case.get("question", "")
        stick_data = test_case.get("stick", {})
        history = test_case.get("history", [])

        print(f"[Evaluator] 运行测试用例: {case_id} - {case_name}")

        try:
            # 构建签文对象 - 确保有完整数据
            stick = GuanyinStick(
                id=stick_data.get("id", 1),
                level=stick_data.get("level", "上上签"),
                title=stick_data.get("title", "姜太公遇文王"),
                poem=stick_data.get("poem", "时来时去自如通，万水千山总是通。忽遇太君来相引，那时相引得亨通。"),
                story=stick_data.get("story", "姜太公钓鱼等待周文王，后被重用"),
                meaning=stick_data.get("meaning", "时来运转，贵人相助，事业有成")
            )

            # 计时
            start_time = time.time()

            # 调用 Harness 处理主问题（不回放历史，简化测试）
            result = await self.harness.interpret_with_planning(
                question=question,
                stick=stick,
                user_id=self.user_id
            )

            latency = time.time() - start_time

            output = result.get("interpretation", "")

            # 多维度质量评估
            quality_scores = self.evaluate_quality(output, question, stick)

            eval_result = EvaluationResult(
                test_case_id=case_id,
                test_case_name=case_name,
                success=result.get("used_new_engine", False),
                output=output,
                latency=latency,
                quality_scores=quality_scores
            )

            print(f"[Evaluator] 测试完成: {case_id} - 得分 {quality_scores.total_score:.1f}/50 (耗时: {latency:.2f}秒)")
            print(f"             [长度:{quality_scores.length_score} 中文:{quality_scores.chinese_score} 结构:{quality_scores.structure_score} 相关:{quality_scores.relevance_score}]")
            return eval_result

        except Exception as e:
            print(f"[Evaluator] 测试出错: {case_id} - {e}")
            import traceback
            traceback.print_exc()
            return EvaluationResult(
                test_case_id=case_id,
                test_case_name=case_name,
                success=False,
                error=str(e)
            )

    async def run_all_tests(self) -> List[EvaluationResult]:
        """运行所有测试用例"""
        print("[Evaluator] 开始运行评测...")

        test_cases = self.load_test_cases()
        print(f"[Evaluator] 共 {len(test_cases)} 个测试用例")

        self.results = []
        for case in test_cases:
            result = await self.run_single_test(case)
            self.results.append(result)
            # 稍微延迟，避免过快调用
            await asyncio.sleep(0.5)

        return self.results

    def generate_report(self) -> Dict[str, Any]:
        """生成评测报告"""
        total = len(self.results)
        successful = sum(1 for r in self.results if r.success)

        # 计算质量分数统计
        if successful > 0:
            avg_total = sum(r.quality_scores.total_score for r in self.results if r.success) / successful
            avg_length = sum(r.quality_scores.length_score for r in self.results if r.success) / successful
            avg_chinese = sum(r.quality_scores.chinese_score for r in self.results if r.success) / successful
            avg_structure = sum(r.quality_scores.structure_score for r in self.results if r.success) / successful
            avg_relevance = sum(r.quality_scores.relevance_score for r in self.results if r.success) / successful
        else:
            avg_total = avg_length = avg_chinese = avg_structure = avg_relevance = 0

        avg_latency = sum(r.latency for r in self.results if r.success) / max(successful, 1)

        report = {
            "summary": {
                "total_test_cases": total,
                "successful": successful,
                "failure": total - successful,
                "success_rate": successful / total if total > 0 else 0,
                "average_latency_seconds": avg_latency,
                "average_total_score": avg_total,
                "average_dimensions": {
                    "length": avg_length,
                    "chinese": avg_chinese,
                    "structure": avg_structure,
                    "relevance": avg_relevance
                }
            },
            "details": [
                {
                    "id": r.test_case_id,
                    "name": r.test_case_name,
                    "success": r.success,
                    "latency": r.latency,
                    "total_score": r.quality_scores.total_score,
                    "dimensions": {
                        "length": r.quality_scores.length_score,
                        "chinese": r.quality_scores.chinese_score,
                        "structure": r.quality_scores.structure_score,
                        "relevance": r.quality_scores.relevance_score
                    },
                    "output_length": len(r.output) if r.output else 0,
                    "error": r.error
                }
                for r in self.results
            ],
            "generated_at": datetime.now().isoformat()
        }

        return report

    def save_report(self, report: Dict[str, Any], output_path: str = "evaluation_report.json"):
        """保存评测报告"""
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"[Evaluator] 评测报告已保存到: {output_path}")

    def print_pretty_report(self, report: Dict[str, Any]):
        """打印美观的报告"""
        print("\n" + "="*80)
        print("EVALUATION REPORT - Guanyin Agent")
        print("="*80)

        summary = report["summary"]
        print(f"\nFunctional Test:")
        print(f"  Total: {summary['total_test_cases']}")
        print(f"  Successful: {summary['successful']}  /  Failed: {summary['failure']}")
        print(f"  Success Rate: {summary['success_rate']:.1%}")
        print(f"  Avg Latency: {summary['average_latency_seconds']:.2f}s")

        print(f"\nQuality Scores (1-5 scale):")
        avg = summary["average_dimensions"]
        print(f"  Overall: {summary['average_total_score']:.1f}/50")
        print(f"  Length: {avg['length']:.1f}/5  |  Chinese: {avg['chinese']:.1f}/5")
        print(f"  Structure: {avg['structure']:.1f}/5  |  Relevance: {avg['relevance']:.1f}/5")

        print(f"\nDetailed Results:")
        print("-" * 80)
        for detail in report["details"]:
            status = "OK" if detail["success"] else "FAIL"
            dim = detail["dimensions"]
            print(f"[{status}] {detail['id']} - {detail['name']}")
            print(f"  Score: {detail['total_score']:.1f}/50 | Time: {detail['latency']:.2f}s")
            print(f"  Dim: L={dim['length']} C={dim['chinese']} S={dim['structure']} R={dim['relevance']} | Output: {detail['output_length']} chars")
            if detail.get("error"):
                print(f"  Error: {detail['error']}")
            print()

        print("="*80)


async def main():
    """主函数"""
    evaluator = AgentEvaluator()
    await evaluator.run_all_tests()
    report = evaluator.generate_report()
    evaluator.print_pretty_report(report)
    evaluator.save_report(report)


if __name__ == "__main__":
    asyncio.run(main())
