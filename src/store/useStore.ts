import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CountItem, Session, Settings, BonusEntry, PRESETS, SettingProb, MachinePreset, MachineDB,
} from '../types'

const MACHINES_URL = '/machines.json'
const MACHINES_CACHE_KEY = 'pachinko-machines-cache'
const MACHINES_CACHE_TTL = 1000 * 60 * 60 * 6 // 6時間キャッシュ

async function fetchMachines(): Promise<MachinePreset[]> {
  try {
    const cached = localStorage.getItem(MACHINES_CACHE_KEY)
    if (cached) {
      const { data, ts } = JSON.parse(cached)
      if (Date.now() - ts < MACHINES_CACHE_TTL) return data
    }
    const res = await fetch(MACHINES_URL + '?v=' + Date.now())
    if (!res.ok) throw new Error('fetch failed')
    const db: MachineDB = await res.json()
    localStorage.setItem(MACHINES_CACHE_KEY, JSON.stringify({ data: db.machines, ts: Date.now() }))
    return db.machines
  } catch {
    return []
  }
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function defaultSettings(): Settings {
  const preset = PRESETS.slot_standard
  return {
    machineName: '',
    machineType: 'slot',
    theoreticalRTP: 97,
    coinValue: 4,
    maxLoss: 0,
    maxDrought: 0,
    hapticEnabled: true,
    presetName: 'スロット（標準）',
    countItems: preset.countItems!.map(i => ({ ...i })),
    settingProbs: [],
  }
}

function newSession(settings: Settings): Session {
  return {
    id: makeId(),
    machineName: settings.machineName || '無名の台',
    machineType: settings.machineType,
    startTime: Date.now(),
    games: 0,
    investment: 0,
    returned: 0,
    countItems: settings.countItems.map(i => ({ ...i, count: 0 })),
    bonusHistory: [],
    notes: '',
  }
}

interface AppState {
  session: Session
  history: Session[]
  settings: Settings
  machines: MachinePreset[]
  machinesLoaded: boolean

  // Counter actions
  incrementCount: (itemId: string) => void
  decrementCount: (itemId: string) => void
  resetItemCount: (itemId: string) => void
  addGames: (delta: number) => void
  setGames: (n: number) => void
  setInvestment: (n: number) => void
  setReturned: (n: number) => void
  setNotes: (s: string) => void

  // Session actions
  endSession: () => void
  startNewSession: () => void
  deleteHistory: (id: string) => void

  // Settings actions
  updateSettings: (partial: Partial<Settings>) => void
  applyPreset: (key: string) => void
  applyMachinePreset: (machine: MachinePreset) => void
  addCountItem: (item: CountItem) => void
  updateCountItem: (item: CountItem) => void
  removeCountItem: (itemId: string) => void
  reorderCountItems: (items: CountItem[]) => void
  updateSettingProb: (sp: SettingProb) => void
  loadMachines: () => Promise<void>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings(),
      session: newSession(defaultSettings()),
      history: [],
      machines: [],
      machinesLoaded: false,

      incrementCount(itemId) {
        set(state => {
          const items = state.session.countItems.map(i =>
            i.id === itemId ? { ...i, count: i.count + 1 } : i
          )
          const item = items.find(i => i.id === itemId)
          const bonusHistory = [...state.session.bonusHistory]
          if (item?.isBonus) {
            bonusHistory.push({
              id: makeId(),
              gameCount: state.session.games,
              itemId,
              itemName: item.name,
              timestamp: Date.now(),
            } as BonusEntry)
          }
          if (state.settings.hapticEnabled && navigator.vibrate) {
            navigator.vibrate(30)
          }
          return { session: { ...state.session, countItems: items, bonusHistory } }
        })
      },

      decrementCount(itemId) {
        set(state => ({
          session: {
            ...state.session,
            countItems: state.session.countItems.map(i =>
              i.id === itemId ? { ...i, count: Math.max(0, i.count - 1) } : i
            ),
          },
        }))
      },

      resetItemCount(itemId) {
        set(state => ({
          session: {
            ...state.session,
            countItems: state.session.countItems.map(i =>
              i.id === itemId ? { ...i, count: 0 } : i
            ),
          },
        }))
      },

      addGames(delta) {
        set(state => ({
          session: { ...state.session, games: Math.max(0, state.session.games + delta) },
        }))
      },

      setGames(n) {
        set(state => ({ session: { ...state.session, games: Math.max(0, n) } }))
      },

      setInvestment(n) {
        set(state => ({ session: { ...state.session, investment: Math.max(0, n) } }))
      },

      setReturned(n) {
        set(state => ({ session: { ...state.session, returned: Math.max(0, n) } }))
      },

      setNotes(s) {
        set(state => ({ session: { ...state.session, notes: s } }))
      },

      endSession() {
        const { session } = get()
        const ended: Session = { ...session, endTime: Date.now() }
        set(state => ({
          history: [ended, ...state.history].slice(0, 100),
        }))
      },

      startNewSession() {
        const { settings, session } = get()
        const ended: Session = { ...session, endTime: Date.now() }
        set(state => ({
          history: [ended, ...state.history].slice(0, 100),
          session: newSession(settings),
        }))
      },

      deleteHistory(id) {
        set(state => ({ history: state.history.filter(s => s.id !== id) }))
      },

      updateSettings(partial) {
        set(state => {
          const next = { ...state.settings, ...partial }
          const updatedSession = {
            ...state.session,
            machineName: next.machineName || state.session.machineName,
          }
          return { settings: next, session: updatedSession }
        })
      },

      applyMachinePreset(machine) {
        set(state => {
          const countItems: CountItem[] = machine.items.map(it => ({
            id: it.id,
            name: it.name,
            emoji: it.emoji,
            color: it.color,
            isBonus: it.isBonus,
            theoreticalProb: it.prob,
            count: 0,
          }))
          const settingProbs = machine.items.map(it => ({
            itemId: it.id,
            setting1: it.sprobs[0],
            setting2: it.sprobs[1],
            setting3: it.sprobs[2],
            setting4: it.sprobs[3],
            setting5: it.sprobs[4],
            setting6: it.sprobs[5],
          }))
          const next: Settings = {
            ...state.settings,
            machineName: machine.name,
            machineType: machine.type,
            theoreticalRTP: machine.rtp,
            coinValue: machine.coinValue,
            presetName: machine.name,
            countItems,
            settingProbs,
          }
          return { settings: next, session: newSession(next) }
        })
      },

      applyPreset(key) {
        const preset = PRESETS[key]
        if (!preset) return
        set(state => {
          const next: Settings = {
            ...state.settings,
            ...preset,
            machineName: state.settings.machineName,
            countItems: preset.countItems!.map(i => ({ ...i, count: 0 })),
          }
          return {
            settings: next,
            session: newSession(next),
          }
        })
      },

      addCountItem(item) {
        set(state => {
          const items = [...state.settings.countItems, item]
          const sessionItems = [...state.session.countItems, { ...item, count: 0 }]
          return {
            settings: { ...state.settings, countItems: items },
            session: { ...state.session, countItems: sessionItems },
          }
        })
      },

      updateCountItem(item) {
        set(state => {
          const settings = {
            ...state.settings,
            countItems: state.settings.countItems.map(i => i.id === item.id ? item : i),
          }
          const session = {
            ...state.session,
            countItems: state.session.countItems.map(i =>
              i.id === item.id ? { ...item, count: i.count } : i
            ),
          }
          return { settings, session }
        })
      },

      removeCountItem(itemId) {
        set(state => ({
          settings: {
            ...state.settings,
            countItems: state.settings.countItems.filter(i => i.id !== itemId),
          },
          session: {
            ...state.session,
            countItems: state.session.countItems.filter(i => i.id !== itemId),
          },
        }))
      },

      reorderCountItems(items) {
        set(state => ({
          settings: { ...state.settings, countItems: items },
          session: { ...state.session, countItems: items },
        }))
      },

      updateSettingProb(sp) {
        set(state => {
          const existing = state.settings.settingProbs.find(p => p.itemId === sp.itemId)
          const settingProbs = existing
            ? state.settings.settingProbs.map(p => p.itemId === sp.itemId ? sp : p)
            : [...state.settings.settingProbs, sp]
          return { settings: { ...state.settings, settingProbs } }
        })
      },

      async loadMachines() {
        const machines = await fetchMachines()
        if (machines.length > 0) set({ machines, machinesLoaded: true })
      },
    }),
    {
      name: 'pachinko-counter-v1',
      partialize: state => ({
        settings: state.settings,
        session: state.session,
        history: state.history,
      }),
    }
  )
)
