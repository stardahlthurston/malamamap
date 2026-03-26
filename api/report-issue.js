import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { first_name, last_name, email, issue_type, description, screenshots } = req.body;

    // Save to Supabase
    let issueId = null;
    if (SUPABASE_KEY) {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/reported_issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          first_name,
          last_name: last_name || '',
          email,
          issue_type,
          description,
          screenshot_count: screenshots ? screenshots.length : 0,
          status: 'active',
          submitted_at: new Date().toISOString()
        })
      });
      if (r.ok) {
        const data = await r.json();
        issueId = data[0]?.id || null;
      }
    }

    // Build screenshot HTML for admin email (inline base64 images)
    let screenshotHtml = '';
    if (screenshots && screenshots.length > 0) {
      screenshotHtml = `
        <div style="margin-top:16px;">
          <p style="font-size:12px;font-weight:700;color:#8a827a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">Screenshots (${screenshots.length})</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${screenshots.map(s => `<img src="${s}" style="width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #eee;" />`).join('')}
          </div>
        </div>`;
    }

    // Email to admin
    await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: 'dahlthurstonstar@gmail.com',
      replyTo: email,
      subject: 'Issue reported: ' + issue_type,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#7a1a1a,#c0392b);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:8px 0 0;letter-spacing:0.08em;">ISSUE REPORTED</p>
          </div>
          <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
            <div style="background:#fdf0ee;border-left:4px solid #c0392b;border-radius:0 10px 10px 0;padding:14px 16px;margin-bottom:20px;">
              <p style="font-weight:700;color:#1a1a1a;margin:0;font-size:15px;">${issue_type}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
              <tr><td style="padding:8px 0;color:#8a827a;width:100px;">Name</td><td style="padding:8px 0;font-weight:700;color:#1a1a1a;">${first_name} ${last_name || ''}</td></tr>
              <tr><td style="padding:8px 0;color:#8a827a;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#c0392b;font-weight:700;">${email}</a></td></tr>
            </table>
            <div style="background:#f8f8f6;border-radius:10px;padding:16px;">
              <p style="font-size:12px;font-weight:700;color:#8a827a;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">Description</p>
              <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;white-space:pre-wrap;">${description}</p>
            </div>
            ${screenshotHtml}
            <div style="margin-top:20px;text-align:center;">
              <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:#c0392b;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">View in Admin Dashboard</a>
            </div>
          </div>
          <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
        </div>
      `
    });

    // Confirmation email to user
    await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: email,
      subject: 'We received your report — Mālama Map',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
          </div>
          <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
            <h2 style="color:#1a3d2b;font-size:18px;margin:0 0 12px;font-family:Georgia,serif;">Mahalo, ${first_name}!</h2>
            <p style="font-size:14px;color:#4a453f;line-height:1.7;margin:0 0 16px;">We received your report about <strong>${issue_type}</strong>. Our team is on it and will get this resolved as soon as possible.</p>
            <div style="background:#f8f8f6;border-radius:10px;padding:14px 16px;">
              <p style="font-size:12px;font-weight:700;color:#8a827a;margin:0 0 6px;text-transform:uppercase;">Your report</p>
              <p style="font-size:13px;color:#1a1a1a;line-height:1.6;margin:0;white-space:pre-wrap;">${description.length > 200 ? description.slice(0, 200) + '…' : description}</p>
            </div>
            <p style="font-size:13px;color:#8a827a;margin:16px 0 0;line-height:1.6;">We'll email you when this issue has been resolved. If you have anything to add, just reply to this email.</p>
          </div>
          <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
        </div>
      `
    });

    res.status(200).json({ success: true, issueId });
  } catch(err) {
    console.error('report-issue error:', err);
    res.status(500).json({ error: err.message });
  }
}
