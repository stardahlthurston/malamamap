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
        max_tokens: 2048,
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
              text: `This is a screenshot from social media about a disaster relief or donation hub in Hawaii.

Extract the following and return ONLY a raw JSON object — no markdown, no explanation:

{
  "hours": "operating hours or date/time info as a single string, e.g. 'Open daily 8am–5pm' or 'As of 3/25 6am'. Empty string if not found.",
  "location": "drop-off address or location name if visible. Empty string if not found.",
  "items": ["flat array of strings — every individual item mentioned, one per entry, no categories, no bullets. Include ALL items from ALL categories."],
  "notes": "any important notes such as restrictions, warnings, or extra instructions as a single string. Empty string if not found."
}

Rules:
- items MUST be a flat array of plain strings, never an object or nested structure
- Include every single item listed regardless of category — flatten all categories into one list
- If items are listed under headers like 'Shelter', 'Food', etc., still include all of them in the flat array
- Capture the 'as of' date/time in the hours field if no other hours are given`
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
