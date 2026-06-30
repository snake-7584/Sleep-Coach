export class GamificationEngine {
  static XP_PER_CORRECT = 10
  static XP_PERFECT_BONUS = 25
  static XP_DAILY_BONUS = 15
  static COINS_PER_LESSON = 5
  static COINS_PER_STREAK = 10
  static COINS_PER_CHALLENGE = 15
  static HEARTS_MAX = 5
  static HEART_REFILL_TIME = 30 * 60 * 1000 // 30 minutes

  static calculateLessonXp(score: number, maxScore: number, perfect: boolean): number {
    const correctXp = Math.round((score / maxScore) * this.XP_PER_CORRECT)
    const perfectBonus = perfect ? this.XP_PERFECT_BONUS : 0
    return Math.max(correctXp + perfectBonus, 1)
  }

  static calculateLessonCoins(score: number, maxScore: number): number {
    const rate = score / maxScore
    if (rate >= 1) return this.COINS_PER_LESSON * 2
    if (rate >= 0.8) return this.COINS_PER_LESSON
    if (rate >= 0.5) return Math.floor(this.COINS_PER_LESSON / 2)
    return 1
  }

  static getLevel(xp: number): { level: number; xpForNext: number; progress: number; title: string } {
    const thresholds = [
      { level: 1, xp: 0, title: 'Newbie' },
      { level: 2, xp: 100, title: 'Saver' },
      { level: 3, xp: 350, title: 'Budgeter' },
      { level: 4, xp: 850, title: 'Investor' },
      { level: 5, xp: 1850, title: 'Financier' },
      { level: 6, xp: 3850, title: 'Wealth Builder' },
      { level: 7, xp: 7350, title: 'Money Master' },
      { level: 8, xp: 12350, title: 'Financial Guru' },
      { level: 9, xp: 19850, title: 'Wealth Wizard' },
      { level: 10, xp: 29850, title: 'Millionaire' },
    ]

    let currentLevel = thresholds[0]
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i].xp) {
        currentLevel = thresholds[i]
        break
      }
    }

    const nextThreshold = thresholds.find(t => t.xp > currentLevel.xp)
    const xpForNext = nextThreshold ? nextThreshold.xp - currentLevel.xp : 10000
    const progress = nextThreshold
      ? ((xp - currentLevel.xp) / (nextThreshold.xp - currentLevel.xp)) * 100
      : 100

    return {
      level: currentLevel.level,
      xpForNext,
      progress: Math.min(progress, 100),
      title: currentLevel.title,
    }
  }

  static checkAchievements(stats: {
    xp: number
    streak: number
    lessonsCompleted: number
    perfectQuiz: boolean
    completedModuleTitles: string[]
    allModulesCompleted: boolean
  }): string[] {
    const unlocked: string[] = []
    if (stats.lessonsCompleted >= 1) unlocked.push('first_lesson')
    if (stats.streak >= 7) unlocked.push('streak_7')
    if (stats.streak >= 30) unlocked.push('streak_30')
    if (stats.lessonsCompleted >= 10) unlocked.push('ten_lessons')
    if (stats.xp >= 1000) unlocked.push('xp_1000')
    if (stats.xp >= 10000) unlocked.push('xp_10000')
    if (stats.perfectQuiz) unlocked.push('perfect_quiz')
    if (stats.completedModuleTitles.length > 0) unlocked.push('module_complete')
    if (stats.completedModuleTitles.some(t => t.toLowerCase().includes('budget'))) unlocked.push('budget_master')
    if (stats.completedModuleTitles.some(t => t.toLowerCase().includes('invest'))) unlocked.push('investing_beginner')
    if (stats.allModulesCompleted) unlocked.push('all_modules')
    return unlocked
  }

  static canRefillHeart(lastHeartLoss: Date | null): boolean {
    if (!lastHeartLoss) return true
    return Date.now() - lastHeartLoss.getTime() >= this.HEART_REFILL_TIME
  }

  static getStreakMultiplier(streak: number): number {
    if (streak >= 30) return 2
    if (streak >= 7) return 1.5
    return 1
  }
}
