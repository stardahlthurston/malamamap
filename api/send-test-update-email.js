// Sends a test version of the listing-update notification email to Star's address
import { Resend } from 'resend';

const CATEGORY_LABELS = {
  hours:    'Hours / Schedule update',
  items:    'Items or needs updated',
  type:     'Listing type changed',
  contact:  'Contact info updated',
  notes:    'Notes / description edited',
  hub_badge:'Fully Stocked Hub badge added',
  custom:   'Update from the Mālama Map team',
};

const LISTING_NAME = 'Kahului Community Hub (TEST)';
const LISTING_ID   = 'preview-only';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { category = 'items', summary = '' } = req.body;
  const categoryLabel = CATEGORY_LABELS[category] || category;

  const reportUrl  = `https://www.malamamap.org/malama-report-update.html?listing_id=${encodeURIComponent(LISTING_ID)}&listing_name=${encodeURIComponent(LISTING_NAME)}&category_label=${encodeURIComponent(categoryLabel)}`;
  const listingUrl = `https://www.malamamap.org/malama-listing.html?id=${LISTING_ID}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'Mālama Map <noreply@malamamap.org>',
    to: 'dahlthurstonstar@gmail.com',
    subject: `[TEST] Your listing was updated — ${LISTING_NAME}`,
    html: `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 20px;">

  <!-- TEST banner -->
  <div style="background:#fff3cd;border:1.5px solid #e6a817;border-radius:10px;padding:10px 16px;margin-bottom:16px;text-align:center;">
    <p style="font-size:12px;font-weight:700;color:#7a5c1a;margin:0;">⚠️ This is a test email — owners will receive this when you update their listing</p>
  </div>

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:20px;">
    <h1 style="color:white;font-size:22px;margin:0 0 6px;font-family:Georgia,serif;">Mālama Map</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:0;letter-spacing:0.12em;text-transform:uppercase;">Listing Update</p>
  </div>

  <!-- Main card -->
  <div style="background:white;border-radius:16px;padding:28px 24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
    <h2 style="font-size:17px;color:#1a1a1a;margin:0 0 6px;">Your listing was updated</h2>
    <p style="font-size:14px;color:#6b7a6b;margin:0 0 22px;line-height:1.55;">The Mālama Map team made a change to <strong style="color:#1a1a1a;">${LISTING_NAME}</strong>.</p>

    <!-- Category badge -->
    <div style="background:#edf7f1;border-left:4px solid #3a7d5c;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:${summary ? '14px' : '22px'};">
      <p style="font-size:11px;font-weight:700;color:#3a7d5c;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 5px;">What changed</p>
      <p style="font-size:15px;font-weight:700;color:#1a3d2b;margin:0;">${categoryLabel}</p>
    </div>

    ${summary ? `
    <div style="background:#f8f8f6;border-radius:10px;padding:14px 18px;margin-bottom:22px;">
      <p style="font-size:12px;font-weight:700;color:#8a827a;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 6px;">Note from the team</p>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.65;margin:0;">${summary.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
    </div>` : ''}

    <!-- View listing CTA -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${listingUrl}" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:13px 32px;border-radius:100px;font-size:14px;font-weight:700;">View your listing →</a>
    </div>

    <div style="border-top:1px solid #efefed;margin-bottom:22px;"></div>

    <!-- Report section -->
    <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">Something look wrong?</p>
    <p style="font-size:13px;color:#6b7a6b;line-height:1.6;margin:0 0 16px;">If this change is incorrect or you'd like it reversed, let us know and we'll fix it right away.</p>
    <div style="text-align:center;">
      <a href="${reportUrl}" style="display:inline-block;background:white;color:#1a3d2b;text-decoration:none;padding:11px 26px;border-radius:100px;font-size:13px;font-weight:700;border:1.5px solid #3a7d5c;">Report an issue with this update →</a>
    </div>
  </div>

  <p style="color:#aaa;font-size:11px;text-align:center;margin:0;line-height:1.6;">Mālama Map · malamamap.org<br>You're receiving this because you manage a listing on our platform.</p>
</div>
    `
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
