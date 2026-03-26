import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();

  const resend = new Resend(process.env.RESEND_API_KEY);

  const verificationUrl = 'https://malamamap.org/malama-portal.html';

  const emails = [
    'dahlthurstonstar@gmail.com'
  ];

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);padding:28px 36px;text-align:center;">
              <img src="https://malamamap.org/logo.png" alt="Mālama Map" style="height:40px;width:auto;margin-bottom:8px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;font-family:Georgia,serif;">Mālama Map</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;letter-spacing:0.08em;">Community Relief Resources</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <p style="margin:0 0 16px;font-size:16px;color:#111;">Aloha!</p>
              <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">
                We received your request to claim a listing on Mālama Map — mahalo for stepping up to manage your resource listing for our community.
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.6;">
                We sincerely apologize — we are fixing bugs in real time as we build this platform during the relief effort, and some information from your original submission did not come through correctly on our end. This was entirely our mistake, not yours.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#333;line-height:1.6;">
                We need a bit of additional information to confirm your organization. This takes less than 2 minutes — just click below, log in to your portal, and fill out a short verification form.
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#3a7d5c;border-radius:100px;">
                    <a href="${verificationUrl}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">
                      Verify My Organization
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;">
                We verify all organizations through the Hawaii Business Registry to make sure our community resources stay in trusted hands.
              </p>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
                Mahalo for your patience as we build this platform in real time during the relief effort.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f7f4;padding:20px 36px;">
              <p style="margin:0;font-size:12px;color:#8a827a;text-align:center;">
                — The Mālama Map Team &nbsp;&middot;&nbsp; <a href="https://malamamap.org" style="color:#3a7d5c;text-decoration:none;font-weight:700;">malamamap.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const results = [];

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: 'Mālama Map <noreply@malamamap.org>',
        to: email,
        subject: 'Action needed — please resubmit your listing claim 🌺',
        html: emailHtml
      });
      results.push({ email, success: true });
    } catch(err) {
      results.push({ email, success: false, error: err.message });
    }
  }

  res.status(200).json({ results });
}
