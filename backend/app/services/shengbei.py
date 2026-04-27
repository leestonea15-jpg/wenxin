import random
from typing import List, Literal
from app.models import ShengbeiThrow, ShengbeiResult


SHENGBEI_RESULTS = {
    "SHENGBEI": "shengbei",
    "YANG_BEI": "yang_bei",
    "YIN_BEI": "yin_bei",
}


def _single_throw() -> ShengbeiThrow:
    left = "yang" if random.random() > 0.5 else "yin"
    right = "yang" if random.random() > 0.5 else "yin"

    result: Literal["shengbei", "yang_bei", "yin_bei"]
    if left != right:
        result = SHENGBEI_RESULTS["SHENGBEI"]
    elif left == "yang":
        result = SHENGBEI_RESULTS["YANG_BEI"]
    else:
        result = SHENGBEI_RESULTS["YIN_BEI"]

    return ShengbeiThrow(left=left, right=right, result=result)


def _interpret_single(throw_result: ShengbeiThrow) -> dict:
    if throw_result.result == SHENGBEI_RESULTS["SHENGBEI"]:
        return {
            "verdict": "吉",
            "interpretation": "圣杯一掷即中，所求之事顺遂。",
        }
    elif throw_result.result == SHENGBEI_RESULTS["YANG_BEI"]:
        return {
            "verdict": "平",
            "interpretation": "阳杯，神明已知，需再诚心祈求。",
        }
    else:
        return {
            "verdict": "凶",
            "interpretation": "阴杯，所求之事时机未到，宜暂缓。",
        }


def _interpret_three(throws: List[ShengbeiThrow]) -> dict:
    shengbei_count = sum(1 for t in throws if t.result == SHENGBEI_RESULTS["SHENGBEI"])

    if shengbei_count >= 2:
        return {
            "verdict": "大吉",
            "interpretation": f"三次掷出 {shengbei_count} 次圣杯，所求之事大吉。",
        }
    elif shengbei_count == 1:
        return {
            "verdict": "吉",
            "interpretation": "三次中有一次圣杯，所求之事可成，但需努力。",
        }
    else:
        return {
            "verdict": "平",
            "interpretation": "三次皆无圣杯，建议重新祈求，或改日再问。",
        }


def toss_shengbei(times: Literal[1, 3]) -> ShengbeiResult:
    throws: List[ShengbeiThrow] = []

    for _ in range(times):
        throws.append(_single_throw())

    if times == 1:
        interpretation = _interpret_single(throws[0])
    else:
        interpretation = _interpret_three(throws)

    return ShengbeiResult(
        times=times,
        throws=throws,
        final_verdict=interpretation["verdict"],
        interpretation=interpretation["interpretation"],
    )
