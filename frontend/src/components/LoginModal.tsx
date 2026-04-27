import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Input from './Input'
import { useAuthStore } from '../store/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const LoginModal = ({ isOpen, onClose, onSuccess }: LoginModalProps) => {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')
  const { login, sendCode, isLoading } = useAuthStore()

  const handleSendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setError('')
    try {
      await sendCode(phone)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch {
      setError('发送失败，请重试')
    }
  }

  const handleLogin = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    if (!/^\d{6}$/.test(code)) {
      setError('请输入6位验证码')
      return
    }
    setError('')
    try {
      await login(phone, code)
      onClose()
      onSuccess?.()
    } catch {
      setError('登录失败，请重试')
    }
  }

  const handleClose = () => {
    setPhone('')
    setCode('')
    setError('')
    setCountdown(0)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="登录/注册">
      <div className="space-y-4">
        <p className="text-neutral-600 text-sm">
          首次登录即为注册，请输入手机号获取验证码
        </p>
        <Input
          label="手机号"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={11}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              label="验证码"
              placeholder="请输入验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
          </div>
          <div className="flex flex-col justify-end">
            <Button
              variant={countdown > 0 ? 'secondary' : 'primary'}
              onClick={handleSendCode}
              disabled={countdown > 0 || isLoading}
              className="whitespace-nowrap"
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LoginModal
