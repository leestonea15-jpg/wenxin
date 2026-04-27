interface ShengbeiProps {
  size?: number
  className?: string
  type?: 'default' | 'yang' | 'yin'
  gap?: number
}

const Shengbei = ({ size = 64, className = '', type = 'default', gap = 0 }: ShengbeiProps) => {
  // 根据 gap 调整 viewBox 宽度
  const baseWidth = 100
  const viewBoxWidth = baseWidth + gap

  // 计算右杯的位置偏移
  const rightCupOffset = 55 + gap / 2

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} 120`}
      width={size + (gap * size / baseWidth)}
      height={size * 1.2}
      className={className}
    >
      <defs>
        <linearGradient id="cupRedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="cupBrownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#422006" />
        </linearGradient>
      </defs>

      {/* 左杯 - 竖版月牙（与原设计相同） */}
      <g transform="translate(15, 30)">
        <path
          d="M 30 0 Q 5 30 30 60 Q 35 30 30 0"
          fill={type === 'yin' ? 'url(#cupBrownGradient)' : 'url(#cupRedGradient)'}
          stroke={type === 'yin' ? '#291500' : '#450a0a'}
          strokeWidth="1.5"
        />
      </g>

      {/* 右杯 - 左杯的完美镜像，形状完全相同 */}
      <g transform={`translate(${rightCupOffset}, 30)`}>
        <path
          d="M 0 0 Q 25 30 0 60 Q -5 30 0 0"
          fill={type === 'yang' ? 'url(#cupRedGradient)' : (type === 'yin' ? 'url(#cupBrownGradient)' : 'url(#cupRedGradient)')}
          stroke={type === 'yang' ? '#450a0a' : (type === 'yin' ? '#291500' : '#450a0a')}
          strokeWidth="1.5"
        />
      </g>
    </svg>
  )
}

export default Shengbei
