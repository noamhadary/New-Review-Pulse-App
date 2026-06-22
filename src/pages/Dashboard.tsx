import { useNavigate } from 'react-router-dom';
import KPICard from '../components/dashboard/KPICard';
import SentimentChart from '../components/dashboard/SentimentChart';
import PulseGauge from '../components/dashboard/PulseGauge';
import NeedsAttention from '../components/dashboard/NeedsAttention';
import RecentActivity from '../components/dashboard/RecentActivity';
import { useDashboard } from '../hooks/useDashboard';
import { useBusiness } from '../context/business-context';
import { useAuth } from '../context/auth-context';

export default function Dashboard() {
  const navigate = useNavigate();
  const { kpi, sentiment } = useDashboard();
  const { business } = useBusiness();
  const { user } = useAuth();
  const personalName = (user?.user_metadata?.full_name as string | undefined) || business?.name || '';

  return (
    <div className="min-h-screen bg-background">
      <section className="px-3 sm:px-4 md:px-16 py-5 sm:py-6 md:py-10" style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 60%, #3a0a6e 100%)' }}>
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-end gap-3 md:gap-4">
          <div className="text-right md:text-start w-full">
            <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight">
              {personalName ? `שלום, ${personalName}` : 'שלום, מנהל המערכת'}
            </h2>
            <p className="mt-1 md:mt-2 text-xs sm:text-sm md:text-base text-on-primary-container">הנה סקירה של הביצועים שלך להיום.</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <button onClick={() => navigate('/analytics')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-2 sm:px-3 md:px-5 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer bg-white/15 text-white border border-white/25">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px] md:text-[20px]">analytics</span>
              ניתוח מעמיק
            </button>
            <button onClick={() => navigate('/reports')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-2 sm:px-3 md:px-5 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-lg bg-secondary text-white">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px] md:text-[20px]">add</span>
              ייצור דוח חדש
            </button>
          </div>
        </div>
      </section>

      <section className="px-3 sm:px-4 md:px-16 -mt-3 sm:-mt-4 md:-mt-8 mb-5 sm:mb-6 md:mb-8 relative z-10">
        <div className="max-w-screen-xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-5">
          <KPICard label="ציון נוכחי" value={kpi.avg_rating.toString()} icon="star" trend={{ value: kpi.rating_trend ? `+${kpi.rating_trend}%` : '—', positive: true, label: 'מעל ממוצע ענף' }} accentColor="#871dd3" />
          <KPICard label="צמיחה חודשית" value={`+${kpi.monthly_growth}%`} icon="show_chart" trend={{ value: '+2%', positive: true, label: 'משבוע שעבר' }} accentColor="#002366" />
          <KPICard label="זמן תגובה ממוצע" value={`${kpi.avg_response_time_hours}h`} icon="schedule" trend={{ value: '✓', positive: true, label: 'יעד זמן תגובה הושג' }} accentColor="#16a34a" />
          <KPICard label="ביקורות חיוביות" value={`${kpi.positive_pct}%`} icon="sentiment_very_satisfied" trend={{ value: '', positive: true, label: `${kpi.positive_count} ביקורות החודש` }} badge="חדש" accentColor="#871dd3" />
        </div>
      </section>

      <section className="px-4 md:px-16 mb-6 md:mb-8">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <SentimentChart weekData={sentiment} />
          </div>
          <div>
            <PulseGauge positivePct={kpi.positive_pct} pendingCount={kpi.pending_count} />
          </div>
        </div>
      </section>

      <section className="px-4 md:px-16 pb-8 md:pb-12">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
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
