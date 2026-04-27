const DailyFortune = () => {
  // 硬编码模拟数据，后续可替换为真实数据
  const today = new Date()
  const lunarDate = '三月廿五'
  const yi = ['祈福', '沐浴', '求财', '开市']
  const ji = ['动土', '嫁娶', '出行', '安葬']
  const luckyTime = ['寅时 (3-5点)', '午时 (11-13点)', '戌时 (19-21点)']
  const luckyDirection = '东南方'

  return (
    <div className="py-3 pb-8">
      <div className="mx-auto px-4" style={{ maxWidth: '1100px' }}>
        <div className="mb-2 text-center">
          <p className="text-base md:text-lg font-medium text-gray-800">天时指引</p>
        </div>
        <div className="bg-white/80 rounded-lg border border-orange-200/50 p-3 md:p-4">
          <div className="grid grid-cols-2 gap-2 place-items-center">
            {/* 左侧：日期+宜忌 */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <div className="text-lg">📅</div>
                <div>
                  <p className="text-sm text-gray-600">
                    {today.getMonth() + 1}月{today.getDate()}日 农历{lunarDate}
                  </p>
                </div>
              </div>
              <div className="space-y-2 flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 w-6">宜</span>
                  <div className="flex flex-wrap gap-1">
                    {yi.map((item, index) => (
                      <span key={index} className="text-xs text-gray-600">
                        {item}
                        {index < yi.length - 1 && '、'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 w-6">忌</span>
                  <div className="flex flex-wrap gap-1">
                    {ji.map((item, index) => (
                      <span key={index} className="text-xs text-gray-600">
                        {item}
                        {index < ji.length - 1 && '、'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：吉时+吉位 */}
            <div className="flex flex-col justify-center items-center w-full">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>⏰</span>
                  <span className="text-xs text-gray-500">吉时：</span>
                  <span className="text-xs text-gray-600">{luckyTime.join('、')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🧭</span>
                  <span className="text-xs text-gray-500">吉位：</span>
                  <span className="text-xs text-gray-600">{luckyDirection}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyFortune
