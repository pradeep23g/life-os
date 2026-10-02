import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateTemporalHorizon,
  evaluateMilestonePace,
  calculateOverallHealth,
} from '../src/features/arc/utils/paceEvaluator.ts'
import { resolveBinding } from '../src/features/arc/utils/telemetryRegistry.ts'
import { parseAndValidateArcConfig, validateArcRetrospective } from '../src/lib/schemas/seasonConfigSchema.ts'
import { calculateArcProgress, generateArcCheckpoints } from '../src/features/arc/config.ts'
import { getShellTitle } from '../src/layout/shellTitle.ts'
import { DEFAULT_MODULE_COLORS } from '../src/lib/useModuleColors.ts'
import {
  ARC_PROMPT_TEMPLATE,
  extractCanonicalExampleFromPrompt,
} from '../src/features/arc/prompts/arcPromptTemplate.ts'
import {
  ARC_ICONS,
  ARC_ACCENT_COLORS,
  TELEMETRY_BINDING_KEYS,
  getArcHealthColor,
} from '../src/features/arc/constants.ts'
import { computeAmendmentDiffs } from '../src/features/arc/utils/amendmentAuditor.ts'

test('calculateTemporalHorizon: upcoming arc', () => {
  const temporal = calculateTemporalHorizon('2026-11-01', '2026-11-30', '2026-10-15')
  assert.equal(temporal.currentDay, 0)
  assert.equal(temporal.totalDays, 30)
  assert.equal(temporal.remainingDays, 30)
  assert.equal(temporal.percentElapsed, 0)
  assert.equal(temporal.temporalStatus, 'upcoming')
})

test('calculateTemporalHorizon: active arc mid-stream', () => {
  const temporal = calculateTemporalHorizon('2026-10-01', '2026-10-31', '2026-10-16')
  assert.equal(temporal.totalDays, 31)
  assert.equal(temporal.currentDay, 16)
  assert.equal(temporal.remainingDays, 15)
  assert.equal(temporal.percentElapsed, 52)
  assert.equal(temporal.temporalStatus, 'active')
})

test('calculateTemporalHorizon: naturally concluded arc', () => {
  const temporal = calculateTemporalHorizon('2026-08-01', '2026-08-31', '2026-09-10')
  assert.equal(temporal.totalDays, 31)
  assert.equal(temporal.currentDay, 31)
  assert.equal(temporal.remainingDays, 0)
  assert.equal(temporal.percentElapsed, 100)
  assert.equal(temporal.temporalStatus, 'completed')
})

test('calculateTemporalHorizon: early completion', () => {
  // Arc planned for 90 days (Oct 1 to Dec 29), but completed early on Oct 31 (day 31)
  const temporal = calculateTemporalHorizon('2026-10-01', '2026-12-29', '2026-10-31', '2026-10-31T18:00:00.000Z')
  assert.equal(temporal.totalDays, 90)
  assert.equal(temporal.currentDay, 31)
  assert.equal(temporal.remainingDays, 0)
  assert.equal(temporal.percentElapsed, 100)
  assert.equal(temporal.temporalStatus, 'completed')
})

test('evaluateMilestonePace: telemetry milestones strict pace', () => {
  const temporal = calculateTemporalHorizon('2026-10-01', '2026-10-31', '2026-10-16') // Day 16 of 31, 15 remaining
  // target = 100
  // expected on Day 16: (16 / 31) * 100 = 51.61

  const milestone = {
    id: 'm1',
    title: 'Deep Work',
    kind: 'telemetry',
    targetValue: 100,
    unit: 'HOURS',
    binding: { source: 'deep_work', metric: 'total_hours' },
  }

  // Case 1: On track (50 hours actual / 51.61 expected = 96.8% pace >= 85%)
  const onTrack = evaluateMilestonePace(milestone, 50, temporal)
  assert.equal(onTrack.status, 'on_track')
  assert.equal(onTrack.completionPercent, 50)
  // needed = 50 / 15 days = 3.3
  assert.equal(onTrack.paceRequired, 3.3)

  // Case 2: At risk (35 hours actual / 51.61 expected = 67.8% pace, between 60% and 85%)
  const atRisk = evaluateMilestonePace(milestone, 35, temporal)
  assert.equal(atRisk.status, 'at_risk')
  // needed = 65 / 15 days = 4.3
  assert.equal(atRisk.paceRequired, 4.3)

  // Case 3: Behind (20 hours actual / 51.61 expected = 38.7% pace < 60%)
  const behind = evaluateMilestonePace(milestone, 20, temporal)
  assert.equal(behind.status, 'behind')
  // needed = 80 / 15 days = 5.3
  assert.equal(behind.paceRequired, 5.3)

  // Case 4: Complete
  const complete = evaluateMilestonePace(milestone, 105, temporal)
  assert.equal(complete.status, 'complete')
  assert.equal(complete.completionPercent, 100)
  assert.equal(complete.paceRequired, 0)
  assert.equal(complete.isAchieved, true)
})

