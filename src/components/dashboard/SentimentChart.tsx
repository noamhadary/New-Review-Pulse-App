import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_SENTIMENT_WEEK } from '../../lib/mockData';
import type { SentimentPoint } from '../../types';

const MONTH_DATA = [
  { day: '1', positive: 70, critical: 10 },
  { day: '5', positive: 75, critical: 8 },
  { day: '10', positive: 80, critical: 6 },
  { day: '15', positive: 68, critical: 15 },
  { day: '20', positive: 88, critical: 4 },
  { day: '25', positive: 92, critical: 3 },
  { day: '30', positive: 85, critical: 5 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl text-sm bg-primary text-white border border-white/10">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  );
}

interface Props {
  weekData?: SentimentPoint[];
}

export default function SentimentChart({ weekData }: Props) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const data = period === 'week' ? (weekData ?? MOCK_SENTIMENT_WEEK) : MONTH_DATA;

  return (
    <div className="rounded-2xl p-6 md:p-8 flex flex-col bg-white border border-outline-variant/20" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-primary">ניתוח סנטימנט</h3>
          <p className="text-xs mt-0.5 text-on-surface-variant">אחוז ביקורות חיוביות לעומת ביקורתיות</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              period === p ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface-variant'
            }`}>
              {p === 'week' ? '7 ימים' : '30 יום'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-5 mb-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-primary-container" />
          <span className="text-on-surface-variant">חיובי</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block bg-secondary" />
          <span className="text-on-surface-variant">ביקורתי</span>
        </div>
      </div>
      <div className="flex-1" style={{ minHeight: 220 }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(197,198,210,0.4)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#444650', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#444650', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="positive" name="חיובי" fill="#002366" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="critical" name="ביקורתי" fill="#871dd3" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
