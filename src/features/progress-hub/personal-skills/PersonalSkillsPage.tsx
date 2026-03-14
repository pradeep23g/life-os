import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  useAddPersonalSkillProject,
  useCreatePersonalSkill,
  useIncreasePersonalSkillProgress,
  useLevelUpPersonalSkill,
  usePersonalSkills,
} from '../api/useProgress'
import type { PersonalSkillDomain, ProficiencyLevel } from '../api/useProgress'

const domains: PersonalSkillDomain[] = ['Academics', 'Productivity']
const proficiencyLevels: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced']

function PersonalSkillsPage() {
  const { data: personalSkills = [], isLoading, isError, error } = usePersonalSkills()
  const { mutate: createSkill, isPending: isCreating, error: createError } = useCreatePersonalSkill()
  const { mutate: levelUp, isPending: isLeveling, error: levelError } = useLevelUpPersonalSkill()
  const { mutate: addProject, isPending: isAddingProject, error: projectError } = useAddPersonalSkillProject()
  const { mutate: addProgress, isPending: isAddingProgress, error: progressError } = useIncreasePersonalSkillProgress()

  const [skillName, setSkillName] = useState('')
  const [domain, setDomain] = useState<PersonalSkillDomain>('Academics')
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('Beginner')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = skillName.trim()

    if (!trimmed) {
      return
    }

    createSkill(
      {
        skillName: trimmed,
        domain,
        proficiencyLevel,
      },
      {
        onSuccess: () => {
          setSkillName('')
          setDomain('Academics')
          setProficiencyLevel('Beginner')
        },
      },
    )
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-[#f1f5f9]">Personal Skills</h2>

        <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_170px_170px_140px]">
          <input
            type="text"
            value={skillName}
            onChange={(event) => setSkillName(event.target.value)}
            placeholder="Skill name"
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          />

          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value as PersonalSkillDomain)}
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          >
            {domains.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={proficiencyLevel}
            onChange={(event) => setProficiencyLevel(event.target.value as ProficiencyLevel)}
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          >
            {proficiencyLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isCreating || !skillName.trim()}
            className="rounded-md border border-[#222222] bg-black px-4 py-2 text-sm text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
          >
            {isCreating ? 'Adding...' : 'Add Skill'}
          </button>
        </form>

        {createError ? <p className="mt-3 text-sm text-red-400">{createError.message}</p> : null}
      </article>

      {isError ? <p className="text-sm text-red-400">{error.message}</p> : null}
      {levelError ? <p className="text-sm text-red-400">{levelError.message}</p> : null}
      {projectError ? <p className="text-sm text-red-400">{projectError.message}</p> : null}
      {progressError ? <p className="text-sm text-red-400">{progressError.message}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading ? <p className="text-sm text-[#a1a1aa]">Loading personal skills...</p> : null}

        {!isLoading && personalSkills.length === 0 ? (
          <p className="text-sm text-[#a1a1aa]">No personal skills added yet.</p>
        ) : null}

        {personalSkills.map((skill) => (
          <article key={skill.id} className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <p className="text-base font-semibold text-[#f1f5f9]">{skill.skill_name}</p>
            <p className="mt-1 text-sm text-[#a1a1aa]">Domain: {skill.domain}</p>
            <p className="text-sm text-[#a1a1aa]">Level: {skill.proficiency_level}</p>
            <p className="text-sm text-[#a1a1aa]">Projects: {skill.projects_completed}</p>
            <p className="text-sm text-[#a1a1aa]">Progress: {skill.progress_percent}%</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => levelUp({ id: skill.id, currentLevel: skill.proficiency_level })}
                disabled={isLeveling || skill.proficiency_level === 'Advanced'}
                className="rounded-md border border-[#222222] bg-black px-3 py-1 text-xs text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
              >
                Level Up Proficiency
              </button>

              <button
                type="button"
                onClick={() => addProject({ id: skill.id, currentProjects: skill.projects_completed })}
                disabled={isAddingProject}
                className="rounded-md border border-[#222222] bg-black px-3 py-1 text-xs text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
              >
                Add Project
              </button>

              <button
                type="button"
                onClick={() => addProgress({ id: skill.id, currentProgress: skill.progress_percent })}
                disabled={isAddingProgress || skill.progress_percent >= 100}
                className="rounded-md border border-[#222222] bg-black px-3 py-1 text-xs text-[#f1f5f9] hover:bg-[#111111] disabled:opacity-60"
              >
                Add Progress +10%
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default PersonalSkillsPage
