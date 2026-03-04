'use client'

import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'
import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    user: {
        id?: string
        name?: string | null
        email?: string | null
        image?: string | null
    } | null
    accessToken: string | null
    signIn: typeof signIn
    signOut: typeof signOut
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthContextProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession()

    const value: AuthContextType = {
        isAuthenticated: status === 'authenticated',
        isLoading: status === 'loading',
        user: session?.user ?? null,
        accessToken: (session as any)?.accessToken ?? null,
        signIn,
        signOut,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AuthContextProvider>
                {children}
            </AuthContextProvider>
        </SessionProvider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// Re-export for convenience
export { signIn, signOut } from 'next-auth/react'
