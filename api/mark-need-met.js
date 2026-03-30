const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, token } = req.body;
  if (!id || !token) return res.status(400).json({ error: 'Missing id or token' });

  const { data, error } = await sb.from('community_needs').select('delete_token').eq('id', id).single();
  if (error || !data) return res.status(404).json({ error: 'Need not found' });
  if (data.delete_token !== token) return res.status(403).json({ error: 'Invalid token' });

  const { error: delError } = await sb.from('community_needs').delete().eq('id', id);
  if (delError) return res.status(500).json({ error: delError.message });

  return res.status(200).json({ success: true });
};
