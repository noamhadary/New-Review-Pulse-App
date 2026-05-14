const SEGMENTS = [
  { label: 'חיובי מאוד', pct: 64, color: '#16a34a', bg: '#dcfce7', text: '#166534' },
  { label: 'חיובי', pct: 28, color: '#2563eb', bg: '#dbeafe', text: '#1e40af' },
  { label: 'ביקורתי', pct: 8, color: '#dc2626', bg: '#fee2e2', text: '#991b1b' },
];

const CIRCUMFERENCE = 2 * Math.PI * 84; // r=84

export default function PulseGauge() {
  const pulse = 94;
  const filled = CIRCUMFERENCE * (pulse / 100);
  const gap = CIRCUMFERENCE - filled;

  return (
    <div
      className="rounded-2xl p-6 md:p-8 flex flex-col"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid rgba(197,198,210,0.2)',
      }}
    >
      <h3 className="text-xl font-bold mb-6" style={{ color: '#00113a' }}>
        Review Pulse Gauge
      </h3>

      {/* Gauge */}
      <div className="relative w-44 h-44 mx-auto mb-6 flex-shrink-0">
        {/* Track */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
          <circle
            cx="96" cy="96" r="84"
            fill="none"
            stroke="#edeeef"
            strokeWidth="14"
          />
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

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-extrabold leading-none tracking-tight"
            style={{ color: '#871dd3' }}
          >
            {pulse}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-widest mt-1"
            style={{ color: '#444650' }}
          >
            Pulse
          </span>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-3">
        {SEGMENTS.map(({ label, pct, bg, text }) => (
          <div
            key={label}
            className="flex justify-between items-center px-3 py-2 rounded-lg"
            style={{ backgroundColor: '#f8f9fa' }}
          >
            <span className="text-sm font-medium" style={{ color: '#191c1d' }}>
              {label}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ backgroundColor: bg, color: text }}
            >
              {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
