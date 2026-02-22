import { memo } from 'react';

export const KpiSparkline = memo(function KpiSparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="crm-kpi-sparkline" aria-hidden="true">
      {values.map((value, index) => (
        <span key={`${index}-${value}`} style={{ height: `${Math.max(12, (value / max) * 44)}px` }} />
      ))}
    </div>
  );
});
