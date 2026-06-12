import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth-context';

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
          <p className="mt-2 text-sm text-on-primary-container">ניהול מוניטין חכם לעסק שלך</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 bg-white"
          style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-primary">
            כניסה למערכת
          </h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 bg-error-container text-on-error-container">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold mb-1.5 text-primary">
                אימייל
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                dir="ltr"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-surface-container-low text-on-surface border-2 border-outline-variant/50 focus:border-secondary"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold mb-1.5 text-primary">
                סיסמה
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all bg-surface-container-low text-on-surface border-2 border-outline-variant/50 focus:border-secondary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer disabled:opacity-60 bg-secondary text-white"
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
              <div className="w-full border-t border-surface-container-highest" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-outline">או</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer hover:opacity-90 border border-primary-container text-primary-container bg-transparent"
          >
            כניסה בגרסת הדמו
          </button>

          <p className="text-center text-sm mt-5 text-on-surface-variant">
            אין לך חשבון?{' '}
            <Link to="/auth/register" className="font-bold text-secondary">
              הרשם עכשיו
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
