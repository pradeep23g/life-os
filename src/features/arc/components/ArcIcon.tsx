import type { ComponentType, SVGProps } from 'react'
import {
  Snowflake,
  Sprout,
  Sun,
  Leaf,
  Mountain,
  Flame,
  Waves,
  Star,
} from 'lucide-react'
import type { ArcIconName } from '../constants'

interface ArcIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name?: string | null
  className?: string
  size?: number
}

const ICON_MAP: Record<ArcIconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  snowflake: Snowflake,
  sprout: Sprout,
  sun: Sun,
  leaf: Leaf,
  mountain: Mountain,
  flame: Flame,
  wave: Waves,
  star: Star,
}

export function ArcIcon({ name, className = 'h-4 w-4', size, ...props }: ArcIconProps) {
  const normalized = (name?.toLowerCase() ?? 'snowflake') as ArcIconName
  const IconComponent = ICON_MAP[normalized] ?? Snowflake

  return <IconComponent className={className} width={size} height={size} {...props} />
}
