import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const DEMO_MODE =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

// ── Validation ─────────────────────────────────────────────────────────────────

function validate(form: { name: string; business: string; email: string; password: string; confirm: string }) {
  if (form.name.trim().length < 2)       return 'שם מלא חייב להכיל לפחות 2 תווים';
  if (form.business.trim().length < 2)   return 'שם העסק חייב להכיל לפחות 2 תווים';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'כתובת אימייל לא תקינה';
  if (form.password.length < 8)          return 'הסיסמה חייבת להכיל לפחות 8 תווים';
  if (form.password !== form.confirm)    return 'הסיסמאות אינן תואמות';
  return null;
}

// ── Shared input ───────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-surface-container-low text-on-surface border-2';

function Field({
  id, label, value, onChange, type = 'text', placeholder, dir = 'rtl', error, autoComplete,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; dir?: 'ltr' | 'rtl'; error?: boolean; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-1.5 text-primary">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        dir={dir}
        autoComplete={autoComplete}
        className={`${INPUT_CLASS} ${error
          ? 'border-red-600 focus:border-red-600'
          : 'border-outline-variant/50 focus:border-secondary'}`}
      />
    </div>
  );
}

// ── Password strength ──────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Za-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const bars  = [1, 2, 3, 4];
  const color = score <= 1 ? '#dc2626' : score === 2 ? '#d97706' : score === 3 ? '#2563eb' : '#16a34a';
  const label = score <= 1 ? 'חלשה' : score === 2 ? 'בינונית' : score === 3 ? 'טובה' : 'חזקה';

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {bars.map((b) => (
          <div key={b} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: b <= score ? color : '#e1e3e4' }} />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>{label}</p>
    </div>
  );
}

// ── Verify screen ──────────────────────────────────────────────────────────────

