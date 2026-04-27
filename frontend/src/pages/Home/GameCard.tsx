import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Card from '../../components/Card'

interface GameCardProps {
  title: string
  description: string
  path: string
  icon: string
  comingSoon?: boolean
  isCore?: boolean
  onClick?: () => void
}

const GameCard = ({ title, description, path, icon, comingSoon = false, isCore = false, onClick }: GameCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (!comingSoon) {
      navigate(path)
    }
  }

  return (
    <motion.div
      whileHover={!comingSoon ? { scale: 1.03, y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        hoverable={!comingSoon}
        onClick={handleClick}
        className={`p-5 md:p-6 h-full relative overflow-hidden rounded-2xl transition-all duration-300 ${
          isCore || comingSoon
            ? 'border-2 border-orange-200 shadow-md hover:shadow-xl hover:border-orange-300'
            : 'border border-gray-100'
        }`}
      >
        {comingSoon && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 text-xs font-medium text-gray-400 bg-gray-100 rounded-full">
              即将上线
            </span>
          </div>
        )}
        <div className="text-2xl md:text-3xl mb-4">{icon}</div>
        <h3 className={`text-base md:text-lg font-semibold font-serif mb-2 ${
          isCore ? 'text-gray-900' : 'text-gray-800'
        }`}>
          {title}
        </h3>
        <p className="text-xs md:text-sm text-gray-500 leading-snug">
          {description}
        </p>
      </Card>
    </motion.div>
  )
}

export default GameCard
