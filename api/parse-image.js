export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { image_base64, media_type } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: media_type || 'image/jpeg', data: image_base64 } }, { type: 'text', text: 'Extract disaster relief listing info from this image and return ONLY JSON with fields: name, type (donation_dropoff/supply_station/shelter/volunteer_event/medical_assistance), address, location, hours, phone, website, items (array), notes, confidence (high/low). If not a relief listing return {"error":"not a relief listing"}' }] }] })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
