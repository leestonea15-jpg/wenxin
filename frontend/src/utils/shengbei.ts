import { SHENGBEI_RESULTS, type ShengbeiResult as ShengbeiResultType } from './constants'

export interface ShengbeiThrow {
  left: 'yang' | 'yin'
  right: 'yang' | 'yin'
  result: ShengbeiResultType
}

export interface ShengbeiDivinationResult {
  times: 1 | 3
  throws: ShengbeiThrow[]
  final_verdict: string
  interpretation: string
}

const singleThrow = (): ShengbeiThrow => {
  const left = Math.random() > 0.5 ? 'yang' : 'yin'
  const right = Math.random() > 0.5 ? 'yang' : 'yin'

  let result: ShengbeiResultType
  if (left !== right) {
    result = SHENGBEI_RESULTS.SHENGBEI
  } else if (left === 'yang') {
    result = SHENGBEI_RESULTS.YANG_BEI
  } else {
    result = SHENGBEI_RESULTS.YIN_BEI
  }

  return { left, right, result }
}

const interpretSingle = (throwResult: ShengbeiThrow): { verdict: string; interpretation: string } => {
  switch (throwResult.result) {
    case SHENGBEI_RESULTS.SHENGBEI:
      return {
        verdict: '吉',
        interpretation: '圣杯一掷即中，所求之事顺遂。',
      }
    case SHENGBEI_RESULTS.YANG_BEI:
      return {
        verdict: '平',
        interpretation: '阳杯，神明已知，需再诚心祈求。',
      }
    case SHENGBEI_RESULTS.YIN_BEI:
      return {
        verdict: '凶',
        interpretation: '阴杯，所求之事时机未到，宜暂缓。',
      }
  }
}

const interpretThree = (throws: ShengbeiThrow[]): { verdict: string; interpretation: string } => {
  const shengbeiCount = throws.filter(t => t.result === SHENGBEI_RESULTS.SHENGBEI).length

  if (shengbeiCount >= 2) {
    return {
      verdict: '大吉',
      interpretation: `三次掷出 ${shengbeiCount} 次圣杯，所求之事大吉。`,
    }
  } else if (shengbeiCount === 1) {
    return {
      verdict: '吉',
      interpretation: '三次中有一次圣杯，所求之事可成，但需努力。',
    }
  } else {
    return {
      verdict: '平',
      interpretation: '三次皆无圣杯，建议重新祈求，或改日再问。',
    }
  }
}

export const tossShengbei = (times: 1 | 3): ShengbeiDivinationResult => {
  const throws: ShengbeiThrow[] = []

  for (let i = 0; i < times; i++) {
    throws.push(singleThrow())
  }

  const { verdict, interpretation } = times === 1
    ? interpretSingle(throws[0])
    : interpretThree(throws)

  return {
    times,
    throws,
    final_verdict: verdict,
    interpretation,
  }
}
