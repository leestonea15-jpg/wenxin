import { useState, useCallback } from 'react'
import Layout from '../components/Layout'
import Section from '../components/Section'
import MoneyGuaSection from './DailySpeed/MoneyGuaSection'
import ShengbeiSection from './DailySpeed/ShengbeiSection'
import MoneyGuaModal from './DailySpeed/MoneyGuaModal'
import ShengbeiModal from './DailySpeed/ShengbeiModal'

const DailySpeed = () => {
  const [moneyGuaOpen, setMoneyGuaOpen] = useState(false)
  const [shengbeiOpen, setShengbeiOpen] = useState(false)

  const handleMoneyGuaStart = useCallback(() => {
    setMoneyGuaOpen(true)
  }, [])

  const handleShengbeiStart = useCallback(() => {
    setShengbeiOpen(true)
  }, [])

  const handleDivinationComplete = useCallback(() => {
    // 冷却机制已删除
  }, [])

  return (
    <Layout showBackButton>
      <div className="container-max py-12">
        <Section title="每日速测" subtitle="一分钟速测问吉凶">
          <div className="flex flex-col md:flex-row gap-6 min-h-[400px]">
            <div className="flex-1">
              <MoneyGuaSection onStart={handleMoneyGuaStart} />
            </div>
            <div className="flex-1">
              <ShengbeiSection onStart={handleShengbeiStart} />
            </div>
          </div>
        </Section>
      </div>
      <MoneyGuaModal
        isOpen={moneyGuaOpen}
        onClose={() => setMoneyGuaOpen(false)}
        onComplete={handleDivinationComplete}
      />
      <ShengbeiModal
        isOpen={shengbeiOpen}
        onClose={() => setShengbeiOpen(false)}
        onComplete={handleDivinationComplete}
      />
    </Layout>
  )
}

export default DailySpeed