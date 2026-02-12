"use client";

import { useState } from "react";
import { formatContentText } from "../lib/formatters";

type FAQ = {
    _id: string;
    question: string;
    answer: string;
    schemaEnabled?: boolean;
};

type TownFAQsProps = {
    faqs: FAQ[];
    townName: string;
};

export default function TownFAQs({ faqs, townName }: TownFAQsProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (!faqs || faqs.length === 0) {
        return null;
    }

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFAQ(index);
        }
    };

    return (
        <div className="space-y-4">
            {faqs.map((faq, index) => (
                <div
                    key={faq._id}
                    className="border border-stone-200 rounded-lg overflow-hidden bg-white"
                >
                    <button
                        type="button"
                        onClick={() => toggleFAQ(index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        aria-expanded={openIndex === index}
                        aria-controls={`faq-answer-${faq._id}`}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-stone-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 pr-4">
                            {formatContentText(faq.question)}
                        </h3>
                        <span
                            className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${openIndex === index ? "rotate-180" : ""
                                }`}
                            aria-hidden="true"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5 7.5L10 12.5L15 7.5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </button>
                    <div
                        id={`faq-answer-${faq._id}`}
                        role="region"
                        aria-labelledby={`faq-question-${faq._id}`}
                        className={`overflow-hidden transition-all duration-200 ${openIndex === index ? "max-h-96" : "max-h-0"
                            }`}
                    >
                        <div className="px-5 pb-5 text-slate-600 leading-relaxed border-t border-stone-100 pt-4">
                            {formatContentText(faq.answer)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
