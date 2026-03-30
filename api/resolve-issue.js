import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ID = '04e3776b-b75f-4701-888e-511a9cf21382';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { issueId, authUserId } = req.body;
  if (authUserId !== ADMIN_ID) return res.status(403).json({ error: 'Not authorized' });
  if (!SUPABASE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // Get the issue details
    const getRes = await fetch(`${SUPABASE_URL}/rest/v1/reported_issues?id=eq.${issueId}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const issues = await getRes.json();
    const issue = issues[0];
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Mark as resolved
    await fetch(`${SUPABASE_URL}/rest/v1/reported_issues?id=eq.${issueId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'resolved', resolved_at: new Date().toISOString() })
    });

    // Send resolution email to the reporter
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: issue.email,
      subject: 'Your issue has been resolved — Mālama Map',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
          </div>
          <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
            <div style="text-align:center;margin-bottom:16px;">
              <div style="width:52px;height:52px;background:#edf7f1;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M6 13l5 5 9-10" stroke="#3a7d5c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </div>
            <h2 style="color:#1a3d2b;font-size:18px;margin:0 0 12px;font-family:Georgia,serif;text-align:center;">Issue resolved!</h2>
            <p style="font-size:14px;color:#4a453f;line-height:1.7;margin:0 0 16px;text-align:center;">Hi ${issue.first_name}, our team has fixed the issue you reported. Thank you for letting us know — it helps us make Mālama Map better for everyone.</p>
            <div style="background:#f8f8f6;border-radius:10px;padding:14px 16px;">
              <p style="font-size:12px;font-weight:700;color:#8a827a;margin:0 0 6px;text-transform:uppercase;">Your original report</p>
              <p style="font-size:13px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${issue.issue_type}</p>
              <p style="font-size:13px;color:#8a827a;line-height:1.5;margin:0;">${issue.description.length > 150 ? issue.description.slice(0, 150) + '…' : issue.description}</p>
            </div>
            <p style="font-size:13px;color:#8a827a;margin:16px 0 0;line-height:1.6;text-align:center;">If you're still experiencing issues, reply to this email or <a href="https://malamamap.org/malama-report.html" style="color:#3a7d5c;font-weight:700;">submit a new report</a>.</p>
          </div>
          <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
        </div>
      `
    });

    res.status(200).json({ success: true });
  } catch(err) {
    console.error('resolve-issue error:', err);
    res.status(500).json({ error: err.message });
  }
}
