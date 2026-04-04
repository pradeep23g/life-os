type DailyBriefingProps = {
  momentum: number
}

type BriefingTone = {
  heading: string
  message: string
}

function getBriefingTone(momentum: number): BriefingTone {
  if (momentum > 70) {
    return {
      heading: "You're in control. Finish strong.",
      message: 'Momentum is high. Close one more key action to lock the win.',
    }
  }

  if (momentum > 40) {
    return {
      heading: "You're stabilizing. Keep pushing.",
      message: 'Execution is improving. Clear your next target now.',
    }
  }

  return {
    heading: 'Execution is slipping. Reset now.',
    message: 'Take the next right move immediately to recover momentum.',
  }
}

function DailyBriefing({ momentum }: DailyBriefingProps) {
  const tone = getBriefingTone(momentum)

  return (
    <section className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Daily Briefing</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{tone.heading}</p>
      <p className="mt-1 text-sm text-slate-300">{tone.message}</p>
    </section>
  )
}

export default DailyBriefing
