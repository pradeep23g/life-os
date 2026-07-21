import { Trash2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

interface DeleteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md'
}

export function DeleteButton({ size = 'md', className = '', ...props }: DeleteButtonProps) {
  const sizeClasses = size === 'sm' ? 'p-1' : 'p-1.5'
  const iconClasses = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      type="button"
      className={`rounded-md text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50 ${sizeClasses} ${className}`}
      aria-label="Delete"
      {...props}
    >
      <Trash2 className={iconClasses} />
    </button>
  )
}
