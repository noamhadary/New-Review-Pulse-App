import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { useBusiness } from '../context/business-context';

const STEPS = [
  {
    id: 1,
    title: 'פרטי העסק',
    icon: 'store',
    description: 'הזן את פרטי העסק הבסיסיים',
  },
  {
    id: 2,
    title: 'חיבור פלטפורמות',
    icon: 'link',
    description: 'חבר את פלטפורמות הביקורות שלך',
  },
  {
    id: 3,
    title: 'התראות',
    icon: 'notifications',
    description: 'הגדר את העדפות ההתראות',
  },
  {
    id: 4,
    title: 'הושלם!',
    icon: 'check_circle',
    description: 'העסק שלך מוכן להתחיל',
  },
];

const PLATFORMS = [
  { id: 'google', name: 'Google Business', icon: 'language', connected: false },
  { id: 'facebook', name: 'Facebook Pages', icon: 'groups', connected: false },
  { id: 'tripadvisor', name: 'TripAdvisor', icon: 'flight', connected: false },
  { id: 'wolt', name: 'Wolt', icon: 'delivery_dining', connected: false },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, isDemo } = useAuth();
  const { refetch: refetchBusiness } = useBusiness();

  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState({ name: '', category: '', phone: '', website: '' });
  const [connected, setConnected] = useState<string[]>([]);
  const [notifs, setNotifs] = useState({ email: true, new_review: true, critical: true, weekly: false });
  const [saving, setSaving] = useState(false);

  const togglePlatform = (id: string) => {
    setConnected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (isDemo) { navigate('/dashboard'); return; }
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('businesses').upsert({
        owner_id: user.id,
        name: business.name || 'העסק שלי',
        category: business.category,
        phone: business.phone,
        website: business.website,
      });
      if (!error) refetchBusiness();
    } catch { /* ignore */ } finally {
      setSaving(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen px-6 md:px-16 py-10 bg-background">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-2 text-primary">
          הגדרת העסק
        </h1>
        <p className="text-sm mb-8 text-on-surface-variant">
          עקוב אחר השלבים להגדרת Review Pulse לעסק שלך
        </p>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <button
                  onClick={() => setStep(s.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                    step === s.id ? 'scale-110' : ''
                  }`}
                  style={
                    s.id < step
                      ? { backgroundColor: '#16a34a', color: '#ffffff' }
                      : s.id === step
                      ? { backgroundColor: '#871dd3', color: '#ffffff', boxShadow: '0 0 0 4px rgba(135,29,211,0.2)' }
                      : { backgroundColor: '#edeeef', color: '#757682' }
                  }
                >
                  {s.id < step ? (
                    <span className="material-symbols-outlined text-[18px] icon-filled">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                  )}
                </button>
                <span className={`text-xs font-medium text-center whitespace-nowrap ${step === s.id ? 'text-secondary' : 'text-on-surface-variant'}`}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 min-w-[32px] mx-1 mb-5"
                  style={{ backgroundColor: i < step - 1 ? '#16a34a' : '#edeeef' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div
          className="rounded-2xl p-8 bg-white border border-outline-variant/30"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          {/* Step 1: Business Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-primary">פרטי העסק</h2>
              {[
                { key: 'name', label: 'שם העסק', placeholder: 'קפה ישראל' },
                { key: 'category', label: 'קטגוריה', placeholder: 'מסעדה / קפה / חנות...' },
                { key: 'phone', label: 'טלפון', placeholder: '050-0000000' },
                { key: 'website', label: 'אתר אינטרנט', placeholder: 'https://...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`onb-${key}`} className="block text-sm font-semibold mb-1.5 text-primary">
                    {label}
                  </label>
                  <input
                    id={`onb-${key}`}
                    type="text"
                    value={business[key as keyof typeof business]}
                    onChange={(e) => setBusiness((b) => ({ ...b, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-surface-container-low text-on-surface border-2 border-outline-variant/50 focus:border-secondary"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Platforms */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 text-primary">חיבור פלטפורמות</h2>
              {PLATFORMS.map((p) => {
                const isConnected = connected.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer"
                    style={{
                      border: `2px solid ${isConnected ? '#871dd3' : 'rgba(197,198,210,0.4)'}`,
                      backgroundColor: isConnected ? 'rgba(135,29,211,0.04)' : '#f8f9fa',
                    }}
                    onClick={() => togglePlatform(p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: isConnected ? 'rgba(135,29,211,0.1)' : '#edeeef' }}
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ color: isConnected ? '#871dd3' : '#444650' }}
                        >
                          {p.icon}
                        </span>
                      </div>
                      <span className="font-semibold text-sm text-primary">{p.name}</span>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={isConnected
                        ? { backgroundColor: '#871dd3' }
                        : { border: '2px solid #c5c6d2', backgroundColor: 'transparent' }
                      }
                    >
                      {isConnected && (
                        <span className="material-symbols-outlined text-white text-[14px] icon-filled">check</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3: Notifications */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4 text-primary">הגדרות התראות</h2>
              {[
                { key: 'email', label: 'קבלת התראות במייל', desc: 'שלח התראות לאימייל שהזנת' },
                { key: 'new_review', label: 'ביקורת חדשה', desc: 'התראה כאשר מתקבלת ביקורת חדשה' },
                { key: 'critical', label: 'ביקורת ביקורתית', desc: 'התראה מיידית לביקורות עם דירוג 1-2' },
                { key: 'weekly', label: 'דוח שבועי', desc: 'סיכום שבועי של הביצועים שלך' },
              ].map(({ key, label, desc }) => {
                const active = notifs[key as keyof typeof notifs];
                return (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/30 bg-background">
                    <div>
                      <p className="font-semibold text-sm text-primary">{label}</p>
                      <p className="text-xs mt-0.5 text-on-surface-variant">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifs((n) => ({ ...n, [key]: !active }))}
                      role="switch"
                      aria-checked={active}
                      aria-label={label}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${active ? 'bg-secondary' : 'bg-outline-variant'}`}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
                        style={{ right: active ? 6 : 'auto', left: active ? 'auto' : 6 }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center py-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #002366, #871dd3)' }}
              >
                <span className="material-symbols-outlined text-white text-[40px] icon-filled">celebration</span>
              </div>
              <h2 className="text-2xl font-extrabold mb-2 text-primary">
                ברכות! העסק שלך מוכן
              </h2>
              <p className="text-sm mb-6 text-on-surface-variant">
                Review Pulse מוגדר ומוכן לנטר את הביקורות שלך בזמן אמת
              </p>
              <div className="flex flex-col gap-2 p-4 rounded-xl mb-6 text-right bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] icon-filled text-green-600">check_circle</span>
                  <span className="text-sm text-on-surface">פרטי העסק הוגדרו</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[18px] icon-filled ${connected.length > 0 ? 'text-green-600' : 'text-outline'}`}>
                    {connected.length > 0 ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span className="text-sm text-on-surface">
                    {connected.length} פלטפורמות מחוברות
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] icon-filled text-green-600">check_circle</span>
                  <span className="text-sm text-on-surface">התראות הוגדרו</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border cursor-pointer transition-colors hover:bg-surface-container border-outline-variant text-on-surface-variant"
              >
                חזור
              </button>
            )}
            <button
              onClick={() => step < 4 ? setStep((s) => s + 1) : handleComplete()}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 cursor-pointer bg-secondary text-white"
            >
              {step === 4 ? (saving ? 'שומר...' : 'עבור ללוח הבקרה') : 'הבא'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
