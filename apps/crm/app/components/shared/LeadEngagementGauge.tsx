export function LeadEngagementGauge({ score, label }: { score: number; label: string }) {
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 80 ? '#16a34a' :
      score >= 60 ? '#ca8a04' :
        score >= 40 ? '#ea580c' :
          score >= 20 ? '#9333ea' : '#6b7280';

  return (
    <div className="crm-engagement-gauge">
      <svg viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--crm-border)" strokeWidth={strokeWidth} />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--crm-heading)">{score}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--crm-muted-text)">{label}</text>
      </svg>
    </div>
  );
}
