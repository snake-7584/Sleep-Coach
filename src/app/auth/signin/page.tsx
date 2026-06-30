'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import { supportedCurrencies } from '@/lib/content/registry'

export default function SignInPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isSignUp) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: email.split('@')[0], currency }),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          throw new Error(data.error || 'Registration failed')
        }
        toast.success('Account created! Signing in...')
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleDemoLogin = async () => {
    try {
      const result = await signIn('credentials', {
        email: 'demo@finwise.com',
        password: 'demo123456',
        redirect: false,
      })
      if (result?.error) {
        toast.error('Demo account unavailable')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1] px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-lg font-bold text-gray-900 dark:text-white">
            Fin<span className="text-emerald-600">Wise</span>
          </Link>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {isSignUp ? 'Set up your account.' : 'Sign in to continue.'}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm outline-none focus:border-emerald-600 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="relative">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Currency</label>
                <button
                  type="button"
                  onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                  className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <span>
                    {supportedCurrencies.find(c => c.code === currency)?.flag}{' '}
                    {supportedCurrencies.find(c => c.code === currency)?.name}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${showCurrencyPicker ? 'rotate-180' : ''}`} />
                </button>
                {showCurrencyPicker && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-0.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {supportedCurrencies.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setCurrency(c.code); setShowCurrencyPicker(false) }}
                        className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-sm ${
                          currency === c.code
                            ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button type="submit" className="!mt-4 w-full">
              {isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
            <span className="text-xs text-gray-400">try</span>
            <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
          >
            Continue as guest
          </button>

          <p className="mt-5 text-center text-xs text-gray-400">
            {isSignUp ? 'Already registered?' : "No account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
