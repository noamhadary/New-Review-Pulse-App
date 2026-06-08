import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// GREEN API sends JSON webhooks
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const webhook = await req.json();

    // Only process incoming text messages
    if (webhook.typeWebhook !== 'incomingMessageReceived') {
      return new Response('ok', { status: 200 });
    }

    const chatId: string = webhook.senderData?.chatId ?? '';
    const msgBody: string = (webhook.messageData?.textMessageData?.textMessage ?? '').trim();

    if (!chatId || !msgBody) return new Response('ok', { status: 200 });

    // chatId format: "972521234567@c.us" -> normalize to "+972521234567"
    const phoneDigits = chatId.replace('@c.us', '');
    const phoneNumber = `+${phoneDigits}`;
    const choice = parseInt(msgBody, 10);

    const instanceId = Deno.env.get('GREEN_API_INSTANCE_ID');
    const apiToken = Deno.env.get('GREEN_API_TOKEN');

    if (!instanceId || !apiToken) throw new Error('GREEN API credentials not set');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const sendReply = (message: string): Promise<Response> =>
      fetch(
        `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message }),
        },
      );

    if (choice === 0) {
      await sendReply('בסדר, התגובה בוטלה. תוכל לבחור תגובה חדשה מהמערכת.');
      return new Response('ok', { status: 200 });
    }

    if (isNaN(choice) || choice < 1 || choice > 4) {
      await sendReply('שלח מספר בין 1 ל-4 לבחירת תגובה, או 0 לביטול.');
      return new Response('ok', { status: 200 });
    }

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
      await sendReply('לא נמצאה בקשת תגובה פעילה. פנה למערכת Review Pulse.');
      return new Response('ok', { status: 200 });
    }

    const chosenText: string = session.suggestions[choice - 1];
    if (!chosenText) {
      await sendReply('בחירה לא תקינה. שלח מספר בין 1 ל-4.');
      return new Response('ok', { status: 200 });
    }

    const now = new Date().toISOString();
    const { error: reviewErr } = await supabase
      .from('reviews')
      .update({ reply_text: chosenText, status: 'replied', replied_at: now })
      .eq('id', session.review_id);

    if (reviewErr) throw reviewErr;

    await supabase
      .from('reply_sessions')
      .update({ chosen_index: choice })
      .eq('id', session.id);

    await sendReply(
      `תגובה ${choice} נבחרה ונשמרה במערכת:\n"${chosenText.slice(0, 100)}${chosenText.length > 100 ? '...' : ''}"`,
    );

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('error', { status: 500 });
  }
});

