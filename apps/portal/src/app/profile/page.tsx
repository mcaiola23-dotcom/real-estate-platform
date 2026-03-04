'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth'
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, BellIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline'
import SavedLocationsSection from '@/components/profile/SavedLocationsSection'
import EmailAlertsSection from '@/components/profile/EmailAlertsSection'

const API_BASE = '/api/portal'

interface UserProfile {
    user_id: number
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    user_type: string | null
    auth_provider: string | null
    email_verified: boolean
    notification_preferences: {
        email_new_listings?: boolean
        email_price_changes?: boolean
        email_weekly_digest?: boolean
    } | null
}

export default function ProfilePage() {
    const router = useRouter()
    const { isAuthenticated, isLoading, user, accessToken } = useAuth()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Form state
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [phone, setPhone] = useState('')
    const [emailNewListings, setEmailNewListings] = useState(true)
    const [emailPriceChanges, setEmailPriceChanges] = useState(true)
    const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(false)

    // Password change
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Delete account
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/')
        }
    }, [isLoading, isAuthenticated, router])

    useEffect(() => {
        if (isAuthenticated) {
            fetchProfile()
        }
    }, [isAuthenticated])

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error('Failed to fetch profile')

            const data = await response.json()
            setProfile(data)

            // Populate form
            setFirstName(data.first_name || '')
            setLastName(data.last_name || '')
            setPhone(data.phone || '')
            setEmailNewListings(data.notification_preferences?.email_new_listings ?? true)
            setEmailPriceChanges(data.notification_preferences?.email_price_changes ?? true)
            setEmailWeeklyDigest(data.notification_preferences?.email_weekly_digest ?? false)
        } catch (err) {
            setError('Failed to load profile')
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone || null,
                    notification_preferences: {
                        email_new_listings: emailNewListings,
                        email_price_changes: emailPriceChanges,
                        email_weekly_digest: emailWeeklyDigest,
                    },
                }),
            })

            if (!response.ok) throw new Error('Failed to save profile')

            const data = await response.json()
            setProfile(data)
            setIsEditing(false)
            setSuccessMessage('Profile updated successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError('Failed to save profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE}/api/users/me/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to change password')
            }

            setShowPasswordModal(false)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setSuccessMessage('Password changed successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        setIsSaving(true)

        try {
            const response = await fetch(`${API_BASE}/api/users/me`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })

            if (!response.ok) throw new Error('Failed to delete account')

            // Sign out and redirect
            router.push('/')
        } catch (err) {
            setError('Failed to delete account')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || !profile) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-stone-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-stone-900">Profile Settings</h1>
                    <p className="mt-2 text-stone-500">Manage your account and preferences</p>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    {/* Profile Header */}
                    <div className="px-6 py-8 bg-gradient-to-r from-stone-900 to-primary-700 text-white">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                                <UserCircleIcon className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : profile.email}
                                </h2>
                                <p className="text-stone-200">{profile.email}</p>
                                {profile.auth_provider && profile.auth_provider !== 'email' && (
                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-white/20">
                                        Connected via {profile.auth_provider.charAt(0).toUpperCase() + profile.auth_provider.slice(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="p-6 border-b border-stone-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-stone-900">Personal Information</h3>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-stone-900 hover:text-stone-700 text-sm font-medium"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">First Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                        />
                                    ) : (
                                        <p className="text-stone-900">{profile.first_name || '—'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">Last Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                        />
                                    ) : (
                                        <p className="text-stone-900">{profile.last_name || '—'}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                                    Email
                                </label>
                                <p className="text-stone-900">{profile.email}</p>
                                {!profile.email_verified && (
                                    <span className="text-amber-600 text-sm">Email not verified</span>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 mb-1">
                                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                                    Phone
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400"
                                        placeholder="(555) 555-5555"
                                    />
                                ) : (
                                    <p className="text-stone-900">{profile.phone || '—'}</p>
                                )}
                            </div>

                            {isEditing && (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Saved Locations */}
                    <SavedLocationsSection />

                    {/* Email Alerts */}
                    <EmailAlertsSection />

                    {/* Notification Preferences */}
                    <div className="p-6 border-b border-stone-200">
                        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                            <BellIcon className="h-5 w-5" />
                            Notification Preferences
                        </h3>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailNewListings}
                                    onChange={(e) => setEmailNewListings(e.target.checked)}
                                    className="h-4 w-4 text-stone-900 rounded"
                                />
                                <span className="text-stone-600">Email me when new listings match my saved searches</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailPriceChanges}
                                    onChange={(e) => setEmailPriceChanges(e.target.checked)}
                                    className="h-4 w-4 text-stone-900 rounded"
                                />
                                <span className="text-stone-600">Email me about price changes on my favorite properties</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailWeeklyDigest}
                                    onChange={(e) => setEmailWeeklyDigest(e.target.checked)}
                                    className="h-4 w-4 text-stone-900 rounded"
                                />
                                <span className="text-stone-600">Send me a weekly market digest</span>
                            </label>
                        </div>
                    </div>

                    {/* Account Security */}
                    <div className="p-6 border-b border-stone-200">
                        <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                            <KeyIcon className="h-5 w-5" />
                            Account Security
                        </h3>

                        {profile.auth_provider === 'email' && (
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 text-stone-600"
                            >
                                Change Password
                            </button>
                        )}

                        {profile.auth_provider && profile.auth_provider !== 'email' && (
                            <p className="text-stone-500 text-sm">
                                Your account is secured through {profile.auth_provider.charAt(0).toUpperCase() + profile.auth_provider.slice(1)}.
                                Manage your password in your {profile.auth_provider} account settings.
                            </p>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className="p-6 bg-red-50">
                        <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
                            <TrashIcon className="h-5 w-5" />
                            Danger Zone
                        </h3>
                        <p className="text-red-700 text-sm mb-4">
                            Deleting your account will remove all your saved searches, favorites, and personal data.
                            This action cannot be undone.
                        </p>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Password Change Modal */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                            <h3 className="text-xl font-semibold mb-4">Change Password</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-600 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handlePasswordChange}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
                                >
                                    {isSaving ? 'Changing...' : 'Change Password'}
                                </button>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Account Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                            <h3 className="text-xl font-semibold text-red-900 mb-2">Delete Account</h3>
                            <p className="text-stone-500 mb-6">
                                Are you sure you want to delete your account? This action cannot be undone
                                and all your data will be permanently removed.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isSaving ? 'Deleting...' : 'Yes, Delete My Account'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
