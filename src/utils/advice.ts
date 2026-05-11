import { Session, Settings } from '../types'
import { actualProb, probRatio, totalBonus, currentDrought, combinedBonusProb } from './probability'

export interface AdviceResult {
  score: number          // 0-100
  level: 'great' | 'good' | 'caution' | 'stop'
  label: string
  emoji: string
  color: string
  bgColor: string
  reasons: AdviceReason[]
  summary: string
}

export interface AdviceReason {
  title: string
  detail: string
  positive: boolean
  score: number
  weight: number
}

export function calcAdvice(session: Session, settings: Settings): AdviceResult {
  const reasons: AdviceReason[] = []

  // ─── 1. ボーナス確率スコア (0-35点) ──────────────────────────
  const bonusItems = session.countItems.filter(i => i.isBonus)
  const bonusTotal = totalBonus(session.countItems)
  let bonusScore = 17  // neutral

  if (session.games >= 50 && bonusItems.length > 0) {
    const combinedTheo = combinedBonusProb(session.countItems)
    const bonusActual = actualProb(session.games, bonusTotal)
    const ratio = combinedTheo > 0 ? probRatio(bonusActual, combinedTheo) : 1

    if (ratio <= 0.7) {
      bonusScore = 35
      reasons.push({
        title: 'ボーナス確率が良好',
        detail: `理論値より${Math.round((1 - ratio) * 100)}%良いペースでボーナスが来ています`,
        positive: true, score: 35, weight: 35,
      })
    } else if (ratio <= 0.9) {
      bonusScore = 28
      reasons.push({
        title: 'ボーナス確率が平均以上',
        detail: `理論値に近いペースでボーナスが来ています`,
        positive: true, score: 28, weight: 35,
      })
    } else if (ratio <= 1.2) {
      bonusScore = 17
      reasons.push({
        title: 'ボーナス確率は平均的',
        detail: `理論値とほぼ同等のペースです`,
        positive: true, score: 17, weight: 35,
      })
    } else if (ratio <= 1.8) {
      bonusScore = 8
      reasons.push({
        title: 'ボーナス確率がやや低め',
        detail: `理論値より${Math.round((ratio - 1) * 100)}%遅いペースです`,
        positive: false, score: 8, weight: 35,
      })
    } else {
      bonusScore = 0
      reasons.push({
        title: 'ボーナス確率が低い',
        detail: `理論値の${ratio.toFixed(1)}倍の間隔。低設定または運が悪い状態です`,
        positive: false, score: 0, weight: 35,
      })
    }
  } else {
    reasons.push({
      title: 'データ不足',
      detail: `まだ${session.games}G。50G以上プレイするとより正確な判断ができます`,
      positive: false, score: 17, weight: 35,
    })
  }

  // ─── 2. 現在のハマりスコア (0-30点) ─────────────────────────
  const drought = currentDrought(session)
  const combinedTheoProb = combinedBonusProb(session.countItems)
  let droughtScore = 15

  if (combinedTheoProb > 0) {
    const droughtRatio = drought / combinedTheoProb
    if (droughtRatio < 0.5) {
      droughtScore = 30
      reasons.push({
        title: 'ハマりリスク低',
        detail: `現在${drought}G。理論ボーナス間隔の${Math.round(droughtRatio * 100)}%のため余裕があります`,
        positive: true, score: 30, weight: 30,
      })
    } else if (droughtRatio < 1.0) {
      droughtScore = 20
      reasons.push({
        title: 'ハマりは普通',
        detail: `現在${drought}G連続でボーナスなし。理論値の範囲内です`,
        positive: true, score: 20, weight: 30,
      })
    } else if (droughtRatio < 1.5) {
      droughtScore = 10
      reasons.push({
        title: 'ボーナス待ち状態',
        detail: `現在${drought}G。理論ボーナス間隔を${Math.round((droughtRatio - 1) * 100)}%超えています`,
        positive: false, score: 10, weight: 30,
      })
    } else if (droughtRatio < 2.5) {
      droughtScore = 3
      reasons.push({
        title: '深いハマり中',
        detail: `現在${drought}G。理論値の${droughtRatio.toFixed(1)}倍のハマり。追加投資は要注意`,
        positive: false, score: 3, weight: 30,
      })
    } else {
      droughtScore = 0
      reasons.push({
        title: '極深ハマり',
        detail: `現在${drought}G。理論値の${droughtRatio.toFixed(1)}倍の超ハマり。台を変えることを強く推奨`,
        positive: false, score: 0, weight: 30,
      })
    }
  }

  // ─── 3. 収支スコア (0-20点) ──────────────────────────────────
  const balance = session.returned - session.investment
  let balanceScore = 10

  if (session.investment === 0) {
    balanceScore = 10
    reasons.push({
      title: '収支未入力',
      detail: '収支タブで投資額・回収額を入力するとより正確なアドバイスが可能です',
      positive: false, score: 10, weight: 20,
    })
  } else {
    const lossRate = session.investment > 0 ? -balance / session.investment : 0
    if (balance > 0) {
      balanceScore = 20
      reasons.push({
        title: '現在プラス収支',
        detail: `+${balance.toLocaleString()}円のプラス。利益確定も選択肢の一つです`,
        positive: true, score: 20, weight: 20,
      })
    } else if (lossRate < 0.15) {
      balanceScore = 14
      reasons.push({
        title: '収支はほぼ均衡',
        detail: `${balance.toLocaleString()}円の小幅マイナス。許容範囲内です`,
        positive: true, score: 14, weight: 20,
      })
    } else if (lossRate < 0.35) {
      balanceScore = 7
      reasons.push({
        title: '収支はマイナス',
        detail: `${balance.toLocaleString()}円のマイナス。損切りラインを意識してください`,
        positive: false, score: 7, weight: 20,
      })
    } else {
      balanceScore = 0
      reasons.push({
        title: '収支が大幅マイナス',
        detail: `${balance.toLocaleString()}円の大幅マイナス。追い銭は撤退推奨です`,
        positive: false, score: 0, weight: 20,
      })
    }
  }

  // ─── 4. 損切りアラートチェック (0-15点) ─────────────────────
  let alertScore = 15
  if (settings.maxLoss > 0 && session.investment > 0) {
    const lossAmt = session.investment - session.returned
    const lossRatio = lossAmt / settings.maxLoss
    if (lossRatio >= 1.0) {
      alertScore = 0
      reasons.push({
        title: '⚠️ 損切りラインを超過',
        detail: `設定した損切りライン(${settings.maxLoss.toLocaleString()}円)を超えています！今すぐ撤退を！`,
        positive: false, score: 0, weight: 15,
      })
    } else if (lossRatio >= 0.8) {
      alertScore = 5
      reasons.push({
        title: '損切りライン間近',
        detail: `損切りライン(${settings.maxLoss.toLocaleString()}円)の${Math.round(lossRatio * 100)}%。あと少しで限界です`,
        positive: false, score: 5, weight: 15,
      })
    } else {
      alertScore = 15
    }
  }

  const raw = bonusScore + droughtScore + balanceScore + alertScore
  const score = Math.min(100, Math.max(0, Math.round(raw)))

  let level: AdviceResult['level']
  let label: string
  let emoji: string
  let color: string
  let bgColor: string
  let summary: string

  if (score >= 70) {
    level = 'great'; label = '続行推奨'; emoji = '🟢'; color = 'text-emerald-400'; bgColor = 'bg-emerald-900/30'
    summary = 'データが良好です。このまま続けることを推奨します。ただし損切りラインは守りましょう。'
  } else if (score >= 50) {
    level = 'good'; label = '様子見'; emoji = '🟡'; color = 'text-yellow-400'; bgColor = 'bg-yellow-900/30'
    summary = 'まだ判断が難しい状況です。設定した損切りラインを守りつつ、もう少しデータを集めましょう。'
  } else if (score >= 30) {
    level = 'caution'; label = '注意'; emoji = '🟠'; color = 'text-orange-400'; bgColor = 'bg-orange-900/30'
    summary = '低設定や悪い流れの可能性があります。追い銭を控え、損切りを意識してください。'
  } else {
    level = 'stop'; label = '撤退推奨'; emoji = '🔴'; color = 'text-red-400'; bgColor = 'bg-red-900/30'
    summary = 'データが厳しい状況です。このまま続けるとマイナスが増える可能性が高いです。台移動を強く推奨します。'
  }

  return { score, level, label, emoji, color, bgColor, reasons, summary }
}
