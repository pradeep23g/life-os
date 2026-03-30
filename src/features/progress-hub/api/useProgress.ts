import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'

export const progressSkillsQueryKey = ['progress-hub', 'skills'] as const
export const progressMilestonesQueryKey = ['progress-hub', 'milestones'] as const
export const progressChallengesQueryKey = ['progress-hub', 'challenges'] as const
export const progressPersonalSkillsQueryKey = ['progress-hub', 'personal-skills'] as const

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type ChallengeStatus = 'Active' | 'Completed' | 'Failed'
export type PersonalSkillDomain = 'Academics' | 'Productivity'

export type ProgrammingSkill = {
  id: string
  user_id: string
  language_or_tool: string
  proficiency_level: ProficiencyLevel
  projects_completed: number
  created_at: string
}

export type Milestone = {
  id: string
  user_id: string
  title: string
  target_date: string
  achieved_date: string | null
  is_completed: boolean
  created_at: string
}

export type Challenge = {
  id: string
  user_id: string
  title: string
  description: string
  status: ChallengeStatus
  created_at: string
}

export type PersonalSkill = {
  id: string
  user_id: string
  skill_name: string
  domain: PersonalSkillDomain
  proficiency_level: ProficiencyLevel
  projects_completed: number
  progress_percent: number
  created_at: string
}

type CreateProgrammingSkillInput = {
  languageOrTool: string
  proficiencyLevel: ProficiencyLevel
}

type UpdateSkillLevelInput = {
  id: string
  currentLevel: ProficiencyLevel
}

type AddProjectInput = {
  id: string
  currentProjects: number
}

type CreateMilestoneInput = {
  title: string
  targetDate: string
}

type ToggleMilestoneInput = {
  id: string
  isCompleted: boolean
}

type CreateChallengeInput = {
  title: string
  description: string
}

type UpdateChallengeStatusInput = {
  id: string
  status: ChallengeStatus
}

type CreatePersonalSkillInput = {
  skillName: string
  domain: PersonalSkillDomain
  proficiencyLevel: ProficiencyLevel
}

type IncreaseProgressInput = {
  id: string
  currentProgress: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  return 'Unknown error'
}

function getNextLevel(level: ProficiencyLevel): ProficiencyLevel {
  if (level === 'Beginner') {
    return 'Intermediate'
  }

  if (level === 'Intermediate') {
    return 'Advanced'
  }

  return 'Advanced'
}

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('[useProgress] failed to fetch auth user', error)
    throw new Error(`Auth check failed: ${getErrorMessage(error)}`)
  }

  if (!user) {
    throw new Error('User is not authenticated.')
  }

  return user.id
}

async function fetchProgrammingSkills(): Promise<ProgrammingSkill[]> {
  const { data, error } = await supabase
    .from('programming_skills')
    .select('id, user_id, language_or_tool, proficiency_level, projects_completed, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useProgress] failed to fetch programming skills', error)
    throw new Error(`Failed to fetch programming skills: ${getErrorMessage(error)}`)
  }

  return data ?? []
}

async function createProgrammingSkill({ languageOrTool, proficiencyLevel }: CreateProgrammingSkillInput): Promise<void> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('programming_skills')
    .insert({
      user_id: userId,
      language_or_tool: languageOrTool,
      proficiency_level: proficiencyLevel,
      projects_completed: 0,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[useProgress] failed to create programming skill', error)
    throw new Error(`Failed to create programming skill: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'programming_skill',
    entityId: data.id,
    eventType: 'programming_skill_created',
    payload: {
      proficiencyLevel,
    },
  })
}

async function levelUpProgrammingSkill({ id, currentLevel }: UpdateSkillLevelInput): Promise<void> {
  const userId = await requireUserId()
  const nextLevel = getNextLevel(currentLevel)

  if (currentLevel === nextLevel) {
    return
  }

  const { error } = await supabase
    .from('programming_skills')
    .update({ proficiency_level: nextLevel })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[useProgress] failed to level up programming skill', error)
    throw new Error(`Failed to update programming level: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'programming_skill',
    entityId: id,
    eventType: 'programming_skill_level_up',
    payload: {
      from: currentLevel,
      to: nextLevel,
    },
  })
}

async function addProgrammingProject({ id, currentProjects }: AddProjectInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('programming_skills')
    .update({ projects_completed: currentProjects + 1 })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[useProgress] failed to update programming projects', error)
    throw new Error(`Failed to update project count: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'programming_skill',
    entityId: id,
    eventType: 'programming_project_count_incremented',
    payload: {
      nextProjectsCompleted: currentProjects + 1,
    },
  })
}

async function fetchMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('id, user_id, title, target_date, achieved_date, is_completed, created_at')
    .order('target_date', { ascending: true })

  if (error) {
    console.error('[useProgress] failed to fetch milestones', error)
    throw new Error(`Failed to fetch milestones: ${getErrorMessage(error)}`)
  }

  return data ?? []
}

async function createMilestone({ title, targetDate }: CreateMilestoneInput): Promise<void> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('milestones')
    .insert({
      user_id: userId,
      title,
      target_date: targetDate,
      is_completed: false,
      achieved_date: null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[useProgress] failed to create milestone', error)
    throw new Error(`Failed to create milestone: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'milestone',
    entityId: data.id,
    eventType: 'milestone_created',
  })
}

