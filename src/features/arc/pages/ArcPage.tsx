import { useState } from 'react'
import {
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  History,
  BookOpen,
} from 'lucide-react'
import { useArcTelemetry } from '../hooks/useArcTelemetry'
import { ChapterHero } from '../components/ChapterHero'
import { ArcCountdownLedger } from '../components/ArcCountdownLedger'
import { FocusDomainsSection } from '../components/FocusDomainsSection'
import { EpochHorizonRail } from '../components/EpochHorizonRail'
import { SeasonalMilestones } from '../components/SeasonalMilestones'
import { CheckpointLedger } from '../components/CheckpointLedger'
import { CreateArcModal } from '../components/CreateArcModal'
import { AmendArcModal } from '../components/AmendArcModal'
import { ArcRetrospectiveModal } from '../components/ArcRetrospectiveModal'
import { ArcArchiveView } from '../components/ArcArchiveView'

export default function ArcPage() {
  const {
    config,
    progress,
    checkpoints,
    milestones,
    focusDomains,
    seasonActivity,
    totals,
    lifeState,
    momentumScore,
    toggleManualMilestone,
    concludeArcEarly,
    amendCommitments,
    archiveArcWithRetrospective,
    isLoading,
  } = useArcTelemetry()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAmendModalOpen, setIsAmendModalOpen] = useState(false)
  const [isRetrospectiveModalOpen, setIsRetrospectiveModalOpen] = useState(false)
  const [isConcludeDialogOpen, setIsConcludeDialogOpen] = useState(false)
  const [isConcluding, setIsConcluding] = useState(false)
  const [concludeError, setConcludeError] = useState<string | null>(null)
  const [showArchiveInline, setShowArchiveInline] = useState(false)

  const handleConfirmConclude = async () => {
    try {
      setIsConcluding(true)
      setConcludeError(null)
      await concludeArcEarly()
      setIsConcludeDialogOpen(false)
    } catch (err: unknown) {
      setConcludeError(err instanceof Error ? err.message : 'Failed to conclude arc early.')
    } finally {
      setIsConcluding(false)
    }
  }

  if (isLoading) {
    return (
      <main className="w-full max-w-5xl mx-auto py-16 px-4 text-center font-mono text-xs text-text-tertiary">
        SYNCHRONIZING ARC TELEMETRY...
      </main>
    )
  }

  // Idle state: No active campaign exists on the ledger
  if (!config) {
    return (
      <>
        <ArcArchiveView onInitiateArc={() => setIsCreateModalOpen(true)} />
        <CreateArcModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </>
    )
  }

  const accentColor = config.accentColor || '#22d3ee'
  const isCompleted = config.status === 'completed'

  return (
    <main className="w-full max-w-5xl mx-auto py-6 sm:py-10 md:py-14 px-3 sm:px-6 md:px-8 space-y-8 sm:space-y-12">
      {/* Top Utility Action Bar */}
      <nav
        aria-label="Active Arc Controls"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl border border-border bg-surface/70 backdrop-blur-sm shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-2 w-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'animate-pulse'}`}
            style={{ backgroundColor: isCompleted ? '#10b981' : accentColor }}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
            {isCompleted ? 'Concluded Campaign:' : 'Active Campaign:'}{' '}
            <strong className="text-text-primary font-medium">{config.title}</strong>
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold"
            style={{
              borderColor: isCompleted ? '#10b98140' : `${accentColor}40`,
              color: isCompleted ? '#10b981' : accentColor,
              backgroundColor: isCompleted ? '#10b98110' : `${accentColor}10`,
            }}
          >
            {isCompleted ? 'Telemetry Frozen' : `Day ${progress.currentDay}/${progress.totalDays}`}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowArchiveInline(!showArchiveInline)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border border-border bg-elevated hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            <span>{showArchiveInline ? 'Hide Archive' : 'View Archive'}</span>
          </button>

          {isCompleted ? (
            <button
              type="button"
              onClick={() => setIsRetrospectiveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors font-semibold"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Author Retrospective</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsAmendModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border border-border bg-elevated hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
              >
                <FileEdit className="h-3.5 w-3.5 text-amber-400" />
                <span>Amend Commitments</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConcludeDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Conclude Arc</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Stage 1 Completed Campaign Banner & Author Retrospective Callout */}
      {isCompleted && (
        <section
          aria-label="Completed Campaign Status"
          className="p-6 sm:p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm space-y-4 shadow-lg animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Stage 1 Complete · Concluded
                  </span>
                  <span className="text-xs font-mono text-text-tertiary">
                    Telemetry Invariants Frozen
                  </span>
                </div>
                <h2 className="text-xl font-serif font-medium text-text-primary">
                  &ldquo;{config.title}&rdquo; Campaign Concluded
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                  Concluded on {config.completedAt ? config.completedAt.slice(0, 10) : 'Today'} (Day {progress.currentDay} of {progress.totalDays} planned). All milestone pacing, recovery rates, and telemetry aggregations have been permanently frozen. To formally seal and archive this campaign to your permanent ledger, author your 5-part completion retrospective.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRetrospectiveModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 text-background font-mono text-xs uppercase tracking-wider font-semibold hover:bg-emerald-300 transition-all shadow-lg hover:shadow-emerald-400/20 active:scale-95 shrink-0 self-start sm:self-center"
            >
              <BookOpen className="h-4 w-4" />
              <span>Author Retrospective</span>
            </button>
          </div>
        </section>
      )}

      {/* Optional Archive Toggle View */}
      {showArchiveInline && (
        <section className="p-6 rounded-xl border border-dashed border-border bg-surface/30 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary flex items-center gap-2">
              <History className="h-4 w-4" />
              Campaign Archives
            </h2>
            <button
              type="button"
              onClick={() => setShowArchiveInline(false)}
              className="text-xs font-mono text-text-tertiary hover:text-text-primary"
            >
              Close
            </button>
          </div>
          <ArcArchiveView onInitiateArc={() => setIsCreateModalOpen(true)} hideHero />
        </section>
      )}

      {/* Tier 1: Ambient Orientation & Monumental Chapter Opening */}
      <section aria-label="Chapter Overview">
        <ChapterHero
          config={config}
          lifeState={lifeState}
          momentumScore={momentumScore}
        />

        <ArcCountdownLedger
          progress={progress}
          accentColor={accentColor}
        />

        {focusDomains.length > 0 && (
          <FocusDomainsSection
            focusDomains={focusDomains}
            dailyActivity={seasonActivity}
            accentColor={accentColor}
          />
        )}
      </section>

      {/* Tier 2: Structural Horizon, Milestones & Tactical Checkpoints */}
      <section className="space-y-12 sm:space-y-16" aria-label="Seasonal Temporal Structure">
        <EpochHorizonRail
          checkpoints={checkpoints}
          progress={progress}
          phases={config.phases}
          accentColor={accentColor}
        />

        <SeasonalMilestones
          milestones={milestones}
          activeDays={totals.activeDays}
          accentColor={accentColor}
          onToggleManualMilestone={isCompleted ? undefined : toggleManualMilestone}
        />

        <CheckpointLedger
          checkpoints={checkpoints}
          accentColor={accentColor}
        />
      </section>

      {/* Modals & Dialogs */}
      <CreateArcModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setShowArchiveInline(false)}
      />

      <AmendArcModal
        isOpen={isAmendModalOpen}
        onClose={() => setIsAmendModalOpen(false)}
        config={config}
        onAmend={amendCommitments}
      />

      <ArcRetrospectiveModal
        isOpen={isRetrospectiveModalOpen}
        onClose={() => setIsRetrospectiveModalOpen(false)}
        arcTitle={config.title}
        arcId={config.id}
        accentColor={accentColor}
        onSubmit={archiveArcWithRetrospective}
      />

      {/* Early Completion Confirmation Dialog */}
      {isConcludeDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !isConcluding && setIsConcludeDialogOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md p-6 rounded-xl border border-border bg-surface shadow-2xl font-sans text-text-primary space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-medium text-text-primary">
                    Conclude Arc Campaign?
                  </h3>
                  <p className="text-xs font-mono text-text-tertiary">
                    Early Completion Action
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConcludeDialogOpen(false)}
                disabled={isConcluding}
                className="text-text-tertiary hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Concluding <strong className="text-text-primary">"{config.title}"</strong> before its planned end date ({config.endDate}) will immediately transition its status from <strong>ACTIVE</strong> to <strong>COMPLETED</strong>.
            </p>

            <div className="p-3 rounded bg-background border border-border text-xs space-y-1 font-mono text-text-tertiary">
              <p>• Planned End Date: <span className="text-text-secondary">{config.endDate}</span></p>
              <p>• Concluded At: <span className="text-text-secondary">Today (Day {progress.currentDay})</span></p>
              <p>• Telemetry evaluation will freeze permanently.</p>
            </div>

            {concludeError && (
              <p className="text-xs text-rose-400 font-mono">
                {concludeError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConcludeDialogOpen(false)}
                disabled={isConcluding}
                className="px-3.5 py-1.5 rounded border border-border text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConclude}
                disabled={isConcluding}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-rose-500 text-white font-mono text-xs uppercase tracking-wider font-semibold hover:bg-rose-600 transition-colors shadow"
              >
                {isConcluding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Freezing Arc...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Confirm Conclude Arc</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
