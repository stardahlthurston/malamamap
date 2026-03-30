// Notify a listing owner that an admin made an update to their listing
import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const ADMIN_IDS = [
  '04e3776b-b75f-4701-888e-511a9cf21382', // Star
  'af107d04-0543-40ac-8808-765e25e6ce13', // Braedyn
];

const CATEGORY_LABELS = {
  hours:    'Hours / Schedule update',
  items:    'Items or needs updated',
  type:     'Listing type changed',
  contact:  'Contact info updated',
  notes:    'Notes / description edited',
  hub_badge:'Fully Stocked Hub badge added',
  custom:   'Update from the Mālama Map team',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!SUPABASE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });

  const { listingId, category, summary, authUserId } = req.body;
  if (!ADMIN_IDS.includes(authUserId)) return res.status(403).json({ error: 'Not authorized' });
  if (!listingId || !category) return res.status(400).json({ error: 'listingId and category required' });

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Fetch listing to get user_id and name
  const listingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}&select=id,name,user_id`,
    { headers }
  );
  if (!listingRes.ok) return res.status(500).json({ error: 'Failed to fetch listing' });
  const [listing] = await listingRes.json();
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // 2. Look up owner email from Supabase Auth (requires service key)
  const userRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users/${listing.user_id}`,
    { headers }
  );
  if (!userRes.ok) return res.status(500).json({ error: 'Failed to fetch owner info' });
  const user = await userRes.json();
  const ownerEmail = user?.email;
  if (!ownerEmail) return res.status(400).json({ error: 'No email on file for this listing owner' });

  // 3. Build the report page URL (no login required)
  const reportUrl = `https://www.malamamap.org/malama-report-update.html`
    + `?listing_id=${encodeURIComponent(listingId)}`
    + `&listing_name=${encodeURIComponent(listing.name || 'your listing')}`
    + `&category=${encodeURIComponent(category)}`
    + `&category_label=${encodeURIComponent(CATEGORY_LABELS[category] || category)}`;

  const listingUrl = `https://www.malamamap.org/malama-listing.html?id=${listingId}`;
  const categoryLabel = CATEGORY_LABELS[category] || category;

  // 4. Send email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'Mālama Map <noreply@malamamap.org>',
    to: ownerEmail,
    subject: `Your listing was updated — ${listing.name || 'Mālama Map'}`,
    html: `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 20px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:20px;">
    <h1 style="color:white;font-size:22px;margin:0 0 6px;font-family:Georgia,serif;">Mālama Map</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:0;letter-spacing:0.12em;text-transform:uppercase;">Listing Update</p>
  </div>

  <!-- Main card -->
  <div style="background:white;border-radius:16px;padding:28px 24px;margin-bottom:16px;border:1px solid rgba(0,0,0,0.06);">
    <h2 style="font-size:17px;color:#1a1a1a;margin:0 0 6px;">Your listing was updated</h2>
    <p style="font-size:14px;color:#6b7a6b;margin:0 0 22px;line-height:1.55;">The Mālama Map team made a change to <strong style="color:#1a1a1a;">${listing.name || 'your listing'}</strong>.</p>

    <!-- Category badge -->
    <div style="background:#edf7f1;border-left:4px solid #3a7d5c;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:${summary ? '14px' : '22px'};">
      <p style="font-size:11px;font-weight:700;color:#3a7d5c;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 5px;">What changed</p>
      <p style="font-size:15px;font-weight:700;color:#1a3d2b;margin:0;">${categoryLabel}</p>
    </div>

    ${summary ? `
    <!-- Admin summary note -->
    <div style="background:#f8f8f6;border-radius:10px;padding:14px 18px;margin-bottom:22px;">
      <p style="font-size:12px;font-weight:700;color:#8a827a;text-transform:uppercase;letter-spacing:0.07em;margin:0 0 6px;">Note from the team</p>
      <p style="font-size:14px;color:#1a1a1a;line-height:1.65;margin:0;white-space:pre-wrap;">${summary.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
    </div>` : ''}

    <!-- View listing -->
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${listingUrl}" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:13px 32px;border-radius:100px;font-size:14px;font-weight:700;letter-spacing:0.01em;">View your listing →</a>
    </div>

    <!-- Divider -->
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
  return res.status(200).json({ success: true, sentTo: ownerEmail });
}
