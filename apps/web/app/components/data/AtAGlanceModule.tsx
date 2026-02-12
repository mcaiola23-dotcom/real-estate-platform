'use client';

/**
 * AtAGlanceModule - Demographics snapshot from ACS data
 * 
 * Displays comprehensive demographic data for towns with a modern,
 * professional UI featuring a dark header and tabbed sections.
 */

import { useState } from 'react';
import {
    getAtAGlanceForTown,
    formatCurrency,
    formatNumber,
    formatPercent,
    AtAGlanceData,
} from '../../lib/data/providers/atAGlance.provider';

// Icons as simple SVG components
const PopulationIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const AgeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DensityIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const IncomeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface AtAGlanceModuleProps {
    townSlug: string;
    townName: string;
    isNeighborhoodContext?: boolean;
}

type TabType = 'population' | 'households' | 'education';

export function AtAGlanceModule({
    townSlug,
    townName,
    isNeighborhoodContext = false,
}: AtAGlanceModuleProps) {
    const [activeTab, setActiveTab] = useState<TabType>('population');
    const result = getAtAGlanceForTown(townSlug);

    if (!result.data) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Demographics</h3>
                <p className="text-stone-500">Demographics data not available</p>
            </div>
        );
    }

    const { data } = result;
    const title = isNeighborhoodContext ? `Overview for ${townName}, CT` : `Overview for ${townName}, CT`;
    const subtitle = `${formatNumber(data.population)} people live in ${townName}, where the median age is ${data.medianAge} and the average individual income is ${data.perCapitaIncome ? formatCurrency(data.perCapitaIncome) : 'N/A'}. Data provided by the U.S. Census Bureau.`;

    return (
        <div className="rounded-lg overflow-hidden shadow-sm border border-stone-200">
            {/* Dark Header Section */}
            <div className="bg-stone-900 text-white p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-serif font-medium mb-3">{title}</h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
                    {subtitle}
                </p>

                {/* Key Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                    <HeaderStat
                        icon={<PopulationIcon />}
                        value={formatNumber(data.population)}
                        label="TOTAL POPULATION"
                    />
                    <HeaderStat
                        icon={<AgeIcon />}
                        value={`${data.medianAge} YEARS`}
                        label="MEDIAN AGE"
                    />
                    <HeaderStat
                        icon={<DensityIcon />}
                        value={data.densityLabel || 'N/A'}
                        label="POPULATION DENSITY"
                    />
                    <HeaderStat
                        icon={<IncomeIcon />}
                        value={data.perCapitaIncome ? formatCurrency(data.perCapitaIncome) : 'N/A'}
                        label="AVG INDIVIDUAL INCOME"
                    />
                </div>
            </div>

            {/* Tabbed Content Section */}
            <div className="bg-white">
                {/* Tab Navigation */}
                <div className="border-b border-stone-200 px-4 md:px-6">
                    <div className="flex gap-1">
                        <TabButton
                            active={activeTab === 'population'}
                            onClick={() => setActiveTab('population')}
                        >
                            Population
                        </TabButton>
                        <TabButton
                            active={activeTab === 'households'}
                            onClick={() => setActiveTab('households')}
                        >
                            Households
                        </TabButton>
                        <TabButton
                            active={activeTab === 'education'}
                            onClick={() => setActiveTab('education')}
                        >
                            Education
                        </TabButton>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 md:p-6">
                    {activeTab === 'population' && <PopulationTab data={data} townName={townName} />}
                    {activeTab === 'households' && <HouseholdsTab data={data} />}
                    {activeTab === 'education' && <EducationTab data={data} />}
                </div>

                {/* Source Attribution */}
                <div className="px-4 md:px-6 pb-4 text-xs text-stone-400">
                    Source: {result.source} ({result.asOf}) · <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">View data</a>
                </div>
            </div>
        </div>
    );
}

function HeaderStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="text-slate-400 mt-0.5">{icon}</div>
            <div>
                <div className="text-lg md:text-xl font-semibold text-white">{value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${active
                    ? 'text-slate-900'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
        >
            {children}
            {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
            )}
        </button>
    );
}

