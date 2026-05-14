import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Twilio sends application/x-www-form-urlencoded POST
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    const from = params.get('From') ?? ''; // e.g. "whatsapp:+972501234567"
    const msgBody = (params.get('Body') ?? '').trim();

    const phoneNumber = from.replace('whatsapp:', '').trim();
    const choice = parseInt(msgBody, 10);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (choice === 0) {
      // User cancelled — send confirmation
      return twimlReply('בסדר, התגובה בוטלה. תוכל לבחור תגובה חדשה מהמערכת.');
    }

    if (choice < 1 || choice > 4 || isNaN(choice)) {
      return twimlReply('שלח מספר בין 1 ל-4 לבחירת תגובה, או 0 לביטול.');
    }

    // Find the most recent active session for this phone number
    const { data: session, error: sessionErr } = await supabase
      .from('reply_sessions')
      .select('id, review_id, suggestions, chosen_index')
      .eq('whatsapp_to', phoneNumber)
      .is('chosen_index', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionErr || !session) {
      return twimlReply('לא נמצאה בקשת תגובה פעילה. פנה למערכת Review Pulse.');
    }

    const chosenText: string = session.suggestions[choice - 1];
    if (!chosenText) {
      return twimlReply('בחירה לא תקינה. שלח מספר בין 1 ל-4.');
    }

    // Save chosen reply to review
    const now = new Date().toISOString();
    const { error: reviewErr } = await supabase
      .from('reviews')
      .update({ reply_text: chosenText, status: 'replied', replied_at: now })
      .eq('id', session.review_id);

    if (reviewErr) throw reviewErr;

    // Mark session as resolved
    await supabase
      .from('reply_sessions')
      .update({ chosen_index: choice })
      .eq('id', session.id);

    return twimlReply(
      `✅ תגובה ${choice} נבחרה ונשמרה במערכת:\n"${chosenText.slice(0, 100)}${chosenText.length > 100 ? '...' : ''}"`,
    );
  } catch (err) {
    console.error(err);
    return twimlReply('אירעה שגיאה. נסה שוב או פנה לתמיכה.');
  }
});

function twimlReply(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${escapeXml(message)}</Message></Response>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
