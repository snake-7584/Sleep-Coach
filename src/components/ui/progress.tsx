'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red'
}

const colorStyles = {
  green: 'bg-brand-green',
  blue: 'bg-brand-blue',
  purple: 'bg-brand-purple',
  orange: 'bg-brand-orange',
  red: 'bg-brand-red',
}

const sizeStyles = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName,
  showLabel,
  size = 'md',
  color = 'green',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Progress</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800', sizeStyles[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorStyles[color],
            barClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CircularProgress({ value, max = 100, size = 80, strokeWidth = 6, className }: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className={cn('transform -rotate-90', className)}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-brand-green transition-all duration-500"
      />
    </svg>
  )
}
