import { useState } from 'react';
import { TONE_LABELS, type ToneType } from '../types';

type Tab = 'profile' | 'notifications' | 'integrations' | 'ai' | 'billing';

const TONES: ToneType[] = ['soft', 'gentle', 'firm', 'apologetic'];

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',       label: 'פרופיל',        icon: 'person' },
  { id: 'notifications', label: 'התראות',         icon: 'notifications' },
  { id: 'ai',            label: 'AI תגובות',      icon: 'smart_toy' },
  { id: 'integrations',  label: 'אינטגרציות',     icon: 'link' },
  { id: 'billing',       label: 'חיוב',           icon: 'credit_card' },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        border: '1px solid rgba(197,198,210,0.3)',
      }}
    >
      <h3 className="text-base font-bold mb-5" style={{ color: '#00113a' }}>{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label, desc }: {
  value: boolean; onChange: () => void; label: string; desc?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: '#757682' }}>{desc}</p>}
      </div>
      <button
        onClick={onChange}
        className="relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0"
        style={{ backgroundColor: value ? '#871dd3' : '#c5c6d2' }}
      >
        <span
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
          style={{ right: value ? 6 : 'auto', left: value ? 'auto' : 6 }}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState({
    name: 'מנהל המערכת',
    email: 'admin@reviewpulse.co.il',
    business: 'חנות מרכזית',
    language: 'he',
  });
  const [notifs, setNotifs] = useState({
    email: true, push: false, new_review: true, critical: true, weekly: true, monthly: false,
  });
  const [aiSettings, setAiSettings] = useState({
    enabled: false,
    default_tone: 'soft' as ToneType,
    whatsapp_number: '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen px-6 md:px-16 py-8" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-4xl font-extrabold mb-1" style={{ color: '#00113a' }}>הגדרות</h1>
        <p className="text-sm mb-6" style={{ color: '#444650' }}>נהל את הגדרות החשבון והמערכת</p>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs */}
          <div
            className="md:w-52 rounded-2xl p-2 flex flex-row md:flex-col gap-1 h-fit"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(197,198,210,0.3)' }}
          >
            {TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-right cursor-pointer"
                style={tab === id
                  ? { backgroundColor: 'rgba(135,29,211,0.08)', color: '#871dd3', fontWeight: 700 }
                  : { color: '#444650' }
                }
              >
                <span className={`material-symbols-outlined text-[18px] ${tab === id ? 'icon-filled' : ''}`}>
                  {icon}
                </span>
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {tab === 'profile' && (
              <>
                <SectionCard title="פרטים אישיים">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'שם מלא' },
                      { key: 'email', label: 'אימייל' },
                      { key: 'business', label: 'שם העסק' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold mb-1" style={{ color: '#444650' }}>{label}</label>
                        <input
                          value={profile[key as keyof typeof profile]}
                          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ backgroundColor: '#f3f4f5', border: '1px solid rgba(197,198,210,0.5)', color: '#191c1d' }}
                          onFocus={(e) => { e.target.style.borderColor = '#871dd3'; }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="אבטחה">
                  <button
                    className="flex items-center gap-2 text-sm font-semibold py-2 cursor-pointer hover:underline"
                    style={{ color: '#871dd3' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    שנה סיסמה
                  </button>
                </SectionCard>
              </>
            )}

            {tab === 'notifications' && (
              <SectionCard title="העדפות התראות">
                <Toggle value={notifs.email} onChange={() => setNotifs((n) => ({ ...n, email: !n.email }))}
                  label="התראות אימייל" desc="קבל עדכונים לאימייל שלך" />
                <Toggle value={notifs.push} onChange={() => setNotifs((n) => ({ ...n, push: !n.push }))}
                  label="התראות דחיפה" desc="התראות בדפדפן בזמן אמת" />
                <Toggle value={notifs.new_review} onChange={() => setNotifs((n) => ({ ...n, new_review: !n.new_review }))}
                  label="ביקורת חדשה" desc="כאשר מתקבלת ביקורת חדשה" />
                <Toggle value={notifs.critical} onChange={() => setNotifs((n) => ({ ...n, critical: !n.critical }))}
                  label="ביקורת ביקורתית" desc="ביקורות עם דירוג 1 או 2 כוכבים" />
                <Toggle value={notifs.weekly} onChange={() => setNotifs((n) => ({ ...n, weekly: !n.weekly }))}
                  label="דוח שבועי" desc="סיכום ביצועים כל יום ראשון" />
                <Toggle value={notifs.monthly} onChange={() => setNotifs((n) => ({ ...n, monthly: !n.monthly }))}
                  label="דוח חודשי" desc="ניתוח מגמות חודשי" />
              </SectionCard>
            )}

            {tab === 'ai' && (
              <>
                <SectionCard title="הגדרות AI תגובות">
                  <Toggle
                    value={aiSettings.enabled}
                    onChange={() => setAiSettings((s) => ({ ...s, enabled: !s.enabled }))}
                    label="תגובה אוטומטית"
                    desc="המערכת תגיב אוטומטית לביקורות חדשות לפי הסגנון שבחרת"
                  />

                  <div className="pt-4">
                    <p className="text-sm font-semibold mb-3" style={{ color: '#00113a' }}>
                      סגנון תגובה ברירת מחדל
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map((t) => {
                        const info = TONE_LABELS[t];
                        const active = aiSettings.default_tone === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setAiSettings((s) => ({ ...s, default_tone: t }))}
                            className="p-3 rounded-xl text-right transition-all cursor-pointer"
                            style={{
                              border: `2px solid ${active ? info.color : 'rgba(197,198,210,0.4)'}`,
                              backgroundColor: active ? info.bg : '#f8f9fa',
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-bold text-sm" style={{ color: info.color }}>
                                {info.he}
                              </span>
                              {active && (
                                <span
                                  className="material-symbols-outlined text-[14px] icon-filled"
                                  style={{ color: info.color }}
                                >
                                  check_circle
                                </span>
                              )}
                            </div>
                            <p className="text-xs" style={{ color: '#757682' }}>{info.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="WhatsApp לבחירת תגובה">
                  <p className="text-xs mb-4" style={{ color: '#444650' }}>
                    הזן את מספר ה-WhatsApp שאליו ישלחו 4 הצעות התגובה. ענה 1-4 כדי לבחור.
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-[20px] icon-filled flex-shrink-0"
                      style={{ color: '#25D366' }}
                    >
                      chat
                    </span>
                    <input
                      type="tel"
                      value={aiSettings.whatsapp_number}
                      onChange={(e) =>
                        setAiSettings((s) => ({ ...s, whatsapp_number: e.target.value }))
                      }
                      placeholder="+972501234567"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        backgroundColor: '#f3f4f5',
                        border: '1px solid rgba(197,198,210,0.5)',
                        color: '#191c1d',
                        direction: 'ltr',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#25D366'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#757682' }}>
                    פורמט: +972 ואז מספר הטלפון (ללא 0 בהתחלה)
                  </p>
                </SectionCard>
              </>
            )}

            {tab === 'integrations' && (
              <SectionCard title="פלטפורמות מחוברות">
                <div className="space-y-3">
                  {[
                    { name: 'Google Business', icon: 'language', connected: true },
                    { name: 'Facebook Pages', icon: 'groups', connected: false },
                    { name: 'TripAdvisor', icon: 'flight', connected: false },
                    { name: 'Wolt', icon: 'delivery_dining', connected: false },
                  ].map(({ name, icon, connected }) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: '#f8f9fa', border: '1px solid rgba(197,198,210,0.3)' }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: connected ? 'rgba(135,29,211,0.1)' : '#edeeef' }}
                        >
                          <span className="material-symbols-outlined text-[18px]"
                            style={{ color: connected ? '#871dd3' : '#757682' }}>
                            {icon}
                          </span>
                        </div>
                        <span className="text-sm font-medium" style={{ color: '#191c1d' }}>{name}</span>
                      </div>
                      <button
                        className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                        style={connected
                          ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                          : { backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }
                        }
                      >
                        {connected ? 'נתק' : 'חבר'}
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {tab === 'billing' && (
              <>
                <SectionCard title="תוכנית נוכחית">
                  <div
                    className="rounded-xl p-5 mb-4"
                    style={{ background: 'linear-gradient(135deg, #00113a 0%, #871dd3 100%)' }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-bold">תוכנית חינמית</p>
                        <p className="text-white/70 text-sm">עד 100 ביקורות בחודש</p>
                      </div>
                      <button
                        className="bg-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
                        style={{ color: '#871dd3' }}
                      >
                        שדרג ל-Pro
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { feature: 'ביקורות ללא הגבלה', pro: true },
                      { feature: 'ניתוח AI מתקדם', pro: true },
                      { feature: 'דוחות מותאמים אישית', pro: true },
                      { feature: 'תמיכה בפלטפורמות נוספות', pro: true },
                    ].map(({ feature, pro }) => (
                      <div key={feature} className="flex items-center gap-2 text-sm" style={{ color: '#444650' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: pro ? '#871dd3' : '#c5c6d2' }}>
                          {pro ? 'stars' : 'block'}
                        </span>
                        {feature}
                        {pro && <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}>Pro</span>}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </>
            )}

            {/* Save button */}
            {(tab === 'profile' || tab === 'notifications' || tab === 'ai') && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all hover:opacity-90"
                style={{ backgroundColor: saved ? '#16a34a' : '#871dd3', color: '#ffffff' }}
              >
                <span className="material-symbols-outlined text-[18px] icon-filled">
                  {saved ? 'check_circle' : 'save'}
                </span>
                {saved ? 'נשמר!' : 'שמור שינויים'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
