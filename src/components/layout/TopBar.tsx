import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STORES = ['חנות מרכזית', 'סניף תל אביב', 'סניף חיפה', 'סניף ירושלים'];

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
    <header className="fixed top-0 right-0 left-0 z-50 h-28 flex items-center justify-between px-6 md:px-16 shadow-md bg-primary-container text-white">
      {/* לוגו — צמוד ימין (ילד ראשון ב-RTL) */}
      <img
        src="/logo.png"
        alt="Review Pulse"
        className="cursor-pointer select-none"
        style={{ height: 50, width: 'auto', maxWidth: 180, objectFit: 'contain' }}
        onClick={() => navigate('/dashboard')}
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Store switcher */}
        <div ref={storeRef} className="relative hidden sm:block">
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-2.5 rounded-lg cursor-pointer"
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
              className="absolute left-0 top-12 w-48 rounded-xl overflow-hidden bg-white border border-outline-variant/30"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            >
              <div className="p-2 border-b border-outline-variant/30">
                <p className="text-xs font-semibold px-2 py-1 text-outline">בחר סניף</p>
              </div>
              {STORES.map((store) => (
                <button
                  key={store}
                  onClick={() => { setActiveStore(store); setStoreOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-right transition-colors cursor-pointer hover:bg-background ${
                    activeStore === store ? 'text-secondary' : 'text-on-surface'
                  }`}
                >
                  <span className="font-medium">{store}</span>
                  {activeStore === store && (
                    <span className="material-symbols-outlined text-[16px] icon-filled text-secondary">
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
            className="p-2.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer relative"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="התראות"
          >
            <span className="material-symbols-outlined text-white">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary" />
          </button>
          {notifOpen && (
            <div
              className="absolute left-0 top-13 w-80 rounded-xl overflow-hidden bg-white border border-outline-variant/30"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            >
              <div className="px-4 py-3 border-b border-outline-variant/30 flex items-center justify-between">
                <p className="font-semibold text-sm text-primary">התראות</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                  {NOTIFICATIONS.length}
                </span>
              </div>
              <div className="divide-y divide-outline-variant/20">
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
                      <p className="text-sm font-medium text-on-surface">{text}</p>
                      <p className="text-xs mt-0.5 text-outline">{time}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-outline-variant/30">
                <button
                  onClick={() => { navigate('/reviews'); setNotifOpen(false); }}
                  className="w-full text-xs font-semibold text-center py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 text-secondary"
                >
                  צפה בכל ההתראות
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <button
          className="p-2.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="פרופיל"
          onClick={() => navigate('/settings')}
        >
          <span className="material-symbols-outlined text-white">account_circle</span>
        </button>

        {/* Mobile menu */}
        <button
          className="md:hidden p-2.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          onClick={onMenuToggle}
          aria-label="פתח תפריט"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </header>
  );
}
