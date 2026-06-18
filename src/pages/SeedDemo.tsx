import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { useBusiness } from '../context/business-context';
import { seedChipopo } from '../lib/seedChipopo';

const PREVIEW_REVIEWS = [
  { name: 'מוריה כהן',     platform: 'Google',      rating: 5, sentiment: 'very_positive', desc: 'הצ\'יפס הביתי שינה לי את החיים...' },
  { name: 'אדם לוי',       platform: 'Google',      rating: 5, sentiment: 'very_positive', desc: 'מבורגר השניצל הביתי — פשוט גאוני...' },
  { name: 'שירה בן-דוד',   platform: 'Facebook',    rating: 4, sentiment: 'positive',      desc: 'בחרנו לסוף שנה של כיתת הבן שלי...' },
  { name: 'Mark Thompson', platform: 'TripAdvisor', rating: 5, sentiment: 'very_positive', desc: 'Best schnitzel outside Vienna...' },
  { name: 'נועה גרינברג',  platform: 'Wolt',        rating: 4, sentiment: 'positive',      desc: 'הזמנה שנייה ברצף ואני מרוצה...' },
  { name: 'רוני שמיר',     platform: 'Google',      rating: 3, sentiment: 'neutral',       desc: '25 דקות המתנה ביום שישי...' },
  { name: 'ירדן מזרחי',    platform: 'Google',      rating: 2, sentiment: 'critical',      desc: 'הצ\'יפס הגיע קר, מאוכזב...' },
  { name: 'טל אברהם',      platform: 'Facebook',    rating: 5, sentiment: 'very_positive', desc: 'ציינו 30 שנה לחיתונינו...' },
  { name: 'דניאל אוחיון',  platform: 'TripAdvisor', rating: 1, sentiment: 'critical',      desc: 'שניצל עייף ולא טרי...' },
  { name: 'לילי כהן-אבידן', platform: 'Other',      rating: 4, sentiment: 'positive',      desc: 'סניף שכונתי ברמה אמיתית...' },
];

const SENTIMENT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  very_positive: { bg: '#dcfce7', color: '#16a34a', label: 'חיובי מאוד' },
  positive:      { bg: '#dbeafe', color: '#2563eb', label: 'חיובי' },
  neutral:       { bg: '#fef3c7', color: '#d97706', label: 'ניטרלי' },
  critical:      { bg: '#fee2e2', color: '#dc2626', label: 'ביקורתי' },
};

const STARS = (n: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} className="text-[13px]" style={{ color: i < n ? '#f59e0b' : '#d1d5db' }}>★</span>
  ));

export default function SeedDemo() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { refetch: refetchBusiness } = useBusiness();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSeed = async () => {
    if (!user) return;
    setStatus('loading');
    const { error } = await seedChipopo(user.id);
    if (error) {
      setErrMsg(error);
      setStatus('error');
    } else {
      refetchBusiness();
      setStatus('done');
    }
  };

  return (
    <div className="min-h-screen px-6 md:px-16 py-10 bg-background">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}
          >
            <span className="material-symbols-outlined text-white text-[22px] icon-filled">science</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-primary">טעינת נתוני הדגמה</h1>
            <p className="text-sm text-on-surface-variant">עבור הצגת הפרויקט — עסק צ'יפופו</p>
          </div>
        </div>

        {/* What will happen */}
        <div
          className="rounded-2xl p-5 my-6 bg-white border border-outline-variant/30"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <p className="text-sm font-bold mb-3 text-primary">מה הפעולה תבצע:</p>
          <div className="space-y-2">
            {[
              { icon: 'store',           text: 'יעדכן את שם העסק ל"צ\'יפופו" עם תיאור, טלפון ואתר' },
              { icon: 'location_on',     text: 'יגדיר סניף ראשי: תל אביב, שדרות רוטשילד 45' },
              { icon: 'delete_sweep',    text: 'ימחק את כל הביקורות הקיימות' },
              { icon: 'rate_review',     text: 'יוסיף 10 ביקורות מגוונות (ראה תצוגה מקדימה למטה)' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[16px] mt-0.5 flex-shrink-0 text-secondary">{icon}</span>
                <p className="text-sm text-on-surface-variant">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews preview table */}
        <div
          className="rounded-2xl overflow-hidden mb-6 bg-white border border-outline-variant/30"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <div className="px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low">
            <p className="text-sm font-bold text-primary">10 ביקורות שייטענו</p>
          </div>
          <div className="divide-y divide-outline-variant/15">
            {PREVIEW_REVIEWS.map((r) => {
              const s = SENTIMENT_STYLE[r.sentiment];
              return (
                <div key={r.name} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}
                  >
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-primary truncate">{r.name}</p>
                      <span className="text-xs text-outline">·</span>
                      <span className="text-xs text-outline">{r.platform}</span>
                    </div>
                    <p className="text-xs text-outline truncate">{r.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex">{STARS(r.rating)}</div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:block"
                      style={{ backgroundColor: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action area */}
        {status === 'idle' && (
          <div className="space-y-3">
            <div
              className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm bg-yellow-50 border border-yellow-200 text-yellow-800"
            >
              <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">warning</span>
              <span>פעולה זו תמחק את כל הביקורות הקיימות ותחליף את פרטי העסק. לא ניתן לבטל.</span>
            </div>
            <button
              onClick={handleSeed}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}
            >
              <span className="material-symbols-outlined text-[18px] icon-filled">rocket_launch</span>
              טען נתוני הדגמה — צ'יפופו
            </button>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center py-10 gap-4">
            <span className="material-symbols-outlined text-secondary text-[40px] animate-spin">progress_activity</span>
            <p className="font-semibold text-primary">טוען נתוני הדגמה...</p>
          </div>
        )}

        {status === 'done' && (
          <div
            className="rounded-2xl p-6 text-center bg-white border border-green-200"
            style={{ boxShadow: '0 2px 12px rgba(22,163,74,0.1)' }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 bg-green-100">
              <span className="material-symbols-outlined text-[28px] icon-filled text-green-600">check_circle</span>
            </div>
            <p className="text-lg font-extrabold text-primary mb-1">הנתונים נטענו בהצלחה!</p>
            <p className="text-sm text-on-surface-variant mb-5">
              העסק "צ'יפופו" מוכן עם 10 ביקורות לדוגמה
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}
              >
                <span className="material-symbols-outlined text-[16px] icon-filled">dashboard</span>
                לוח הבקרה
              </button>
              <button
                onClick={() => navigate('/reviews')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer border border-outline-variant/50 text-on-surface-variant hover:bg-background"
              >
                <span className="material-symbols-outlined text-[16px]">rate_review</span>
                צפה בביקורות
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl p-5 bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] icon-filled text-red-600">error</span>
              <p className="font-bold text-red-800">שגיאה בטעינת הנתונים</p>
            </div>
            <p className="text-sm text-red-700 mb-4">{errMsg}</p>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm font-bold px-4 py-2 rounded-xl cursor-pointer bg-red-100 text-red-800"
            >
              נסה שוב
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
