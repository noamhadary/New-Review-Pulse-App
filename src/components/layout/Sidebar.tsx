import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: 'dashboard',           label: 'לוח בקרה',  path: '/dashboard' },
  { icon: 'rate_review',         label: 'ביקורות',   path: '/reviews' },
  { icon: 'analytics',           label: 'ניתוח',     path: '/analytics' },
  { icon: 'description',         label: 'דוחות',     path: '/reports' },
  { icon: 'assignment_turned_in', label: 'הטמעה',    path: '/onboarding' },
  { icon: 'settings',            label: 'הגדרות',    path: '/settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-16 right-0 h-[calc(100vh-64px)] w-64 z-40
          flex flex-col border-l
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
        style={{
          backgroundColor: '#f8f9fa',
          borderColor: '#c5c6d2',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b" style={{ borderColor: '#c5c6d2' }}>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#002366' }}
            >
              <span className="material-symbols-outlined text-white text-[20px] icon-filled">analytics</span>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#00113a' }}>Review Pulse</p>
              <p className="text-xs" style={{ color: '#444650' }}>ניהול מוניטין</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 cursor-pointer text-right
                  ${active
                    ? 'font-bold'
                    : 'hover:bg-surface-container-high'
                  }
                `}
                style={active
                  ? { backgroundColor: 'rgba(135,29,211,0.08)', color: '#871dd3' }
                  : { color: '#444650' }
                }
              >
                <span
                  className={`material-symbols-outlined text-[22px] ${active ? 'icon-filled' : ''}`}
                >
                  {icon}
                </span>
                <span className="text-sm font-medium">{label}</span>
                {active && (
                  <span
                    className="mr-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#871dd3' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Upgrade CTA */}
        <div className="p-4 border-t" style={{ borderColor: '#c5c6d2' }}>
          <div
            className="rounded-xl p-4 mb-3"
            style={{ background: 'linear-gradient(135deg, #00113a 0%, #871dd3 100%)' }}
          >
            <p className="text-white text-xs font-semibold mb-1">שדרג ל-Pro</p>
            <p className="text-white/70 text-xs mb-3">קבל גישה לכל הכלים המתקדמים</p>
            <button
              className="w-full bg-white text-xs font-bold py-2 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
              style={{ color: '#871dd3' }}
            >
              שדרג עכשיו
            </button>
          </div>
          <button
            onClick={() => navigate('/auth/login')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-container cursor-pointer"
            style={{ color: '#444650' }}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            יציאה
          </button>
        </div>
      </aside>
    </>
  );
}
