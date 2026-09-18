export interface AnatomyWireframeProps {
  muscle?: string | null
  pattern?: string | null
  className?: string
  width?: number
  height?: number
}

/**
 * Cybernetic Wireframe Anatomy SVG
 * Highlights target muscle groups in aggressive industrial red.
 */
export function AnatomyWireframe({
  muscle = 'compound',
  pattern = '',
  className = '',
  width = 54,
  height = 70,
}: AnatomyWireframeProps) {
  const m = (muscle || '').toLowerCase()
  const p = (pattern || '').toLowerCase()

  const isChest = m.includes('chest') || m.includes('pec') || p.includes('push')
  const isBack = m.includes('back') || m.includes('lat') || m.includes('trap') || p.includes('pull')
  const isShoulders = m.includes('shoulder') || m.includes('delt')
  const isArms = m.includes('arm') || m.includes('bicep') || m.includes('tricep')
  const isLegs = m.includes('leg') || m.includes('quad') || m.includes('hamstring') || m.includes('calf') || m.includes('glute') || p.includes('squat') || p.includes('hinge')
  const isCore = m.includes('core') || m.includes('abs') || m.includes('oblique')

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 125"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      role="img"
      aria-label={`Target: ${muscle || 'Compound'}`}
    >
      {/* Head */}
      <circle cx="50" cy="18" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-threat-critical/40" />
      <circle cx="50" cy="18" r="3.5" fill="currentColor" className="text-threat-critical/20" />

      {/* Neck */}
      <path d="M47 26V32M53 26V32" stroke="currentColor" strokeWidth="1" className="text-threat-critical/40" />

      {/* Shoulders / Deltoids */}
      <path
        d="M32 36L44 33M68 36L56 33"
        stroke="currentColor"
        strokeWidth="1.2"
        className={isShoulders ? 'text-threat-critical stroke-2' : 'text-threat-critical/40'}
      />
      <circle
        cx="30"
        cy="38"
        r="4"
        fill={isShoulders ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.2"
        className={isShoulders ? 'text-threat-critical' : 'text-threat-critical/30'}
      />
      <circle
        cx="70"
        cy="38"
        r="4"
        fill={isShoulders ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.2"
        className={isShoulders ? 'text-threat-critical' : 'text-threat-critical/30'}
      />

      {/* Torso & Chest / Pectorals */}
      <path
        d="M44 33H56L62 48L57 66H43L38 48L44 33Z"
        stroke="currentColor"
        strokeWidth="1"
        className="text-threat-critical/40"
      />
      {/* Chest Plates */}
      <path
        d="M42 37C45 39 49 39 49 46C44 46 41 43 40 40Z"
        fill={isChest ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1"
        className={isChest ? 'text-threat-critical' : 'text-threat-critical/20'}
      />
      <path
        d="M58 37C55 39 51 39 51 46C56 46 59 43 60 40Z"
        fill={isChest ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1"
        className={isChest ? 'text-threat-critical' : 'text-threat-critical/20'}
      />

      {/* Back / Lats */}
      {isBack && (
        <>
          <path d="M38 43L34 54L42 58" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" className="text-threat-critical animate-pulse" />
          <path d="M62 43L66 54L58 58" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" className="text-threat-critical animate-pulse" />
        </>
      )}

      {/* Core / Abs */}
      <rect
        x="46"
        y="50"
        width="8"
        height="12"
        fill={isCore ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="0.8"
        className={isCore ? 'text-threat-critical' : 'text-threat-critical/20'}
      />

      {/* Arms (Biceps / Forearms) */}
      <path
        d="M28 42L22 56L18 72"
        stroke="currentColor"
        strokeWidth={isArms ? '2.5' : '1.2'}
        strokeLinecap="round"
        className={isArms ? 'text-threat-critical' : 'text-threat-critical/40'}
      />
      <path
        d="M72 42L78 56L82 72"
        stroke="currentColor"
        strokeWidth={isArms ? '2.5' : '1.2'}
        strokeLinecap="round"
        className={isArms ? 'text-threat-critical' : 'text-threat-critical/40'}
      />

      {/* Pelvis */}
      <path d="M43 66H57L54 74H46L43 66Z" stroke="currentColor" strokeWidth="1" className="text-threat-critical/40" />

      {/* Legs (Quads / Glutes / Calves) */}
      <path
        d="M45 74L42 94L39 116"
        stroke="currentColor"
        strokeWidth={isLegs ? '2.5' : '1.2'}
        strokeLinecap="round"
        className={isLegs ? 'text-threat-critical' : 'text-threat-critical/40'}
      />
      <path
        d="M55 74L58 94L61 116"
        stroke="currentColor"
        strokeWidth={isLegs ? '2.5' : '1.2'}
        strokeLinecap="round"
        className={isLegs ? 'text-threat-critical' : 'text-threat-critical/40'}
      />

      {/* Knees */}
      <circle cx="42" cy="94" r="2" fill="currentColor" className={isLegs ? 'text-threat-critical' : 'text-threat-critical/30'} />
      <circle cx="58" cy="94" r="2" fill="currentColor" className={isLegs ? 'text-threat-critical' : 'text-threat-critical/30'} />
    </svg>
  )
}

export default AnatomyWireframe