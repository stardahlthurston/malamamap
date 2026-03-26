import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();

  const resend = new Resend(process.env.RESEND_API_KEY);

  const emails = [
    'dahlthurstonstar@gmail.com'
  ];

  const results = [];

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: 'Mālama Map <noreply@malamamap.org>',
        to: email,
        subject: 'Action needed — please resubmit your listing claim 🌺',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">

            <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:24px;">
              <h1 style="color:white;font-size:24px;margin:0 0 6px;font-family:Georgia,serif;">Mālama Map</h1>
              <p style="color:rgba(255,255,255,0.65);font-size:12px;margin:0;letter-spacing:0.1em;text-transform:uppercase;">Hawaiʻi helping Hawaiʻi</p>
            </div>

            <div style="background:white;border-radius:14px;padding:28px 24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
              <h2 style="color:#1a3d2b;font-size:20px;margin:0 0 12px;font-family:Georgia,serif;">Aloha!</h2>

              <p style="color:#4a453f;font-size:15px;line-height:1.7;margin:0 0 16px;">We received your request to claim a listing on Mālama Map — mahalo for stepping up to manage your resource listing for our community.</p>

              <p style="color:#4a453f;font-size:15px;line-height:1.7;margin:0 0 16px;">We sincerely apologize — we are fixing bugs in real time as we build this platform during the relief effort, and some information from your original submission did not come through correctly on our end. This was entirely our mistake, not yours.</p>

              <div style="background:#fdf4e3;border-left:4px solid #c9983a;border-radius:0 10px 10px 0;padding:16px 18px;margin-bottom:24px;">
                <p style="font-weight:700;color:#1a1a1a;margin:0 0 6px;font-size:14px;">What we need from you:</p>
                <p style="color:#4a453f;font-size:14px;line-height:1.6;margin:0;">Please resubmit your claim request with your organization name, Instagram handle or website, and how you are connected to the listing. This helps us verify and transfer it to you quickly.</p>
              </div>

              <p style="color:#4a453f;font-size:15px;line-height:1.7;margin:0 0 20px;">If you already created a Mālama Map account, please log in — no need to create a new one. Your portal is waiting for you. Find the listing you want to claim and tap the claim button to resubmit.</p>

              <div style="text-align:center;margin-bottom:16px;">
                <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:14px 36px;border-radius:100px;font-weight:700;font-size:15px;">Go to my portal</a>
              </div>

              <div style="text-align:center;">
                <a href="https://malamamap.org/malama-need-help.html" style="display:inline-block;background:white;color:#3a7d5c;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;border:1.5px solid #3a7d5c;">Find my listing to claim</a>
              </div>
            </div>

            <div style="background:white;border-radius:14px;padding:20px 24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
              <p style="color:#4a453f;font-size:14px;line-height:1.7;margin:0 0 8px;">Questions? Reply to this email or reach out directly:</p>
              <p style="color:#3a7d5c;font-weight:700;font-size:14px;margin:0;">Instagram: <a href="https://instagram.com/stardahlthurston" style="color:#3a7d5c;">@stardahlthurston</a></p>
            </div>

            <p style="color:#8a827a;font-size:12px;text-align:center;margin:0 0 4px;">Mālama Map · malamamap.org</p>
            <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Hawaiʻi helping Hawaiʻi</p>
          </div>
        `
      });
      results.push({ email, success: true });
    } catch(err) {
      results.push({ email, success: false, error: err.message });
    }
  }

  res.status(200).json({ results });
}
