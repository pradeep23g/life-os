import { Link } from 'react-router-dom'
import { Route, ArrowLeft } from 'lucide-react'

export function ExplorePage() {
  return (
    <div className="space-y-6 pb-28 sm:pb-24">
      <Link
        to="/learning-os"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Learning OS
      </Link>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-8 sm:p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-950/40 border border-blue-800/40 mb-4">
          <Route className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Explore Templates & Tracks</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
          Discover curated learning roadmaps, domain tracks, and skill templates to import into your personal Learning OS.
        </p>
      </div>
    </div>
  )
}
