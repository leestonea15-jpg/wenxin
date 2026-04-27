import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

type SignupMethod = 'email' | 'phone'

const Signup = () => {
  const [method, setMethod] = useState<SignupMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    setLoading(true)

    try {
      await signUp(method === 'email' ? email : phone, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container-max py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-neutral-800 font-serif mb-2">
                注册
              </h1>
              <p className="text-neutral-600">
                开始你的问心之旅
              </p>
            </div>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  method === 'email'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                邮箱注册
              </button>
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  method === 'phone'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                手机注册
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {method === 'email' ? (
                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              ) : (
                <Input
                  label="手机号"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              )}
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="确认密码"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={error}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-600">
              已有账号？{' '}
              <Link to="/auth/login" className="text-neutral-800 font-medium hover:underline">
                立即登录
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Signup
