'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, X, HelpCircle } from 'lucide-react'
import { useState } from 'react'

interface OptionButtonProps {
  label: string
  isSelected?: boolean
  isCorrect?: boolean
  isWrong?: boolean
  disabled?: boolean
  onClick: () => void
  index: number
}

export function OptionButton({ label, isSelected, isCorrect, isWrong, disabled, onClick, index }: OptionButtonProps) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative w-full rounded-xl border p-4 text-left font-medium transition-all active:scale-[0.98]',
        'hover:border-brand-green hover:bg-brand-green/5',
        isSelected && !isCorrect && !isWrong && 'border-brand-blue bg-brand-blue/5',
        isCorrect && 'border-brand-green bg-brand-green/10',
        isWrong && 'border-brand-red bg-brand-red/10 animate-shake',
        !isSelected && !isCorrect && !isWrong && 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
        disabled && 'cursor-default opacity-70'
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors',
            isCorrect && 'bg-brand-green text-white',
            isWrong && 'bg-brand-red text-white',
            !isCorrect && !isWrong && 'bg-gray-100 text-gray-500 group-hover:bg-brand-green/20 dark:bg-gray-700 dark:text-gray-400'
          )}
        >
          {isCorrect ? <Check className="h-4 w-4" /> : isWrong ? <X className="h-4 w-4" /> : letters[index]}
        </span>
        <span className="text-gray-900 dark:text-white">{label}</span>
      </div>
    </motion.button>
  )
}

interface QuestionCardProps {
  question: string
  hint?: string
  imageUrl?: string
  children: React.ReactNode
  progress: number
  total: number
}

export function QuestionCard({ question, hint, imageUrl, children, progress, total }: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Question {progress} of {total}</span>
          <span className="font-semibold text-brand-green">{Math.round((progress / total) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-brand-green transition-all duration-500"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      {imageUrl && (
        <div className="mb-6 overflow-hidden rounded-2xl">
          <img src={imageUrl} alt="Question illustration" className="w-full h-48 object-cover" />
        </div>
      )}

      <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">{question}</h2>

      {hint && (
        <div className="mb-4">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <HelpCircle className="h-4 w-4" />
            {showHint ? 'Hide hint' : 'Need a hint?'}
          </button>
          {showHint && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              {hint}
            </motion.p>
          )}
        </div>
      )}

      <div className="space-y-3">{children}</div>
    </motion.div>
  )
}

interface ResultScreenProps {
  score: number
  maxScore: number
  xpEarned: number
  coinsEarned: number
  perfectLesson: boolean
  onRetry: () => void
  onNext: () => void
}

export function ResultScreen({ score, maxScore, xpEarned, coinsEarned, perfectLesson, onRetry, onNext }: ResultScreenProps) {
  const percentage = Math.round((score / maxScore) * 100)

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mx-auto flex max-w-md flex-col items-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-4 text-4xl"
      >
        {perfectLesson ? '✦' : percentage >= 80 ? '✓' : percentage >= 50 ? '→' : '↻'}
      </motion.div>

      <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
        {perfectLesson ? 'All correct' : percentage >= 80 ? 'Great job' : percentage >= 50 ? 'Getting there' : 'Keep trying'}
      </h2>

      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {score} of {maxScore} correct
      </p>

      <div className="mb-8 flex gap-6">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-amber-500">+{xpEarned}</span>
          <span className="text-xs text-gray-400">XP</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-yellow-500">+{coinsEarned}</span>
          <span className="text-xs text-gray-400">Coins</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-brand-blue">{percentage}%</span>
          <span className="text-xs text-gray-400">Score</span>
        </div>
      </div>

      <div className="flex w-full gap-3">
        {!perfectLesson && (
          <button onClick={onRetry} className="btn-secondary flex-1">
            Retry
          </button>
        )}
        <button onClick={onNext} className="btn-primary flex-1">
          Continue
        </button>
      </div>
    </motion.div>
  )
}
