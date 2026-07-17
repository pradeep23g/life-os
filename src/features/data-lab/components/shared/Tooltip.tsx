import { useState, useRef, useEffect, type ReactNode } from 'react'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
}

function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
    })
  }, [visible])

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      className="relative inline-block"
    >
      {children}
      {visible ? (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: position.x, top: position.y }}
        >
          <div className="relative -translate-x-1/2 -translate-y-full mb-1 px-2 py-1.5 bg-[#1a1a1a] border border-[#333333] text-xs text-slate-200 font-mono whitespace-nowrap">
            {content}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Tooltip
