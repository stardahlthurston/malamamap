const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { secret, updates } = req.body;

  // Require a secret to prevent unauthorized use
  if (!secret || secret !== process.env.FIX_COORDS_SECRET) {
    return res.status(403).json({ error: 'Invalid secret' });
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Missing updates array' });
  }

  const results = [];

  for (const u of updates) {
    if (!u.id || u.lat == null || u.lng == null) {
      results.push({ id: u.id, status: 'skipped', reason: 'missing fields' });
      continue;
    }

    const { error } = await sb
      .from('listings')
      .update({ lat: u.lat, lng: u.lng })
      .eq('id', u.id);

    if (error) {
      results.push({ id: u.id, status: 'error', reason: error.message });
    } else {
      results.push({ id: u.id, status: 'updated' });
    }
  }

  return res.status(200).json({ success: true, results });
};