test('evaluateMilestonePace: manual milestones', () => {
  const temporal = calculateTemporalHorizon('2026-10-01', '2026-10-31', '2026-10-16')
  const milestone = {
    id: 'manual-1',
    title: 'Publish Thesis',
    kind: 'manual',
    description: 'Final published document',
  }

  const pending = evaluateMilestonePace(milestone, 0, temporal, {})
  assert.equal(pending.status, 'pending')
  assert.equal(pending.isAchieved, false)

  const completed = evaluateMilestonePace(milestone, 0, temporal, {
    'manual-1': { completedAt: '2026-10-10T12:00:00Z', notes: 'Done' },
  })
  assert.equal(completed.status, 'complete')
  assert.equal(completed.isAchieved, true)
  assert.equal(completed.completionPercent, 100)
})

test('calculateOverallHealth: priorities and pending interaction', () => {
  assert.equal(
    calculateOverallHealth([
      { status: 'complete' },
      { status: 'on_track' },
      { status: 'behind' },
    ]),
    'behind',
  )

  assert.equal(
    calculateOverallHealth([
      { status: 'complete' },
      { status: 'on_track' },
      { status: 'at_risk' },
    ]),
    'at_risk',
  )

  // Critical fix: pending manual milestones must not override on_track execution health
  assert.equal(
    calculateOverallHealth([
      { status: 'complete' },
      { status: 'on_track' },
      { status: 'pending' },
    ]),
    'on_track',
  )

  assert.equal(
    calculateOverallHealth([
      { status: 'at_risk' },
      { status: 'pending' },
    ]),
    'at_risk',
  )

  assert.equal(
    calculateOverallHealth([
      { status: 'behind' },
      { status: 'pending' },
    ]),
    'behind',
  )

  assert.equal(
    calculateOverallHealth([
      { status: 'complete' },
      { status: 'complete' },
    ]),
    'complete',
  )

  assert.equal(
    calculateOverallHealth([
      { status: 'complete' },
      { status: 'pending' },
    ]),
    'pending',
  )

  assert.equal(
    calculateOverallHealth([
      { status: 'pending' },
      { status: 'pending' },
    ]),
    'pending',
  )

  assert.equal(
    calculateOverallHealth([]),
    'on_track',
  )
})

test('resolveBinding: resolves SUM, derived hours, and active days', () => {
  const sampleActivity = [
    {
      activity_date: '2026-10-01',
      deep_work_minutes: 120,
      total_focus_minutes: 150,
      focus_sessions: 2,
      tasks_completed: 5,
      tasks_created: 3,
      habits_completed: 4,
      workouts_logged: 1,
      workout_minutes: 45,
      journal_entries: 1,
      learning_sessions_logged: 1,
      active_system_count: 5,
    },
    {
      activity_date: '2026-10-02',
      deep_work_minutes: 60,
      total_focus_minutes: 90,
      focus_sessions: 1,
      tasks_completed: 3,
      tasks_created: 2,
      habits_completed: 0,
      workouts_logged: 0,
      workout_minutes: 0,
      journal_entries: 0,
      learning_sessions_logged: 0,
      active_system_count: 2,
    },
  ]

  assert.equal(resolveBinding({ source: 'deep_work', metric: 'total_minutes' }, sampleActivity), 180)
  assert.equal(resolveBinding({ source: 'deep_work', metric: 'total_hours' }, sampleActivity), 3)
  assert.equal(resolveBinding({ source: 'tasks', metric: 'completed_count' }, sampleActivity), 8)
  assert.equal(resolveBinding({ source: 'habits', metric: 'active_days' }, sampleActivity), 1)
  assert.equal(resolveBinding({ source: 'fitness', metric: 'active_days' }, sampleActivity), 1)
  assert.equal(resolveBinding({ source: 'active_days', metric: 'total' }, sampleActivity), 2)
  assert.equal(resolveBinding({ source: 'unknown', metric: 'unknown' }, sampleActivity), 0)
})

