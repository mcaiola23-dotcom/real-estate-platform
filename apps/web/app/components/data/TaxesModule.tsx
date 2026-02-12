'use client';

/**
 * TaxesModule - Property tax information
 * 
 * Displays mill rate and includes an interactive calculator.
 * Clean, professional design matching other modules.
 */

import { useState } from 'react';
import {
    getTaxesForTown,
    calculatePropertyTax,
    formatTaxAmount,
} from '../../lib/data/providers/taxes.provider';

// Default home values for calculator (used when ACS data is top-coded or unavailable)
const DEFAULT_HOME_VALUES: Record<string, number> = {
    'darien': 1800000,
    'fairfield': 700000,
    'greenwich': 1500000,
    'new-canaan': 1500000,
    'norwalk': 500000,
    'ridgefield': 750000,
    'stamford': 600000,
    'westport': 1400000,
    'wilton': 850000,
};

const ExternalLinkIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const CalculatorIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

interface TaxesModuleProps {
    townSlug: string;
    townName: string;
    isNeighborhoodContext?: boolean;
}

export function TaxesModule({
    townSlug,
    townName,
    isNeighborhoodContext = false,
}: TaxesModuleProps) {
    const result = getTaxesForTown(townSlug);
    const defaultValue = DEFAULT_HOME_VALUES[townSlug] || 750000;
    const [homeValue, setHomeValue] = useState<number>(defaultValue);
    const [inputValue, setInputValue] = useState<string>(defaultValue.toLocaleString());

    if (!result.data) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-2">Property Taxes</h3>
                <p className="text-stone-500">Tax data not available</p>
            </div>
        );
    }

    const { data } = result;
    const calculatedTax = calculatePropertyTax(homeValue, data.millRate, data.assessmentRatio);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const num = parseInt(raw, 10) || 0;
        setInputValue(num.toLocaleString());
        setHomeValue(num);
    };

    const title = isNeighborhoodContext
        ? `Property Taxes in ${townName}`
        : `Property Taxes in ${townName}, CT`;

    return (
        <div className="rounded-lg overflow-hidden shadow-sm border border-stone-200 bg-white">
            {/* Header with Mill Rate */}
            <div className="bg-stone-900 text-white p-6">
                <h2 className="text-2xl font-serif font-medium mb-1">{title}</h2>
                <p className="text-stone-400 text-sm">
                    Current mill rate and tax calculator for {townName} properties.
                </p>

                <div className="mt-6 flex items-end justify-between">
                    <div>
                        <div className="text-4xl font-bold">{data.millRate.toFixed(2)}</div>
                        <div className="text-stone-400 text-sm mt-1">
                            Mill Rate · FY {data.fiscalYear}
                        </div>
                    </div>
                    <a
                        href={data.assessorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-stone-400 hover:text-white inline-flex items-center gap-1"
                    >
                        Town Assessor
                        <ExternalLinkIcon />
                    </a>
                </div>
            </div>

            {/* How it Works */}
            <div className="p-4 md:p-6 border-b border-stone-100">
                <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-3">
                    How CT Property Tax Works
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                    Connecticut assesses property at <strong>{data.assessmentRatio}%</strong> of fair market value.
                    Your annual property tax is calculated using the following formula:
                </p>
                <div className="mt-3 bg-stone-50 rounded-lg p-3 font-mono text-sm text-stone-700 text-center">
                    (Market Value × 0.70 × {data.millRate}) ÷ 1,000 = <span className="font-bold">Annual Tax</span>
                </div>
            </div>

            {/* Interactive Calculator */}
            <div className="p-4 md:p-6 bg-stone-50">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
                        <CalculatorIcon />
                    </div>
                    <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider">
                        Tax Calculator
                    </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Input */}
                    <div>
                        <label className="block text-sm text-stone-600 mb-2">
                            Enter Home Value
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                className="w-full pl-8 pr-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 text-xl font-semibold bg-white"
                                placeholder="Enter value"
                            />
                        </div>
                        <p className="text-xs text-stone-500 mt-2">
                            Default: estimated median home value for {townName}
                        </p>
                    </div>

                    {/* Result */}
                    <div className="bg-white rounded-lg p-4 border border-stone-300">
                        <div className="text-sm text-stone-600 mb-1">Estimated Annual Property Tax</div>
                        <div className="text-3xl font-bold text-stone-900">
                            {formatTaxAmount(calculatedTax)}
                        </div>
                        <div className="text-sm text-stone-500 mt-2">
                            {formatTaxAmount(calculatedTax / 12)}/month
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-6 py-4 bg-stone-100 border-t border-stone-200">
                <p className="text-xs text-stone-500">
                    <strong>Disclaimer:</strong> Estimate only. Actual taxes depend on assessed value and any applicable exemptions.
                    Contact the town assessor for official calculations.
                </p>
                <p className="text-xs text-stone-400 mt-2">
                    Source: {result.source} · {result.methodology}
                </p>
            </div>
        </div>
    );
}

export default TaxesModule;