function PopulationTab({ data, townName }: { data: AtAGlanceData; townName: string }) {
    const ageGroups = data.ageGroups;

    return (
        <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
                {formatNumber(data.population)} people call {townName} home. The population density is {data.populationDensity ? formatNumber(data.populationDensity) : 'N/A'} and the largest age group is between 25 and 64 years old. Data provided by the U.S. Census Bureau.
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-stone-100">
                <QuickStat value={formatNumber(data.population)} label="TOTAL POPULATION" />
                <QuickStat value={data.densityLabel || 'N/A'} label="POPULATION DENSITY" />
                <QuickStat value={data.medianAge.toString()} label="MEDIAN AGE" />
                <QuickStat
                    value={`${data.malePercent?.toFixed(1) || '~49'} / ${data.femalePercent?.toFixed(1) || '~51'}%`}
                    label="MEN VS WOMEN"
                />
            </div>

            {/* Age Distribution & Gender */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Age Groups */}
                {ageGroups && (
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Population by Age Group
                        </h4>
                        <div className="space-y-3">
                            <AgeBar label="0-17 Years" value={ageGroups.under18} />
                            <AgeBar label="18-24 Years" value={ageGroups.age18to24} />
                            <AgeBar label="25-44 Years" value={ageGroups.age25to44} />
                            <AgeBar label="45-64 Years" value={ageGroups.age45to64} />
                            <AgeBar label="65+ Years" value={ageGroups.age65plus} />
                        </div>
                    </div>
                )}

                {/* Gender Split */}
                {data.malePercent && data.femalePercent && (
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            Gender Distribution
                        </h4>
                        <div className="flex h-8 rounded-lg overflow-hidden">
                            <div
                                className="bg-stone-600 flex items-center justify-center text-white text-xs font-medium"
                                style={{ width: `${data.malePercent}%` }}
                            >
                                {data.malePercent.toFixed(1)}%
                            </div>
                            <div
                                className="bg-pink-400 flex items-center justify-center text-white text-xs font-medium"
                                style={{ width: `${data.femalePercent}%` }}
                            >
                                {data.femalePercent.toFixed(1)}%
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>Male</span>
                            <span>Female</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function HouseholdsTab({ data }: { data: AtAGlanceData }) {
    return (
        <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
                Housing statistics for this community including ownership rates, home values, and housing characteristics.
            </p>

            {/* Housing Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-stone-100">
                <QuickStat value={formatNumber(data.totalHousingUnits || 0)} label="HOUSING UNITS" />
                <QuickStat value={formatPercent(data.ownerOccupiedPercent)} label="OWNER-OCCUPIED" />
                <QuickStat value={data.medianYearBuilt.toString()} label="MEDIAN YEAR BUILT" />
                <QuickStat
                    value={data.medianHomeValue ? formatCurrency(data.medianHomeValue, data.homeValueNote) : 'N/A'}
                    label="MEDIAN HOME VALUE"
                />
            </div>

            {/* Income Stats */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-stone-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Median Household Income
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {formatCurrency(data.medianHouseholdIncome, data.incomeNote)}
                    </div>
                    {data.incomeNote && (
                        <p className="text-xs text-amber-600 mt-1">
                            Census top-coded: actual median may be higher
                        </p>
                    )}
                </div>
                <div className="bg-stone-50 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Per Capita Income
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        {data.perCapitaIncome ? formatCurrency(data.perCapitaIncome) : 'N/A'}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Average income per person
                    </p>
                </div>
            </div>

            {/* Ownership Bar */}
            <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Housing Ownership
                </h4>
                <div className="flex h-8 rounded-lg overflow-hidden">
                    <div
                        className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${data.ownerOccupiedPercent}%` }}
                    >
                        {data.ownerOccupiedPercent.toFixed(1)}% Owner
                    </div>
                    <div
                        className="bg-amber-400 flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${100 - data.ownerOccupiedPercent}%` }}
                    >
                        {(100 - data.ownerOccupiedPercent).toFixed(1)}% Renter
                    </div>
                </div>
            </div>
        </div>
    );
}

function EducationTab({ data }: { data: AtAGlanceData }) {
    const edu = data.education;

    if (!edu) {
        return (
            <div className="py-8 text-center text-stone-500">
                Education data not available for this location.
            </div>
        );
    }

    const eduData = [
        { label: 'Less Than 9th Grade', value: edu.lessHighSchool, color: 'bg-slate-400' },
        { label: 'High School Degree', value: edu.highSchool, color: 'bg-slate-500' },
        { label: 'Some College / Associate', value: edu.someCollege, color: 'bg-slate-600' },
        { label: "Bachelor's Degree", value: edu.bachelors, color: 'bg-stone-700' },
        { label: 'Graduate Degree', value: edu.graduate, color: 'bg-stone-800' },
    ];

    // Calculate population counts
    const total = data.population;
    const over25 = total * 0.72; // Rough estimate of 25+ population

    return (
        <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
                Educational attainment for residents 25 years and older. This community has a highly educated population.
            </p>

            {/* Education Bar */}
            <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Education Level
                </h4>
                <div className="flex h-8 rounded-lg overflow-hidden">
                    {eduData.map((item, i) => (
                        <div
                            key={i}
                            className={`${item.color} flex items-center justify-center text-white text-xs font-medium`}
                            style={{ width: `${item.value}%` }}
                            title={`${item.label}: ${item.value}%`}
                        >
                            {item.value >= 10 ? `${item.value.toFixed(0)}%` : ''}
                        </div>
                    ))}
                </div>
            </div>

            {/* Education Breakdown List */}
            <div className="space-y-3">
                {eduData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm text-slate-700">{item.label}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-medium text-slate-900">
                                {formatNumber(Math.round(over25 * item.value / 100))}
                            </span>
                            <span className="text-sm text-slate-400 ml-2">({item.value}%)</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Highlight */}
            <div className="bg-stone-100 rounded-lg p-4 border border-stone-200">
                <div className="text-sm text-stone-800">
                    <strong>{(edu.bachelors + edu.graduate).toFixed(0)}%</strong> of residents hold a bachelor&apos;s degree or higher — well above the national average of 33%.
                </div>
            </div>
        </div>
    );
}

function QuickStat({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <div className="text-xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
        </div>
    );
}

function AgeBar({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1">
                <div className="h-6 bg-stone-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-slate-700 rounded-full"
                        style={{ width: `${value * 2.5}%` }} // Scale for visibility
                    />
                </div>
            </div>
            <div className="text-right text-sm text-slate-600 w-24">{label}</div>
        </div>
    );
}

export default AtAGlanceModule;
