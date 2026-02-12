"use client";

import { useState } from "react";

export default function EmailSignupSection() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");

        // TODO: Integrate with email service (Mailchimp, ConvertKit, etc.)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setStatus("success");
        setEmail("");

        setTimeout(() => setStatus("idle"), 3000);
    };

    return (
        <section className="py-12 bg-stone-100 border-t border-stone-200">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left mb-6 md:mb-0 md:-mt-2">
                        <h3 className="text-3xl font-serif font-medium text-stone-900 mb-3">
                            Stay Updated
                        </h3>
                        <p className="text-stone-600 text-base max-w-md">
                            Get the latest market insights and new listings delivered to your inbox.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex-shrink-0">
                        <form onSubmit={handleSubmit} className="flex w-full md:w-[400px]">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 bg-white border border-stone-300 text-stone-900 placeholder-stone-500 focus:outline-none focus:border-stone-500 transition-colors rounded-none"
                                required
                                disabled={status === "loading" || status === "success"}
                            />
                            <button
                                type="submit"
                                disabled={status === "loading" || status === "success"}
                                className={`px-6 py-3 font-medium transition-colors rounded-none whitespace-nowrap ${status === "success"
                                    ? "bg-green-600 text-white"
                                    : "bg-stone-900 text-white hover:bg-stone-800"
                                    }`}
                            >
                                {status === "loading" && "Subscribing..."}
                                {status === "success" && "Subscribed!"}
                                {(status === "idle" || status === "error") && "Sign Up"}
                            </button>
                        </form>
                        <p className="text-xs text-stone-500 mt-3 text-center md:text-left">
                            No spam, unsubscribe anytime.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
