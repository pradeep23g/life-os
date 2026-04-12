import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'

type TagInputProps = {
  value: string[]
  onChange: (nextValue: string[]) => void
  placeholder?: string
  className?: string
}

function cleanTag(rawValue: string): string {
  return rawValue.replaceAll(',', '').trim()
}

function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [draft, setDraft] = useState('')
  const normalizedSet = useMemo(() => new Set(value.map((item) => item.toLowerCase())), [value])

  const commitDraft = () => {
    const nextTag = cleanTag(draft)
    if (!nextTag) {
      setDraft('')
      return
    }

    if (!normalizedSet.has(nextTag.toLowerCase())) {
      onChange([...value, nextTag])
    }
    setDraft('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commitDraft()
      return
    }

    if (event.key === 'Backspace' && draft.length === 0 && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div
      className={`mt-1 flex min-h-[42px] w-full flex-wrap items-center gap-1 rounded-md border border-[#222222] bg-black px-2 py-1 ${
        className ?? ''
      }`}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-xs text-white">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((item) => item !== tag))}
            className="rounded-full px-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={placeholder}
        className="min-w-[140px] flex-1 border-none bg-transparent p-1 text-sm text-slate-100 outline-none placeholder:text-slate-500"
      />
    </div>
  )
}

export default TagInput
