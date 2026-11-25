declare const __brand: unique symbol

/**
 * Nominal brand wrapper for entity identifiers.
 * Zero runtime overhead; prevents accidentally passing e.g. a TaskId where a HabitId is expected.
 */
export type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type UserId = Brand<string, 'UserId'>
export type HabitId = Brand<string, 'HabitId'>
export type HabitLogId = Brand<string, 'HabitLogId'>
export type HabitBreakId = Brand<string, 'HabitBreakId'>
export type JournalEntryId = Brand<string, 'JournalEntryId'>

export type TaskId = Brand<string, 'TaskId'>
export type GoalId = Brand<string, 'GoalId'>
export type WeeklyPlanId = Brand<string, 'WeeklyPlanId'>
export type WeeklyPlanItemId = Brand<string, 'WeeklyPlanItemId'>
export type WeeklyReviewId = Brand<string, 'WeeklyReviewId'>

export type RoadmapId = Brand<string, 'RoadmapId'>
export type StageId = Brand<string, 'StageId'>
export type SessionId = Brand<string, 'SessionId'>
export type SessionLogId = Brand<string, 'SessionLogId'>
export type MilestoneId = Brand<string, 'MilestoneId'>
export type ProjectId = Brand<string, 'ProjectId'>
export type ReflectionId = Brand<string, 'ReflectionId'>

export type WorkoutId = Brand<string, 'WorkoutId'>
export type ExerciseId = Brand<string, 'ExerciseId'>
export type ExerciseLogId = Brand<string, 'ExerciseLogId'>

export type TimeLogId = Brand<string, 'TimeLogId'>
export type TransactionId = Brand<string, 'TransactionId'>
export type SeasonId = Brand<string, 'SeasonId'>
export type EventId = Brand<string, 'EventId'>

/** Casts a raw database UUID string to a branded ID at the persistence boundary. */
export function brandId<T extends Brand<string, string>>(id: string): T {
  return id as T
}

export const asUserId = (id: string): UserId => id as UserId
export const asHabitId = (id: string): HabitId => id as HabitId
export const asHabitLogId = (id: string): HabitLogId => id as HabitLogId
export const asHabitBreakId = (id: string): HabitBreakId => id as HabitBreakId
export const asJournalEntryId = (id: string): JournalEntryId => id as JournalEntryId
export const asTaskId = (id: string): TaskId => id as TaskId
export const asGoalId = (id: string): GoalId => id as GoalId
export const asWeeklyPlanId = (id: string): WeeklyPlanId => id as WeeklyPlanId
export const asWeeklyPlanItemId = (id: string): WeeklyPlanItemId => id as WeeklyPlanItemId
export const asWeeklyReviewId = (id: string): WeeklyReviewId => id as WeeklyReviewId
export const asRoadmapId = (id: string): RoadmapId => id as RoadmapId
export const asStageId = (id: string): StageId => id as StageId
export const asSessionId = (id: string): SessionId => id as SessionId
export const asSessionLogId = (id: string): SessionLogId => id as SessionLogId
export const asMilestoneId = (id: string): MilestoneId => id as MilestoneId
export const asProjectId = (id: string): ProjectId => id as ProjectId
export const asReflectionId = (id: string): ReflectionId => id as ReflectionId
export const asWorkoutId = (id: string): WorkoutId => id as WorkoutId
export const asExerciseId = (id: string): ExerciseId => id as ExerciseId
export const asExerciseLogId = (id: string): ExerciseLogId => id as ExerciseLogId
export const asTimeLogId = (id: string): TimeLogId => id as TimeLogId
export const asTransactionId = (id: string): TransactionId => id as TransactionId
export const asSeasonId = (id: string): SeasonId => id as SeasonId
export const asEventId = (id: string): EventId => id as EventId
