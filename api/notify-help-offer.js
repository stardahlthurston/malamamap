import { Resend } from 'resend';

const ADMIN_EMAIL = 'dahlthurstonstar@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const {
      need_type, need_area, need_urgency, need_note,
      poster_name, poster_contact_preference, poster_email,
      helper_name, helper_contact, helper_message
    } = req.body;

    const urgencyLabel = need_urgency === 'urgent' ? '🔴 Urgent'
      : need_urgency === 'this_week' ? '🟡 This week'
      : 'When possible';

    const sendDirectToPostr = poster_contact_preference === 'email' && poster_email;

    if (sendDirectToPostr) {
      // EMAIL TO POSTER — tell them someone wants to help, share helper's info
      await resend.emails.send({
        from: 'Mālama Map <noreply@malamamap.org>',
        to: poster_email,
        replyTo: helper_contact,
        subject: `Someone wants to help with your ${need_type || 'community need'} request`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
            <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
              <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
              <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:8px 0 0;letter-spacing:0.08em;">SOMEONE WANTS TO HELP</p>
            </div>

            <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
              <p style="font-size:15px;color:#1a1a1a;line-height:1.6;margin:0 0 16px;">Aloha ${poster_name || 'friend'},</p>
              <p style="font-size:14px;color:#4a453f;line-height:1.6;margin:0 0 20px;">Good news — someone saw your request for <strong>${need_type || 'help'}</strong> in <strong>${need_area || 'your area'}</strong> and wants to help. Here's their info:</p>

              <div style="background:#f8f8f6;border-radius:10px;padding:16px;margin-bottom:16px;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:6px 0;color:#8a827a;width:80px;">Name</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${helper_name}</td></tr>
                  <tr><td style="padding:6px 0;color:#8a827a;">Email</td><td style="padding:6px 0;"><a href="mailto:${helper_contact}" style="color:#3a7d5c;font-weight:700;">${helper_contact}</a></td></tr>
                  ${helper_message ? `<tr><td style="padding:6px 0;color:#8a827a;vertical-align:top;">Message</td><td style="padding:6px 0;color:#4a453f;line-height:1.5;">"${helper_message}"</td></tr>` : ''}
                </table>
              </div>

              <p style="font-size:13px;color:#8a827a;line-height:1.6;margin:0 0 16px;">If you'd like to connect, reach out to them directly. You're always in control of who you respond to.</p>

              <div style="text-align:center;">
                <a href="mailto:${helper_contact}" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">Reply to ${helper_name}</a>
              </div>
            </div>

            <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
          </div>
        `
      });
    }

    // ALWAYS send a copy to admin for record-keeping
    await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: ADMIN_EMAIL,
      subject: `${sendDirectToPostr ? '[Auto-sent] ' : '[Relay needed] '}Help offer: ${need_type || 'Community need'} in ${need_area || 'Hawaiʻi'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:8px 0 0;letter-spacing:0.08em;">${sendDirectToPostr ? 'HELP OFFER — AUTO-SENT TO POSTER' : 'HELP OFFER — RELAY NEEDED'}</p>
          </div>

          ${!sendDirectToPostr ? `
          <div style="background:#fff3e0;border:1.5px solid #ffb74d;border-radius:10px;padding:12px 16px;margin-bottom:16px;">
            <p style="font-size:13px;font-weight:700;color:#e65100;margin:0;">Action needed: This poster chose to stay anonymous. Please relay the helper's info manually.</p>
          </div>` : ''}

          <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
            <p style="font-size:12px;font-weight:700;color:#8a827a;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">The Need</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
              <tr><td style="padding:6px 0;color:#8a827a;width:90px;">Type</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${need_type || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#8a827a;">Area</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${need_area || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#8a827a;">Urgency</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${urgencyLabel}</td></tr>
              ${need_note ? `<tr><td style="padding:6px 0;color:#8a827a;vertical-align:top;">Note</td><td style="padding:6px 0;color:#4a453f;line-height:1.5;">"${need_note}"</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#8a827a;">Posted by</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${poster_name || 'Anonymous'}</td></tr>
              <tr><td style="padding:6px 0;color:#8a827a;">Preference</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${sendDirectToPostr ? '📧 Email (' + poster_email + ')' : '🔒 Anonymous'}</td></tr>
            </table>

            <div style="height:1px;background:#eee;margin:16px 0;"></div>

            <p style="font-size:12px;font-weight:700;color:#3a7d5c;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">The Helper</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#8a827a;width:90px;">Name</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${helper_name}</td></tr>
              <tr><td style="padding:6px 0;color:#8a827a;">Email</td><td style="padding:6px 0;"><a href="mailto:${helper_contact}" style="color:#3a7d5c;font-weight:700;">${helper_contact}</a></td></tr>
              ${helper_message ? `<tr><td style="padding:6px 0;color:#8a827a;vertical-align:top;">Message</td><td style="padding:6px 0;color:#4a453f;line-height:1.5;">"${helper_message}"</td></tr>` : ''}
            </table>
          </div>

          <div style="text-align:center;margin-bottom:24px;">
            <a href="mailto:${helper_contact}" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">Contact ${helper_name}</a>
          </div>

          <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Mālama Map · malamamap.org</p>
        </div>
      `
    });

    res.status(200).json({ success: true });
  } catch(err) {
    console.error('help offer email error:', err);
    res.status(500).json({ error: err.message });
  }
}