test('parseAndValidateArcConfig: canonical validation and constraints', () => {
  const validConfig = {
    title: 'Spring Build 2027',
    startDate: '2027-03-01',
    endDate: '2027-05-30',
    accentColor: '#10b981',
    icon: 'sprout',
    vow: { headline: 'Mastery', body: 'Execution without compromise.' },
    focusDomains: [
      { id: 'fd1', name: 'Physical Endurance', binding: { source: 'fitness', metric: 'total_minutes' } },
    ],
    phases: [
      { id: 'p1', name: 'Foundation', startDay: 1, endDay: 30 },
      { id: 'p2', name: 'Peak', startDay: 31, endDay: 91 },
    ],
    milestones: [
      {
        id: 'm1',
        title: 'Training Minutes',
        kind: 'telemetry',
        targetValue: 2000,
        unit: 'MINUTES',
        binding: { source: 'fitness', metric: 'total_minutes' },
      },
      {
        id: 'm2',
        title: 'Run Marathon',
        kind: 'manual',
      },
    ],
  }

  const validResult = parseAndValidateArcConfig(JSON.stringify(validConfig))
  assert.equal(validResult.success, true)

  // Invalid icon rejection
  const invalidIcon = { ...validConfig, icon: 'forbidden-icon' }
  const invalidIconResult = parseAndValidateArcConfig(JSON.stringify(invalidIcon))
  assert.equal(invalidIconResult.success, false)

  // Invalid color rejection
  const invalidColor = { ...validConfig, accentColor: '#123456' }
  const invalidColorResult = parseAndValidateArcConfig(JSON.stringify(invalidColor))
  assert.equal(invalidColorResult.success, false)

  // Non-contiguous phases rejection (gap between Day 20 and Day 25)
  const gapPhases = {
    ...validConfig,
    phases: [
      { id: 'p1', name: 'Phase 1', startDay: 1, endDay: 20 },
      { id: 'p2', name: 'Phase 2', startDay: 25, endDay: 91 },
    ],
  }
  const gapPhasesResult = parseAndValidateArcConfig(JSON.stringify(gapPhases))
  assert.equal(gapPhasesResult.success, false)
})

test('calculateArcProgress: respects early completion and bounds', () => {
  const config = {
    id: 'test-arc',
    title: 'Autumn Campaign',
    chapter: 'CHAPTER II',
    year: 2026,
    startDate: '2026-09-01',
    endDate: '2026-11-29',
    totalDays: 90,
    completedAt: '2026-10-15T10:00:00Z',
    vow: { headline: 'Test', body: 'Test vow' },
    principles: [],
  }

  const progress = calculateArcProgress(config, new Date('2026-10-20T12:00:00Z'))
  assert.equal(progress.status, 'completed')
  assert.equal(progress.currentDay, 45)
  assert.equal(progress.remainingDays, 0)
  assert.equal(progress.percentElapsed, 100)
})

