import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ToneType } from '../types';

export interface AIReplyState {
  suggestions: string[];
  sessionId: string | null;
  isLoading: boolean;
  isSendingWhatsApp: boolean;
  whatsAppSent: boolean;
  error: string | null;
}

export function useAIReply() {
  const [state, setState] = useState<AIReplyState>({
    suggestions: [],
    sessionId: null,
    isLoading: false,
    isSendingWhatsApp: false,
    whatsAppSent: false,
    error: null,
  });

  const generate = async (
    review: { id: string; reviewer_name: string; rating: number; content: string },
    tone: ToneType,
  ) => {
    setState((s) => ({ ...s, isLoading: true, error: null, suggestions: [], whatsAppSent: false }));
    try {
      const { data, error } = await supabase.functions.invoke('generate-replies', {
        body: {
          review_id: review.id,
          reviewer_name: review.reviewer_name,
          rating: review.rating,
          content: review.content,
          tone,
        },
      });
      if (error) throw error;
      setState((s) => ({
        ...s,
        suggestions: data.suggestions ?? [],
        sessionId: data.session_id ?? null,
        isLoading: false,
      }));
    } catch {
      // Demo fallback when edge function is not deployed yet
      const demo = buildDemoSuggestions(review.reviewer_name, review.rating, review.content, tone);
      setState((s) => ({ ...s, suggestions: demo, isLoading: false, error: null }));
    }
  };

  const sendWhatsApp = async (
    to: string,
    review: { reviewer_name: string; rating: number; content: string },
  ) => {
    if (!state.suggestions.length) return;
    setState((s) => ({ ...s, isSendingWhatsApp: true, error: null }));
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          to,
          session_id: state.sessionId,
          suggestions: state.suggestions,
          reviewer_name: review.reviewer_name,
          rating: review.rating,
          content_snippet: review.content,
        },
      });
      if (error) throw error;
      setState((s) => ({ ...s, isSendingWhatsApp: false, whatsAppSent: true }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isSendingWhatsApp: false,
        error: 'שגיאה בשליחת WhatsApp — בדוק את הגדרות Twilio',
      }));
    }
  };

  const chooseReply = async (reviewId: string, text: string, index: number) => {
    const now = new Date().toISOString();
    await supabase
      .from('reviews')
      .update({ reply_text: text, status: 'replied', replied_at: now })
      .eq('id', reviewId);

    if (state.sessionId) {
      await supabase
        .from('reply_sessions')
        .update({ chosen_index: index + 1 })
        .eq('id', state.sessionId);
    }
  };

  const reset = () =>
    setState({ suggestions: [], sessionId: null, isLoading: false, isSendingWhatsApp: false, whatsAppSent: false, error: null });

  return { ...state, generate, sendWhatsApp, chooseReply, reset };
}

// ── Demo suggestions used when edge function is not yet deployed ───────────────

function buildDemoSuggestions(name: string, _rating: number, content: string, tone: ToneType): string[] {
  // Extract key topic from content for context-aware demo responses
  const isWait    = /המתנה|חיכיתי|זמן|איטי/.test(content);
  const isProduct = /מוצר|פגום|שבור|איכות/.test(content);
  const isService = /שירות|נציג|צוות|עזרה/.test(content);
  const isFood    = /אוכל|טעים|מנה|מסעדה|קפה/.test(content);
  const topic = isWait ? 'זמני ההמתנה' : isProduct ? 'המוצר שקיבלת' : isService ? 'השירות שחווית' : isFood ? 'האוכל והחוויה' : 'החוויה שלך';
  if (tone === 'soft') return [
    `תודה רבה, ${name}! המשוב שלך על ${topic} ממלא אותנו בגאווה ומניע אותנו להמשיך.`,
    `${name} היקר/ה, כל כך שמחנו לקרוא את דבריך על ${topic}. אנחנו כאן בשבילך תמיד!`,
    `המשוב שלך על ${topic} נוגע ללב, ${name}. אנחנו שמחים שיכולנו לגרום לחוויה מיוחדת.`,
    `תודה על הדברים הנפלאים, ${name}! כשאנחנו שומעים על ${topic} כזה — זו הסיבה שאנחנו עושים את מה שאנחנו עושים.`,
  ];
  if (tone === 'gentle') return [
    `${name}, תודה רבה על המשוב לגבי ${topic}. נשמח תמיד לשרת אותך.`,
    `אנחנו מעריכים מאוד שלקחת את הזמן לכתוב לנו על ${topic}, ${name}. תודה!`,
    `תודה על דבריך לגבי ${topic}, ${name}. נמשיך לעשות כמיטב יכולתנו.`,
    `${name}, המשוב שלך על ${topic} חשוב לנו מאוד. תודה שבחרת בנו.`,
  ];
  if (tone === 'firm') return [
    `תודה על הפנייה, ${name}. קיבלנו את המשוב שלך על ${topic} ונפעל בהתאם.`,
    `קיבלנו את דבריך על ${topic}, ${name}. אנחנו עומדים מאחורי השירות שלנו ונשפר בהתמדה.`,
    `${name}, תודה. בנוגע ל${topic} — אנחנו מחויבים לסטנדרטים גבוהים ונדאג לטפל בכך.`,
    `אנחנו מתייחסים לכל פנייה בנוגע ל${topic} ברצינות, ${name}. תודה על השיתוף.`,
  ];
  // apologetic
  return [
    `${name}, אנחנו מצטערים מאוד על ${topic}. נעשה הכל כדי לתקן זאת ולפצות אותך.`,
    `אנחנו מתנצלים בכנות על ${topic}, ${name}. זה לא הסטנדרט שלנו ואנחנו נטפל בזה מיידית.`,
    `${name}, מה שקרה עם ${topic} לא מקובל עלינו. אנחנו מצטערים ונפעל לשיפור מיידי.`,
    `מצטערים מאוד על ${topic}, ${name}. ניצור איתך קשר לפצות על אי הנוחות שנגרמה.`,
  ];
}
