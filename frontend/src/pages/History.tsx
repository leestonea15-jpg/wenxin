import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import Section from '../components/Section'

const History = () => {
  return (
    <Layout showBackButton>
      <div className="container-max py-12">
        <Section title="历史记录" subtitle="查看你之前的测算记录">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-neutral-800 font-serif mb-2">
              敬请期待
            </h3>
            <p className="text-neutral-600">
              历史记录功能即将上线，登录后即可查看你的测算记录。
            </p>
          </motion.div>
        </Section>
      </div>
    </Layout>
  )
}

export default History
