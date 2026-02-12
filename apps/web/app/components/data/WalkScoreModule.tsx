/**
 * WalkScoreModule - Walk, Bike, and Transit scores
 * 
 * Displays walkability metrics from Walk Score API.
 * Shows graceful fallback when API is disabled or unavailable.
 */

import { DataModule } from './DataModule';
import {
    WalkScoreResult,
    getScoreLabel,
    getScoreColor,
} from '../../lib/data/providers/walkscore.provider';

interface WalkScoreModuleProps {
    result: WalkScoreResult;
    locationName: string;
}

export function WalkScoreModule({ result, locationName }: WalkScoreModuleProps) {
    // Handle unavailable state
    if (!result.available || !result.data) {
        return (
            <DataModule
                title="Walkability"
                whyItMatters="Walk, bike, and transit scores for daily errands"
                source={result.source}
                sourceUrl={result.sourceUrl}
                lastUpdated={result.fetchedAt}
                error={result.unavailableReason || 'Score data coming soon'}
            >
                <div />
            </DataModule>
        );
    }

    const { data } = result;

    return (
        <DataModule
            title="Walkability"
            whyItMatters="How easy is it to get around without a car?"
            source={result.source}
            sourceUrl={result.sourceUrl}
            lastUpdated={result.fetchedAt}
            method={result.fromCache ? 'Cached' : 'Live'}
        >
            <div className="grid grid-cols-3 gap-4">
                {/* Walk Score */}
                <ScoreDisplay
                    label="Walk Score"
                    score={data.walkScore}
                    description={data.walkDescription}
                />
                
                {/* Bike Score */}
                <ScoreDisplay
                    label="Bike Score"
                    score={data.bikeScore}
                    description={data.bikeDescription}
                />
                
                {/* Transit Score */}
                <ScoreDisplay
                    label="Transit Score"
                    score={data.transitScore}
                    description={data.transitDescription}
                />
            </div>
        </DataModule>
    );
}

/**
 * Individual score display
 */
function ScoreDisplay({
    label,
    score,
    description,
}: {
    label: string;
    score: number | null;
    description: string | null;
}) {
    const colorClass = getScoreColor(score);
    const displayScore = score !== null ? score : '—';
    const displayLabel = description || getScoreLabel(score);

    return (
        <div className="text-center">
            <div className={`text-3xl font-bold ${colorClass}`}>
                {displayScore}
            </div>
            <div className="text-xs font-medium text-slate-700 mt-1">
                {label}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
                {displayLabel}
            </div>
        </div>
    );
}

/**
 * WalkScoreModulePlaceholder - Show when coordinates are not available
 */
export function WalkScoreModulePlaceholder() {
    return (
        <DataModule
            title="Walkability"
            whyItMatters="Walk, bike, and transit scores for daily errands"
            source="Walk Score"
            sourceUrl="https://www.walkscore.com"
            error="Location coordinates required for walkability scores"
        >
            <div />
        </DataModule>
    );
}

export default WalkScoreModule;
