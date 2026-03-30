import { Resend } from 'resend';

const RESEND_KEY = process.env.RESEND_API_KEY;
const STAR_EMAIL = 'dahlthurstonstar@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { name, category, email, legalName, regType, ein, docsUrl, link, summary } = req.body;

  try {
    const resend = new Resend(RESEND_KEY);
    await resend.emails.send({
      from: 'Mālama Map <no-reply@malamamap.com>',
      to: STAR_EMAIL,
      subject: `💰 New Give Financially application — ${name}`,
      html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#7a4f00 0%,#b07a00 60%,#c9983a 100%);padding:24px 32px;">
    <p style="margin:0;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Mālama Map — Give Financially</p>
    <h1 style="margin:6px 0 0;font-size:1.3rem;font-weight:800;color:white;">💰 New org application</h1>
  </td></tr>
  <tr><td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e8e4df;border-radius:10px;overflow:hidden;">
      ${[
        ['Organization', name],
        ['Category', category],
        ['Contact email', email],
        ['Legal name', legalName],
        ['Registration type', regType],
        ein ? ['EIN', ein] : null,
        docsUrl ? ['Docs link', `<a href="${docsUrl}" style="color:#c9983a;">${docsUrl}</a>`] : null,
        ['Donation link', `<a href="${link}" style="color:#c9983a;">${link}</a>`],
        ['Summary', summary],
      ].filter(Boolean).map(([label, val], i) => `
        <tr style="background:${i % 2 === 0 ? '#fafafa' : 'white'};">
          <td style="padding:9px 14px;font-size:0.75rem;font-weight:700;color:#8a827a;width:140px;border-bottom:1px solid #f0ece8;">${label}</td>
          <td style="padding:9px 14px;font-size:0.84rem;color:#1c1a18;border-bottom:1px solid #f0ece8;">${val}</td>
        </tr>`).join('')}
    </table>
    <p style="margin:18px 0 0;font-size:0.82rem;color:#8a827a;line-height:1.5;">Review this application in your admin portal. Once approved, activate the listing and flip the Verified badge.</p>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <a href="https://malamamap.com/malama-portal.html" style="display:inline-block;padding:11px 24px;background:#c9983a;color:white;text-decoration:none;border-radius:100px;font-size:0.85rem;font-weight:700;">Open admin portal →</a>
  </td></tr>
</table></td></tr></table>
</body></html>`
    });
    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('notify-new-financial-listing error:', err);
    return res.status(500).json({ error: err.message });
  }
}
