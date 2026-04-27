interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

const Logo = ({ size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
  }

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* 外圈 - 圆形 */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="3"
        />
        {/* 内部"问"字 - 现代简约设计 */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="36"
          fontWeight="500"
          fill="url(#goldGradient)"
          style={{ fontFamily: 'serif' }}
        >
          问
        </text>
        {/* 金色渐变定义 */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0b429" />
            <stop offset="100%" stopColor="#de911d" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default Logo
