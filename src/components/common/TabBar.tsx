import React from 'react'

export type TabId = 'counter' | 'stats' | 'budget' | 'advice' | 'settings'

interface Tab {
  id: TabId
  label: string
  emoji: string
}

const TABS: Tab[] = [
  { id: 'counter',  label: 'カウント', emoji: '🎰' },
  { id: 'stats',    label: '統計',     emoji: '📊' },
  { id: 'budget',   label: '収支',     emoji: '💰' },
  { id: 'advice',   label: 'やめドキ', emoji: '🤖' },
  { id: 'settings', label: '設定',     emoji: '⚙️'  },
]

interface Props {
  active: TabId
  onChange: (id: TabId) => void
}

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-800 border-t border-surface-600 safe-area-bottom">
      <div className="flex max-w-md mx-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors touch-manipulation
              ${active === tab.id
                ? 'text-brand-400'
                : 'text-slate-500 active:text-slate-300'
              }`}
          >
            <span className="text-xl leading-none">{tab.emoji}</span>
            <span className={`text-[10px] font-medium leading-none
              ${tab.id === 'advice' ? 'text-yellow-400' : ''}`}>
              {tab.label}
            </span>
            {active === tab.id && (
              <div className="absolute bottom-0 h-0.5 w-8 bg-brand-400 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
