import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, UserProgress, Achievement, DailyChallenge } from '@/types'

interface AppState {
  // User
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  updateUser: (updates: Partial<UserProfile>) => void

  // Progress
  progress: UserProgress[]
  setProgress: (progress: UserProgress[]) => void
  addProgress: (progress: UserProgress) => void

  // Achievements
  achievements: Achievement[]
  setAchievements: (achievements: Achievement[]) => void

  // Challenges
  challenges: DailyChallenge[]
  setChallenges: (challenges: DailyChallenge[]) => void

  // UI
  isDarkMode: boolean
  toggleDarkMode: () => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Loading
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      progress: [],
      setProgress: (progress) => set({ progress }),
      addProgress: (progress) =>
        set((state) => ({
          progress: [...state.progress.filter((p) => p.lessonId !== progress.lessonId), progress],
        })),

      achievements: [],
      setAchievements: (achievements) => set({ achievements }),

      challenges: [],
      setChallenges: (challenges) => set({ challenges }),

      isDarkMode: false,
      toggleDarkMode: () =>
        set((state) => {
          const newDark = !state.isDarkMode
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newDark)
          }
          return { isDarkMode: newDark }
        }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'finwise-store',
      partialize: (state) => ({
        user: state.user,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
)
