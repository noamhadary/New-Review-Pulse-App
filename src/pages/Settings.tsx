import { useState, useEffect, useCallback } from 'react';
import { TONE_LABELS, type ToneType } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'notifications' | 'ai' | 'team' | 'integrations' | 'billing';
type MemberRole = 'admin' | 'manager' | 'viewer';
type MemberStatus = 'active' | 'pending';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  initials: string;
  joined_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TONES: ToneType[] = ['soft', 'gentle', 'firm', 'apologetic'];

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile',       label: 'פרופיל',       icon: 'person' },
  { id: 'notifications', label: 'התראות',        icon: 'notifications' },
  { id: 'ai',            label: 'AI תגובות',     icon: 'smart_toy' },
  { id: 'team',          label: 'צוות',          icon: 'group' },
  { id: 'integrations',  label: 'אינטגרציות',    icon: 'link' },
  { id: 'billing',       label: 'חיוב',          icon: 'credit_card' },
];

const ROLE_META: Record<MemberRole, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  admin:   { label: 'מנהל מערכת', color: '#871dd3', bg: 'rgba(135,29,211,0.1)', icon: 'shield_person',   desc: 'גישה מלאה לכל הפונקציות' },
  manager: { label: 'מנהל',       color: '#2563eb', bg: '#dbeafe',               icon: 'manage_accounts', desc: 'ניהול ביקורות ודוחות' },
  viewer:  { label: 'צופה',       color: '#444650', bg: '#edeeef',               icon: 'visibility',      desc: 'צפייה בלבד, ללא עריכה' },
};

const PERMISSIONS: { feature: string; admin: boolean; manager: boolean; viewer: boolean }[] = [
  { feature: 'צפייה בביקורות',      admin: true,  manager: true,  viewer: true  },
  { feature: 'תגובה לביקורות',     admin: true,  manager: true,  viewer: false },
  { feature: 'הגדרות AI',           admin: true,  manager: true,  viewer: false },
  { feature: 'צפייה בדוחות',        admin: true,  manager: true,  viewer: true  },
  { feature: 'ניתוח מעמיק',         admin: true,  manager: true,  viewer: true  },
  { feature: 'ניהול אינטגרציות',    admin: true,  manager: false, viewer: false },
  { feature: 'ניהול צוות',          admin: true,  manager: false, viewer: false },
  { feature: 'הגדרות חיוב',         admin: true,  manager: false, viewer: false },
];

const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'u1', name: 'מנהל המערכת',    email: 'admin@reviewpulse.co.il',    role: 'admin',   status: 'active',  initials: 'מנ', joined_at: '2024-01-01' },
  { id: 'u2', name: 'שרה כהן',        email: 'sarah@company.co.il',        role: 'manager', status: 'active',  initials: 'שכ', joined_at: '2024-03-15' },
  { id: 'u3', name: 'דוד לוי',        email: 'david@company.co.il',        role: 'viewer',  status: 'active',  initials: 'דל', joined_at: '2024-06-20' },
  { id: 'u4', name: 'מיכל גרין',      email: 'michal@company.co.il',       role: 'manager', status: 'pending', initials: 'מג', joined_at: '2024-12-01' },
];

const CURRENT_USER_ID = 'u1';

const INTEGRATIONS_CONFIG = [
  { id: 'google',      name: 'Google Business', icon: 'language',       color: '#4285F4', reviews: 142, lastSync: 'לפני 2 שעות' },
  { id: 'facebook',    name: 'Facebook Pages',  icon: 'groups',         color: '#1877F2', reviews: 0,   lastSync: null },
  { id: 'tripadvisor', name: 'TripAdvisor',     icon: 'flight',         color: '#34E0A1', reviews: 0,   lastSync: null },
  { id: 'wolt',        name: 'Wolt',            icon: 'delivery_dining',color: '#FF6B35', reviews: 0,   lastSync: null },
];

// ── Persistence hook ───────────────────────────────────────────────────────────

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [state, setState] = useState<T>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '') as T; }
    catch { return initial; }
  });
  const set = useCallback((val: T) => {
    setState(val);
    localStorage.setItem(key, JSON.stringify(val));
  }, [key]);
  return [state, set];
}

// ── Toast ──────────────────────────────────────────────────────────────────────

interface ToastProps { message: string; type: 'success' | 'error' | 'info'; visible: boolean }

