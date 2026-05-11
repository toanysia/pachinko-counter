import React, { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useStore } from '../../store/useStore'
import { actualProb, probStr, bonusIntervals, estimateSettings, totalBonus } from '../../utils/probability'

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
  const data = sorted.map((entry, i) => {
    const gamesAtPoint = entry.gameCount
    const bonusAtPoint = i + 1
    return {
      label: `${gamesAtPoint}G`,
      実際: Math.round(gamesAtPoint / bonusAtPoint),
      index: i + 1,
    }
  })

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

function SettingEstimator() {
  const { session, settings } = useStore()

  const posteriors = useMemo(
    () => estimateSettings(session.countItems, session.games, settings.settingProbs),
    [session.countItems, session.games, settings.settingProbs]
  )

  const highSettingProb = (posteriors[3] + posteriors[4] + posteriors[5]) * 100
  const bestSetting = posteriors.indexOf(Math.max(...posteriors)) + 1

  return (
    <div className="bg-surface-700 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-400 font-medium">設定推測（ベイズ推定）</p>
        <span className="text-xs text-brand-400">高設定期待度 {highSettingProb.toFixed(0)}%</span>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {posteriors.map((p, i) => {
          const pct = Math.round(p * 100)
          const isBest = i + 1 === bestSetting
          return (
            <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-lg
              ${i >= 3 ? 'bg-brand-900/40' : 'bg-surface-600'}
              ${isBest ? 'ring-1 ring-brand-400' : ''}`}>
              <span className="text-xs text-slate-400">設定{i + 1}</span>
              <div className="w-full bg-surface-800 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500
                    ${i >= 3 ? 'bg-brand-400' : 'bg-slate-600'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${isBest ? 'text-brand-300' : 'text-slate-400'}`}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
      {settings.settingProbs.length === 0 && (
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          設定タブで各役の理論値を設定ごとに入力すると精度が上がります
        </p>
      )}
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
      <SettingEstimator />
      <BonusHistory />
    </div>
  )
}
