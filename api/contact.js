import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { first_name, last_name, email, message } = req.body;

    await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: 'dahlthurstonstar@gmail.com',
      replyTo: email,
      subject: 'New inquiry from ' + first_name + (last_name ? ' ' + last_name : ''),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:8px 0 0;letter-spacing:0.08em;">NEW INQUIRY</p>
          </div>
          <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
              <tr><td style="padding:8px 0;color:#8a827a;width:100px;">Name</td><td style="padding:8px 0;font-weight:700;color:#1a1a1a;">${first_name} ${last_name || ''}</td></tr>
              <tr><td style="padding:8px 0;color:#8a827a;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#3a7d5c;font-weight:700;">${email}</a></td></tr>
            </table>
            <div style="background:#f8f8f6;border-radius:10px;padding:16px;margin-bottom:16px;">
              <p style="font-size:12px;font-weight:700;color:#8a827a;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.06em;">Message</p>
              <p style="font-size:14px;color:#1a1a1a;line-height:1.7;margin:0;white-space:pre-wrap;">${message}</p>
            </div>
            <div style="text-align:center;">
              <a href="mailto:${email}" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">Reply to ${first_name}</a>
            </div>
          </div>
          <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
        </div>
      `
    });

    res.status(200).json({ success: true });
  } catch(err) {
    console.error('contact email error:', err);
    res.status(500).json({ error: err.message });
  }
}
