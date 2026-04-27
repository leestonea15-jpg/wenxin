/**
 * 观音灵签Agent核心逻辑 - 独立于React
 *
 * 零影响原则：
 * - 完全独立，不修改现有代码
 * - 可以与现有useGuanyin.ts共存
 */

import { AgentState, Message, WorkingMemory, AgentStatus } from './AgentState'

export class GuanyinAgent {
  private _state: AgentState = AgentState.IDLE
  private _memory: WorkingMemory = {
    currentStick: null,
    conversation: [],
    userQuestion: '',
    recordId: null,
    topicTags: [],
    sessionStartTime: new Date(),
  }
  private _isLoading = false
  private _error: string | null = null
  private _listeners: Array<(status: AgentStatus) => void> = []

  // 零影响：保留对现有API的引用
  private _useLegacyImplementation = true

  constructor(useLegacy: boolean = true) {
    this._useLegacyImplementation = useLegacy
  }

  get status(): AgentStatus {
    return {
      state: this._state,
      memory: { ...this._memory },
      isLoading: this._isLoading,
      error: this._error,
    }
  }

  subscribe(listener: (status: AgentStatus) => void) {
    this._listeners.push(listener)
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener)
    }
  }

  private _notify() {
    const status = this.status
    this._listeners.forEach(listener => listener(status))
  }

  // 状态转换方法
  transitionTo(state: AgentState) {
    const oldState = this._state
    this._state = state
    console.log(`[Agent] 状态转换: ${oldState} → ${state}`)
    this._notify()
  }

  setLoading(isLoading: boolean) {
    this._isLoading = isLoading
    this._notify()
  }

  setError(error: string | null) {
    this._error = error
    this._notify()
  }

  // 记忆操作
  setQuestion(question: string) {
    this._memory.userQuestion = question
    this._notify()
  }

  setStick(stick: any) {
    this._memory.currentStick = stick
    this._notify()
  }

  setRecordId(recordId: string) {
    this._memory.recordId = recordId
    this._notify()
  }

  addMessage(message: Message) {
    this._memory.conversation.push(message)
    // 保留最近20条
    if (this._memory.conversation.length > 20) {
      this._memory.conversation = this._memory.conversation.slice(-20)
    }
    this._notify()
  }

  setConversation(conversation: Message[]) {
    this._memory.conversation = conversation
    this._notify()
  }

  addTopicTags(tags: string[]) {
    this._memory.topicTags = [...new Set([...this._memory.topicTags, ...tags])]
    this._notify()
  }

  reset() {
    this._state = AgentState.IDLE
    this._memory = {
      currentStick: null,
      conversation: [],
      userQuestion: '',
      recordId: null,
      topicTags: [],
      sessionStartTime: new Date(),
    }
    this._isLoading = false
    this._error = null
    this._notify()
  }

  // 零影响：获取是否使用旧实现
  get useLegacyImplementation(): boolean {
    return this._useLegacyImplementation
  }

  set useLegacyImplementation(value: boolean) {
    this._useLegacyImplementation = value
  }
}

// 全局单例
let _agentInstance: GuanyinAgent | null = null

export function getGuanyinAgent(useLegacy: boolean = true): GuanyinAgent {
  if (!_agentInstance) {
    _agentInstance = new GuanyinAgent(useLegacy)
  }
  return _agentInstance
}
