import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ── CSS keyframes ──────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes blob-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    25%      { transform: translate(40px,-50px) scale(1.12); }
    50%      { transform: translate(-30px,30px) scale(0.92); }
    75%      { transform: translate(20px,40px) scale(1.06); }
  }
  @keyframes particle-rise {
    0%   { transform: translateY(0) translateX(0);   opacity: 0; }
    8%   { opacity: 0.55; }
    90%  { opacity: 0.55; }
    100% { transform: translateY(-640px) translateX(60px); opacity: 0; }
  }
  @keyframes shimmer-sweep {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes gradient-shift {
    0%,100% { background-position: 0% 50%; }
    50%     { background-position: 100% 50%; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse-glow {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%     { opacity: 1;   transform: scale(1.06); }
  }
  @keyframes float-badge {
    0%,100% { transform: translateY(0px) rotate(-2deg); }
    50%     { transform: translateY(-10px) rotate(2deg); }
  }
  @keyframes blink {
    0%,100% { opacity: 1; }
    50%     { opacity: 0; }
  }
  .shimmer-btn {
    background-size: 300% auto;
    animation: shimmer-sweep 3s linear infinite;
  }
  .blob { animation: blob-drift ease-in-out infinite; will-change: transform; }
  .gradient-text-anim {
    background-size: 200% auto;
    animation: gradient-shift 4s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .pro-card-border {
    position: relative;
    z-index: 0;
  }
  .pro-card-border::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 18px;
    background: linear-gradient(135deg,#871dd3,#60a5fa,#a855f7,#871dd3);
    background-size: 300% 300%;
    animation: gradient-shift 3s ease infinite;
    z-index: -1;
  }
  .card-tilt {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .card-tilt:hover {
    transform: translateY(-6px) rotate(-0.5deg);
  }
`;

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(target: number, duration = 1800, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

function useScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const update = () => {
      const el  = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return pct;
}

function useMouseSpotlight(ref: React.RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ x: 0, y: 0, active: false });
  const update = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, [ref]);
  const deactivate = useCallback(() => setPos((p) => ({ ...p, active: false })), []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('mousemove', update);
    el.addEventListener('mouseleave', deactivate);
    return () => { el.removeEventListener('mousemove', update); el.removeEventListener('mouseleave', deactivate); };
  }, [ref, update, deactivate]);
  return pos;
}

// ── Data ───────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: 'star',                title: 'ניהול ביקורות במקום אחד',   desc: 'Google, Facebook, TripAdvisor ו-Wolt -- כל הביקורות מסונכרנות אוטומטית לדשבורד אחד.',                       color: '#871dd3', bg: 'rgba(135,29,211,0.08)' },
  { icon: 'smart_toy',           title: 'תגובות AI חכמות',           desc: 'המערכת מנתחת את הסנטימנט ומציעה תגובה מדויקת לכל ביקורת -- בסגנון שבחרת.',                                 color: '#2563eb', bg: 'rgba(37,99,235,0.08)'   },
  { icon: 'notifications_active',title: 'התראות בזמן אמת',           desc: 'קבל התראה מיידית לאימייל, WhatsApp או דפדפן ברגע שמגיעה ביקורת חדשה.',                                       color: '#d97706', bg: 'rgba(217,119,6,0.08)'   },
  { icon: 'analytics',           title: 'אנליטיקס מעמיק',            desc: 'גרפים ומגמות שמראים לך מתי הביקורות מגיעות, מאיפה ומה הלקוחות כותבים הכי הרבה.',                            color: '#16a34a', bg: 'rgba(22,163,74,0.08)'   },
  { icon: 'group',               title: 'ניהול צוות',                 desc: 'הוסף חברי צוות עם הרשאות מותאמות -- מנהל, מנהל ביקורות, או צופה בלבד.',                                    color: '#dc2626', bg: 'rgba(220,38,38,0.08)'   },
  { icon: 'description',         title: 'דוחות מותאמים',             desc: 'ייצא דוחות PDF ו-Excel עם ביצועי הביקורות, סנטימנט ומגמות לאורך זמן.',                                       color: '#0891b2', bg: 'rgba(8,145,178,0.08)'   },
];

const STEPS = [
  { num: '01', icon: 'link',     title: 'חבר את הפלטפורמות', desc: 'חיבור חד-פעמי ל-Google Business, Facebook ופלטפורמות נוספות. הביקורות מסונכרנות אוטומטית.' },
  { num: '02', icon: 'smart_toy',title: 'AI יוצר תגובות',    desc: 'לכל ביקורת נוצרות 4 הצעות תגובה בסגנון שבחרת -- רכה, נחרצת, מתנצלת ועוד.'               },
  { num: '03', icon: 'thumb_up', title: 'אשר ופרסם',         desc: 'בחר תגובה, ערוך אם רוצה ופרסם ישירות לפלטפורמה -- הכל בלחיצה אחת.'                       },
];

const STATS = [
  { target: 12000, format: (n: number) => `${n.toLocaleString()}+`, label: 'ביקורות מנוהלות' },
  { target: 850,   format: (n: number) => `${n}+`,                  label: 'עסקים רשומים'    },
  { target: 94,    format: (n: number) => `${n}%`,                  label: 'שיפור בדירוג'     },
  { target: 3,     format: (n: number) => `${n} שעות`,              label: 'חסכון שבועי'      },
];

const PLANS = [
  {
    id: 'free', name: 'חינמי', price: '₪0', period: 'לתמיד', color: '#444650',
    gradient: 'linear-gradient(135deg,#444650,#757682)', highlight: false,
    features: ['עד 100 ביקורות/חודש','30 תגובות AI','פלטפורמה אחת','דוחות בסיסיים','משתמש אחד'],
    cta: 'התחל חינם',
  },
  {
    id: 'pro', name: 'Pro', price: '₪149', period: 'לחודש', color: '#871dd3',
    gradient: 'linear-gradient(135deg,#002366,#871dd3)', highlight: true,
    features: ['ביקורות ללא הגבלה','AI תגובות ללא הגבלה','כל הפלטפורמות','דוחות מותאמים','עד 5 משתמשים','תמיכה מועדפת'],
    cta: 'התחל עם Pro',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: '₪399', period: 'לחודש', color: '#002366',
    gradient: 'linear-gradient(135deg,#001033,#002366)', highlight: false,
    features: ['הכל ב-Pro','משתמשים ללא הגבלה','גישת API','מנהל חשבון ייעודי','SLA 99.9%','תמיכת VIP 24/7'],
    cta: 'צור קשר',
  },
];

const TESTIMONIALS = [
  { name: 'דנה כהן',  role: 'בעלת מסעדה, תל אביב',      initials: 'דכ', rating: 5, color: '#871dd3', text: 'לפני Review Pulse הייתי מחמיצה ביקורות שלמות בגוגל. היום אני עונה לכולן תוך שעות ורואה עלייה ישירה בדירוג.' },
  { name: 'יוסי לוי', role: 'מנהל רשת מספרות, חיפה',    initials: 'יל', rating: 5, color: '#2563eb', text: 'ניהול 3 סניפים עם צוות מחייב הרשאות ברורות. המערכת עשתה לנו סדר -- כל אחד יודע מה תפקידו.'              },
  { name: 'מיכל גרין',role: 'מנכ"לית בוטיק, ירושלים',   initials: 'מג', rating: 5, color: '#16a34a', text: 'תגובות ה-AI מדויקות בטירוף. הן נשמעות כמוני -- לא כמו בוט. הלקוחות מגיבים הרבה יותר חיובי.'            },
];

// Pre-compute particles so they don't regenerate on each render
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left:     ((i * 47 + 11) % 96) + 2,
  bottom:   ((i * 31 + 7)  % 40),
  delay:    (i * 0.41)   % 6,
  duration: 10 + (i * 1.1) % 8,
  size:     1.5 + (i * 0.3) % 2.5,
  opacity:  0.25 + (i * 0.04) % 0.35,
}));

const YEARLY: Record<string, string> = { free: '₪0', pro: '₪119', enterprise: '₪319' };

// ── Sub-components ─────────────────────────────────────────────────────────────

function ScrollProgressBar({ pct }: { pct: number }) {
  return (
    <div className="fixed top-0 inset-x-0 z-[60] h-[3px]" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full transition-none"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(to left,#a855f7,#60a5fa,#871dd3)',
          boxShadow: '0 0 8px rgba(168,85,247,0.8)',
        }}
      />
    </div>
  );
}

function FadeSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.65s ${delay}ms ease, transform 0.65s ${delay}ms ease`,
      }}
    >
      {children}
    </div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="material-symbols-outlined text-[16px] icon-filled" style={{ color: '#f59e0b' }}>star</span>
      ))}
    </div>
  );
}

