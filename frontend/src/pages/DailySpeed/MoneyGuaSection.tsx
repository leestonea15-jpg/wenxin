import { motion } from 'framer-motion'
import Button from '../../components/Button'
import QianlongTongbao from '../../components/icons/QianlongTongbao'

interface MoneyGuaSectionProps {
  onStart: () => void
}

const MoneyGuaSection = ({ onStart }: MoneyGuaSectionProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex-1"
    >
      <div className="h-full min-h-[400px] bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
        <div className="mb-4">
          <QianlongTongbao size={72} />
        </div>
        <h3 className="text-2xl font-semibold text-neutral-800 font-serif mb-2">
          金钱卦
        </h3>
        <p className="text-neutral-600 mb-6 max-w-xs">
          三枚乾隆通宝，一掷定吉凶。
        </p>
        <Button onClick={onStart} size="lg">
          开始测算
        </Button>
      </div>
    </motion.div>
  )
}

export default MoneyGuaSection
