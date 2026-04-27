from typing import List, Optional, Literal
from pydantic import BaseModel
from datetime import datetime


# Money Gua Types
class Coin(BaseModel):
    side: Literal["yang", "yin"]
    image: Literal["qianlong_front", "qianlong_back"]


class MoneyGuaResult(BaseModel):
    coins: List[Coin]
    combination: Literal["lao_yang", "lao_yin", "shao_yang", "shao_yin"]
    verdict: str
    interpretation: str


class MoneyGuaRequest(BaseModel):
    question: Optional[str] = None


# Shengbei Types
class ShengbeiThrow(BaseModel):
    left: Literal["yang", "yin"]
    right: Literal["yang", "yin"]
    result: Literal["shengbei", "yang_bei", "yin_bei"]


class ShengbeiResult(BaseModel):
    times: Literal[1, 3]
    throws: List[ShengbeiThrow]
    final_verdict: str
    interpretation: str


class ShengbeiRequest(BaseModel):
    times: Literal[1, 3]
    question: Optional[str] = None


# Record Types
class DivinationRecordCreate(BaseModel):
    type: Literal["money_gua", "shengbei", "guanyin", "tarot", "bazi"]
    question: Optional[str] = None
    result: dict


class DivinationRecord(BaseModel):
    id: str
    user_id: str
    type: str
    question: Optional[str] = None
    result: dict
    created_at: datetime

    class Config:
        from_attributes = True


# Guanyin Types
class GuanyinStick(BaseModel):
    id: int
    level: str
    title: str
    poem: str
    story: str
    meaning: str


class Message(BaseModel):
    role: str
    content: str


class DrawRequest(BaseModel):
    pass


class DrawResponse(BaseModel):
    stick: GuanyinStick


class InterpretRequest(BaseModel):
    question: str
    stick: GuanyinStick
    user_id: Optional[str] = None


class InterpretResponse(BaseModel):
    interpretation: str


class FollowupRequest(BaseModel):
    question: str
    stick: GuanyinStick
    history: List[Message]
    user_id: Optional[str] = None


class FollowupResponse(BaseModel):
    reply: str


class SaveRecordRequest(BaseModel):
    user_id: str
    question: str
    stick: GuanyinStick
    conversation: Optional[List[Message]] = None


class SaveRecordResponse(BaseModel):
    id: str
    created_at: datetime


class UpdateRecordRequest(BaseModel):
    conversation: List[Message]


class UpdateRecordResponse(BaseModel):
    success: bool
    updated_at: datetime
