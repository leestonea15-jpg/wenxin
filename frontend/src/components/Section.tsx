interface SectionProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

const Section = ({ title, subtitle, children, className }: SectionProps) => {
  return (
    <section className={`py-8 ${className || ''}`}>
      <div className="container-max">
        {(title || subtitle) && (
          <div className="mb-4 md:mb-6 text-center">
            {title && (
              <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-1">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs md:text-sm font-light text-gray-500 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="container-max">
        {children}
      </div>
    </section>
  )
}

export default Section
