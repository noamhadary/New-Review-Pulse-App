import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', business: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, business_name: form.business } },
      });
      if (authError) {
        setError(authError.message);
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name' as const, label: 'שם מלא', type: 'text', placeholder: 'ישראל ישראלי', dir: 'rtl' as const },
    { key: 'business' as const, label: 'שם העסק', type: 'text', placeholder: 'קפה ישראל', dir: 'rtl' as const },
    { key: 'email' as const, label: 'אימייל', type: 'email', placeholder: 'your@email.com', dir: 'ltr' as const },
    { key: 'password' as const, label: 'סיסמה', type: 'password', placeholder: '••••••••', dir: 'ltr' as const },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 50%, #1a0040 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'rgba(135,29,211,0.2)', border: '1px solid rgba(135,29,211,0.3)' }}
          >
            <span className="material-symbols-outlined text-[32px] icon-filled" style={{ color: '#871dd3' }}>
              analytics
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Review Pulse</h1>
          <p className="mt-1 text-sm" style={{ color: '#758dd5' }}>הצטרף לאלפי עסקים שמנהלים את המוניטין שלהם</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#00113a' }}>
            יצירת חשבון
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              style={{ backgroundColor: '#ffdad6', color: '#93000a' }}>
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {fields.map(({ key, label, type, placeholder, dir }) => (
              <div key={key}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#00113a' }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    backgroundColor: '#f3f4f5',
                    border: '2px solid rgba(197,198,210,0.5)',
                    color: '#191c1d',
                    direction: dir,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#871dd3'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-60 mt-2"
              style={{ backgroundColor: '#871dd3', color: '#ffffff' }}
            >
              {loading ? 'יוצר חשבון...' : 'הרשמה חינמית'}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: '#444650' }}>
            יש לך כבר חשבון?{' '}
            <Link to="/auth/login" className="font-bold" style={{ color: '#871dd3' }}>
              התחבר
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
