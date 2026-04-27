import json
import random
from pathlib import Path
from typing import List
from app.models.schemas import GuanyinStick

# JSON文件路径
DATA_DIR = Path(__file__).parent.parent.parent / "data"
GUANYIN_STICKS_PATH = DATA_DIR / "guanyin_sticks.json"

# 全局缓存
GUANYIN_STICKS: List[GuanyinStick] = []


def load_guanyin_sticks() -> None:
    """从JSON文件加载签文数据"""
    global GUANYIN_STICKS

    if not GUANYIN_STICKS_PATH.exists():
        raise FileNotFoundError(f"签文数据文件不存在: {GUANYIN_STICKS_PATH}")

    with open(GUANYIN_STICKS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    GUANYIN_STICKS = [GuanyinStick(**item) for item in data]


def draw_stick() -> GuanyinStick:
    """随机抽取一支签"""
    if not GUANYIN_STICKS:
        load_guanyin_sticks()
    return random.choice(GUANYIN_STICKS)


def get_stick_by_id(stick_id: int) -> GuanyinStick | None:
    """根据ID获取签文"""
    if not GUANYIN_STICKS:
        load_guanyin_sticks()
    for stick in GUANYIN_STICKS:
        if stick.id == stick_id:
            return stick
    return None


# 启动时尝试加载
try:
    load_guanyin_sticks()
except Exception as e:
    print(f"警告：加载签文数据失败: {e}")