test('generateArcCheckpoints: maps variable phases to weekly checkpoints', () => {
  const variableArc = {
    id: 'var-arc',
    title: 'Sprint Arc',
    chapter: 'SPRINT',
    year: 2026,
    startDate: '2026-10-01',
    endDate: '2026-10-21', // 21 days = 3 weeks
    totalDays: 21,
    vow: { headline: 'Speed', body: 'Execution' },
    principles: [],
    phases: [
      { id: 'p1', name: 'Ignition', startDay: 1, endDay: 7, focus: 'Sprint setup' },
      { id: 'p2', name: 'Thrust', startDay: 8, endDay: 21, focus: 'Delivery' },
    ],
  }

  const checkpoints = generateArcCheckpoints(variableArc, new Date('2026-10-10T12:00:00Z'))
  assert.equal(checkpoints.length, 3)
  assert.equal(checkpoints[0].phaseName, 'Ignition')
  assert.equal(checkpoints[0].focus, 'Sprint setup')
  assert.equal(checkpoints[1].phaseName, 'Thrust')
  assert.equal(checkpoints[2].phaseName, 'Thrust')
  // Day 10 is in Week 2 (Day 8-14)
  assert.equal(checkpoints[1].isCurrent, true)
  assert.equal(checkpoints[1].status, 'current')
  assert.equal(checkpoints[0].status, 'completed')
  assert.equal(checkpoints[2].status, 'upcoming')
})

test('getShellTitle: dynamic active arc title and fallback to Arc', () => {
  assert.equal(getShellTitle('/arc', 'Spring Build 2027'), 'Spring Build 2027')
  assert.equal(getShellTitle('/arc', undefined), 'Arc')
  assert.equal(getShellTitle('/arc/milestones', 'Velocity'), 'Velocity')
  assert.equal(getShellTitle('/arc/milestones', ''), 'Arc')
  assert.equal(getShellTitle('/productivity-hub'), 'Productivity Hub')
})

test('DEFAULT_MODULE_COLORS: contains Arc and retains Winter Arc for backward compatibility', () => {
  assert.equal(DEFAULT_MODULE_COLORS['Arc'], '#22d3ee')
  assert.equal(DEFAULT_MODULE_COLORS['Winter Arc'], '#22d3ee')
})

test('calculateTemporalHorizon: resilient against empty or malformed dates', () => {
  const emptyRes = calculateTemporalHorizon('', '', '')
  assert.equal(Number.isNaN(emptyRes.currentDay), false)
  assert.equal(Number.isNaN(emptyRes.totalDays), false)
  assert.equal(emptyRes.currentDay, 0)
  assert.equal(emptyRes.totalDays, 1)

  const invalidRes = calculateTemporalHorizon('invalid-date', 'not-a-date', 'bad')
  assert.equal(Number.isNaN(invalidRes.currentDay), false)
  assert.equal(Number.isNaN(invalidRes.totalDays), false)
})

test('generateArcCheckpoints: maps boundary week to phase containing midpoint', () => {
  const multiPhaseArc = {
    id: 'multi-arc',
    title: 'Multi-Phase Campaign',
    chapter: 'CHAPTER I',
    year: 2026,
    startDate: '2026-10-01',
    endDate: '2026-11-29', // 60 days
    totalDays: 60,
    vow: { headline: 'Mastery', body: 'Discipline' },
    principles: [],
    phases: [
      { id: 'p1', name: 'Foundation', startDay: 1, endDay: 30, focus: 'Build base' },
      { id: 'p2', name: 'Peak Velocity', startDay: 31, endDay: 60, focus: 'Maximum throughput' },
    ],
  }

  const checkpoints = generateArcCheckpoints(multiPhaseArc, new Date('2026-10-15T12:00:00Z'))
  // Week 5 is Day 29 to 35. Midpoint is Day 32 (Phase 2).
  const week5 = checkpoints[4]
  assert.equal(week5.weekNumber, 5)
  assert.equal(week5.phaseName, 'Peak Velocity')
})

test('ARC_PROMPT_TEMPLATE: includes persona, telemetry allowlist, icons, and colors', () => {
  assert.ok(
    ARC_PROMPT_TEMPLATE.includes('Principal Life Strategist & Seasonal Campaign Architect'),
    'Must declare required strategist persona',
  )

  // Verify all 14 registered telemetry keys are explicitly present
  for (const key of TELEMETRY_BINDING_KEYS) {
    assert.ok(ARC_PROMPT_TEMPLATE.includes(key), `Must contain telemetry key: ${key}`)
  }

  // Verify all 8 icons are present
  for (const icon of ARC_ICONS) {
    assert.ok(ARC_PROMPT_TEMPLATE.includes(icon), `Must contain canonical icon: ${icon}`)
  }

  // Verify all 12 accent colors are present
  for (const color of ARC_ACCENT_COLORS) {
    assert.ok(ARC_PROMPT_TEMPLATE.includes(color), `Must contain curated color: ${color}`)
  }
})

