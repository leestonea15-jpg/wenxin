interface QianlongTongbaoProps {
  size?: number
  className?: string
}

const QianlongTongbao = ({ size = 64, className = '' }: QianlongTongbaoProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="coinGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7c948" />
          <stop offset="50%" stopColor="#f0b429" />
          <stop offset="100%" stopColor="#de911d" />
        </linearGradient>
      </defs>

      {/* 外圆 */}
      <circle cx="50" cy="50" r="45" fill="url(#coinGoldGradient)" />

      {/* 内方孔 */}
      <rect x="35" y="35" width="30" height="30" fill="#171717" />

      {/* 文字 - 乾隆通宝 */}
      <text x="50" y="28" textAnchor="middle" fontSize="14" fill="#8d2b0b" fontWeight="bold">
        乾
      </text>
      <text x="50" y="78" textAnchor="middle" fontSize="14" fill="#8d2b0b" fontWeight="bold">
        隆
      </text>
      <text x="22" y="55" textAnchor="middle" fontSize="14" fill="#8d2b0b" fontWeight="bold">
        通
      </text>
      <text x="78" y="55" textAnchor="middle" fontSize="14" fill="#8d2b0b" fontWeight="bold">
        宝
      </text>

      {/* 边缘阴影效果 */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#cb6e17" strokeWidth="2" />
    </svg>
  )
}

export default QianlongTongbao
