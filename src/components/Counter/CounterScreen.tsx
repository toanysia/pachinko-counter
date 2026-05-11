import React, { useState, useCallback } from 'react'
import { useStore } from '../../store/useStore'
import { actualProb, probStr, probRatio, currentDrought, totalBonus } from '../../utils/probability'
import { calcAdvice } from '../../utils/advice'

function GameCounter() {
  const { session, addGames, setGames } = useStore()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')

  const handleTap = (delta: number) => addGames(delta)

  return (
    <div className="flex items-center justify-between bg-surface-700 rounded-2xl px-4 py-3 mb-4">
      <button
        onClick={() => handleTap(-1)}
        className="w-12 h-12 flex items-center justify-center text-2xl font-bold text-slate-400 active:text-white active:scale-95 transition-all touch-manipulation"
      >−</button>

      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-500 mb-0.5">ゲーム数</span>
        {editing ? (
          <input
            autoFocus
            type="number"
            inputMode="numeric"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => {
              const n = parseInt(val)
              if (!isNaN(n)) setGames(n)
              setEditing(false)
            }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            className="w-28 text-center text-3xl font-bold bg-surface-600 text-white rounded-lg outline-none border border-brand-500 py-1"
          />
        ) : (
          <button
            onClick={() => { setVal(String(session.games)); setEditing(true) }}
            className="text-4xl font-bold text-white tabular-nums leading-none"
          >
            {session.games.toLocaleString()}
          </button>
        )}
        <span className="text-xs text-slate-500 mt-0.5">G</span>
      </div>

      <button
        onClick={() => handleTap(1)}
        className="w-12 h-12 flex items-center justify-center text-2xl font-bold text-brand-400 active:text-white active:scale-95 transition-all touch-manipulation"
      >＋</button>
    </div>
  )
}

function CountButton({ itemId }: { itemId: string }) {
  const { session, incrementCount, decrementCount } = useStore()
  const item = session.countItems.find(i => i.id === itemId)
  if (!item) return null

  const games = session.games
  const actual = actualProb(games, item.count)
  const ratio = probRatio(actual, item.theoreticalProb)
  const isGood = ratio <= 1.0
  const isOver = ratio >= 1.5 && games > 30

  const [flash, setFlash] = useState(false)

  const handleTap = useCallback(() => {
    incrementCount(itemId)
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
  }, [itemId, incrementCount])

  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-200
      ${flash ? 'scale-95' : 'scale-100'}
      ${item.isBonus ? 'col-span-1' : ''}`}
      style={{ background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)` }}
    >
      <button
        onClick={handleTap}
        className="w-full p-3 flex flex-col items-center gap-1 touch-manipulation active:brightness-125"
      >
        <span className="text-3xl leading-none">{item.emoji}</span>
        <span className="text-xs font-semibold text-slate-200 truncate max-w-full px-1">{item.name}</span>
        <span
          className="text-3xl font-bold tabular-nums leading-none"
          style={{ color: item.color }}
        >
          {item.count}
        </span>
        <div className="flex flex-col items-center gap-0.5 w-full">
          <span className="text-[11px] text-slate-400 tabular-nums">
            実: {games > 0 ? probStr(actual) : '---'}
          </span>
          <span className="text-[10px] text-slate-600 tabular-nums">
            理: 1/{item.theoreticalProb}
          </span>
          {games >= 30 && item.count > 0 && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
              ${isGood ? 'text-emerald-400 bg-emerald-900/40' : isOver ? 'text-red-400 bg-red-900/40' : 'text-slate-400'}`}>
              {isGood ? '良好' : isOver ? '低め' : '普通'}
            </span>
          )}
        </div>
      </button>

      <button
        onClick={e => { e.stopPropagation(); decrementCount(itemId) }}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-slate-600 active:text-slate-300 text-sm touch-manipulation"
      >−</button>
    </div>
  )
}

export function CounterScreen() {
  const { session, settings, startNewSession } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)

  const drought = currentDrought(session)
  const bonusTotal = totalBonus(session.countItems)
  const advice = calcAdvice(session, settings)

  const droughtAlert = settings.maxDrought > 0 && drought >= settings.maxDrought

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Machine name + session info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-white leading-tight truncate">
            {session.machineName || '台名未設定'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ボーナス {bonusTotal}回 / ハマり {drought}G
          </p>
        </div>
        <div className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold
          ${advice.bgColor} ${advice.color}`}>
          <span>{advice.emoji}</span>
          <span className="whitespace-nowrap">{advice.label}</span>
          <span className="opacity-70">{advice.score}</span>
        </div>
      </div>

      {/* Drought alert */}
      {droughtAlert && (
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-3 flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-300 font-bold text-sm">ハマりアラート！</p>
            <p className="text-red-400 text-xs">{drought}G連続ボーナスなし（設定: {settings.maxDrought}G）</p>
          </div>
        </div>
      )}

      {/* Game counter */}
      <GameCounter />

      {/* Count buttons grid */}
      {session.countItems.length === 0 ? (
        <div className="text-center text-slate-500 py-8">
          <p className="text-4xl mb-2">🎯</p>
          <p className="text-sm">設定タブからカウント項目を追加してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {session.countItems.map(item => (
            <CountButton key={item.id} itemId={item.id} />
          ))}
        </div>
      )}

      {/* Quick stats */}
      {session.games > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-1">
          {session.countItems.filter(i => i.isBonus).map(item => {
            const games = session.games
            const actual = actualProb(games, item.count)
            return (
              <div key={item.id} className="bg-surface-700 rounded-xl p-2 text-center">
                <p className="text-[10px] text-slate-500 truncate">{item.name}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: item.color }}>
                  {probStr(actual)}
                </p>
                <p className="text-[10px] text-slate-600">理:{probStr(item.theoreticalProb)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* New session button */}
      <div className="mt-2">
        {confirmReset ? (
          <div className="bg-surface-700 rounded-xl p-3 flex gap-2">
            <button
              onClick={() => setConfirmReset(false)}
              className="flex-1 py-2 rounded-lg bg-surface-600 text-slate-400 text-sm font-medium"
            >キャンセル</button>
            <button
              onClick={() => { startNewSession(); setConfirmReset(false) }}
              className="flex-1 py-2 rounded-lg bg-red-700 text-white text-sm font-bold"
            >新規セッション開始</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full py-3 rounded-xl border border-surface-600 text-slate-500 text-sm font-medium active:border-red-500 active:text-red-400 transition-colors"
          >
            🔄 新しいセッションを開始
          </button>
        )}
      </div>
    </div>
  )
}
