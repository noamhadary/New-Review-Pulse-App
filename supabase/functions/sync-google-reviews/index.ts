import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STAR: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function sentiment(r: number) {
  if (r >= 5) return 'very_positive';
  if (r >= 4) return 'positive';
  if (r >= 3) return 'neutral';
  return 'critical';
}

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'GG';
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const clientId     = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function syncForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  businessId: string,
  refreshToken: string,
) {
  const token = await refreshGoogleToken(refreshToken);

  const gbp = async (url: string) => {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`GBP ${r.status}: ${await r.text()}`);
    return r.json();
  };

  const { accounts = [] } = await gbp('https://mybusinessaccountmanagement.googleapis.com/v1/accounts');
  let total = 0;

  for (const acc of accounts) {
    const { locations = [] } = await gbp(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title`,
    );

    for (const loc of locations) {
      const { reviews = [] } = await gbp(
        `https://mybusiness.googleapis.com/v4/${loc.name}/reviews?pageSize=50`,
      );

      if (!reviews.length) continue;

      const rows = reviews.map((r: any) => {
        const rating = STAR[r.starRating] ?? 3;
        return {
          business_id:       businessId,
          platform:          'google',
          external_id:       r.reviewId,
          reviewer_name:     r.reviewer?.displayName || 'אנונימי',
          reviewer_initials: initials(r.reviewer?.displayName || 'א'),
          rating,
          content:           r.comment ?? '',
          sentiment:         sentiment(rating),
          status:            r.reviewReply ? 'replied' : 'pending',
          reply_text:        r.reviewReply?.comment ?? null,
          created_at:        r.createTime,
        };
      });

      const { error } = await supabase.from('reviews').upsert(rows, { onConflict: 'external_id' });
      if (!error) total += rows.length;
    }
  }

  // Update last synced timestamp
  await supabase
    .from('user_settings')
    .upsert({ owner_id: userId, last_synced_at: new Date().toISOString() }, { onConflict: 'owner_id' });

  return total;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // Fetch all users with Google refresh tokens
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('owner_id, google_refresh_token')
      .not('google_refresh_token', 'is', null);

    if (error) throw error;
    if (!settings?.length) {
      return new Response(JSON.stringify({ message: 'No users to sync' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, number> = {};

    for (const s of settings) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', s.owner_id)
        .maybeSingle();

      if (!biz?.id) continue;

      try {
        const synced = await syncForUser(supabase, s.owner_id, biz.id, s.google_refresh_token);
        results[s.owner_id] = synced;
      } catch (e) {
        results[s.owner_id] = -1;
        console.error(`Sync failed for ${s.owner_id}:`, e);
      }
    }

    return new Response(JSON.stringify({ synced: results }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
