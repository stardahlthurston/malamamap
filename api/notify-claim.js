import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { listing_name, requester_first, requester_last, requester_email, requester_phone, requester_role } = req.body;

    await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: 'dahlthurstonstar@gmail.com',
      subject: 'New claim request — ' + listing_name,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:8px 0 0;letter-spacing:0.08em;">NEW CLAIM REQUEST</p>
          </div>
          <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
            <h2 style="color:#1a3d2b;font-size:18px;margin:0 0 16px;font-family:Georgia,serif;">Someone wants to claim a listing</h2>
            <div style="background:#edf7f1;border-left:4px solid #3a7d5c;border-radius:0 10px 10px 0;padding:14px 16px;margin-bottom:20px;">
              <p style="font-weight:700;color:#1a1a1a;margin:0;font-size:15px;">${listing_name}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#8a827a;width:120px;">Name</td><td style="padding:8px 0;font-weight:700;color:#1a1a1a;">${requester_first} ${requester_last || ''}</td></tr>
              <tr><td style="padding:8px 0;color:#8a827a;">Email</td><td style="padding:8px 0;"><a href="mailto:${requester_email}" style="color:#3a7d5c;font-weight:700;">${requester_email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#8a827a;">Phone</td><td style="padding:8px 0;"><a href="tel:${requester_phone}" style="color:#3a7d5c;font-weight:700;">${requester_phone}</a></td></tr>
              <tr><td style="padding:8px 0;color:#8a827a;">Role</td><td style="padding:8px 0;color:#1a1a1a;">${requester_role || '—'}</td></tr>
            </table>
            <div style="margin-top:20px;text-align:center;">
              <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">Review in Admin Dashboard</a>
            </div>
          </div>
          <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
        </div>
      `
    });

    res.status(200).json({ success: true });
  } catch(err) {
    console.error('notify-claim error:', err);
    res.status(500).json({ error: err.message });
  }
}
