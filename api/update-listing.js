// update-listing.js — lets any authenticated user update their own listing
// Uses service key to bypass RLS, but verifies ownership before updating
const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const ADMIN_IDS = [
  '04e3776b-b75f-4701-888e-511a9cf21382', // Star (super admin)
  'af107d04-0543-40ac-8808-765e25e6ce13', // Braedyn Domeyer
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPABASE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { listingId, payload, authUserId } = req.body;
  if (!listingId || !payload || !authUserId) {
    return res.status(400).json({ error: 'listingId, payload, and authUserId required' });
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  try {
    // Verify the user owns this listing OR is an admin
    const checkR = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}&select=user_id`, { headers });
    if (!checkR.ok) throw new Error('Failed to verify listing ownership');
    const rows = await checkR.json();
    const ownerId = rows[0]?.user_id;

    if (ownerId !== authUserId && !ADMIN_IDS.includes(authUserId)) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    // Update via service key (bypasses RLS)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error('Failed to update listing: ' + await r.text());

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
