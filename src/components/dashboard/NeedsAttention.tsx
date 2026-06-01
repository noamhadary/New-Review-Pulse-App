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
        <span className="text-sm font-semibold" style={{ color: '#00113a' }}>{review.reviewer_name}</span>
        <span className="text-xs font-bold" style={{ color: '#ba1a1a' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
      </div>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: '#444650' }}>"{review.content}"</p>
      <button onClick={onAiReply} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all hover:opacity-80 px-3 py-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#ffffff' }}>
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
      <div className="rounded-2xl p-6 md:p-8 flex flex-col" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(186,26,26,0.12)' }}>
        <div className="flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-[20px]" style={{ color: '#ba1a1a' }}>priority_high</span>
          <h3 className="text-xl font-bold" style={{ color: '#00113a' }}>דורש טיפול</h3>
          <span className="mr-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ffdad6', color: '#93000a' }}>{critical.length}</span>
        </div>
        <div className="space-y-3 flex-1">
          {critical.map((r) => (
            <ReviewItem key={r.id} review={r} onAiReply={() => setAiTarget(r)} />
          ))}
          {critical.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: '#444650' }}>כל הביקורות טופלו ✓</p>
          )}
        </div>
        <button onClick={() => navigate('/reviews')} className="w-full mt-5 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-90 cursor-pointer border" style={{ borderColor: 'rgba(0,17,58,0.2)', color: '#00113a', backgroundColor: 'transparent' }}>
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
