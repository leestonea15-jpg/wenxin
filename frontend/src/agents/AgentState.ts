/**
 * Agent状态定义 - 独立于React的状态管理
 *
 * 零影响原则：
 * - 不依赖React状态独立，不修改现有useGuanyin.ts
 */

export enum AgentState {
  IDLE = 'IDLE',
  INPUT_COLLECTING = 'INPUT_COLLECTING',
  GESTURE_MODE = 'GESTURE_MODE',
  MOUSE_MODE = 'MOUSE_MODE',
  DRAWING = 'DRAWING',
  INTERPRETING = 'INTERPRETING',
  FOLLOWUP = 'FOLLOWUP',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface WorkingMemory {
  currentStick: any | null
  conversation: Message[]
  userQuestion: string
  recordId: string | null
  topicTags: string[]
  sessionStartTime: Date
}

export interface AgentStatus {
  state: AgentState
  memory: WorkingMemory
  isLoading: boolean
  error: string | null
}
