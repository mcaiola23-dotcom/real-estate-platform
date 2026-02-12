"use client";

import { useState, useMemo } from "react";

interface MortgageCalculatorProps {
    initialHomePrice?: number;
}

export default function MortgageCalculator({ initialHomePrice = 750000 }: MortgageCalculatorProps) {
    const [homePrice, setHomePrice] = useState(initialHomePrice);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [interestRate, setInterestRate] = useState(6.5);
    const [loanTerm, setLoanTerm] = useState(30);

    const { monthlyPayment, principalInterest, taxes, insurance, downPaymentAmount } = useMemo(() => {
        const downPayment = homePrice * (downPaymentPercent / 100);
        const loanAmount = homePrice - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const numPayments = loanTerm * 12;

        let pi = 0;
        if (monthlyRate > 0) {
            pi = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                (Math.pow(1 + monthlyRate, numPayments) - 1);
        } else {
            pi = loanAmount / numPayments;
        }

        const taxesMonthly = (homePrice * 0.015) / 12;
        const insuranceMonthly = (homePrice * 0.0035) / 12;
        const total = pi + taxesMonthly + insuranceMonthly;

        return {
            monthlyPayment: Math.round(total),
            principalInterest: Math.round(pi),
            taxes: Math.round(taxesMonthly),
            insurance: Math.round(insuranceMonthly),
            downPaymentAmount: Math.round(downPayment),
        };
    }, [homePrice, downPaymentPercent, interestRate, loanTerm]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handlePriceInput = (value: string) => {
        const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num >= 0 && num <= 10000000) {
            setHomePrice(num);
        }
    };

    const handleDownPaymentInput = (value: string) => {
        const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num >= 0 && num <= 100) {
            setDownPaymentPercent(num);
        }
    };

    const handleRateInput = (value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0 && num <= 15) {
            setInterestRate(num);
        }
    };

    return (
        <section className="py-20 bg-stone-900 text-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase mb-3">
                        Plan Your Purchase
                    </p>
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-2">
                        Mortgage Calculator
                    </h2>
                    <p className="text-stone-400 max-w-xl mx-auto">
                        Estimate your monthly payment for Fairfield County homes with our interactive calculator.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Inputs Panel */}
                        <div className="border border-stone-700 rounded-lg p-8">
                            <h3 className="text-lg font-semibold text-white mb-6">Loan Details</h3>

                            <div className="space-y-6">
                                {/* Home Price */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-stone-300">
                                            Home Price
                                        </label>
                                        <input
                                            type="text"
                                            value={formatCurrency(homePrice)}
                                            onChange={(e) => handlePriceInput(e.target.value)}
                                            className="w-32 px-3 py-1.5 bg-stone-800 border border-stone-600 rounded text-white text-right text-sm focus:outline-none focus:border-white transition-colors"
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min={200000}
                                        max={5000000}
                                        step={25000}
                                        value={homePrice}
                                        onChange={(e) => setHomePrice(Number(e.target.value))}
                                        className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <div className="flex justify-between text-xs text-stone-600 mt-1">
                                        <span>$200K</span>
                                        <span>$5M</span>
                                    </div>
                                </div>

                                {/* Down Payment */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-stone-300">
                                            Down Payment
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={`${downPaymentPercent}%`}
                                                onChange={(e) => handleDownPaymentInput(e.target.value)}
                                                className="w-16 px-3 py-1.5 bg-stone-800 border border-stone-600 rounded text-white text-right text-sm focus:outline-none focus:border-white transition-colors"
                                            />
                                            <span className="text-stone-500 text-sm">
                                                ({formatCurrency(downPaymentAmount)})
                                            </span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min={5}
                                        max={50}
                                        step={5}
                                        value={downPaymentPercent}
                                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                        className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <div className="flex justify-between text-xs text-stone-600 mt-1">
                                        <span>5%</span>
                                        <span>50%</span>
                                    </div>
                                </div>

                                {/* Interest Rate */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-stone-300">
                                            Interest Rate
                                        </label>
                                        <input
                                            type="text"
                                            value={`${interestRate}%`}
                                            onChange={(e) => handleRateInput(e.target.value.replace("%", ""))}
                                            className="w-20 px-3 py-1.5 bg-stone-800 border border-stone-600 rounded text-white text-right text-sm focus:outline-none focus:border-white transition-colors"
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min={3}
                                        max={10}
                                        step={0.125}
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <div className="flex justify-between text-xs text-stone-600 mt-1">
                                        <span>3%</span>
                                        <span>10%</span>
                                    </div>
                                </div>

                                {/* Loan Term */}
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-3">
                                        Loan Term
                                    </label>
                                    <div className="flex gap-3">
                                        {[15, 20, 30].map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => setLoanTerm(term)}
                                                className={`flex-1 py-2.5 px-4 rounded-none border font-medium transition-colors ${loanTerm === term
                                                    ? "bg-white text-stone-900 border-white"
                                                    : "bg-transparent text-stone-400 border-stone-600 hover:border-stone-400 hover:text-white"
                                                    }`}
                                            >
                                                {term} yr
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Panel */}
                        <div className="border border-stone-700 rounded-lg p-8 flex flex-col">
                            <h3 className="text-lg font-semibold text-white mb-6">Payment Breakdown</h3>

                            <div className="text-center py-6 mb-6 bg-stone-800/50 rounded-lg">
                                <p className="text-sm font-medium text-stone-400 mb-1">Estimated Monthly Payment</p>
                                <p className="text-5xl font-bold text-white">{formatCurrency(monthlyPayment)}</p>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="flex justify-between items-center py-3 border-b border-stone-700/50">
                                    <span className="text-stone-400">Principal & Interest</span>
                                    <span className="font-semibold text-white">{formatCurrency(principalInterest)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-stone-700/50">
                                    <span className="text-stone-400">Property Taxes (est.)</span>
                                    <span className="font-semibold text-white">{formatCurrency(taxes)}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-stone-700/50">
                                    <span className="text-stone-400">Home Insurance (est.)</span>
                                    <span className="font-semibold text-white">{formatCurrency(insurance)}</span>
                                </div>
                            </div>

                            <p className="text-xs text-stone-600 mt-6 text-center">
                                *Estimates based on typical Fairfield County rates. Actual costs may vary.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
