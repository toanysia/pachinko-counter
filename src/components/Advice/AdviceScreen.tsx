import React, { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { calcAdvice } from '../../utils/advice'
import { currentDrought, totalBonus, actualProb, probStr } from '../../utils/probability'

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference * (score / 100)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#1a1a3e" strokeWidth="14" />
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={
            score >= 70 ? '#10b981' :
            score >= 50 ? '#eab308' :
            score >= 30 ? '#f97316' : '#ef4444'
          }
          strokeWidth="14"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-5xl font-black tabular-nums ${color}`}>{score}</span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100点</span>
      </div>
    </div>
  )
}

export function AdviceScreen() {
  const { session, settings } = useStore()
  const advice = useMemo(() => calcAdvice(session, settings), [session, settings])

  const drought = currentDrought(session)
  const bonusTotal = totalBonus(session.countItems)

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-white">🤖 やめドキ AI</h2>
        <p className="text-xs text-slate-500">データを分析して続行・撤退をアドバイスします</p>
      </div>

      {/* Score gauge */}
      <div className={`rounded-2xl p-4 flex flex-col items-center gap-2 ${advice.bgColor}`}>
        <ScoreGauge score={advice.score} color={advice.color} />
        <div className="text-center">
          <p className={`text-2xl font-black ${advice.color}`}>
            {advice.emoji} {advice.label}
          </p>
          <p className="text-sm text-slate-300 mt-1 max-w-xs text-center leading-snug">
            {advice.summary}
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 font-medium mb-2">判断の根拠</p>
        <div className="flex flex-col gap-2">
          {advice.reasons.map((reason, i) => (
            <div key={i} className={`flex gap-2.5 p-2.5 rounded-xl
              ${reason.positive ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
              <span className="text-base mt-0.5">{reason.positive ? '✅' : '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${reason.positive ? 'text-emerald-300' : 'text-red-300'}`}>
                    {reason.title}
                  </p>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                    ${reason.positive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                    {reason.score}pt
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{reason.detail}</p>
                {/* Score bar */}
                <div className="mt-1.5 w-full bg-surface-800 rounded-full h-1">
                  <div
                    className={`h-full rounded-full transition-all duration-700
                      ${reason.positive ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${(reason.score / reason.weight) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key stats snapshot */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 font-medium mb-2">現在の状態スナップショット</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-600 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500">ゲーム数</p>
            <p className="text-xl font-bold text-white">{session.games.toLocaleString()}G</p>
          </div>
          <div className="bg-surface-600 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500">ボーナス合計</p>
            <p className="text-xl font-bold text-brand-400">{bonusTotal}回</p>
          </div>
          <div className="bg-surface-600 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500">現在ハマり</p>
            <p className={`text-xl font-bold ${
              settings.maxDrought > 0 && drought >= settings.maxDrought ? 'text-red-400' : 'text-orange-400'
            }`}>{drought}G</p>
          </div>
          <div className="bg-surface-600 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500">現在収支</p>
            <p className={`text-xl font-bold ${
              session.returned - session.investment >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(session.returned - session.investment) >= 0 ? '+' : ''}
              {(session.returned - session.investment).toLocaleString()}円
            </p>
          </div>
        </div>
      </div>

      {/* Advice explanation */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 font-medium mb-2">💡 このスコアについて</p>
        <div className="text-xs text-slate-500 leading-relaxed space-y-1.5">
          <p>・<span className="text-brand-300">続行スコア</span>は①ボーナス確率の良し悪し（35点）②ハマりリスク（30点）③収支状態（20点）④損切りライン（15点）の合計100点で算出します</p>
          <p>・<span className="text-emerald-400">70点以上</span>：続行推奨 / <span className="text-yellow-400">50-69点</span>：様子見</p>
          <p>・<span className="text-orange-400">30-49点</span>：注意 / <span className="text-red-400">30点未満</span>：撤退推奨</p>
          <p>・このアドバイスは統計的な目安です。最終的な判断はご自身でお願いします。</p>
        </div>
      </div>
    </div>
  )
}
