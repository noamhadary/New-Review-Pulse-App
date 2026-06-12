import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Platform, Sentiment, ReviewStatus, Review } from '../../types';
import AIReplyModal from '../reviews/AIReplyModal';
import { useReviews } from '../../hooks/useReviews';

const PLATFORM_LABELS: Record<Platform, string> = {
  google: 'Google',
  facebook: 'Facebook',
  tripadvisor: 'TripAdvisor',
  wolt: 'Wolt',
  other: 'אחר',
};

const SENTIMENT_COLORS: Record<Sentiment, { bg: string; text: string; label: string }> = {
  very_positive: { bg: '#dcfce7', text: '#166534', label: 'חיובי מאוד' },
  positive:      { bg: '#dbeafe', text: '#1e40af', label: 'חיובי' },
  neutral:       { bg: '#fef9c3', text: '#854d0e', label: 'ניטרלי' },
  critical:      { bg: '#fee2e2', text: '#991b1b', label: 'ביקורתי' },
};

const STATUS_MAP: Record<ReviewStatus, { icon: string; color: string; label: string }> = {
  replied: { icon: 'check_circle', color: '#16a34a', label: 'טופל' },
  pending: { icon: 'hourglass_empty', color: '#871dd3', label: 'ממתין' },
  ignored: { icon: 'block', color: '#757682', label: 'התעלמות' },
};

function StarRating({ rating }: { rating: number }) {
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

// ── Row action menu ────────────────────────────────────────────────────────────

function RowMenu({ review, open, onClose, onReply, onIgnore }: {
  review: Review;
  open: boolean;
  onClose: () => void;
  onReply: () => void;
  onIgnore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const actions = [
    {
      icon: 'rate_review',
      label: 'צפה בביקורת',
      color: '#444650',
      onClick: () => { navigate('/reviews'); onClose(); },
    },
    {
      icon: 'auto_awesome',
      label: 'הגב עם AI',
      color: '#871dd3',
      onClick: () => { onReply(); onClose(); },
      disabled: review.status === 'replied',
    },
    {
      icon: 'block',
      label: 'התעלם',
      color: '#757682',
      onClick: () => { onIgnore(); onClose(); },
      disabled: review.status === 'ignored',
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute left-0 top-8 z-50 w-44 rounded-xl overflow-hidden bg-white border border-outline-variant/30"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      {actions.map(({ icon, label, color, onClick, disabled }) => (
        <button
          key={label}
          onClick={disabled ? undefined : onClick}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-right transition-colors cursor-pointer disabled:opacity-40 enabled:hover:bg-background"
          style={{ color }}
          disabled={disabled}
        >
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportCSV(reviews: Review[]) {
  const header = ['לקוח', 'פלטפורמה', 'דירוג', 'סנטימנט', 'סטטוס', 'תאריך', 'תוכן'].join(',');
  const rows = reviews.map((r) =>
    [
      `"${r.reviewer_name}"`,
      PLATFORM_LABELS[r.platform],
      r.rating,
      SENTIMENT_COLORS[r.sentiment].label,
      STATUS_MAP[r.status].label,
      new Date(r.created_at).toLocaleDateString('he-IL'),
      `"${r.content.replace(/"/g, '""')}"`,
    ].join(','),
  );
  const csv = '﻿' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recent-activity.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RecentActivity() {
  const { reviews: allReviews, updateReview } = useReviews();
  const displayReviews = allReviews.slice(0, 6);
  const [openMenu, setOpenMenu]   = useState<string | null>(null);
  const [aiTarget, setAiTarget]   = useState<Review | null>(null);
  const [exported, setExported]   = useState(false);

  const handleIgnore = (id: string) => {
    updateReview(id, { status: 'ignored' as ReviewStatus });
  };

  const handleReplied = (id: string) => {
    updateReview(id, { status: 'replied' as ReviewStatus });
    setAiTarget(null);
  };

  const reviews = displayReviews;

  const handleExport = () => {
    exportCSV(reviews);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden bg-white border border-outline-variant/20"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-outline-variant/30">
          <h3 className="text-xl font-bold text-primary">פעילות אחרונה</h3>
          <button
            onClick={handleExport}
            className={`flex items-center gap-1.5 text-sm font-semibold cursor-pointer transition-all hover:opacity-80 px-3 py-1.5 rounded-lg ${
              exported ? 'bg-green-100 text-green-600' : 'bg-secondary/8 text-secondary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] icon-filled">
              {exported ? 'check' : 'download'}
            </span>
            {exported ? 'יוצא!' : 'ייצוא CSV'}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                {['לקוח', 'פלטפורמה', 'דירוג', 'סנטימנט', 'סטטוס', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const sentiment = SENTIMENT_COLORS[review.sentiment];
                const status    = STATUS_MAP[review.status];
                return (
                  <tr
                    key={review.id}
                    className="transition-colors border-b border-outline-variant/20 hover:bg-background"
                  >
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-secondary/10 text-secondary">
                          {review.reviewer_initials}
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {review.reviewer_name}
                        </span>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-on-surface-variant">
                        {PLATFORM_LABELS[review.platform]}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <StarRating rating={review.rating} />
                    </td>

                    {/* Sentiment */}
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: sentiment.bg, color: sentiment.text }}
                      >
                        {sentiment.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span
                          className="material-symbols-outlined text-[16px] icon-filled"
                          style={{ color: status.color }}
                        >
                          {status.icon}
                        </span>
                        <span className="text-on-surface-variant">{status.label}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === review.id ? null : review.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-on-surface-variant"
                          aria-label="פעולות נוספות"
                        >
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                        <RowMenu
                          review={review}
                          open={openMenu === review.id}
                          onClose={() => setOpenMenu(null)}
                          onReply={() => setAiTarget(review)}
                          onIgnore={() => handleIgnore(review.id)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {aiTarget && (
        <AIReplyModal
          review={aiTarget}
          onClose={() => setAiTarget(null)}
          onReplied={handleReplied}
        />
      )}
    </>
  );
}