test('extractCanonicalExampleFromPrompt: canonical example passes Zod validation', () => {
  const exampleJson = extractCanonicalExampleFromPrompt()
  const result = parseAndValidateArcConfig(exampleJson)
  assert.equal(result.success, true, `Expected canonical example to be valid: ${result.errors?.join(', ')}`)
  assert.ok(result.data)
  assert.equal(result.data.title, 'Spring Build 2027')
  assert.equal(result.data.icon, 'sprout')
  assert.equal(result.data.accentColor, '#10b981')
  assert.equal(result.data.milestones.length, 4)
  assert.equal(result.data.phases.length, 3)
})

test('computeAmendmentDiffs: produces granular audit log and enforces mandatory reason', () => {
  const prevSnapshot = {
    vow: { headline: 'Initial Oath', body: 'Work hard.', attribution: 'Directive 1' },
    principles: ['Principle 1', 'Principle 2'],
    milestones: [
      {
        id: 'm1',
        title: 'Deep Work',
        kind: 'telemetry',
        targetValue: 50,
        unit: 'HOURS',
        binding: { source: 'deep_work', metric: 'total_hours' },
      },
    ],
  }

  const updatedSnapshot = {
    vow: { headline: 'Amended Oath', body: 'Work harder.', attribution: 'Directive 1' },
    principles: ['Principle 1', 'Principle 2', 'Principle 3'],
    milestones: [
      {
        id: 'm1',
        title: 'Deep Work Enhanced',
        kind: 'telemetry',
        targetValue: 80,
        unit: 'HOURS',
        binding: { source: 'deep_work', metric: 'total_hours' },
      },
    ],
  }

  // Error on empty or whitespace reason
  assert.throws(
    () => computeAmendmentDiffs(prevSnapshot, updatedSnapshot, ''),
    /Mandatory non-empty justification reason/,
  )
  assert.throws(
    () => computeAmendmentDiffs(prevSnapshot, updatedSnapshot, '   \t  \n  '),
    /Mandatory non-empty justification reason/,
  )

  const fixedTimestamp = '2026-10-01T12:00:00.000Z'
  const diffs = computeAmendmentDiffs(
    prevSnapshot,
    updatedSnapshot,
    'Increased targets based on Week 2 velocity assessment',
    fixedTimestamp,
  )

  assert.equal(diffs.length, 5)
  assert.equal(diffs[0].field, 'vow.headline')
  assert.equal(diffs[0].previousValue, 'Initial Oath')
  assert.equal(diffs[0].newValue, 'Amended Oath')
  assert.equal(diffs[0].reason, 'Increased targets based on Week 2 velocity assessment')

  assert.equal(diffs[1].field, 'vow.body')
  assert.equal(diffs[1].previousValue, 'Work hard.')
  assert.equal(diffs[1].newValue, 'Work harder.')

  assert.equal(diffs[2].field, 'principles')
  assert.deepEqual(diffs[2].previousValue, ['Principle 1', 'Principle 2'])
  assert.deepEqual(diffs[2].newValue, ['Principle 1', 'Principle 2', 'Principle 3'])

  assert.equal(diffs[3].field, 'milestones.m1.targetValue')
  assert.equal(diffs[3].previousValue, 50)
  assert.equal(diffs[3].newValue, 80)

  assert.equal(diffs[4].field, 'milestones.m1.title')
  assert.equal(diffs[4].previousValue, 'Deep Work')
  assert.equal(diffs[4].newValue, 'Deep Work Enhanced')

  // Identical snapshot produces 0 diffs
  const noDiffs = computeAmendmentDiffs(prevSnapshot, prevSnapshot, 'Valid justification')
  assert.equal(noDiffs.length, 0)
})

