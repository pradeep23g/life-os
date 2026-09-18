import { useEffect, useRef } from 'react'

export interface UseExecutionKeyboardOptions {
  itemCount: number
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onToggleCurrent: () => void
  onFocusTimerCurrent: () => void
  onQuickEntryFocus?: () => void
  enabled?: boolean
}

/**
 * Determines whether the event target is an interactive form element
 * where standard single-key shortcuts must NOT be intercepted.
 */
export function isFormInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toUpperCase()
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true
  }

  if (target.isContentEditable) {
    return true
  }

  const role = target.getAttribute('role')
  if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
    return true
  }

  return false
}

/**
 * Keyboard navigation hook for the Execution Terminal.
 * Supports:
 *   - J / ArrowDown : move selection down
 *   - K / ArrowUp   : move selection up
 *   - Space         : toggle completion of selected task
 *   - F             : launch/stop focus timer for selected task
 *   - /             : focus the inline quick task entry
 *   - Home / End    : jump to first / last task
 *
 * Automatically guards against hijacking typing inside inputs, textareas, or selects.
 * Cleans up window event listener on unmount.
 */
export function useExecutionKeyboard({
  itemCount,
  selectedIndex,
  onSelectIndex,
  onToggleCurrent,
  onFocusTimerCurrent,
  onQuickEntryFocus,
  enabled = true,
}: UseExecutionKeyboardOptions) {
  // Store latest callbacks in ref to avoid re-binding window listener on every render
  const stateRef = useRef({
    itemCount,
    selectedIndex,
    onSelectIndex,
    onToggleCurrent,
    onFocusTimerCurrent,
    onQuickEntryFocus,
  })

  useEffect(() => {
    stateRef.current = {
      itemCount,
      selectedIndex,
      onSelectIndex,
      onToggleCurrent,
      onFocusTimerCurrent,
      onQuickEntryFocus,
    }
  })

  // Ensure selectedIndex is clamped if item count shrinks
  useEffect(() => {
    if (itemCount === 0) {
      if (selectedIndex !== -1) {
        onSelectIndex(-1)
      }
    } else if (selectedIndex >= itemCount) {
      onSelectIndex(itemCount - 1)
    } else if (selectedIndex === -1 && itemCount > 0) {
      onSelectIndex(0)
    }
  }, [itemCount, selectedIndex, onSelectIndex])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Never intercept browser commands or system modifier chords
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      // Do NOT hijack typing if the user is inside an input, textarea, or contentEditable
      if (isFormInputElement(event.target)) {
        // Allow Escape inside input to blur and return to list navigation
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur()
        }
        return
      }

      const {
        itemCount: count,
        selectedIndex: currentIdx,
        onSelectIndex: selectIdx,
        onToggleCurrent: toggleCurrent,
        onFocusTimerCurrent: focusTimerCurrent,
        onQuickEntryFocus: quickEntryFocus,
      } = stateRef.current

      switch (event.key) {
        case 'j':
        case 'J':
        case 'ArrowDown': {
          if (count <= 0) return
          event.preventDefault()
          const nextIndex = currentIdx === -1 ? 0 : Math.min(currentIdx + 1, count - 1)
          selectIdx(nextIndex)
          break
        }

        case 'k':
        case 'K':
        case 'ArrowUp': {
          if (count <= 0) return
          event.preventDefault()
          const prevIndex = currentIdx === -1 ? 0 : Math.max(currentIdx - 1, 0)
          selectIdx(prevIndex)
          break
        }

        case ' ': {
          if (count <= 0 || currentIdx < 0 || currentIdx >= count) return
          event.preventDefault()
          toggleCurrent()
          break
        }

        case 'f':
        case 'F': {
          if (count <= 0 || currentIdx < 0 || currentIdx >= count) return
          event.preventDefault()
          focusTimerCurrent()
          break
        }

        case '/': {
          event.preventDefault()
          quickEntryFocus?.()
          break
        }

        case 'Home': {
          if (count <= 0) return
          event.preventDefault()
          selectIdx(0)
          break
        }

        case 'End': {
          if (count <= 0) return
          event.preventDefault()
          selectIdx(count - 1)
          break
        }

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled])
}
