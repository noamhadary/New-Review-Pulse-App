import { supabase } from './supabase';

// ── Business profile ────────────────────────────────────────────────────────────

const BIZ_FIELDS = {
  name:        "צ'יפופו",
  category:    'מסעדנות',
  description: "מסעדת שניצל, צ'יפס ומבורגר ביתי — הכל עשוי ביד, אף פעם לא קפוא, ותמיד עם חיוך. משפחתיים מ-2019.",
  phone:       '03-555-1234',
  website:     'https://chipopo.co.il',
  branches:    [{ location: "תל אביב, שדרות רוטשילד 45" }],
};

// ── 10 crafted reviews ──────────────────────────────────────────────────────────

function buildReviews(businessId: string, base: number) {
  const ago = (d: number) => new Date(base - d * 86_400_000).toISOString();

  return [
    {
      business_id:   businessId,
      reviewer_name: 'מוריה כהן',
      platform:      'google',
      rating:        5,
      content:       "הצ'יפס הביתי של צ'יפופו שינה לי את החיים! הבלילה פריכה מבחוץ ורכה מבפנים — ממש כמו שסבתא הייתה מכינה. הצוות אדיב ומהיר, המקום נקי ומזמין. אחת הארוחות המשפחתיות הכי מוצלחות שהיו לנו השנה!",
      sentiment:     'very_positive',
      status:        'replied',
      reply_text:    "מוריה, תודה רבה על המילים החמות! מתכון הצ'יפס הביתי שלנו הוא מורשת שאנחנו שומרים עליה בקנאות — שמחנו שהמשפחה נהנתה. מחכים לביקורכם הבא! 🌟 — צוות צ'יפופו",
      created_at:    ago(3),
      replied_at:    ago(2),
    },
    {
      business_id:   businessId,
      reviewer_name: 'אדם לוי',
      platform:      'google',
      rating:        5,
      content:       "מבורגר השניצל הביתי — פשוט גאוני. לא ידעתי שאפשר לחדש כל כך בקונספט כל כך 'פשוט'. הלחמניה מגיעה כל בוקר מהמאפייה, השניצל עבה ועסיסי, והצ'יפס... אני עדיין חולם עליו בלילה. 10/10 בלי ספק!",
      sentiment:     'very_positive',
      status:        'replied',
      reply_text:    "אדם, עשית לנו את היום! המבורגר שניצל הוא הגאווה שלנו. הלחמניות אכן מגיעות מהמאפייה המקומית כל בוקר בשש. מחכים לראותך שוב! — צ'יפופו",
      created_at:    ago(7),
      replied_at:    ago(6),
    },
    {
      business_id:   businessId,
      reviewer_name: 'שירה בן-דוד',
      platform:      'facebook',
      rating:        4,
      content:       "בחרנו בצ'יפופו לסוף שנה של כיתת הבן שלי — 14 ילדים. הצוות טיפל בנו בסבלנות מדהימה, הגיש הכל חם ומהיר, ואפילו דאג לאריזות מיוחדות לילדים. המנות בגודל הנכון ולא שמנוניות. מינוס כוכב כי ההמתנה הייתה קצת ארוכה.",
      sentiment:     'positive',
      status:        'pending',
      reply_text:    null,
      created_at:    ago(12),
      replied_at:    null,
    },
    {
      business_id:   businessId,
      reviewer_name: 'Mark Thompson',
      platform:      'tripadvisor',
      rating:        5,
      content:       "Best schnitzel I've had outside Vienna — and I mean it. As a food blogger visiting from London, I've tasted schnitzel across 12 countries. Chipofo's homemade version stands out: the seasoning is unique, the meat is fresh daily, and the portion size is generous. The staff's warmth makes it even better. A must-visit in Tel Aviv!",
      sentiment:     'very_positive',
      status:        'replied',
      reply_text:    "Mark, what an incredible honor! We're humbled to be compared to Vienna schnitzel. Our chef's seasoning recipe is a 30-year family secret. Next time you're in Tel Aviv, come say hi — there's a complimentary side dish waiting for you! — Chipofo Team",
      created_at:    ago(15),
      replied_at:    ago(14),
    },
    {
      business_id:   businessId,
      reviewer_name: 'נועה גרינברג',
      platform:      'wolt',
      rating:        4,
      content:       "הזמנה שנייה ברצף דרך וולט ואני מרוצה! הצ'יפס הגיע פריך וחם — מה שנדיר ממשלוחים. האריזה מצוינת ושמרה על כל דבר. זמן ההגעה עמד בהבטחה. מינוס כוכב כי הרוטב שביקשתי הגיע כמעט ריק — אבל זה קטנוני לעסק כל כך טוב.",
      sentiment:     'positive',
      status:        'pending',
      reply_text:    null,
      created_at:    ago(18),
      replied_at:    null,
    },
    {
      business_id:   businessId,
      reviewer_name: 'רוני שמיר',
      platform:      'google',
      rating:        3,
      content:       "האוכל בצ'יפופו טוב — זה ברור. אבל ביום שישי ב-18:00 ההמתנה הגיעה ל-25 דקות עם ילד רעב ביד. אולי כדאי לחשוב על מערכת הזמנות מקדימות? כשהאוכל הגיע — מצוין כרגיל. פשוט לא הזמן הנכון לביקור ספונטני.",
      sentiment:     'neutral',
      status:        'pending',
      reply_text:    null,
      created_at:    ago(22),
      replied_at:    null,
    },
    {
      business_id:   businessId,
      reviewer_name: 'ירדן מזרחי',
      platform:      'google',
      rating:        2,
      content:       "הפעם לא עמד בציפיות. הצ'יפס הגיע קר, וכשביקשתי להחליף — המלצר הגיב בחוסר סבלנות. בצ'יפופו רגיל לרמה גבוהה יותר ומאוכזב. מקווה שזה היה יום חריג ולא מגמה.",
      sentiment:     'critical',
      status:        'pending',
      reply_text:    null,
      created_at:    ago(25),
      replied_at:    null,
    },
    {
      business_id:   businessId,
      reviewer_name: 'טל אברהם',
      platform:      'facebook',
      rating:        5,
      content:       "ציינו 30 שנה לחיתונינו בצ'יפופו ולא התאכזבנו לרגע! הצוות הכין לנו שולחן עם עיצוב קטן ואפילו הוסיף קינוח מיוחד בלי שביקשנו. איכות האוכל הייתה מהמעלה הראשונה. זה ההבדל בין מסעדה לחוויה. תודה מעומק הלב!",
      sentiment:     'very_positive',
      status:        'pending',
      reply_text:    null,
      created_at:    ago(28),
      replied_at:    null,
    },
    {
      business_id:   businessId,
      reviewer_name: 'דניאל אוחיון',
      platform:      'tripadvisor',
      rating:        1,
      content:       "ביקור מאכזב מאוד. ב-13:00 ביום חול קיבלתי שניצל שנראה כאילו עמד שעה בתחממת — יבש, עייף, לא טרי. כשהעליתי את הנושא קיבלתי התנצלות אבל לא הוחלפה המנה. עבור מסעדה שבנתה את המוניטין שלה על 'הכל טרי, הכל ביד' — זה לא מתקבל על הדעת.",
      sentiment:     'critical',
      status:        'replied',
      reply_text:    "דניאל, תודה על הכנות הכואבת — וצדקת לחלוטין. קיבלנו את הפידבק ברצינות מלאה ודיברנו עם הצוות: שניצל שעמד יותר מ-15 דקות מוחלף אוטומטית. זו המדיניות שלנו ואנחנו מצטערים שהיא לא יושמה. מוזמן לחזור — הארוחה עלינו. — הנהלת צ'יפופו",
      created_at:    ago(31),
      replied_at:    ago(30),
    },
    {
      business_id:   businessId,
      reviewer_name: 'לילי כהן-אבידן',
      platform:      'other',
      rating:        4,
      content:       "צ'יפופו — סניף שכונתי ברמה אמיתית. מגיעה לשם פעמיים בחודש ותמיד שמחה מהבחירה. המחירים עלו קצת בחצי שנה האחרונה, אבל האיכות נשמרה לחלוטין. יש משהו ביתי ואמיתי במקום הזה שלא מוצאים בשרשרות הגדולות. ממליצה בחום לכל מי שגר באזור!",
      sentiment:     'positive',
      status:        'pending',
      reply_text:    null,
      created_at:    ago(35),
      replied_at:    null,
    },
  ];
}

