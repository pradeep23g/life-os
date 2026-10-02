import type { ArcAmendment, ArcMilestoneConfig } from '../types'

export interface CommitmentSnapshot {
  vow?: {
    headline: string
    body: string
    attribution?: string
  }
  principles?: string[]
  milestones?: ArcMilestoneConfig[]
}

/**
 * Computes granular amendment audit records comparing previous commitments to proposed updates.
 *
 * DESIGN RATIONALE:
 * - Commitments in an active arc are serious. A non-empty justification string is mandatory.
 * - Milestone diffing matches strictly on `milestone.id` rather than array position to prevent
 *   false diff cascades when milestones are prepended, reordered, or deleted.
 *
 * @param previous - Frozen baseline snapshot or prior commitment state
 * @param current - Proposed commitment state
 * @param reason - Mandatory justification string
 * @param timestamp - Audit timestamp (defaults to ISO now)
 * @returns Array of individual granular field-level diff records
 */
export function computeAmendmentDiffs(
  previous: CommitmentSnapshot,
  current: CommitmentSnapshot,
  reason: string,
  timestamp: string = new Date().toISOString(),
): ArcAmendment[] {
  const trimmedReason = reason?.trim()
  if (!trimmedReason) {
    throw new Error('Mandatory non-empty justification reason is required for amending active commitments.')
  }

  const diffs: ArcAmendment[] = []

  // 1. Audit Vow changes
  if (current.vow) {
    const prevVow = previous.vow
    if (!prevVow) {
      diffs.push({
        timestamp,
        field: 'vow',
        previousValue: null,
        newValue: current.vow,
        reason: trimmedReason,
      })
    } else {
      if (prevVow.headline !== current.vow.headline) {
        diffs.push({
          timestamp,
          field: 'vow.headline',
          previousValue: prevVow.headline,
          newValue: current.vow.headline,
          reason: trimmedReason,
        })
      }
      if (prevVow.body !== current.vow.body) {
        diffs.push({
          timestamp,
          field: 'vow.body',
          previousValue: prevVow.body,
          newValue: current.vow.body,
          reason: trimmedReason,
        })
      }
      if ((prevVow.attribution || '') !== (current.vow.attribution || '')) {
        diffs.push({
          timestamp,
          field: 'vow.attribution',
          previousValue: prevVow.attribution ?? '',
          newValue: current.vow.attribution ?? '',
          reason: trimmedReason,
        })
      }
    }
  }

  // 2. Audit Principles changes
  if (current.principles) {
    const prevPrinciples = previous.principles || []
    if (JSON.stringify(prevPrinciples) !== JSON.stringify(current.principles)) {
      diffs.push({
        timestamp,
        field: 'principles',
        previousValue: prevPrinciples,
        newValue: current.principles,
        reason: trimmedReason,
      })
    }
  }

  // 3. Audit Milestones changes
  if (current.milestones) {
    const prevMilestones = previous.milestones || []

    // Check for additions and modifications
    current.milestones.forEach((m, idx) => {
      const prevM = m.id ? prevMilestones.find((p) => p.id === m.id) : prevMilestones[idx]
      const milestoneKey = m.id || String(idx)

      if (!prevM) {
        diffs.push({
          timestamp,
          field: `milestones.${milestoneKey}`,
          previousValue: null,
          newValue: m,
          reason: trimmedReason,
        })
      } else {
        if (prevM.targetValue !== m.targetValue) {
          diffs.push({
            timestamp,
            field: `milestones.${milestoneKey}.targetValue`,
            previousValue: prevM.targetValue ?? null,
            newValue: m.targetValue ?? null,
            reason: trimmedReason,
          })
        }
        if (prevM.title !== m.title) {
          diffs.push({
            timestamp,
            field: `milestones.${milestoneKey}.title`,
            previousValue: prevM.title,
            newValue: m.title,
            reason: trimmedReason,
          })
        }
        if ((prevM.unit || '') !== (m.unit || '')) {
          diffs.push({
            timestamp,
            field: `milestones.${milestoneKey}.unit`,
            previousValue: prevM.unit ?? '',
            newValue: m.unit ?? '',
            reason: trimmedReason,
          })
        }
        if ((prevM.description || '') !== (m.description || '')) {
          diffs.push({
            timestamp,
            field: `milestones.${milestoneKey}.description`,
            previousValue: prevM.description ?? '',
            newValue: m.description ?? '',
            reason: trimmedReason,
          })
        }
      }
    })

    // Check for removed milestones
    prevMilestones.forEach((prevM, idx) => {
      const exists = current.milestones?.some((m) => (prevM.id ? m.id === prevM.id : false))
      if (!exists) {
        const milestoneKey = prevM.id || String(idx)
        diffs.push({
          timestamp,
          field: `milestones.${milestoneKey}`,
          previousValue: prevM,
          newValue: null,
          reason: trimmedReason,
        })
      }
    })
  }

  return diffs
}
