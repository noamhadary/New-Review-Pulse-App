import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { to, session_id, review_id, suggestions, reviewer_name, rating, content_snippet } =
      await req.json();

    if (!to || !suggestions?.length) {
      return new Response(JSON.stringify({ error: 'Missing to or suggestions' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_WHATSAPP_FROM') ?? 'whatsapp:+14155238886';

    if (!accountSid || !authToken) throw new Error('Twilio credentials not set');

    const stars = '⭐'.repeat(Math.min(rating ?? 3, 5));
    const snippet = content_snippet
      ? `"${content_snippet.slice(0, 80)}${content_snippet.length > 80 ? '...' : ''}"`
      : '';

    const numbered = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
    const optionsText = suggestions
      .slice(0, 4)
      .map((s: string, i: number) => `${numbered[i]} ${s}`)
      .join('\n\n');

    const body = [
      `📩 ביקורת חדשה מ-${reviewer_name ?? 'לקוח'} (${stars})`,
      snippet,
      '',
      'בחר תגובה — שלח מספר:',
      '',
      optionsText,
      '',
      'שלח 1-4 לבחירת תגובה, או 0 לביטול.',
    ]
      .filter((l) => l !== undefined)
      .join('\n');

    const params = new URLSearchParams({
      From: from,
      To: `whatsapp:${to.startsWith('+') ? to : '+' + to}`,
      Body: body,
    });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    const twilioData = await twilioRes.json();
    if (!twilioRes.ok) throw new Error(`Twilio error: ${JSON.stringify(twilioData)}`);

    // Update session with whatsapp_to so webhook can match the reply
    if (session_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await supabase
        .from('reply_sessions')
        .update({ whatsapp_to: to })
        .eq('id', session_id);
    }

    return new Response(JSON.stringify({ ok: true, sid: twilioData.sid }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
