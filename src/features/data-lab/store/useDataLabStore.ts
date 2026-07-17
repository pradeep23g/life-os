import { create } from 'zustand'

import type { AnalyticsPeriod, DataLabTab } from '../types/types'

type DataLabState = {
  period: AnalyticsPeriod
  activeTab: DataLabTab
  setPeriod: (period: AnalyticsPeriod) => void
  setActiveTab: (tab: DataLabTab) => void
}

export const useDataLabStore = create<DataLabState>((set) => ({
  period: '30d',
  activeTab: 'overview',
  setPeriod: (period) => set({ period }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
