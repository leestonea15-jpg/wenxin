import { useState, useCallback } from 'react'
import { tossMoneyGua, type MoneyGuaResult } from '../utils/moneyGua'
import confetti from 'canvas-confetti'

export const useMoneyGua = () => {
  const [result, setResult] = useState<MoneyGuaResult | null>(null)
  const [isTossing, setIsTossing] = useState(false)

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f0b429', '#737373', '#e5e5e5'],
    })
  }, [])

  const toss = useCallback(async () => {
    setIsTossing(true)
    setResult(null)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const newResult = tossMoneyGua()
    setResult(newResult)
    setIsTossing(false)

    if (newResult.verdict.includes('吉')) {
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
