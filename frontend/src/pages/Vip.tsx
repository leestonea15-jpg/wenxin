import Layout from '../components/Layout'

const Vip = () => {
  const plans = [
    {
      id: 1,
      name: '月度会员',
      price: 9.9,
      originalPrice: 29.9,
      firstPrice: 4.9,
      duration: '1个月',
      features: [
        '无限次每日速测',
        '无限次观音灵签',
        '专属客服服务',
        '优先体验新功能',
        '',
        ''
      ],
      popular: false,
      firstDeal: true
    },
    {
      id: 2,
      name: '季度会员',
      price: 19.9,
      originalPrice: 89.7,
      duration: '3个月',
      features: [
        '无限次每日速测',
        '无限次观音灵签',
        '专属客服服务',
        '优先体验新功能',
        '专属会员标识',
        ''
      ],
      popular: true,
      firstDeal: false
    },
    {
      id: 3,
      name: '年度会员',
      price: 99,
      originalPrice: 358.8,
      duration: '12个月',
      features: [
        '无限次每日速测',
        '无限次观音灵签',
        '专属客服服务',
        '优先体验新功能',
        '专属会员标识',
        '专属祈福礼品'
      ],
      popular: false,
      firstDeal: false
    }
  ]

  const benefits = [
    { icon: '⚡', title: '无限测算', desc: '每日速测、观音灵签无限使用' },
    { icon: '🎯', title: '专属客服', desc: '1对1专属客服服务' },
    { icon: '✨', title: '优先体验', desc: '新功能优先体验' },
    { icon: '🏆', title: '会员标识', desc: '独特的会员身份标识' }
  ]

  const benefitDescriptions = [
    {
      icon: '✅',
      title: '会员权益自开通之日起生效',
      desc: '成功开通后即可享受所有会员专属功能'
    },
    {
      icon: '🔄',
      title: '支持随时续费，时长自动叠加',
      desc: '会员有效期到期前可随时续费，时长累加'
    },
    {
      icon: '🚀',
      title: '更多会员功能持续更新中',
      desc: '我们会不断推出新的会员专属功能'
    },
    {
      icon: '💝',
      title: '专属节日福利',
      desc: '重要节日为会员准备专属祈福礼品'
    }
  ]

  return (
    <Layout showBackButton>
      <div className="min-h-screen bg-gradient-to-b from-purple-100 via-white to-amber-100">
        {/* 顶部优惠横幅 - 加宽 */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <p className="font-bold text-xl">限时特惠</p>
                  <p className="text-white/90">首次开通月度会员仅需 4.9 元</p>
                </div>
              </div>
              <div className="flex items-center gap-10">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-2xl">{benefit.icon}</span>
                    <div>
                      <p className="font-semibold">{benefit.title}</p>
                      <p className="text-sm text-white/80">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 页面标题 - 调整位置 */}
        <div className="text-center pt-12 pb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">开通会员</h1>
          <p className="text-gray-500 text-lg">解锁全部功能，探索命运奥秘</p>
        </div>

        {/* 会员套餐卡片 - 固定宽高比例，按钮固定底部 */}
        <div className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-3 gap-8">
            {plans.map((plan) => {
              const buttonClass = plan.popular
                ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/30'
                : 'bg-gradient-to-r from-purple-600 to-purple-700'

              const cardBorderClass = plan.popular
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 p-[3px]'
                : 'border-2 border-gray-200 bg-white p-[1px]'

              return (
                <div key={plan.id} className={`relative ${plan.popular ? '-mt-4 mb-4' : ''}`}>
                  <div className={`rounded-2xl ${cardBorderClass}`}>
                    <div className="rounded-xl p-7 bg-white flex flex-col" style={{ aspectRatio: '3/4' }}>
                      {plan.popular && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-base px-6 py-2 rounded-full font-bold shadow-lg">
                          超值推荐
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{plan.duration}</p>
                      </div>

                      <div className="flex items-baseline justify-center gap-3 mb-6">
                        {plan.firstDeal && (
                          <>
                            <span className="text-red-500 text-4xl font-bold">¥{plan.firstPrice}</span>
                            <span className="text-gray-400 line-through text-sm">¥{plan.price}</span>
                            <span className="bg-red-100 text-red-500 text-xs px-2 py-0.5 rounded">首月特惠</span>
                          </>
                        )}
                        {!plan.firstDeal && (
                          <>
                            <span className="text-orange-500 text-4xl font-bold">¥{plan.price}</span>
                            <span className="text-gray-400 line-through text-sm">¥{plan.originalPrice}</span>
                          </>
                        )}
                      </div>

                      <ul className="space-y-3 mb-auto">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-3 text-sm text-gray-600" style={{ minHeight: '28px' }}>
                            {feature && (
                              <>
                                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {feature}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6">
                        <button className={`w-full py-4 rounded-xl font-bold text-white transition-transform hover:scale-105 text-lg ${buttonClass}`}>
                          立即开通
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 会员权益说明 - 上移位置 */}
          <div className="mt-10 bg-white rounded-2xl p-8 border border-gray-200">
            <h4 className="text-gray-800 font-bold mb-6 text-xl text-center">会员权益说明</h4>
            <div className="grid grid-cols-4 gap-6">
              {benefitDescriptions.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Vip
