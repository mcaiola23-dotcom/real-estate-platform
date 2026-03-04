'use client'

import { useState, Fragment } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { signIn } from 'next-auth/react'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOAuthSignIn = async (provider: string) => {
        setIsLoading(true)
        setError(null)
        try {
            await signIn(provider, { callbackUrl: '/' })
        } catch {
            setError('Failed to sign in. Please try again.')
            setIsLoading(false)
        }
    }

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                onClose()
            }
        } catch {
            setError('Failed to sign in. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            // Call backend to create account
            const response = await fetch(`/api/portal/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to create account')
            }

            // Auto sign in after registration
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Account created but sign in failed. Please try logging in.')
            } else {
                onClose()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create account')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title className="text-xl font-semibold text-stone-900">
                                        Welcome to SmartMLS
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-lg hover:bg-stone-100 transition-colors"
                                    >
                                        <XMarkIcon className="h-5 w-5 text-stone-500" />
                                    </button>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Social Login Buttons */}
                                <div className="space-y-3 mb-6">
                                    <button
                                        onClick={() => handleOAuthSignIn('google')}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
                                    >
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span className="text-stone-600 font-medium">Continue with Google</span>
                                    </button>

                                    <button
                                        onClick={() => handleOAuthSignIn('facebook')}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                        <span className="font-medium">Continue with Facebook</span>
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-stone-200" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-stone-500">or continue with email</span>
                                    </div>
                                </div>

                                {/* Email/Password Tabs */}
                                <Tab.Group>
                                    <Tab.List className="flex gap-1 rounded-lg bg-stone-100 p-1 mb-4">
                                        <Tab className={({ selected }) =>
                                            `w-full py-2 text-sm font-medium rounded-md transition-colors ${selected
                                                ? 'bg-white text-stone-900 shadow-sm'
                                                : 'text-stone-500 hover:text-stone-900'
                                            }`
                                        }>
                                            Sign In
                                        </Tab>
                                        <Tab className={({ selected }) =>
                                            `w-full py-2 text-sm font-medium rounded-md transition-colors ${selected
                                                ? 'bg-white text-stone-900 shadow-sm'
                                                : 'text-stone-500 hover:text-stone-900'
                                            }`
                                        }>
                                            Sign Up
                                        </Tab>
                                    </Tab.List>

                                    <Tab.Panels>
                                        {/* Sign In Panel */}
                                        <Tab.Panel>
                                            <form onSubmit={handleEmailSignIn} className="space-y-4">
                                                <div>
                                                    <label htmlFor="signin-email" className="block text-sm font-medium text-stone-600 mb-1">
                                                        Email
                                                    </label>
                                                    <input
                                                        id="signin-email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                                                        placeholder="you@example.com"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="signin-password" className="block text-sm font-medium text-stone-600 mb-1">
                                                        Password
                                                    </label>
                                                    <input
                                                        id="signin-password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                                                        placeholder="••••••••"
                                                        required
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full py-3 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                                                >
                                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                                </button>
                                            </form>
                                        </Tab.Panel>

                                        {/* Sign Up Panel */}
                                        <Tab.Panel>
                                            <form onSubmit={handleEmailSignUp} className="space-y-4">
                                                <div>
                                                    <label htmlFor="signup-name" className="block text-sm font-medium text-stone-600 mb-1">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        id="signup-name"
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                                                        placeholder="John Doe"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="signup-email" className="block text-sm font-medium text-stone-600 mb-1">
                                                        Email
                                                    </label>
                                                    <input
                                                        id="signup-email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                                                        placeholder="you@example.com"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="signup-password" className="block text-sm font-medium text-stone-600 mb-1">
                                                        Password
                                                    </label>
                                                    <input
                                                        id="signup-password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 focus:border-transparent"
                                                        placeholder="••••••••"
                                                        minLength={8}
                                                        required
                                                    />
                                                    <p className="mt-1 text-xs text-stone-500">Minimum 8 characters</p>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full py-3 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                                                >
                                                    {isLoading ? 'Creating account...' : 'Create Account'}
                                                </button>
                                            </form>
                                        </Tab.Panel>
                                    </Tab.Panels>
                                </Tab.Group>

                                {/* Terms */}
                                <p className="mt-6 text-xs text-center text-stone-500">
                                    By continuing, you agree to our{' '}
                                    <a href="/terms" className="text-stone-900 hover:underline">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="/privacy" className="text-stone-900 hover:underline">Privacy Policy</a>
                                </p>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}
