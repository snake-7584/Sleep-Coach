import { cn } from '@/lib/utils'

export function XPBadge({ xp, size = 'md' }: { xp: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeStyles = { sm: 'text-[10px] px-1.5 py-0.5', md: 'text-xs px-2 py-0.5', lg: 'text-sm px-3 py-1' }
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-md bg-amber-100 font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', sizeStyles[size])}>
      {xp.toLocaleString()} XP
    </span>
  )
}

export function CoinBadge({ coins, size = 'md' }: { coins: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeStyles = { sm: 'text-[10px] px-1.5 py-0.5', md: 'text-xs px-2 py-0.5', lg: 'text-sm px-3 py-1' }
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-md bg-yellow-100 font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', sizeStyles[size])}>
      {coins.toLocaleString()}
    </span>
  )
}

export function HeartDisplay({ hearts, maxHearts = 5 }: { hearts: number; maxHearts?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxHearts }).map((_, i) => (
        <span key={i} className={`text-sm ${i < hearts ? 'text-red-400' : 'text-gray-300 dark:text-gray-600'}`}>
          {i < hearts ? '♥' : '♡'}
        </span>
      ))}
    </div>
  )
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
      {streak} day{streak !== 1 ? 's' : ''}
    </span>
  )
}

export function LevelBadge({ level }: { level: number; title?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
      Level {level}
    </span>
  )
}
