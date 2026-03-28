import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const STAR_EMAIL = 'dahlthurstonstar@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPABASE_KEY) return res.status(200).json({ skipped: 'no service key' });

  const hdrs = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Load threshold + already-alerted list from settings table
    const settingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/settings?key=in.(item_alert_threshold,alerted_items)&select=key,value`,
      { headers: hdrs }
    );
    const settings = Array.isArray(await settingsRes.clone().json()) ? await settingsRes.json() : [];

    const thresholdRow = settings.find(s => s.key === 'item_alert_threshold');
    const alertedRow   = settings.find(s => s.key === 'alerted_items');
    const threshold    = thresholdRow ? Number(thresholdRow.value) : 20;
    const alerted      = Array.isArray(alertedRow?.value) ? alertedRow.value : [];

    // 2. Count item frequency across all listings
    const listingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/listings?select=items&items=not.is.null`,
      { headers: hdrs }
    );
    const listings = await listingsRes.json();

    const counts = {};
    for (const l of listings) {
      for (const raw of (Array.isArray(l.items) ? l.items : [])) {
        const display = raw.replace(/^(GIVING|ACCEPTING):/, '').trim();
        const key = display.toLowerCase();
        if (!counts[key]) counts[key] = { display, count: 0 };
        counts[key].count++;
      }
    }

    // 3. Find items newly crossing the threshold
    const newCrossings = Object.entries(counts)
      .filter(([key, info]) => info.count >= threshold && !alerted.includes(key))
      .map(([, info]) => info);

    if (newCrossings.length === 0) {
      return res.status(200).json({ checked: true, newAlerts: 0 });
    }

    // 4. Send alert email
    const resend = new Resend(RESEND_KEY);
    const rows = newCrossings
      .sort((a, b) => b.count - a.count)
      .map(i => `
        <tr>
          <td style="padding:10px 16px;font-size:0.9rem;font-weight:700;color:#1c1a18;border-bottom:1px solid #f0ece8;">${i.display}</td>
          <td style="padding:10px 16px;font-size:0.9rem;font-weight:700;color:#3a7d5c;text-align:right;border-bottom:1px solid #f0ece8;">${i.count} listings</td>
        </tr>`)
      .join('');

    await resend.emails.send({
      from: 'Mālama Map <no-reply@malamamap.com>',
      to: STAR_EMAIL,
      subject: `🔥 ${newCrossings.length} item${newCrossings.length > 1 ? 's' : ''} hit ${threshold}+ listings`,
      html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#275c42 0%,#3a7d5c 100%);padding:28px 32px;">
    <p style="margin:0;font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Mālama Map — Item Alert</p>
    <h1 style="margin:8px 0 0;font-size:1.4rem;font-weight:800;color:white;">🔥 High-demand item${newCrossings.length > 1 ? 's' : ''} detected</h1>
  </td></tr>
  <tr><td style="padding:28px 32px;">
    <p style="margin:0 0 6px;font-size:0.88rem;color:#4a453f;">The following item${newCrossings.length > 1 ? 's have' : ' has'} reached your alert threshold of <strong>${threshold} or more listings</strong>:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border:1.5px solid #e8e4df;border-radius:10px;overflow:hidden;">
      <tr style="background:#f4f6f4;">
        <th style="padding:8px 16px;font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a827a;text-align:left;">Item</th>
        <th style="padding:8px 16px;font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#8a827a;text-align:right;">Count</th>
      </tr>
      ${rows}
    </table>
    <p style="margin:20px 0 0;font-size:0.82rem;color:#8a827a;">This may signal a growing community need. Consider reaching out to partner orgs or featuring these in your resources. You'll only get this alert once per item — change the threshold anytime in your admin portal.</p>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <a href="https://malamamap.com/malama-portal.html" style="display:inline-block;padding:12px 28px;background:#3a7d5c;color:white;text-decoration:none;border-radius:100px;font-size:0.88rem;font-weight:700;">Open admin portal →</a>
  </td></tr>
</table></td></tr></table>
</body></html>`
    });

    // 5. Mark these items as alerted so we don't re-send
    const updatedAlerted = [...alerted, ...newCrossings.map(i => i.display.toLowerCase())];
    await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
      method: 'POST',
      headers: { ...hdrs, 'Prefer': 'return=minimal,resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'alerted_items', value: updatedAlerted })
    });

    return res.status(200).json({ checked: true, newAlerts: newCrossings.length });
  } catch (err) {
    console.error('check-item-thresholds error:', err);
    return res.status(500).json({ error: err.message });
  }
}