async function toggleMilestoneCompletion({ id, isCompleted }: ToggleMilestoneInput): Promise<void> {
  const userId = await requireUserId()

  const updatePayload = isCompleted
    ? {
        is_completed: false,
        achieved_date: null,
      }
    : {
        is_completed: true,
        achieved_date: new Date().toISOString().slice(0, 10),
      }

  const { error } = await supabase
    .from('milestones')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[useProgress] failed to toggle milestone', error)
    throw new Error(`Failed to update milestone: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'milestone',
    entityId: id,
    eventType: isCompleted ? 'milestone_reopened' : 'milestone_completed',
  })
}

async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, user_id, title, description, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useProgress] failed to fetch challenges', error)
    throw new Error(`Failed to fetch challenges: ${getErrorMessage(error)}`)
  }

  return data ?? []
}

async function createChallenge({ title, description }: CreateChallengeInput): Promise<void> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      user_id: userId,
      title,
      description,
      status: 'Active',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[useProgress] failed to create challenge', error)
    throw new Error(`Failed to create challenge: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'challenge',
    entityId: data.id,
    eventType: 'challenge_created',
  })
}

async function updateChallengeStatus({ id, status }: UpdateChallengeStatusInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('challenges')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[useProgress] failed to update challenge status', error)
    throw new Error(`Failed to update challenge: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'challenge',
    entityId: id,
    eventType: 'challenge_status_updated',
    payload: {
      status,
    },
  })
}

async function fetchPersonalSkills(): Promise<PersonalSkill[]> {
  const { data, error } = await supabase
    .from('personal_skills')
    .select('id, user_id, skill_name, domain, proficiency_level, projects_completed, progress_percent, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useProgress] failed to fetch personal skills', error)
    throw new Error(`Failed to fetch personal skills: ${getErrorMessage(error)}`)
  }

  return data ?? []
}

async function createPersonalSkill({
  skillName,
  domain,
  proficiencyLevel,
}: CreatePersonalSkillInput): Promise<void> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('personal_skills')
    .insert({
      user_id: userId,
      skill_name: skillName,
      domain,
      proficiency_level: proficiencyLevel,
      projects_completed: 0,
      progress_percent: 0,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[useProgress] failed to create personal skill', error)
    throw new Error(`Failed to create personal skill: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'personal_skill',
    entityId: data.id,
    eventType: 'personal_skill_created',
    payload: {
      domain,
      proficiencyLevel,
    },
  })
}

async function levelUpPersonalSkill({ id, currentLevel }: UpdateSkillLevelInput): Promise<void> {
  const userId = await requireUserId()
  const nextLevel = getNextLevel(currentLevel)

  if (currentLevel === nextLevel) {
    return
  }

  const { error } = await supabase
    .from('personal_skills')
    .update({ proficiency_level: nextLevel })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[useProgress] failed to level up personal skill', error)
    throw new Error(`Failed to update personal skill level: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'personal_skill',
    entityId: id,
    eventType: 'personal_skill_level_up',
    payload: {
      from: currentLevel,
      to: nextLevel,
    },
  })
}

async function addPersonalSkillProject({ id, currentProjects }: AddProjectInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('personal_skills')
    .update({ projects_completed: currentProjects + 1 })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[useProgress] failed to update personal projects', error)
    throw new Error(`Failed to update personal project count: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'personal_skill',
    entityId: id,
    eventType: 'personal_skill_project_count_incremented',
    payload: {
      nextProjectsCompleted: currentProjects + 1,
    },
  })
}

async function increasePersonalSkillProgress({ id, currentProgress }: IncreaseProgressInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('personal_skills')
    .update({ progress_percent: Math.min(100, currentProgress + 10) })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[useProgress] failed to increase personal progress', error)
    throw new Error(`Failed to update personal progress: ${getErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'progress-hub',
    entityType: 'personal_skill',
    entityId: id,
    eventType: 'personal_skill_progress_incremented',
    payload: {
      nextProgressPercent: Math.min(100, currentProgress + 10),
    },
  })
}

export function useProgrammingSkills() {
  return useQuery({
    queryKey: progressSkillsQueryKey,
    queryFn: fetchProgrammingSkills,
  })
}

export function useCreateProgrammingSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProgrammingSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressSkillsQueryKey })
    },
  })
}

export function useLevelUpProgrammingSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: levelUpProgrammingSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressSkillsQueryKey })
    },
  })
}

export function useAddProgrammingProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addProgrammingProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressSkillsQueryKey })
    },
  })
}

export function useMilestones() {
  return useQuery({
    queryKey: progressMilestonesQueryKey,
    queryFn: fetchMilestones,
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressMilestonesQueryKey })
    },
  })
}

export function useToggleMilestoneCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleMilestoneCompletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressMilestonesQueryKey })
    },
  })
}

export function useChallenges() {
  return useQuery({
    queryKey: progressChallengesQueryKey,
    queryFn: fetchChallenges,
  })
}

export function useCreateChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressChallengesQueryKey })
    },
  })
}

export function useUpdateChallengeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateChallengeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressChallengesQueryKey })
    },
  })
}

export function usePersonalSkills() {
  return useQuery({
    queryKey: progressPersonalSkillsQueryKey,
    queryFn: fetchPersonalSkills,
  })
}

export function useCreatePersonalSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPersonalSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressPersonalSkillsQueryKey })
    },
  })
}

export function useLevelUpPersonalSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: levelUpPersonalSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressPersonalSkillsQueryKey })
    },
  })
}

export function useAddPersonalSkillProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addPersonalSkillProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressPersonalSkillsQueryKey })
    },
  })
}

export function useIncreasePersonalSkillProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: increasePersonalSkillProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressPersonalSkillsQueryKey })
    },
  })
}
