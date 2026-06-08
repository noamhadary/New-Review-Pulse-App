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
        error: 'שגיאה בשליחת WhatsApp — בדוק את הגדרות GREEN API',
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

function buildDemoSuggestions(name: string, rating: number, content: string, tone: ToneType): string[] {
  const isWait    = /המתנה|חיכיתי|זמן|איטי|איחור/.test(content);
  const isProduct = /מוצר|פגום|שבור|איכות/.test(content);
  const isService = /שירות|נציג|צוות|עזרה/.test(content);
  const isFood    = /אוכל|טעים|מנה|מסעדה|קפה/.test(content);
  const topic = isWait ? 'זמני ההמתנה' : isProduct ? 'המוצר שקיבלת' : isService ? 'השירות שחווית' : isFood ? 'האוכל והחוויה' : 'החוויה שלך';

  const hasNegativeKeywords = /גרוע|איום|נורא|מאוכזב|מתוסכל|בעיה|תקלה|פגום|שבור|איחור|לא עבד|לא תקין|מזעזע|מבאס/.test(content);
  const isNegative = rating <= 2 || hasNegativeKeywords;
  const isPositive = rating >= 4 && !hasNegativeKeywords;

  if (isNegative) {
    if (tone === 'soft') return [
      `${name} היקר/ה, אנחנו מצטערים מאוד על ${topic}. המשוב שלך חשוב לנו ונעשה כל שביכולתנו לתקן זאת.`,
      `אנחנו ממש מצטערים שחווית כך, ${name}. ${topic} לא אמור להיות כך, ונשמח לפצות אותך.`,
      `${name}, הלב שלנו כואב לקרוא על ${topic}. זה לא הסטנדרט שלנו ואנחנו נטפל בזה מיידית.`,
      `מצטערים מאוד על ${topic}, ${name}. נשמח ליצור איתך קשר אישי ולפצות על אי הנוחות.`,
    ];
    if (tone === 'gentle') return [
      `${name}, תודה שיידעת אותנו על ${topic}. אנחנו מצטערים ונפעל לתיקון מיידי.`,
      `אנחנו מתנצלים על ${topic}, ${name}. נשמח לדבר איתך ולמצוא פתרון יחד.`,
      `${name}, קיבלנו את משובך על ${topic}. זה לא עומד בסטנדרטים שלנו ונטפל בכך.`,
      `תודה על הכנות, ${name}. אנחנו מצטערים על ${topic} ונעשה כל שביכולתנו לשפר.`,
    ];
    if (tone === 'firm') return [
      `${name}, קיבלנו את הפנייה שלך בנוגע ל${topic}. אנחנו מתנצלים ונטפל בכך ברצינות.`,
      `אנחנו שומעים אותך, ${name}. הנושא של ${topic} אינו מקובל ונבצע בדיקה מיידית.`,
      `${name}, תודה על הפידבק על ${topic}. אנחנו מחויבים לסטנדרטים גבוהים ונפעל לשיפור.`,
      `קיבלנו, ${name}. ${topic} אינו עומד בסטנדרטים שלנו ונטפל בכך בהקדם האפשרי.`,
    ];
    // apologetic
    return [
      `${name}, אנחנו מצטערים מאוד על ${topic}. נעשה הכל כדי לתקן זאת ולפצות אותך.`,
      `אנחנו מתנצלים בכנות על ${topic}, ${name}. זה לא הסטנדרט שלנו ואנחנו נטפל בזה מיידית.`,
      `${name}, מה שקרה עם ${topic} לא מקובל עלינו. אנחנו מצטערים ונפעל לשיפור מיידי.`,
      `מצטערים מאוד על ${topic}, ${name}. ניצור איתך קשר כדי לפצות על אי הנוחות שנגרמה.`,
    ];
  }

  if (isPositive) {
    if (tone === 'soft') return [
      `תודה רבה, ${name}! המשוב שלך על ${topic} ממלא אותנו בגאווה ומניע אותנו להמשיך.`,
      `${name} היקר/ה, כל כך שמחנו לקרוא את דבריך על ${topic}. אנחנו כאן בשבילך תמיד!`,
      `המשוב שלך על ${topic} נוגע ללב, ${name}. אנחנו שמחים שיכולנו לגרום לחוויה מיוחדת.`,
      `תודה על הדברים הנפלאים, ${name}! כשאנחנו שומעים על ${topic} כזה — זו הסיבה שאנחנו עושים את מה שאנחנו עושים.`,
    ];
    if (tone === 'gentle') return [
      `${name}, תודה רבה על המשוב החיובי לגבי ${topic}. נשמח תמיד לשרת אותך.`,
      `אנחנו מעריכים מאוד שלקחת את הזמן לכתוב לנו על ${topic}, ${name}. תודה!`,
      `תודה על הדברים הטובים לגבי ${topic}, ${name}. נמשיך לעשות כמיטב יכולתנו.`,
      `${name}, המשוב שלך על ${topic} חשוב לנו מאוד. תודה שבחרת בנו.`,
    ];
    if (tone === 'firm') return [
      `תודה על הפנייה, ${name}. שמחנו לשמוע על ${topic} ונמשיך לשמור על הרמה.`,
      `קיבלנו את דבריך על ${topic}, ${name}. אנחנו עומדים מאחורי השירות שלנו ונמשיך לשפר.`,
      `${name}, תודה. בנוגע ל${topic} — אנחנו מחויבים לסטנדרטים גבוהים ונמשיך כך.`,
      `אנחנו מתייחסים לכל משוב חיובי על ${topic} ברצינות, ${name}. תודה על השיתוף.`,
    ];
    // apologetic tone on positive review → use gentle
    return [
      `${name}, תודה רבה על המשוב החיובי לגבי ${topic}. נשמח תמיד לשרת אותך.`,
      `אנחנו מעריכים מאוד שלקחת את הזמן לכתוב לנו על ${topic}, ${name}. תודה!`,
      `תודה על הדברים הטובים לגבי ${topic}, ${name}. נמשיך לעשות כמיטב יכולתנו.`,
      `${name}, המשוב שלך על ${topic} חשוב לנו מאוד. תודה שבחרת בנו.`,
    ];
  }

  // Neutral (3 stars) — acknowledges and shows commitment to improve
  return [
    `${name}, תודה על המשוב הכנה לגבי ${topic}. אנחנו תמיד שואפים לשיפור.`,
    `קיבלנו את הפידבק שלך על ${topic}, ${name}. נשקול את דבריך ונפעל לשיפור.`,
    `${name}, אנחנו מעריכים את הכנות שלך לגבי ${topic}. נשתדל לעמוד בציפיות שלך בפעם הבאה.`,
    `תודה, ${name}. המשוב שלך על ${topic} יעזור לנו לשפר את השירות עבורך ועבור לקוחות אחרים.`,
  ];
}
