"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SignOutPage() {
    const { signOut } = useClerk();

    useEffect(() => {
        signOut({ redirectUrl: "/" });
    }, [signOut]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-stone-600">Signing out...</p>
            </div>
        </div>
    );
}
