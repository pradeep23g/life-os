import { useSyncExternalStore } from 'react'

export const DEFAULT_MODULE_COLORS: Record<string, string> = {
  'Home': '#ffffff',
  'Productivity': '#3b82f6',
  'Time OS': '#f59e0b',
  'Mind OS': '#a855f7',
  'Winter Arc': '#22d3ee',
  'Fitness OS': '#ef4444',
  'Learning OS': '#eab308',
  'Finance OS': '#10b981',
  'Data Lab': '#6366f1',
  'Reports': '#f43f5e',
  'Mission Control': '#ec4899',
  'Admin': '#8b5cf6'
}

function loadInitialColors(): Record<string, string> {
  try {
    const stored = localStorage.getItem('life_os_module_colors')
    if (stored) {
      return { ...DEFAULT_MODULE_COLORS, ...JSON.parse(stored) }
    }
  } catch {
    // Fall back to defaults
  }
  return DEFAULT_MODULE_COLORS
}

let currentColors: Record<string, string> = loadInitialColors()
const subscribers = new Set<() => void>()

function subscribe(callback: () => void) {
  subscribers.add(callback)
  return () => {
    subscribers.delete(callback)
  }
}

function getSnapshot() {
  return currentColors
}

export function useModuleColors() {
  const colors = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_MODULE_COLORS)

  const updateColor = (moduleName: string, hex: string) => {
    currentColors = { ...currentColors, [moduleName]: hex }
    try {
      localStorage.setItem('life_os_module_colors', JSON.stringify(currentColors))
    } catch {
      // Ignore storage write error
    }
    subscribers.forEach((callback) => callback())
  }

  return { colors, updateColor }
}
