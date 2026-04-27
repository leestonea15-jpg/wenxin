import { useEffect, useRef } from 'react'

export const GuanyinNoise = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置canvas大小
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // 生成噪点
    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255
        data[i] = noise     // R
        data[i + 1] = noise // G
        data[i + 2] = noise // B
        data[i + 3] = Math.random() * 50 + 15 // Alpha: 0.15-0.2
      }

      ctx.putImageData(imageData, 0, 0)
    }

    // 初始生成
    generateNoise()

    // 定期更新噪点（每200ms）
    const interval = setInterval(generateNoise, 200)

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(interval)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'overlay' }}
    />
  )
}