function Toast({ message, type, visible }: ToastProps) {
  const colors = { success: '#16a34a', error: '#dc2626', info: '#2563eb' };
  const icons  = { success: 'check_circle', error: 'error', info: 'info' };
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300"
      style={{
        backgroundColor: '#fff',
        border: `1.5px solid ${colors[type]}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)',
        pointerEvents: 'none',
      }}
    >
      <span className="material-symbols-outlined text-[18px] icon-filled" style={{ color: colors[type] }}>{icons[type]}</span>
      <span className="text-sm font-semibold" style={{ color: '#00113a' }}>{message}</span>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState<ToastProps>({ message: '', type: 'success', visible: false });
  const show = (message: string, type: ToastProps['type'] = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };
  return { toast, show };
}

// ── Shared UI ──────────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 mb-5" style={{ backgroundColor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(197,198,210,0.3)' }}>
      <div className="mb-5">
        <h3 className="text-base font-bold" style={{ color: '#00113a' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#757682' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label, desc, disabled }: {
  value: boolean; onChange: () => void; label: string; desc?: string; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: disabled ? '#c5c6d2' : '#191c1d' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: '#757682' }}>{desc}</p>}
      </div>
      <button
        onClick={disabled ? undefined : onChange}
        disabled={disabled}
        className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
        style={{ backgroundColor: value ? '#871dd3' : '#c5c6d2', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <span className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
          style={{ right: value ? 6 : 'auto', left: value ? 'auto' : 6 }} />
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, dir, readOnly }: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; dir?: 'ltr' | 'rtl'; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: '#444650' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={readOnly ? undefined : (e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
        style={{
          backgroundColor: readOnly ? '#f8f9fa' : '#f3f4f5',
          border: '1px solid rgba(197,198,210,0.5)',
          color: readOnly ? '#757682' : '#191c1d',
          direction: dir,
          cursor: readOnly ? 'default' : 'text',
        }}
        onFocus={readOnly ? undefined : (e) => { e.target.style.borderColor = '#871dd3'; }}
        onBlur={readOnly ? undefined : (e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }}
      />
    </div>
  );
}

function SaveBtn({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <button
      onClick={onSave}
      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all hover:opacity-90"
      style={{ backgroundColor: saved ? '#16a34a' : '#871dd3', color: '#fff' }}
    >
      <span className="material-symbols-outlined text-[18px] icon-filled">{saved ? 'check_circle' : 'save'}</span>
      {saved ? 'נשמר!' : 'שמור שינויים'}
    </button>
  );
}

// ── Password modal ─────────────────────────────────────────────────────────────

function PasswordModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.current) return setError('יש להזין את הסיסמה הנוכחית');
    if (form.next.length < 8) return setError('הסיסמה החדשה חייבת להכיל לפחות 8 תווים');
    if (form.next !== form.confirm) return setError('הסיסמאות אינן תואמות');
    setError('');
    onSave();
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="שינוי סיסמה" icon="lock" onClose={onClose}>
        <div className="space-y-4">
          {[
            { key: 'current', label: 'סיסמה נוכחית' },
            { key: 'next',    label: 'סיסמה חדשה' },
            { key: 'confirm', label: 'אימות סיסמה חדשה' },
          ].map(({ key, label }) => (
            <div key={key} className="relative">
              <InputField
                label={label}
                value={form[key as keyof typeof form]}
                onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                type={show ? 'text' : 'password'}
                placeholder="••••••••"
              />
            </div>
          ))}
          <button
            onClick={() => setShow(!show)}
            className="flex items-center gap-1.5 text-xs cursor-pointer"
            style={{ color: '#871dd3' }}
          >
            <span className="material-symbols-outlined text-[14px]">{show ? 'visibility_off' : 'visibility'}</span>
            {show ? 'הסתר סיסמאות' : 'הצג סיסמאות'}
          </button>
          {error && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
              שמור סיסמה
            </button>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border"
              style={{ color: '#444650', borderColor: 'rgba(197,198,210,0.5)' }}>
              ביטול
            </button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ── Invite modal ───────────────────────────────────────────────────────────────

function InviteModal({ onClose, onInvite }: {
  onClose: () => void;
  onInvite: (email: string, role: MemberRole) => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState<MemberRole>('manager');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email.includes('@')) return setError('כתובת אימייל לא תקינה');
    setError('');
    onInvite(email, role);
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox title="הזמנת חבר צוות" icon="person_add" onClose={onClose}>
        <div className="space-y-5">
          <InputField label="כתובת אימייל" value={email} onChange={setEmail} type="email" placeholder="name@company.co.il" dir="ltr" />

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#444650' }}>תפקיד</p>
            <div className="space-y-2">
              {(['admin', 'manager', 'viewer'] as MemberRole[]).map((r) => {
                const m = ROLE_META[r];
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all cursor-pointer"
                    style={{ border: `2px solid ${role === r ? m.color : 'rgba(197,198,210,0.4)'}`, backgroundColor: role === r ? m.bg : '#f8f9fa' }}
                  >
                    <span className="material-symbols-outlined text-[18px] icon-filled" style={{ color: m.color }}>{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: m.color }}>{m.label}</p>
                      <p className="text-xs" style={{ color: '#757682' }}>{m.desc}</p>
                    </div>
                    {role === r && <span className="material-symbols-outlined text-[16px] icon-filled" style={{ color: m.color }}>check_circle</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs font-semibold" style={{ color: '#dc2626' }}>{error}</p>}

          <div className="flex gap-3">
            <button onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
              <span className="material-symbols-outlined text-[16px] icon-filled">send</span>
              שלח הזמנה
            </button>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border"
              style={{ color: '#444650', borderColor: 'rgba(197,198,210,0.5)' }}>
              ביטול
            </button>
          </div>
        </div>
      </ModalBox>
    </Overlay>
  );
}

// ── Connect platform modal ─────────────────────────────────────────────────────

function ConnectModal({ platform, onClose, onConnected }: {
  platform: typeof INTEGRATIONS_CONFIG[number];
  onClose: () => void;
  onConnected: () => void;
}) {
  const [step, setStep] = useState<'info' | 'connecting' | 'done'>('info');

  const handleConnect = () => {
    setStep('connecting');
    setTimeout(() => { setStep('done'); onConnected(); }, 2000);
  };

  return (
    <Overlay onClose={onClose}>
      <ModalBox title={`חיבור ${platform.name}`} icon="link" onClose={onClose}>
        {step === 'info' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: '#f3f4f5' }}>
              <span className="material-symbols-outlined text-[28px] icon-filled" style={{ color: platform.color }}>
                {platform.icon}
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: '#00113a' }}>{platform.name}</p>
                <p className="text-xs" style={{ color: '#757682' }}>אנחנו נסנכרן ביקורות אוטומטית</p>
              </div>
            </div>
            <ol className="space-y-2 text-sm" style={{ color: '#444650' }}>
              <li className="flex items-start gap-2">
                <span className="font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}>1</span>
                לחץ "הפעל חיבור" כדי להתחיל
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}>2</span>
                אשר גישה לחשבון {platform.name} שלך
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}>3</span>
                ביקורות יסונכרנו אוטומטית מעתה
              </li>
            </ol>
            <div className="flex gap-3 pt-1">
              <button onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
                <span className="material-symbols-outlined text-[16px] icon-filled">link</span>
                הפעל חיבור
              </button>
              <button onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border"
                style={{ color: '#444650', borderColor: 'rgba(197,198,210,0.5)' }}>
                ביטול
              </button>
            </div>
          </div>
        )}
        {step === 'connecting' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}>
              <span className="material-symbols-outlined text-white text-[24px] icon-filled">link</span>
            </div>
            <p className="font-bold" style={{ color: '#00113a' }}>מתחבר ל-{platform.name}...</p>
            <p className="text-sm" style={{ color: '#757682' }}>מאמת הרשאות</p>
          </div>
        )}
        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
              <span className="material-symbols-outlined text-[28px] icon-filled" style={{ color: '#16a34a' }}>check_circle</span>
            </div>
            <p className="font-bold" style={{ color: '#00113a' }}>מחובר בהצלחה!</p>
            <p className="text-sm" style={{ color: '#757682' }}>ביקורות יסונכרנו אוטומטית</p>
            <button onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#16a34a', color: '#fff' }}>
              סגור
            </button>
          </div>
        )}
      </ModalBox>
    </Overlay>
  );
}

// ── Upgrade modal ──────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plan, setPlan]     = useState<'pro' | 'enterprise'>('pro');
  const [step, setStep]     = useState<'plans' | 'done'>('plans');

  const prices = { pro: { monthly: '₪149', yearly: '₪119' }, enterprise: { monthly: '₪399', yearly: '₪319' } };

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(197,198,210,0.3)', background: 'linear-gradient(135deg,#00113a,#002366)' }}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] icon-filled text-white">stars</span>
            <h2 className="text-lg font-bold text-white">שדרוג תוכנית</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {step === 'plans' && (
          <div className="p-6">
            {/* Period toggle */}
            <div className="flex items-center justify-center gap-1 p-1 rounded-xl mb-5 w-fit mx-auto" style={{ backgroundColor: '#f3f4f5' }}>
              {(['monthly', 'yearly'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all"
                  style={period === p ? { backgroundColor: '#fff', color: '#00113a', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' } : { color: '#757682' }}>
                  {p === 'monthly' ? 'חודשי' : 'שנתי'}
                  {p === 'yearly' && <span className="mr-1 text-xs font-bold" style={{ color: '#16a34a' }}>חסוך 20%</span>}
                </button>
              ))}
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {(['pro', 'enterprise'] as const).map((p) => (
                <button key={p} onClick={() => setPlan(p)}
                  className="p-4 rounded-2xl text-right transition-all cursor-pointer"
                  style={{ border: `2px solid ${plan === p ? '#871dd3' : 'rgba(197,198,210,0.4)'}`, backgroundColor: plan === p ? 'rgba(135,29,211,0.04)' : '#f8f9fa' }}>
                  <p className="text-sm font-bold mb-0.5" style={{ color: plan === p ? '#871dd3' : '#00113a' }}>
                    {p === 'pro' ? 'Pro' : 'Enterprise'}
                  </p>
                  <p className="text-2xl font-extrabold" style={{ color: '#00113a' }}>{prices[p][period]}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#757682' }}>לחודש</p>
                  <ul className="mt-3 space-y-1 text-xs" style={{ color: '#444650' }}>
                    {(p === 'pro'
                      ? ['ביקורות ללא הגבלה', '5 משתמשים', 'AI תגובות מתקדם', 'דוחות מותאמים']
                      : ['הכל ב-Pro', 'משתמשים ללא הגבלה', 'API גישה', 'תמיכה VIP 24/7']
                    ).map((f) => (
                      <li key={f} className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] icon-filled" style={{ color: '#16a34a' }}>check</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <button onClick={() => setStep('done')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
              <span className="material-symbols-outlined text-[16px] icon-filled">credit_card</span>
              עבור לתשלום — {prices[plan][period]}/חודש
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-12 gap-4 px-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
              <span className="material-symbols-outlined text-[32px] icon-filled" style={{ color: '#16a34a' }}>check_circle</span>
            </div>
            <p className="text-lg font-bold" style={{ color: '#00113a' }}>ברוך הבא לתוכנית Pro!</p>
            <p className="text-sm text-center" style={{ color: '#757682' }}>חשבונך שודרג בהצלחה. כל הפיצ'רים זמינים מיידית.</p>
            <button onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#16a34a', color: '#fff' }}>
              התחל להשתמש
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ── Generic modal wrappers ─────────────────────────────────────────────────────

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,17,58,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalBox({ title, icon, onClose, children }: { title: string; icon: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
      <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] icon-filled" style={{ color: '#871dd3' }}>{icon}</span>
          <h2 className="text-base font-bold" style={{ color: '#00113a' }}>{title}</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          <span className="material-symbols-outlined" style={{ color: '#444650' }}>close</span>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Tab: Profile ───────────────────────────────────────────────────────────────

function ProfileTab({ showToast }: { showToast: (m: string, t?: ToastProps['type']) => void }) {
  const { user, isDemo, signOut } = useAuth();
  const { business, refetch: refetchBusiness } = useBusiness();

  const [profile, setProfile] = useState({
    name: business?.name ?? 'העסק שלי',
    email: user?.email ?? '',
    phone: '',
    website: '',
    category: business?.category ?? 'קמעונאות',
  });
  const [saved, setSaved] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Sync when business data loads
  useEffect(() => {
    if (business) {
      setProfile((p) => ({
        ...p,
        name: business.name ?? p.name,
        category: business.category ?? p.category,
      }));
    }
  }, [business?.id]);

  const initials = profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'מנ';

  const handleSave = async () => {
    if (!isDemo && user) {
      await supabase.from('businesses').upsert({
        owner_id: user.id,
        name: profile.name,
        category: profile.category,
        phone: profile.phone,
        website: profile.website,
      });
      refetchBusiness();
    }
    setSaved(true);
    showToast('הפרופיל נשמר בהצלחה');
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth/login';
  };

  return (
    <>
      {showPwd && <PasswordModal onClose={() => setShowPwd(false)} onSave={() => { setShowPwd(false); showToast('הסיסמה עודכנה בהצלחה'); }} />}

      <SectionCard title="פרטים אישיים">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
            {initials}
          </div>
          <div>
            <p className="font-bold" style={{ color: '#00113a' }}>{profile.name || 'שם מלא'}</p>
            <p className="text-sm" style={{ color: '#757682' }}>{profile.email}</p>
            <button className="text-xs font-semibold mt-1 cursor-pointer hover:underline" style={{ color: '#871dd3' }}>
              שנה תמונת פרופיל
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="שם העסק" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
          <InputField label="אימייל" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} type="email" dir="ltr" />
          <InputField label="טלפון" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} type="tel" dir="ltr" placeholder="+972-50-0000000" />
          <InputField label="אתר אינטרנט" value={profile.website} onChange={(v) => setProfile({ ...profile, website: v })} dir="ltr" placeholder="https://example.co.il" />
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#444650' }}>קטגוריה</label>
            <select
              value={profile.category}
              onChange={(e) => setProfile({ ...profile, category: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ backgroundColor: '#f3f4f5', border: '1px solid rgba(197,198,210,0.5)', color: '#191c1d' }}
              onFocus={(e) => { e.target.style.borderColor = '#871dd3'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }}
            >
              {['קמעונאות', 'מסעדנות', 'שירותים', 'בריאות', 'אחר'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="אבטחה">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>סיסמה</p>
            <p className="text-xs mt-0.5" style={{ color: '#757682' }}>עודכנה לאחרונה לפני 30 יום</p>
          </div>
          <button onClick={() => setShowPwd(true)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(135,29,211,0.08)', color: '#871dd3' }}>
            <span className="material-symbols-outlined text-[16px]">lock</span>
            שנה סיסמה
          </button>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>אימות דו-שלבי (2FA)</p>
            <p className="text-xs mt-0.5" style={{ color: '#757682' }}>הגן על החשבון שלך עם שכבת אבטחה נוספת</p>
          </div>
          <button
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all hover:opacity-80"
            style={{ backgroundColor: '#f3f4f5', color: '#444650', border: '1px solid rgba(197,198,210,0.5)' }}>
            הפעל
          </button>
        </div>
      </SectionCard>

      <SaveBtn onSave={handleSave} saved={saved} />

      {/* Sign out */}
      <div className="flex justify-end mt-2">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer transition-all hover:opacity-80"
          style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          התנתק
        </button>
      </div>
    </>
  );
}

// ── Tab: Notifications ─────────────────────────────────────────────────────────

function NotificationsTab({ showToast }: { showToast: (m: string, t?: ToastProps['type']) => void }) {
  const [notifs, setNotifs] = useLocalStorage('rp_notifs', {
    email: true, push: false, new_review: true, critical: true, weekly: true, monthly: false, whatsapp: false,
  });

  const toggle = (key: keyof typeof notifs) => {
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    showToast(next[key] ? 'התראה הופעלה' : 'התראה הושבתה', 'info');
  };

  return (
    <>
      <SectionCard title="ערוצי התראות" subtitle="בחר כיצד לקבל עדכונים">
        <Toggle value={notifs.email}    onChange={() => toggle('email')}    label="התראות אימייל"  desc="עדכונים ישלחו לכתובת האימייל שלך" />
        <Toggle value={notifs.push}     onChange={() => toggle('push')}     label="התראות דחיפה"  desc="התראות בדפדפן בזמן אמת" />
        <Toggle value={notifs.whatsapp} onChange={() => toggle('whatsapp')} label="WhatsApp"       desc="קבל עדכונים קריטיים ב-WhatsApp" />
      </SectionCard>

      <SectionCard title="אירועים" subtitle="בחר אילו אירועים יפעילו התראה">
        <Toggle value={notifs.new_review} onChange={() => toggle('new_review')} label="ביקורת חדשה"     desc="כאשר מתקבלת ביקורת חדשה מכל פלטפורמה" />
        <Toggle value={notifs.critical}   onChange={() => toggle('critical')}   label="ביקורת ביקורתית" desc="ביקורות עם דירוג 1 או 2 כוכבים" />
        <Toggle value={notifs.weekly}     onChange={() => toggle('weekly')}     label="דוח שבועי"        desc="סיכום ביצועים כל יום ראשון" />
        <Toggle value={notifs.monthly}    onChange={() => toggle('monthly')}    label="דוח חודשי"        desc="ניתוח מגמות בתחילת כל חודש" />
      </SectionCard>
    </>
  );
}

// ── Tab: AI ────────────────────────────────────────────────────────────────────

function AITab({ showToast }: { showToast: (m: string, t?: ToastProps['type']) => void }) {
  const [ai, setAI] = useLocalStorage('rp_ai', {
    enabled: false, default_tone: 'soft' as ToneType, whatsapp_number: '', auto_publish: false, language: 'he',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    showToast('הגדרות AI נשמרו בהצלחה');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <SectionCard title="הגדרות AI תגובות">
        <Toggle value={ai.enabled} onChange={() => setAI({ ...ai, enabled: !ai.enabled })}
          label="תגובה אוטומטית" desc="המערכת תגיב אוטומטית לביקורות חדשות לפי הסגנון שבחרת" />
        <Toggle value={ai.auto_publish} onChange={() => setAI({ ...ai, auto_publish: !ai.auto_publish })}
          label="פרסום אוטומטי" desc="פרסם תגובות ישירות לפלטפורמה ללא אישור ידני"
          disabled={!ai.enabled} />

        <div className="pt-5">
          <p className="text-sm font-semibold mb-3" style={{ color: '#00113a' }}>סגנון תגובה ברירת מחדל</p>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => {
              const info = TONE_LABELS[t];
              const active = ai.default_tone === t;
              return (
                <button key={t} onClick={() => setAI({ ...ai, default_tone: t })}
                  className="p-3 rounded-xl text-right transition-all cursor-pointer"
                  style={{ border: `2px solid ${active ? info.color : 'rgba(197,198,210,0.4)'}`, backgroundColor: active ? info.bg : '#f8f9fa' }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-bold text-sm" style={{ color: info.color }}>{info.he}</span>
                    {active && <span className="material-symbols-outlined text-[14px] icon-filled" style={{ color: info.color }}>check_circle</span>}
                  </div>
                  <p className="text-xs" style={{ color: '#757682' }}>{info.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="WhatsApp לבחירת תגובה" subtitle="קבל 4 הצעות ב-WhatsApp, ענה 1–4 לבחירה">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[22px] icon-filled flex-shrink-0" style={{ color: '#25D366' }}>chat</span>
          <input type="tel" value={ai.whatsapp_number}
            onChange={(e) => setAI({ ...ai, whatsapp_number: e.target.value })}
            placeholder="+972501234567"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#f3f4f5', border: '1px solid rgba(197,198,210,0.5)', color: '#191c1d', direction: 'ltr' }}
            onFocus={(e) => { e.target.style.borderColor = '#25D366'; }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }} />
        </div>
        <p className="text-xs mt-2" style={{ color: '#757682' }}>פורמט: +972 ואז מספר הטלפון (ללא 0 בהתחלה)</p>
      </SectionCard>

      <SaveBtn onSave={handleSave} saved={saved} />
    </>
  );
}

// ── Tab: Team ──────────────────────────────────────────────────────────────────

function TeamTab({ showToast }: { showToast: (m: string, t?: ToastProps['type']) => void }) {
  const [members, setMembers] = useLocalStorage<TeamMember[]>('rp_team', INITIAL_MEMBERS);
  const [showInvite, setShowInvite]     = useState(false);
  const [removeId, setRemoveId]         = useState<string | null>(null);
  const [showPermissions, setShowPerms] = useState(false);

  const activeMembers  = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  const handleRoleChange = (id: string, role: MemberRole) => {
    setMembers(members.map((m) => m.id === id ? { ...m, role } : m));
    showToast('התפקיד עודכן בהצלחה', 'success');
  };

  const handleRemove = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    setRemoveId(null);
    showToast('חבר הצוות הוסר', 'info');
  };

  const handleCancelInvite = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    showToast('ההזמנה בוטלה', 'info');
  };

  const handleInvite = (email: string, role: MemberRole) => {
    const initials = email.slice(0, 2).toUpperCase();
    const newMember: TeamMember = {
      id: `u${Date.now()}`,
      name: email.split('@')[0],
      email,
      role,
      status: 'pending',
      initials,
      joined_at: new Date().toISOString().slice(0, 10),
    };
    setMembers([...members, newMember]);
    setShowInvite(false);
    showToast(`הזמנה נשלחה אל ${email}`);
  };

  return (
    <>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />}

      {removeId && (
        <Overlay onClose={() => setRemoveId(null)}>
          <ModalBox title="הסרת חבר צוות" icon="person_remove" onClose={() => setRemoveId(null)}>
            <p className="text-sm mb-5" style={{ color: '#444650' }}>
              האם אתה בטוח שברצונך להסיר את{' '}
              <strong style={{ color: '#00113a' }}>{members.find((m) => m.id === removeId)?.name}</strong> מהצוות?
              הפעולה לא ניתנת לביטול.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleRemove(removeId!)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-80"
                style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                הסר מהצוות
              </button>
              <button onClick={() => setRemoveId(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border"
                style={{ color: '#444650', borderColor: 'rgba(197,198,210,0.5)' }}>
                ביטול
              </button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* Header card */}
      <SectionCard title="חברי הצוות" subtitle={`${activeMembers.length} חברים פעילים${pendingMembers.length ? ` · ${pendingMembers.length} ממתינים` : ''}`}>
        <div className="flex justify-between items-center mb-5">
          <button onClick={() => setShowPerms(!showPermissions)}
            className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            style={{ color: '#871dd3' }}>
            <span className="material-symbols-outlined text-[14px]">info</span>
            {showPermissions ? 'הסתר הרשאות' : 'הצג מטריצת הרשאות'}
          </button>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl cursor-pointer hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
            <span className="material-symbols-outlined text-[16px] icon-filled">person_add</span>
            הזמן חבר צוות
          </button>
        </div>

        {/* Permission matrix */}
        {showPermissions && (
          <div className="mb-5 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f3f4f5' }}>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#444650' }}>פיצ'ר</th>
                  {(['admin', 'manager', 'viewer'] as MemberRole[]).map((r) => (
                    <th key={r} className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: ROLE_META[r].color }}>
                      {ROLE_META[r].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(({ feature, admin, manager, viewer }, i) => (
                  <tr key={feature} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', borderTop: '1px solid rgba(197,198,210,0.2)' }}>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#191c1d' }}>{feature}</td>
                    {[admin, manager, viewer].map((allowed, j) => (
                      <td key={j} className="px-3 py-2.5 text-center">
                        <span className={`material-symbols-outlined text-[16px] icon-filled`}
                          style={{ color: allowed ? '#16a34a' : '#c5c6d2' }}>
                          {allowed ? 'check_circle' : 'cancel'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Active members */}
        <div className="space-y-2">
          {activeMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid rgba(197,198,210,0.3)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: m.id === CURRENT_USER_ID ? 'rgba(135,29,211,0.15)' : '#edeeef', color: m.id === CURRENT_USER_ID ? '#871dd3' : '#444650' }}>
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: '#00113a' }}>{m.name}</p>
                  {m.id === CURRENT_USER_ID && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#edeeef', color: '#757682' }}>אתה</span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: '#757682', direction: 'ltr' }}>{m.email}</p>
              </div>
              {m.id === CURRENT_USER_ID ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: ROLE_META[m.role].bg, color: ROLE_META[m.role].color }}>
                  {ROLE_META[m.role].label}
                </span>
              ) : (
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg cursor-pointer outline-none transition-colors"
                  style={{ backgroundColor: ROLE_META[m.role].bg, color: ROLE_META[m.role].color, border: 'none' }}
                >
                  {(['admin', 'manager', 'viewer'] as MemberRole[]).map((r) => (
                    <option key={r} value={r}>{ROLE_META[r].label}</option>
                  ))}
                </select>
              )}
              {m.id !== CURRENT_USER_ID && (
                <button onClick={() => setRemoveId(m.id)}
                  className="p-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                  style={{ color: '#ba1a1a' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#fee2e2'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                  <span className="material-symbols-outlined text-[18px]">person_remove</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Pending invitations */}
      {pendingMembers.length > 0 && (
        <SectionCard title="הזמנות ממתינות" subtitle="הוזמנו אך טרם הצטרפו">
          <div className="space-y-2">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#fef9c3', border: '1px solid rgba(234,179,8,0.3)' }}>
                <span className="material-symbols-outlined text-[20px] icon-filled" style={{ color: '#d97706' }}>schedule</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#00113a' }}>{m.email}</p>
                  <p className="text-xs" style={{ color: '#757682' }}>
                    הוזמן בתפקיד {ROLE_META[m.role].label} · {new Date(m.joined_at).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full ml-auto" style={{ backgroundColor: ROLE_META[m.role].bg, color: ROLE_META[m.role].color }}>
                  {ROLE_META[m.role].label}
                </span>
                <button onClick={() => handleCancelInvite(m.id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                  style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                  בטל הזמנה
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </>
  );
}

// ── Tab: Integrations ──────────────────────────────────────────────────────────

function IntegrationsTab({ showToast }: { showToast: (m: string, t?: ToastProps['type']) => void }) {
  const [connected, setConnected] = useLocalStorage<string[]>('rp_integrations', ['google']);
  const [syncing, setSyncing]     = useState<string | null>(null);
  const [connecting, setConnecting] = useState<typeof INTEGRATIONS_CONFIG[number] | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => {
      setSyncing(null);
      showToast('הביקורות סונכרנו בהצלחה');
    }, 2000);
  };

  const handleConnected = (id: string) => {
    setConnected([...connected, id]);
    setConnecting(null);
    showToast(`${INTEGRATIONS_CONFIG.find(p => p.id === id)?.name} חובר בהצלחה!`);
  };

  const handleDisconnect = (id: string) => {
    setConnected(connected.filter((c) => c !== id));
    setDisconnectId(null);
    showToast(`הפלטפורמה נותקה`, 'info');
  };

  return (
    <>
      {connecting && (
        <ConnectModal
          platform={connecting}
          onClose={() => setConnecting(null)}
          onConnected={() => handleConnected(connecting.id)}
        />
      )}

      {disconnectId && (
        <Overlay onClose={() => setDisconnectId(null)}>
          <ModalBox title="ניתוק פלטפורמה" icon="link_off" onClose={() => setDisconnectId(null)}>
            <p className="text-sm mb-5" style={{ color: '#444650' }}>
              ניתוק הפלטפורמה יפסיק את סנכרון הביקורות. הביקורות הקיימות לא יימחקו.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDisconnect(disconnectId)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-80"
                style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                נתק
              </button>
              <button onClick={() => setDisconnectId(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer border"
                style={{ color: '#444650', borderColor: 'rgba(197,198,210,0.5)' }}>
                ביטול
              </button>
            </div>
          </ModalBox>
        </Overlay>
      )}

      <SectionCard title="פלטפורמות" subtitle="חבר פלטפורמות לסנכרון אוטומטי של ביקורות">
        <div className="space-y-3">
          {INTEGRATIONS_CONFIG.map((p) => {
            const isConnected = connected.includes(p.id);
            const isSyncing   = syncing === p.id;
            return (
              <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: isConnected ? `${p.color}08` : '#f8f9fa', border: `1px solid ${isConnected ? `${p.color}30` : 'rgba(197,198,210,0.3)'}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isConnected ? `${p.color}15` : '#edeeef' }}>
                  <span className="material-symbols-outlined text-[20px] icon-filled" style={{ color: isConnected ? p.color : '#757682' }}>{p.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: '#00113a' }}>{p.name}</p>
                    {isConnected && (
                      <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#16a34a' }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#16a34a' }} />
                        מחובר
                      </span>
                    )}
                  </div>
                  {isConnected && p.reviews > 0 && (
                    <p className="text-xs" style={{ color: '#757682' }}>{p.reviews} ביקורות · סונכרן {p.lastSync}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConnected && (
                    <button onClick={() => handleSync(p.id)} disabled={isSyncing}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                      <span className={`material-symbols-outlined text-[13px] ${isSyncing ? 'animate-spin' : ''}`}>
                        {isSyncing ? 'refresh' : 'sync'}
                      </span>
                      {isSyncing ? 'מסנכרן...' : 'סנכרן'}
                    </button>
                  )}
                  <button
                    onClick={() => isConnected ? setDisconnectId(p.id) : setConnecting(p)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80"
                    style={isConnected
                      ? { backgroundColor: '#fee2e2', color: '#991b1b' }
                      : { background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }
                    }>
                    {isConnected ? 'נתק' : 'חבר'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}

// ── Tab: Billing ───────────────────────────────────────────────────────────────

function BillingTab({ showToast }: { showToast: (m: string, t?: ToastProps['type']) => void }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const usage = [
    { label: 'ביקורות החודש', used: 84, limit: 100, color: '#871dd3' },
    { label: 'תגובות AI',     used: 21, limit: 30,  color: '#2563eb' },
    { label: 'חברי צוות',     used: 3,  limit: 3,   color: '#d97706' },
  ];

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => { setShowUpgrade(false); showToast('ברוך הבא לתוכנית Pro! 🎉'); }} />}

      <SectionCard title="תוכנית נוכחית">
        <div className="rounded-xl p-5 mb-5" style={{ background: 'linear-gradient(135deg,#00113a 0%,#871dd3 100%)' }}>
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-white font-bold text-lg">תוכנית חינמית</p>
              <p className="text-white/70 text-xs">חידוש ב-1 בינואר 2025</p>
            </div>
            <button onClick={() => setShowUpgrade(true)}
              className="bg-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 flex items-center gap-1.5"
              style={{ color: '#871dd3' }}>
              <span className="material-symbols-outlined text-[14px] icon-filled">stars</span>
              שדרג ל-Pro
            </button>
          </div>
        </div>

        {/* Usage bars */}
        <div className="space-y-4">
          {usage.map(({ label, used, limit, color }) => {
            const pct = (used / limit) * 100;
            const critical = pct >= 90;
            return (
              <div key={label}>
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-sm font-semibold" style={{ color: '#191c1d' }}>{label}</p>
                  <p className="text-xs font-bold" style={{ color: critical ? '#dc2626' : '#757682' }}>{used} / {limit}</p>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f5' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: critical ? '#dc2626' : color }} />
                </div>
                {critical && (
                  <p className="text-xs mt-1 font-semibold flex items-center gap-1" style={{ color: '#dc2626' }}>
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    מתקרב למגבלה — שדרג לגישה ללא הגבלה
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="מה כולל Pro?">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: 'all_inclusive',  label: 'ביקורות ללא הגבלה' },
            { icon: 'smart_toy',      label: 'AI תגובות ללא הגבלה' },
            { icon: 'group',          label: 'עד 10 משתמשים' },
            { icon: 'description',    label: 'דוחות מותאמים' },
            { icon: 'link',           label: 'כל הפלטפורמות' },
            { icon: 'support_agent',  label: 'תמיכה מועדפת' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl" style={{ backgroundColor: '#f8f9fa' }}>
              <span className="material-symbols-outlined text-[18px] icon-filled" style={{ color: '#871dd3' }}>{icon}</span>
              <span className="text-sm font-medium" style={{ color: '#191c1d' }}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setShowUpgrade(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
          <span className="material-symbols-outlined text-[18px] icon-filled">stars</span>
          שדרג עכשיו — ₪149/חודש
        </button>
      </SectionCard>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile');
  const { toast, show: showToast } = useToast();

  return (
    <div className="min-h-screen px-6 md:px-16 py-8" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-4xl font-extrabold mb-1" style={{ color: '#00113a' }}>הגדרות</h1>
        <p className="text-sm mb-6" style={{ color: '#444650' }}>נהל את הגדרות החשבון, הצוות והמערכת</p>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="md:w-52 rounded-2xl p-2 flex flex-row md:flex-col gap-1 h-fit overflow-x-auto md:overflow-visible"
            style={{ backgroundColor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgba(197,198,210,0.3)' }}>
            {TABS.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-right cursor-pointer flex-shrink-0"
                style={tab === id
                  ? { backgroundColor: 'rgba(135,29,211,0.08)', color: '#871dd3', fontWeight: 700 }
                  : { color: '#444650' }
                }>
                <span className={`material-symbols-outlined text-[18px] ${tab === id ? 'icon-filled' : ''}`}>{icon}</span>
                <span className="hidden md:inline whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === 'profile'       && <ProfileTab       showToast={showToast} />}
            {tab === 'notifications' && <NotificationsTab showToast={showToast} />}
            {tab === 'ai'            && <AITab            showToast={showToast} />}
            {tab === 'team'          && <TeamTab          showToast={showToast} />}
            {tab === 'integrations'  && <IntegrationsTab  showToast={showToast} />}
            {tab === 'billing'       && <BillingTab       showToast={showToast} />}
          </div>
        </div>
      </div>

      <Toast {...toast} />
    </div>
  );
}