function StatCounter({ target, format, label, active }: { target: number; format: (n: number) => string; label: string; active: boolean }) {
  const val = useCountUp(target, 1800, active);
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-extrabold text-white mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {format(val)}
      </p>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef  = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [mobileMenu, setMobileMenu]   = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [billing, setBilling]         = useState<'monthly' | 'yearly'>('monthly');
  const [statsVisible, setStatsVisible] = useState(false);

  const scrollPct  = useScrollProgress();
  const spotlight  = useMouseSpotlight(heroRef as React.RefObject<HTMLElement>);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Trigger stats counter when the section enters view
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa', direction: 'rtl' }}>
      <style>{STYLES}</style>

      {/* ── Scroll progress ── */}
      <ScrollProgressBar pct={scrollPct} />

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.94)' : 'transparent',
          backdropFilter:  scrolled ? 'blur(14px)' : 'none',
          boxShadow:       scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
          borderBottom:    scrolled ? '1px solid rgba(197,198,210,0.3)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}>
              <span className="material-symbols-outlined text-white text-[16px] icon-filled">star</span>
            </div>
            <span className="font-extrabold text-lg" style={{ color: scrolled ? '#00113a' : '#fff' }}>Review Pulse</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {[["פיצ'רים",'features'],['איך זה עובד','how'],['מחירים','pricing'],['המלצות','testimonials']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm font-medium cursor-pointer transition-all hover:opacity-60"
                style={{ color: scrolled ? '#444650' : 'rgba(255,255,255,0.85)' }}>
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/auth/login')}
              className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all hover:opacity-75"
              style={{ color: scrolled ? '#871dd3' : '#fff', border: `1.5px solid ${scrolled ? '#871dd3' : 'rgba(255,255,255,0.55)'}` }}>
              התחבר
            </button>
            <button onClick={() => navigate('/auth/register')}
              className="shimmer-btn px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              style={{ background: 'linear-gradient(to left,#871dd3,#60a5fa,#871dd3)', color: '#fff', boxShadow: '0 4px 14px rgba(135,29,211,0.4)' }}>
              התחל חינם
            </button>
          </div>

          <button className="md:hidden p-2 rounded-lg cursor-pointer" style={{ color: scrolled ? '#444650' : '#fff' }}
            onClick={() => setMobileMenu(!mobileMenu)}>
            <span className="material-symbols-outlined">{mobileMenu ? 'close' : 'menu'}</span>
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden px-5 pb-5 pt-2 flex flex-col gap-2" style={{ backgroundColor: '#fff', borderTop: '1px solid rgba(197,198,210,0.3)' }}>
            {[["פיצ'רים",'features'],['איך זה עובד','how'],['מחירים','pricing'],['המלצות','testimonials']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-sm font-medium text-right py-2 cursor-pointer" style={{ color: '#444650' }}>{label}</button>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/auth/login')}   className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer border" style={{ color: '#871dd3', borderColor: '#871dd3' }}>התחבר</button>
              <button onClick={() => navigate('/auth/register')} className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer" style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>התחל חינם</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#00113a 0%,#001a55 40%,#3b0070 100%)' }}
      >
        {/* Mouse spotlight */}
        {spotlight.active && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: spotlight.x - 200, top: spotlight.y - 200,
              width: 400, height: 400,
              background: 'radial-gradient(circle,rgba(135,29,211,0.18) 0%,transparent 70%)',
              borderRadius: '50%',
              transition: 'opacity 0.2s',
            }}
          />
        )}

        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="blob absolute opacity-25"
            style={{ top: '18%', right: '20%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,#871dd3,transparent)', filter: 'blur(64px)', animationDuration: '14s' }} />
          <div className="blob absolute opacity-15"
            style={{ bottom: '20%', left: '25%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,#2563eb,transparent)', filter: 'blur(50px)', animationDuration: '18s', animationDelay: '-4s' }} />
          <div className="blob absolute opacity-12"
            style={{ top: '40%', left: '15%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,#f59e0b,transparent)', filter: 'blur(42px)', animationDuration: '22s', animationDelay: '-9s' }} />
          <div className="blob absolute opacity-10"
            style={{ bottom: '35%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,#16a34a,transparent)', filter: 'blur(55px)', animationDuration: '25s', animationDelay: '-13s' }} />
        </div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.left}%`,
                bottom: `${p.bottom}%`,
                width:  p.size,
                height: p.size,
                backgroundColor: `rgba(168,85,247,${p.opacity})`,
                animation: `particle-rise ${p.duration}s ${p.delay}s linear infinite`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-5 text-center pt-24 pb-16">
          {/* Animated badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-semibold"
            style={{
              backgroundColor: 'rgba(135,29,211,0.25)',
              color: '#e0b6ff',
              border: '1px solid rgba(135,29,211,0.4)',
              animation: 'float-badge 4s ease-in-out infinite',
            }}
          >
            <span className="material-symbols-outlined text-[14px] icon-filled" style={{ color: '#e0b6ff' }}>auto_awesome</span>
            מנוע ה-AI הכי חכם לניהול מוניטין בישראל
          </div>

          {/* Headline with animated gradient on key phrase */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-white">
            כל הביקורות שלך{' '}
            <span
              className="gradient-text-anim"
              style={{ backgroundImage: 'linear-gradient(135deg,#a855f7,#60a5fa,#f472b6,#a855f7)' }}
            >
              במקום אחד
            </span>
            <br />
            תגובות AI שנשמעות כמוך
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            Review Pulse מסנכרן ביקורות מכל הפלטפורמות, מנתח סנטימנט בעברית ומציע תגובות מותאמות אישית -- כדי שתוכל לשמור על מוניטין מושלם בלי לבזבז שעות.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => navigate('/auth/register')}
              className="shimmer-btn w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold cursor-pointer"
              style={{
                background: 'linear-gradient(to left,#871dd3,#a855f7,#60a5fa,#871dd3)',
                color: '#fff',
                boxShadow: '0 8px 32px rgba(135,29,211,0.5)',
              }}
            >
              <span className="material-symbols-outlined text-[20px] icon-filled">rocket_launch</span>
              התחל חינם -- ללא כרטיס אשראי
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold cursor-pointer transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              כניסה למשתמש קיים
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {[{ icon: 'verified_user', text: 'SSL מאובטח' }, { icon: 'credit_card_off', text: 'ללא כרטיס אשראי' }, { icon: 'cancel', text: 'ביטול בכל עת' }].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                <span className="material-symbols-outlined text-[16px] icon-filled" style={{ color: 'rgba(135,29,211,0.9)' }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ animation: 'float-badge 2s ease-in-out infinite' }}>
          <span className="material-symbols-outlined text-[28px]" style={{ color: 'rgba(255,255,255,0.35)' }}>keyboard_arrow_down</span>
        </div>
      </section>

      {/* ── Stats (animated counters) ── */}
      <section style={{ background: 'linear-gradient(135deg,#00113a,#002366)' }}>
        <div ref={statsRef} className="max-w-5xl mx-auto px-5 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ target, format, label }) => (
            <StatCounter key={label} target={target} format={format} label={label} active={statsVisible} />
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-14">
            <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4" style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}>
              הפיצ'רים
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#00113a' }}>כלים חכמים לניהול מוניטין</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#757682' }}>
              מסונכרן עם כל הפלטפורמות, עובד בעברית ומציע אינטליגנציה מלאכותית שמבינה את הלקוחות שלך.
            </p>
          </FadeSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FadeSection key={f.title} delay={i * 70}>
                <div
                  className="card-tilt h-full rounded-2xl p-6 cursor-default"
                  style={{ backgroundColor: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(197,198,210,0.3)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${f.color}22`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'; }}
                >
                  {/* Icon with pulse glow */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative" style={{ backgroundColor: f.bg }}>
                    <span className="material-symbols-outlined text-[22px] icon-filled" style={{ color: f.color }}>{f.icon}</span>
                    <div className="absolute inset-0 rounded-xl" style={{ backgroundColor: f.bg, animation: 'pulse-glow 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }} />
                    <span className="material-symbols-outlined text-[22px] icon-filled relative z-10" style={{ color: f.color, position: 'absolute' }}>{f.icon}</span>
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#00113a' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#757682' }}>{f.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20 px-5" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-14">
            <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4" style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
              איך זה עובד
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#00113a' }}>שלושה צעדים לשלוט במוניטין</h2>
            <p className="text-lg" style={{ color: '#757682' }}>הגדרה פעם אחת, תוצאות מדי יום.</p>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 right-[16.5%] left-[16.5%] h-0.5"
              style={{ background: 'linear-gradient(to left,rgba(135,29,211,0.12),rgba(135,29,211,0.5),rgba(135,29,211,0.12))' }} />

            {STEPS.map((s, i) => (
              <FadeSection key={s.num} delay={i * 130}>
                <div className="flex flex-col items-center text-center group">
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', boxShadow: '0 8px 28px rgba(135,29,211,0.35)' }}>
                      <span className="material-symbols-outlined text-white text-[28px] icon-filled">{s.icon}</span>
                    </div>
                    {/* Spinning ring on hover */}
                    <div className="absolute inset-[-6px] rounded-[20px] border-2 border-dashed opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ borderColor: 'rgba(135,29,211,0.4)', animation: 'spin-slow 6s linear infinite' }} />
                    <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold" style={{ backgroundColor: '#f59e0b', color: '#fff' }}>
                      {s.num.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#00113a' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#757682' }}>{s.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-5" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-10">
            <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>מחירים</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#00113a' }}>שקוף, פשוט, ללא הפתעות</h2>
            <p className="text-lg mb-8" style={{ color: '#757682' }}>התחל חינם ושדרג כשתהיה מוכן.</p>
            <div className="inline-flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              {(['monthly','yearly'] as const).map((p) => (
                <button key={p} onClick={() => setBilling(p)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all"
                  style={billing === p ? { backgroundColor: '#00113a', color: '#fff' } : { color: '#757682' }}>
                  {p === 'monthly' ? 'חודשי' : 'שנתי'}
                  {p === 'yearly' && <span className="mr-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>-20%</span>}
                </button>
              ))}
            </div>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {PLANS.map((plan, i) => (
              <FadeSection key={plan.id} delay={i * 100}>
                {plan.highlight ? (
                  // Pro card -- animated gradient border
                  <div className="pro-card-border rounded-[18px]" style={{ transform: 'scale(1.03)' }}>
                    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff' }}>
                      <div className="py-2 text-center text-xs font-extrabold tracking-wide" style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}>
                        הכי פופולרי
                      </div>
                      <PlanBody plan={plan} billing={billing} navigate={navigate} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ backgroundColor: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(197,198,210,0.3)' }}>
                    <PlanBody plan={plan} billing={billing} navigate={navigate} />
                  </div>
                )}
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 px-5" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-14">
            <span className="inline-block text-sm font-bold px-4 py-1.5 rounded-full mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#d97706' }}>המלצות</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#00113a' }}>עסקים ישראלים אוהבים אותנו</h2>
            <p className="text-lg" style={{ color: '#757682' }}>מה אומרים בעלי עסקים שכבר עובדים עם Review Pulse.</p>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeSection key={t.name} delay={i * 100}>
                <div
                  className="card-tilt rounded-2xl p-6 h-full flex flex-col cursor-default"
                  style={{ backgroundColor: '#f8f9fa', border: '1px solid rgba(197,198,210,0.3)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${t.color}18`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <StarRating count={t.rating} />
                  <p className="text-sm leading-relaxed mt-4 flex-1" style={{ color: '#444650' }}>"{t.text}"</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: `${t.color}18`, color: t.color }}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#00113a' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: '#757682' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-5">
        <FadeSection className="max-w-3xl mx-auto">
          <div className="rounded-3xl p-10 text-center overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg,#00113a 0%,#871dd3 100%)' }}>
            {/* Animated glow blob */}
            <div className="blob absolute top-0 right-0 w-64 h-64 rounded-full opacity-25 pointer-events-none"
              style={{ background: 'radial-gradient(circle,#a855f7,transparent)', filter: 'blur(42px)', animationDuration: '12s' }} />

            <div className="relative z-10">
              <span className="material-symbols-outlined text-[40px] icon-filled text-white mb-4 block"
                style={{ animation: 'float-badge 3s ease-in-out infinite', opacity: 0.9 }}>
                rocket_launch
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">מוכן לשלוט במוניטין שלך?</h2>
              <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
                הצטרף ל-850+ עסקים ישראלים שכבר מנהלים ביקורות חכם יותר.<br />
                ללא כרטיס אשראי, ביטול בכל עת.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => navigate('/auth/register')}
                  className="shimmer-btn flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base cursor-pointer"
                  style={{ background: 'linear-gradient(to left,#fff,#f3e8ff,#fff)', color: '#871dd3', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
                  <span className="material-symbols-outlined text-[20px] icon-filled">person_add</span>
                  צור חשבון חינמי
                </button>
                <button onClick={() => navigate('/auth/login')}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base cursor-pointer transition-all hover:opacity-80"
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.35)' }}>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  כניסה
                </button>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: '#00113a' }}>
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}>
                <span className="material-symbols-outlined text-white text-[14px] icon-filled">star</span>
              </div>
              <span className="font-extrabold text-base text-white">Review Pulse</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {[["פיצ'רים",'features'],['מחירים','pricing'],['המלצות','testimonials']].map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-sm cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</button>
              ))}
              <button onClick={() => navigate('/auth/login')}    className="text-sm cursor-pointer hover:opacity-60" style={{ color: 'rgba(255,255,255,0.6)' }}>כניסה</button>
              <button onClick={() => navigate('/auth/register')} className="text-sm cursor-pointer hover:opacity-60" style={{ color: 'rgba(255,255,255,0.6)' }}>הרשמה</button>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>© 2025 Review Pulse. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── PlanBody (extracted to avoid repetition) ───────────────────────────────────

function PlanBody({ plan, billing, navigate }: {
  plan: typeof PLANS[number];
  billing: 'monthly' | 'yearly';
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: plan.gradient }}>
          <span className="material-symbols-outlined text-white text-[18px] icon-filled">
            {plan.id === 'free' ? 'favorite' : plan.id === 'pro' ? 'stars' : 'diamond'}
          </span>
        </div>
        <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${plan.color}15`, color: plan.color }}>{plan.name}</span>
      </div>
      <div className="mb-5">
        <span className="text-4xl font-extrabold" style={{ color: '#00113a' }}>
          {billing === 'yearly' ? YEARLY[plan.id] : plan.price}
        </span>
        <span className="text-sm mr-1" style={{ color: '#757682' }}>/{plan.period}</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#444650' }}>
            <span className="material-symbols-outlined text-[16px] icon-filled flex-shrink-0" style={{ color: plan.color }}>check_circle</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => navigate('/auth/register')}
        className="w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-all hover:opacity-90"
        style={plan.highlight
          ? { background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff', boxShadow: '0 4px 16px rgba(135,29,211,0.3)' }
          : { backgroundColor: '#f3f4f5', color: '#00113a' }}>
        {plan.cta}
      </button>
    </div>
  );
}
