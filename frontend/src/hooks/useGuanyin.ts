import { useState, useCallback, useRef } from 'react'
import { GUANYIN_PAGE_STATES, type GuanyinPageState } from '../utils/constants'
import type { GuanyinStick } from '../utils/guanyin'
import { guanyinApi } from '../services/api'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UseGuanyinOptions {
  onNeedAuth?: () => void
  userId?: string | null
}

export const useGuanyin = ({ onNeedAuth: _onNeedAuth, userId }: UseGuanyinOptions = {}) => {
  const [pageState, setPageState] = useState<GuanyinPageState>(GUANYIN_PAGE_STATES.IDLE)
  const [question, setQuestion] = useState('')
  const [selectedStick, setSelectedStick] = useState<GuanyinStick | null>(null)
  const [conversation, setConversation] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightInput, setHighlightInput] = useState(false)
  const [recordId, setRecordId] = useState<string | null>(null)

  // 用于鼠标长按检测
  const isMousePressingRef = useRef(false)

  // 重置状态
  const reset = useCallback(() => {
    setPageState(GUANYIN_PAGE_STATES.IDLE)
    setQuestion('')
    setSelectedStick(null)
    setConversation([])
    setError(null)
    setIsLoading(false)
    setRecordId(null)
  }, [])

  // 聚焦输入框
  const focusInput = useCallback(() => {
    setPageState(GUANYIN_PAGE_STATES.INPUT_FOCUSED)
  }, [])

  // 失去焦点
  const blurInput = useCallback(() => {
    if (pageState === GUANYIN_PAGE_STATES.INPUT_FOCUSED) {
      setPageState(GUANYIN_PAGE_STATES.IDLE)
    }
  }, [pageState])

  // 选择手势控制模式
  const selectGestureMode = useCallback(() => {
    if (!question.trim()) {
      setHighlightInput(true)
      setTimeout(() => setHighlightInput(false), 2000)
      return
    }
    setPageState(GUANYIN_PAGE_STATES.GESTURE_MODE)
  }, [question])

  // 选择鼠标控制模式
  const selectMouseMode = useCallback(() => {
    if (!question.trim()) {
      setHighlightInput(true)
      setTimeout(() => setHighlightInput(false), 2000)
      return
    }
    setPageState(GUANYIN_PAGE_STATES.MOUSE_MODE)
  }, [question])

  // 保存记录（忽略错误，不影响用户体验）
  const saveRecordSilently = useCallback(async (stick: GuanyinStick) => {
    try {
      const result = await guanyinApi.saveRecord(userId || null, question, stick)
      setRecordId(result.id)
    } catch (err) {
      console.warn('保存记录失败:', err)
    }
  }, [userId, question])

  // 更新记录（忽略错误）
  const updateRecordSilently = useCallback(async (conv: Message[]) => {
    if (!recordId) return
    try {
      await guanyinApi.updateRecord(recordId, conv)
    } catch (err) {
      console.warn('更新记录失败:', err)
    }
  }, [recordId])

  // 开始抽签（内部方法）
  const startDraw = useCallback(async () => {
    setPageState(GUANYIN_PAGE_STATES.DRAWING)
    setError(null)

    try {
      // 模拟抽签动画
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 调用后端API抽签
      const result = await guanyinApi.draw()
      const stick = result.stick as GuanyinStick
      setSelectedStick(stick)

      // 显示结果
      setPageState(GUANYIN_PAGE_STATES.RESULT)

      // 异步保存记录
      saveRecordSilently(stick)

      // 调用AI初次解读
      if (question.trim()) {
        await interpretStick(stick, question)
      }
    } catch (err) {
      setError('抽签失败，请稍后重试')
      console.error('Draw error:', err)
      setPageState(GUANYIN_PAGE_STATES.IDLE)
    }
  }, [question, saveRecordSilently])

  // 手势抽签
  const gestureDraw = useCallback(async () => {
    if (pageState !== GUANYIN_PAGE_STATES.GESTURE_MODE) return
    await startDraw()
  }, [pageState, startDraw])

  // 鼠标长按开始
  const onMouseLongPress = useCallback(() => {
    if (pageState !== GUANYIN_PAGE_STATES.MOUSE_MODE) return
    isMousePressingRef.current = true
  }, [pageState])

  // 鼠标松开
  const onMouseRelease = useCallback(async () => {
    if (!isMousePressingRef.current) return
    isMousePressingRef.current = false

    if (pageState === GUANYIN_PAGE_STATES.MOUSE_MODE) {
      await startDraw()
    }
  }, [pageState, startDraw])

  // AI解读签文
  const interpretStick = useCallback(async (stick: GuanyinStick, userQuestion: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await guanyinApi.interpret(userQuestion, stick, userId)
      const aiMessage: Message = { role: 'assistant', content: result.interpretation }
      const newConversation = [aiMessage]
      setConversation(newConversation)

      // 异步更新记录
      updateRecordSilently(newConversation)
    } catch (err) {
      setError('解读失败，请稍后重试')
      console.error('Interpret error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId, updateRecordSilently])

  // 发送追问
  const sendFollowup = useCallback(async (followupQuestion: string) => {
    if (!selectedStick) return

    setIsLoading(true)
    setError(null)

    const userMessage: Message = { role: 'user', content: followupQuestion }
    const newConversation = [...conversation, userMessage]
    setConversation(newConversation)

    try {
      const result = await guanyinApi.followup(followupQuestion, selectedStick, conversation, userId)
      const aiMessage: Message = { role: 'assistant', content: result.reply }
      const finalConversation = [...newConversation, aiMessage]
      setConversation(finalConversation)

      // 异步更新记录
      updateRecordSilently(finalConversation)
    } catch (err) {
      setError('发送失败，请稍后重试')
      console.error('Followup error:', err)
      // 移除刚才添加的用户消息
      setConversation(conversation)
    } finally {
      setIsLoading(false)
    }
  }, [selectedStick, conversation, userId, updateRecordSilently])

  // 再测一次
  const retry = useCallback(() => {
    reset()
  }, [reset])

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
  }
}
