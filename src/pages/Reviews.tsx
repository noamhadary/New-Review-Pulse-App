import { useState, useMemo } from 'react';
import { MOCK_REVIEWS } from '../lib/mockData';
import type { Platform, Sentiment, ReviewStatus, Review } from '../types';
import AIReplyModal from '../components/reviews/AIReplyModal';

const PLATFORM_OPTIONS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'כל הפלטפורמות' },
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
  { value: 'wolt', label: 'Wolt' },
];

const SENTIMENT_OPTIONS: { value: Sentiment | 'all'; label: string }[] = [
  { value: 'all', label: 'כל הסנטימנטים' },
  { value: 'very_positive', label: 'חיובי מאוד' },
  { value: 'positive', label: 'חיובי' },
  { value: 'neutral', label: 'ניטרלי' },
  { value: 'critical', label: 'ביקורתי' },
];

const STATUS_OPTIONS: { value: ReviewStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'כל הסטטוסים' },
  { value: 'pending', label: 'ממתין לתגובה' },
  { value: 'replied', label: 'טופל' },
  { value: 'ignored', label: 'התעלמות' },
];

const SENTIMENT_STYLES: Record<Sentiment, { bg: string; text: string; label: string }> = {
  very_positive: { bg: '#dcfce7', text: '#166534', label: 'חיובי מאוד' },
  positive:      { bg: '#dbeafe', text: '#1e40af', label: 'חיובי' },
  neutral:       { bg: '#fef9c3', text: '#854d0e', label: 'ניטרלי' },
  critical:      { bg: '#fee2e2', text: '#991b1b', label: 'ביקורתי' },
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-[16px] ${i < rating ? 'icon-filled' : ''}`}
          style={{ color: i < rating ? '#f59e0b' : '#c5c6d2' }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [sentiment, setSentiment] = useState<Sentiment | 'all'>('all');
  const [status, setStatus] = useState<ReviewStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  // AI modal state
  const [aiTarget, setAiTarget] = useState<Review | null>(null);
  // Local replied tracking (in real app this would be from DB)
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return MOCK_REVIEWS.filter((r) => {
      if (platform !== 'all' && r.platform !== platform) return false;
      if (sentiment !== 'all' && r.sentiment !== sentiment) return false;
      if (status !== 'all' && r.status !== status) return false;
      if (search && !r.reviewer_name.includes(search) && !r.content.includes(search)) return false;
      return true;
    });
  }, [platform, sentiment, status, search]);

  const handleReplied = (reviewId: string) => {
    setRepliedIds((prev) => new Set([...prev, reviewId]));
  };

  return (
    <div className="min-h-screen px-6 md:px-16 py-8" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-screen-xl mx-auto">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold" style={{ color: '#00113a' }}>ביקורות</h1>
            <p className="text-sm mt-1" style={{ color: '#444650' }}>
              {filtered.length} ביקורות נמצאו
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#871dd3', color: '#ffffff' }}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            ייצוא ביקורות
          </button>
        </div>

        {/* Filters bar */}
        <div
          className="rounded-2xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            border: '1px solid rgba(197,198,210,0.3)',
          }}
        >
          <div className="relative sm:col-span-2 lg:col-span-1">
            <span
              className="material-symbols-outlined text-[18px] absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#757682' }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="חיפוש לקוח או תוכן..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ backgroundColor: '#f3f4f5', border: '1px solid rgba(197,198,210,0.4)', color: '#191c1d' }}
            />
          </div>

          {([
            { label: 'פלטפורמה', value: platform, setter: setPlatform, options: PLATFORM_OPTIONS },
            { label: 'סנטימנט',  value: sentiment, setter: setSentiment, options: SENTIMENT_OPTIONS },
            { label: 'סטטוס',    value: status,    setter: setStatus,    options: STATUS_OPTIONS },
          ] as const).map(({ label, value, setter, options }) => (
            <div key={label} className="relative">
              <select
                value={value}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer"
                style={{ backgroundColor: '#f3f4f5', border: '1px solid rgba(197,198,210,0.4)', color: '#191c1d', direction: 'rtl' }}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span
                className="material-symbols-outlined text-[16px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#757682' }}
              >
                expand_more
              </span>
            </div>
          ))}
        </div>

        {/* Review cards grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[48px]" style={{ color: '#c5c6d2' }}>search_off</span>
            <p className="mt-3 font-semibold" style={{ color: '#444650' }}>לא נמצאו ביקורות</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((review) => {
              const s = SENTIMENT_STYLES[review.sentiment];
              const isReplied = repliedIds.has(review.id) || review.status === 'replied';

              return (
                <div
                  key={review.id}
                  className="rounded-2xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-lg"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    border: `1px solid ${isReplied ? 'rgba(22,163,74,0.25)' : 'rgba(197,198,210,0.3)'}`,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: 'rgba(135,29,211,0.1)', color: '#871dd3' }}
                      >
                        {review.reviewer_initials}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#00113a' }}>
                          {review.reviewer_name}
                        </p>
                        <p className="text-xs capitalize" style={{ color: '#757682' }}>
                          {review.platform}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: s.bg, color: s.text }}
                    >
                      {s.label}
                    </span>
                  </div>

                  <StarDisplay rating={review.rating} />

                  <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#444650' }}>
                    "{review.content}"
                  </p>

                  <p className="text-xs" style={{ color: '#757682' }}>
                    {new Date(review.created_at).toLocaleDateString('he-IL')}
                  </p>

                  {/* Replied badge */}
                  {isReplied && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#16a34a' }}>
                      <span className="material-symbols-outlined text-[14px] icon-filled">check_circle</span>
                      טופל — תגובה נשלחה
                    </div>
                  )}

                  {/* Action buttons */}
                  {!isReplied && (
                    <div className="flex gap-2 pt-1">
                      {/* AI Reply — primary */}
                      <button
                        onClick={() => setAiTarget(review)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#ffffff' }}
                      >
                        <span className="material-symbols-outlined text-[15px] icon-filled">auto_awesome</span>
                        AI תגובה
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        style={{ backgroundColor: '#f3f4f5', color: '#444650' }}
                        aria-label="אפשרויות נוספות"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Reply Modal */}
      {aiTarget && (
        <AIReplyModal
          review={aiTarget}
          onClose={() => setAiTarget(null)}
          onReplied={(id) => { handleReplied(id); setAiTarget(null); }}
        />
      )}
    </div>
  );
}
