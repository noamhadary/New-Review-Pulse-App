import { useNavigate } from 'react-router-dom';
import KPICard from '../components/dashboard/KPICard';
import SentimentChart from '../components/dashboard/SentimentChart';
import PulseGauge from '../components/dashboard/PulseGauge';
import NeedsAttention from '../components/dashboard/NeedsAttention';
import RecentActivity from '../components/dashboard/RecentActivity';
import { MOCK_KPI } from '../lib/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Hero banner */}
      <section
        className="px-6 md:px-16 py-10"
        style={{
          background: 'linear-gradient(135deg, #00113a 0%, #002366 60%, #3a0a6e 100%)',
        }}
      >
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              שלום, מנהל המערכת
            </h2>
            <p className="mt-2 text-base" style={{ color: '#758dd5' }}>
              הנה סקירה של הביצועים שלך להיום.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              ניתוח מעמיק
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-lg"
              style={{ backgroundColor: '#871dd3', color: '#ffffff' }}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              ייצור דוח חדש
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards — overlapping the hero */}
      <section className="px-6 md:px-16 -mt-8 mb-8 relative z-10">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            label="ציון נוכחי"
            value={MOCK_KPI.avg_rating.toString()}
            icon="star"
            trend={{ value: `+${MOCK_KPI.rating_trend}%`, positive: true, label: 'מעל ממוצע ענף' }}
            accentColor="#871dd3"
          />
          <KPICard
            label="צמיחה חודשית"
            value={`+${MOCK_KPI.monthly_growth}%`}
            icon="show_chart"
            trend={{ value: '+2%', positive: true, label: 'משבוע שעבר' }}
            accentColor="#002366"
          />
          <KPICard
            label="זמן תגובה ממוצע"
            value={`${MOCK_KPI.avg_response_time_hours}h`}
            icon="schedule"
            trend={{ value: '✓', positive: true, label: 'יעד זמן תגובה הושג' }}
            accentColor="#16a34a"
          />
          <KPICard
            label="ביקורות חיוביות"
            value={`${MOCK_KPI.positive_pct}%`}
            icon="sentiment_very_satisfied"
            trend={{ value: '', positive: true, label: `${MOCK_KPI.positive_count} ביקורות החודש` }}
            badge="חדש"
            accentColor="#871dd3"
          />
        </div>
      </section>

      {/* Charts row */}
      <section className="px-6 md:px-16 mb-8">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SentimentChart />
          </div>
          <div>
            <PulseGauge />
          </div>
        </div>
      </section>

      {/* Needs attention + Recent activity */}
      <section className="px-6 md:px-16 pb-12">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <NeedsAttention />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
        </div>
      </section>
    </div>
  );
}
