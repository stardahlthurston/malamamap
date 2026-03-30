import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGxtcW1xbG5mdGxweXJxbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDgyMDIsImV4cCI6MjA4OTc4NDIwMn0.r5GLgPk-xywtkQdrmTAFcKZny1-Wrh8b5YezAHmU9yU';

export default async function handler(req, res) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Accept listing_id via query or body, or send a test
  const listingId = req.query?.listing_id || req.body?.listing_id;
  let listing = null;

  if (listingId) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${listingId}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    });
    const rows = await r.json();
    listing = rows?.[0];
  }

  // Fallback to test data if no listing found
  const name = listing?.name || 'Kailua Community Church';
  const location = listing?.location || 'Kailua';
  const address = listing?.address || '123 Example St, Kailua, HI';
  const type = listing?.type || 'supply_station';
  const email = listing?.contact_email || req.query?.to || 'dahlthurstonstar@gmail.com';
  const expiresAt = listing?.expires_at ? new Date(listing.expires_at) : new Date(Date.now() + 72*60*60*1000);
  const expiresStr = expiresAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const typeLabels = {
    shelter: 'Shelter', supply_station: 'Supply Station',
    donation_dropoff: 'Donation Drop-off', volunteer_event: 'Volunteers Needed',
    skills_labor: 'Skills & Labor', medical_assistance: 'Medical Aid'
  };

  try {
    const { data, error } = await resend.emails.send({
      from: 'Mālama Map <noreply@malamamap.org>',
      to: email,
      subject: '✅ Your listing is live — ' + name,
      html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
          <div style="background:linear-gradient(135deg,#1a3d2b,#3a7d5c);border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:24px;">
            <h1 style="color:white;font-size:24px;margin:0 0 8px;">Mālama Map</h1>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Hawaiʻi helping Hawaiʻi</p>
          </div>
          <div style="background:white;border-radius:16px;padding:28px 24px;margin-bottom:16px;">
            <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 8px;">Your listing is live!</h2>
            <p style="font-size:15px;color:#4a453f;line-height:1.6;margin:0 0 20px;">Mahalo for showing up for your community. Your listing is now visible on the map and people nearby can find it.</p>
            <div style="background:#edf7f1;border:1.5px solid rgba(58,125,92,0.15);border-radius:12px;padding:20px;margin-bottom:20px;">
              <p style="font-weight:800;color:#1a1a1a;font-size:16px;margin:0 0 6px;">${name}</p>
              <p style="color:#4a453f;font-size:13px;margin:0 0 4px;">📍 ${location}${address ? ' · ' + address : ''}</p>
              <p style="color:#4a453f;font-size:13px;margin:0 0 4px;">🏷️ ${typeLabels[type] || type}</p>
              <p style="color:#8a827a;font-size:12px;margin:0;">⏰ Expires ${expiresStr}</p>
            </div>
            <p style="font-size:14px;color:#4a453f;line-height:1.6;margin:0 0 8px;"><strong>What to know:</strong></p>
            <ul style="font-size:14px;color:#4a453f;line-height:1.8;margin:0 0 20px;padding-left:18px;">
              <li>Your listing auto-expires in <strong>72 hours</strong> — we'll email you before it does</li>
              <li>You can extend, edit, or close it anytime from your portal</li>
              <li>Toggle your listing <strong>Open / Closed</strong> so people know before they drive</li>
            </ul>
            <div style="text-align:center;">
              <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:14px;font-weight:700;">Manage your listing</a>
            </div>
          </div>
          <p style="text-align:center;font-size:12px;color:#8a827a;margin:0;">
            malamamap.org · Built for Hawaiʻi, with aloha
          </p>
        </div>
      `
    });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ success: true, id: data?.id, sent_to: email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
