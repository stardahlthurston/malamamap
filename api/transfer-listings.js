// One-time endpoint to transfer listings from specified user IDs to admin
const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const ADMIN_ID = '04e3776b-b75f-4701-888e-511a9cf21382';
const TRANSFER_FROM = [
  '2ae9a4ab-d4a2-43b0-8e71-37b0fc60c748',
  '9ac8e8b6-3c7d-4276-94c1-4a65ecff23b6',
  'af107d04-0543-40ac-8808-765e25e6ce13',
  'e11845ab-3a0d-435a-9fc3-1bbfb2fb0ed8',
  'fff15d66-fa50-4348-bc3b-d11b9c5600a0'
];

export default async function handler(req, res) {
  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set in env' });
  }

  const results = [];
  for (const uid of TRANSFER_FROM) {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?user_id=eq.${uid}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ user_id: ADMIN_ID })
      }
    );
    const data = await resp.json();
    results.push({ from: uid, transferred: Array.isArray(data) ? data.length : 0, status: resp.status });
  }

  return res.status(200).json({ success: true, admin_id: ADMIN_ID, results });
}
