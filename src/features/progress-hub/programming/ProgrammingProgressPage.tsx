import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  useAddProgrammingProject,
  useCreateProgrammingSkill,
  useLevelUpProgrammingSkill,
  useProgrammingSkills,
} from '../api/useProgress'
import type { ProficiencyLevel } from '../api/useProgress'

const proficiencyLevels: ProficiencyLevel[] = ['Beginner', 'Intermediate', 'Advanced']

function ProgrammingProgressPage() {
  const { data: skills = [], isLoading, isError, error } = useProgrammingSkills()
  const { mutate: createSkill, isPending: isCreating, error: createError } = useCreateProgrammingSkill()
  const { mutate: levelUp, isPending: isLeveling, error: levelError } = useLevelUpProgrammingSkill()
  const { mutate: addProject, isPending: isAddingProject, error: projectError } = useAddProgrammingProject()

  const [languageOrTool, setLanguageOrTool] = useState('')
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('Beginner')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = languageOrTool.trim()

    if (!trimmed) {
      return
    }

    createSkill(
      {
        languageOrTool: trimmed,
        proficiencyLevel,
      },
      {
        onSuccess: () => {
          setLanguageOrTool('')
          setProficiencyLevel('Beginner')
        },
      },
    )
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-[#f1f5f9]">Programming Skills</h2>

        <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_140px]">
          <input
            type="text"
            value={languageOrTool}
            onChange={(event) => setLanguageOrTool(event.target.value)}
            placeholder="Language or tool"
            className="rounded-md border border-[#222222] bg-black p-2 text-[#f1f5f9]"
          />

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
            disabled={isCreating || !languageOrTool.trim()}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {isLoading ? <p className="text-sm text-[#a1a1aa]">Loading skills...</p> : null}

        {!isLoading && skills.length === 0 ? <p className="text-sm text-[#a1a1aa]">No skills logged yet.</p> : null}

        {skills.map((skill) => (
          <article key={skill.id} className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <p className="text-base font-semibold text-[#f1f5f9]">{skill.language_or_tool}</p>
            <p className="mt-1 text-sm text-[#a1a1aa]">Level: {skill.proficiency_level}</p>
            <p className="text-sm text-[#a1a1aa]">Projects: {skill.projects_completed}</p>

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
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ProgrammingProgressPage
