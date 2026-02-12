'use client';

/**
 * SchoolsModule - Public schools directory
 * 
 * Clean, professional design with tabbed interface and CT Report Card links.
 */

import { useState } from 'react';
import {
    getSchoolsForTown,
    getNearbySchoolsForNeighborhood,
    getNeighborhoodSchoolsDisclaimer,
    School,
} from '../../lib/data/providers/schools.provider';

// School building icon
const SchoolIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

type SchoolLevel = 'primary' | 'middle' | 'high';

interface SchoolsModuleProps {
    townSlug: string;
    townName: string;
    neighborhoodCenter?: { lat: number; lng: number };
    isNeighborhoodContext?: boolean;
}

export function SchoolsModule({
    townSlug,
    townName,
    neighborhoodCenter,
    isNeighborhoodContext = false,
}: SchoolsModuleProps) {
    const [activeLevel, setActiveLevel] = useState<SchoolLevel>('primary');

    // Get schools data
    const result = isNeighborhoodContext && neighborhoodCenter
        ? getNearbySchoolsForNeighborhood(townSlug, neighborhoodCenter)
        : getSchoolsForTown(townSlug);

    if (!result) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Schools</h3>
                <p className="text-stone-500">School data not available</p>
            </div>
        );
    }

    const schools = result.schools;
    const elementaryCount = schools.elementary.length;
    const middleCount = schools.middle.length;
    const highCount = schools.high.length;

    const getActiveSchools = () => {
        switch (activeLevel) {
            case 'primary': return schools.elementary;
            case 'middle': return schools.middle;
            case 'high': return schools.high;
        }
    };

    const activeSchools = getActiveSchools();
    const district = 'district' in result ? result.district : result.townDistrict;
    const districtUrl = 'districtUrl' in result ? result.districtUrl : result.townDistrictUrl;
    const disclaimer = isNeighborhoodContext ? getNeighborhoodSchoolsDisclaimer() : null;

    return (
        <div className="rounded-lg overflow-hidden shadow-sm border border-stone-200 bg-white">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-stone-100">
                <h2 className="text-2xl md:text-3xl font-serif italic text-slate-900 mb-2">
                    Schools in {townName}, CT
                </h2>
                <div className="flex flex-wrap gap-2 mt-4">
                    <TabPill
                        active={activeLevel === 'primary'}
                        onClick={() => setActiveLevel('primary')}
                        count={elementaryCount}
                    >
                        Primary Schools
                    </TabPill>
                    <TabPill
                        active={activeLevel === 'middle'}
                        onClick={() => setActiveLevel('middle')}
                        count={middleCount}
                    >
                        Middle Schools
                    </TabPill>
                    <TabPill
                        active={activeLevel === 'high'}
                        onClick={() => setActiveLevel('high')}
                        count={highCount}
                    >
                        High Schools
                    </TabPill>
                </div>
            </div>

            {/* Description */}
            <div className="px-4 md:px-6 py-4 bg-stone-50 border-b border-stone-100">
                <p className="text-sm text-slate-600">
                    The following schools are {isNeighborhoodContext ? 'near' : 'in'} {townName}.
                    School assignment depends on residence address — verify enrollment with the district.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Data provided by the Connecticut State Department of Education.
                </p>
            </div>

            {/* Schools Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3">
                                Type
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3">
                                Name
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 hidden md:table-cell">
                                Category
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3">
                                Grades
                            </th>
                            <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 md:px-6 py-3 hidden lg:table-cell">
                                CT Report Card
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeSchools.map((school, index) => (
                            <SchoolRow
                                key={index}
                                school={school}
                                showDistance={isNeighborhoodContext}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-6 py-4 bg-stone-50 border-t border-stone-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">District:</span>
                        <a
                            href={districtUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-700 hover:underline font-medium inline-flex items-center gap-1"
                        >
                            {district}
                            <ExternalLinkIcon />
                        </a>
                    </div>
                    <a
                        href="https://edsight.ct.gov"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-stone-700 hover:underline inline-flex items-center gap-1"
                    >
                        View all on CT EdSight
                        <ExternalLinkIcon />
                    </a>
                </div>
                {disclaimer && (
                    <p className="text-xs text-amber-600 mt-3 italic">
                        {disclaimer}
                    </p>
                )}
            </div>
        </div>
    );
}

function TabPill({
    active,
    onClick,
    children,
    count
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${active
                    ? 'bg-slate-900 text-white'
                    : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
                }`}
        >
            {children} ({count})
        </button>
    );
}

function SchoolRow({
    school,
    showDistance
}: {
    school: School;
    showDistance: boolean;
}) {
    const ctReportCardUrl = `https://edsight.ct.gov/SASPortal/main.do?schoolSearch=${encodeURIComponent(school.name)}`;

    return (
        <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
            {/* Icon */}
            <td className="px-4 md:px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-slate-500">
                    <SchoolIcon />
                </div>
            </td>

            {/* Name & Address */}
            <td className="px-4 md:px-6 py-4">
                <div className="font-medium text-slate-900 flex items-center gap-2">
                    {school.name}
                    <ExternalLinkIcon />
                </div>
                <div className="text-xs text-slate-500 mt-1 uppercase">
                    {school.address}
                    {showDistance && school.distance !== undefined && (
                        <span className="ml-2 text-stone-600">
                            ~{school.distance} mi away
                        </span>
                    )}
                </div>
            </td>

            {/* Category */}
            <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                <span className="text-sm text-slate-600">PUBLIC</span>
            </td>

            {/* Grades */}
            <td className="px-4 md:px-6 py-4">
                <span className="text-sm text-stone-700 font-medium">
                    {school.grades.replace('-', ' - ')}
                </span>
            </td>

            {/* CT Report Card Link */}
            <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                <a
                    href={ctReportCardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-stone-700 hover:underline inline-flex items-center gap-1"
                >
                    View Report
                    <ExternalLinkIcon />
                </a>
            </td>
        </tr>
    );
}

export default SchoolsModule;
