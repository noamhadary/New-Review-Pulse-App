import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  soft:       'חמה ואישית — צור קשר רגשי אמיתי, הכר בתחושת הלקוח, הבע אמפתיה כנה',
  gentle:     'מנומסת ועדינה — מכבדת את הלקוח, מנוסחת בזהירות, מרגיעה ומייצרת אמון',
  firm:       'מקצועית וישירה — עניינית וברורה, מציגה עובדות או פעולה, ללא ריגושים מיותרים',
  apologetic: 'מתנצלת ומפצה — מביעה חרטה כנה, לוקחת אחריות, מציעה פתרון או פיצוי',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { reviewer_name, rating, content, tone, review_id } = await req.json();

    if (!content || !tone) {
      return new Response(JSON.stringify({ error: 'Missing content or tone' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not set');

    const systemPrompt = `אתה מומחה לניהול מוניטין לעסקים ישראליים. תפקידך לנסח תגובות מקצועיות לביקורות לקוחות.

חוקים מחייבים — חשוב מאוד:
1. התגובה חייבת להתייחס ספציפית לתוכן הביקורת — ציין מה הלקוח כתב (שירות, מוצר, המתנה וכו')
2. לעולם אל תפגע בלקוח, אל תטיל ספק בדבריו, ואל תהיה מתגוננת
3. כתוב בעברית תקנית וטבעית
4. כל תגובה: 2-3 משפטים בלבד
5. פנה ישירות ללקוח בגוף שני (אתה/את)
6. אל תפתח ב"שלום" בלבד — פתח עם תגובה ישירה לתוכן
7. אל תזכיר שם עסק ספציפי
8. החזר JSON בלבד — ללא טקסט לפני או אחרי

אופי התגובות: ${TONE_DESCRIPTIONS[tone] ?? TONE_DESCRIPTIONS.soft}`;

    const userPrompt = `ביקורת מאת ${reviewer_name} (${rating} כוכבים):
"${content}"

נתח את הביקורת והבן מה בדיוק הלקוח חווה (טוב או רע).
צור 4 תגובות שונות זו מזו — כל אחת מתייחסת ספציפית לנושאים שהוזכרו בביקורת.
אסור לכתוב תגובה גנרית שיכולה להתאים לכל ביקורת.

החזר אך ורק:
{"suggestions":["תגובה 1","תגובה 2","תגובה 3","תגובה 4"]}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const claude = await res.json();
    const raw = claude.content?.[0]?.text ?? '{}';

    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      suggestions = parsed.suggestions ?? [];
    } catch {
      // Fallback: extract JSON block if Claude wrapped it in markdown
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) suggestions = JSON.parse(match[0]).suggestions ?? [];
    }

    if (suggestions.length !== 4) throw new Error('Expected 4 suggestions from Claude');

    // Persist session to DB if review_id provided
    if (review_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      const { data: session, error } = await supabase
        .from('reply_sessions')
        .insert({ review_id, tone, suggestions })
        .select('id')
        .single();

      if (error) console.error('DB insert error:', error);

      return new Response(JSON.stringify({ suggestions, session_id: session?.id }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
