import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
} from 'recharts';

// ── Custom tooltips ────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number | string; name: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl text-sm bg-primary text-white border border-white/10">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#fff' }}>
          {p.name}: {p.value}{typeof p.value === 'number' && p.name === 'ציון' ? '' : typeof p.value === 'number' && p.name === 'תגובות' ? '' : typeof p.value === 'number' && p.name === 'שיעור תגובה' ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

type Period = '3m' | '6m' | '12m';

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: string; color: string;
}) {
  return (
    <div
      className="rounded-2xl p-6 flex items-start gap-4 bg-white border border-outline-variant/30"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <span className="material-symbols-outlined text-[22px] icon-filled" style={{ color }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-on-surface-variant">{label}</p>
        <p className="text-3xl font-extrabold leading-none text-primary">{value}</p>
        <p className="text-xs mt-1 text-outline">{sub}</p>
      </div>
    </div>
  );
}

function RatingBar({ rating, count, pct, maxCount }: { rating: string; count: number; pct: number; maxCount: number }) {
  const width = (count / maxCount) * 100;
  const color = pct >= 50 ? '#16a34a' : pct >= 20 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-3">
      <span dir="ltr" className="text-sm font-semibold w-10 text-left flex-shrink-0 text-primary">{rating}</span>
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-surface-container-low">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold w-9 text-left flex-shrink-0 text-on-surface-variant">{pct}%</span>
      <span className="text-xs w-8 text-left flex-shrink-0 text-outline">{count}</span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('6m');
  const { monthlyTrend, ratingDist, platformData, topics } = useAnalytics();

  const MONTHLY_TREND = monthlyTrend;
  const RATING_DIST   = ratingDist;
  const PLATFORM_DATA = platformData;
  const TOPICS        = topics;

  const periodData = period === '3m'
    ? MONTHLY_TREND.slice(-3)
    : period === '6m'
      ? MONTHLY_TREND
      : [...MONTHLY_TREND, ...MONTHLY_TREND.map((d, i) => ({ ...d, month: ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני'][i] }))];

  const maxRatingCount = Math.max(...RATING_DIST.map((r) => r.count), 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section
        className="px-6 md:px-16 py-10"
        style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 60%, #3a0a6e 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-end gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">ניתוח מעמיק</h2>
            <p className="mt-2 text-base text-on-primary-container">
              מגמות, פלטפורמות ותובנות על הביקורות שלך
            </p>
          </div>
          <div className="flex gap-2 bg-white/10 p-1 rounded-xl">
            {(['3m', '6m', '12m'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  period === p ? 'bg-white text-primary' : 'text-white/70'
                }`}
              >
                {p === '3m' ? '3 חודשים' : p === '6m' ? '6 חודשים' : 'שנה'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Metric cards */}
      <section className="px-6 md:px-16 -mt-8 mb-8 relative z-10">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          <MetricCard label="סה״כ ביקורות" value="247" sub="החודש הנוכחי" icon="rate_review" color="#871dd3" />
          <MetricCard label="שיעור תגובה" value="92%" sub="+4% מחודש שעבר" icon="reply" color="#16a34a" />
          <MetricCard label="ציון ממוצע" value="4.8" sub="מתוך 5 כוכבים" icon="star" color="#d97706" />
        </div>
      </section>

      {/* Charts row 1: trend + rating dist */}
      <section className="px-6 md:px-16 mb-8">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Rating trend */}
          <div
            className="lg:col-span-2 rounded-2xl p-6 md:p-8 bg-white border border-outline-variant/20"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            <h3 className="text-xl font-bold mb-1 text-primary">מגמת ציון לאורך זמן</h3>
            <p className="text-xs mb-6 text-outline">ציון ממוצע חודשי</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={periodData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#871dd3" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#871dd3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(197,198,210,0.4)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#444650', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[3.5, 5]} tick={{ fill: '#444650', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(135,29,211,0.2)', strokeWidth: 2 }} />
                <Area
                  type="monotone"
                  dataKey="rating"
                  name="ציון"
                  stroke="#871dd3"
                  strokeWidth={2.5}
                  fill="url(#ratingGrad)"
                  dot={{ fill: '#871dd3', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#871dd3' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Rating distribution */}
          <div
            className="rounded-2xl p-6 md:p-8 bg-white border border-outline-variant/20"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            <h3 className="text-xl font-bold mb-1 text-primary">פילוג דירוגים</h3>
            <p className="text-xs mb-6 text-outline">התפלגות לפי כוכבים</p>
            <div className="space-y-4">
              {RATING_DIST.map((r) => (
                <RatingBar key={r.rating} {...r} maxCount={maxRatingCount} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Charts row 2: platform + response rate + topics */}
      <section className="px-6 md:px-16 mb-8">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Platform breakdown */}
          <div
            className="rounded-2xl p-6 md:p-8 bg-white border border-outline-variant/20"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            <h3 className="text-xl font-bold mb-6 text-primary">לפי פלטפורמה</h3>
            <div className="space-y-4">
              {PLATFORM_DATA.map(({ name, icon, reviews, positive, color }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]" style={{ color }}>
                        {icon}
                      </span>
                      <span className="text-sm font-semibold text-on-surface">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-600">{positive}%</span>
                      <span className="text-xs text-outline">{reviews} ביקורות</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-surface-container-low">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(reviews / 247) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response rate trend */}
          <div
            className="rounded-2xl p-6 md:p-8 bg-white border border-outline-variant/20"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            <h3 className="text-xl font-bold mb-1 text-primary">שיעור תגובה</h3>
            <p className="text-xs mb-4" style={{ color: '#757682' }}>אחוז ביקורות שקיבלו תגובה</p>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={periodData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(197,198,210,0.4)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#444650', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: '#444650', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<DarkTooltip />} />
                <Line
                  type="monotone"
                  dataKey="response_rate"
                  name="שיעור תגובה"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ fill: '#16a34a', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hot topics */}
          <div
            className="rounded-2xl p-6 md:p-8 bg-white border border-outline-variant/20"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            <h3 className="text-xl font-bold mb-6 text-primary">נושאים נפוצים</h3>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(({ topic, count, positive }) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={positive
                    ? { backgroundColor: '#dcfce7', color: '#166534' }
                    : { backgroundColor: '#fee2e2', color: '#991b1b' }
                  }
                >
                  <span
                    className="material-symbols-outlined text-[12px] icon-filled"
                    style={{ color: positive ? '#16a34a' : '#dc2626' }}
                  >
                    {positive ? 'thumb_up' : 'thumb_down'}
                  </span>
                  {topic}
                  <span
                    className="font-bold text-[10px] px-1 py-0.5 rounded"
                    style={{ backgroundColor: positive ? '#bbf7d0' : '#fecaca', color: positive ? '#14532d' : '#7f1d1d' }}
                  >
                    {count}
                  </span>
                </span>
              ))}
            </div>

            {/* Volume chart */}
            <div className="mt-6">
              <p className="text-xs font-semibold mb-3 text-on-surface-variant">נפח ביקורות חודשי</p>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={periodData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: '#444650', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="reviews" name="תגובות" fill="#002366" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
