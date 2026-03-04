'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import LoginModal from './LoginModal'

interface WithAuthOptions {
    redirectTo?: string
    showLoginModal?: boolean
}

/**
 * Higher-order component to protect pages that require authentication.
 * 
 * Usage:
 * ```tsx
 * export default withAuth(ProfilePage)
 * // or with options:
 * export default withAuth(ProfilePage, { redirectTo: '/login' })
 * ```
 */
export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options: WithAuthOptions = {}
) {
    const { redirectTo, showLoginModal = true } = options

    return function WithAuthComponent(props: P) {
        const router = useRouter()
        const { isAuthenticated, isLoading } = useAuth()
        const [showModal, setShowModal] = useState(false)

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                if (redirectTo) {
                    router.push(redirectTo)
                } else if (showLoginModal) {
                    setShowModal(true)
                }
            }
        }, [isLoading, isAuthenticated, router])

        // Show loading spinner while checking auth
        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
                </div>
            )
        }

        // Not authenticated - show login modal or redirect
        if (!isAuthenticated) {
            if (showLoginModal) {
                return (
                    <>
                        <div className="min-h-screen flex flex-col items-center justify-center px-4">
                            <h1 className="text-2xl font-bold text-stone-900 mb-4">Sign in required</h1>
                            <p className="text-stone-500 mb-6">Please sign in to access this page.</p>
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                        <LoginModal
                            isOpen={showModal}
                            onClose={() => {
                                setShowModal(false)
                                router.push('/')
                            }}
                        />
                    </>
                )
            }
            return null
        }

        // Authenticated - render the wrapped component
        return <WrappedComponent {...props} />
    }
}

export default withAuth
