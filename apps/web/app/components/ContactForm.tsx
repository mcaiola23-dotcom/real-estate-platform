"use client";

import { useState } from "react";

const INTEREST_OPTIONS = [
    { value: "", label: "Select an option..." },
    { value: "buying", label: "Buying a Home" },
    { value: "selling", label: "Selling a Home" },
    { value: "renting", label: "Renting" },
    { value: "investing", label: "Investing in Real Estate" },
    { value: "commercial", label: "Commercial Real Estate" },
    { value: "other", label: "Other" },
];

export default function ContactForm() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        interest: "",
        message: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const response = await fetch("/api/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source: "contact",
                    ...formData
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit");
            }

            setStatus("success");
            setFormData({ name: "", email: "", phone: "", interest: "", message: "" });
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    if (status === "success") {
        return (
            <div className="bg-stone-100 border border-stone-300 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-xl font-serif font-medium text-stone-900 mb-2">Message Sent!</h3>
                <p className="text-stone-600 mb-6">Thank you for reaching out. Matt will get back to you shortly.</p>
                <button
                    onClick={() => setStatus("idle")}
                    className="text-stone-700 hover:text-stone-900 font-medium transition-colors"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {status === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
                    Something went wrong. Please try again or call Matt directly.
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                <input
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-3 px-4 border bg-white"
                    placeholder="Your full name"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-lg border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-3 px-4 border bg-white"
                        placeholder="you@email.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Phone <span className="text-red-500">*</span></label>
                    <input
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded-lg border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-3 px-4 border bg-white"
                        placeholder="(555) 123-4567"
                    />
                </div>
            </div>

            {/* C1: Interest Dropdown */}
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">I'm Interested In</label>
                <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    className="w-full rounded-lg border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-3 px-4 border bg-white text-stone-700"
                >
                    {INTEREST_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Message <span className="text-red-500">*</span></label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-lg border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-3 px-4 border bg-white"
                    placeholder="Tell me about your real estate goals..."
                />
            </div>

            {/* C4: Button Color - Stone instead of Blue */}
            <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-3.5 px-4 rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === "loading" ? "Sending..." : "Send Message"}
            </button>

            <p className="text-xs text-stone-500 text-center">
                By submitting this form, you agree to be contacted regarding real estate services.
            </p>
        </form>
    );
}
