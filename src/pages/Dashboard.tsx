import { useNavigate } from 'react-router-dom';
import KPICard from '../components/dashboard/KPICard';
import SentimentChart from '../components/dashboard/SentimentChart';
import PulseGauge from '../components/dashboard/PulseGauge';
import NeedsAttention from '../components/dashboard/NeedsAttention';
import RecentActivity from '../components/dashboard/RecentActivity';
import { useDashboard } from '../hooks/useDashboard';
import { useBusiness } from '../context/business-context';

export default function Dashboard() {
  const navigate = useNavigate();
  const { kpi, sentiment } = useDashboard();
  const { business } = useBusiness();

  return (
    <div className="min-h-screen bg-background">
      <section className="px-6 md:px-16 py-10" style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 60%, #3a0a6e 100%)' }}>
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {business?.name ? `שלום, ${business.name}` : 'שלום, מנהל המערכת'}
            </h2>
            <p className="mt-2 text-base text-on-primary-container">הנה סקירה של הביצועים שלך להיום.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/analytics')} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer bg-white/15 text-white border border-white/25">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              ניתוח מעמיק
            </button>
            <button onClick={() => navigate('/reports')} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-lg bg-secondary text-white">
              <span className="material-symbols-outlined text-[20px]">add</span>
              ייצור דוח חדש
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-16 -mt-8 mb-8 relative z-10">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard label="ציון נוכחי" value={kpi.avg_rating.toString()} icon="star" trend={{ value: kpi.rating_trend ? `+${kpi.rating_trend}%` : '—', positive: true, label: 'מעל ממוצע ענף' }} accentColor="#871dd3" />
          <KPICard label="צמיחה חודשית" value={`+${kpi.monthly_growth}%`} icon="show_chart" trend={{ value: '+2%', positive: true, label: 'משבוע שעבר' }} accentColor="#002366" />
          <KPICard label="זמן תגובה ממוצע" value={`${kpi.avg_response_time_hours}h`} icon="schedule" trend={{ value: '✓', positive: true, label: 'יעד זמן תגובה הושג' }} accentColor="#16a34a" />
          <KPICard label="ביקורות חיוביות" value={`${kpi.positive_pct}%`} icon="sentiment_very_satisfied" trend={{ value: '', positive: true, label: `${kpi.positive_count} ביקורות החודש` }} badge="חדש" accentColor="#871dd3" />
        </div>
      </section>

      <section className="px-6 md:px-16 mb-8">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SentimentChart weekData={sentiment} />
          </div>
          <div>
            <PulseGauge positivePct={kpi.positive_pct} pendingCount={kpi.pending_count} />
          </div>
        </div>
      </section>

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