// ── Public API ──────────────────────────────────────────────────────────────────

export async function seedChipopo(userId: string): Promise<{ error?: string }> {
  // 1. Find or create the business
  const { data: existing } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  let businessId: string | null = existing?.id ?? null;

  if (businessId) {
    const { error } = await supabase.from('businesses').update(BIZ_FIELDS).eq('id', businessId);
    if (error) return { error: `עדכון עסק נכשל: ${error.message}` };
  } else {
    const { data: newBiz, error } = await supabase
      .from('businesses')
      .insert({ owner_id: userId, ...BIZ_FIELDS })
      .select('id')
      .single();
    if (error) return { error: `יצירת עסק נכשל: ${error.message}` };
    businessId = newBiz?.id ?? null;
  }

  if (!businessId) return { error: 'לא נמצא מזהה עסק' };

  // 2. Delete ALL existing reviews for a clean slate
  const { error: delError } = await supabase.from('reviews').delete().eq('business_id', businessId);
  if (delError) return { error: `מחיקת ביקורות קיימות נכשלה: ${delError.message}` };

  // 3. Insert the 10 crafted reviews
  const reviews = buildReviews(businessId, Date.now());
  const { error: insertError } = await supabase.from('reviews').insert(reviews);
  if (insertError) return { error: `הוספת ביקורות נכשלה: ${insertError.message}` };

  return {};
}
