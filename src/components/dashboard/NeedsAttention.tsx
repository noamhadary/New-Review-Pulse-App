import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Review } from '../../types';
import AIReplyModal from '../reviews/AIReplyModal';
import { useReviews } from '../../hooks/useReviews';

function ReviewItem({ review, onAiReply }: { review: Review; onAiReply: () => void }) {
  const borderColor = review.rating <= 1 ? '#ba1a1a' : review.rating <= 2 ? '#dc2626' : '#757682';
  const bgColor = review.rating <= 1 ? 'rgba(186,26,26,0.05)' : review.rating <= 2 ? 'rgba(220,38,38,0.04)' : 'transparent';
  return (
    <div className="p-4 rounded-lg border-r-4" style={{ borderColor, backgroundColor: bgColor, borderTop: '1px solid rgba(197,198,210,0.2)', borderBottom: '1px solid rgba(197,198,210,0.2)', borderLeft: '1px solid rgba(197,198,210,0.2)' }}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold text-primary">{review.reviewer_name}</span>
        <span className="text-xs font-bold text-error">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
      </div>
      <p className="text-xs mb-3 line-clamp-2 text-on-surface-variant">"{review.content}"</p>
      <button onClick={onAiReply} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all hover:opacity-80 px-3 py-1.5 rounded-lg text-white" style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}>
        <span className="material-symbols-outlined text-[13px] icon-filled">auto_awesome</span>
        AI תגובה
      </button>
    </div>
  );
}

export default function NeedsAttention() {
  const navigate = useNavigate();
  const [aiTarget, setAiTarget] = useState<Review | null>(null);
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());
  const { reviews, updateReview } = useReviews({ status: 'pending' });
  const critical = reviews.filter((r) => r.rating <= 3 && !repliedIds.has(r.id)).slice(0, 3);

  return (
    <>
      <div className="rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col bg-white border border-error/12" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <span className="material-symbols-outlined text-[20px] text-error">priority_high</span>
          <h3 className="text-base md:text-xl font-bold text-primary">דורש טיפול</h3>
          <span className="mr-auto text-xs font-bold px-2 py-0.5 rounded-full bg-error-container text-on-error-container">{critical.length}</span>
        </div>
        <div className="space-y-3 flex-1">
          {critical.map((r) => (
            <ReviewItem key={r.id} review={r} onAiReply={() => setAiTarget(r)} />
          ))}
          {critical.length === 0 && (
            <p className="text-sm text-center py-4 text-on-surface-variant">כל הביקורות טופלו ✓</p>
          )}
        </div>
        <button onClick={() => navigate('/reviews')} className="w-full mt-5 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90 cursor-pointer border border-primary/20 text-primary bg-transparent">
          צפה בכל {reviews.length} הביקורות
        </button>
      </div>
      {aiTarget && (
        <AIReplyModal
          review={aiTarget}
          onClose={() => setAiTarget(null)}
          onReplied={(id) => { setRepliedIds((prev) => new Set([...prev, id])); updateReview(id, { status: 'replied' }); setAiTarget(null); }}
        />
      )}
    </>
  );
}
