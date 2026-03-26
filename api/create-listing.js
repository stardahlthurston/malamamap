const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPABASE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  try {
    const payload = req.body;

    // Basic validation
    if (!payload.name) return res.status(400).json({ error: 'Listing name is required' });
    if (!payload.user_id) return res.status(400).json({ error: 'User ID is required' });

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const r = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    return res.status(200).json({ data: data[0] || data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
