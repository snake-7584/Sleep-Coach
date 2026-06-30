'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useAppStore } from '@/stores/app-store'
import { XPBadge, CoinBadge } from '@/components/ui/badges'
import { StatsPopover } from '@/components/ui/stats-popover'
import { ProgressBar } from '@/components/ui/progress'
import { getProgressToNextLevel, getLevelInfo } from '@/lib/utils'
import {
  Home,
  BookOpen,
  BarChart3,
  Trophy,
  User,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/leaderboard', label: 'Rankings', icon: BarChart3 },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Header() {
  const { data: session } = useSession()
  const { isDarkMode, toggleDarkMode } = useAppStore()

  const user = session?.user

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          Fin<span className="text-emerald-600">Wise</span>
        </span>

        <div className="flex items-center gap-1.5">
          {user && (
            <>
              <StatsPopover>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <XPBadge xp={100} />
                  <CoinBadge coins={50} />
                </button>
              </StatsPopover>
              <button
                onClick={toggleDarkMode}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export function TabBar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-emerald-600'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-full p-1 transition-colors',
                  isActive && 'bg-emerald-50 dark:bg-emerald-900/20'
                )}
              >
                <tab.icon className="h-5 w-5" />
              </div>
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function DesktopSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const user = session?.user

  if (!user) return null

  const sidebarLinks = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
    { href: '/achievements', label: 'Achievements', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/tutor', label: 'AI Tutor', icon: Sparkles },
  ]

  const levelInfo = getLevelInfo(1)
  const progress = getProgressToNextLevel(0, 1)

  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950 lg:block">
      <div className="flex h-full flex-col p-3">
        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
              {user.name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name || 'Learner'}</p>
              <p className="text-[11px] text-gray-500">Level {levelInfo.level}</p>
            </div>
          </div>
          <ProgressBar value={progress} size="sm" />
        </div>

        <nav className="flex-1 space-y-0.5">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
