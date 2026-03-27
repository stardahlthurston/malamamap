import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  // Generate a password reset link via Supabase admin API
  const genRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'recovery',
      email,
      options: { redirect_to: 'https://www.malamamap.org/malama-reset.html' }
    })
  });

  const genData = await genRes.json();
  if (!genRes.ok) {
    // User not found — still show success to avoid email enumeration
    return res.status(200).json({ success: true });
  }

  const resetLink = genData.action_link;
  if (!resetLink) return res.status(500).json({ error: 'No reset link generated' });

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: email,
      subject: 'Reset your Mālama Map password',
      html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:24px;margin:0 0 8px;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;letter-spacing:0.08em;text-transform:uppercase;">Password Reset</p>
          </div>
          <div style="background:white;border-radius:16px;padding:28px 24px;margin-bottom:16px;">
            <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 12px;">Reset your password</h2>
            <p style="font-size:15px;color:#4a453f;line-height:1.6;margin:0 0 24px;">We received a request to reset your password. Click the button below to choose a new one.</p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${resetLink}" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:700;">Reset Password →</a>
            </div>
            <p style="font-size:13px;color:#8a827a;line-height:1.6;margin:0;text-align:center;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <p style="text-align:center;font-size:12px;color:#8a827a;margin:0;">Mālama Map · malamamap.org</p>
        </div>
      `
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
