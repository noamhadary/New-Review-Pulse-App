interface KPICardProps {
  label: string;
  value: string;
  icon: string;
  trend?: { value: string; positive: boolean; label: string };
  badge?: string;
  accentColor?: string;
}

export default function KPICard({
  label,
  value,
  icon,
  trend,
  badge,
  accentColor = '#871dd3',
}: KPICardProps) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col justify-between relative overflow-hidden cursor-default bg-white border border-outline-variant/30"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <span
            className="material-symbols-outlined text-[20px] icon-filled"
            style={{ color: accentColor }}
          >
            {icon}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-extrabold leading-none tracking-tight text-primary">
          {value}
        </span>
        {badge && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div
          className="mt-3 flex items-center gap-1 text-xs font-semibold"
          style={{ color: trend.positive ? '#16a34a' : '#dc2626' }}
        >
          <span className="material-symbols-outlined text-[14px]">
            {trend.positive ? 'trending_up' : 'trending_down'}
          </span>
          <span>{trend.value}</span>
          <span className="font-normal text-on-surface-variant">
            {trend.label}
          </span>
        </div>
      )}

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, #00113a, ${accentColor})` }}
      />
    </div>
  );
}
