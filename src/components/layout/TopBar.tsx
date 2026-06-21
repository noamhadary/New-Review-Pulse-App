import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/business-context';
import { useAuth } from '../../context/auth-context';

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
  const [notifOpen, setNotifOpen]       = useState(false);
  const [storeOpen, setStoreOpen]       = useState(false);
  const [activeBranchIdx, setActiveBranchIdx] = useState(0);
  const navigate   = useNavigate();
  const { business } = useBusiness();
  const { user } = useAuth();
  const avatarInitial = (
    ((user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      business?.name ||
      user?.email ||
      '')
      .charAt(0)
      .toUpperCase()
  );
  const notifRef   = useRef<HTMLDivElement>(null);
  const storeRef   = useRef<HTMLDivElement>(null);

  // Build display-ready branch list from saved data
  const branches = useMemo(() => {
    const raw = business?.branches;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((b, i) => ({
        label:    i === 0 ? 'סניף ראשי' : `סניף ${i + 1}`,
        location: (b as { location: string }).location ?? '',
      }));
    }
    // No branches saved yet — derive single entry from business name
    return [{ label: business?.name ?? 'סניף ראשי', location: '' }];
  }, [business?.branches, business?.name]);

  const activeBranch = branches[activeBranchIdx] ?? branches[0];
  const multiBranch  = branches.length > 1;

  // Reset selection when business changes
  useEffect(() => { setActiveBranchIdx(0); }, [business?.id]);

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
        {/* Branch switcher */}
        <div ref={storeRef} className="relative hidden sm:block">
          <button
            onClick={() => multiBranch && setStoreOpen(!storeOpen)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${multiBranch ? 'bg-white/10 hover:bg-white/20 cursor-pointer' : 'bg-white/5 cursor-default'}`}
          >
            <span className="material-symbols-outlined text-white text-[20px]">store</span>
            <div className="text-right">
              <p className="text-sm font-semibold text-white leading-tight">{activeBranch.label}</p>
              {activeBranch.location && (
                <p className="text-[11px] text-white/70 leading-tight">{activeBranch.location}</p>
              )}
            </div>
            {multiBranch && (
              <span
                className="material-symbols-outlined text-white text-[18px] transition-transform duration-200"
                style={{ transform: storeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            )}
          </button>
          {multiBranch && storeOpen && (
            <div
              className="absolute left-0 top-14 w-56 rounded-xl overflow-hidden bg-white border border-outline-variant/30"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            >
              <div className="p-2 border-b border-outline-variant/30">
                <p className="text-xs font-semibold px-2 py-1 text-outline">בחר סניף</p>
              </div>
              {branches.map((branch, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveBranchIdx(i); setStoreOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-right transition-colors cursor-pointer hover:bg-background ${
                    activeBranchIdx === i ? 'text-secondary' : 'text-on-surface'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{branch.label}</p>
                    {branch.location && (
                      <p className="text-xs text-outline">{branch.location}</p>
                    )}
                  </div>
                  {activeBranchIdx === i && (
                    <span className="material-symbols-outlined text-[16px] icon-filled text-secondary flex-shrink-0">
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
          className="rounded-full hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
          aria-label="פרופיל"
          onClick={() => navigate('/settings')}
          style={{ width: 38, height: 38 }}
        >
          {business?.logo_url ? (
            <img
              src={business.logo_url}
              alt="לוגו העסק"
              className="w-full h-full rounded-full object-cover"
              style={{ border: '2px solid rgba(255,255,255,0.4)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-sm font-extrabold"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)' }}
            >
              {avatarInitial || <span className="material-symbols-outlined text-[20px]">account_circle</span>}
            </div>
          )}
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
