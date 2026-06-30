'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Header, DesktopSidebar, TabBar } from '@/components/layout/navigation'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Bot, User, AlertCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickQuestions = [
  'What is compound interest?',
  'How do I start budgeting?',
  'What is a credit score?',
  'How does investing work?',
  'Explain taxes simply',
  'What is an emergency fund?',
]

const suggestedTopics = [
  { icon: '💰', label: 'Saving Money' },
  { icon: '📊', label: 'Budgeting' },
  { icon: '💳', label: 'Credit' },
  { icon: '📈', label: 'Investing' },
  { icon: '🏦', label: 'Banking' },
  { icon: '🧾', label: 'Taxes' },
]

export default function TutorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationStarted, setConversationStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const handleSend = async (question?: string) => {
    const text = question || input
    if (!text.trim() || isTyping) return

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setConversationStarted(true)
    setIsTyping(true)

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          currency: session?.user?.currency || 'USD',
        }),
      })
      const data = await res.json() as { reply: string }
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply || "I'm sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickQuestion = (q: string) => {
    handleSend(q)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pb-20 pt-4 lg:pb-6">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Tutor</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              Ask any question about personal finance. I&apos;ll explain it simply!
            </p>
          </div>

          <div className="mb-4 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>I&apos;m an educational AI tutor. I provide general financial education, not personalized financial advice. Always consult a professional for your specific situation.</span>
            </div>
          </div>

          {/* Messages */}
          <div className="mb-4 max-h-[60vh] space-y-4 overflow-y-auto">
            {!conversationStarted && (
              <div className="py-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl dark:bg-gray-800"
                >
                  💬
                </motion.div>
                <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  What do you want to learn?
                </h2>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  Ask me anything about personal finance, or try one of these:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(q)}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-brand-purple hover:text-brand-purple dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Or explore a topic:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedTopics.map((topic) => (
                      <button
                        key={topic.label}
                        onClick={() => handleSend(`Tell me about ${topic.label.toLowerCase()}`)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-all hover:border-brand-green hover:text-brand-green dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                      >
                        <span>{topic.icon}</span>
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-purple">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-brand-green text-white'
                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed text-white">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-p:leading-relaxed prose-a:text-brand-green prose-strong:text-gray-900 prose-strong:dark:text-white prose-code:rounded-md prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-brand-purple prose-code:dark:bg-gray-800 prose-code:dark:text-purple-300 prose-pre:rounded-xl prose-pre:bg-gray-900 prose-pre:text-sm prose-pre:text-gray-100 prose-li:text-gray-700 prose-li:dark:text-gray-300 prose-ol:list-decimal prose-ul:list-disc">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-purple">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-white p-3 dark:bg-gray-900">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-brand-purple" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-brand-purple" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-brand-purple" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a financial question..."
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
            <Button onClick={() => handleSend()} className="!px-4" disabled={!input.trim() || isTyping}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
      </div>
      <TabBar />
    </div>
  )
}
