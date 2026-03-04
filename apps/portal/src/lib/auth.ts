import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Apple from "next-auth/providers/apple"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { assertPortalAuthSecretIsSafe } from "@/lib/server/env-security"
import { joinPortalApiPath } from "@/lib/server/portal-api"
import { enforceNamedRateLimit, makeRateLimitKey } from "@/lib/server/rate-limit"

/**
 * NextAuth.js v5 configuration for SmartMLS AI Platform
 * 
 * Supports:
 * - OAuth: Google, Facebook, Apple (when configured)
 * - Email/Password via Credentials provider
 */

// Build providers array dynamically based on available config
const providers: NonNullable<NextAuthConfig["providers"]> = []

// Add Google if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    )
}

// Add Facebook if configured
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.push(
        Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        })
    )
}

// Add Apple if configured
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.push(
        Apple({
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
        })
    )
}

// Always add Credentials provider for email/password
providers.push(
    Credentials({
        name: "Email",
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
        },
        async authorize(credentials, request) {
            if (!credentials?.email || !credentials?.password) {
                return null
            }

            const rateLimitKey = makeRateLimitKey({
                scope: "nextauth:credentials",
                method: "POST",
                headers: request.headers,
                identity: String(credentials.email).toLowerCase(),
            })
            const rateLimitDecision = enforceNamedRateLimit({
                policyName: "authCredentials",
                key: rateLimitKey,
            })
            if (!rateLimitDecision.allowed) {
                return null
            }

            // Call backend to verify credentials
            try {
                const response = await fetch(joinPortalApiPath("/api/auth/login"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                })

                if (!response.ok) {
                    return null
                }

                const user = await response.json()
                return {
                    id: user.user_id.toString(),
                    email: user.email,
                    name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
                    accessToken: user.access_token, // Store backend JWT
                }
            } catch (error) {
                console.error("Auth error:", error)
                return null
            }
        },
    })
)

const config: NextAuthConfig = {
    providers,
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // On initial sign in, add user data and access token to JWT
            if (user) {
                token.userId = user.id
                token.provider = account?.provider || "credentials"

                // Store backend access token for API calls (credentials login)
                if ((user as any).accessToken) {
                    token.accessToken = (user as any).accessToken
                }

                // For OAuth sign-in, sync to backend and get access token
                if (account?.provider !== "credentials" && user.email) {
                    try {
                        const response = await fetch(joinPortalApiPath("/api/auth/oauth-sync"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                email: user.email,
                                name: user.name,
                                provider: account?.provider,
                                provider_account_id: account?.providerAccountId,
                            }),
                        })

                        if (response.ok) {
                            const data = await response.json()
                            token.accessToken = data.access_token
                            token.userId = data.user_id?.toString()
                        }
                    } catch (error) {
                        console.error("Failed to sync OAuth user:", error)
                        // Continue without access token
                    }
                }
            }
            return token
        },
        async session({ session, token }) {
            // Add user ID and access token to session for API calls
            if (token && session.user) {
                session.user.id = token.userId as string
                session.user.provider = token.provider as string
                    // Expose access token to frontend
                    ; (session as any).accessToken = token.accessToken as string | undefined
            }
            return session
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // Use a fallback secret for development if NEXTAUTH_SECRET is not set
    secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production-12345",
}

assertPortalAuthSecretIsSafe()

export const { handlers, signIn, signOut, auth } = NextAuth(config)

