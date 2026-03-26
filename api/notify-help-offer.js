import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const {
      need_type, need_area, need_urgency, need_note,
      poster_name, poster_phone,
      helper_name, helper_contact, helper_message
    } = req.body;

    const urgencyLabel = need_urgency === 'urgent' ? '🔴 Urgent'
      : need_urgency === 'this_week' ? '🟡 This week'
      : 'When possible';

    await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: 'dahlthurstonstar@gmail.com',
      subject: `Someone wants to help: ${need_type || 'Community need'} in ${need_area || 'Hawaiʻi'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:22px;margin:0;font-family:Georgia,serif;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:8px 0 0;letter-spacing:0.08em;">HELP OFFER RECEIVED</p>
          </div>

          <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
            <p style="font-size:12px;font-weight:700;color:#8a827a;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">The Need</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
              <tr><td style="padding:6px 0;color:#8a827a;width:90px;">Type</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${need_type || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#8a827a;">Area</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${need_area || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#8a827a;">Urgency</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${urgencyLabel}</td></tr>
              ${need_note ? `<tr><td style="padding:6px 0;color:#8a827a;vertical-align:top;">Note</td><td style="padding:6px 0;color:#4a453f;line-height:1.5;">"${need_note}"</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#8a827a;">Posted by</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${poster_name || 'Anonymous'}</td></tr>
              ${poster_phone ? `<tr><td style="padding:6px 0;color:#8a827a;">Phone</td><td style="padding:6px 0;"><a href="tel:${poster_phone}" style="color:#3a7d5c;font-weight:700;">${poster_phone}</a></td></tr>` : ''}
            </table>

            <div style="height:1px;background:#eee;margin:16px 0;"></div>

            <p style="font-size:12px;font-weight:700;color:#3a7d5c;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">The Helper</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#8a827a;width:90px;">Name</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${helper_name}</td></tr>
              <tr><td style="padding:6px 0;color:#8a827a;">Contact</td><td style="padding:6px 0;font-weight:700;color:#1a1a1a;">${helper_contact}</td></tr>
              ${helper_message ? `<tr><td style="padding:6px 0;color:#8a827a;vertical-align:top;">Message</td><td style="padding:6px 0;color:#4a453f;line-height:1.5;">"${helper_message}"</td></tr>` : ''}
            </table>
          </div>

          <div style="text-align:center;margin-bottom:24px;">
            <p style="font-size:13px;color:#8a827a;margin:0 0 12px;">Connect them — reach out to both parties to facilitate.</p>
            ${poster_phone ? `<a href="tel:${poster_phone}" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;margin-right:8px;">Call ${poster_name || 'Poster'}</a>` : ''}
            <a href="${helper_contact.includes('@') ? 'mailto:' + helper_contact : 'tel:' + helper_contact}" style="display:inline-block;background:#275c42;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">Contact ${helper_name}</a>
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
