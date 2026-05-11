import React, { useState } from 'react'
import { useStore } from '../../store/useStore'
import { CountItem, ITEM_COLORS, ITEM_EMOJIS, PRESETS } from '../../types'
import { MachineSelector } from './MachineSelector'

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function ItemEditor({
  item,
  onSave,
  onCancel,
}: { item: Partial<CountItem>; onSave: (i: CountItem) => void; onCancel: () => void }) {
  const [name, setName] = useState(item.name || '')
  const [prob, setProb] = useState(String(item.theoreticalProb || 100))
  const [color, setColor] = useState(item.color || ITEM_COLORS[0])
  const [emoji, setEmoji] = useState(item.emoji || '🎯')
  const [isBonus, setIsBonus] = useState(item.isBonus ?? false)

  const save = () => {
    if (!name.trim()) return
    onSave({
      id: item.id || makeId(),
      name: name.trim(),
      count: item.count ?? 0,
      theoreticalProb: Math.max(1, parseInt(prob) || 100),
      color,
      emoji,
      isBonus,
    })
  }

  return (
    <div className="bg-surface-600 rounded-xl p-3 flex flex-col gap-3">
      <div>
        <label className="text-xs text-slate-400">名前</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mt-1 bg-surface-800 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500 focus:border-brand-500"
          placeholder="例: チェリー"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-slate-400">理論確率 (1/N の N)</label>
          <input
            type="number"
            inputMode="numeric"
            value={prob}
            onChange={e => setProb(e.target.value)}
            className="w-full mt-1 bg-surface-800 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500 focus:border-brand-500"
            placeholder="100"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">ボーナス？</label>
          <button
            onClick={() => setIsBonus(!isBonus)}
            className={`w-full mt-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${isBonus ? 'bg-brand-600 text-white' : 'bg-surface-800 text-slate-400'}`}
          >
            {isBonus ? '✓ ボーナス' : '子役'}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">絵文字</label>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                ${emoji === e ? 'bg-brand-600' : 'bg-surface-800'}`}
            >
              {e}
            </button>
          ))}
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value.slice(-2))}
            className="w-9 h-9 bg-surface-800 text-center text-sm text-white rounded-lg outline-none border border-surface-500 focus:border-brand-500"
            placeholder="✏️"
            maxLength={2}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 block mb-1">カラー</label>
        <div className="flex gap-2 flex-wrap">
          {ITEM_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg bg-surface-800 text-slate-400 text-sm"
        >キャンセル</button>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="flex-1 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold disabled:opacity-50"
        >保存</button>
      </div>
    </div>
  )
}

