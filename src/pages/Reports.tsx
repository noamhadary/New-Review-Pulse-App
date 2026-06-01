import { useState } from 'react';
import { useReviews } from '../hooks/useReviews';

// ── Types ──────────────────────────────────────────────────────────────────────

type ReportType = 'weekly' | 'monthly' | 'platform' | 'yearly' | 'custom';
type ReportStatus = 'ready' | 'scheduled' | 'generating';

interface Report {
  id: string;
  name: string;
  type: ReportType;
  date: string;
  reviews: number;
  status: ReportStatus;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<ReportType, { label: string; icon: string; color: string; bg: string }> = {
  weekly:   { label: 'שבועי',    icon: 'calendar_view_week',  color: '#2563eb', bg: '#dbeafe' },
  monthly:  { label: 'חודשי',   icon: 'calendar_month',      color: '#871dd3', bg: 'rgba(135,29,211,0.1)' },
  platform: { label: 'פלטפורמות', icon: 'language',           color: '#16a34a', bg: '#dcfce7' },
  yearly:   { label: 'שנתי',    icon: 'bar_chart',           color: '#d97706', bg: '#fef3c7' },
  custom:   { label: 'מותאם',   icon: 'tune',                color: '#444650', bg: '#edeeef' },
};

const INITIAL_REPORTS: Report[] = [
  { id: '1', name: 'דוח שבועי — 1–8 דצמבר 2024',        type: 'weekly',   date: '2024-12-08', reviews: 47,   status: 'ready' },
  { id: '2', name: 'דוח חודשי — נובמבר 2024',           type: 'monthly',  date: '2024-11-30', reviews: 184,  status: 'ready' },
  { id: '3', name: 'ניתוח פלטפורמות — Q4 2024',          type: 'platform', date: '2024-12-01', reviews: 312,  status: 'ready' },
  { id: '4', name: 'דוח שבועי — 25 נוב – 1 דצמ 2024',  type: 'weekly',   date: '2024-12-01', reviews: 39,   status: 'ready' },
  { id: '5', name: 'דוח חודשי — אוקטובר 2024',          type: 'monthly',  date: '2024-10-31', reviews: 201,  status: 'ready' },
  { id: '6', name: 'דוח ביצועים שנתי 2024',              type: 'yearly',   date: '2024-12-31', reviews: 1847, status: 'scheduled' },
];

type FilterTab = 'all' | ReportType;
const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',      label: 'הכל' },
  { id: 'weekly',   label: 'שבועי' },
  { id: 'monthly',  label: 'חודשי' },
  { id: 'platform', label: 'פלטפורמות' },
  { id: 'yearly',   label: 'שנתי' },
];

