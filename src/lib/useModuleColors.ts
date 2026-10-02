import { useSyncExternalStore } from 'react'

export const DEFAULT_MODULE_COLORS: Record<string, string> = {
  'Home': '#ffffff',
  'Productivity': '#3b82f6',
  'Time OS': '#f59e0b',
  'Mind OS': '#a855f7',
  'Arc': '#22d3ee',
  'Winter Arc': '#22d3ee',
  'Fitness OS': '#ef4444',
  'Learning OS': '#eab308',
  'Finance OS': '#10b981',
  'Data Lab': '#6366f1',
  'Reports': '#f43f5e',
  'Mission Control': '#ec4899',
  'Profile': '#e2e8f0',
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

function updateColor(moduleName: string, hex: string) {
  currentColors = { ...currentColors, [moduleName]: hex }
  if (moduleName === 'Arc') {
    currentColors['Winter Arc'] = hex
  } else if (moduleName === 'Winter Arc') {
    currentColors['Arc'] = hex
  }
  try {
    localStorage.setItem('life_os_module_colors', JSON.stringify(currentColors))
  } catch {
    // Ignore storage write error
  }
  subscribers.forEach((callback) => callback())
}

function setArcAccentColor(hex: string) {
  if (currentColors['Arc'] !== hex || currentColors['Winter Arc'] !== hex) {
    updateColor('Arc', hex)
  }
}

export function useModuleColors() {
  const colors = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_MODULE_COLORS)

  return { colors, updateColor, setArcAccentColor }
}
