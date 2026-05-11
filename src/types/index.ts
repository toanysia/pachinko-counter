export type MachineType = 'slot' | 'pachinko'

export interface CountItem {
  id: string
  name: string
  count: number
  theoreticalProb: number // denominator: 1/N → store N (e.g. 100 means 1/100)
  color: string
  emoji: string
  isBonus: boolean // true = bonus count, false = ko-yaku (small prize)
}

export interface BonusEntry {
  id: string
  gameCount: number
  itemId: string
  itemName: string
  timestamp: number
}

export interface Session {
  id: string
  machineName: string
  machineType: MachineType
  startTime: number
  endTime?: number
  games: number
  investment: number
  returned: number
  countItems: CountItem[]
  bonusHistory: BonusEntry[]
  notes: string
}

export interface Settings {
  machineName: string
  machineType: MachineType
  theoreticalRTP: number        // e.g. 97 for 97%
  coinValue: number             // yen per 1 media (e.g. 4 for 4円スロット)
  maxLoss: number               // alert when loss exceeds this amount (0 = disabled)
  maxDrought: number            // alert when bonus drought exceeds this games (0 = disabled)
  hapticEnabled: boolean
  presetName: string
  countItems: CountItem[]
  // Setting estimation (設定判別) theoretical probs per setting
  settingProbs: SettingProb[]
}

export interface SettingProb {
  itemId: string
  setting1: number
  setting2: number
  setting3: number
  setting4: number
  setting5: number
  setting6: number
}

export const PRESETS: Record<string, Partial<Settings>> = {
  slot_standard: {
    machineName: '',
    machineType: 'slot',
    theoreticalRTP: 97,
    coinValue: 4,
    presetName: 'スロット（標準）',
    countItems: [
      { id: 'cherry',     name: 'チェリー',   count: 0, theoreticalProb: 33,  color: '#ef4444', emoji: '🍒', isBonus: false },
      { id: 'suika',      name: 'スイカ',     count: 0, theoreticalProb: 100, color: '#22c55e', emoji: '🍉', isBonus: false },
      { id: 'kakucherry', name: '角チェリー', count: 0, theoreticalProb: 1000, color: '#f97316', emoji: '🌸', isBonus: false },
      { id: 'bb',         name: 'BB',        count: 0, theoreticalProb: 300, color: '#7c3aed', emoji: '⭐', isBonus: true  },
      { id: 'rb',         name: 'RB',        count: 0, theoreticalProb: 500, color: '#3b82f6', emoji: '🔵', isBonus: true  },
      { id: 'at',         name: 'AT/ART',    count: 0, theoreticalProb: 200, color: '#f59e0b', emoji: '🔥', isBonus: true  },
    ],
  },
  pachinko_standard: {
    machineName: '',
    machineType: 'pachinko',
    theoreticalRTP: 99,
    coinValue: 1,
    presetName: 'パチンコ（標準）',
    countItems: [
      { id: 'jackpot_kaku', name: '確変大当たり', count: 0, theoreticalProb: 400, color: '#f59e0b', emoji: '🌟', isBonus: true  },
      { id: 'jackpot_tsuu', name: '通常大当たり', count: 0, theoreticalProb: 400, color: '#3b82f6', emoji: '💙', isBonus: true  },
      { id: 'jitan',        name: '時短',        count: 0, theoreticalProb: 200, color: '#22c55e', emoji: '⚡', isBonus: true  },
      { id: 'haiball',      name: '羽根モノ',    count: 0, theoreticalProb: 10,  color: '#a855f7', emoji: '🪶', isBonus: false },
    ],
  },
}

export interface MachineItemDef {
  id: string
  name: string
  emoji: string
  color: string
  isBonus: boolean
  prob: number  // average setting prob denominator
  sprobs: [number, number, number, number, number, number]  // per-setting probs
}

export interface MachinePreset {
  id: string
  name: string
  maker: string
  type: MachineType
  year: number
  rtp: number
  coinValue: number
  items: MachineItemDef[]
}

export interface MachineDB {
  version: string
  machines: MachinePreset[]
}

export const ITEM_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#3b82f6', '#7c3aed', '#ec4899', '#06b6d4',
  '#84cc16', '#14b8a6',
]

export const ITEM_EMOJIS = [
  '🍒','🍉','🌸','⭐','🔵','🔥','💎','🎰',
  '🎯','🌟','⚡','💙','🪶','🌈','👑',
]
