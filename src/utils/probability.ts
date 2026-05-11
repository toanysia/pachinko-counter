import { CountItem, Session, SettingProb } from '../types'

/** 実際の確率分母を計算 (ゲーム数/カウント) */
export function actualProb(games: number, count: number): number {
  if (count === 0) return Infinity
  return games / count
}

/** 確率の表示文字列 "1/xxx" */
export function probStr(denominator: number): string {
  if (!isFinite(denominator)) return '---'
  return `1/${Math.round(denominator)}`
}

/** 確率比 (実際/理論値). <1 = オーバー達成, >1 = 不足 */
export function probRatio(actual: number, theoretical: number): number {
  if (!isFinite(actual)) return Infinity
  return actual / theoretical
}

/** ボーナスカウント合計 */
export function totalBonus(items: CountItem[]): number {
  return items.filter(i => i.isBonus).reduce((s, i) => s + i.count, 0)
}

/** 現在ハマり中のゲーム数 */
export function currentDrought(session: Session): number {
  const bonusItems = session.countItems.filter(i => i.isBonus)
  if (bonusItems.every(i => i.count === 0)) return session.games
  const last = session.bonusHistory[session.bonusHistory.length - 1]
  if (!last) return session.games
  return session.games - last.gameCount
}

/** ボーナス間のゲーム数リスト (区間毎) */
export function bonusIntervals(session: Session): number[] {
  if (session.bonusHistory.length === 0) return []
  const sorted = [...session.bonusHistory].sort((a, b) => a.gameCount - b.gameCount)
  const intervals: number[] = []
  let prev = 0
  for (const entry of sorted) {
    intervals.push(entry.gameCount - prev)
    prev = entry.gameCount
  }
  return intervals
}

/** 合算ボーナス確率分母 */
export function combinedBonusProb(items: CountItem[]): number {
  const bonus = items.filter(i => i.isBonus)
  if (bonus.length === 0) return 0
  // 合算確率 = 1 / Σ(1/各理論値)
  const sum = bonus.reduce((s, i) => s + 1 / i.theoreticalProb, 0)
  return sum === 0 ? 0 : 1 / sum
}

/** 投資額 */
export function investmentYen(games: number, coinValue: number): number {
  return games * coinValue * 3  // rough: ~3 coins per game avg
}

/** 差枚数から収支金額 */
export function balanceYen(session: Session, coinValue: number): number {
  return (session.returned - session.investment) * coinValue
}

/** ベイズ設定推測: 各設定(1-6)の事後確率を返す */
export function estimateSettings(
  items: CountItem[],
  games: number,
  settingProbs: SettingProb[]
): number[] {
  if (games === 0 || settingProbs.length === 0) return [1/6, 1/6, 1/6, 1/6, 1/6, 1/6]

  const SETTINGS = [1, 2, 3, 4, 5, 6] as const
  let likelihoods = SETTINGS.map(() => 1.0)

  for (const sp of settingProbs) {
    const item = items.find(i => i.id === sp.itemId)
    if (!item || games === 0) continue
    const probs = [sp.setting1, sp.setting2, sp.setting3, sp.setting4, sp.setting5, sp.setting6]
    SETTINGS.forEach((_, idx) => {
      const p = 1 / probs[idx]
      // Poisson likelihood: P(count | rate=p, games) ∝ p^count * (1-p)^(games-count)
      const rate = p
      likelihoods[idx] *= Math.pow(rate, item.count) * Math.pow(1 - rate, Math.max(0, games - item.count))
    })
  }

  const total = likelihoods.reduce((s, v) => s + v, 0)
  if (total === 0) return [1/6, 1/6, 1/6, 1/6, 1/6, 1/6]
  return likelihoods.map(v => v / total)
}

/** 期待収支計算 (現在の投資から将来を推定) */
export function expectedFutureValue(
  currentBalance: number,
  gamesPlayed: number,
  estimatedRTP: number,  // 0-100
  remainingBudget: number,
  coinValue: number
): { expectedReturn: number; expectedBalance: number } {
  const gamesFromBudget = remainingBudget / (coinValue * 3)
  const expectedReturn = gamesFromBudget * coinValue * 3 * (estimatedRTP / 100)
  const expectedBalance = currentBalance + (expectedReturn - remainingBudget)
  return { expectedReturn, expectedBalance }
}