function VerifyScreen({ email, onResend, onBack, resendCooldown }: {
  email: string;
  onResend: () => void;
  onBack: () => void;
  resendCooldown: number;
}) {
  return (
    <div className="text-center">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', boxShadow: '0 8px 32px rgba(135,29,211,0.35)' }}>
        <span className="material-symbols-outlined text-white text-[36px] icon-filled">mark_email_read</span>
      </div>

      <h2 className="text-2xl font-extrabold mb-2 text-primary">בדוק את האימייל שלך</h2>
      <p className="text-sm mb-1 text-on-surface-variant">שלחנו לינק אימות לכתובת:</p>
      <p dir="ltr" className="font-bold text-sm mb-4 px-3 py-2 rounded-xl inline-block text-secondary bg-secondary/8">
        {email}
      </p>
      <p className="text-sm leading-relaxed mb-6 text-outline">
        לחץ על הלינק באימייל כדי לאמת את החשבון ולהתחבר למערכת.
        <br />הלינק תקף ל-24 שעות.
      </p>

      {/* Tips */}
      <div className="text-right rounded-xl p-4 mb-6 text-sm space-y-1.5 bg-surface-container-low text-on-surface-variant">
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] icon-filled" style={{ color: '#d97706' }}>info</span>
          לא מצאת? בדוק גם בתיקיית הספאם
        </p>
        <p className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] icon-filled" style={{ color: '#16a34a' }}>schedule</span>
          עשוי לקחת עד 2 דקות להגיע
        </p>
      </div>

      {/* Resend */}
      <button
        onClick={onResend}
        disabled={resendCooldown > 0}
        className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-all hover:opacity-80 disabled:opacity-50 mb-3 bg-secondary/10 text-secondary">
        {resendCooldown > 0 ? `שלח שוב בעוד ${resendCooldown} שניות` : 'שלח אימייל מחדש'}
      </button>

      <button onClick={onBack} className="text-sm cursor-pointer hover:underline text-outline">
        חזור לטופס הרשמה
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', business: '', email: '', password: '', confirm: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage]         = useState<'form' | 'verify'>('form');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldError(null);
    setError('');
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const id = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    const validationError = validate(form);
    if (validationError) { setFieldError(validationError); return; }

    setLoading(true);
    setError('');

    // Demo mode — skip real auth
    if (DEMO_MODE) {
      navigate('/onboarding');
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name:     form.name.trim(),
            business_name: form.business.trim(),
          },
        },
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already registered')) {
          setError('כתובת אימייל זו כבר רשומה במערכת. נסה להתחבר.');
        } else {
          setError(authError.message);
        }
      } else {
        setStage('verify');
        startCooldown();
      }
    } catch {
      setError('שגיאת רשת — בדוק את החיבור לאינטרנט ונסה שנית');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: form.email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      startCooldown();
    } catch {
      // silent fail — user will try again
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 50%, #1a0040 100%)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Review Pulse"
            className="cursor-pointer"
            style={{ width: 130, maxWidth: '42%', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 0 20px rgba(135,29,211,0.55))' }}
            onClick={() => navigate('/')}
          />
          <p className="mt-2 text-sm text-on-primary-container">
            {stage === 'form' ? 'הצטרף לאלפי עסקים שמנהלים את המוניטין שלהם' : 'כמעט סיימנו!'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 bg-white" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>

          {stage === 'verify' ? (
            <VerifyScreen
              email={form.email}
              onResend={handleResend}
              onBack={() => { setStage('form'); setError(''); }}
              resendCooldown={resendCooldown}
            />
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center text-primary">יצירת חשבון</h2>

              {/* Global error */}
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 bg-error-container text-on-error-container">
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
                  {error}
                </div>
              )}

              {/* Field-level error */}
              {fieldError && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                  style={{ backgroundColor: '#fff3cd', color: '#92400e' }}>
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0">warning</span>
                  {fieldError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="reg-name"     label="שם מלא"   value={form.name}     onChange={set('name')}     placeholder="ישראל ישראלי" autoComplete="name" />
                  <Field id="reg-business" label="שם העסק"  value={form.business} onChange={set('business')} placeholder="קפה ישראל" autoComplete="organization" />
                </div>

                <Field id="reg-email" label="אימייל" value={form.email} onChange={set('email')}
                  type="email" placeholder="your@email.com" dir="ltr" autoComplete="email" />

                {/* Password with toggle */}
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-semibold mb-1.5 text-primary">סיסמה</label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => set('password')(e.target.value)}
                      placeholder="לפחות 8 תווים"
                      required
                      dir="ltr"
                      autoComplete="new-password"
                      className={`${INPUT_CLASS} pl-11 border-outline-variant/50 focus:border-secondary`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer text-outline">
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="reg-confirm" className="block text-sm font-semibold mb-1.5 text-primary">אימות סיסמה</label>
                  <input
                    id="reg-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={(e) => set('confirm')(e.target.value)}
                    placeholder="הזן שוב את הסיסמה"
                    required
                    dir="ltr"
                    autoComplete="new-password"
                    className={`${INPUT_CLASS} ${form.confirm && form.confirm !== form.password
                      ? 'border-red-600 focus:border-red-600'
                      : 'border-outline-variant/50 focus:border-secondary'}`}
                  />
                  {form.confirm && form.confirm !== form.password && (
                    <p className="text-xs mt-1 text-red-600">הסיסמאות אינן תואמות</p>
                  )}
                  {form.confirm && form.confirm === form.password && form.password.length >= 8 && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#16a34a' }}>
                      <span className="material-symbols-outlined text-[14px] icon-filled">check_circle</span>
                      הסיסמאות תואמות
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-60 mt-2 flex items-center justify-center gap-2 text-white"
                  style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}>
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      יוצר חשבון...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] icon-filled">person_add</span>
                      הרשמה חינמית
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm mt-5 text-on-surface-variant">
                יש לך כבר חשבון?{' '}
                <Link to="/auth/login" className="font-bold text-secondary">התחבר</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
