import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User } from 'lucide-react'
import {
  HomeIcon, ProductivityIcon, TimeOsIcon, MindOsIcon,
  WinterArcIcon, FitnessIcon, LearningIcon, FinanceIcon,
  DataLabIcon, ReportsIcon, SystemIcon
} from '../components/icons/ModuleIcons'
import { ArcIcon } from '../features/arc/components/ArcIcon'
import { getArcHealthColor } from '../features/arc/constants'
import { useArcTelemetry } from '../features/arc/hooks/useArcTelemetry'
import type { ArcPaceStatus } from '../features/arc/types'
import { useAuth } from '../lib/AuthContext'
import { useModuleColors } from '../lib/useModuleColors'

export interface NavChildItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  colorKey: string
}

export interface NavOrbItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  colorKey: string
  path?: string
  fanout?: NavChildItem[]
  customColor?: string
  isArcNode?: boolean
  isArcActive?: boolean
  health?: ArcPaceStatus
}

const ORBIT_1: NavOrbItem[] = [
  {
    id: 'productivity-time',
    label: 'Productivity & Time',
    icon: ProductivityIcon,
    colorKey: 'Productivity',
    fanout: [
      { path: '/productivity-hub', label: 'Productivity Hub', icon: ProductivityIcon, colorKey: 'Productivity' },
      { path: '/time-os', label: 'Time OS', icon: TimeOsIcon, colorKey: 'Time OS' }
    ]
  },
  { id: 'mind-os', path: '/mind-os', label: 'Mind OS', icon: MindOsIcon, colorKey: 'Mind OS' },
  { id: 'winter-arc', path: '/arc', label: 'Winter Arc', icon: WinterArcIcon, colorKey: 'Winter Arc' },
  { id: 'fitness-os', path: '/fitness-os', label: 'Fitness OS', icon: FitnessIcon, colorKey: 'Fitness OS' }
]

const ORBIT_2: NavOrbItem[] = [
  { id: 'learning-os', path: '/learning-os', label: 'Learning OS', icon: LearningIcon, colorKey: 'Learning OS' },
  { id: 'finance-os', path: '/finance-os', label: 'Finance OS', icon: FinanceIcon, colorKey: 'Finance OS' },
  {
    id: 'data-reports',
    label: 'Data & Reports',
    icon: DataLabIcon,
    colorKey: 'Data Lab',
    fanout: [
      { path: '/data-lab', label: 'Data Lab', icon: DataLabIcon, colorKey: 'Data Lab' },
      { path: '/reports', label: 'Field Reports', icon: ReportsIcon, colorKey: 'Reports' }
    ]
  },
  { id: 'system', path: '/system', label: 'Mission Control', icon: SystemIcon, colorKey: 'Mission Control' },
  { id: 'profile', path: '/profile', label: 'Profile Dossier', icon: User, colorKey: 'Profile' }
]

