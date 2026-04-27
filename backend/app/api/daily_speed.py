from fastapi import APIRouter, HTTPException
from app.models import (
    MoneyGuaResult,
    MoneyGuaRequest,
    ShengbeiResult,
    ShengbeiRequest,
)
from app.services import toss_money_gua, toss_shengbei

router = APIRouter(prefix="/daily-speed", tags=["daily-speed"])


@router.post("/money-gua", response_model=MoneyGuaResult)
async def money_gua_divination(request: MoneyGuaRequest) -> MoneyGuaResult:
    """
    Perform a money gua divination.
    """
    try:
        result = toss_money_gua()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to perform divination")


@router.post("/shengbei", response_model=ShengbeiResult)
async def shengbei_divination(request: ShengbeiRequest) -> ShengbeiResult:
    """
    Perform a shengbei divination.
    """
    try:
        result = toss_shengbei(request.times)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to perform divination")
