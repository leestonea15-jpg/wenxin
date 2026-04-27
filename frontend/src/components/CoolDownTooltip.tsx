import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CoolDownTooltipProps {
  isVisible: boolean
  message: string
  onClose: () => void
}

const CoolDownTooltip = ({ isVisible, message, onClose }: CoolDownTooltipProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute -top-16 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="bg-neutral-800 text-white px-4 py-3 rounded-lg shadow-lg text-center max-w-xs">
            <p className="text-sm">{message}</p>
          </div>
          {/* 小箭头 */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-neutral-800" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CoolDownTooltip
