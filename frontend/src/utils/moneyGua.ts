import { MONEY_GUA_COMBINATIONS, type MoneyGuaCombination } from './constants'

export interface Coin {
  side: 'yang' | 'yin'
  image: 'qianlong_front' | 'qianlong_back'
}

export interface MoneyGuaResult {
  coins: Coin[]
  combination: MoneyGuaCombination
  verdict: string
  interpretation: string
}

const interpretations: Record<MoneyGuaCombination, { verdict: string; interpretation: string }> = {
  [MONEY_GUA_COMBINATIONS.LAO_YANG]: {
    verdict: '大吉',
    interpretation: '三枚皆正，老阳之象，纯阳乾健，所求之事大吉大利，宜积极进取。',
  },
  [MONEY_GUA_COMBINATIONS.LAO_YIN]: {
    verdict: '大凶',
    interpretation: '三枚皆反，老阴之象，纯阴坤柔，所求之事阻滞难行，宜静守待时。',
  },
  [MONEY_GUA_COMBINATIONS.SHAO_YANG]: {
    verdict: '吉',
    interpretation: '两正一反，少阳之象，阳气渐生，所求之事可成，但需稳步前行。',
  },
  [MONEY_GUA_COMBINATIONS.SHAO_YIN]: {
    verdict: '平',
    interpretation: '两反一正，少阴之象，阴气渐长，所求之事平顺，但需谨慎行事。',
  },
}

const tossCoin = (): Coin => {
  const isYang = Math.random() > 0.5
  return {
    side: isYang ? 'yang' : 'yin',
    image: isYang ? 'qianlong_front' : 'qianlong_back',
  }
}

export const tossMoneyGua = (): MoneyGuaResult => {
  const coins = [tossCoin(), tossCoin(), tossCoin()]
  const yangCount = coins.filter(c => c.side === 'yang').length

  let combination: MoneyGuaCombination
  if (yangCount === 3) {
    combination = MONEY_GUA_COMBINATIONS.LAO_YANG
  } else if (yangCount === 0) {
    combination = MONEY_GUA_COMBINATIONS.LAO_YIN
  } else if (yangCount === 2) {
    combination = MONEY_GUA_COMBINATIONS.SHAO_YANG
  } else {
    combination = MONEY_GUA_COMBINATIONS.SHAO_YIN
  }

  const { verdict, interpretation } = interpretations[combination]

  return {
    coins,
    combination,
    verdict,
    interpretation,
  }
}
