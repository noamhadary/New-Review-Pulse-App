import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';

export default function ProtectedRoute() {
  const { session, loading, isDemo } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 50%, #1a0040 100%)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(135,29,211,0.25)', border: '1px solid rgba(135,29,211,0.4)' }}
          >
            <span
              className="material-symbols-outlined text-[28px] icon-filled animate-spin"
              style={{ color: '#871dd3' }}
            >
              progress_activity
            </span>
          </div>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
            טוען...
          </p>
        </div>
      </div>
    );
  }

  // isDemo comes from React state (async), so also check sessionStorage directly
  // to avoid a redirect race when loginAsDemo() is called just before navigate()
  const sessionDemo = sessionStorage.getItem('rp_demo') === '1';
  if (isDemo || sessionDemo || session) return <Outlet />;

  return <Navigate to="/auth/login" replace />;
}
