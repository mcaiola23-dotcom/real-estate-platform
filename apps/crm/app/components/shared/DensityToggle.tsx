'use client';

type DensityLevel = 'compact' | 'default' | 'comfortable';

interface DensityToggleProps {
  density: DensityLevel;
  onChangeDensity: (density: DensityLevel) => void;
}

const OPTIONS: Array<{ value: DensityLevel; label: string }> = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'comfortable', label: 'Relaxed' },
];

export function DensityToggle({ density, onChangeDensity }: DensityToggleProps) {
  return (
    <div className="crm-density-toggle" role="radiogroup" aria-label="Display density">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={density === opt.value}
          className={`crm-density-option ${density === opt.value ? 'is-active' : ''}`}
          onClick={() => onChangeDensity(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
