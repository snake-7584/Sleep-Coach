export interface Module {
  id: string
  title: string
  description: string
  icon: string
  color: string
  order: number
  xpReward: number
  coinReward: number
  published: boolean
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  moduleId: string
  title: string
  description?: string
  content: LessonContent
  order: number
  xpReward: number
  coinReward: number
  requiredXp: number
  lessonType: LessonType
  published: boolean
}

export type LessonType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'match_terms'
  | 'scenario'
  | 'simulation'

export interface LessonContent {
  questions: Question[]
  introduction?: string
  summary?: string
  tips?: string[]
}

export interface Question {
  id: string
  type: LessonType
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation: string
  hint?: string
  imageUrl?: string
  scenario?: ScenarioData
  matchPairs?: MatchPair[]
  simulation?: SimulationData
}

export interface ScenarioData {
  description: string
  data: Record<string, number>
  question: string
}

export interface MatchPair {
  id: string
  term: string
  definition: string
}

export interface SimulationData {
  type: 'budget' | 'investment' | 'savings'
  initialValues: Record<string, number>
  steps: SimulationStep[]
}

export interface SimulationStep {
  label: string
  description: string
  action: string
  options: SimulationOption[]
}

export interface SimulationOption {
  label: string
  value: number
  impact: string
}

export interface UserProfile {
  id: string
  name?: string
  email?: string
  image?: string
  username?: string
  displayName?: string
  bio?: string
  level: number
  xp: number
  coins: number
  hearts: number
  maxHearts: number
  streakCount: number
  currency: string
  role: 'user' | 'admin'
}

export interface UserProgress {
  id: string
  userId: string
  lessonId: string
  completed: boolean
  score: number
  xpEarned: number
  attempts: number
  lesson: Lesson
}

export interface Achievement {
  id: string
  key: string
  title: string
  description: string
  icon: string
  xpReward: number
  coinReward: number
  unlocked?: boolean
  unlockedAt?: string
}

export interface DailyChallenge {
  id: string
  title: string
  description: string
  type: ChallengeType
  target: number
  xpReward: number
  coinReward: number
  progress: number
  completed: boolean
}

export type ChallengeType = 'complete_lessons' | 'earn_xp' | 'perfect_quiz' | 'streak' | 'coins'

export interface LeaderboardEntry {
  id: string
  userId: string
  score: number
  period: 'weekly' | 'monthly' | 'allTime'
  rank?: number
  user: {
    name?: string
    image?: string
    username?: string
    level: number
  }
}

export interface StoreItem {
  id: string
  name: string
  description: string
  type: 'avatar' | 'theme' | 'boost' | 'freeze'
  price: number
  imageUrl?: string
  owned?: boolean
  equipped?: boolean
}

export interface LessonResult {
  lessonId: string
  score: number
  maxScore: number
  xpEarned: number
  coinsEarned: number
  perfectLesson: boolean
  answers: Record<string, string | string[]>
}

export interface LevelInfo {
  level: number
  xpRequired: number
  totalXpRequired: number
  title: string
}
