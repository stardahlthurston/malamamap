// Admin actions endpoint — uses service role key to bypass RLS
const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// ✏️ To add another admin: paste their Supabase UUID here (Supabase → Auth → Users → copy User UID)
const ADMIN_IDS = [
  '04e3776b-b75f-4701-888e-511a9cf21382', // Star (super admin)
  'af107d04-0543-40ac-8808-765e25e6ce13', // Braedyn Domeyer
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPABASE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { action, userId, claimId, listingId, authUserId, expiresAt, field, value } = req.body;

  // Basic auth check — only admins can use this
  if (!ADMIN_IDS.includes(authUserId)) {
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

      case 'toggle_badge': {
        if (!['verified', 'nonprofit', 'main_hub'].includes(field)) throw new Error('Invalid badge field');
        const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ [field]: !!value })
        });
        if (!r.ok) throw new Error('Failed to update badge: ' + await r.text());
        result = { success: true, message: `${field} badge ${value ? 'added' : 'removed'}` };
        break;
      }

      case 'extend_listing': {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ expires_at: expiresAt, status: true })
        });
        if (!r.ok) throw new Error('Failed to extend listing: ' + await r.text());
        result = { success: true, message: 'Listing extended' };
        break;
      }

      case 'update_listing': {
        const { payload } = req.body;
        if (!listingId || !payload) throw new Error('listingId and payload required');
        const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error('Failed to update listing: ' + await r.text());
        result = { success: true, message: 'Listing updated' };
        break;
      }

      case 'reactivate_auto_expired': {
        // Find all inactive listings, reactivate ones that were closed by expires_at
        // but NOT ones whose hours date range has genuinely passed.
        const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=id,hours,expires_at&status=eq.false`, {
          headers
        });
        if (!r.ok) throw new Error('Failed to fetch inactive listings: ' + await r.text());
        const inactive = await r.json();

        const now = new Date();
        const toReactivate = [];
        for (const l of (inactive || [])) {
          // Only consider listings that have an expires_at (set by auto-expiry system)
          if (!l.expires_at) continue;
          // Skip if the hours field has a date range whose end date has passed
          if (l.hours) {
            const dateMatch = l.hours.match(/(\w+ \d+)\s*[–\-]\s*(\w+ \d+)/);
            if (dateMatch) {
              try {
                const endDate = new Date(dateMatch[2] + ' 2026 23:59:59');
                if (!isNaN(endDate) && endDate < now) continue; // naturally ended — skip
              } catch(e) {}
            }
          }
          toReactivate.push(l.id);
        }

        if (toReactivate.length > 0) {
          const patch = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=in.(${toReactivate.map(id=>`"${id}"`).join(',')})`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: true })
          });
          if (!patch.ok) throw new Error('Failed to reactivate listings: ' + await patch.text());
        }
        result = { success: true, reactivated: toReactivate.length, ids: toReactivate };
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
