import { useState, useCallback } from 'react'
import { tossShengbei, type ShengbeiDivinationResult } from '../utils/shengbei'
import confetti from 'canvas-confetti'

export const useShengbei = () => {
  const [result, setResult] = useState<ShengbeiDivinationResult | null>(null)
  const [isTossing, setIsTossing] = useState(false)

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#de911d', '#737373', '#e5e5e5'],
    })
  }, [])

  const toss = useCallback(async (times: 1 | 3) => {
    setIsTossing(true)
    setResult(null)

    const delay = times === 1 ? 1500 : 2500
    await new Promise(resolve => setTimeout(resolve, delay))

    const newResult = tossShengbei(times)
    setResult(newResult)
    setIsTossing(false)

    if (newResult.final_verdict.includes('吉')) {
      triggerConfetti()
    }
  }, [triggerConfetti])

  const reset = useCallback(() => {
    setResult(null)
    setIsTossing(false)
  }, [])

  return {
    result,
    isTossing,
    toss,
    reset,
  }
}
