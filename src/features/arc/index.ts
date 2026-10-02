export { default as ArcPage } from './pages/ArcPage'
export { CreateArcModal } from './components/CreateArcModal'
export { AmendArcModal } from './components/AmendArcModal'
export { ArcRetrospectiveModal } from './components/ArcRetrospectiveModal'
export { ArcArchiveView } from './components/ArcArchiveView'
export { ARC_PROMPT_TEMPLATE, extractCanonicalExampleFromPrompt } from './prompts/arcPromptTemplate'
export { computeAmendmentDiffs } from './utils/amendmentAuditor'
export { ARC_ICONS, ARC_ACCENT_COLORS, TELEMETRY_BINDING_KEYS, ARC_HEALTH_COLORS, getArcHealthColor } from './constants'
export { calculateArcProgress, generateArcCheckpoints } from './config'
export { useArcTelemetry, useActiveArcSeason } from './hooks/useArcTelemetry'
export type {
  ArcSeasonConfig,
  ArcConfig,
  ArcTemporalProgress,
  ArcCheckpoint,
  ArcMilestone,
  ArcMilestoneConfig,
  ArcAmendment,
  ArcFocusDomain,
  ArcPhase,
  ArcLifecycleStatus,
} from './types'

