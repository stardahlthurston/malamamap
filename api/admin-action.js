// Admin actions endpoint — uses service role key to bypass RLS
const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ID = '04e3776b-b75f-4701-888e-511a9cf21382';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPABASE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { action, userId, claimId, listingId, authUserId } = req.body;

  // Basic auth check — only admin can use this
  if (authUserId !== ADMIN_ID) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  try {
    let result;

    switch (action) {
      case 'approve_ein': {
        // Update verification_requests
        const r1 = await fetch(`${SUPABASE_URL}/rest/v1/verification_requests?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'verified', reviewed_at: new Date().toISOString() })
        });
        // Mark all their listings as verified
        const r2 = await fetch(`${SUPABASE_URL}/rest/v1/listings?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ verified: true })
        });
        if (!r1.ok) throw new Error('Failed to update verification: ' + await r1.text());
        result = { success: true, message: 'EIN approved' };
        break;
      }

      case 'deny_ein': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/verification_requests?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'denied', reviewed_at: new Date().toISOString() })
        });
        if (!r.ok) throw new Error('Failed to deny EIN: ' + await r.text());
        result = { success: true, message: 'EIN denied' };
        break;
      }

      case 'approve_claim': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/claim_requests?id=eq.${claimId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'approved' })
        });
        if (!r.ok) throw new Error('Failed to approve claim: ' + await r.text());
        result = { success: true, message: 'Claim approved' };
        break;
      }

      case 'decline_claim': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/claim_requests?id=eq.${claimId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'declined' })
        });
        if (!r.ok) throw new Error('Failed to decline claim: ' + await r.text());
        result = { success: true, message: 'Claim declined' };
        break;
      }

      default:
        return res.status(400).json({ error: 'Unknown action: ' + action });
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
