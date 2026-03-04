'use client'

import { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Cog6ToothIcon, HeartIcon, BookmarkIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from './AuthProvider'
import LoginModal from './LoginModal'

export default function UserMenu() {
    const { isAuthenticated, isLoading, user, signOut } = useAuth()
    const [showLoginModal, setShowLoginModal] = useState(false)

    if (isLoading) {
        return (
            <div className="h-10 w-10 rounded-full bg-stone-200 animate-pulse" />
        )
    }

    if (!isAuthenticated) {
        return (
            <>
                <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors uppercase tracking-wide"
                >
                    Sign In
                </button>
                <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
            </>
        )
    }

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' })
    }

    return (
        <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors">
                {user?.image ? (
                    <img
                        src={user.image}
                        alt={user.name || 'User'}
                        className="h-8 w-8 rounded-full"
                    />
                ) : (
                    <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center">
                        <span className="text-stone-700 font-medium text-sm">
                            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                )}
                <span className="hidden sm:inline text-stone-600 font-medium">
                    {user?.name?.split(' ')[0] || 'Account'}
                </span>
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-stone-100 rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
                    {/* User Info */}
                    <div className="px-4 py-3">
                        <p className="text-sm font-medium text-stone-900">{user?.name || 'User'}</p>
                        <p className="text-sm text-stone-500 truncate">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href="/profile"
                                    className={`${active ? 'bg-stone-50' : ''} flex items-center gap-3 px-4 py-2 text-sm text-stone-600`}
                                >
                                    <Cog6ToothIcon className="h-5 w-5 text-stone-400" />
                                    Profile & Settings
                                </a>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href="/favorites"
                                    className={`${active ? 'bg-stone-50' : ''} flex items-center gap-3 px-4 py-2 text-sm text-stone-600`}
                                >
                                    <HeartIcon className="h-5 w-5 text-stone-400" />
                                    Saved Properties
                                </a>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href="/saved-searches"
                                    className={`${active ? 'bg-stone-50' : ''} flex items-center gap-3 px-4 py-2 text-sm text-stone-600`}
                                >
                                    <BookmarkIcon className="h-5 w-5 text-stone-400" />
                                    Saved Searches
                                </a>
                            )}
                        </Menu.Item>
                    </div>

                    {/* Sign Out */}
                    <div className="py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={handleSignOut}
                                    className={`${active ? 'bg-stone-50' : ''} flex w-full items-center gap-3 px-4 py-2 text-sm text-stone-600`}
                                >
                                    <ArrowRightOnRectangleIcon className="h-5 w-5 text-stone-400" />
                                    Sign Out
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    )
}
