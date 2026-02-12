"use client";

import { useState, useMemo } from "react";

interface ClosingCostEstimatorProps {
    initialSalePrice?: number;
}

export default function ClosingCostEstimator({ initialSalePrice = 1000000 }: ClosingCostEstimatorProps) {
    const [salePrice, setSalePrice] = useState(initialSalePrice);

    const costs = useMemo(() => {
        // Connecticut-specific closing costs for sellers
        const commissionRate = 0.05; // 5% total commission (typical)
        const conveyanceTaxRate = salePrice > 800000 ? 0.0125 : 0.0075; // CT conveyance tax
        const attorneyFees = 1500; // Typical attorney fees
        const titleInsurance = salePrice * 0.004; // ~0.4% for owner's policy
        const recordingFees = 150;
        const propTaxProration = (salePrice * 0.018) / 12; // ~1 month estimate
        const miscFees = 500; // HOA docs, survey, misc

        const commission = salePrice * commissionRate;
        const conveyanceTax = salePrice * conveyanceTaxRate;

        const totalCosts = commission + conveyanceTax + attorneyFees + titleInsurance + recordingFees + propTaxProration + miscFees;
        const netProceeds = salePrice - totalCosts;

        return {
            commission,
            conveyanceTax,
            attorneyFees,
            titleInsurance,
            recordingFees,
            propTaxProration,
            miscFees,
            totalCosts,
            netProceeds,
        };
    }, [salePrice]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handlePriceInput = (value: string) => {
        const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num >= 0 && num <= 20000000) {
            setSalePrice(num);
        }
    };

    return (
        <section className="py-20 bg-stone-900 text-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <p className="text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase mb-3">
                        Plan Your Sale
                    </p>
                    <h2 className="text-3xl md:text-4xl font-serif font-medium text-white mb-2">
                        Closing Cost Estimator
                    </h2>
                    <p className="text-stone-400 max-w-xl mx-auto">
                        Estimate your net proceeds from selling a home in Connecticut.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Input Panel */}
                        <div className="border border-stone-700 rounded-lg p-8">
                            <h3 className="text-lg font-semibold text-white mb-6">Sale Details</h3>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-stone-300">
                                        Expected Sale Price
                                    </label>
                                    <input
                                        type="text"
                                        value={formatCurrency(salePrice)}
                                        onChange={(e) => handlePriceInput(e.target.value)}
                                        className="w-36 px-3 py-1.5 bg-stone-800 border border-stone-600 rounded text-white text-right text-sm focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min={300000}
                                    max={10000000}
                                    step={50000}
                                    value={salePrice}
                                    onChange={(e) => setSalePrice(Number(e.target.value))}
                                    className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                                <div className="flex justify-between text-xs text-stone-600 mt-1">
                                    <span>$300K</span>
                                    <span>$10M</span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-700">
                                <p className="text-xs text-stone-500 leading-relaxed">
                                    This estimate uses typical Connecticut seller closing costs including 5% commission,
                                    state conveyance tax (0.75% under $800K, 1.25% over), attorney fees, and title insurance.
                                </p>
                            </div>
                        </div>

                        {/* Results Panel */}
                        <div className="border border-stone-700 rounded-lg p-8">
                            <h3 className="text-lg font-semibold text-white mb-6">Cost Breakdown</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-stone-400">Agent Commission (5%)</span>
                                    <span className="font-medium text-white">{formatCurrency(costs.commission)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-stone-400">CT Conveyance Tax</span>
                                    <span className="font-medium text-white">{formatCurrency(costs.conveyanceTax)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-stone-400">Attorney Fees</span>
                                    <span className="font-medium text-white">{formatCurrency(costs.attorneyFees)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-stone-400">Title Insurance</span>
                                    <span className="font-medium text-white">{formatCurrency(costs.titleInsurance)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-stone-400">Recording & Misc Fees</span>
                                    <span className="font-medium text-white">{formatCurrency(costs.recordingFees + costs.miscFees)}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-stone-600">
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-stone-300 font-medium">Total Closing Costs</span>
                                    <span className="font-semibold text-white">{formatCurrency(costs.totalCosts)}</span>
                                </div>
                            </div>

                            <div className="mt-4 py-4 bg-stone-800/50 rounded-lg text-center">
                                <p className="text-sm text-stone-400 mb-1">Estimated Net Proceeds</p>
                                <p className="text-4xl font-bold text-white">{formatCurrency(costs.netProceeds)}</p>
                            </div>

                            <p className="text-xs text-stone-600 mt-4 text-center">
                                *Estimates only. Actual costs depend on specific transaction details.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