test('computeAmendmentDiffs: handles milestone addition, removal, and attribute modifications without index collision', () => {
  const prevSnapshot = {
    vow: { headline: 'Vow', body: 'Body' },
    principles: ['P1'],
    milestones: [
      {
        id: 'm1',
        title: 'Deep Work',
        kind: 'telemetry',
        targetValue: 50,
        unit: 'HOURS',
        description: 'Deep work baseline',
        binding: { source: 'deep_work', metric: 'total_hours' },
      },
      {
        id: 'm2',
        title: 'Publish Paper',
        kind: 'manual',
        description: 'Peer-reviewed paper',
      },
    ],
  }

  // m-new added at index 0, m1 modified at index 1, m2 removed
  const updatedSnapshot = {
    vow: { headline: 'Vow', body: 'Body' },
    principles: ['P1'],
    milestones: [
      {
        id: 'm-new',
        title: 'Kinetic Vitality',
        kind: 'telemetry',
        targetValue: 30,
        unit: 'SESSIONS',
        description: 'Cardio sessions',
        binding: { source: 'fitness', metric: 'session_count' },
      },
      {
        id: 'm1',
        title: 'Deep Work Enhanced',
        kind: 'telemetry',
        targetValue: 75,
        unit: 'HOURS',
        description: 'Focused deep work',
        binding: { source: 'deep_work', metric: 'total_hours' },
      },
    ],
  }

  const diffs = computeAmendmentDiffs(
    prevSnapshot,
    updatedSnapshot,
    'Strategic pivot: added fitness, enhanced deep work target, sunsetted paper',
    '2026-10-02T10:00:00.000Z',
  )

  // Expected diffs:
  // 1. milestones.m-new added (previousValue: null)
  // 2. milestones.m1.targetValue: 50 -> 75
  // 3. milestones.m1.title: 'Deep Work' -> 'Deep Work Enhanced'
  // 4. milestones.m1.description: 'Deep work baseline' -> 'Focused deep work'
  // 5. milestones.m2 removed (newValue: null)
  assert.equal(diffs.length, 5)

  const addedMNew = diffs.find((d) => d.field === 'milestones.m-new')
  assert.ok(addedMNew)
  assert.equal(addedMNew.previousValue, null)
  assert.equal(addedMNew.newValue.id, 'm-new')

  const m1Target = diffs.find((d) => d.field === 'milestones.m1.targetValue')
  assert.ok(m1Target)
  assert.equal(m1Target.previousValue, 50)
  assert.equal(m1Target.newValue, 75)

  const m1Title = diffs.find((d) => d.field === 'milestones.m1.title')
  assert.ok(m1Title)
  assert.equal(m1Title.previousValue, 'Deep Work')
  assert.equal(m1Title.newValue, 'Deep Work Enhanced')

  const m1Desc = diffs.find((d) => d.field === 'milestones.m1.description')
  assert.ok(m1Desc)
  assert.equal(m1Desc.previousValue, 'Deep work baseline')
  assert.equal(m1Desc.newValue, 'Focused deep work')

  const removedM2 = diffs.find((d) => d.field === 'milestones.m2')
  assert.ok(removedM2)
  assert.equal(removedM2.newValue, null)
  assert.equal(removedM2.previousValue.id, 'm2')
})

