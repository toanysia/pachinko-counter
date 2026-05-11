import React, { useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { MachinePreset } from '../../types'

interface Props {
  onClose: () => void
}

export function MachineSelector({ onClose }: Props) {
  const { machines, machinesLoaded, applyMachinePreset } = useStore()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'slot' | 'pachinko'>('all')
  const [confirmMachine, setConfirmMachine] = useState<MachinePreset | null>(null)

  const filtered = useMemo(() => {
    return machines
      .filter(m => typeFilter === 'all' || m.type === typeFilter)
      .filter(m =>
        query.trim() === '' ||
        m.name.includes(query) ||
        m.maker.includes(query)
      )
      .sort((a, b) => b.year - a.year)
  }, [machines, query, typeFilter])

  const handleSelect = (m: MachinePreset) => {
    applyMachinePreset(m)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-900">
      {/* Header */}
      <div className="bg-surface-800 border-b border-surface-600 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="text-slate-400 active:text-white text-xl leading-none touch-manipulation"
        >←</button>
        <h2 className="text-base font-bold text-white flex-1">台を選ぶ</h2>
        {machinesLoaded && (
          <span className="text-xs text-slate-500">{machines.length}台収録</span>
        )}
      </div>

      {/* Search + Filter */}
      <div className="px-4 py-3 flex flex-col gap-2 bg-surface-800/80 border-b border-surface-600">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="台名・メーカーで検索..."
          className="w-full bg-surface-700 text-white text-sm px-3 py-2.5 rounded-xl outline-none border border-surface-600 focus:border-brand-500 placeholder-slate-600"
        />
        <div className="flex gap-2">
          {(['all', 'slot', 'pachinko'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation
                ${typeFilter === t
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700 text-slate-400 active:bg-surface-600'}`}
            >
              {t === 'all' ? '全て' : t === 'slot' ? '🎰 スロット' : '🎯 パチンコ'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {!machinesLoaded ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="text-4xl mb-3 animate-pulse">🎰</div>
            <p className="text-sm">台データを読み込み中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">「{query}」に一致する台が見つかりません</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-surface-700">
            {filtered.map(m => (
              <button
                key={m.id}
                onClick={() => setConfirmMachine(m)}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-700 transition-colors text-left touch-manipulation w-full"
              >
                <div className="text-2xl w-8 text-center">
                  {m.type === 'slot' ? '🎰' : '🎯'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {m.maker} · {m.year}年 · RTP {m.rtp}%
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                    ${m.type === 'slot'
                      ? 'bg-brand-900/60 text-brand-300'
                      : 'bg-orange-900/60 text-orange-300'}`}>
                    {m.type === 'slot' ? 'スロット' : 'パチンコ'}
                  </span>
                  <span className="text-[10px] text-slate-600">{m.coinValue}円</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmMachine && (
        <div className="absolute inset-0 bg-black/60 flex items-end z-10">
          <div className="bg-surface-800 w-full rounded-t-2xl p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">この台を選択しますか？</p>
              <p className="text-lg font-bold text-white">{confirmMachine.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {confirmMachine.maker} · {confirmMachine.year}年 · RTP {confirmMachine.rtp}% · コイン{confirmMachine.coinValue}円
              </p>
            </div>
            <div className="bg-surface-700 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1.5">カウント項目（自動設定）</p>
              <div className="flex flex-wrap gap-1.5">
                {confirmMachine.items.map(it => (
                  <span key={it.id} className="flex items-center gap-1 text-xs bg-surface-600 px-2 py-1 rounded-full">
                    <span>{it.emoji}</span>
                    <span className="text-slate-300">{it.name}</span>
                    <span className="text-slate-500">1/{it.prob}</span>
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-orange-400 text-center">
              ⚠️ 現在のセッションデータはリセットされます
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmMachine(null)}
                className="flex-1 py-3 rounded-xl bg-surface-600 text-slate-400 text-sm font-medium"
              >キャンセル</button>
              <button
                onClick={() => handleSelect(confirmMachine)}
                className="flex-1 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold active:bg-brand-700"
              >この台を選ぶ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
