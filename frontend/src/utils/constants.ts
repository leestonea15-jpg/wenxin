// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string

export const GAME_TYPES = {
  MONEY_GUA: 'money_gua',
  SHENGBEI: 'shengbei',
  GUANYIN: 'guanyin',
  TAROT: 'tarot',
  BAZI: 'bazi',
} as const

export type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES]

export const MONEY_GUA_COMBINATIONS = {
  LAO_YANG: 'lao_yang',
  LAO_YIN: 'lao_yin',
  SHAO_YANG: 'shao_yang',
  SHAO_YIN: 'shao_yin',
} as const

export type MoneyGuaCombination = typeof MONEY_GUA_COMBINATIONS[keyof typeof MONEY_GUA_COMBINATIONS]

export const SHENGBEI_RESULTS = {
  SHENGBEI: 'shengbei',
  YANG_BEI: 'yang_bei',
  YIN_BEI: 'yin_bei',
} as const

export type ShengbeiResult = typeof SHENGBEI_RESULTS[keyof typeof SHENGBEI_RESULTS]

// 观音灵签
export const GUANYIN_LEVELS = {
  TOP_TOP: '上上签',
  TOP: '上签',
  MIDDLE: '中签',
  BOTTOM: '下签',
  BOTTOM_BOTTOM: '下下签',
} as const

export type GuanyinLevel = typeof GUANYIN_LEVELS[keyof typeof GUANYIN_LEVELS]

export const GUANYIN_PAGE_STATES = {
  IDLE: 'idle',
  INPUT_FOCUSED: 'input_focused',
  GESTURE_MODE: 'gesture_mode',
  MOUSE_MODE: 'mouse_mode',
  DRAWING: 'drawing',
  RESULT: 'result',
} as const

export type GuanyinPageState = typeof GUANYIN_PAGE_STATES[keyof typeof GUANYIN_PAGE_STATES]