export function SettingsScreen() {
  const { settings, machines, updateSettings, addCountItem, updateCountItem, removeCountItem, applyPreset } = useStore()
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showMachineSelector, setShowMachineSelector] = useState(false)

  if (showMachineSelector) {
    return <MachineSelector onClose={() => setShowMachineSelector(false)} />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Machine select button */}
      <button
        onClick={() => setShowMachineSelector(true)}
        className="w-full bg-brand-600 active:bg-brand-700 rounded-xl p-4 flex items-center gap-3 transition-colors touch-manipulation"
      >
        <span className="text-3xl">🎰</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-white">台から選ぶ</p>
          <p className="text-xs text-brand-300 mt-0.5">
            {machines.length > 0
              ? `${machines.length}台収録 · タップして選択`
              : '読み込み中...'}
          </p>
        </div>
        <span className="text-slate-300 text-lg">›</span>
      </button>

      {/* Machine settings */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 font-medium mb-3">🔧 台の設定（手動）</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400">台名</label>
            <input
              value={settings.machineName}
              onChange={e => updateSettings({ machineName: e.target.value })}
              className="w-full mt-1 bg-surface-600 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500 focus:border-brand-500"
              placeholder="例: バジリスク絆2"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-400">台の種類</label>
              <select
                value={settings.machineType}
                onChange={e => updateSettings({ machineType: e.target.value as 'slot' | 'pachinko' })}
                className="w-full mt-1 bg-surface-600 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500"
              >
                <option value="slot">スロット</option>
                <option value="pachinko">パチンコ</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400">コイン単価（円）</label>
              <input
                type="number"
                inputMode="numeric"
                value={settings.coinValue}
                onChange={e => updateSettings({ coinValue: parseFloat(e.target.value) || 4 })}
                className="w-full mt-1 bg-surface-600 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">理論RTP (%)</label>
            <input
              type="number"
              inputMode="numeric"
              value={settings.theoreticalRTP}
              onChange={e => updateSettings({ theoreticalRTP: parseFloat(e.target.value) || 97 })}
              className="w-full mt-1 bg-surface-600 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500"
              placeholder="97"
            />
          </div>
        </div>
      </div>

      {/* Preset selector */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 font-medium mb-2">⚡ プリセット（台の種類で初期化）</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="py-2.5 px-3 rounded-lg bg-surface-600 text-slate-300 text-sm active:bg-brand-700 active:text-white transition-colors text-left"
            >
              <span className="font-medium">{preset.presetName}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5">※適用するとカウントがリセットされます</p>
      </div>

      {/* Alert settings */}
      <div className="bg-surface-700 rounded-xl p-3">
        <p className="text-xs text-slate-400 font-medium mb-3">🔔 アラート設定</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400">損切りライン（円） 0=無効</label>
            <input
              type="number"
              inputMode="numeric"
              value={settings.maxLoss}
              onChange={e => updateSettings({ maxLoss: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 bg-surface-600 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500"
              placeholder="例: 10000"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">ハマりアラート（G） 0=無効</label>
            <input
              type="number"
              inputMode="numeric"
              value={settings.maxDrought}
              onChange={e => updateSettings({ maxDrought: parseInt(e.target.value) || 0 })}
              className="w-full mt-1 bg-surface-600 text-white text-sm px-3 py-2 rounded-lg outline-none border border-surface-500"
              placeholder="例: 500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">バイブレーション</label>
            <button
              onClick={() => updateSettings({ hapticEnabled: !settings.hapticEnabled })}
              className={`w-12 h-6 rounded-full transition-all relative ${settings.hapticEnabled ? 'bg-brand-500' : 'bg-surface-500'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                ${settings.hapticEnabled ? 'left-6.5 translate-x-0.5' : 'left-0.5'}`}
                style={{ left: settings.hapticEnabled ? 'calc(100% - 22px)' : '2px' }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Count items */}
      <div className="bg-surface-700 rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 font-medium">🎯 カウント項目</p>
          <button
            onClick={() => { setAddingItem(true); setEditingItem(null) }}
            className="text-xs text-brand-400 font-medium active:text-brand-300"
          >+ 追加</button>
        </div>

        {addingItem && (
          <div className="mb-3">
            <ItemEditor
              item={{}}
              onSave={item => { addCountItem(item); setAddingItem(false) }}
              onCancel={() => setAddingItem(false)}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {settings.countItems.map(item => (
            <div key={item.id}>
              {editingItem === item.id ? (
                <ItemEditor
                  item={item}
                  onSave={updated => { updateCountItem(updated); setEditingItem(null) }}
                  onCancel={() => setEditingItem(null)}
                />
              ) : (
                <div className="flex items-center gap-2 bg-surface-600 rounded-xl px-3 py-2">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{item.name}</span>
                      {item.isBonus && (
                        <span className="text-[9px] bg-brand-800 text-brand-300 px-1 py-0.5 rounded-full">ボーナス</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">理論値: 1/{item.theoreticalProb}</span>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <button
                    onClick={() => setEditingItem(item.id)}
                    className="text-xs text-slate-500 active:text-slate-300 px-1"
                  >編集</button>
                  {confirmDelete === item.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] text-slate-500"
                      >戻る</button>
                      <button
                        onClick={() => { removeCountItem(item.id); setConfirmDelete(null) }}
                        className="text-[10px] text-red-400 font-bold"
                      >削除</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="text-xs text-slate-600 active:text-red-400 px-1"
                    >✕</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-700 pb-2">
        子役カウンター Pro v1.0 — データはこの端末にのみ保存されます
      </div>
    </div>
  )
}
