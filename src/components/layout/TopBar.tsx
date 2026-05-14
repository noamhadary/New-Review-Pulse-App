import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const STORES = ['חנות מרכזית', 'סניף תל אביב', 'סניף חיפה', 'סניף ירושלים'];

const NAV_LINKS = [
  { label: 'לוח בקרה',  path: '/dashboard' },
  { label: 'ביקורות',   path: '/reviews' },
  { label: 'ניתוח',     path: '/analytics' },
  { label: 'דוחות',     path: '/reports' },
  { label: 'הגדרות',    path: '/settings' },
];

const NOTIFICATIONS = [
  {
    id: '1',
    icon: 'priority_high',
    color: '#ba1a1a',
    text: '3 ביקורות חדשות דורשות תגובה',
    time: 'לפני 5 דקות',
    path: '/reviews',
  },
  {
    id: '2',
    icon: 'trending_up',
    color: '#871dd3',
    text: 'הציון שלך עלה ל-4.8',
    time: 'לפני שעה',
    path: '/analytics',
  },
  {
    id: '3',
    icon: 'description',
    color: '#16a34a',
    text: 'הדוח השבועי מוכן להורדה',
    time: 'לפני 3 שעות',
    path: '/reports',
  },
];

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const [notifOpen, setNotifOpen]   = useState(false);
  const [storeOpen, setStoreOpen]   = useState(false);
  const [activeStore, setActiveStore] = useState(STORES[0]);
  const navigate  = useNavigate();
  const location  = useLocation();
  const notifRef  = useRef<HTMLDivElement>(null);
  const storeRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 left-0 z-50 h-16 flex items-center justify-between px-6 md:px-16 shadow-md"
      style={{ backgroundColor: '#002366', color: '#ffffff' }}
    >
      {/* Logo + Nav */}
      <div className="flex items-center gap-8">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          onClick={onMenuToggle}
          aria-label="פתח תפריט"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1
          className="text-xl font-bold cursor-pointer select-none"
          onClick={() => navigate('/dashboard')}
        >
          Review Pulse
        </h1>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all"
                style={active
                  ? { backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }
                  : { color: 'rgba(255,255,255,0.7)' }
                }
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Store switcher */}
        <div ref={storeRef} className="relative hidden sm:block">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <span className="material-symbols-outlined text-white text-[20px]">store</span>
            <span className="text-sm font-semibold text-white">{activeStore}</span>
            <span
              className="material-symbols-outlined text-white text-[18px] transition-transform duration-200"
              style={{ transform: storeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              expand_more
            </span>
          </button>
          {storeOpen && (
            <div
              className="absolute left-0 top-11 w-48 rounded-xl overflow-hidden"
              style={{ backgroundColor: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid rgba(197,198,210,0.3)' }}
            >
              <div className="p-2 border-b" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
                <p className="text-xs font-semibold px-2 py-1" style={{ color: '#757682' }}>בחר סניף</p>
              </div>
              {STORES.map((store) => (
                <button
                  key={store}
                  onClick={() => { setActiveStore(store); setStoreOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-right transition-colors cursor-pointer"
                  style={{ color: activeStore === store ? '#871dd3' : '#191c1d' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f8f9fa'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  <span className="font-medium">{store}</span>
                  {activeStore === store && (
                    <span className="material-symbols-outlined text-[16px] icon-filled" style={{ color: '#871dd3' }}>
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer relative"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="התראות"
          >
            <span className="material-symbols-outlined text-white">notifications</span>
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#871dd3' }}
            />
          </button>
          {notifOpen && (
            <div
              className="absolute left-0 top-12 w-80 rounded-xl overflow-hidden"
              style={{ backgroundColor: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid rgba(197,198,210,0.3)' }}
            >
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
                <p className="font-semibold text-sm" style={{ color: '#00113a' }}>התראות</p>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}
                >
                  {NOTIFICATIONS.length}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(197,198,210,0.2)' }}>
                {NOTIFICATIONS.map(({ id, icon, color, text, time, path }) => (
                  <button
                    key={id}
                    onClick={() => { navigate(path); setNotifOpen(false); }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-right transition-colors cursor-pointer hover:bg-gray-50"
                  >
                    <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0" style={{ color }}>
                      {icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#191c1d' }}>{text}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#757682' }}>{time}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 border-t" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
                <button
                  onClick={() => { navigate('/reviews'); setNotifOpen(false); }}
                  className="w-full text-xs font-semibold text-center py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ color: '#871dd3' }}
                >
                  צפה בכל ההתראות
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <button
          className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="פרופיל"
          onClick={() => navigate('/settings')}
        >
          <span className="material-symbols-outlined text-white">account_circle</span>
        </button>
      </div>
    </header>
  );
}
