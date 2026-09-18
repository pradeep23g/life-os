export interface LoadingViewProps {
  label?: string
  sublabel?: string
  variant?: 'page' | 'inline' | 'fullscreen'
  className?: string
}

export function LoadingView({
  label = 'Synchronizing Telemetry',
  sublabel = 'Calibrating environmental horizon',
  variant = 'page',
  className = '',
}: LoadingViewProps) {
  const containerHeight =
    variant === 'fullscreen'
      ? 'fixed inset-0 z-50 bg-background/90 backdrop-blur-md'
      : variant === 'inline'
      ? 'min-h-[60px] w-full'
      : 'min-h-[200px] w-full'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${label}: ${sublabel}`}
      className={`flex flex-col items-center justify-center p-8 select-none animate-in fade-in duration-500 ${containerHeight} ${className}`}
    >
      <div className="flex flex-col items-center w-full max-w-[200px] space-y-4">
        {/* Frictionless Loading Line */}
        <div className="h-[2px] w-full bg-border-subtle relative overflow-hidden">
          <div className="absolute inset-y-0 w-1/3 bg-text-primary animate-[shimmer_1.5s_infinite_linear]" style={{ left: '-33%' }} />
        </div>
        
        {/* Typography */}
        <div className="text-center space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-primary">
            {label}
          </p>
          {sublabel && variant !== 'inline' && (
            <p className="font-sans text-[10px] uppercase tracking-widest text-text-tertiary">
              {sublabel}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoadingView
