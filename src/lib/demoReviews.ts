import { supabase } from './supabase';

type Platform = 'google' | 'facebook' | 'tripadvisor' | 'wolt' | 'other';
type Sentiment = 'very_positive' | 'positive' | 'neutral' | 'critical';
type Status = 'pending' | 'replied';

interface ReviewTemplate {
  reviewer_name: string;
  platform: Platform;
  rating: number;
  content: string;
  sentiment: Sentiment;
  status: Status;
  daysAgo: number;
}

const TEMPLATES: Record<string, ReviewTemplate[]> = {
  מסעדנות: [
    { reviewer_name: 'דנה לוי',     platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 2,  content: 'ביקרתי ב{name} עם המשפחה וכולם יצאו שבעי רצון. האוכל היה טרי, הטעמים מדויקים והצוות חם ומסביר פנים. ממליצה בחום!' },
    { reviewer_name: 'יוסף כהן',    platform: 'tripadvisor', rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 5,  content: 'אחת הארוחות הכי טובות שאכלתי לאחרונה. {name} ידעו לפגוע בנקודה — מנות מקוריות, מצגת יפה ושירות מעל לציפיות. בהחלט אחזור!' },
    { reviewer_name: 'מיכל שפירא',  platform: 'wolt',        rating: 4, sentiment: 'positive',      status: 'pending',  daysAgo: 8,  content: 'הזמנתי משלוח מ{name} ופשוט לא האמנתי שאוכל יכול להגיע כל כך חם ומסודר. האריזה מצוינת והטעם בדיוק כמו בבית.' },
    { reviewer_name: 'אביב גולן',   platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 12, content: 'קיבלתי המלצה על {name} ולא התאכזבתי לרגע. המנות יצירתיות, החומרים איכותיים ומחירים הוגנים. מקום ששווה לשמור!' },
    { reviewer_name: 'רחל ברזילי',  platform: 'facebook',    rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 15, content: 'חגגנו יום הולדת ב{name} — הצוות הכין שולחן מיוחד והגיש עוגה עם ברכה. לאורך כל הערב היינו מטופלות כמו מלכות. תודה!' },
    { reviewer_name: 'עמית רוזן',   platform: 'tripadvisor', rating: 3, sentiment: 'neutral',        status: 'pending',  daysAgo: 18, content: 'ב{name} יש פוטנציאל, אבל ביקורנו לא היה מושלם. האוכל טעים אבל הגיע באיחור. השירות מנסה אבל נראה עמוס. אולי ביקור נוסף ישנה.' },
    { reviewer_name: 'שרה מלכה',    platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 20, content: '{name} הפתיעה אותי לטובה! נכנסתי בלי ציפיות גדולות ויצאתי עם חיוך רחב. כל מה שהזמנתי היה מדויק וטעים. אחזור עם חברים!' },
    { reviewer_name: 'ניר אפרתי',   platform: 'google',      rating: 2, sentiment: 'critical',       status: 'pending',  daysAgo: 22, content: 'לצערי הביקור ב{name} לא עמד בציפיות. ההמתנה ארוכה, חלק מהמנות הגיעו קרות ועל תלונה שלי לא קיבלתי מענה ראוי. מקווה שישתפרו.' },
    { reviewer_name: 'ליאת כץ',     platform: 'wolt',        rating: 4, sentiment: 'positive',      status: 'pending',  daysAgo: 25, content: 'הזמנה שנייה מ{name} ושוב שביעות רצון מלאה. אוכל אמיתי, בטעם אמיתי — לא תעשייתי. ממליצה על הטחינה ועל המנה עם הבשר.' },
    { reviewer_name: 'יעל פרידמן',  platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 28, content: 'כבר הפכתי לנאמנה של {name}. כל שבוע ביקור, וכל פעם משהו חדש לגלות בתפריט. המקום תמיד נקי, נעים ומלא אנרגיה טובה. 10/10!' },
  ],
  קמעונאות: [
    { reviewer_name: 'אורי לפיד',   platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 3,  content: 'קניתי ב{name} כמה פריטים ולא יכולתי להאמין לאיכות במחיר כזה. הצוות יעץ לי מצוין ועזר לי למצוא בדיוק מה שחיפשתי. קנייה מהנה!' },
    { reviewer_name: 'תמר אלון',    platform: 'facebook',    rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 6,  content: '{name} היא המקום שבו אני קונה כל מה שצריך. מגוון מרשים, מחירים הוגנים ופעמיים כבר קיבלתי מתנה קטנה עם ההזמנה. מטפחים לקוחות!' },
    { reviewer_name: 'גיל סבן',     platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'pending',  daysAgo: 9,  content: 'הזמנה אונליין ב{name} הייתה חוויה מצוינת: אתר נוח, תשלום מהיר, משלוח תוך יומיים. הפריטים ארוזים יפה והתאימו לתיאור. ממליץ!' },
    { reviewer_name: 'מאיה הורביץ', platform: 'google',      rating: 3, sentiment: 'neutral',        status: 'pending',  daysAgo: 11, content: 'מבחר סביר ב{name}, אבל המחירים לא תמיד מוצדקים. קניתי כמה דברים שהייתי שמחה למצוא בזול יותר. שירות הלקוחות היה בסדר.' },
    { reviewer_name: 'נועה כהן',    platform: 'facebook',    rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 14, content: 'קנייה ב{name} היא תמיד הנאה. הצוות מכיר את הסחורה לעומק וייעץ לי מצוין בבחירת מתנה. קיבלתי יחס אישי אמיתי. מעולה!' },
    { reviewer_name: 'אסף ברק',     platform: 'google',      rating: 2, sentiment: 'critical',       status: 'pending',  daysAgo: 17, content: 'רכשתי מוצר ב{name} שלא עמד בתיאור שעל האריזה. תהליך ההחזרה ארך זמן רב מהנדרש. מקווה שישפרו את שירות הלקוחות.' },
    { reviewer_name: 'רועי שטרן',   platform: 'google',      rating: 4, sentiment: 'positive',      status: 'pending',  daysAgo: 20, content: 'מכירת הסוף עונה ב{name} הייתה שווה כל שקל! פריטים מעולים במחירים מוזלים. האחסון מסודר ומקל על הקנייה. שמרו לי מקום לעונה הבאה!' },
    { reviewer_name: 'חני לב',      platform: 'facebook',    rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 23, content: 'ב{name} קנינו ציוד לבית החדש ולא היינו מאוכזבים לרגע. מוצרים איכותיים, צוות מקצועי ולא לחצו עלינו לקנות. קנייה נינוחה ומוצלחת!' },
    { reviewer_name: 'צבי מזרחי',   platform: 'other',       rating: 3, sentiment: 'neutral',        status: 'pending',  daysAgo: 26, content: 'קניתי ב{name} ויש מקום לשיפור. יש מוצרים טובים לצד מוצרים שלא הרשימו. שירות ארוך בקופה. בסה"כ ביניוני.' },
    { reviewer_name: 'דינה ספיר',   platform: 'google',      rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 29, content: 'תמיד מוצאת משהו מיוחד ב{name}. המגוון מתחדש תדיר ותמיד יש פריטים חדשים שמפתיעים. שירות נעים וחנות שכיף לבקר בה!' },
  ],
  שירותים: [
    { reviewer_name: 'מרים יצחק',  platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 2,  content: 'פניתי ל{name} עם בעיה דחופה וקיבלתי מענה תוך שעה. העבודה בוצעה מקצועית ובמחיר שסוכם. לא ניצלו שהייתי בלחץ. ישרים ומקצועיים!' },
    { reviewer_name: 'שלמה גרוסמן', platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 5,  content: '{name} הם הטובים ביותר בתחום. עבדתי איתם על פרויקט גדול וכל שלב בוצע בזמן ובאיכות גבוהה. תקשורת מצוינת לאורך כל הדרך. ממליץ!' },
    { reviewer_name: 'ורד כהן',     platform: 'facebook',    rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 8,  content: 'שירות אמין ומקצועי מצוות {name}. הסבירו לי כל שלב בצורה ברורה ולא הרגשתי שמנצלים את חוסר הידע שלי. מחיר הוגן לאיכות שקיבלתי.' },
    { reviewer_name: 'אלי מוסרי',   platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'pending',  daysAgo: 11, content: 'שכרתי את שירותי {name} לאחר המלצה וממש שמח שעשיתי כן. תוצאות מדהימות, עמידה בלוחות הזמנים ושירות לאחר העבודה מעולה.' },
    { reviewer_name: 'טלי שוחט',    platform: 'facebook',    rating: 3, sentiment: 'neutral',        status: 'pending',  daysAgo: 14, content: 'ב{name} עובדים בצורה סבירה. לא הייתה תלונה גדולה אבל גם לא חוויה מרגשת. פשוט עשו את העבודה — לא יותר.' },
    { reviewer_name: 'פנחס רוזנר',  platform: 'google',      rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 17, content: 'ב{name} נתנו לי הצעת מחיר הוגנת ועמדו בה עד הסוף. לא היו הפתעות ולא תוספות בלתי צפויות. שירות מקצועי וזמין. אפנה אליהם שוב.' },
    { reviewer_name: 'לינה אדלר',   platform: 'google',      rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 20, content: 'מעולם לא קיבלתי שירות כל כך אישי ומדויק כמו ב{name}. הצוות זיהה בדיוק מה אני צריכה, הציע פתרון מותאם ובוצע הכל במהירות.' },
    { reviewer_name: 'מנחם הלוי',   platform: 'google',      rating: 2, sentiment: 'critical',       status: 'pending',  daysAgo: 23, content: 'התחלנו לעבוד עם {name} עם ציפיות גבוהות שלא מומשו. הייתה תקשורת לקויה ועיכובים לא מוסברים. בסוף נפתר אבל עם הרבה חיכוכים.' },
    { reviewer_name: 'נירית פינקל',  platform: 'other',       rating: 4, sentiment: 'positive',      status: 'pending',  daysAgo: 26, content: 'שוב פניתי ל{name} ושוב לא אכזבו. הם כבר מכירים את הצרכים שלי ופועלים בהתאם. שירות מהיר ויעיל, בדיוק מה שצריך עסק בצמיחה.' },
    { reviewer_name: 'גלית בן-דוד',  platform: 'facebook',    rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 29, content: 'המלצתי על {name} לחמישה מכרים שלי וכולם חזרו עם חיוכים. עסק שמייצג מקצועיות, יחס אישי ואמינות — ערכים נדירים היום.' },
  ],
  בריאות: [
    { reviewer_name: 'חדוה כץ',       platform: 'google',   rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 2,  content: 'הגעתי ל{name} לאחר חיפוש ממושך וסוף סוף מצאתי מקום שמתייחס לכל מטופל כפרט. ההסברים מקיפים, הגישה חמה ותחושת הביטחון מיידית.' },
    { reviewer_name: 'ברוך שמואל',    platform: 'google',   rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 6,  content: 'הצוות ב{name} מקצוענים מדרגה ראשונה. הטיפול שקיבלתי היה מקיף ומלווה בחמימות אנושית. לא הרגשתי כמו עוד מספר. שירות בריאות כמו שצריך.' },
    { reviewer_name: 'יעקב לרנר',     platform: 'google',   rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 10, content: 'מגיע ל{name} כבר שנתיים — הסטנדרט גבוה ועקבי. הצוות מכיר אותי ואת ההיסטוריה שלי. רק לפעמים ההמתנה ארוכה מדי.' },
    { reviewer_name: 'רינה סיטון',    platform: 'facebook', rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 14, content: 'לא קל למצוא מקום שגורם לך לסמוך עליו בענייני בריאות, אבל {name} הצליחו. מקצועיות ללא פשרות, גישה אמפתית ותמיד זמינים לשאלות.' },
    { reviewer_name: 'משה אורלן',     platform: 'google',   rating: 3, sentiment: 'neutral',        status: 'pending',  daysAgo: 18, content: 'הטיפול ב{name} היה מקצועי, אבל מערכת קביעת התורים דרשה שיפור. המתנתי יותר מהצפוי ולא קיבלתי עדכון. הצוות הסביר יפה אבל הלוגיסטיקה לוקה.' },
    { reviewer_name: 'פאינה גרינברג', platform: 'google',   rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 22, content: 'ב{name} ראיתי מה זה טיפול אמיתי — לא רק מקצועי אלא גם אנושי. הרגשתי שמאזינים לי ולוקחים את הדאגות שלי ברצינות.' },
    { reviewer_name: 'אמיר חדד',      platform: 'google',   rating: 4, sentiment: 'positive',      status: 'pending',  daysAgo: 25, content: 'מיד בכניסה ל{name} הרגשתי שאני במקום הנכון. הקבלה חמה, ההמתנה קצרה יחסית והמקצועיות מרשימה. ימשיכו כך!' },
    { reviewer_name: 'יהודית שלזינגר', platform: 'google',  rating: 2, sentiment: 'critical',       status: 'pending',  daysAgo: 28, content: 'ציפיתי ליותר מ{name}. ההסבר שקיבלתי היה קצר וחלקי ולא הרגשתי שהייתה תשומת לב מלאה לבעיה שהצגתי. אם לא ישתפר — אחפש אלטרנטיבה.' },
    { reviewer_name: 'שושנה אבידן',   platform: 'facebook', rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 30, content: 'מגיעה ל{name} מזה שנה ולא מתכוונת לשנות. הצוות מדהים, תמיד חיוכים, תמיד ידע, תמיד זמינות. טיפול שמרגיש כמו שותפות אמיתית לבריאות שלי.' },
    { reviewer_name: 'אלכסנדר נוביקוב', platform: 'other',  rating: 4, sentiment: 'positive',      status: 'pending',  daysAgo: 15, content: 'ב{name} ראיתי מקצועיות אמיתית. הבדיקות בוצעו בקפידה, הממצאים הוסברו בשפה פשוטה וקיבלתי המשך טיפול ברור. אם אינכם יודעים לאן לפנות — כאן הכתובת.' },
  ],
  אחר: [
    { reviewer_name: 'טל אביבי',     platform: 'google',   rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 3,  content: 'חוויה מעולה עם {name}! מקצועיים, אמינים ויודעים בדיוק מה הם עושים. ממליץ בחום לכל מי שמחפש שירות ברמה גבוהה.' },
    { reviewer_name: 'נורית שמיר',   platform: 'google',   rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 7,  content: 'מצאתי ב{name} בדיוק מה שחיפשתי. יחס אישי, מחיר הוגן ותוצאה שמדברת בעד עצמה. בהחלט אחזור ואמליץ לאחרים.' },
    { reviewer_name: 'יצחק פרץ',     platform: 'facebook', rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 12, content: '{name} נתנו לי שירות מקצועי ואמין. לא הכל היה מושלם אבל כשהעלתי בעיה — טיפלו בה מיד ובכבוד. כך צריך לנהוג עם לקוחות.' },
    { reviewer_name: 'ספיר חיימוב',  platform: 'google',   rating: 3, sentiment: 'neutral',        status: 'pending',  daysAgo: 16, content: 'ב{name} יש בסיס טוב לעסק מצוין. הצוות מנסה, אבל יש עוד מקום לצמיחה. ביקרתי פעמיים וראיתי שינוי לטובה — מקום שמתפתח.' },
    { reviewer_name: 'דוד ביטון',    platform: 'facebook', rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 19, content: 'מספר חברים המליצו על {name} ועכשיו אני מבין למה. חוויה ראשונית מעולה שהשאירה טעם של עוד. אנשי הצוות הם הנכס הכי גדול של העסק.' },
    { reviewer_name: 'רחמים אוחיון', platform: 'google',   rating: 2, sentiment: 'critical',       status: 'pending',  daysAgo: 21, content: 'לא הייתי מרוצה מהביקור ב{name}. הייתי מצפה ליחס יותר אדיב ולהסברים יותר ברורים. ייתכן שהיה יום רע, אבל רושם ראשוני חשוב.' },
    { reviewer_name: 'ורד מרטין',    platform: 'google',   rating: 4, sentiment: 'positive',      status: 'replied',  daysAgo: 24, content: 'הפתיעו אותי לטובה ב{name}. חשבתי שהיה עוד עסק סטנדרטי, אבל קיבלתי יחס חם, שירות מקצועי ומחיר שמצדיק כל שקל. חוזרת בקרוב!' },
    { reviewer_name: 'עופר גנון',    platform: 'other',    rating: 5, sentiment: 'very_positive', status: 'replied',  daysAgo: 27, content: 'אחרי שנים של חיפוש מצאתי ב{name} מה שתמיד רציתי — שירות שבאמת דואג ללקוח. לא מרגישים כמו מספר אלא כאנשים עם צרכים אמיתיים.' },
    { reviewer_name: 'שמחה בן-ארי',  platform: 'facebook', rating: 3, sentiment: 'neutral',        status: 'pending',  daysAgo: 30, content: 'התנסיתי ב{name} ויש אמת בביקורות החיוביות, אבל גם מקום לשיפור. שירות בסיסי טוב, אבל כדי לבלוט צריך להוסיף עוד.' },
    { reviewer_name: 'לאה בן-חמו',   platform: 'google',   rating: 4, sentiment: 'positive',      status: 'pending',  daysAgo: 13, content: 'פניתי ל{name} בפעם הראשונה לפני כמה חודשים ומאז חזרתי שוב ושוב. מה שמייחד אותם זה הרצינות והמסירות לתוצאה. ממליצה בחום!' },
  ],
};

function getTemplates(category: string): ReviewTemplate[] {
  return TEMPLATES[category] ?? TEMPLATES['אחר'];
}

export async function seedDemoReviews(
  businessId: string,
  category: string,
  businessName: string,
): Promise<void> {
  // Delete existing demo reviews for this business
  await supabase.from('reviews').delete().eq('business_id', businessId).eq('is_demo', true);

  const templates = getTemplates(category);
  const now = Date.now();

  const rows = templates.map((t) => ({
    business_id:   businessId,
    reviewer_name: t.reviewer_name,
    platform:      t.platform,
    rating:        t.rating,
    content:       t.content.replace(/\{name\}/g, businessName || 'העסק'),
    sentiment:     t.sentiment,
    status:        t.status,
    is_demo:       true,
    created_at:    new Date(now - t.daysAgo * 86_400_000).toISOString(),
  }));

  const { error } = await supabase.from('reviews').insert(rows);
  if (error) console.error('seedDemoReviews error:', error.code, error.message);
}
