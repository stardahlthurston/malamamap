import { Resend } from 'resend';

const SUPABASE_URL = 'https://wvplmqmqlnftlpyrqnle.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cGxtcW1xbG5mdGxweXJxbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDgyMDIsImV4cCI6MjA4OTc4NDIwMn0.r5GLgPk-xywtkQdrmTAFcKZny1-Wrh8b5YezAHmU9yU';

async function sbFetch(path, options = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date();
  const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const ago48hrs = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const ago46hrs = new Date(now.getTime() - 46 * 60 * 60 * 1000).toISOString();
  const results = { expiring: [], checkins: [], errors: [] };

  try {
    // 1. EXPIRY WARNINGS — listings expiring in next 24 hours
    const expiring = await sbFetch(
      'listings?select=id,name,address,location,expires_at,contact_email,contact_phone&status=eq.true&expires_at=gte.' + now.toISOString() + '&expires_at=lte.' + in24hrs
    );

    for (const listing of (expiring || [])) {
      if (!listing.contact_email) continue;
      try {
        await resend.emails.send({
          from: 'Mālama Map <noreply@malamamap.org>',
          to: listing.contact_email,
          subject: '⏰ Your listing expires soon — ' + listing.name,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
              <div style="background:#1a3d2b;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <h1 style="color:white;font-size:22px;margin:0;">Mālama Map</h1>
                <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:8px 0 0;">Hawaiʻi helping Hawaiʻi</p>
              </div>
              <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;">
                <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 8px;">Your listing expires in less than 24 hours</h2>
                <p style="color:#8a827a;font-size:14px;margin:0 0 20px;">People in your community are counting on this information being current.</p>
                <div style="background:#fdf4e3;border-radius:10px;padding:16px;margin-bottom:20px;">
                  <p style="font-weight:700;color:#1a1a1a;margin:0 0 4px;">${listing.name}</p>
                  <p style="color:#8a827a;font-size:13px;margin:0;">${listing.location || ''} ${listing.address ? '· ' + listing.address : ''}</p>
                </div>
                <p style="color:#1a1a1a;font-size:14px;margin:0 0 20px;">Is this listing still active? Log in to extend it by 7 days — it takes one tap.</p>
                <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;">Extend my listing</a>
              </div>
              <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">If this listing is no longer active, no action needed — it will close automatically.</p>
            </div>
          `
        });
        results.expiring.push(listing.id);
      } catch(e) {
        results.errors.push({ id: listing.id, error: e.message });
      }
    }

    // 2. 48HR CHECK-IN — listings created ~48 hours ago still active
    const checkins = await sbFetch(
      'listings?select=id,name,address,location,contact_email,created_at&status=eq.true&created_at=gte.' + ago48hrs + '&created_at=lte.' + ago46hrs
    );

    for (const listing of (checkins || [])) {
      if (!listing.contact_email) continue;
      try {
        await resend.emails.send({
          from: 'Mālama Map <noreply@malamamap.org>',
          to: listing.contact_email,
          subject: '🌺 Still open? Quick check-in — ' + listing.name,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f4f6f4;padding:32px 24px;">
              <div style="background:#1a3d2b;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <h1 style="color:white;font-size:22px;margin:0;">Mālama Map</h1>
                <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:8px 0 0;">Hawaiʻi helping Hawaiʻi</p>
              </div>
              <div style="background:white;border-radius:14px;padding:24px;margin-bottom:16px;">
                <h2 style="color:#1a1a1a;font-size:18px;margin:0 0 8px;">Mahalo for being on the map</h2>
                <p style="color:#8a827a;font-size:14px;margin:0 0 20px;">It's been 48 hours since you added your listing. Just checking in — is everything still current?</p>
                <div style="background:#edf7f1;border-radius:10px;padding:16px;margin-bottom:20px;">
                  <p style="font-weight:700;color:#1a1a1a;margin:0 0 4px;">${listing.name}</p>
                  <p style="color:#8a827a;font-size:13px;margin:0;">${listing.location || ''} ${listing.address ? '· ' + listing.address : ''}</p>
                </div>
                <div>
                  <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:#3a7d5c;color:white;text-decoration:none;padding:12px 20px;border-radius:100px;font-weight:700;font-size:14px;text-align:center;margin-right:8px;">Yes, still open</a>
                  <a href="https://malamamap.org/malama-portal.html" style="display:inline-block;background:white;color:#c0392b;text-decoration:none;padding:12px 20px;border-radius:100px;font-weight:700;font-size:14px;text-align:center;border:1.5px solid #c0392b;">Close listing</a>
                </div>
              </div>
              <p style="color:#8a827a;font-size:12px;text-align:center;margin:0;">Keeping listings current helps people in need find accurate info. Mahalo.</p>
            </div>
          `
        });
        results.checkins.push(listing.id);
      } catch(e) {
        results.errors.push({ id: listing.id, error: e.message });
      }
    }

    return res.status(200).json({
      success: true,
      expiring_notified: results.expiring.length,
      checkins_sent: results.checkins.length,
      errors: results.errors
    });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