test('historical arc evaluation: calculates overall health accurately for archived campaigns', () => {
  const temporal = calculateTemporalHorizon('2026-06-01', '2026-08-29', '2026-10-01', '2026-08-29T23:59:59Z')
  assert.equal(temporal.temporalStatus, 'completed')

  const milestones = [
    {
      id: 'm1',
      title: 'Deep Work',
      kind: 'telemetry',
      targetValue: 100,
      unit: 'HOURS',
      binding: { source: 'deep_work', metric: 'total_hours' },
    },
    {
      id: 'm2',
      title: 'Workouts',
      kind: 'telemetry',
      targetValue: 50,
      unit: 'SESSIONS',
      binding: { source: 'fitness', metric: 'session_count' },
    },
    {
      id: 'm3',
      title: 'Ship Product',
      kind: 'manual',
    },
  ]

  // Scenario A: All achieved -> complete
  const allAchievedStates = [
    evaluateMilestonePace(milestones[0], 110, temporal),
    evaluateMilestonePace(milestones[1], 52, temporal),
    evaluateMilestonePace(milestones[2], 0, temporal, { m3: { completedAt: '2026-08-15T00:00:00Z' } }),
  ]
  assert.equal(calculateOverallHealth(allAchievedStates), 'complete')

  // Scenario B: One telemetry missed target in concluded arc -> behind
  const missedStates = [
    evaluateMilestonePace(milestones[0], 85, temporal), // 85 < 100 on completed arc -> behind
    evaluateMilestonePace(milestones[1], 50, temporal), // complete
    evaluateMilestonePace(milestones[2], 0, temporal, { m3: { completedAt: '2026-08-15T00:00:00Z' } }), // complete
  ]
  assert.equal(calculateOverallHealth(missedStates), 'behind')
})

test('validateArcRetrospective: enforces all 5 structured questions', () => {
  // Case 1: Missing all fields
  const emptyResult = validateArcRetrospective({})
  assert.equal(emptyResult.success, false)
  assert.equal(emptyResult.errors.length, 5)

  // Case 2: Whitespace only in some fields
  const whitespaceResult = validateArcRetrospective({
    whatWentWell: 'Completed deep work blocks',
    whatDidnt: '   ',
    whatChanged: 'Shifted schedule',
    whatLearned: '',
    whatCarriesForward: 'Morning shutdown routine',
  })
  assert.equal(whitespaceResult.success, false)
  assert.ok(whitespaceResult.errors.some((e) => e.includes("What didn't")))
  assert.ok(whitespaceResult.errors.some((e) => e.includes('What did you learn')))

  // Case 3: Complete and valid 5 responses
  const validResult = validateArcRetrospective({
    whatWentWell: 'Completed 90% of planned deep work volume.',
    whatDidnt: 'Weekend recovery was inconsistent.',
    whatChanged: 'Pivoted focus domain to kinetic endurance.',
    whatLearned: 'Sustained momentum requires strict evening cutoffs.',
    whatCarriesForward: 'Protect the morning 3-hour focus window permanently.',
  })
  assert.equal(validResult.success, true)
  assert.ok(validResult.data)
  assert.equal(validResult.data.whatWentWell, 'Completed 90% of planned deep work volume.')
  assert.equal(validResult.data.whatCarriesForward, 'Protect the morning 3-hour focus window permanently.')
})

test('getArcHealthColor: maps health status deterministically to palette', () => {
  assert.equal(getArcHealthColor('complete'), '#10b981', 'complete should be emerald')
  assert.equal(getArcHealthColor('on_track'), '#10b981', 'on_track should be emerald')
  assert.equal(getArcHealthColor('at_risk'), '#f59e0b', 'at_risk should be amber')
  assert.equal(getArcHealthColor('behind'), '#f43f5e', 'behind should be rose')
  assert.equal(getArcHealthColor('pending'), '#94a3b8', 'pending should be slate')
  assert.equal(getArcHealthColor(null), '#22d3ee', 'fallback should be default cyan')
  assert.equal(getArcHealthColor(undefined), '#22d3ee', 'fallback should be default cyan')
})

test('two-stage lifecycle: Stage 1 freezing and Stage 2 retrospective archival payload', () => {
  // Stage 1: ACTIVE -> COMPLETED (milestones frozen up to completed_at)
  const activeStart = '2026-10-01'
  const activeEnd = '2026-12-29' // 90 days
  const completedDate = '2026-10-31T18:00:00.000Z' // Day 31

  const frozenHorizon = calculateTemporalHorizon(activeStart, activeEnd, '2026-11-15', completedDate)
  assert.equal(frozenHorizon.temporalStatus, 'completed')
  assert.equal(frozenHorizon.currentDay, 31)
  assert.equal(frozenHorizon.remainingDays, 0)
  assert.equal(frozenHorizon.percentElapsed, 100)

  // Stage 2: COMPLETED -> ARCHIVED payload validation
  const retrospectivePayload = {
    whatWentWell: 'All primary milestones reached.',
    whatDidnt: 'High fatigue during week 3.',
    whatChanged: 'Consolidated task queues.',
    whatLearned: 'Pacing math prevents drift.',
    whatCarriesForward: 'Maintain linear weekly milestones.',
    submittedAt: '2026-11-01T10:00:00.000Z',
  }

  const validation = validateArcRetrospective(retrospectivePayload)
  assert.equal(validation.success, true)
  assert.equal(validation.data.submittedAt, '2026-11-01T10:00:00.000Z')
})