export function AstrolabeOrbNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)
  const [hoveredColorKey, setHoveredColorKey] = useState<string | null>(null)
  const [hoveredCustomColor, setHoveredCustomColor] = useState<string | null>(null)
  const [activeFanout, setActiveFanout] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { colors } = useModuleColors()
  const { config: activeArcConfig, overallHealth: arcHealth } = useArcTelemetry()

  // Dynamic Orbit 1 items: Replaces static Winter Arc node with active Arc title, icon, accent color, and health glow
  const orbit1Items = useMemo(() => {
    return ORBIT_1.map((item) => {
      if (item.id === 'winter-arc') {
        const isArcActive = Boolean(
          activeArcConfig && (activeArcConfig.status === 'active' || activeArcConfig.status === 'completed')
        )
        const title = isArcActive && activeArcConfig ? activeArcConfig.title : 'Seasonal Arc'
        const iconName = isArcActive && activeArcConfig ? activeArcConfig.icon : 'snowflake'
        const customColor = isArcActive && activeArcConfig?.accentColor
          ? activeArcConfig.accentColor
          : '#94a3b8'

        return {
          ...item,
          label: title,
          icon: ({ className }: { className?: string }) => <ArcIcon name={iconName} className={className} />,
          colorKey: isArcActive ? 'Arc' : 'Profile',
          customColor,
          isArcNode: true,
          isArcActive,
          health: isArcActive ? arcHealth : undefined,
        }
      }
      return item
    })
  }, [activeArcConfig, arcHealth])

  // Track screen size for responsive radius
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveFanout(null)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close or collapse on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeFanout) {
          setActiveFanout(null)
        } else {
          setIsOpen(false)
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, activeFanout])

  const handleNavigate = (path: string) => {
    navigate(path)
    setIsOpen(false)
    setActiveFanout(null)
    setHoveredModule(null)
    setHoveredColorKey(null)
    setHoveredCustomColor(null)
  }

  // Trigonometry for radial layout (bottom-left corner expands to top-right -> 0 to 90 degrees)
  const calculatePosition = (index: number, total: number, radius: number) => {
    const angleDeg = total === 1 ? 45 : (index / (total - 1)) * 90
    const angleRad = (angleDeg * Math.PI) / 180
    const x = Math.round(Math.cos(angleRad) * radius)
    const y = Math.round(-Math.sin(angleRad) * radius)
    return { x, y, angleDeg, angleRad }
  }

  // Fanout satellite calculations relative to parent orb
  const calculateChildPosition = (
    parentAngleRad: number,
    parentRadius: number,
    childIndex: number,
    totalChildren: number
  ) => {
    const deltaR = isMobile ? 44 : 54
    let childAngleRad: number

    if (totalChildren === 1) {
      childAngleRad = parentAngleRad
    } else if (parentAngleRad <= 0.2) {
      // Near horizontal axis (0 deg) -> spread upward into quadrant
      childAngleRad = childIndex === 0 ? parentAngleRad + 0.12 : parentAngleRad + 0.36
    } else if (parentAngleRad >= 1.35) {
      // Near vertical axis (90 deg) -> spread rightward into quadrant
      childAngleRad = childIndex === 0 ? parentAngleRad - 0.36 : parentAngleRad - 0.12
    } else {
      // Mid-arc -> spread symmetrically
      const spread = 0.22
      childAngleRad = childIndex === 0 ? parentAngleRad - spread : parentAngleRad + spread
    }

    const childRadius = parentRadius + deltaR
    const x = Math.round(Math.cos(childAngleRad) * childRadius)
    const y = Math.round(-Math.sin(childAngleRad) * childRadius)
    return { x, y }
  }

  const radius1 = isMobile ? 95 : 125
  const radius2 = isMobile ? 165 : 210

  const handleOrbClick = (item: NavOrbItem) => {
    if (item.fanout) {
      setActiveFanout(prev => prev === item.id ? null : item.id)
    } else if (item.path) {
      handleNavigate(item.path)
    }
  }

  const floatClass = (index: number) => {
    const mod = (index % 4) + 1
    return `animate-orb-float-${mod}`
  }

  const hoveredColor = hoveredCustomColor || (hoveredColorKey ? colors[hoveredColorKey] : undefined)

  return (
    <>
      {/* Backdrop blur (First Bloom) */}
      <div 
        onClick={() => {
          if (activeFanout) {
            setActiveFanout(null)
          } else {
            setIsOpen(false)
          }
        }}
        className={`fixed inset-0 z-40 transition-all duration-500 md:duration-700
          ${isOpen ? 'bg-background/80 backdrop-blur-md opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        aria-hidden="true"
      />

      <div 
        ref={navRef}
        className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50 flex items-end justify-start"
      >
        {/* Orbital Items Container */}
        <div 
          className="absolute bottom-0 left-0 h-16 w-16" 
          aria-expanded={isOpen}
          role="menu"
        >
          {/* Rendering the 2 Concentric Orbits */}
          {[
            { items: orbit1Items, radius: radius1, delayBase: 0 },
            { items: ORBIT_2, radius: radius2, delayBase: orbit1Items.length * 35 }
          ].map((orbit, orbitIndex) => (
            <div key={`orbit-${orbitIndex}`}>
              {orbit.items.map((item, index) => {
                const { x, y, angleRad } = calculatePosition(index, orbit.items.length, orbit.radius)
                const globalIndex = orbitIndex * 4 + index

                const isItemActive = item.path 
                  ? (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))
                  : (item.fanout?.some(child => location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path))) ?? false)

                const moduleColor = item.customColor || colors[item.colorKey] || '#ffffff'
                const isHovered = hoveredModule === item.label
                const isParentFanoutActive = activeFanout === item.id
                // Secondary bloom sibling dimming: Dim if another fanout is active
                const isDimmed = activeFanout !== null && !isParentFanoutActive

                // Ambient health glow for active Arc node
                const healthColor = item.health ? getArcHealthColor(item.health) : undefined
                const hasHealthGlow = Boolean(item.isArcNode && item.isArcActive && healthColor)

                return (
                  <div key={item.id}>
                    {/* Primary Orbital Node */}
                    <button
                      onClick={() => handleOrbClick(item)}
                      onMouseEnter={() => {
                        setHoveredModule(item.label)
                        setHoveredColorKey(item.colorKey)
                        setHoveredCustomColor(item.customColor ?? null)
                      }}
                      onMouseLeave={() => {
                        setHoveredModule(null)
                        setHoveredColorKey(null)
                        setHoveredCustomColor(null)
                      }}
                      aria-label={item.label}
                      className={`absolute bottom-2 left-2 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all duration-500 ease-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary group
                        ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-0'}
                        ${isDimmed ? 'filter blur-[3px] opacity-25 pointer-events-none' : ''}
                      `}
                      style={{
                        transform: isOpen ? `translate3d(${x}px, ${y}px, 0)` : 'translate3d(0, 0, 0)',
                        transitionDelay: isOpen ? `${orbit.delayBase + (index * 35)}ms` : '0ms',
                        backgroundColor: isItemActive ? moduleColor : 'oklch(var(--bg-surface) / 0.9)',
                        borderColor: isItemActive || isHovered || isParentFanoutActive
                          ? moduleColor
                          : hasHealthGlow
                          ? healthColor
                          : 'oklch(var(--border-base))',
                        color: isItemActive
                          ? '#000'
                          : (isHovered || isParentFanoutActive
                            ? moduleColor
                            : hasHealthGlow
                            ? healthColor
                            : 'oklch(var(--text-secondary))'),
                        boxShadow: isItemActive || isHovered || isParentFanoutActive 
                          ? `0 0 20px ${moduleColor}70` 
                          : hasHealthGlow
                          ? `0 0 16px ${healthColor}60, 0 4px 12px rgba(0,0,0,0.2)`
                          : '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      {/* Organic Drift Wrapper */}
                      <div className={`flex h-full w-full items-center justify-center ${isOpen && !isDimmed ? floatClass(globalIndex) : ''}`}>
                        <item.icon className="h-5 w-5" />
                        {/* Ambient status indicator dot for active Arc */}
                        {item.isArcNode && item.isArcActive && healthColor && (
                          <span 
                            className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-surface shadow-sm animate-pulse"
                            style={{
                              backgroundColor: healthColor,
                              boxShadow: `0 0 8px ${healthColor}`
                            }}
                            title={`Arc Health: ${item.health?.replace('_', ' ').toUpperCase()}`}
                          />
                        )}
                        {/* Sub-module fanout indicator badge */}
                        {item.fanout && (
                          <span 
                            className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[8px] font-mono font-bold leading-none shadow-sm"
                            style={{
                              backgroundColor: isParentFanoutActive ? moduleColor : 'oklch(var(--bg-elevated))',
                              borderColor: moduleColor,
                              color: isParentFanoutActive ? '#000' : moduleColor
                            }}
                          >
                            +
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Secondary Bloom Satellite Child Orbs */}
                    {item.fanout && item.fanout.map((child, childIdx) => {
                      const childPos = calculateChildPosition(angleRad, orbit.radius, childIdx, item.fanout!.length)
                      const isChildActive = location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path))
                      const childColor = colors[child.colorKey] || '#ffffff'
                      const isChildHovered = hoveredModule === child.label

                      return (
                        <button
                          key={child.path}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNavigate(child.path)
                          }}
                          onMouseEnter={() => {
                            setHoveredModule(child.label)
                            setHoveredColorKey(child.colorKey)
                          }}
                          onMouseLeave={() => {
                            setHoveredModule(null)
                            setHoveredColorKey(null)
                          }}
                          aria-label={child.label}
                          className={`absolute bottom-2 left-2 z-30 flex h-11 w-11 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 ease-out hover:scale-115 focus:outline-none focus:ring-2 focus:ring-primary group
                            ${isParentFanoutActive && isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'}
                          `}
                          style={{
                            transform: isParentFanoutActive && isOpen
                              ? `translate3d(${childPos.x}px, ${childPos.y}px, 0)`
                              : `translate3d(${x}px, ${y}px, 0)`,
                            backgroundColor: isChildActive ? childColor : 'oklch(var(--bg-surface) / 0.95)',
                            borderColor: isChildActive || isChildHovered ? childColor : 'oklch(var(--border-base))',
                            color: isChildActive ? '#000' : (isChildHovered ? childColor : 'oklch(var(--text-secondary))'),
                            boxShadow: isChildActive || isChildHovered 
                              ? `0 0 22px ${childColor}80` 
                              : '0 6px 16px rgba(0,0,0,0.35)'
                          }}
                        >
                          <div className={`flex h-full w-full items-center justify-center ${isParentFanoutActive ? floatClass(childIdx + 1) : ''}`}>
                            <child.icon className="h-4 w-4" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Central Orb Trigger & Home Launcher */}
        <div className="relative">
          <button
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true)
              } else {
                // When open, clicking central orb routes to HOME
                handleNavigate('/')
              }
            }}
            className={`relative z-50 flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-surface shadow-2xl transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-primary/20 overflow-hidden group
              ${isOpen ? 'scale-95 bg-elevated border-primary/50 shadow-primary/25' : 'hover:scale-105 hover:shadow-primary/10 hover:border-primary/30'}
            `}
            style={{
              borderColor: isOpen && hoveredColor ? hoveredColor : undefined,
              boxShadow: isOpen && hoveredColor ? `0 0 20px ${hoveredColor}40` : undefined
            }}
            aria-label={isOpen ? "Return to Home" : "Open Navigation"}
            title={isOpen ? "Return Home" : "Open Astrolabe"}
          >
            {/* Subtle Non-Blinding Ambient Halo */}
            <div 
              className={`absolute inset-0 -z-10 rounded-full blur-xl transition-all duration-500 ${
                isOpen ? 'opacity-20' : 'opacity-0 animate-pulse'
              }`}
              style={{
                backgroundColor: hoveredColor || 'rgba(var(--primary-rgb), 0.2)'
              }}
            />
            
            {isOpen ? (
              hoveredModule ? (
                /* Peaceful Text living naturally inside the circular orb */
                <div className="flex flex-col items-center justify-center px-1 text-center animate-fade-in w-full h-full z-10">
                  <span 
                    className="font-mono font-bold text-[9px] uppercase tracking-wider leading-tight text-center px-1 select-none text-text-primary max-w-[56px] line-clamp-2"
                  >
                    {hoveredModule}
                  </span>
                </div>
              ) : (
                /* Home Launchpad Visual */
                <div className="flex flex-col items-center justify-center text-text-primary group-hover:text-primary transition-colors">
                  <HomeIcon className="h-5 w-5 mb-0.5" />
                  <span className="text-[8px] font-mono font-bold tracking-widest uppercase">HOME</span>
                </div>
              )
            ) : (
              <div className="relative flex h-full w-full items-center justify-center">
                {/* Fallback User Avatar inside Orb */}
                <div className="h-10 w-10 overflow-hidden rounded-full bg-background border border-border flex items-center justify-center text-text-secondary transition-all">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                
                {/* Momentum Indicator Ring */}
                <svg className="absolute inset-0 h-16 w-16 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                  <circle 
                    cx="50" cy="50" r="46" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeDasharray="289" 
                    strokeDashoffset="100" 
                    className="text-primary transition-all duration-1000 ease-out" 
                  />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
