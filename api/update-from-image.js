// Serverless function — proxies image to Anthropic and returns extracted listing fields.
// ANTHROPIC_API_KEY stays server-side and is never sent to the browser.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { image_base64, media_type } = req.body || {};
  if (!image_base64) return res.status(400).json({ error: 'No image data' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: media_type || 'image/jpeg',
                data: image_base64
              }
            },
            {
              type: 'text',
              text: 'This is a screenshot from social media about a disaster relief hub. Please extract any updated hours, any list of items they need or are giving out, and any important notes. Return only a JSON object with keys: hours, items, notes. No explanation, no markdown, just the raw JSON.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message || 'Anthropic API error' });

    const rawText = (data.content?.[0]?.text || '').trim();

    try {
      const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(clean);
      return res.status(200).json({ parsed, raw: rawText });
    } catch (_) {
      // Parsing failed — return raw text so nothing is lost
      return res.status(200).json({ parsed: null, raw: rawText });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
