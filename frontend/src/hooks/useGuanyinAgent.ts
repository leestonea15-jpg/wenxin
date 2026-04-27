/**
 * React桥接Hook - useGuanyinAgent
 *
 * 零影响原则：
 * - 完全独立于现有useGuanyin.ts
 * - 两个Hook可以共存
 * - 默认继续使用旧实现
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GuanyinAgent, getGuanyinAgent } from '../agents/GuanyinAgent'
import { AgentStatus, Message, AgentState } from '../agents/AgentState'
import { GUANYIN_PAGE_STATES, type GuanyinPageState } from '../utils/constants'
import { guanyinApi } from '../services/api'

// 零影响：继续使用现有API
// 新Hook只是包装了独立的Agent状态，但仍然调用相同的后端API

interface UseGuanyinAgentOptions {
  userId?: string | null
  useLegacy?: boolean  // 零影响：默认true，继续用旧实现逻辑
}

// 页面状态映射（为了兼容现有UI组件）
const agentStateToPageState: Record<AgentState, GuanyinPageState> = {
  [AgentState.IDLE]: GUANYIN_PAGE_STATES.IDLE,
  [AgentState.INPUT_COLLECTING]: GUANYIN_PAGE_STATES.INPUT_FOCUSED,
  [AgentState.GESTURE_MODE]: GUANYIN_PAGE_STATES.GESTURE_MODE,
  [AgentState.MOUSE_MODE]: GUANYIN_PAGE_STATES.MOUSE_MODE,
  [AgentState.DRAWING]: GUANYIN_PAGE_STATES.DRAWING,
  [AgentState.INTERPRETING]: GUANYIN_PAGE_STATES.DRAWING,  // 复用
  [AgentState.FOLLOWUP]: GUANYIN_PAGE_STATES.RESULT,
  [AgentState.COMPLETED]: GUANYIN_PAGE_STATES.RESULT,
  [AgentState.ERROR]: GUANYIN_PAGE_STATES.IDLE,
}

export function useGuanyinAgent({
  userId,
  useLegacy = true,
}: UseGuanyinAgentOptions = {}) {
  // 获取Agent实例（单例）
  const agentRef = useRef<GuanyinAgent | null>(null)
  if (!agentRef.current) {
    agentRef.current = getGuanyinAgent(useLegacy)
  }
  const agent = agentRef.current

  // 本地React状态（仅用于UI渲染）
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(agent.status)

  // 计算兼容的页面状态
  const pageState = agentStateToPageState[agentStatus.state]

  // 订阅Agent状态变化
  useEffect(() => {
    return agent.subscribe((status) => {
      setAgentStatus(status)
    })
  }, [agent])

  // 零影响：保持与现有useGuanyin.ts相同的接口
  // 这样可以在UI层无痛切换

  const question = agentStatus.memory.userQuestion
  const selectedStick = agentStatus.memory.currentStick
  const conversation = agentStatus.memory.conversation
  const isLoading = agentStatus.isLoading
  const error = agentStatus.error
  const [highlightInput, setHighlightInput] = useState(false)

  // 用于鼠标长按检测
  const isMousePressingRef = useRef(false)

  // 跟踪后台是否正在生成解读
  const isInterpretingRef = useRef(false)
  // 跟踪解读是否已经生成完成
  const interpretationReadyRef = useRef(false)

  // 设置问题
  const setQuestion = useCallback((q: string) => {
    agent.setQuestion(q)
  }, [agent])

  // 聚焦输入
  const focusInput = useCallback(() => {
    agent.transitionTo(AgentState.INPUT_COLLECTING)
  }, [agent])

  // 失焦输入
  const blurInput = useCallback(() => {
    if (agentStatus.state === AgentState.INPUT_COLLECTING) {
      agent.transitionTo(AgentState.IDLE)
    }
  }, [agent, agentStatus.state])

  // 选择手势模式
  const selectGestureMode = useCallback(() => {
    if (!question.trim()) {
      setHighlightInput(true)
      setTimeout(() => setHighlightInput(false), 2000)
      return
    }
    agent.transitionTo(AgentState.GESTURE_MODE)
  }, [question, agent])

  // 选择鼠标模式
  const selectMouseMode = useCallback(() => {
    if (!question.trim()) {
      setHighlightInput(true)
      setTimeout(() => setHighlightInput(false), 2000)
      return
    }
    agent.transitionTo(AgentState.MOUSE_MODE)
  }, [question, agent])

  // 开始抽签（内部方法）
  const startDraw = useCallback(async () => {
    agent.transitionTo(AgentState.DRAWING)
    agent.setLoading(true)
    agent.setError(null)

    try {
      // 模拟抽签动画（与现有实现保持一致）
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 调用后端API（零影响：继续使用现有API）
      const result = await guanyinApi.draw()
      const stick = result.stick
      agent.setStick(stick)

      // 显示结果
      agent.transitionTo(AgentState.COMPLETED)

      // 异步保存记录
      try {
        const saveResult = await guanyinApi.saveRecord(userId || null, question, stick)
        agent.setRecordId(saveResult.id)
      } catch (err) {
        console.warn('保存记录失败:', err)
      }

      // 调用AI初次解读
      if (question.trim()) {
        // 先不结束loading，让"AI正在解签"继续显示
        // interpretStick 内部会在 finally 中处理 loading 状态
        await interpretStick(stick, question)
      } else {
        // 没有问题时才立即结束 loading
        agent.setLoading(false)
      }
    } catch (err) {
      agent.setError('抽签失败，请稍后重试')
      console.error('Draw error:', err)
      agent.transitionTo(AgentState.IDLE)
      agent.setLoading(false)
    }
    // 注意：finally 块去掉了，因为 interpretStick 内部会处理 loading
  }, [agent, question, userId])

  // 手势抽签
  const gestureDraw = useCallback(async () => {
    if (agentStatus.state !== AgentState.GESTURE_MODE) return
    await startDraw()
  }, [agentStatus.state, startDraw])

  // 鼠标长按开始
  const onMouseLongPress = useCallback(() => {
    if (agentStatus.state !== AgentState.MOUSE_MODE) return
    isMousePressingRef.current = true
  }, [agentStatus.state])

  // 鼠标松开
  const onMouseRelease = useCallback(async () => {
    if (!isMousePressingRef.current) return
    isMousePressingRef.current = false

    if (agentStatus.state === AgentState.MOUSE_MODE) {
      await startDraw()
    }
  }, [agentStatus.state, startDraw])

  // AI解读签文
  const interpretStick = useCallback(async (stick: any, userQuestion: string) => {
    // 如果已经在生成中，不要重复生成
    if (isInterpretingRef.current) return

    isInterpretingRef.current = true
    interpretationReadyRef.current = false
    agent.setLoading(true)
    agent.setError(null)

    try {
      // 传递用户ID给后端，让记忆系统能工作
      const result = await guanyinApi.interpret(userQuestion, stick, userId)
      const aiMessage: Message = {
        role: 'assistant',
        content: result.interpretation
      }

      agent.addMessage(aiMessage)
      agent.transitionTo(AgentState.COMPLETED)
      interpretationReadyRef.current = true
    } catch (err) {
      agent.setError('解读失败，请稍后重试')
      console.error('Interpret error:', err)
    } finally {
      agent.setLoading(false)
      isInterpretingRef.current = false
    }
  }, [agent, userId])

  // 确保解读已准备好（用户点击"专业解读"时调用）
  const ensureInterpretation = useCallback(async () => {
    if (!selectedStick) return

    // 如果解读已经准备好了，什么都不用做
    if (interpretationReadyRef.current && conversation.length > 0) {
      return
    }

    // 如果没有问题，就不需要解读
    if (!question.trim()) {
      return
    }

    // 如果正在生成中，只需要设置 loading 状态让用户看到
    if (isInterpretingRef.current) {
      agent.setLoading(true)
      // 等待后台生成完成
      while (isInterpretingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    // 如果还没开始生成，现在开始
    await interpretStick(selectedStick, question)
  }, [selectedStick, question, conversation, interpretStick, agent])

  // 发送追问
  const sendFollowup = useCallback(async (followupQuestion: string) => {
    if (!selectedStick) return

    agent.setLoading(true)
    agent.setError(null)

    const userMessage: Message = { role: 'user', content: followupQuestion }
    agent.addMessage(userMessage)

    try {
      // 传递用户ID给后端，让记忆系统能工作
      const result = await guanyinApi.followup(followupQuestion, selectedStick, conversation, userId)
      const aiMessage: Message = {
        role: 'assistant',
        content: result.reply
      }
      agent.addMessage(aiMessage)

      agent.transitionTo(AgentState.COMPLETED)
    } catch (err) {
      agent.setError('发送失败，请稍后重试')
      console.error('Followup error:', err)
      // 移除刚才添加的用户消息
      agent.setConversation(conversation)
    } finally {
      agent.setLoading(false)
    }
  }, [selectedStick, conversation, agent, userId])

  // 再测一次
  const retry = useCallback(() => {
    agent.reset()
    isInterpretingRef.current = false
    interpretationReadyRef.current = false
  }, [agent])

  // 重置
  const reset = useCallback(() => {
    agent.reset()
    isInterpretingRef.current = false
    interpretationReadyRef.current = false
  }, [agent])

  // 返回与现有useGuanyin.ts完全相同的接口
  // 这是零影响原则的关键：UI层不知道区别
  return {
    pageState,
    question,
    setQuestion,
    selectedStick,
    conversation,
    isLoading,
    error,
    highlightInput,

    focusInput,
    blurInput,
    selectGestureMode,
    selectMouseMode,
    gestureDraw,
    onMouseLongPress,
    onMouseRelease,
    sendFollowup,
    retry,
    reset,

    // 新方法：确保解读已准备好
    ensureInterpretation,

    // 新Hook的额外方法（可选使用）
    agentStatus,
    agent,
  }
}
