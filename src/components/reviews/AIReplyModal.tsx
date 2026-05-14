import { useState, useEffect, useRef } from 'react';
import { TONE_LABELS, type ToneType } from '../../types';
import { useAIReply } from '../../hooks/useAIReply';
import type { Review } from '../../types';

interface Props {
  review: Review;
  onClose: () => void;
  onReplied: (reviewId: string, text: string) => void;
  defaultWhatsAppNumber?: string;
}

const TONES: ToneType[] = ['soft', 'gentle', 'firm', 'apologetic'];

export default function AIReplyModal({ review, onClose, onReplied, defaultWhatsAppNumber }: Props) {
  const [tone, setTone] = useState<ToneType>('soft');
  const [step, setStep] = useState<'tone' | 'loading' | 'results' | 'sent' | 'chosen'>('tone');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editedTexts, setEditedTexts] = useState<string[]>([]);
  const [whatsAppNum, setWhatsAppNum] = useState(defaultWhatsAppNumber ?? '');
  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, isSendingWhatsApp, whatsAppSent, error, generate, sendWhatsApp, chooseReply } =
    useAIReply();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Sync edited texts when suggestions arrive
  useEffect(() => {
    if (suggestions.length) {
      setEditedTexts([...suggestions]);
      setStep('results');
    }
  }, [suggestions]);

  useEffect(() => { if (isLoading) setStep('loading'); }, [isLoading]);
  useEffect(() => { if (whatsAppSent) setStep('sent'); }, [whatsAppSent]);

  const handleGenerate = () => generate(review, tone);

  const handleChoose = async (idx: number) => {
    const text = editedTexts[idx] ?? suggestions[idx];
    await chooseReply(review.id, text, idx);
    setChosenIdx(idx);
    setStep('chosen');
    onReplied(review.id, text);
  };

  const handleSendWhatsApp = async () => {
    if (!whatsAppNum) { setShowWhatsAppInput(true); return; }
    await sendWhatsApp(whatsAppNum, {
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      content: review.content,
    });
  };

  const toneInfo = TONE_LABELS[tone];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'rgba(197,198,210,0.3)', backgroundColor: '#ffffff' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}
            >
              <span className="material-symbols-outlined text-white text-[18px] icon-filled">smart_toy</span>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#00113a' }}>AI תגובה חכמה</p>
              <p className="text-xs" style={{ color: '#444650' }}>ל-{review.reviewer_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            style={{ color: '#444650' }}
            aria-label="סגור"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 flex-1">
          {/* Review snippet */}
          <div
            className="rounded-xl p-4 mb-6 text-sm"
            style={{ backgroundColor: '#f3f4f5', borderRight: '4px solid #002366' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold" style={{ color: '#00113a' }}>{review.reviewer_name}</span>
              <span className="text-xs" style={{ color: '#757682' }}>·</span>
              {'⭐'.repeat(review.rating)}
            </div>
            <p className="line-clamp-2" style={{ color: '#444650' }}>"{review.content}"</p>
          </div>

          {/* ── STEP: Tone Selection ── */}
          {step === 'tone' && (
            <div>
              <p className="text-sm font-semibold mb-4" style={{ color: '#00113a' }}>
                בחר אופי תגובה:
              </p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {TONES.map((t) => {
                  const info = TONE_LABELS[t];
                  const active = tone === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className="p-4 rounded-xl text-right transition-all cursor-pointer"
                      style={{
                        border: `2px solid ${active ? info.color : 'rgba(197,198,210,0.4)'}`,
                        backgroundColor: active ? info.bg : '#f8f9fa',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-base font-extrabold"
                          style={{ color: info.color }}
                        >
                          {info.he}
                        </span>
                        {active && (
                          <span
                            className="material-symbols-outlined text-[16px] icon-filled"
                            style={{ color: info.color }}
                          >
                            check_circle
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: '#444650' }}>{info.desc}</p>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#002366,#871dd3)', color: '#ffffff' }}
              >
                <span className="material-symbols-outlined text-[18px] icon-filled">auto_awesome</span>
                צור 4 הצעות תגובה
              </button>
            </div>
          )}

          {/* ── STEP: Loading ── */}
          {step === 'loading' && (
            <div className="space-y-3">
              <p className="text-sm text-center font-semibold mb-4" style={{ color: '#444650' }}>
                Claude מנסח 4 תגובות בסגנון <span style={{ color: toneInfo.color }}>{toneInfo.he}</span>...
              </p>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ backgroundColor: '#edeeef' }}
                />
              ))}
            </div>
          )}

          {/* ── STEP: Results ── */}
          {step === 'results' && suggestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold" style={{ color: '#00113a' }}>
                  4 הצעות תגובה — סגנון{' '}
                  <span style={{ color: toneInfo.color }}>{toneInfo.he}</span>
                </p>
                <button
                  onClick={() => setStep('tone')}
                  className="text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                  style={{ color: '#871dd3' }}
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  שנה סגנון
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {suggestions.map((sug, idx) => {
                  const isEditing = editingIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border transition-all"
                      style={{
                        border: '1px solid rgba(197,198,210,0.5)',
                        backgroundColor: '#f8f9fa',
                      }}
                    >
                      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: toneInfo.bg, color: toneInfo.color }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium" style={{ color: '#757682' }}>
                          וריאציה {idx + 1}
                        </span>
                        <button
                          className="mr-auto text-xs cursor-pointer hover:opacity-70 transition-opacity"
                          style={{ color: '#757682' }}
                          onClick={() => setEditingIdx(isEditing ? null : idx)}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {isEditing ? 'done' : 'edit'}
                          </span>
                        </button>
                      </div>

                      {isEditing ? (
                        <textarea
                          value={editedTexts[idx] ?? sug}
                          onChange={(e) => {
                            const copy = [...editedTexts];
                            copy[idx] = e.target.value;
                            setEditedTexts(copy);
                          }}
                          rows={3}
                          className="w-full px-4 pb-3 text-sm outline-none resize-none bg-transparent"
                          style={{ color: '#191c1d', direction: 'rtl' }}
                        />
                      ) : (
                        <p className="px-4 pb-3 text-sm leading-relaxed" style={{ color: '#191c1d' }}>
                          {editedTexts[idx] ?? sug}
                        </p>
                      )}

                      <div
                        className="flex gap-2 px-4 pb-3 border-t pt-2"
                        style={{ borderColor: 'rgba(197,198,210,0.3)' }}
                      >
                        <button
                          onClick={() => handleChoose(idx)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: '#002366', color: '#ffffff' }}
                        >
                          <span className="material-symbols-outlined text-[14px] icon-filled">check_circle</span>
                          בחר תגובה זו
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* WhatsApp send section */}
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: 'rgba(135,29,211,0.05)', border: '1px solid rgba(135,29,211,0.2)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[20px] icon-filled" style={{ color: '#25D366' }}>
                    chat
                  </span>
                  <p className="text-sm font-bold" style={{ color: '#00113a' }}>
                    בחר דרך WhatsApp
                  </p>
                </div>
                <p className="text-xs mb-3" style={{ color: '#444650' }}>
                  קבל את 4 ההצעות בWhatsApp ובחר בתשובה (שלח 1-4)
                </p>

                {showWhatsAppInput && (
                  <input
                    type="tel"
                    value={whatsAppNum}
                    onChange={(e) => setWhatsAppNum(e.target.value)}
                    placeholder="+972501234567"
                    className="w-full px-3 py-2.5 rounded-xl text-sm mb-3 outline-none"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid rgba(135,29,211,0.3)',
                      color: '#191c1d',
                      direction: 'ltr',
                    }}
                  />
                )}

                {error && (
                  <p className="text-xs mb-2" style={{ color: '#ba1a1a' }}>{error}</p>
                )}

                <button
                  onClick={handleSendWhatsApp}
                  disabled={isSendingWhatsApp}
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#25D366', color: '#ffffff' }}
                >
                  {isSendingWhatsApp ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      שולח...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px] icon-filled">send</span>
                      שלח לWhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: WhatsApp Sent ── */}
          {step === 'sent' && (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#dcfce7' }}
              >
                <span className="material-symbols-outlined text-[32px] icon-filled" style={{ color: '#16a34a' }}>
                  check_circle
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#00113a' }}>
                נשלח בWhatsApp!
              </h3>
              <p className="text-sm mb-6" style={{ color: '#444650' }}>
                ענה <strong>1–4</strong> בWhatsApp לבחירת התגובה.
                <br />ההודעה תפוג תוך 24 שעות.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#002366', color: '#ffffff' }}
              >
                סגור
              </button>
            </div>
          )}

          {/* ── STEP: Chosen ── */}
          {step === 'chosen' && chosenIdx !== null && (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}
              >
                <span className="material-symbols-outlined text-[32px] icon-filled text-white">
                  mark_chat_read
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#00113a' }}>
                תגובה {chosenIdx + 1} נבחרה ונשמרה!
              </h3>
              <p
                className="text-sm p-4 rounded-xl mb-6 text-right"
                style={{ backgroundColor: '#f3f4f5', color: '#444650' }}
              >
                "{editedTexts[chosenIdx] ?? suggestions[chosenIdx]}"
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#002366', color: '#ffffff' }}
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
