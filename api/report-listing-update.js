// Report submitted by a listing owner disputing an admin update
import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { listing_id, listing_name, category_label, message, request_no_edit } = req.body;
  if (!listing_id || !message?.trim()) {
    return res.status(400).json({ error: 'listing_id and message are required' });
  }

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const noEditFlag = request_no_edit ? '\n\n⚠️ OWNER REQUESTS: Please do not make further admin edits to this listing.' : '';
  const description = `[Update disputed: ${category_label || 'Admin update'}]\n\n${message.trim()}${noEditFlag}`;
  const issue_type  = `Admin edit dispute — ${listing_name || listing_id}`;

  // 1. Save to reported_issues table
  let issueId = null;
  if (SUPABASE_KEY) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/reported_issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          first_name:  'Listing owner',
          last_name:   '',
          email:       '(sent from listing update email)',
          issue_type,
          description,
          screenshot_count: 0,
          status:      'active',
          submitted_at: new Date().toISOString(),
        })
      });
      if (r.ok) {
        const data = await r.json();
        issueId = data[0]?.id || null;
      }
    } catch(e) { /* non-fatal */ }

    // 2. If owner requested no more admin edits, flag the listing
    //    (Requires: ALTER TABLE listings ADD COLUMN IF NOT EXISTS no_admin_edit boolean DEFAULT false)
    if (request_no_edit) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listing_id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ no_admin_edit: true })
        });
      } catch(e) { /* column may not exist yet — non-fatal */ }
    }
  }

  // 3. Email Star
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: 'Mālama Map <noreply@malamamap.org>',
        to: 'dahlthurstonstar@gmail.com',
        subject: `⚠️ Listing update disputed — ${listing_name || listing_id}`,
        html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 20px;">
  <div style="background:linear-gradient(135deg,#7a1a1a,#c0392b);border-radius:16px;padding:24px;text-align:center;margin-bottom:20px;">
    <h1 style="color:white;font-size:21px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
    <p style="color:rgba(255,255,255,0.65);font-size:12px;margin:8px 0 0;letter-spacing:0.09em;">LISTING UPDATE DISPUTED</p>
  </div>
  <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
    <div style="background:#fdf0ee;border-left:4px solid #c0392b;border-radius:0 10px 10px 0;padding:14px 16px;margin-bottom:18px;">
      <p style="font-weight:700;color:#1a1a1a;margin:0;">${listing_name || listing_id}</p>
      <p style="font-size:12px;color:#c0392b;margin:4px 0 0;">${category_label || 'Admin update'}</p>
    </div>
    ${request_no_edit ? `
    <div style="background:#fff8e6;border:1.5px solid #e6a817;border-radius:10px;padding:12px 16px;margin-bottom:18px;">
      <p style="font-weight:700;color:#8a5a00;font-size:13px;margin:0;">⚠️ Owner requests no further admin edits to this listing</p>
    </div>` : ''}
    <div style="background:#f8f8f6;border-radius:10px;padding:16px;margin-bottom:20px;">
      <p style="font-size:12px;font-weight:700;color:#8a827a;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Owner's message</p>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:#c0392b;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">View in Admin Dashboard →</a>
    </div>
  </div>
  <p style="color:#aaa;font-size:11px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
</div>
        `
      });
    } catch(e) { /* non-fatal */ }
  }

  return res.status(200).json({ success: true, issueId });
}
