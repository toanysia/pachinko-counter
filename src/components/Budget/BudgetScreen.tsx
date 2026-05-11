import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useStore } from '../../store/useStore'

function AmountInput({
  label, value, onChange, color,
}: {
  label: string; value: number; onChange: (n: number) => void; color: string
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  const quick = [1000, 2000, 3000, 5000, 10000]

  return (
    <div className="bg-surface-700 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {editing ? (
        <div className="flex gap-2">
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => {
              const n = parseInt(val)
              if (!isNaN(n)) onChange(n)
              setEditing(false)
            }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            className="flex-1 bg-surface-600 text-white text-lg font-bold text-right px-3 py-2 rounded-lg outline-none border border-brand-500"
            placeholder="0"
          />
          <span className="self-center text-slate-400 text-sm">円</span>
        </div>
      ) : (
        <button
          onClick={() => { setVal(String(value)); setEditing(true) }}
          className="w-full text-right"
        >
          <span className={`text-2xl font-bold tabular-nums`} style={{ color }}>
            {value.toLocaleString()}
          </span>
          <span className="text-slate-400 text-sm ml-1">円</span>
        </button>
      )}
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {quick.map(q => (
          <button
            key={q}
            onClick={() => onChange(value + q)}
            className="text-[10px] px-2 py-1 bg-surface-600 text-slate-400 rounded-full active:bg-surface-500 active:text-white touch-manipulation"
          >
            +{(q / 1000).toFixed(0)}K
          </button>
        ))}
        <button
          onClick={() => onChange(0)}
          className="text-[10px] px-2 py-1 bg-surface-600 text-slate-500 rounded-full active:bg-surface-500 active:text-white touch-manipulation"
        >
          リセット
        </button>
      </div>
    </div>
  )
}

function HistoryChart() {
  const { history } = useStore()
  if (history.length === 0) return null

  const data = history.slice(0, 10).reverse().map((s, i) => ({
    name: `${i + 1}`,
    収支: s.returned - s.investment,
  }))

  return (
    <div className="bg-surface-700 rounded-xl p-3">
      <p className="text-xs text-slate-400 mb-2">過去セッション収支</p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#666' }} />
          <YAxis tick={{ fontSize: 9, fill: '#666' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
            formatter={(v: number) => [`${v.toLocaleString()}円`, '収支']}
          />
          <Bar dataKey="収支" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.収支 >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BudgetScreen() {
  const { session, settings, setInvestment, setReturned, history } = useStore()

  const balance = session.returned - session.investment
  const rtp = session.investment > 0 ? (session.returned / session.investment * 100) : 0
  const lossRatio = settings.maxLoss > 0 && balance < 0 ? Math.min(1, (-balance) / settings.maxLoss) : 0

  const totalInvestment = history.reduce((s, h) => s + h.investment, 0) + session.investment
  const totalReturn = history.reduce((s, h) => s + h.returned, 0) + session.returned
  const totalBalance = totalReturn - totalInvestment

  return (
    <div className="flex flex-col gap-3">
      {/* Current session balance */}
      <div className="bg-surface-700 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500 mb-1">現在セッション収支</p>
        <p className={`text-5xl font-bold tabular-nums ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {balance >= 0 ? '+' : ''}{balance.toLocaleString()}
          <span className="text-xl ml-1">円</span>
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <div className="text-center">
            <p className="text-xs text-slate-500">投資</p>
            <p className="text-lg font-bold text-red-400">{session.investment.toLocaleString()}円</p>
          </div>
          <div className="text-xs text-slate-600 self-center">→</div>
          <div className="text-center">
            <p className="text-xs text-slate-500">回収</p>
            <p className="text-lg font-bold text-emerald-400">{session.returned.toLocaleString()}円</p>
          </div>
          <div className="text-xs text-slate-600 self-center">=</div>
          <div className="text-center">
            <p className="text-xs text-slate-500">RTP</p>
            <p className="text-lg font-bold text-slate-300">{rtp.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Loss limit progress */}
      {settings.maxLoss > 0 && balance < 0 && (
        <div className="bg-surface-700 rounded-xl p-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-400">損切りライン</span>
            <span className={lossRatio >= 1 ? 'text-red-400 font-bold' : 'text-slate-400'}>
              {(-balance).toLocaleString()} / {settings.maxLoss.toLocaleString()}円
            </span>
          </div>
          <div className="w-full bg-surface-600 rounded-full h-3">
            <div
              className={`h-full rounded-full transition-all duration-500
                ${lossRatio < 0.6 ? 'bg-emerald-500' : lossRatio < 0.85 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, lossRatio * 100)}%` }}
            />
          </div>
          {lossRatio >= 1 && (
            <p className="text-red-400 text-xs font-bold mt-1 text-center">⚠️ 損切りラインを超えています！</p>
          )}
        </div>
      )}

      {/* Input controls */}
      <AmountInput
        label="💸 投資額（使ったお金）"
        value={session.investment}
        onChange={setInvestment}
        color="#ef4444"
      />
      <AmountInput
        label="💎 回収額（戻ってきたお金）"
        value={session.returned}
        onChange={setReturned}
        color="#10b981"
      />

      {/* Lifetime stats */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 mb-2 font-medium">累計（全セッション合計）</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-500">総投資</p>
            <p className="text-sm font-bold text-red-400">{totalInvestment.toLocaleString()}円</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">総回収</p>
            <p className="text-sm font-bold text-emerald-400">{totalReturn.toLocaleString()}円</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">累計収支</p>
            <p className={`text-sm font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalBalance >= 0 ? '+' : ''}{totalBalance.toLocaleString()}円
            </p>
          </div>
        </div>
      </div>

      <HistoryChart />
    </div>
  )
}
