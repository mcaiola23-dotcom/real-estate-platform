"use client";

import { useState } from "react";

export default function ValuationForm() {
    const [step, setStep] = useState<"input" | "loading" | "result">("input");
    const [valuation, setValuation] = useState<any>(null);
    const [formData, setFormData] = useState({
        address: "",
        propertyType: "single-family",
        beds: "",
        baths: "",
        sqft: "",
        email: "",
        phone: "",
        timeframe: "curious",
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep("loading");
        setError(null);

        try {
            // 1. Prepare Property Data
            const propertyPayload = {
                address: formData.address,
                propertyType: formData.propertyType,
                beds: formData.beds,
                baths: formData.baths,
                sqft: formData.sqft,
            };

            // 2. Submit to Lead API (Fire and Forget or parallel await)
            const leadPayload = {
                ...formData,
                propertyDetails: propertyPayload,
            };

            // We run both in parallel but prioritize the interface responding to the valuation
            const [valResponse, leadResponse] = await Promise.all([
                fetch("/api/valuation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(propertyPayload),
                }),
                fetch("/api/lead", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(leadPayload),
                }),
            ]);

            if (!leadResponse.ok) {
                console.error("Failed to capture lead");
                // Non-blocking for user flow
            }

            const valData = await valResponse.json();

            if (!valResponse.ok) {
                throw new Error(valData.message || "Something went wrong.");
            }

            setValuation(valData);
            setStep("result");

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred. Please try again.");
            setStep("input");
        }
    };

    if (step === "loading") {
        return (
            <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600 mx-auto mb-4"></div>
                <p className="text-lg text-stone-600">Analyzing property details...</p>
            </div>
        );
    }

    if (step === "result") {
        const isReview = valuation?.status === "needs_review";

        return (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-stone-100 text-center">
                <h2 className="text-3xl font-bold mb-6 text-stone-900">
                    {isReview ? "Expert Analysis Needed" : "Your Home Value Estimate"}
                </h2>

                {isReview ? (
                    <div className="bg-stone-100 p-6 rounded-lg mb-8">
                        <p className="text-lg text-stone-800 mb-4">
                            {valuation.reason || "We need a closer look to give you an accurate number."}
                        </p>
                        <p className="text-stone-600">
                            Your property details have been sent to our team. We will review the unique features of your home and contact you shortly with a personalized CMA (Comparative Market Analysis).
                        </p>
                    </div>
                ) : (
                    <div className="mb-8 p-8 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-sm text-green-700 font-semibold uppercase tracking-wider mb-2">Estimated Range</p>
                        <div className="text-4xl md:text-5xl font-extrabold text-stone-900 text-green-800">
                            ${valuation.low.toLocaleString()} - ${valuation.high.toLocaleString()}
                        </div>
                        <p className="mt-4 text-sm text-stone-500">
                            Confidence: <span className="font-medium capitalize">{valuation.confidence}</span>
                        </p>
                    </div>
                )}

                <p className="text-stone-600 mb-8">
                    {isReview
                        ? "In the meantime, feel free to call us directly if you have immediate questions."
                        : "This is a preliminary estimate based on market averages. For a precise valuation for selling purposes, an in-person walkthrough is recommended."
                    }
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="text-stone-600 hover:text-stone-900 font-medium hover:underline"
                >
                    Start New Estimate
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-stone-200">

            {/* Disclaimer Block */}
            <div className="bg-stone-50 p-4 rounded-md mb-8 text-sm text-stone-600 border-l-4 border-stone-400">
                <strong>Note:</strong> This tool provides an instant automated estimate for informational purposes only. It is not an appraisal. Actual market value may vary based on condition, improvements, and current inventory.
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Property Details */}
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Property Address</label>
                    <input
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                        placeholder="123 Main St, Fairfield, CT"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Property Type</label>
                        <select
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={handleChange}
                            className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                        >
                            <option value="single-family">Single Family</option>
                            <option value="condo">Condo</option>
                            <option value="multi-family">Multi-Family</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Sq. Footage (Optional)</label>
                        <input
                            name="sqft"
                            type="number"
                            value={formData.sqft}
                            onChange={handleChange}
                            className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                            placeholder="e.g. 2500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Beds</label>
                        <input
                            name="beds"
                            type="number"
                            required
                            value={formData.beds}
                            onChange={handleChange}
                            className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                            placeholder="3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Baths</label>
                        <input
                            name="baths"
                            type="number"
                            required
                            value={formData.baths}
                            onChange={handleChange}
                            step="0.5"
                            className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                            placeholder="2.5"
                        />
                    </div>
                </div>

                <div className="border-t pt-6 border-stone-200">
                    <h3 className="text-lg font-semibold text-stone-900 mb-4">Contact Information</h3>
                    <p className="text-sm text-stone-500 mb-4">Where should we send your official report?</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                            <input
                                name="phone"
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">How soon are you selling?</label>
                        <select
                            name="timeframe"
                            value={formData.timeframe}
                            onChange={handleChange}
                            className="w-full rounded-md border-stone-300 shadow-sm focus:border-stone-500 focus:ring-stone-500 py-2 px-3 border"
                        >
                            <option value="selling-soon">Selling Soon (ASAP)</option>
                            <option value="3-6-months">3-6 Months</option>
                            <option value="6-12-months">6-12 Months</option>
                            <option value="curious">Just Curious</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md text-lg mt-4"
                >
                    Get My Estimate
                </button>
            </div>
        </form>
    );
}
