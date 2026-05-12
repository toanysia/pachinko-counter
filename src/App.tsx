import React, { useState, useEffect } from 'react'
import { TabBar, TabId } from './components/common/TabBar'
import { CounterScreen } from './components/Counter/CounterScreen'
import { StatsScreen } from './components/Stats/StatsScreen'
import { BudgetScreen } from './components/Budget/BudgetScreen'
import { AdviceScreen } from './components/Advice/AdviceScreen'
import { SettingsScreen } from './components/Settings/SettingsScreen'
import { useStore } from './store/useStore'

const TITLES: Record<TabId, string> = {
  counter:  '🎰 小役カウンター',
  stats:    '📊 統計・確率',
  budget:   '💰 収支管理',
  advice:   '🤖 やめドキ AI',
  settings: '⚙️ 設定',
}

export default function App() {
  const [tab, setTab] = useState<TabId>('counter')
  const { session, loadMachines } = useStore()

  useEffect(() => { loadMachines() }, [])

  return (
    <div className="min-h-screen bg-surface-900 text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-800/95 backdrop-blur border-b border-surface-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-white">{TITLES[tab]}</h1>
          <div className="flex items-center gap-2">
            {session.machineName && (
              <span className="text-xs text-slate-500 truncate max-w-[120px]">{session.machineName}</span>
            )}
            <span className="text-xs bg-surface-600 text-slate-400 px-2 py-0.5 rounded-full tabular-nums">
              {session.games.toLocaleString()}G
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {tab === 'counter'  && <CounterScreen />}
        {tab === 'stats'    && <StatsScreen />}
        {tab === 'budget'   && <BudgetScreen />}
        {tab === 'advice'   && <AdviceScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
