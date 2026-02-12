import { useState } from "react";
import { Listing } from "../lib/data/providers/listings.types";

export default function ListingInquiryModal({
    listing,
    onClose,
}: {
    listing: Listing;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: `I'm interested in ${listing.address.street}. Please contact me with more information.`,
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
        "idle"
    );
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        setErrorMsg("");

        try {
            const res = await fetch("/api/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData, // name, email, phone, message
                    source: "listing-inquiry",
                    listingId: listing.id,
                    listingUrl: window.location.href, // Current URL typically includes search params, maybe not specific listing URL if modal.
                    listingAddress: `${listing.address.street}, ${listing.address.city}, ${listing.address.state} ${listing.address.zip}`,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit inquiry");
            }

            setStatus("success");
            // Optional: Close after delay
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            console.error(err);
            setStatus("error");
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    if (status === "success") {
        return (
            <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-stone-900">Inquiry Sent!</h3>
                    <p className="mt-2 text-stone-600">
                        Thanks for your interest in {listing.address.street}. Matt will reach out to you shortly.
                    </p>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full rounded-full bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-stone-900">Contact Matt</h3>
                        <p className="text-sm text-stone-500">regarding {listing.address.street}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 sm:text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Jane Doe"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 sm:text-sm"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jane@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            required
                            className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 sm:text-sm"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-stone-700">
                            Message
                        </label>
                        <textarea
                            id="message"
                            rows={4}
                            className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 sm:text-sm"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>

                    {errorMsg && (
                        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-600">
                            {errorMsg}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={status === "submitting"}
                            className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {status === "submitting" ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </span>
                            ) : (
                                "Send Message"
                            )}
                        </button>
                        <p className="mt-2 text-center text-xs text-stone-400">
                            By submitting this form, you agree to being contacted regarding your real estate needs.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
