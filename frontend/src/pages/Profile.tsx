import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { useAuthStore } from '../store/auth'

const Profile = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  if (!user) {
    return (
      <Layout>
        <div className="container-max py-20 text-center">
          <p className="text-neutral-600 mb-4">请先登录</p>
          <Link to="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </Layout>
    )
  }

  const quickActions = [
    { icon: '👑', label: '开通会员', path: '/vip' },
    { icon: '🛒', label: '购物车', path: '/mall' },
    { icon: '📦', label: '全部订单', path: '#orders' },
    { icon: '💳', label: '待付款', path: '#pending' },
    { icon: '🚚', label: '待收货', path: '#shipping' },
    { icon: '⭐', label: '待评价', path: '#review' },
    { icon: '🎫', label: '优惠券', path: '#coupons' },
    { icon: '🔄', label: '退换/售后', path: '#returns' },
  ]

  const menuItems = [
    { key: 'info', label: '个人资料', icon: '📝', path: '#info' },
    { key: 'history', label: '历史记录', icon: '📜', path: '/history' },
    { key: 'feedback', label: '反馈建议', icon: '⭐', path: '#feedback' },
    { key: 'about', label: '关于我们', icon: 'ℹ️', path: '#about' },
    { key: 'help', label: '帮助中心', icon: '❓', path: '#help' },
    { key: 'privacy', label: '隐私设置', icon: '🔒', path: '#privacy' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleMenuClick = (path: string) => {
    if (path.startsWith('/')) {
      navigate(path)
    }
  }

  return (
    <Layout showBackButton>
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-white to-purple-100">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* 顶部头像区域 */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-3xl text-white font-bold shadow-lg">
              {user.nickname?.[0] || '用'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{user.nickname}</h2>
            <p className="text-gray-500">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
          </div>

          {/* 快捷操作卡片区 - 双排 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="grid grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuClick(action.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-3xl">{action.icon}</span>
                  <span className="text-sm text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 菜单列表 */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            {menuItems.map((item, index) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                  index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="flex-1 text-gray-800">{item.label}</span>
                <span className="text-gray-400">›</span>
              </button>
            ))}
          </div>

          {/* 退出登录 - 在最后面 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white text-red-600 hover:bg-red-50 transition-colors shadow-sm"
          >
            <span className="text-xl">🚪</span>
            <span className="font-semibold">退出登录</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default Profile
