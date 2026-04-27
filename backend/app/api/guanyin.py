"""
观音灵签API

整合Agent Harness架构，提供完整的签文解读功能：
- 记忆系统（工作记忆/短期记忆/记忆检索）
- Context工程（分层组织/动态调整）
- 反思引擎（质量检查/自动修正）
- 规划引擎（多步骤执行）
- 可观测性（日志/追踪/指标）
- 错误处理（重试/降级）

API接口保持完全兼容，内部实现已升级。
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Optional

from app.models.schemas import (
    DrawRequest, DrawResponse,
    InterpretRequest, InterpretResponse,
    FollowupRequest, FollowupResponse,
    SaveRecordRequest, SaveRecordResponse,
    UpdateRecordRequest, UpdateRecordResponse,
)
from app.services.guanyin import draw_stick
from app.harness.guanyin_harness import get_harness
from app.services.database import (
    create_divination_record,
    update_divination_record,
    save_agent_memory
)

router = APIRouter(prefix="/guanyin", tags=["guanyin"])

# 初始化Harness：启用新系统
harness = get_harness(use_new_implementation=True)


@router.post("/draw", response_model=DrawResponse)
async def draw_endpoint(request: DrawRequest):
    """
    抽取一支签

    零影响：完全不变，功能保持原样
    """
    stick = draw_stick()
    return DrawResponse(stick=stick)


@router.post("/interpret", response_model=InterpretResponse)
async def interpret_endpoint(request: InterpretRequest):
    """
    AI初次解读签文 - 使用完整的新系统

    流程：
    1. 规划执行步骤
    2. 检索相关记忆
    3. 构建Context
    4. 生成解读
    5. 反思检查
    6. 保存记忆

    零影响：API接口完全不变
    """
    print("=" * 80)
    print("[API] 开始新解读")
    print(f"[API] 用户ID: {request.user_id}")
    print(f"[API] 问题: {request.question[:50]}...")
    print(f"[API] 签文: {request.stick.title}({request.stick.level})")
    print("=" * 80)

    try:
        result = await harness.interpret_with_planning(
            question=request.question,
            stick=request.stick,
            user_id=request.user_id
        )

        print(f"[API] 解读完成！")
        print(f"[API] 使用新引擎: {result.get('used_new_engine', False)}")
        print(f"[API] 是否降级: {result.get('fallback', False)}")

        # 调试日志：检查返回内容
        interpretation = result["interpretation"]
        print(f"[API] 返回内容长度: {len(interpretation)}")
        print(f"[API] 返回内容前100字符: {interpretation[:100]}")
        print(f"[API] 返回内容后100字符: {interpretation[-100:]}")
        print("=" * 80)

        return InterpretResponse(interpretation=interpretation)

    except Exception as e:
        print(f"[API] 解读异常: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/followup", response_model=FollowupResponse)
async def followup_endpoint(request: FollowupRequest):
    """
    AI追问 - 使用完整的新系统

    流程：
    1. 构建对话Context
    2. 检索相关记忆
    3. 生成回复
    4. 反思检查

    零影响：API接口完全不变
    """
    print("=" * 80)
    print("[API] 开始追问")
    print(f"[API] 用户ID: {request.user_id}")
    print(f"[API] 问题: {request.question[:50]}...")
    print(f"[API] 历史轮数: {len(request.history)}")
    print("=" * 80)

    try:
        result = await harness.followup_with_planning(
            question=request.question,
            stick=request.stick,
            history=request.history,
            user_id=request.user_id
        )

        print(f"[API] 追问完成！")
        print(f"[API] 使用新引擎: {result.get('used_new_engine', False)}")

        # 调试日志：检查返回内容
        reply = result["reply"]
        print(f"[API] 返回内容长度: {len(reply)}")
        print(f"[API] 返回内容前100字符: {reply[:100]}")
        print(f"[API] 返回内容后100字符: {reply[-100:]}")
        print("=" * 80)

        return FollowupResponse(reply=reply)

    except Exception as e:
        print(f"[API] 追问异常: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-record", response_model=SaveRecordResponse)
async def save_record_endpoint(request: SaveRecordRequest):
    """
    保存测算记录 - 同时保存记忆

    零影响：API接口完全不变

    新增功能：
    - 同时保存到agent_memory表
    - 提取话题标签
    - 生成摘要
    """
    print("=" * 80)
    print("[API] 收到 save-record 请求！")
    print(f"[API] 用户ID: {request.user_id}")
    print(f"[API] 问题: {request.question}")
    print(f"[API] 有签文: {request.stick is not None}")
    print("=" * 80)

    try:
        # 1. 保存原有记录（向后兼容）
        record_id = await create_divination_record(
            user_id=request.user_id,
            question=request.question,
            stick=request.stick,
            conversation=request.conversation,
        )
        print(f"[API] 原记录已保存，ID: {record_id}")

        # 2. 保存到记忆表
        memory_id = None
        if request.user_id and request.stick:
            try:
                # 提取话题标签
                question = request.question or ""
                tags = harness.memory.extract_topic_tags(question)

                # 生成摘要
                summary = f"关于「{question}」的{request.stick.title}({request.stick.level})"

                print(f"[API] 开始保存记忆到数据库...")
                memory_id = await save_agent_memory(
                    user_id=request.user_id,
                    memory_layer="short_term",
                    memory_type="divination",
                    content={
                        "question": question,
                        "stick": request.stick.model_dump(),
                    },
                    summary=summary,
                    topic_tags=tags,
                    stick_id=request.stick.id,
                    expires_at=datetime.utcnow() + timedelta(days=7)
                )

                if memory_id:
                    print("=" * 80)
                    print(f"[API] SUCCESS 记忆已保存到数据库！ID: {memory_id}")
                    print("=" * 80)
                else:
                    print("=" * 80)
                    print(f"[API] ERROR 记忆保存失败！")
                    print("=" * 80)

            except Exception as e:
                print("=" * 80)
                print(f"[API] ERROR 保存记忆异常: {e}")
                print("=" * 80)
                import traceback
                traceback.print_exc()

        # 3. 设置Harness中的记录ID
        if memory_id:
            harness.set_record_id(record_id)

        created_at = datetime.utcnow()
        return SaveRecordResponse(id=record_id, created_at=created_at)

    except Exception as e:
        print(f"[API] save-record 异常: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-record/{record_id}", response_model=UpdateRecordResponse)
async def update_record_endpoint(record_id: str, request: UpdateRecordRequest):
    """
    更新测算记录 - 保持不变

    零影响：完全不变
    """
    try:
        success = await update_divination_record(
            record_id=record_id,
            conversation=request.conversation,
        )
        if not success:
            raise HTTPException(status_code=404, detail="Record not found")
        updated_at = datetime.utcnow()
        return UpdateRecordResponse(success=True, updated_at=updated_at)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
