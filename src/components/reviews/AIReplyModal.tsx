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
  const defaultTone: ToneType = review.rating <= 2 ? 'apologetic' : review.rating === 3 ? 'gentle' : 'soft';
  const [tone, setTone] = useState<ToneType>(defaultTone);
  const [step, setStep] = useState<'tone' | 'loading' | 'results' | 'sent' | 'chosen'>('tone');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editedTexts, setEditedTexts] = useState<string[]>([]);
  const [whatsAppNum, setWhatsAppNum] = useState(defaultWhatsAppNumber ?? '');
  const [showWhatsAppInput, setShowWhatsAppInput] = useState(false);
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { suggestions, isSendingWhatsApp, error, generate, sendWhatsApp, chooseReply } =
    useAIReply();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleGenerate = async () => {
    setStep('loading');
    const generated = await generate(review, tone);
    setEditedTexts([...generated]);
    setStep('results');
  };

  const handleChoose = async (idx: number) => {
    const text = editedTexts[idx] ?? suggestions[idx];
    await chooseReply(review.id, text, idx);
    setChosenIdx(idx);
    setStep('chosen');
    onReplied(review.id, text);
  };

  const handleSendWhatsApp = async () => {
    if (!whatsAppNum) { setShowWhatsAppInput(true); return; }
    const sent = await sendWhatsApp(whatsAppNum, {
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      content: review.content,
    });
    if (sent) setStep('sent');
  };

  const toneInfo = TONE_LABELS[tone];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col bg-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 sticky top-0 z-10 bg-white">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}
            >
              <span className="material-symbols-outlined text-white text-[18px] icon-filled">smart_toy</span>
            </div>
            <div>
              <p className="font-bold text-sm text-primary">AI תגובה חכמה</p>
              <p className="text-xs text-on-surface-variant">ל-{review.reviewer_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant"
            aria-label="סגור"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 flex-1">
          {/* Review snippet */}
          <div
            className="rounded-xl p-4 mb-6 text-sm bg-surface-container-low"
            style={{ borderRight: '4px solid #002366' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-primary">{review.reviewer_name}</span>
              <span className="text-xs text-outline">·</span>
              <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </span>
            </div>
            <p className="line-clamp-2 text-on-surface-variant">"{review.content}"</p>
          </div>

          {/* ── STEP: Tone Selection ── */}
          {step === 'tone' && (
            <div>
              <p className="text-sm font-semibold mb-4 text-primary">
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
                      <p className="text-xs text-on-surface-variant">{info.desc}</p>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleGenerate}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-white"
                style={{ background: 'linear-gradient(135deg,#002366,#871dd3)' }}
              >
                <span className="material-symbols-outlined text-[18px] icon-filled">auto_awesome</span>
                צור 4 הצעות תגובה
              </button>
            </div>
          )}

          {/* ── STEP: Loading ── */}
          {step === 'loading' && (
            <div className="space-y-3">
              <p className="text-sm text-center font-semibold mb-4 text-on-surface-variant">
                Claude מנסח 4 תגובות בסגנון <span style={{ color: toneInfo.color }}>{toneInfo.he}</span>...
              </p>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse bg-surface-container"
                />
              ))}
            </div>
          )}

          {/* ── STEP: Results ── */}
          {step === 'results' && suggestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-primary">
                  4 הצעות תגובה — סגנון{' '}
                  <span style={{ color: toneInfo.color }}>{toneInfo.he}</span>
                </p>
                <button
                  onClick={() => setStep('tone')}
                  className="text-xs font-semibold flex items-center gap-1 cursor-pointer hover:underline text-secondary"
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
                      className="rounded-xl border border-outline-variant/50 transition-all bg-background"
                    >
                      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: toneInfo.bg, color: toneInfo.color }}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-outline">
                          וריאציה {idx + 1}
                        </span>
                        <button
                          className="mr-auto text-xs cursor-pointer hover:opacity-70 transition-opacity text-outline"
                          onClick={() => setEditingIdx(isEditing ? null : idx)}
                          aria-label={isEditing ? 'סיים עריכה' : 'ערוך תגובה'}
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
                          dir="rtl"
                          className="w-full px-4 pb-3 text-sm outline-none resize-none bg-transparent text-on-surface"
                        />
                      ) : (
                        <p className="px-4 pb-3 text-sm leading-relaxed text-on-surface">
                          {editedTexts[idx] ?? sug}
                        </p>
                      )}

                      <div className="flex gap-2 px-4 pb-3 border-t border-outline-variant/30 pt-2">
                        <button
                          onClick={() => handleChoose(idx)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5 bg-primary-container text-white"
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
              <div className="rounded-xl p-4 bg-secondary/5 border border-secondary/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[20px] icon-filled" style={{ color: '#25D366' }}>
                    chat
                  </span>
                  <p className="text-sm font-bold text-primary">
                    בחר דרך WhatsApp
                  </p>
                </div>
                <p className="text-xs mb-3 text-on-surface-variant">
                  קבל את 4 ההצעות בWhatsApp ובחר בתשובה (שלח 1-4)
                </p>

                {showWhatsAppInput && (
                  <input
                    type="tel"
                    value={whatsAppNum}
                    onChange={(e) => setWhatsAppNum(e.target.value)}
                    placeholder="+972501234567"
                    dir="ltr"
                    aria-label="מספר WhatsApp"
                    className="w-full px-3 py-2.5 rounded-xl text-sm mb-3 outline-none bg-white border border-secondary/30 text-on-surface"
                  />
                )}

                {error && (
                  <p className="text-xs mb-2 text-error">{error}</p>
                )}

                <button
                  onClick={handleSendWhatsApp}
                  disabled={isSendingWhatsApp}
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 text-white"
                  style={{ backgroundColor: '#25D366' }}
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100">
                <span className="material-symbols-outlined text-[32px] icon-filled text-green-600">
                  check_circle
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 text-primary">
                נשלח בWhatsApp!
              </h3>
              <p className="text-sm mb-6 text-on-surface-variant">
                ענה <strong>1–4</strong> בWhatsApp לבחירת התגובה.
                <br />ההודעה תפוג תוך 24 שעות.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity bg-primary-container text-white"
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
              <h3 className="font-bold text-lg mb-2 text-primary">
                תגובה {chosenIdx + 1} נבחרה ונשמרה!
              </h3>
              <p className="text-sm p-4 rounded-xl mb-6 text-right bg-surface-container-low text-on-surface-variant">
                "{editedTexts[chosenIdx] ?? suggestions[chosenIdx]}"
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity bg-primary-container text-white"
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
