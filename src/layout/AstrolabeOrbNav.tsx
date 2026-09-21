import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  X, User, Settings, LogOut 
} from 'lucide-react'
import {
  HomeIcon, ProductivityIcon, TimeOsIcon, MindOsIcon,
  WinterArcIcon, FitnessIcon, LearningIcon, FinanceIcon,
  DataLabIcon, ReportsIcon, SystemIcon
} from '../components/icons/ModuleIcons'
import { useAuth } from '../lib/AuthContext'
import { useModuleColors } from '../lib/useModuleColors'

const ORBIT_1 = [
  { path: '/', label: 'Home', icon: HomeIcon, domain: 'Mind' },
  { path: '/productivity-hub', label: 'Productivity', icon: ProductivityIcon, domain: 'Productivity' },
  { path: '/time-os', label: 'Time OS', icon: TimeOsIcon, domain: 'Time' },
  { path: '/mind-os', label: 'Mind OS', icon: MindOsIcon, domain: 'Mind' }
]

const ORBIT_2 = [
  { path: '/arc', label: 'Winter Arc', icon: WinterArcIcon, domain: 'Body' },
  { path: '/fitness-os', label: 'Fitness OS', icon: FitnessIcon, domain: 'Body' },
  { path: '/learning-os', label: 'Learning OS', icon: LearningIcon, domain: 'Wealth' },
  { path: '/finance-os', label: 'Finance OS', icon: FinanceIcon, domain: 'Wealth' }
]

const ORBIT_3 = [
  { path: '/data-lab', label: 'Data Lab', icon: DataLabIcon, domain: 'Time' },
  { path: '/reports', label: 'Reports', icon: ReportsIcon, domain: 'Time' },
  { path: '/system', label: 'Mission Control', icon: SystemIcon, domain: 'System' },
  { path: '/admin', label: 'Admin', icon: Settings, domain: 'System' }
]

export function AstrolabeOrbNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { colors } = useModuleColors()
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleNavigate = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  // Trigonometry for radial layout (bottom-left corner expands to top-right -> 0 to 90 degrees)
  // 0 degrees = right, 90 degrees = up (relative to the screen coordinates, y is inverted in CSS, so bottom to top is actually negative Y)
  const calculatePosition = (index: number, total: number, radius: number) => {
    // distribute evenly from 0 to 90 degrees
    const angleDeg = total === 1 ? 45 : (index / (total - 1)) * 90
    // Convert to radians
    const angleRad = (angleDeg * Math.PI) / 180
    // Calculate x and y (y is negative because it goes up from bottom)
    const x = Math.round(Math.cos(angleRad) * radius)
    const y = Math.round(-Math.sin(angleRad) * radius)
    return { x, y }
  }

  // Tightened distance between the 3 rings by 20% to make them denser (maintaining 3 rings)
  const radius1 = window.innerWidth < 768 ? 75 : 96
  const radius2 = window.innerWidth < 768 ? 119 : 147
  const radius3 = window.innerWidth < 768 ? 163 : 198

  return (
    <>
      {/* Backdrop blur */}
      <div 
        className={`fixed inset-0 z-40 transition-all duration-500 md:duration-700 pointer-events-none
          ${isOpen ? 'bg-background/80 backdrop-blur-md opacity-100' : 'opacity-0'}`} 
        aria-hidden="true"
      />

      <div 
        ref={navRef}
        className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50 flex items-end justify-start"
      >
        {/* Orbital Items */}
        <div 
          className="absolute bottom-0 left-0 h-16 w-16" 
          aria-expanded={isOpen}
          role="menu"
        >
          {/* Rendering the 3 Orbits */}
          {[
            { items: ORBIT_1, radius: radius1, delayBase: 0 },
            { items: ORBIT_2, radius: radius2, delayBase: ORBIT_1.length * 30 },
            { items: ORBIT_3, radius: radius3, delayBase: (ORBIT_1.length + ORBIT_2.length) * 30 }
          ].map((orbit, orbitIndex) => (
            <div key={`orbit-${orbitIndex}`}>
              {orbit.items.map((item, index) => {
                const { x, y } = calculatePosition(index, orbit.items.length, orbit.radius)
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                const moduleColor = colors[item.label] || '#ffffff'
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigate(item.path)}
                    onMouseEnter={() => setHoveredModule(item.label)}
                    onMouseLeave={() => setHoveredModule(null)}
                    aria-label={item.label}
                    className={`absolute bottom-2 left-2 flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all duration-500 ease-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary group
                      ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-0'}
                    `}
                    style={{
                      transform: isOpen ? `translate3d(${x}px, ${y}px, 0)` : 'translate3d(0, 0, 0)',
                      transitionDelay: isOpen ? `${orbit.delayBase + (index * 30)}ms` : '0ms',
                      backgroundColor: isActive ? moduleColor : 'rgba(25,25,25,0.85)',
                      borderColor: isActive || hoveredModule === item.label ? moduleColor : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#000' : (hoveredModule === item.label ? moduleColor : '#888'),
                      boxShadow: isActive || hoveredModule === item.label ? `0 0 20px ${moduleColor}60` : 'none'
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Central Orb Trigger & Profile Actions */}
        <div className="relative">
          {/* Mini Profile & Logout Actions */}
          <div className={`absolute -top-4 -right-12 flex flex-col gap-2 transition-all duration-500 ease-out z-40
            ${isOpen ? 'opacity-100 translate-x-0 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-x-4 translate-y-4 pointer-events-none scale-50'}
          `}>
            <button
              onClick={() => handleNavigate('/profile')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-surface text-text-secondary shadow-lg transition-all hover:bg-elevated hover:text-primary hover:scale-110"
              title="Profile Dossier"
              aria-label="Profile Dossier"
            >
              <User className="h-4 w-4" />
            </button>
            <button
              onClick={async () => { setIsOpen(false); await signOut(); }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-threat-warning/30 bg-surface text-threat-warning shadow-lg transition-all hover:bg-threat-warning/10 hover:scale-110"
              title="End Session"
              aria-label="End Session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative z-50 flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-surface shadow-2xl transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-primary/20 overflow-hidden
              ${isOpen ? 'scale-90 bg-elevated border-primary/50 shadow-primary/20' : 'hover:scale-105 hover:shadow-primary/10 hover:border-primary/30'}
            `}
            aria-label={isOpen ? "Close Navigation" : "Open Navigation"}
          >
            {/* Ambient Glow */}
            <div 
              className={`absolute inset-0 -z-10 rounded-full blur-xl transition-all duration-500 ${
                isOpen ? 'opacity-100' : 'opacity-0 animate-pulse'
              }`}
              style={{
                backgroundColor: hoveredModule && colors[hoveredModule] ? colors[hoveredModule] : 'rgba(var(--primary-rgb), 0.2)'
              }}
            />
            
            {isOpen ? (
              hoveredModule ? (
                <div className="flex flex-col items-center justify-center px-1 text-center animate-fade-in w-full h-full">
                  <span 
                    className="text-[9px] font-mono font-black uppercase tracking-wider leading-tight px-0.5 line-clamp-2"
                    style={{ 
                      color: colors[hoveredModule] || '#fff', 
                      textShadow: `0 0 10px ${colors[hoveredModule] || '#fff'}80` 
                    }}
                  >
                    {hoveredModule}
                  </span>
                </div>
              ) : (
                <X className="h-6 w-6 text-text-primary transition-transform duration-300" />
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
