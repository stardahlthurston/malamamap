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
      const hours = (l.hours || '').toLowerCase();

      // "Until further notice", "ongoing", or open-ended → never auto-expire
      const isOpenEnded = /until further notice|ongoing/i.test(hours)
        || (l.event_date === 'ongoing')
        || (l.event_dates && l.event_dates.some(e => e === 'ongoing'));
      if (isOpenEnded) return;

      // 1. event_dates array: expire only if ALL dates are in the past
      if (l.event_dates && l.event_dates.length > 0) {
        const allPast = l.event_dates.every(e => {
          const d = e.split('|')[0];
          const dt = new Date(d + 'T23:59:59');
          return !isNaN(dt) && dt < now;
        });
        if (allPast) toClose.push(l.id);
        return;
      }

      // 2. hours text with explicit end date range (e.g. "Mar 25 – Mar 30")
      //    This is the most reliable signal of a fixed-duration listing
      if (l.hours) {
        const dateMatch = l.hours.match(/(\w+ \d+)\s*[–-]\s*(\w+ \d+)/);
        if (dateMatch) {
          try {
            const endDate = new Date(dateMatch[2] + ' ' + now.getFullYear() + ' 23:59:59');
            if (!isNaN(endDate) && endDate < now) { toClose.push(l.id); return; }
          } catch(e) {}
          return; // has a date range that hasn't ended yet
        }
      }

      // 3. expires_at — only trust if the listing has no "From [date]" start-only pattern
      //    "From Mar 24" without an end date = open-ended, so skip
      const hasStartOnly = /from\s+\w+/i.test(hours);
      if (l.expires_at && !hasStartOnly) {
        const exp = new Date(l.expires_at);
        if (!isNaN(exp) && exp < now) toClose.push(l.id);
        return;
      }

      // 4. Single event_date (not ongoing) — this is a start date, only expire
      //    if it looks like a one-day event (no "From" prefix, no ongoing indicator)
      if (l.event_date && !hasStartOnly) {
        const d = l.event_date.split('|')[0];
        const dt = new Date(d + 'T23:59:59');
        if (!isNaN(dt) && dt < now) toClose.push(l.id);
        return;
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

    // (one-time reactivation block removed — was forcing specific listings back to active on every load)

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
