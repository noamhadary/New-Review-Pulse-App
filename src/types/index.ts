export type Platform = 'google' | 'facebook' | 'tripadvisor' | 'wolt' | 'other';
export type Sentiment = 'positive' | 'very_positive' | 'neutral' | 'critical';
export type ReviewStatus = 'pending' | 'replied' | 'ignored';

export interface Review {
  id: string;
  business_id: string;
  reviewer_name: string;
  reviewer_initials: string;
  platform: Platform;
  rating: number;
  content: string;
  sentiment: Sentiment;
  status: ReviewStatus;
  created_at: string;
  replied_at?: string;
  reply_text?: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  logo_url?: string;
  created_at: string;
}

export interface KPIData {
  avg_rating: number;
  rating_trend: number;
  monthly_growth: number;
  avg_response_time_hours: number;
  positive_pct: number;
  positive_count: number;
  pending_count: number;
}

export interface SentimentPoint {
  day: string;
  positive: number;
  critical: number;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'viewer';
}

// ── AI Reply types ─────────────────────────────────────────────────────────────

export type ToneType = 'soft' | 'gentle' | 'firm' | 'apologetic';

export const TONE_LABELS: Record<ToneType, { he: string; color: string; bg: string; desc: string }> = {
  soft:       { he: 'רך',     color: '#16a34a', bg: '#dcfce7', desc: 'חמה ואישית, יוצרת קשר רגשי' },
  gentle:     { he: 'עדין',   color: '#2563eb', bg: '#dbeafe', desc: 'מנומסת ועדינה, מכבדת את הלקוח' },
  firm:       { he: 'תקיף',   color: '#d97706', bg: '#fef3c7', desc: 'מקצועית וישירה, עניינית' },
  apologetic: { he: 'מתנצל',  color: '#dc2626', bg: '#fee2e2', desc: 'מתנצלת ומפצה, מביעה חרטה' },
};

export interface ReplySuggestion {
  tone: ToneType;
  text: string;
}

export interface ReplySession {
  id: string;
  review_id: string;
  tone: ToneType;
  suggestions: string[];
  chosen_index?: number;
  whatsapp_to?: string;
  expires_at: string;
  created_at: string;
}

export interface AutoReplySettings {
  id: string;
  business_id: string;
  enabled: boolean;
  default_tone: ToneType;
  whatsapp_number: string;
}
