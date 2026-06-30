import { create } from 'zustand'
import type { LessonResult, Question } from '@/types'

interface LessonState {
  currentLessonId: string | null
  currentQuestionIndex: number
  questions: Question[]
  answers: Record<string, string | string[]>
  score: number
  heartsLost: number
  isComplete: boolean
  result: LessonResult | null
  showExplanation: boolean
  selectedAnswer: string | string[] | null

  startLesson: (lessonId: string, questions: Question[]) => void
  answerQuestion: (questionId: string, answer: string | string[]) => void
  nextQuestion: () => void
  completeLesson: () => void
  resetLesson: () => void
  setShowExplanation: (show: boolean) => void
  setSelectedAnswer: (answer: string | string[] | null) => void
}

export const useLessonStore = create<LessonState>()((set, get) => ({
  currentLessonId: null,
  currentQuestionIndex: 0,
  questions: [],
  answers: {},
  score: 0,
  heartsLost: 0,
  isComplete: false,
  result: null,
  showExplanation: false,
  selectedAnswer: null,

  startLesson: (lessonId, questions) =>
    set({
      currentLessonId: lessonId,
      questions,
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      heartsLost: 0,
      isComplete: false,
      result: null,
      showExplanation: false,
      selectedAnswer: null,
    }),

  answerQuestion: (questionId, answer) => {
    const state = get()
    const question = state.questions.find(q => q.id === questionId)
    if (!question) return

    const isCorrect = Array.isArray(question.correctAnswer)
      ? Array.isArray(answer) && answer.every(a => question.correctAnswer.includes(a)) && answer.length === question.correctAnswer.length
      : answer === question.correctAnswer

    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
      score: isCorrect ? state.score + 1 : state.score,
      heartsLost: isCorrect ? state.heartsLost : state.heartsLost + 1,
    }))
  },

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: state.currentQuestionIndex + 1,
      showExplanation: false,
      selectedAnswer: null,
    })),

  completeLesson: () => {
    const state = get()
    const totalQuestions = state.questions.length
    const score = state.score
    const perfectLesson = score === totalQuestions
    const result: LessonResult = {
      lessonId: state.currentLessonId!,
      score,
      maxScore: totalQuestions,
      xpEarned: score * 10 + (perfectLesson ? 25 : 0),
      coinsEarned: score * 5,
      perfectLesson,
      answers: state.answers,
    }
    set({ isComplete: true, result })
  },

  resetLesson: () =>
    set({
      currentLessonId: null,
      currentQuestionIndex: 0,
      questions: [],
      answers: {},
      score: 0,
      heartsLost: 0,
      isComplete: false,
      result: null,
      showExplanation: false,
      selectedAnswer: null,
    }),

  setShowExplanation: (show) => set({ showExplanation: show }),
  setSelectedAnswer: (answer) => set({ selectedAnswer: answer }),
}))