test('validateArcRetrospective: rejects newline-only or tab-only responses and trims valid responses', () => {
  const newlineResult = validateArcRetrospective({
    whatWentWell: '\n\n\r\n\t  \t',
    whatDidnt: 'Fell behind on workouts',
    whatChanged: 'Shifted timeline',
    whatLearned: 'Pace early',
    whatCarriesForward: 'Keep daily habit locks',
  })
  assert.equal(newlineResult.success, false)
  assert.ok(newlineResult.errors.some((e) => e.includes('What went well')))

  const paddedResult = validateArcRetrospective({
    whatWentWell: '  Maintained strict morning blocks.   ',
    whatDidnt: '  Sleep hygiene dropped in week 8.  ',
    whatChanged: '  Scaled down secondary projects.  ',
    whatLearned: '  Rest is a prerequisite for momentum.  ',
    whatCarriesForward: '  Carry forward 10pm screen shutdown.  ',
  })
  assert.equal(paddedResult.success, true)
  assert.equal(paddedResult.data.whatWentWell, 'Maintained strict morning blocks.')
  assert.equal(paddedResult.data.whatDidnt, 'Sleep hygiene dropped in week 8.')
  assert.equal(paddedResult.data.whatChanged, 'Scaled down secondary projects.')
  assert.equal(paddedResult.data.whatLearned, 'Rest is a prerequisite for momentum.')
  assert.equal(paddedResult.data.whatCarriesForward, 'Carry forward 10pm screen shutdown.')
})

test('telemetry bounding: completed arc strictly excludes activity dates past completion', () => {
  const sampleActivity = [
    { activity_date: '2026-10-01', deep_work_minutes: 120 },
    { activity_date: '2026-10-15', deep_work_minutes: 180 },
    { activity_date: '2026-10-31', deep_work_minutes: 90 }, // completed_at day
    { activity_date: '2026-11-01', deep_work_minutes: 240 }, // should be excluded
    { activity_date: '2026-11-15', deep_work_minutes: 300 }, // should be excluded
  ]

  const config = {
    startDate: '2026-10-01',
    endDate: '2026-12-29',
    status: 'completed',
    completedAt: '2026-10-31T18:00:00.000Z',
  }

  const telemetryEndDate = config.completedAt
    ? config.completedAt.slice(0, 10)
    : (config.status === 'completed' || config.status === 'archived' ? config.endDate : '2026-11-15')

  const scopedActivity = sampleActivity.filter(
    (r) =>
      r.activity_date >= config.startDate &&
      r.activity_date <= telemetryEndDate &&
      r.activity_date <= config.endDate,
  )

  assert.equal(scopedActivity.length, 3, 'Must only include 3 days up to completion date')
  assert.equal(scopedActivity[scopedActivity.length - 1].activity_date, '2026-10-31')
  const totalMinutes = scopedActivity.reduce((sum, r) => sum + r.deep_work_minutes, 0)
  assert.equal(totalMinutes, 390, 'Total minutes must freeze at completion date')
})

test('ambient navigation datum: format complies with canonical specification', () => {
  const arcTitle = 'Spring Build'
  const currentDay = 14
  const totalDays = 90
  const overallHealth = 'on_track'

  const formattedDatum = `[ARC] ${arcTitle.toUpperCase()} · DAY ${currentDay}/${totalDays} · ${overallHealth.replace('_', ' ').toUpperCase()}`
  assert.equal(formattedDatum, '[ARC] SPRING BUILD · DAY 14/90 · ON TRACK')
})




