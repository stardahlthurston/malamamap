import { Resend } from 'resend';

export default async function handler(req, res) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: 'stardahlthurston@gmail.com',
      subject: '🌺 Test — Mālama Map Email Preview',
      html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:24px;margin:0 0 8px;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Hawaiʻi helping Hawaiʻi</p>
          </div>
          <div style="background:white;border-radius:16px;padding:28px 24px;margin-bottom:24px;">
            <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 12px;">Email is working! 🌺</h2>
            <p style="font-size:15px;color:#4a453f;line-height:1.6;margin:0 0 16px;">
              This is a test email from Mālama Map. If you're seeing this, email notifications are set up correctly.
            </p>
            <p style="font-size:15px;color:#4a453f;line-height:1.6;margin:0;">
              Next steps: claim notifications, expiry reminders, and helper alerts will all use this template.
            </p>
          </div>
          <div style="text-align:center;padding:16px;">
            <a href="https://malamamap.org" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 32px;border-radius:100px;font-size:14px;font-weight:700;">Visit Mālama Map</a>
          </div>
          <p style="text-align:center;font-size:12px;color:#8a827a;margin-top:24px;">
            malamamap.org · Built for Hawaiʻi, with aloha
          </p>
        </div>
      `
    });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
