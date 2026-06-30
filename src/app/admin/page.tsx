'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header, TabBar } from '@/components/layout/navigation'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users, BookOpen, TrendingUp, Activity,
  Edit3, Plus, BarChart3, Settings
} from 'lucide-react'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'users' | 'analytics'>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const stats = [
    { label: 'Total Users', value: '0', icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { label: 'Total Lessons', value: '17', icon: BookOpen, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { label: 'Active Today', value: '0', icon: Activity, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
    { label: 'Avg XP/User', value: '0', icon: TrendingUp, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="pb-20 pt-4">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-6 w-6 text-gray-500" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Manage your FinWise platform</p>
          </div>

          {/* Admin Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide">
            {([
              { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
              { key: 'lessons' as const, label: 'Lessons', icon: Edit3 },
              { key: 'users' as const, label: 'Users', icon: Users },
              { key: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-brand-green text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <Card key={stat.label} className="!p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Complete these steps to set up your platform</CardDescription>
                <div className="mt-4 space-y-3">
                  {[
                    { step: 'Seed the database', desc: 'Run the seed script to populate sample content', done: false },
                    { step: 'Configure authentication', desc: 'Set up OAuth providers in .env', done: true },
                    { step: 'Create lessons', desc: 'Add content to the learning modules', done: false },
                    { step: 'Review analytics', desc: 'Monitor user engagement and progress', done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        item.done ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                      }`}>
                        {item.done ? '✓' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.step}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {activeTab === 'lessons' && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <CardTitle>Lesson Management</CardTitle>
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Lesson
                </Button>
              </div>
              <div className="space-y-3">
                {['Money Basics', 'Budgeting', 'Banking', 'Credit', 'Investing'].map((mod) => (
                  <div key={mod} className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{mod}</p>
                      <p className="text-sm text-gray-500">4 lessons</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage platform users</CardDescription>
              <div className="mt-4 text-center py-8 text-gray-400">
                <Users className="mx-auto mb-2 h-8 w-8" />
                <p>No users yet. Share your platform to get started!</p>
              </div>
            </Card>
          )}

          {activeTab === 'analytics' && (
            <Card>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Track platform engagement and growth</CardDescription>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Daily Active Users', value: '0', change: '0%' },
                  { label: 'Lesson Completion Rate', value: '0%', change: '0%' },
                  { label: 'Avg Streak Length', value: '0 days', change: '0%' },
                  { label: 'Module Completion Rate', value: '0%', change: '0%' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-500">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                    <p className="text-xs text-green-500">{metric.change} vs last week</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
      <TabBar />
    </div>
  )
}
