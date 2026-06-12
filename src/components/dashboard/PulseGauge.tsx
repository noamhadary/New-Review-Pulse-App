const CIRCUMFERENCE = 2 * Math.PI * 84; // r=84

interface Props {
  positivePct?: number;
  pendingCount?: number;
}

export default function PulseGauge({ positivePct = 94, pendingCount }: Props) {
  const pulse = positivePct;
  const filled = CIRCUMFERENCE * (pulse / 100);
  const gap = CIRCUMFERENCE - filled;

  const SEGMENTS = [
    { label: 'ביקורות חיוביות', pct: positivePct, color: '#16a34a', bg: '#dcfce7', text: '#166534' },
    { label: 'ממתין לתגובה', pct: pendingCount ?? 0, color: '#871dd3', bg: '#f3e8ff', text: '#6b21a8', isCount: true },
  ];

  return (
    <div
      className="rounded-2xl p-6 md:p-8 flex flex-col bg-white border border-outline-variant/20"
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
    >
      <h3 className="text-xl font-bold mb-6 text-primary">
        Review Pulse Gauge
      </h3>

      {/* Gauge */}
      <div className="relative w-44 h-44 mx-auto mb-6 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
          <circle cx="96" cy="96" r="84" fill="none" stroke="#edeeef" strokeWidth="14" />
          <circle
            cx="96" cy="96" r="84"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
            style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00113a" />
              <stop offset="100%" stopColor="#871dd3" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold leading-none tracking-tight text-secondary">
            {pulse}
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest mt-1 text-on-surface-variant">
            Pulse
          </span>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-3">
        {SEGMENTS.map(({ label, pct, bg, text, isCount }) => (
          <div
            key={label}
            className="flex justify-between items-center px-3 py-2 rounded-lg bg-background"
          >
            <span className="text-sm font-medium text-on-surface">{label}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: bg, color: text }}>
              {isCount ? pct : `${pct}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
