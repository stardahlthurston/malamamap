// Auto-expire listings whose dates have passed — uses service role key to bypass RLS
const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGxtcW1xbG5mdGxweXJxbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDgyMDIsImV4cCI6MjA4OTc4NDIwMn0.r5GLgPk-xywtkQdrmTAFcKZny1-Wrh8b5YezAHmU9yU';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = SUPABASE_KEY || SUPABASE_ANON;
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  try {
    // Fetch all active listings with date fields
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?status=eq.true&select=id,hours,event_date,event_dates,expires_at`,
      { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
    );
    if (!r.ok) throw new Error(await r.text());
    const listings = await r.json();
    if (!listings.length) return res.status(200).json({ expired: 0 });

    const now = new Date();
    const toClose = [];

    listings.forEach(l => {
      // 1. Check event_dates array
      if (l.event_dates && l.event_dates.length > 0) {
        if (l.event_dates.some(e => e === 'ongoing')) return;
        const allPast = l.event_dates.every(e => {
          const d = e.split('|')[0];
          const dt = new Date(d + 'T23:59:59');
          return !isNaN(dt) && dt < now;
        });
        if (allPast) toClose.push(l.id);
        return;
      }

      // 2. Check single event_date
      if (l.event_date) {
        if (l.event_date === 'ongoing') return;
        const d = l.event_date.split('|')[0];
        const dt = new Date(d + 'T23:59:59');
        if (!isNaN(dt) && dt < now) toClose.push(l.id);
        return;
      }

      // 3. Check expires_at
      if (l.expires_at) {
        const exp = new Date(l.expires_at);
        if (!isNaN(exp) && exp < now) toClose.push(l.id);
        return;
      }

      // 4. Fall back to hours text date-range
      if (l.hours) {
        const dateMatch = l.hours.match(/(\w+ \d+)\s*[–-]\s*(\w+ \d+)/);
        if (dateMatch) {
          try {
            const endDate = new Date(dateMatch[2] + ' ' + now.getFullYear() + ' 23:59:59');
            if (!isNaN(endDate) && endDate < now) toClose.push(l.id);
          } catch(e) {}
        }
      }
    });

    if (toClose.length) {
      // Batch update in chunks of 50 to avoid URL length limits
      for (let i = 0; i < toClose.length; i += 50) {
        const chunk = toClose.slice(i, i + 50);
        const ids = chunk.map(id => `"${id}"`).join(',');
        const u = await fetch(
          `${SUPABASE_URL}/rest/v1/listings?id=in.(${ids})`,
          { method: 'PATCH', headers, body: JSON.stringify({ status: false }) }
        );
        if (!u.ok) throw new Error(await u.text());
      }
    }

    // Also clean up skills_direction on non-skills listings (one-time data fix)
    let skillsCleaned = 0;
    try {
      const sr = await fetch(
        `${SUPABASE_URL}/rest/v1/listings?skills_direction=not.is.null&type=not.like.*skills_labor*&select=id`,
        { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
      );
      if (sr.ok) {
        const badListings = await sr.json();
        if (badListings.length) {
          const badIds = badListings.map(l => `"${l.id}"`).join(',');
          await fetch(
            `${SUPABASE_URL}/rest/v1/listings?id=in.(${badIds})`,
            { method: 'PATCH', headers, body: JSON.stringify({ skills_direction: null }) }
          );
          skillsCleaned = badListings.length;
        }
      }
    } catch(e) { /* non-critical */ }

    return res.status(200).json({ expired: toClose.length, ids: toClose, skillsCleaned });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