// ── Create-report modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreate: (report: Report) => void;
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [type, setType]     = useState<ReportType>('monthly');
  const [range, setRange]   = useState('this_month');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [step, setStep]     = useState<'form' | 'generating' | 'done'>('form');

  const RANGE_OPTIONS = [
    { value: 'this_week',  label: 'שבוע זה' },
    { value: 'last_week',  label: 'שבוע שעבר' },
    { value: 'this_month', label: 'חודש זה' },
    { value: 'last_month', label: 'חודש שעבר' },
    { value: 'last_3m',    label: '3 חודשים אחרונים' },
    { value: 'this_year',  label: 'שנה זו' },
  ];

  const handleGenerate = () => {
    setStep('generating');
    setTimeout(() => {
      setStep('done');
      const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? range;
      onCreate({
        id: Date.now().toString(),
        name: `${TYPE_META[type].label} — ${rangeLabel}`,
        type,
        date: new Date().toISOString().slice(0, 10),
        reviews: Math.floor(Math.random() * 200) + 20,
        status: 'ready',
      });
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,17,58,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}
      >
        {/* Modal header */}
        <div
          className="px-6 py-5 flex items-center justify-between border-b"
          style={{ borderColor: 'rgba(197,198,210,0.3)' }}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] icon-filled" style={{ color: '#871dd3' }}>
              description
            </span>
            <h2 className="text-lg font-bold" style={{ color: '#00113a' }}>יצירת דוח חדש</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
            <span className="material-symbols-outlined" style={{ color: '#444650' }}>close</span>
          </button>
        </div>

        <div className="p-6">
          {step === 'form' && (
            <>
              {/* Type selector */}
              <p className="text-sm font-semibold mb-3" style={{ color: '#00113a' }}>סוג הדוח</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {(['weekly', 'monthly', 'platform', 'yearly'] as ReportType[]).map((t) => {
                  const meta = TYPE_META[t];
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-right transition-all cursor-pointer"
                      style={{
                        border: `2px solid ${active ? meta.color : 'rgba(197,198,210,0.4)'}`,
                        backgroundColor: active ? meta.bg : '#f8f9fa',
                      }}
                    >
                      <span className="material-symbols-outlined text-[20px] icon-filled" style={{ color: meta.color }}>
                        {meta.icon}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                      {active && (
                        <span className="material-symbols-outlined text-[14px] icon-filled mr-auto" style={{ color: meta.color }}>
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Date range */}
              <p className="text-sm font-semibold mb-2" style={{ color: '#00113a' }}>טווח תאריכים</p>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-5 cursor-pointer"
                style={{ backgroundColor: '#f3f4f5', border: '1px solid rgba(197,198,210,0.5)', color: '#191c1d' }}
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Format */}
              <p className="text-sm font-semibold mb-2" style={{ color: '#00113a' }}>פורמט</p>
              <div className="flex gap-2 mb-6">
                {(['pdf', 'excel', 'csv'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
                    style={format === f
                      ? { backgroundColor: '#871dd3', color: '#fff' }
                      : { backgroundColor: '#f3f4f5', color: '#444650', border: '1px solid rgba(197,198,210,0.5)' }
                    }
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#fff' }}
              >
                <span className="material-symbols-outlined text-[18px] icon-filled">auto_awesome</span>
                צור דוח
              </button>
            </>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
                style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}
              >
                <span className="material-symbols-outlined text-white text-[28px] icon-filled">description</span>
              </div>
              <p className="text-base font-bold" style={{ color: '#00113a' }}>מייצר את הדוח...</p>
              <p className="text-sm" style={{ color: '#757682' }}>אוסף נתונים ומנתח מגמות</p>
              <div className="w-48 h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: '#edeeef' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: '60%', background: 'linear-gradient(90deg,#002366,#871dd3)', animation: 'pulse 1.5s ease-in-out infinite' }}
                />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <span className="material-symbols-outlined text-[32px] icon-filled" style={{ color: '#16a34a' }}>
                  check_circle
                </span>
              </div>
              <p className="text-base font-bold" style={{ color: '#00113a' }}>הדוח מוכן!</p>
              <p className="text-sm" style={{ color: '#757682' }}>הדוח נוצר בהצלחה וזמין להורדה</p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all hover:opacity-90"
                style={{ backgroundColor: '#16a34a', color: '#fff' }}
              >
                סגור
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report row ─────────────────────────────────────────────────────────────────

function ReportRow({ report, onDelete, onDownload }: {
  report: Report;
  onDelete: (id: string) => void;
  onDownload: (report: Report) => void;
}) {
  const meta = TYPE_META[report.type];
  const dateStr = new Date(report.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid rgba(197,198,210,0.2)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f8f9fa'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: meta.bg }}
          >
            <span className="material-symbols-outlined text-[18px] icon-filled" style={{ color: meta.color }}>
              {meta.icon}
            </span>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#00113a' }}>{report.name}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm" style={{ color: '#444650' }}>{dateStr}</span>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm font-medium" style={{ color: '#191c1d' }}>
          {report.reviews.toLocaleString('he-IL')}
        </span>
      </td>
      <td className="px-5 py-4">
        {report.status === 'ready' ? (
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#16a34a' }}>
            <span className="material-symbols-outlined text-[14px] icon-filled">check_circle</span>
            מוכן
          </span>
        ) : report.status === 'scheduled' ? (
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#d97706' }}>
            <span className="material-symbols-outlined text-[14px] icon-filled">schedule</span>
            מתוזמן
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#871dd3' }}>
            <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
            מייצר...
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => onDownload(report)}
            disabled={report.status !== 'ready'}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            הורד
          </button>
          <button
            onClick={() => onDelete(report.id)}
            className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-red-50"
            style={{ color: '#ba1a1a' }}
          >
            <span className="material-symbols-outlined text-[18px]">delete_outline</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Reports() {
  const [reports, setReports]       = useState<Report[]>(INITIAL_REPORTS);
  const [filter, setFilter]         = useState<FilterTab>('all');
  const [showModal, setShowModal]   = useState(false);
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const { reviews } = useReviews();

  const visible = filter === 'all' ? reports : reports.filter((r) => r.type === filter);

  const handleCreate = (report: Report) => {
    setReports((prev) => [report, ...prev]);
  };

  const handleDelete = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDownload = (report: Report) => {
    const header = ['שם לקוח', 'פלטפורמה', 'דירוג', 'סנטימנט', 'סטטוס', 'תאריך', 'תוכן'].join(',');
    const rows = reviews.map((r) =>
      [`"${r.reviewer_name}"`, r.platform, r.rating, r.sentiment, r.status,
       new Date(r.created_at).toLocaleDateString('he-IL'),
       `"${r.content.replace(/"/g, '""')}"`].join(',')
    );
    const csv = rows.length > 0
      ? '\uFEFF' + [header, ...rows].join('\n')
      : '\uFEFF' + [`"${report.name}",${TYPE_META[report.type].label},${report.date},${report.reviews}`].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(report.id);
    setTimeout(() => setDownloaded(null), 2000);
  };

  const readyCount     = reports.filter((r) => r.status === 'ready').length;
  const scheduledCount = reports.filter((r) => r.status === 'scheduled').length;
  const totalReviews   = reports.reduce((s, r) => s + r.reviews, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <section
        className="px-6 md:px-16 py-10"
        style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 60%, #3a0a6e 100%)' }}
      >
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">דוחות</h2>
            <p className="mt-2 text-base" style={{ color: '#758dd5' }}>
              ניהול, יצירה והורדת דוחות ביצועים
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-lg"
            style={{ backgroundColor: '#871dd3', color: '#fff' }}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            ייצור דוח חדש
          </button>
        </div>
      </section>

      {/* Summary cards */}
      <section className="px-6 md:px-16 -mt-8 mb-8 relative z-10">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label: 'דוחות מוכנים', value: readyCount.toString(), icon: 'description', color: '#871dd3' },
            { label: 'מתוזמנים', value: scheduledCount.toString(), icon: 'schedule', color: '#d97706' },
            { label: 'סה״כ ביקורות מנותחות', value: totalReviews.toLocaleString('he-IL'), icon: 'analytics', color: '#16a34a' },
          ].map(({ label, value, icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-5 flex items-center gap-4"
              style={{ backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(197,198,210,0.3)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <span className="material-symbols-outlined text-[22px] icon-filled" style={{ color }}>{icon}</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#444650' }}>{label}</p>
                <p className="text-2xl font-extrabold leading-none mt-0.5" style={{ color: '#00113a' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Table */}
      <section className="px-6 md:px-16 pb-12">
        <div className="max-w-screen-xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(197,198,210,0.2)' }}
          >
            {/* Filter tabs */}
            <div className="px-5 pt-5 pb-0 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(197,198,210,0.3)' }}>
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer"
                  style={filter === id
                    ? { borderColor: '#871dd3', color: '#871dd3' }
                    : { borderColor: 'transparent', color: '#444650' }
                  }
                >
                  {label}
                  {id === 'all' && (
                    <span
                      className="mr-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: filter === 'all' ? 'rgba(135,29,211,0.1)' : '#edeeef', color: filter === 'all' ? '#871dd3' : '#757682' }}
                    >
                      {reports.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    {['שם הדוח', 'סוג', 'תאריך', 'ביקורות', 'סטטוס', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#444650' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((report) => (
                    <ReportRow
                      key={report.id}
                      report={downloaded === report.id ? { ...report } : report}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                    />
                  ))}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <p className="text-sm" style={{ color: '#757682' }}>אין דוחות בקטגוריה זו</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreate={(r) => {
            handleCreate(r);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
