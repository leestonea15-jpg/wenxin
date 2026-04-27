import Layout from '../components/Layout'

const Mall = () => {
  const categories = [
    '全部', '手串', '吊坠', '摆件', '祈福用品', '更多'
  ]

  const products = [
    { id: 1, title: '开光貔貅手串', price: 199, originalPrice: 399, sales: 2341 },
    { id: 2, title: '和田玉观音吊坠', price: 599, originalPrice: 999, sales: 1256 },
    { id: 3, title: '黑曜石本命佛', price: 299, originalPrice: 599, sales: 3421 },
    { id: 4, title: '小叶紫檀手串', price: 399, originalPrice: 699, sales: 876 },
    { id: 5, title: '翡翠平安扣', price: 899, originalPrice: 1599, sales: 543 },
    { id: 6, title: '黄水晶招财树', price: 168, originalPrice: 298, sales: 4521 },
    { id: 7, title: '朱砂守护神吊坠', price: 268, originalPrice: 498, sales: 2134 },
    { id: 8, title: '檀木佛珠手链', price: 128, originalPrice: 258, sales: 5678 },
    { id: 9, title: '玛瑙手链', price: 188, originalPrice: 368, sales: 1234 },
    { id: 10, title: '青金石吊坠', price: 458, originalPrice: 888, sales: 567 },
    { id: 11, title: '白水晶摆件', price: 328, originalPrice: 588, sales: 890 },
    { id: 12, title: '红玛瑙平安扣', price: 218, originalPrice: 398, sales: 2345 },
  ]

  return (
    <Layout showBackButton>
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-white to-purple-100">
        {/* 顶部搜索栏 - 橙色背景，尺寸恢复 */}
        <div className="bg-orange-500 px-4 py-3 sticky top-16 z-20">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="搜索商品"
                className="flex-1 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-white hover:text-white/90 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>购物车</span>
              </button>
            </div>
          </div>
        </div>

        {/* 分类导航 */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    index === 0
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : 'text-gray-600 hover:text-orange-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 轮播图占位 - 缩小 */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="bg-gray-100 rounded-lg h-44 flex items-center justify-center">
            <span className="text-gray-400">轮播图占位</span>
          </div>
        </div>

        {/* 商品列表 - 4列 */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-shadow group">
                {/* 商品图片占位 */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                  <span className="text-gray-400 text-sm">商品图片</span>
                </div>
                <div className="p-4">
                  <h3 className="text-gray-800 line-clamp-2 mb-3 h-12">
                    {product.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-red-500 text-xl font-bold">¥{product.price}</span>
                    <span className="text-gray-400 text-sm line-through">¥{product.originalPrice}</span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    {product.sales.toLocaleString()}人付款
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Mall
