import type { ReactNode } from 'react'

type DataLabSectionProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

function DataLabSection({ title, subtitle, children }: DataLabSectionProps) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="border-b border-border pb-3 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </article>
  )
}

export default DataLabSection
