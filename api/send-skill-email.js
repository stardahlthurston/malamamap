module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, from_name, from_email, skill, message } = req.body;
  if (!to || !from_name || !from_email || !skill || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Sanitize inputs to prevent HTML injection in the email
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#3a7d5c;">New Skill Offer from Malama Map</h2>
      <p><strong>${esc(from_name)}</strong> (${esc(from_email)}) wants to help with <strong>${esc(skill)}</strong>.</p>
      <div style="background:#f4f6f4;padding:16px;border-radius:8px;margin:16px 0;">
        <p>${esc(message)}</p>
      </div>
      <p style="font-size:14px;color:#666;">Reply directly to ${esc(from_email)} to connect.</p>
    </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Malama Map <noreply@malamamap.org>',
      to,
      subject: `Skill offer: ${skill} — from ${from_name}`,
      html,
      reply_to: from_email
    })
  });

  if (!response.ok) {
    const err = await response.json();
    return res.status(500).json({ error: err.message || 'Email send failed' });
  }

  return res.status(200).json({ success: true });
};
