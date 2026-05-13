import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useStore } from '../../store/useStore'
import { actualProb, probStr, bonusIntervals, estimateSettings, settingConfidence, totalBonus } from '../../utils/probability'

// 設定ごとのカラー (設定1-3: グレー系, 4: 黄, 5: オレンジ, 6: 赤)
const SETTING_COLORS = ['#64748b', '#78716c', '#6b7280', '#f59e0b', '#f97316', '#ef4444']
const SETTING_BG = [
  'bg-slate-700/50', 'bg-slate-700/50', 'bg-slate-700/50',
  'bg-yellow-900/40', 'bg-orange-900/40', 'bg-red-900/40',
]

function SettingEstimator() {
  const { session, settings } = useStore()
  const [showItemBreakdown, setShowItemBreakdown] = useState(false)

  const posteriors = useMemo(
    () => estimateSettings(session.countItems, session.games, settings.settingProbs),
    [session.countItems, session.games, settings.settingProbs]
  )

  const confidence = useMemo(
    () => settingConfidence(posteriors, session.games),
    [posteriors, session.games]
  )

  const bestIdx = posteriors.indexOf(Math.max(...posteriors))
  const bestSetting = bestIdx + 1
  const bestPct = Math.round(posteriors[bestIdx] * 100)
  const highSettingProb = Math.round((posteriors[3] + posteriors[4] + posteriors[5]) * 100)
  const hasSettingData = settings.settingProbs.length > 0
  const totalCounts = session.countItems.reduce((s, i) => s + i.count, 0)

  const confidenceLabel =
    confidence < 0.2 ? 'データ不足' :
    confidence < 0.4 ? '低' :
    confidence < 0.6 ? '中' :
    confidence < 0.8 ? '高' : '非常に高い'
  const confidenceColor =
    confidence < 0.2 ? 'text-slate-500' :
    confidence < 0.4 ? 'text-red-400' :
    confidence < 0.6 ? 'text-yellow-400' :
    'text-emerald-400'

  return (
    <div className="rounded-2xl overflow-hidden border border-brand-800/40"
      style={{ background: 'linear-gradient(160deg, #1e1040 0%, #1a1a2e 100%)' }}>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-brand-900/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-white tracking-wide">🔮 リアルタイム設定判別</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              ベイズ推定 · {session.games.toLocaleString()}G · {totalCounts}カウント
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${confidence < 0.2 ? 'bg-slate-500' : confidence < 0.4 ? 'bg-red-400' : confidence < 0.6 ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
              <span className={`text-xs font-medium ${confidenceColor}`}>{confidenceLabel}</span>
            </div>
            <div className="w-16 bg-surface-800 rounded-full h-1">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${confidence < 0.4 ? 'bg-red-500' : confidence < 0.6 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="px-4 py-5 flex items-center justify-between">
        {/* Big setting number */}
        <div className="flex items-end gap-3">
          <div>
            <p className="text-[10px] text-slate-500 mb-1 text-center">最有力設定</p>
            <div className="relative">
              <span
                className="text-8xl font-black leading-none"
                style={{ color: SETTING_COLORS[bestIdx], textShadow: `0 0 40px ${SETTING_COLORS[bestIdx]}80` }}
              >
                {bestSetting}
              </span>
            </div>
          </div>
          <div className="pb-2">
            <p className="text-3xl font-bold text-white">{bestPct}%</p>
            <p className="text-[10px] text-slate-500">この設定の確率</p>
          </div>
        </div>

        {/* Right stats */}
        <div className="flex flex-col gap-3 items-end">
          <div className="text-right bg-surface-800/50 rounded-xl px-3 py-2">
            <p className={`text-xl font-bold ${highSettingProb >= 50 ? 'text-emerald-400' : highSettingProb >= 30 ? 'text-yellow-400' : 'text-slate-400'}`}>
              {highSettingProb}%
            </p>
            <p className="text-[10px] text-slate-500">高設定(4-6)期待度</p>
          </div>
          <div className="text-right bg-surface-800/50 rounded-xl px-3 py-2">
            <p className="text-lg font-bold text-white">
              {posteriors.slice(3).map((p, i) => (
                <span key={i} style={{ color: SETTING_COLORS[i + 3] }} className="text-sm mx-0.5">
                  {Math.round(p * 100)}%
                </span>
              ))}
            </p>
            <p className="text-[10px] text-slate-500">設定4 / 5 / 6</p>
          </div>
        </div>
      </div>

      {/* Probability bars */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        {posteriors.map((p, i) => {
          const pct = Math.round(p * 100)
          const isBest = i === bestIdx
          const barW = Math.max(2, pct)
          return (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-[11px] w-9 flex-shrink-0 font-semibold ${isBest ? 'text-white' : 'text-slate-500'}`}>
                設定{i + 1}
              </span>
              <div className="flex-1 bg-surface-900/80 rounded-full h-5 relative overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barW}%`,
                    backgroundColor: SETTING_COLORS[i],
                    opacity: isBest ? 1 : 0.55,
                  }}
                />
                {isBest && (
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white">
                    ▶ {pct}%
                  </span>
                )}
              </div>
              <span className={`text-xs w-7 text-right tabular-nums font-bold ${isBest ? 'text-white' : 'text-slate-600'}`}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>

      {/* Per-item breakdown toggle */}
      {hasSettingData && session.games > 0 && (
        <div className="border-t border-brand-900/50">
          <button
            onClick={() => setShowItemBreakdown(!showItemBreakdown)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 active:text-white active:bg-white/5 transition-colors"
          >
            <span>📊 役ごとの設定寄与</span>
            <span>{showItemBreakdown ? '▲ 閉じる' : '▼ 詳細を見る'}</span>
          </button>

          {showItemBreakdown && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              {session.countItems.filter(it => it.count > 0).map(item => {
                const sp = settings.settingProbs.find(s => s.itemId === item.id)
                if (!sp) return null
                const denoms = [sp.setting1, sp.setting2, sp.setting3, sp.setting4, sp.setting5, sp.setting6]
                const actual = session.games / item.count
                // 実際の確率と設定確率の一致度で最も近い設定を判定
                const diffs = denoms.map(d => Math.abs(actual - d))
                const closestIdx = diffs.indexOf(Math.min(...diffs))
                return (
                  <div key={item.id} className="bg-surface-900/50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.emoji}</span>
                        <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">実: 1/{Math.round(actual)}</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: SETTING_COLORS[closestIdx] + '30', color: SETTING_COLORS[closestIdx] }}
                        >
                          設定{closestIdx + 1}寄り
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {denoms.map((d, i) => {
                        const isClose = i === closestIdx
                        return (
                          <div key={i} className={`flex-1 text-center rounded-lg py-1 ${isClose ? SETTING_BG[i] : 'bg-surface-800/50'}`}>
                            <p className={`text-[9px] font-bold ${isClose ? 'text-white' : 'text-slate-600'}`}>{i + 1}</p>
                            <p className={`text-[9px] tabular-nums ${isClose ? 'text-slate-200' : 'text-slate-700'}`}>{d}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {session.countItems.filter(it => it.count > 0 && settings.settingProbs.find(s => s.itemId === it.id)).length === 0 && (
                <p className="text-xs text-slate-600 text-center py-2">まだカウントデータがありません</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* No setting data warning */}
      {!hasSettingData && (
        <div className="mx-4 mb-4 bg-orange-900/20 border border-orange-800/40 rounded-xl p-3">
          <p className="text-xs text-orange-300 text-center leading-relaxed">
            ⚠️ 設定タブで台を選択すると<br />設定判別の精度が大幅に向上します
          </p>
        </div>
      )}
    </div>
  )
}

function ProbChart() {
  const { session } = useStore()
  const bonusItems = session.countItems.filter(i => i.isBonus)
  if (bonusItems.length === 0 || session.bonusHistory.length < 2) {
    return (
      <div className="bg-surface-700 rounded-xl p-4 text-center text-slate-500 text-sm py-8">
        <p className="text-2xl mb-2">📈</p>
        ボーナスが2回以上来るとグラフが表示されます
      </div>
    )
  }

  const sorted = [...session.bonusHistory].sort((a, b) => a.gameCount - b.gameCount)
  const data = sorted.map((entry, i) => ({
    label: `${entry.gameCount}G`,
    実際: Math.round(entry.gameCount / (i + 1)),
    index: i + 1,
  }))

  const combinedTheo = Math.round(
    1 / bonusItems.reduce((s, i) => s + 1 / i.theoreticalProb, 0)
  )

  return (
    <div className="bg-surface-700 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-2">合算ボーナス確率の推移</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="index" tick={{ fontSize: 10, fill: '#666' }} />
          <YAxis tick={{ fontSize: 10, fill: '#666' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#aaa' }}
          />
          <ReferenceLine y={combinedTheo} stroke="#7c3aed" strokeDasharray="4 4"
            label={{ value: `理論値:1/${combinedTheo}`, position: 'insideTopRight', fontSize: 10, fill: '#7c3aed' }}
          />
          <Line type="monotone" dataKey="実際" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function BonusHistory() {
  const { session } = useStore()
  const intervals = bonusIntervals(session)

  if (session.bonusHistory.length === 0) {
    return (
      <div className="bg-surface-700 rounded-xl p-4 text-center text-slate-500 text-sm py-6">
        <p className="text-2xl mb-2">⭐</p>
        ボーナス履歴がまだありません
      </div>
    )
  }

  const sorted = [...session.bonusHistory].sort((a, b) => b.gameCount - a.gameCount)

  return (
    <div className="bg-surface-700 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-2 font-medium">ボーナス履歴 ({session.bonusHistory.length}回)</p>
      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
        {sorted.map((entry, idx) => {
          const item = session.countItems.find(i => i.id === entry.itemId)
          const interval = intervals[session.bonusHistory.length - 1 - idx]
          return (
            <div key={entry.id} className="flex items-center justify-between bg-surface-600 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">{item?.emoji || '⭐'}</span>
                <span className="text-xs text-slate-300">{entry.itemName}</span>
              </div>
              <div className="flex items-center gap-3">
                {interval !== undefined && (
                  <span className="text-[10px] text-slate-500">{interval}G間隔</span>
                )}
                <span className="text-xs font-mono text-slate-400">{entry.gameCount}G目</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StatsScreen() {
  const { session } = useStore()
  const games = session.games
  const bonusTotal = totalBonus(session.countItems)

  return (
    <div className="flex flex-col gap-3">
      {/* HERO: Setting Estimator — #1 selling feature */}
      <SettingEstimator />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-700 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">総ゲーム数</p>
          <p className="text-xl font-bold text-white">{games.toLocaleString()}</p>
          <p className="text-[10px] text-slate-600">G</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">ボーナス合計</p>
          <p className="text-xl font-bold text-brand-400">{bonusTotal}</p>
          <p className="text-[10px] text-slate-600">回</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500">合算確率</p>
          <p className="text-lg font-bold text-emerald-400 tabular-nums">
            {probStr(actualProb(games, bonusTotal))}
          </p>
          <p className="text-[10px] text-slate-600">実際値</p>
        </div>
      </div>

      {/* Probability table */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 mb-2 font-medium">役ごとの確率比較</p>
        <div className="flex flex-col gap-1.5">
          {session.countItems.map(item => {
            const actual = actualProb(games, item.count)
            const ratio = games > 0 && item.count > 0 ? actual / item.theoreticalProb : null
            const good = ratio !== null && ratio <= 1.0
            const bad = ratio !== null && ratio >= 1.5
            return (
              <div key={item.id} className="flex items-center gap-2 bg-surface-600 rounded-lg px-3 py-2">
                <span className="text-base">{item.emoji}</span>
                <span className="flex-1 text-xs text-slate-300 truncate">{item.name}</span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`text-xs font-mono font-bold
                    ${good ? 'text-emerald-400' : bad ? 'text-red-400' : 'text-slate-300'}`}>
                    {probStr(actual)}
                  </span>
                  <span className="text-[10px] text-slate-600">理: {probStr(item.theoreticalProb)}</span>
                </div>
                {ratio !== null && (
                  <span className={`text-[10px] w-10 text-right font-bold
                    ${good ? 'text-emerald-400' : bad ? 'text-red-400' : 'text-slate-500'}`}>
                    {(ratio * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ProbChart />
      <BonusHistory />
    </div>
  )
}
