import random
from typing import List, Literal
from app.models import Coin, MoneyGuaResult


MONEY_GUA_COMBINATIONS = {
    "LAO_YANG": "lao_yang",
    "LAO_YIN": "lao_yin",
    "SHAO_YANG": "shao_yang",
    "SHAO_YIN": "shao_yin",
}


INTERPRETATIONS = {
    "lao_yang": {
        "verdict": "大吉",
        "interpretation": "三枚皆正，老阳之象，纯阳乾健，所求之事大吉大利，宜积极进取。",
    },
    "lao_yin": {
        "verdict": "大凶",
        "interpretation": "三枚皆反，老阴之象，纯阴坤柔，所求之事阻滞难行，宜静守待时。",
    },
    "shao_yang": {
        "verdict": "吉",
        "interpretation": "两正一反，少阳之象，阳气渐生，所求之事可成，但需稳步前行。",
    },
    "shao_yin": {
        "verdict": "平",
        "interpretation": "两反一正，少阴之象，阴气渐长，所求之事平顺，但需谨慎行事。",
    },
}


def _toss_coin() -> Coin:
    is_yang = random.random() > 0.5
    return Coin(
        side="yang" if is_yang else "yin",
        image="qianlong_front" if is_yang else "qianlong_back",
    )


def toss_money_gua() -> MoneyGuaResult:
    coins: List[Coin] = [_toss_coin(), _toss_coin(), _toss_coin()]
    yang_count = sum(1 for coin in coins if coin.side == "yang")

    combination: Literal["lao_yang", "lao_yin", "shao_yang", "shao_yin"]
    if yang_count == 3:
        combination = MONEY_GUA_COMBINATIONS["LAO_YANG"]
    elif yang_count == 0:
        combination = MONEY_GUA_COMBINATIONS["LAO_YIN"]
    elif yang_count == 2:
        combination = MONEY_GUA_COMBINATIONS["SHAO_YANG"]
    else:
        combination = MONEY_GUA_COMBINATIONS["SHAO_YIN"]

    verdict = INTERPRETATIONS[combination]["verdict"]
    interpretation = INTERPRETATIONS[combination]["interpretation"]

    return MoneyGuaResult(
        coins=coins,
        combination=combination,
        verdict=verdict,
        interpretation=interpretation,
    )
