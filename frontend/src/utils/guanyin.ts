import { GUANYIN_LEVELS, type GuanyinLevel } from './constants'

export interface GuanyinStick {
  id: number
  level: GuanyinLevel
  title: string
  poem: string
  story: string
  meaning: string
}

// 简化版100签数据（先创建10签作为示例，后续可补充完整）
export const GUANYIN_STICKS: GuanyinStick[] = [
  {
    id: 1,
    level: GUANYIN_LEVELS.TOP_TOP,
    title: '天门一挂',
    poem: '天门一挂挂金牌，有志功名必自来。东西南北皆通达，福禄双称心开怀。',
    story: '姜太公钓鱼，文王访贤。太公年八十，垂钓渭水，文王出猎相遇，载与俱归，立为师。后助武王伐纣，建立周朝。',
    meaning: '此签求官得官，求财得财，婚姻美满，诸事吉祥。宜积极进取，自有贵人相助。',
  },
  {
    id: 2,
    level: GUANYIN_LEVELS.TOP,
    title: '金榜题名',
    poem: '金榜题名喜气新，十年寒窗不负人。今朝得遂平生志，他日为官福满门。',
    story: '吕蒙正苦读，终成状元。蒙正少年家贫，寄居僧寺，刻苦读书，后中状元，官至宰相。',
    meaning: '此签利学业、考试，只要努力，必有收获。名利双收，指日可待。',
  },
  {
    id: 3,
    level: GUANYIN_LEVELS.MIDDLE,
    title: '守旧待时',
    poem: '守旧待时莫妄求，安心静待好机缘。一朝时至声名显，不须劳碌自安然。',
    story: '刘备三顾茅庐，诸葛亮隆中对策。刘备先请孔明两次不遇，第三次方得见，隆中对定天下三分。',
    meaning: '此签宜静不宜动，守旧待时，自有转机。切勿急躁，强求无益。',
  },
  {
    id: 4,
    level: GUANYIN_LEVELS.BOTTOM,
    title: '进退两难',
    poem: '进退两难意未休，欲行又止事难谋。不如静待时机到，免得终朝惹闷愁。',
    story: '项羽被困垓下，四面楚歌。项羽兵败，被围垓下，夜闻四面楚歌，以为汉已得楚，遂自刎乌江。',
    meaning: '此签诸事不宜，进退两难。宜忍耐守旧，切勿轻举妄动，免招损失。',
  },
  {
    id: 5,
    level: GUANYIN_LEVELS.BOTTOM_BOTTOM,
    title: '如履薄冰',
    poem: '如履薄冰甚险危，心中忧虑有谁知。劝君莫作亏心事，自有神明护持伊。',
    story: '屈原投江，怀沙自沉。屈原忠君爱国，遭谗被逐，见楚国将亡，无力回天，遂投汨罗江而死。',
    meaning: '此签大凶，诸事不利。宜谨言慎行，多行善事，或可转危为安。',
  },
  // 剩余95签后续补充，先用这5签测试
  {
    id: 6,
    level: GUANYIN_LEVELS.TOP,
    title: '天官赐福',
    poem: '天官赐福降祯祥，财源广进达三江。家宅平安人康健，一年四季乐安康。',
    story: '财神赵公明，散财济贫。赵公明原为财神，专司人间财富，常散财济贫，救人危急。',
    meaning: '此签大吉，求财得财，家宅平安。宜多行善事，福报自来。',
  },
  {
    id: 7,
    level: GUANYIN_LEVELS.MIDDLE,
    title: '平分秋色',
    poem: '平分秋色月团圆，事业兴旺福绵绵。夫妻和睦家道顺，儿女双全乐无边。',
    story: '梁鸿孟光，举案齐眉。梁鸿与孟光夫妻相敬如宾，孟光送饭时举案齐眉，传为佳话。',
    meaning: '此签吉中带平，家庭和睦，事业平顺。宜守中道，不宜过贪。',
  },
  {
    id: 8,
    level: GUANYIN_LEVELS.TOP_TOP,
    title: '龙飞在天',
    poem: '龙飞在天喜气扬，风云际会遇贤良。事业亨通步步高，声名远播达四方。',
    story: '诸葛亮出山，辅佐刘备。孔明隆中对策，出山辅佐刘备，建立蜀汉，三分天下有其一。',
    meaning: '此签上上，大吉大利。事业腾飞，贵人相助，宜积极进取。',
  },
  {
    id: 9,
    level: GUANYIN_LEVELS.BOTTOM,
    title: '枯木逢春',
    poem: '枯木逢春色渐新，眼前事物未完全。耐心等待时机到，自然得遇贵人怜。',
    story: '勾践卧薪尝胆，终灭吴国。勾践兵败，卧薪尝胆，十年生聚，十年教训，终灭吴国。',
    meaning: '此签先凶后吉，目前艰难，将来有望。宜忍耐坚持，终有转机。',
  },
  {
    id: 10,
    level: GUANYIN_LEVELS.MIDDLE,
    title: '顺水行舟',
    poem: '顺水行舟遇顺风，前程万里任西东。贵人指引康庄道，不用劳心自亨通。',
    story: '范蠡泛舟五湖，功成身退。范蠡助越王勾践灭吴后，功成身退，泛舟五湖，经商致富。',
    meaning: '此签吉利，诸事顺遂。宜顺势而为，自有贵人相助。',
  },
]

// 获取随机签
export const drawGuanyinStick = (): GuanyinStick => {
  const randomIndex = Math.floor(Math.random() * GUANYIN_STICKS.length)
  return GUANYIN_STICKS[randomIndex]
}
