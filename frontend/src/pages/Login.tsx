import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

type LoginMethod = 'email' | 'phone'

const Login = () => {
  const [method, setMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithPhone } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (method === 'email') {
        await signIn(email, password)
      } else {
        await signInWithPhone(phone, password)
      }
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败，请重试')
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
                登录
              </h1>
              <p className="text-neutral-600">
                欢迎回到问心
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
                邮箱登录
              </button>
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  method === 'phone'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                手机登录
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
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-600">
              还没有账号？{' '}
              <Link to="/auth/signup" className="text-neutral-800 font-medium hover:underline">
                立即注册
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Login
