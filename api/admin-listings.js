// Returns all listings for the admin update tool (bypasses RLS using service key)
const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?select=id,name,type,hours,items,notes,address,contact_phone,website,status,main_hub&order=name.asc`,
    {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).json({ error: err });
  }

  const data = await response.json();
  return res.status(200).json(data);
}
