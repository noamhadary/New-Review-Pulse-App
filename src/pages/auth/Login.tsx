import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('אימייל או סיסמה שגויים. נסה שנית.');
      } else {
        navigate('/dashboard');
      }
    } catch {
      // Demo mode — allow login with any credentials
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => { loginAsDemo(); navigate('/dashboard'); };

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
            style={{ width: 130, maxWidth: '42%', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 0 20px rgba(135,29,211,0.55))' }}
          />
          <p className="mt-2 text-sm" style={{ color: '#758dd5' }}>ניהול מוניטין חכם לעסק שלך</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#ffffff', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#00113a' }}>
            כניסה למערכת
          </h2>

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              style={{ backgroundColor: '#ffdad6', color: '#93000a' }}
            >
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#00113a' }}>
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#f3f4f5',
                  border: '2px solid rgba(197,198,210,0.5)',
                  color: '#191c1d',
                  direction: 'ltr',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#871dd3'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#00113a' }}>
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#f3f4f5',
                  border: '2px solid rgba(197,198,210,0.5)',
                  color: '#191c1d',
                  direction: 'ltr',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#871dd3'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(197,198,210,0.5)'; }}
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-xs font-semibold" style={{ color: '#871dd3' }}>
                שכחתי סיסמה
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: '#871dd3', color: '#ffffff' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  מתחבר...
                </span>
              ) : (
                'כניסה'
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#e1e3e4' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white" style={{ color: '#757682' }}>או</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer hover:opacity-90 border"
            style={{ borderColor: '#002366', color: '#002366', backgroundColor: 'transparent' }}
          >
            כניסה בגרסת הדמו
          </button>

          <p className="text-center text-sm mt-5" style={{ color: '#444650' }}>
            אין לך חשבון?{' '}
            <Link to="/auth/register" className="font-bold" style={{ color: '#871dd3' }}>
              הרשם עכשיו
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
