import { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hoverable?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, className, ...props }, ref) => {
    const baseClasses = 'rounded-xl bg-white border border-neutral-200 shadow-sm'
    const hoverClasses = hoverable
      ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer'
      : ''

    const Component = hoverable ? motion.div : 'div'

    return (
      <Component
        ref={ref as any}
        className={`${baseClasses} ${hoverClasses} ${className || ''}`}
        {...(props as any)}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

export default Card
